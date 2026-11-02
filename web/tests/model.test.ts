import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import {
  buildDesign,
  defaults,
  validateMesh,
  statuses,
  type Base,
} from "../src/model.ts";
import { export3mf } from "../src/export.ts";
const base: Base = JSON.parse(
  readFileSync(new URL("../public/assets/base.json", import.meta.url), "utf8"),
);
const raw = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const font = opentype.parse(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
);
const evidence = new URL("../../studio/evidence/", import.meta.url);
mkdirSync(evidence, { recursive: true });
for (const name of [
  "Amy",
  "Nagikokoro",
  "A Very Long English Display Name",
  "小凪心",
  "ナギココロ",
  "Nagi_心こんにちは",
])
  test(`closed printable text: ${name}`, () => {
    const d = buildDesign({ ...defaults, displayName: name }, base, font);
    assert.deepEqual(d.errors, []);
    assert(d.parts.find((p) => p.name === "Name"));
    for (const p of d.parts) assert(validateMesh(p).valid, p.name);
    const namePart = d.parts.find((p) => p.name === "Name")!;
    assert(Math.max(...namePart.vertices.map((v) => v[0])) <= 50.0001);
    assert(Math.min(...namePart.vertices.map((v) => v[0])) >= -22.0001);
  });
test("optional pronouns, centering, friend material isolation, independent color", () => {
  const d = buildDesign(defaults, base, font);
  assert(!d.parts.some((p) => p.name === "Pronouns"));
  const c = {
    ...defaults,
    friend: true,
    pronouns: "随意 / Any",
    dotColor: "#123456",
  };
  const custom = buildDesign(c, base, font);
  assert.deepEqual(custom.errors, []);
  assert(custom.parts.some((p) => p.name === "Pronouns"));
  assert.equal(custom.parts.find((p) => p.name === "Name")?.color, "#ffd45d");
  assert.equal(
    custom.parts.find((p) => p.name === "Status_Dot")?.color,
    "#123456",
  );
  assert.equal(
    custom.parts.find((p) => p.name === "Status_Text")?.color,
    d.parts.find((p) => p.name === "Status_Text")?.color,
  );
  const nameY = (design: typeof d) => {
    const ys = design.parts
      .find((p) => p.name === "Name")!
      .vertices.map((v) => v[1]);
    return (Math.min(...ys) + Math.max(...ys)) / 2;
  };
  assert.equal(nameY(d), 4);
  assert.equal(nameY(custom), 7);
  for (const status of Object.keys(statuses))
    assert.equal(
      buildDesign(
        { ...defaults, status: status as keyof typeof statuses },
        base,
        font,
      ).parts.find((p) => p.name === "Status_Dot")?.color,
      statuses[status as keyof typeof statuses],
    );
});
test("invalid, unsupported, too-small text never produces successful export", () => {
  for (const displayName of [
    "   ",
    "🙂",
    "abcdefghijklmnopqrstuvwxyz".repeat(4),
  ]) {
    const c = { ...defaults, displayName };
    const d = buildDesign(c, base, font);
    assert(d.errors.length);
    assert.throws(() => export3mf(d, c));
  }
  const d = buildDesign(defaults, base, font);
  d.parts[0] = { ...d.parts[0], triangles: d.parts[0].triangles.slice(1) };
  assert.throws(() => export3mf(d, defaults));
});
test("3MF package has millimeter assembly, colors, independent parts and metadata", () => {
  const d = buildDesign(defaults, base, font);
  assert.deepEqual(d.errors, []);
  const data = export3mf(d, defaults);
  const zip = unzipSync(data);
  assert(zip["[Content_Types].xml"]);
  assert(zip["_rels/.rels"]);
  const xml = strFromU8(zip["3D/3dmodel.model"]);
  assert(xml.includes('unit="millimeter"'));
  assert(xml.includes("<basematerials"));
  assert.equal(
    (xml.match(/<component objectid=/g) || []).length,
    d.parts.length,
  );
  assert.equal((xml.match(/<item /g) || []).length, 1);
  assert(!xml.includes("Pronouns"));
  assert.deepEqual(JSON.parse(strFromU8(zip["Metadata/design.json"])), {
    version: 1,
    ...defaults,
  });
  writeFileSync(new URL("nagikokoro.3mf", evidence), data);
  writeFileSync(
    new URL("mesh-validation.json", evidence),
    JSON.stringify(
      d.parts.map((p) => ({ name: p.name, ...validateMesh(p) })),
      null,
      2,
    ),
  );
  const withPronouns = {
    ...defaults,
    friend: true,
    pronouns: "They/Them",
    displayName: "小凪 Nagi",
  };
  const multi = buildDesign(withPronouns, base, font);
  writeFileSync(
    new URL("mixed-friend-pronouns.3mf", evidence),
    export3mf(multi, withPronouns),
  );
});
