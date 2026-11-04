// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
// Explicit Beta fixtures; does not overwrite historical acceptance evidence.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import { styles } from "../src/styles.ts";
import { buildDesign, defaults, type Base, type Config } from "../src/model.ts";
import { export3mf } from "../src/export.ts";
import { materialPlan } from "../src/materials.ts";
const out = new URL(
  process.env.VRC_TEST_EVIDENCE_URL ?? "../test-results/beta/samples/",
  import.meta.url,
);
mkdirSync(out, { recursive: true });
const raw = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const font = opentype.parse(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
);
const cases: { id: string; patch: Partial<Config> }[] = [
  { id: "default", patch: {} },
  { id: "friend-pronouns", patch: { friend: true, pronouns: "They/Them" } },
  { id: "chinese", patch: { displayName: "小凪心" } },
  { id: "japanese", patch: { displayName: "ナギココロ" } },
  {
    id: "mixed",
    patch: { displayName: "Nagi_心こんにちは", pronouns: "随意 / Any" },
  },
  { id: "long", patch: { displayName: "A Very Long English Display Name" } },
  {
    id: "custom-status",
    patch: {
      customStatus: "自由に / Ready",
      dotColor: "#123456",
      status: "Busy",
    },
  },
  {
    id: "cfs4-custom",
    patch: {
      friend: true,
      pronouns: "He/Him",
      filamentColors: ["#16171b", "#eeeeee", "#ffce40", "#51b44b"],
      materialSlots: {
        Avatar_Back: 0,
        Avatar_Frame: 1,
        Name: 2,
        Pronouns: 1,
        Status_Text: 1,
        Status_Dot: 3,
      },
    },
  },
  {
    id: "visual",
    patch: { printMode: "visual", friend: true, pronouns: "She/Her" },
  },
];
const results = [];
for (const style of styles) {
  const base: Base = JSON.parse(
    readFileSync(
      new URL("../public/assets/" + style.baseFile, import.meta.url),
      "utf8",
    ),
  );
  for (const sample of cases) {
    const config = { ...defaults, ...sample.patch, styleId: style.id };
    const design = buildDesign(config, base, font);
    assert.deepEqual(design.errors, [], style.id + "/" + sample.id);
    const bytes = export3mf(design, config),
      zip = unzipSync(bytes),
      plan = materialPlan(config, design.parts);
    const meta = JSON.parse(strFromU8(zip["Metadata/design.json"]));
    assert.equal(meta.styleId, style.id);
    const xml = strFromU8(zip["3D/3dmodel.model"]);
    // Every preview vertex and index is the actual exported geometry, after the documented rounding.
    const meshes = [
      ...xml.matchAll(
        /<object [^>]*name="([^"]+)"[^>]*><mesh>(.*?)<\/mesh><\/object>/g,
      ),
    ];
    assert.equal(meshes.length, design.parts.length);
    for (const [i, m] of meshes.entries()) {
      const p = design.parts[i];
      assert.equal(m[1], p.name);
      const v = [
        ...m[2].matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g),
      ].map((x) => x.slice(1).map(Number));
      assert.deepEqual(
        v,
        p.vertices.map((row) => row.map((n) => Number(n.toFixed(6)))),
      );
      const t = [
        ...m[2].matchAll(
          /<triangle v1="([^"]+)" v2="([^"]+)" v3="([^"]+)"\/>/g,
        ),
      ].map((x) => x.slice(1).map(Number));
      assert.deepEqual(t, p.triangles);
    }
    if (config.printMode === "cfs4") assert.equal(plan.palette.length, 4);
    writeFileSync(new URL(`${style.id}-${sample.id}.3mf`, out), bytes);
    if (sample.id === "default")
      writeFileSync(
        new URL(`${style.id}-default-design.json`, out),
        JSON.stringify(design),
      );
    results.push({
      styleId: style.id,
      case: sample.id,
      status: "PASS",
      config,
      parts: design.parts.map((p) => p.name),
      palette: plan.palette,
      warnings: design.warnings,
      strokeScreening: design.strokeScreening,
      previewExportGeometry: "identical after 6-decimal rounding",
    });
  }
}
writeFileSync(
  new URL("../matrix.json", out),
  JSON.stringify(
    { results, total: results.length, pass: results.length },
    null,
    2,
  ),
);
console.log(
  `${results.length}/${results.length} Beta fixtures passed; files created locally.`,
);
