import { test } from "node:test";
import assert from "node:assert/strict";
import { planPhotoPages, buildPhotoPdf, toPdfPoints } from "../src/photo-pdf";
const layout = {radiusMm:19.04,dotOffsetXmm:26.4,dotOffsetYmm:-6.72,dotRadiusMm:2.4};
const jpeg = Uint8Array.from([255,216,255,217]);
const image = {imageJpeg:jpeg,imageWidth:1,imageHeight:1};
test("single image repeats or centers, while batches paginate without losing images", () => {
 const single=planPhotoPages("4r",layout,100,"single",1); assert.equal(single[0].positions[0].xMm,50.8); assert.equal(single[0].positions[0].yMm,76.2);
 assert.equal(planPhotoPages("4r",layout,100,"multiple",1)[0].positions.length,6);
 const pages=planPhotoPages("4r",layout,100,"multiple",8); assert.deepEqual(pages.map(p=>p.positions.length),[6,2]);
 assert.deepEqual(pages.flatMap(p=>p.imageIndices),[0,1,2,3,4,5,6,7]);
 assert.equal(pages[1].positions[0].yMm,76.2); assert(Math.abs((pages[1].positions[0].xMm+pages[1].positions[1].xMm)/2-50.8)<1e-9);
 assert.equal(planPhotoPages("4r",layout,100,"single",8).length,8);
});
test("batch PDF has all image resources and actual page sizes", () => {
 const pdf=buildPhotoPdf({paperId:"4r",styleName:"Classic",planarPercent:100,mode:"multiple",layout,...image,images:Array.from({length:8},()=>image)});
 const text=new TextDecoder().decode(pdf); assert.match(text,/\/Count 2/); assert.equal((text.match(/\/Subtype \/Image/g)||[]).length,8); assert.equal((text.match(/\/Im\d+ Do/g)||[]).length,8);
 for(let i=1;i<=8;i++) assert(text.includes(`/Im${i} Do`));
 const dims=[...text.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g)]; assert.equal(dims.length,2); for(const m of dims) { assert(Math.abs(Number(m[1])-toPdfPoints(101.6))<1e-5); assert(Math.abs(Number(m[2])-toPdfPoints(152.4))<1e-5); }
});
