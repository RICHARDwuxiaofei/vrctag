// SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import { buildDesign, defaults, statusText, type Base } from "../src/model.ts";
import { export3mf } from "../src/export.ts";
import { materialPlan } from "../src/materials.ts";
import { parseConfig, configDocument } from "../src/config.ts";
import { languages, statusLabels, type Language } from "../src/i18n.ts";
import { createEngine, type StudioResponse } from "../src/engine.ts";
const raw = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const font = opentype.parse(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
);
const bases = new Map(
  ["classic", "native"].map((id) => [
    id,
    JSON.parse(
      readFileSync(
        new URL(`../public/assets/styles/${id}/base.json`, import.meta.url),
        "utf8",
      ),
    ) as Base,
  ]),
);
for (const styleId of ["classic", "native"])
  test(`${styleId}: actual white core, .6mm face, shared contact and exported four-slot references`, () => {
    const config = { ...defaults, styleId };
    const d = buildDesign(config, bases.get(styleId)!, font);
    assert.deepEqual(d.errors, []);
    const range = (name: string) => {
      const vs = d.parts.find((p) => p.name === name)!.vertices;
      return [
        Math.min(...vs.map((v) => v[2])),
        Math.max(...vs.map((v) => v[2])),
      ];
    };
    const core = range("Plate_Core"),
      skin = range("Plate_Body");
    assert.equal(core[0], 0);
    assert(Math.abs(core[1] - skin[0]) < 1e-6);
    assert(Math.abs(skin[1] - skin[0] - 0.6) < 1e-6);
    const plan = materialPlan(config, d.parts);
    assert.equal(plan.parts.find((p) => p.name === "Plate_Core")!.slot, 1);
    assert.equal(plan.parts.find((p) => p.name === "Plate_Body")!.slot, 0);
    assert.equal(plan.palette.length, 4);
    const z = unzipSync(export3mf(d, config));
    const xml = strFromU8(z["3D/3dmodel.model"]);
    assert(xml.includes('name="Plate_Core" pid="1" pindex="1"'));
    assert(xml.includes('name="Plate_Body" pid="1" pindex="0"'));
    for (const bad of ["missing-core", "missing-skin", "gap", "overlap"]) {
      const copy = structuredClone(d);
      if (bad.startsWith("missing"))
        copy.parts = copy.parts.filter(
          (p) =>
            p.name !== (bad === "missing-core" ? "Plate_Core" : "Plate_Body"),
        );
      else
        copy.parts
          .find((p) => p.name === "Plate_Body")!
          .vertices.forEach((v) => (v[2] += bad === "gap" ? 0.1 : -0.1));
      assert.throws(() => export3mf(copy, config), bad);
    }
  });
test("Classic single border and hook switch change real export; status left edge aligns with name", () => {
  const base = bases.get("classic")!;
  assert(!base.parts.some((p) => p.name === "Avatar_Frame"));
  assert(base.parts.some((p) => p.name === "Plate_Rim"));
  const on = buildDesign({ ...defaults, hangingLoop: true }, base, font),
    off = buildDesign({ ...defaults, hangingLoop: false }, base, font);
  assert.equal(on.parts.length - off.parts.length, 1);
  assert(off.parts.every((p) => p.name !== "Hanging_Loop"));
  const zip = unzipSync(export3mf(off, { ...defaults, hangingLoop: false }));
  assert(!strFromU8(zip["3D/3dmodel.model"]).includes("Hanging_Loop"));
  const dot = on.parts.find((p) => p.name === "Status_Dot")!;
  const left = Math.min(...dot.vertices.map((v) => v[0]));
  assert(Math.abs(left - base.layout.textLeft) < 1e-6);
  assert(
    base.layout.statusTextLeft! > Math.max(...dot.vertices.map((v) => v[0])),
  );
  const body = base.parts.find((p) => p.name === "Plate_Body")!;
  const maxX = Math.max(...body.vertices.map((v) => v[0]));
  assert(
    body.vertices.some(
      ([x, y]) => Math.abs(x - maxX) < 1e-6 && Math.abs(y) < 1e-6,
    ),
    "rightmost point is at center of the full semicircle",
  );
});
test("all four languages produce real preset glyph meshes and preserve custom text", () => {
  for (const styleId of ["classic", "native"])
    for (const language of Object.keys(languages) as Language[])
      for (const status of Object.keys(
        statusLabels[language],
      ) as (typeof defaults.status)[]) {
        const c = {
          ...defaults,
          styleId,
          language,
          status,
          statusMode: "preset" as const,
        };
        assert.equal(statusText(c), statusLabels[language][status]);
        const d = buildDesign(c, bases.get(styleId)!, font);
        assert.deepEqual(d.errors, [], `${language}/${status}`);
        assert(d.parts.some((p) => p.name === "Status_Text"));
        assert(
          export3mf(d, c).length > 0,
          `${language}/${status}: actual rounded export`,
        );
      }
  assert.equal(
    statusText({
      ...defaults,
      language: "en",
      statusMode: "custom",
      customStatus: "无聊 / Sleep",
    }),
    "无聊 / Sleep",
  );
});
test("JSON restores hook, language, preset/custom mode and legacy custom text without conversion", () => {
  const c = {
    ...defaults,
    language: "ko" as const,
    statusMode: "preset" as const,
    hangingLoop: false,
    materialSlots: { Plate_Core: 1, Hanging_Loop: 1 },
  };
  assert.deepEqual(parseConfig(configDocument(c)), c);
  assert.equal(
    statusText(parseConfig({ displayName: "Old", customStatus: "sleep" })),
    "sleep",
  );
  assert.throws(() => parseConfig({ ...c, language: "bogus" }));
  assert.throws(() => parseConfig({ ...c, hangingLoop: "false" }));
});
test("worker loads the actual localized status glyphs and exports the same selection", async () => {
  const results: StudioResponse[] = [];
  let requested = "";
  const c = {
    ...defaults,
    statusMode: "preset" as const,
    language: "ko" as const,
    status: "Ask Me" as const,
  };
  const engine = createEngine({
    loadBase: async () => bases.get("classic")!,
    loadFont: async (text) => {
      requested = text;
      return font;
    },
    post: (r) => results.push(r),
    yieldToInput: async () => {},
  });
  engine.submit({ id: 1, type: "export", config: c });
  await engine.whenIdle();
  assert(requested.includes("참가 요청 필요"));
  assert(results[0].data);
  assert(!results[0].error);
});
