// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { styles } from "../src/styles.ts";
import { buildDesign, defaults, type Base } from "../src/model.ts";
import { export3mf } from "../src/export.ts";

const fontBytes = readFileSync(new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url));
const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));
const close = (actual: number, expected: number, tol=0.0001) =>
  assert(Math.abs(actual - expected) < tol, `${actual} != ${expected}`);
const mmBounds = (part: {vertices: number[][]}) => {
  const z=part.vertices.map(v=>v[2]); return [Math.min(...z),Math.max(...z)];
};

for(const style of styles) {
  test(`${style.id}: 0.6 mm real text and status-dot relief, full dimensions and 3MF export`, () => {
    const base: Base = JSON.parse(readFileSync(new URL(`../public/assets/styles/${style.id}/base.json`, import.meta.url), "utf8"));
    const expectedTop=style.id==="classic"?3.2:3.9;
    close(style.layout.relief,0.6);
    close(base.layout.relief,0.6);
    close(style.geometry.dotTop - style.geometry.bodyTop,0.6);
    close(style.layout.size[2],expectedTop);
    close(base.layout.size[2],expectedTop);
    const dot=base.parts.find(p=>p.name==="Status_Dot");
    assert(dot,"dot mesh missing");
    const [bottom,top]=mmBounds(dot);
    close(bottom,style.geometry.bodyTop);
    close(top,expectedTop);
    close(top-bottom,0.6);
    const config={...defaults,styleId:style.id,pronouns:"They/Them",hideStatus:false};
    const design=buildDesign(config,base,font);
    assert.deepEqual(design.errors,[]);
    for(const name of ["Name","Pronouns","Status_Text"]) {
      const part=design.parts.find(p=>p.name===name);
      assert(part,`missing ${name}`);
      const [zMin,zMax]=mmBounds(part);
      close(zMin,base.layout.textZ);
      close(zMax,expectedTop);
      close(zMax-zMin,0.6);
    }
    close(design.size![2],expectedTop);
    for(const target of ["core"] as const) {
      const zip=unzipSync(export3mf(design,config,target));
      const xml=strFromU8(zip["3D/3dmodel.model"]);
      assert(xml.includes('unit="millimeter"'));
      const zValues=[...xml.matchAll(/<vertex x="[^"]+" y="[^"]+" z="([^"]+)"\s*\/>/g)].map(m=>Number(m[1]));
      assert(zValues.length>0);
      close(Math.max(...zValues),expectedTop);
    }
  });
  test(`${style.id}: packaged GLB dot geometry matches the new height`,async()=>{
    const b=readFileSync(new URL(`../public/assets/styles/${style.id}/base.glb`,import.meta.url));
    const glb=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),"");
    const expected=style.id==="classic"?3.2:3.9;
    const dot=glb.scene.getObjectByName("Status_Dot");
    assert(dot,"GLB dot missing");
    const box=new THREE.Box3().setFromObject(dot);
    close(box.getSize(new THREE.Vector3()).y*1000,0.6);
    close(new THREE.Box3().setFromObject(glb.scene).getSize(new THREE.Vector3()).y*1000,expected);
  });
}
