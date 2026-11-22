// SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import { getStyle } from "../src/styles.ts";
import { buildDesign, defaults, validateMesh, type Base } from "../src/model.ts";
import { export3mf } from "../src/export.ts";

const style = getStyle("native");
const base: Base = JSON.parse(readFileSync(new URL("../public/assets/styles/native/base.json", import.meta.url), "utf8"));
const near = (actual: number, expected: number, tolerance = 1e-4) =>
  assert(Math.abs(actual - expected) <= tolerance, `${actual} vs ${expected}`);

test("Native has equal 32 mm end heights, parallel sides and matching bounds", () => {
  assert.equal(style.geometry.leftRadius, 16);
  assert.equal(style.geometry.rightRadius, 16);
  assert.deepEqual(style.layout.size, [96, 37.2, 3.9]);
  assert.deepEqual(base.layout.size, style.layout.size);
  const body = base.parts.find((p) => p.name === "Plate_Body")!;
  const ys = (left: boolean) =>
    body.vertices.filter((p) => left ? p[0] < -31.9 : p[0] > 31.9).map((p) => p[1]);
  near(Math.max(...ys(true)), 16);
  near(Math.min(...ys(true)), -16);
  near(Math.max(...ys(false)), 16);
  near(Math.min(...ys(false)), -16);
  const all = base.parts.flatMap((p) => p.vertices);
  const dimension = (axis: number) =>
    Math.max(...all.map((p) => p[axis])) - Math.min(...all.map((p) => p[axis]));
  [96, 37.2, 3.9].forEach((mm, axis) => near(dimension(axis), mm));
  for (const part of base.parts) assert(validateMesh(part).valid, part.name);
});

test("Native thumbnail, Blender GLB and 3MF use the corrected outline", async () => {
  const thumbnails = JSON.parse(readFileSync(new URL("../public/assets/styles/native/thumbnail.json", import.meta.url), "utf8"));
  const face = thumbnails.find((part: {name:string}) => part.name === "Plate_Body");
  assert(face && face.path.includes("48.00000"));
  const f = readFileSync(new URL("../public/assets/styles/native/base.glb", import.meta.url));
  const glb = await new GLTFLoader().parseAsync(f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength), "");
  const extent = new THREE.Box3().setFromObject(glb.scene).getSize(new THREE.Vector3());
  near(extent.x * 1000, 96);
  near(extent.y * 1000, 3.9);
  near(extent.z * 1000, 37.2);
  const fontFile = readFileSync(new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url));
  const font = opentype.parse(fontFile.buffer.slice(fontFile.byteOffset,fontFile.byteOffset+fontFile.byteLength));
  const config = {...defaults,styleId:"native"};
  const model = buildDesign(config, base, font);
  assert.deepEqual(model.errors, []);
  near(model.size![0],96);
  near(model.size![1],37.2);
  const package3mf = unzipSync(export3mf(model, config, "core"));
  const xml = strFromU8(package3mf["3D/3dmodel.model"]);
  assert(xml.includes('unit="millimeter"'));
  assert(xml.includes('x="48.000000"'));
});
