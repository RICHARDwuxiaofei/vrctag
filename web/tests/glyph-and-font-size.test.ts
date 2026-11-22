// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import opentype from "opentype.js";
import {
  buildDesign,
  defaults,
  validateMesh,
  type Base,
  type Config,
  type Part,
  type Vec3,
} from "../src/model.ts";
import { styles } from "../src/styles.ts";
import { export3mf } from "../src/export.ts";
import { parseConfig, configDocument } from "../src/config.ts";

const fontBytes = readFileSync(
  new URL("../public/assets/NotoSansCJKsc-Bold.otf", import.meta.url),
);
const font = opentype.parse(
  fontBytes.buffer.slice(
    fontBytes.byteOffset,
    fontBytes.byteOffset + fontBytes.byteLength,
  ),
);

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

const customerNames = [
  "Ezyooooo",
  "ShADe_sITz9",
  "Flacarroll8701",
  "Haruka24",
  "AwA_Kawaragi",
  "Glinshming",
  "Ankahiro",
  "Hevia",
  "ANSEL123",
];

function measureRawTextWidth(text: string): number {
  let x = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const ch of text.normalize("NFC")) {
    const g = font.charToGlyph(ch);
    const p = g.getPath(x, 0, 100);
    for (const cmd of p.commands as Array<{ x?: number }>) {
      if (cmd.x !== undefined) {
        minX = Math.min(minX, cmd.x);
        maxX = Math.max(maxX, cmd.x);
      }
    }
    x += ((g.advanceWidth ?? 1000) / font.unitsPerEm) * 100 + 2;
  }
  return maxX - minX;
}

function measureGlyphRawBounds(char: string) {
  const p = font.charToGlyph(char).getPath(0, 0, 100);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const cmd of p.commands as Array<{ x?: number; y?: number }>) {
    if (cmd.x !== undefined) {
      minX = Math.min(minX, cmd.x);
      maxX = Math.max(maxX, cmd.x);
    }
    if (cmd.y !== undefined) {
      minY = Math.min(minY, -cmd.y);
      maxY = Math.max(maxY, -cmd.y);
    }
  }
  return { minX, maxX, minY, maxY };
}

function topCapTriangles(part: Part, topZ: number): Vec3[][] {
  return part.triangles
    .filter((tri) =>
      tri.every((idx) => Math.abs(part.vertices[idx][2] - topZ) < 1e-4),
    )
    .map((tri) => tri.map((idx) => part.vertices[idx]));
}

function pointInTriangle2D(x: number, y: number, tri: Vec3[]): boolean {
  const cross = tri.map((a, i) => {
    const b = tri[(i + 1) % 3];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
  });
  return (
    cross.every((v) => v >= -1e-5) || cross.every((v) => v <= 1e-5)
  );
}

function assertSupportedOnPlate(part: Part, base: Base) {
  const body = base.parts.find((p) => p.name === "Plate_Body")!;
  const supportTris = topCapTriangles(body, base.layout.textZ);
  for (const [x, y] of part.vertices) {
    assert(
      supportTris.some((tri) => pointInTriangle2D(x, y, tri)),
      `${part.name} vertex (${x.toFixed(2)}, ${y.toFixed(2)}) must stay within Plate_Body support`,
    );
  }
}

function assertBandsDisjoint(parts: Part[]) {
  const bounds = (p: Part, axis: 0 | 1) => [
    Math.min(...p.vertices.map((v) => v[axis])),
    Math.max(...p.vertices.map((v) => v[axis])),
  ];
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const separated = ([0, 1] as const).some((axis) => {
        const a = bounds(parts[i], axis);
        const b = bounds(parts[j], axis);
        return a[1] < b[0] - 1e-6 || b[1] < a[0] - 1e-6;
      });
      assert(
        separated,
        `${parts[i].name} and ${parts[j].name} must remain disjoint`,
      );
    }
  }
}

for (const style of styles) {
  const base = bases.get(style.id)!;

  test(`${style.id}: "电" preserves its lower-right hook hole and exports cleanly`, () => {
    const config: Config = { ...defaults, styleId: style.id, displayName: "电" };
    const design = buildDesign(config, base, font);
    assert.deepEqual(design.errors, []);
    for (const part of design.parts) {
      assert(validateMesh(part).valid, part.name);
    }

    const namePart = design.parts.find((p) => p.name === "Name")!;
    const raw = measureGlyphRawBounds("电");
    const xs = namePart.vertices.map((v) => v[0]);
    const ys = namePart.vertices.map((v) => v[1]);
    const finalMinX = Math.min(...xs);
    const finalMinY = Math.min(...ys);
    const finalMaxY = Math.max(...ys);
    const scale = (finalMaxY - finalMinY) / (raw.maxY - raw.minY);
    const topZ = base.layout.textZ + base.layout.relief;
    const caps = topCapTriangles(namePart, topZ);

    // Center of the lower-right 乚 hook cavity in raw Noto coordinates: (70, 10).
    const holeX = finalMinX + (70 - raw.minX) * scale;
    const holeY = finalMinY + (10 - raw.minY) * scale;
    assert(
      !caps.some((tri) => pointInTriangle2D(holeX, holeY, tri)),
      'Lower-right hook cavity of "电" must remain hollow (not solid)',
    );

    // Confirm a point on the solid hook base (70, -2) is covered by a top cap triangle.
    const solidX = finalMinX + (70 - raw.minX) * scale;
    const solidY = finalMinY + (-2 - raw.minY) * scale;
    assert(
      caps.some((tri) => pointInTriangle2D(solidX, solidY, tri)),
      'Bottom stroke of "电" hook must still be solid',
    );

    for (const target of ["core", "bambu"] as const) {
      assert(export3mf(design, config, target).length > 0);
    }
  });
}

test('affected CJK and symbol glyphs ("回" nested islands, "明", "面", "ぬ", etc.) stay manifold', () => {
  const classicBase = bases.get("classic")!;
  const trickyChars = [
    "回",
    "国",
    "明",
    "高",
    "面",
    "脑",
    "龟",
    "离",
    "ぬ",
    "☜",
    "♤",
    "◌",
    "〞",
  ];
  for (const ch of trickyChars) {
    const config: Config = { ...defaults, styleId: "classic", displayName: ch };
    const design = buildDesign(config, classicBase, font);
    assert.deepEqual(design.errors, [], `char: ${ch}`);
    for (const part of design.parts) {
      assert(validateMesh(part).valid, `${ch} / ${part.name}`);
    }
    assert(export3mf(design, config, "core").length > 0);
  }

  // Verify "回" has 4 distinct solid wall crossings along its horizontal midline:
  // outer-left, inner-left, inner-right, outer-right.
  const hui = buildDesign(
    { ...defaults, styleId: "classic", displayName: "回" },
    classicBase,
    font,
  );
  const huiName = hui.parts.find((p) => p.name === "Name")!;
  const ys = huiName.vertices.map((v) => v[1]);
  const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const topZ = classicBase.layout.textZ + classicBase.layout.relief;
  const caps = topCapTriangles(huiName, topZ);
  const xs = huiName.vertices.map((v) => v[0]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  let segments = 0;
  let inside = false;
  for (let i = 0; i <= 200; i++) {
    const x = minX + ((maxX - minX) * i) / 200;
    const hit = caps.some((tri) => pointInTriangle2D(x, midY, tri));
    if (hit && !inside) segments++;
    inside = hit;
  }
  assert.equal(segments, 4, '"回" midline must cross 4 solid walls (2 nested rings)');
});

test("Classic uniform name font sizing unifies batch scale, adds 4 mm margin, and respects x-height", () => {
  const classicBase = bases.get("classic")!;
  const defaultDesign = buildDesign(
    { ...defaults, styleId: "classic", displayName: "Nagikokoro" },
    classicBase,
    font,
  );
  assert.equal(defaultDesign.nameFontClamped, false);
  assert(
    Math.abs(defaultDesign.textHeights.Name - 8.4) < 0.01,
    `Expected default Nagikokoro height ~8.40 mm, got ${defaultDesign.textHeights.Name}`,
  );
  const baselineScale =
    (() => {
      const xs = defaultDesign.parts
        .find((p) => p.name === "Name")!
        .vertices.map((v) => v[0]);
      return (Math.max(...xs) - Math.min(...xs)) / measureRawTextWidth("Nagikokoro");
    })();

  const expectedMaxRightX =
    classicBase.layout.textLeft + classicBase.layout.textWidth - 3.2;
  const unclampedCustomerNames = [
    "Ezyooooo",
    "ShADe_sITz9",
    "Haruka24",
    "Glinshming",
    "Ankahiro",
    "Hevia",
    "ANSEL123",
  ];
  for (const name of unclampedCustomerNames) {
    const d = buildDesign(
      { ...defaults, styleId: "classic", displayName: name },
      classicBase,
      font,
    );
    assert.deepEqual(d.errors, [], name);
    assert.equal(d.nameFontClamped, false, name);
    const xs = d.parts
      .find((p) => p.name === "Name")!
      .vertices.map((v) => v[0]);
    const finalW = Math.max(...xs) - Math.min(...xs);
    const scale = finalW / measureRawTextWidth(name);
    assert(
      Math.abs(scale - baselineScale) < 1e-4,
      `${name} scale ${scale} != baseline ${baselineScale}`,
    );
    assert(
      Math.max(...xs) <= expectedMaxRightX + 0.001,
      `${name} maxX ${Math.max(...xs)} exceeded ${expectedMaxRightX}`,
    );
  }

  for (const longName of ["Flacarroll8701", "AwA_Kawaragi"]) {
    const d = buildDesign(
      { ...defaults, styleId: "classic", displayName: longName },
      classicBase,
      font,
    );
    assert.deepEqual(d.errors, [], longName);
    assert.equal(d.nameFontClamped, true, longName);
    const part = d.parts.find((p) => p.name === "Name")!;
    assert(validateMesh(part).valid, longName);
    const maxX = Math.max(...part.vertices.map((v) => v[0]));
    assert(
      Math.abs(maxX - expectedMaxRightX) < 0.01,
      `${longName} maxX=${maxX} expected ~${expectedMaxRightX}`,
    );
  }

  const lower = buildDesign(
    { ...defaults, styleId: "classic", displayName: "ooo" },
    classicBase,
    font,
  );
  assert.deepEqual(lower.errors, []);
  assert(
    lower.textHeights.Name > 4.0 && lower.textHeights.Name < 5.5,
    `Expected lowercase "ooo" to stay at x-height (~4.69 mm), got ${lower.textHeights.Name}`,
  );
});

test("nameFontScale=85% unifies all 9 customer names and 50–150% stays safely supported & disjoint", () => {
  const classicBase = bases.get("classic")!;
  let expectedScale: number | undefined;
  for (const name of customerNames) {
    const d = buildDesign(
      { ...defaults, styleId: "classic", displayName: name, nameFontScale: 85 },
      classicBase,
      font,
    );
    assert.deepEqual(d.errors, [], name);
    assert.equal(d.nameFontClamped, false, `${name} should not clamp at 85%`);
    const xs = d.parts
      .find((p) => p.name === "Name")!
      .vertices.map((v) => v[0]);
    const scale = (Math.max(...xs) - Math.min(...xs)) / measureRawTextWidth(name);
    if (expectedScale === undefined) expectedScale = scale;
    assert(
      Math.abs(scale - expectedScale) < 1e-4,
      `${name} scale ${scale} != ${expectedScale}`,
    );
  }

  for (const style of styles) {
    const base = bases.get(style.id)!;
    for (const scalePct of [50, 85, 100, 130, 150]) {
      for (const patch of [
        { pronouns: "", hideStatus: false },
        { pronouns: "They/Them", hideStatus: false },
        { pronouns: "They/Them", hideStatus: true },
        { pronouns: "", hideStatus: true },
      ]) {
        const config: Config = {
          ...defaults,
          styleId: style.id,
          displayName: "Nagikokoro",
          nameFontScale: scalePct,
          ...patch,
        };
        const d = buildDesign(config, base, font);
        assert.deepEqual(d.errors, [], `${style.id} ${scalePct}%`);
        const namePart = d.parts.find((p) => p.name === "Name")!;
        assertSupportedOnPlate(namePart, base);
        const collisionParts = d.parts.filter((p) =>
          ["Name", "Pronouns", "Status_Text", "Status_Dot"].includes(p.name),
        );
        assertBandsDisjoint(collisionParts);
        for (const p of d.parts) assert(validateMesh(p).valid, p.name);
        if (scalePct === 150) {
          for (const target of ["core", "bambu"] as const) {
            assert(export3mf(d, config, target).length > 0);
          }
        }
      }
    }
  }
});

test("config serialization round-trips nameFontScale and rejects out-of-range values", () => {
  const stored = configDocument({ ...defaults, nameFontScale: 85 });
  assert.equal(stored.nameFontScale, 85);
  assert.equal(parseConfig(stored).nameFontScale, 85);
  assert.equal(
    parseConfig(configDocument({ ...defaults, nameFontScale: 137.5 }))
      .nameFontScale,
    137.5,
  );

  for (const schemaVersion of [1, 2]) {
    const legacy = parseConfig({ schemaVersion, displayName: "Legacy" });
    assert.equal(legacy.nameFontScale, 100);
  }

  for (const bad of [49, 151, "80", NaN, Infinity, null]) {
    assert.throws(
      () => parseConfig({ ...defaults, nameFontScale: bad }),
      `Should reject nameFontScale=${String(bad)}`,
    );
  }
});
