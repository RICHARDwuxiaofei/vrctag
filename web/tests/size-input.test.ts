// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { styles } from "../src/styles.ts";
import { clampScale, percentFromMillimeters, referenceDimensions, scaledDimensions, scaleDesignGeometry } from "../src/size-scale.ts";
import type { Base, Design } from "../src/model.ts";

const near = (a: number, b: number, tol=0.00001) =>
  assert(Math.abs(a-b)<=tol, `${a} != ${b}`);

function bounds(parts: {vertices:[number,number,number][]}[]): [number,number,number] {
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const p of parts) for(const v of p.vertices) for(let i=0;i<3;i++){
    min[i]=Math.min(min[i],v[i]);max[i]=Math.max(max[i],v[i]);
  }
  return [max[0]-min[0],max[1]-min[1],max[2]-min[2]];
}

for(const style of styles) {
  const base=JSON.parse(readFileSync(new URL("../public/assets/"+style.baseFile,import.meta.url),"utf8")) as Base;
  for(const loop of [true,false]) {
    test(`${style.id}: editable mm ↔ percentages, XY lock and Z independence (hook ${loop})`,()=>{
      const reference=referenceDimensions(style,loop);
      const parts=base.parts.filter(p=>loop||p.name!=="Hanging_Loop");
      const modelBounds=bounds(parts);
      reference.forEach((v,i)=>near(modelBounds[i],v,0.00001));
      // Type a length to 0.01 mm precision: width must follow the same ratio.
      const desiredLength=Number((reference[0]*0.735).toFixed(2));
      const planarScale=percentFromMillimeters(desiredLength,reference[0]);
      const unchangedZ=scaledDimensions(reference,{planarScale,thicknessScale:100});
      near(unchangedZ[0],desiredLength);
      near(unchangedZ[1]/unchangedZ[0],reference[1]/reference[0],0.0000001);
      near(unchangedZ[2],reference[2]);
      // Likewise, typing width changes length and never changes thickness.
      const desiredWidth=Number((reference[1]*1.235).toFixed(2));
      const planarFromWidth=percentFromMillimeters(desiredWidth,reference[1]);
      const byWidth=scaledDimensions(reference,{planarScale:planarFromWidth,thicknessScale:100});
      near(byWidth[1],desiredWidth);
      near(byWidth[0]/byWidth[1],reference[0]/reference[1],0.0000001);
      near(byWidth[2],reference[2]);
      // Typing thickness changes only Z; the 0.6mm embossed dot follows Z scaling.
      const desiredThickness=Number((reference[2]*0.875).toFixed(2));
      const thicknessScale=percentFromMillimeters(desiredThickness,reference[2]);
      const byThickness=scaledDimensions(reference,{planarScale:100,thicknessScale});
      near(byThickness[2],desiredThickness);
      near(byThickness[0],reference[0]);
      near(byThickness[1],reference[1]);
      const design: Design={
        styleId:style.id,parts:parts.map(p=>({...p})),previewAvatar:base.previewAvatar,
        size:reference,errors:[],warnings:[],textHeights:{},
      };
      const scaled=scaleDesignGeometry(design,{planarScale,thicknessScale});
      const measured=bounds(scaled.parts);
      const expected=scaledDimensions(reference,{planarScale,thicknessScale});
      expected.forEach((v,i)=>near(measured[i],v,0.00001));
      const dot=scaled.parts.find(p=>p.name==="Status_Dot")!;
      const z=dot.vertices.map(v=>v[2]);
      near(Math.max(...z)-Math.min(...z),0.6*thicknessScale/100);
      near(base.layout.size[2],style.layout.size[2]);
    });
  }
}
test("percent clamping and numeric validity",()=>{
  assert.equal(clampScale(49),50);
  assert.equal(clampScale(151),150);
  assert.equal(clampScale(75.123456789),75.123457);
  assert.throws(()=>clampScale(Infinity));
  assert.throws(()=>percentFromMillimeters(10,0));
  assert.equal(percentFromMillimeters(1,100),50);
  assert.equal(percentFromMillimeters(1000,100),150);
});
