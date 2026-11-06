// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import { styles } from "../src/styles.ts";
import { buildDesign, defaults, validateMesh, type Base } from "../src/model.ts";
import { export3mf } from "../src/export.ts";
import { parseConfig, configDocument } from "../src/config.ts";
import { scaleDesignGeometry, scaledDimensions } from "../src/size-scale.ts";

const source = readFileSync(new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url));
const font = opentype.parse(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength));
const near = (actual: number, expected: number, epsilon = 0.00001) =>
  assert(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
type Vertices = { vertices: [number, number, number][] };
function bounds(parts: Vertices[]): [number, number, number] {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) for (const v of part.vertices) for (let i = 0; i < 3; i++) {
    lo[i] = Math.min(lo[i], v[i]);
    hi[i] = Math.max(hi[i], v[i]);
  }
  return [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
}

test("size values persist through JSON and old configs default to 100%", () => {
  const stored = configDocument({ ...defaults, styleId: "native", planarScale: 75, thicknessScale: 125 });
  const restored = parseConfig(stored);
  assert.equal(restored.planarScale, 75);
  assert.equal(restored.thicknessScale, 125);
  assert.equal(restored.styleId, "native");
  for (const schemaVersion of [1, 2]) {
    const old = parseConfig({ schemaVersion, displayName: "Legacy" });
    assert.equal(old.planarScale, 100);
    assert.equal(old.thicknessScale, 100);
  }
  for (const key of ["planarScale", "thicknessScale"]) {
    for (const val of [49, 151, 75.5, "75", null, NaN, Infinity, -1]) {
      assert.throws(() => parseConfig({ ...defaults, [key]: val }), `${key}: ${val}`);
    }
  }
  assert.deepEqual(scaledDimensions([134, 52, 3], { planarScale: 50, thicknessScale: 150 }), [67, 26, 4.5]);
});

for (const style of styles) {
  const base = JSON.parse(readFileSync(new URL("../public/assets/" + style.baseFile, import.meta.url), "utf8")) as Base;
  test(`${style.id}: real scaled mesh and both 3MF formats stay in millimeters`, () => {
    const unchangedSource = JSON.stringify(base.parts);
    const original = buildDesign({ ...defaults, styleId: style.id }, base, font);
    assert.deepEqual(original.errors, []);
    const nominal = bounds(original.parts);
    const names = original.parts.map((p) => p.name);
    for (const [planarScale, thicknessScale] of [[50, 50], [50, 150], [150, 50], [150, 150]] as const) {
      const config = { ...defaults, styleId: style.id, planarScale, thicknessScale };
      const design = buildDesign(config, base, font);
      assert.deepEqual(design.errors, [], `${style.id} ${planarScale}/${thicknessScale}`);
      assert.deepEqual(design.parts.map((p) => p.name), names);
      const expected = scaledDimensions(nominal, config);
      const measured = bounds(design.parts);
      expected.forEach((n, i) => near(measured[i], n));
      expected.forEach((n, i) => near(design.size![i], n));
      for (const p of design.parts) assert(validateMesh(p).valid, p.name);
      assert.equal(design.parts.find((p) => p.name === "Plate_Body")?.color, original.parts.find((p) => p.name === "Plate_Body")?.color);
      for (const target of ["core", "bambu"] as const) {
        const zip = unzipSync(export3mf(design, config, target));
        const xml = strFromU8(zip["3D/3dmodel.model"]);
        assert(xml.includes('unit="millimeter"'));
        const vertices = [...xml.matchAll(/<vertex x="([-\d.]+)" y="([-\d.]+)" z="([-\d.]+)"\/>/g)].map((match) => [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number]);
        assert(vertices.length > 0);
        const actual = bounds([{ vertices }]);
        expected.forEach((n, i) => near(actual[i], n, 0.00003));
        const metadata = JSON.parse(strFromU8(zip["Metadata/design.json"]));
        assert.equal(metadata.planarScale, planarScale);
        assert.equal(metadata.thicknessScale, thicknessScale);
      }
    }
    assert.equal(JSON.stringify(base.parts), unchangedSource);
  });
  test(`${style.id}: avatar overlay scales and source meshes are not mutated`, () => {
    const original = buildDesign({ ...defaults, styleId: style.id }, base, font);
    const scaled = scaleDesignGeometry(original, { planarScale: 50, thicknessScale: 150 });
    assert.notStrictEqual(scaled.parts, original.parts);
    assert.deepEqual(scaled.errors, original.errors);
    if (original.previewAvatar?.vertices.length) {
      near(scaled.previewAvatar!.vertices[0][0], original.previewAvatar.vertices[0][0] * 0.5);
      near(scaled.previewAvatar!.vertices[0][2], original.previewAvatar.vertices[0][2] * 1.5);
    }
    near(original.parts[0].vertices[0][0], base.parts.find((p) => p.name === original.parts[0].name)!.vertices[0][0]);
  });
}
