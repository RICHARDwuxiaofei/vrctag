// SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { PHOTO_PAPERS, buildPhotoPdf, photoDiameterMm, planPhotoPdf, toPdfPoints } from "../src/photo-pdf.ts";

const decoder = new TextDecoder();
const jpegHeader = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]); // structural tests only; render QA used a real JPEG
const layouts = {
  classic: { radiusMm: 19.04, dotOffsetXmm: 26.4, dotOffsetYmm: -6.72, dotRadiusMm: 2.4 },
  native: { radiusMm: 12.8, dotOffsetXmm: 10.4, dotOffsetYmm: -8, dotRadiusMm: 3.52 },
};
for (const paper of PHOTO_PAPERS) {
  for (const [style, layout] of Object.entries(layouts)) {
    for (const scale of [50, 100, 150]) {
      test(`photo PDF ${paper.id} ${style} ${scale}%: true-size MediaBox, contour and xref`, () => {
        const bytes = buildPhotoPdf({
          paperId: paper.id, styleName: style, planarPercent: scale,
          layout, imageJpeg: jpegHeader, imageWidth: 1, imageHeight: 1,
        });
        const text = decoder.decode(bytes);
        const media = text.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
        assert(media);
        assert(Math.abs(Number(media[1]) / toPdfPoints(1) - paper.widthMm) < 0.0001);
        assert(Math.abs(Number(media[2]) / toPdfPoints(1) - paper.heightMm) < 0.0001);
        assert(text.includes("20 mm calibration bar"));
        assert(text.includes("No borderless enlargement"));
        assert(text.includes(`${photoDiameterMm(layout, scale)} mm`));
        const xref = text.match(/startxref\n(\d+)\n%%EOF/);
        assert(xref);
        const offset = Number(xref[1]);
        assert.equal(decoder.decode(bytes.slice(offset, offset+4)), "xref");
        assert(text.includes("/Filter /DCTDecode"));
      });
    }
  }
}
test("invalid model dimensions are rejected", () => {
  assert.throws(() => buildPhotoPdf({paperId:"a4",styleName:"Classic",planarPercent:151,
    layout:layouts.classic,imageJpeg:jpegHeader,imageWidth:1,imageHeight:1}));
});

for (const paper of PHOTO_PAPERS) {
  for (const [style, layout] of Object.entries(layouts)) {
    for (const scale of [50, 100, 150]) {
      test(`packed photo sheet ${paper.id} ${style} ${scale}% keeps every true-size image inside the page`, () => {
        const plan = planPhotoPdf(paper.id, layout, scale, "multiple");
        assert.equal(plan.positions.length, plan.rows * plan.columns);
        assert(plan.positions.length >= 1);
        const diameter = photoDiameterMm(layout, scale);
        for (const p of plan.positions) {
          assert(p.xMm - diameter / 2 >= 1.5 - 1e-6);
          assert(p.xMm + diameter / 2 <= paper.widthMm - 1.5 + 1e-6);
          assert(p.yMm - diameter / 2 >= 1.5 - 1e-6);
          assert(p.yMm + diameter / 2 <= paper.heightMm - 1.5 + 1e-6);
        }
        const bytes = buildPhotoPdf({
          paperId: paper.id, styleName: style, planarPercent: scale, mode: "multiple",
          layout, imageJpeg: jpegHeader, imageWidth: 1, imageHeight: 1,
        });
        const raw = decoder.decode(bytes);
        assert.equal((raw.match(/\/Im1 Do/g) ?? []).length, plan.positions.length);
        assert.equal((raw.match(/\/Subtype \/Image/g) ?? []).length, 1);
        const size = raw.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
        assert(size);
        assert(Math.abs(Number(size[1]) / toPdfPoints(1) - paper.widthMm) < 0.0001);
        assert(Math.abs(Number(size[2]) / toPdfPoints(1) - paper.heightMm) < 0.0001);
        if (plan.calibrationYmm === null) assert(!raw.includes("20 mm calibration bar"));
      });
    }
  }
}
test("4R default sheet exactly fits 6 Classic or 15 Native", () => {
  assert.equal(planPhotoPdf("4r", layouts.classic, 100, "multiple").positions.length, 6);
  assert.equal(planPhotoPdf("4r", layouts.native, 100, "multiple").positions.length, 15);
  assert.equal(planPhotoPdf("4r100", layouts.native, 100, "multiple").positions.length, 15);
});
test("single export remains backward compatible", () => {
  assert.equal(planPhotoPdf("4r", layouts.classic, 100).positions.length, 1);
  assert.equal(planPhotoPdf("4r", layouts.classic, 100, "single").calibrationYmm !== null, true);
});
test("unsupported print modes fail closed", () => {
  assert.throws(() => planPhotoPdf("4r", layouts.classic, 100, "unexpected" as never));
});
