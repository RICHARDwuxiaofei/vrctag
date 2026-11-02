import * as THREE from "three";
import type { Font } from "opentype.js";
export type Vec3 = [number, number, number];
export interface Part {
  name: string;
  vertices: Vec3[];
  triangles: Vec3[];
  color: string;
}
export interface Base {
  parts: Part[];
  layout: {
    unit: string;
    front: string;
    size: number[];
    textLeft: number;
    textWidth: number;
    textZ: number;
    relief: number;
    textRules: {
      alignment: string;
      name: {
        height: number;
        centerY: number;
        heightWithPronouns: number;
        centerYWithPronouns: number;
      };
      pronouns: { height: number; centerY: number };
      status: { height: number; centerY: number };
      minimumHeight: number;
      warningHeight: number;
      maxCharacters: number;
    };
  };
}
export const statuses = {
  Online: "#2ed319",
  "Join Me": "#00b8ff",
  "Ask Me": "#e97c03",
  Busy: "#c80928",
  Offline: "#8c939c",
};
export type Status = keyof typeof statuses;
export interface Config {
  displayName: string;
  friend: boolean;
  status: Status;
  dotColor: string;
  customStatus: string;
  pronouns: string;
}
export const defaults: Config = {
  displayName: "Nagikokoro",
  friend: false,
  status: "Online",
  dotColor: "auto",
  customStatus: "无聊",
  pronouns: "",
};
export const resolvedDot = (c: Config) =>
  c.dotColor === "auto" ? statuses[c.status] : c.dotColor;
export interface Design {
  parts: Part[];
  warnings: string[];
  errors: string[];
  textHeights: Record<string, number>;
}
export function geometry(p: Part) {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(p.vertices.flat(), 3),
  );
  g.setIndex(p.triangles.flat());
  g.computeVertexNormals();
  return g;
}
// Cap and wall faces use identical double-precision contour vertices.
function extrudeShapes(
  shapes: THREE.Shape[],
  depth: number,
  name: string,
  color: string,
): Part {
  const result: Part = { name, color, vertices: [], triangles: [] };
  const clean = (points: THREE.Vector2[]) => {
    const p = points.filter(
      (v, i) => i === 0 || v.distanceTo(points[i - 1]) > 1e-7,
    );
    if (p.length > 1 && p[0].distanceTo(p[p.length - 1]) < 1e-7) p.pop();
    let changed = true;
    while (changed && p.length > 3) {
      changed = false;
      for (let i = 0; i < p.length; i++) {
        const a = p[(i + p.length - 1) % p.length],
          b = p[i],
          c = p[(i + 1) % p.length];
        if (
          Math.abs((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) < 1e-8
        ) {
          p.splice(i, 1);
          changed = true;
          break;
        }
      }
    }
    return p;
  };
  for (const shape of shapes) {
    const data = shape.extractPoints(8);
    const outer = clean(data.shape);
    const holes = data.holes.map(clean).filter((p) => p.length >= 3);
    if (outer.length < 3) continue;
    if (THREE.ShapeUtils.isClockWise(outer)) outer.reverse();
    for (const h of holes) if (!THREE.ShapeUtils.isClockWise(h)) h.reverse();
    const loops = [outer, ...holes],
      flat = loops.flat(),
      n = flat.length,
      offset = result.vertices.length;
    result.vertices.push(
      ...flat.map((v) => [v.x, v.y, 0] as Vec3),
      ...flat.map((v) => [v.x, v.y, depth] as Vec3),
    );
    // Earcut may skip a collinear bridge vertex between aligned holes.
    // Split cap edges at every contour vertex on them, preserving a conforming mesh.
    const pending = THREE.ShapeUtils.triangulateShape(outer, holes);
    const caps: number[][] = [];
    let operations = 0;
    while (pending.length) {
      if (++operations > 200000)
        throw new Error("字形轮廓过于复杂，请更换字符");
      const t = pending.pop()!;
      let split = false;
      for (let edge = 0; edge < 3 && !split; edge++) {
        const ai = t[edge],
          bi = t[(edge + 1) % 3],
          ci = t[(edge + 2) % 3],
          a = flat[ai],
          b = flat[bi];
        const dx = b.x - a.x,
          dy = b.y - a.y,
          len = dx * dx + dy * dy;
        for (let k = 0; k < flat.length; k++) {
          if (t.includes(k)) continue;
          const p = flat[k],
            u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
          if (u <= 1e-8 || u >= 1 - 1e-8) continue;
          if (Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) < 1e-8) {
            pending.push([ai, k, ci], [k, bi, ci]);
            split = true;
            break;
          }
        }
      }
      if (!split) caps.push(t);
    }
    for (const indices of caps) {
      let [a, b, c] = indices;
      const u = flat[a],
        v = flat[b],
        w = flat[c];
      if ((v.x - u.x) * (w.y - u.y) - (v.y - u.y) * (w.x - u.x) < 0)
        [b, c] = [c, b];
      result.triangles.push(
        [offset + c, offset + b, offset + a],
        [offset + a + n, offset + b + n, offset + c + n],
      );
    }
    let start = 0;
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i++) {
        const a = offset + start + i,
          b = offset + start + ((i + 1) % loop.length);
        result.triangles.push([a, b, b + n], [a, b + n, a + n]);
      }
      start += loop.length;
    }
  }
  return result;
}
function append(target: Part, p: Part) {
  const offset = target.vertices.length;
  target.vertices.push(...p.vertices);
  target.triangles.push(
    ...p.triangles.map((t) => t.map((i) => i + offset) as Vec3),
  );
}
function makeText(
  text: string,
  font: Font,
  name: string,
  color: string,
  height: number,
  cy: number,
  base: Base,
  design: Design,
): Part | null {
  if (!text.trim()) return null;
  const merged: Part = { name, color, vertices: [], triangles: [] };
  let x = 0;
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    if (glyph.index === 0) {
      design.errors.push(`字体不支持字符「${char}」，请替换后导出。`);
      continue;
    }
    const path = glyph.getPath(x, 0, 100);
    const shapePath = new THREE.ShapePath();
    for (const cmd of path.commands) {
      switch (cmd.type) {
        case "M":
          shapePath.moveTo(cmd.x, -cmd.y);
          break;
        case "L":
          shapePath.lineTo(cmd.x, -cmd.y);
          break;
        case "C":
          shapePath.bezierCurveTo(
            cmd.x1,
            -cmd.y1,
            cmd.x2,
            -cmd.y2,
            cmd.x,
            -cmd.y,
          );
          break;
        case "Q":
          shapePath.quadraticCurveTo(cmd.x1, -cmd.y1, cmd.x, -cmd.y);
          break;
        case "Z":
          shapePath.currentPath?.closePath();
      }
    }
    const shapes = shapePath.toShapes(true);
    if (shapes.length) {
      append(merged, extrudeShapes(shapes, base.layout.relief, name, color));
    }
    x += ((glyph.advanceWidth ?? 1000) / font.unitsPerEm) * 100 + 2; // modest tracking preserves separate glyph shells
  }
  if (!merged.vertices.length) return null;
  const xs = merged.vertices.map((v) => v[0]),
    ys = merged.vertices.map((v) => v[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const scale = Math.min(
    height / (maxY - minY),
    base.layout.textWidth / (maxX - minX),
  );
  const actual = (maxY - minY) * scale;
  design.textHeights[name] = actual;
  if (actual < base.layout.textRules.minimumHeight)
    design.errors.push(
      `${name} 缩放后仅 ${actual.toFixed(1)} mm 高，请缩短文字。`,
    );
  else if (actual < base.layout.textRules.warningHeight)
    design.warnings.push(
      `${name} 高 ${actual.toFixed(1)} mm；细笔画可能小于 0.4 mm，请检查切片。`,
    );
  merged.vertices = merged.vertices.map(([vx, vy, vz]) => [
    base.layout.textLeft + (vx - minX) * scale,
    cy + (vy - (minY + maxY) / 2) * scale,
    base.layout.textZ + vz,
  ]);
  return merged;
}
export function buildDesign(c: Config, base: Base, font: Font): Design {
  const d: Design = { parts: [], warnings: [], errors: [], textHeights: {} };
  if (!c.displayName.trim()) d.errors.push("请输入显示名称。");
  if (
    [c.displayName, c.pronouns, c.customStatus].some(
      (v) => v.length > base.layout.textRules.maxCharacters,
    )
  )
    d.errors.push("单个文字字段最多 120 个字符。");
  if (d.errors.length) return d;
  const colors: Record<string, string> = {
    Plate_Body: "#102b2a",
    Avatar_Back: "#385653",
    Avatar_Frame: "#7b9992",
    Status_Dot: resolvedDot(c),
  };
  d.parts = base.parts.map((p) => ({ ...p, color: colors[p.name] }));
  const hasPronouns = !!c.pronouns.trim();
  const rules = base.layout.textRules;
  const specs: [string, string, string, number, number][] = [
    [
      "Name",
      c.displayName,
      c.friend ? "#ffd45d" : "#f3f6ed",
      hasPronouns ? rules.name.heightWithPronouns : rules.name.height,
      hasPronouns ? rules.name.centerYWithPronouns : rules.name.centerY,
    ],
    [
      "Pronouns",
      c.pronouns,
      "#bdcbc6",
      rules.pronouns.height,
      rules.pronouns.centerY,
    ],
    [
      "Status_Text",
      c.customStatus,
      "#bdcbc6",
      rules.status.height,
      rules.status.centerY,
    ],
  ];
  for (const [name, text, color, h, y] of specs) {
    const part = makeText(text, font, name, color, h, y, base, d);
    if (part) d.parts.push(part);
  }
  for (const p of d.parts) {
    const report = validateMesh(p);
    if (!report.valid)
      d.errors.push(
        `${p.name}: 网格无效 (${report.badEdges} 条异常边，${report.degenerate} 个退化面)。`,
      );
  }
  return d;
}
export function validateMesh(p: Part) {
  const edges = new Map<string, { count: number; balance: number }>();
  let volume = 0,
    degenerate = 0;
  if (
    !p.vertices.length ||
    !p.triangles.length ||
    p.vertices.some((v) => v.length !== 3 || v.some((n) => !Number.isFinite(n)))
  )
    return { valid: false, badEdges: 0, degenerate: 1, volume: 0 };
  for (const t of p.triangles) {
    if (
      t.length !== 3 ||
      t.some((i) => !Number.isInteger(i) || i < 0 || i >= p.vertices.length)
    ) {
      degenerate++;
      continue;
    }
    const [a, b, c] = t.map((i) => new THREE.Vector3(...p.vertices[i]));
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length();
    if (area < 1e-9) degenerate++;
    volume += a.dot(b.clone().cross(c)) / 6;
    for (let j = 0; j < 3; j++) {
      const u = t[j],
        v = t[(j + 1) % 3],
        key = u < v ? `${u},${v}` : `${v},${u}`;
      const e = edges.get(key) ?? { count: 0, balance: 0 };
      e.count++;
      e.balance += u < v ? 1 : -1;
      edges.set(key, e);
    }
  }
  const badEdges = [...edges.values()].filter(
    (e) => e.count !== 2 || e.balance !== 0,
  ).length;
  return {
    valid: !badEdges && !degenerate && volume > 1e-7,
    badEdges,
    degenerate,
    volume,
  };
}
