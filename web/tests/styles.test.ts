import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import opentype from "opentype.js";
import { unzipSync, strFromU8 } from "fflate";
import { styles, getStyle, defaultStyleId } from "../src/styles.ts";
import { buildDesign, defaults, statuses, type Base } from "../src/model.ts";
import { export3mf } from "../src/export.ts";
import { parseConfig, configDocument } from "../src/config.ts";
import { materialPlan } from "../src/materials.ts";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
const fontFile = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const font = opentype.parse(
  fontFile.buffer.slice(
    fontFile.byteOffset,
    fontFile.byteOffset + fontFile.byteLength,
  ),
);
const out = new URL(
  "../../studio/evidence/dual-style-2026-11-03/",
  import.meta.url,
);
mkdirSync(out, { recursive: true });
const bases = new Map(
  styles.map((s) => [
    s.id,
    JSON.parse(
      readFileSync(
        new URL("../public/assets/" + s.baseFile, import.meta.url),
        "utf8",
      ),
    ) as Base,
  ]),
);
const cases = [
  { id: "default", patch: {} },
  { id: "friend-pronouns", patch: { friend: true, pronouns: "They/Them" } },
  { id: "chinese", patch: { displayName: "小凪心" } },
  { id: "japanese", patch: { displayName: "ナギココロ" } },
  {
    id: "mixed",
    patch: { displayName: "Nagi_心こんにちは", pronouns: "随意 / Any" },
  },
  { id: "long", patch: { displayName: "A Very Long English Display Name" } },
  { id: "only-name", patch: { customStatus: "" } },
  { id: "pronouns-no-status", patch: { pronouns: "He/Him", customStatus: "" } },
];
for (const style of styles) {
  const base = bases.get(style.id)!;
  test(`${style.id}: default, multilingual, long text, optional rows and serialized samples`, () => {
    assert.equal(base.styleId, style.id);
    assert.deepEqual(base.layout, style.layout);
    assert.deepEqual(base.colors, style.colors);
    for (const sample of cases) {
      const c = { ...defaults, ...sample.patch, styleId: style.id };
      const d = buildDesign(c, base, font);
      assert.deepEqual(d.errors, [], sample.id);
      for (const p of d.parts.filter((p) =>
        ["Name", "Pronouns", "Status_Text"].includes(p.name),
      )) {
        assert(
          Math.min(...p.vertices.map((v) => v[0])) >=
            base.layout.textLeft - 1e-6,
        );
        assert(
          Math.max(...p.vertices.map((v) => v[0])) <=
            base.layout.textLeft + base.layout.textWidth + 1e-6,
        );
        assert(
          Math.min(...p.vertices.map((v) => v[2])) >= base.layout.textZ - 1e-6,
        );
      }
      const texts = d.parts.filter((p) =>
        ["Name", "Pronouns", "Status_Text"].includes(p.name),
      );
      for (let i = 0; i < texts.length; i++)
        for (let j = i + 1; j < texts.length; j++) {
          const lo = (p: (typeof texts)[number]) =>
            Math.min(...p.vertices.map((v) => v[1]));
          const hi = (p: (typeof texts)[number]) =>
            Math.max(...p.vertices.map((v) => v[1]));
          assert(
            hi(texts[i]) < lo(texts[j]) || hi(texts[j]) < lo(texts[i]),
            "Text bands must remain disjoint",
          );
        }
      const data = export3mf(d, c);
      const zip = unzipSync(data);
      const meta = JSON.parse(strFromU8(zip["Metadata/design.json"]));
      assert.equal(meta.styleId, style.id);
      const plan = JSON.parse(strFromU8(zip["Metadata/printing.json"]));
      assert.equal(plan.palette.length, 4);
      assert.equal(plan.parts.length, d.parts.length);
      const xml = strFromU8(zip["3D/3dmodel.model"]);
      assert.equal((xml.match(/<item /g) || []).length, 1);
      writeFileSync(new URL(`${style.id}-${sample.id}.3mf`, out), data);
      if (["default", "friend-pronouns"].includes(sample.id))
        writeFileSync(
          new URL(`${style.id}-${sample.id}-design.json`, out),
          JSON.stringify(d),
        );
    }
  });
  test(`${style.id}: all statuses, independent custom color, immutable geometry and friend isolation`, () => {
    const initial = JSON.stringify(base.parts);
    for (const status of Object.keys(statuses) as (keyof typeof statuses)[]) {
      for (const friend of [false, true]) {
        const c = {
          ...defaults,
          styleId: style.id,
          status,
          friend,
          pronouns: "They/Them",
        };
        const d = buildDesign(c, base, font);
        assert.deepEqual(d.errors, []);
        assert.equal(
          d.parts.find((p) => p.name === "Status_Dot")!.color,
          statuses[status],
        );
        assert.equal(
          d.parts.find((p) => p.name === "Name")!.color,
          friend ? style.colors.Friend_Name : style.colors.Name,
        );
        assert.equal(
          d.parts.find((p) => p.name === "Avatar_Frame")!.color,
          style.colors.Avatar_Frame,
        );
        assert.equal(
          materialPlan(c, d.parts).palette[0],
          style.colors.Plate_Body.toUpperCase(),
        );
        writeFileSync(
          new URL(
            `${style.id}-${status.replaceAll(" ", "-")}-${friend}.3mf`,
            out,
          ),
          export3mf(d, c),
        );
      }
    }
    assert.equal(JSON.stringify(base.parts), initial);
    const c = { ...defaults, styleId: style.id, dotColor: "#123456" };
    assert.equal(
      buildDesign(c, base, font).parts.find((p) => p.name === "Status_Dot")!
        .color,
      "#123456",
    );
    for (const displayName of ["", "🙂", "W".repeat(120)])
      assert.throws(() =>
        export3mf(buildDesign({ ...c, displayName }, base, font), {
          ...c,
          displayName,
        }),
      );
  });
  test(`${style.id}: GLB real loader, original parts and physical dimensions`, async () => {
    const b = readFileSync(
      new URL(`../public/assets/styles/${style.id}/base.glb`, import.meta.url),
    );
    const gltf = await new GLTFLoader().parseAsync(
      b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
      "",
    );
    const names: string[] = [];
    gltf.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) names.push(o.name);
    });
    assert.deepEqual(names.sort(), [
      "Avatar_Back",
      "Avatar_Frame",
      "Plate_Body",
      "Status_Dot",
    ]);
    const bounds = new THREE.Box3()
      .setFromObject(gltf.scene)
      .getSize(new THREE.Vector3());
    for (const [n, v] of [
      [bounds.x, style.layout.size[0]],
      [bounds.z, style.layout.size[1]],
      [bounds.y, style.layout.size[2]],
    ])
      assert(Math.abs(n - v / 1000) < 1e-6);
  });
}
test("configuration migration, full roundtrip and style validation", () => {
  assert.equal(
    parseConfig({ displayName: "Restored" }).styleId,
    defaultStyleId,
  );
  for (const style of styles) {
    const c = {
      ...defaults,
      styleId: style.id,
      pronouns: "随意 / Any",
      friend: true,
      filamentColors: ["#123456", "#234567", "#345678", "auto"],
      materialSlots: { Avatar_Frame: 0 },
    };
    assert.deepEqual(parseConfig(configDocument(c)), c);
  }
  for (const bad of [
    { styleId: "absent" },
    { styleId: "../native" },
    { filamentColors: ["#111111"] },
    { friend: "false" },
    { status: "__proto__" },
    { materialSlots: { __bad: 1 } },
    { schemaVersion: 99 },
    { pronouns: 123 },
  ])
    assert.throws(() => parseConfig(bad));
  assert.throws(() => getStyle("bad"));
});
test("mismatched style/base and stale style/export cannot succeed", () => {
  assert.notEqual(
    styles[0].layout.avatar.radius,
    styles[1].layout.avatar.radius,
  );
  assert.notEqual(styles[0].layout.size[0], styles[1].layout.size[0]);
  const first = { ...defaults, styleId: styles[0].id };
  const second = { ...defaults, styleId: styles[1].id };
  assert.throws(() => buildDesign(first, bases.get(second.styleId)!, font));
  assert.throws(() =>
    export3mf(buildDesign(first, bases.get(first.styleId)!, font), second),
  );
});
