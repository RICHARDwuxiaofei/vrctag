// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
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
  process.env.VRC_TEST_EVIDENCE_URL ?? "../../studio/evidence/classic-large-avatar-2026-11-03/",
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
            (p.name === "Status_Text"
              ? (base.layout.statusTextLeft ?? base.layout.textLeft)
              : base.layout.textLeft) -
              1e-6,
        );
        assert(
          Math.max(...p.vertices.map((v) => v[0])) <=
            (p.name === "Status_Text"
              ? (base.layout.statusTextLeft ?? base.layout.textLeft) +
                (base.layout.statusTextWidth ?? base.layout.textWidth)
              : base.layout.textLeft + base.layout.textWidth) +
              1e-6,
        );
        assert(
          Math.min(...p.vertices.map((v) => v[2])) >= base.layout.textZ - 1e-6,
        );
      }
      // Test the actual triangulated support surface, including concave shoulders.
      const body = base.parts.find((p) => p.name === "Plate_Body")!;
      const top = body.triangles.filter((t) =>
        t.every(
          (i) => Math.abs(body.vertices[i][2] - base.layout.textZ) < 1e-5,
        ),
      );
      const supported = (x: number, y: number) =>
        top.some((t) => {
          const p = t.map((i) => body.vertices[i]);
          const cross = p.map((a, i) => {
            const b = p[(i + 1) % 3];
            return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
          });
          return (
            cross.every((v) => v >= -1e-5) || cross.every((v) => v <= 1e-5)
          );
        });
      for (const part of d.parts.filter((p) =>
        ["Name", "Pronouns", "Status_Text"].includes(p.name),
      ))
        for (const [x, y] of part.vertices)
          assert(
            supported(x, y),
            "Every text vertex must have an actual plate support triangle",
          );
      const texts = d.parts.filter((p) =>
        ["Name", "Pronouns", "Status_Text"].includes(p.name),
      );
      const dot = d.parts.find((p) => p.name === "Status_Dot")!;
      const bounds = (p: typeof dot, axis: number) => [
        Math.min(...p.vertices.map((v) => v[axis])),
        Math.max(...p.vertices.map((v) => v[axis])),
      ];
      for (const text of texts) {
        const separated = [0, 1].some((axis) => {
          const a = bounds(text, axis),
            b = bounds(dot, axis);
          return a[1] < b[0] || b[1] < a[0];
        });
        assert(
          separated,
          `${sample.id}: text must keep a clear band or lane beside the status dot`,
        );
      }
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
    assert.deepEqual(names.sort(), base.parts.map((p) => p.name).sort());
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

test("Native two-line centers match the manually calibrated 30% plate-height rhythm", () => {
  const style = getStyle("native"),
    base = bases.get(style.id)!;
  const center = (d: ReturnType<typeof buildDesign>, name: string) => {
    const y = d.parts.find((p) => p.name === name)!.vertices.map((v) => v[1]);
    return (Math.min(...y) + Math.max(...y)) / 2;
  };
  for (const patch of [
    { pronouns: "", customStatus: "无聊", row: "Status_Text" },
    { pronouns: "They/Them", customStatus: "", row: "Pronouns" },
  ]) {
    const d = buildDesign(
      { ...defaults, styleId: style.id, ...patch },
      base,
      font,
    );
    assert.deepEqual(d.errors, []);
    assert(
      Math.abs(
        (center(d, "Name") - center(d, patch.row)) / base.layout.size[1] - 0.3,
      ) < 1e-6,
    );
  }
});

test("Classic large medallion, separate white rim and status lane are genuinely different from Native", () => {
  const c = getStyle("classic"),
    n = getStyle("native"),
    b = bases.get(c.id)!;
  assert.equal(c.layout.avatar.radius, 22);
  assert.equal(n.layout.avatar.radius, 16);
  assert((c.layout.avatar.radius * 2) / c.layout.size[1] > 0.84);
  assert(b.parts.some((p) => p.name === "Plate_Rim"));
  assert(!bases.get(n.id)!.parts.some((p) => p.name === "Plate_Rim"));
  const d = buildDesign(
    { ...defaults, styleId: c.id, pronouns: "They/Them" },
    b,
    font,
  );
  assert.deepEqual(d.errors, []);
  const plan = materialPlan({ ...defaults, styleId: c.id }, d.parts);
  for (const name of ["Plate_Rim", "Avatar_Frame"])
    assert.equal(plan.parts.find((p) => p.name === name)!.color, "#E7E8EC");
  assert.equal(
    plan.parts.find((p) => p.name === "Name")!.color,
    c.colors.Name.toUpperCase(),
  );
  const status = d.parts.find((p) => p.name === "Status_Text")!;
  assert(
    Math.min(...status.vertices.map((v) => v[0])) >
      c.layout.avatar.dotCenter[0] + c.layout.avatar.dotRadius,
  );
  const restored = parseConfig({
    ...defaults,
    materialSlots: { Plate_Rim: 2 },
  });
  assert.equal(restored.materialSlots!.Plate_Rim, 2);
});
