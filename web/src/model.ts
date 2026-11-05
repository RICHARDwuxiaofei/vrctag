// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { statusLabels, type Language } from "./i18n";
import { getStyle, defaultStyleId } from "./styles";
import { sampledStroke } from "./printability";
import { validateMesh } from "./mesh-validation";
export { validateMesh } from "./mesh-validation";
import ClipperLib from "clipper-lib";
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
  previewAvatar?: Part;
  styleId?: string;
  colors?: Record<string, string>;
  parts: Part[];
  layout: {
    avatar?: {
      center: number[];
      radius: number;
      frameWidth: number;
      dotCenter: number[];
      dotRadius: number;
    };
    unit: string;
    front: string;
    size: number[];
    textLeft: number;
    textWidth: number;
    statusTextLeft?: number;
    statusTextWidth?: number;
    textZ: number;
    relief: number;
    textRules: {
      alignment: string;
      name: {
        height: number;
        centerY: number;
        heightWithPronouns: number;
        centerYWithPronouns: number;
        centerYWithoutStatus?: number;
        centerYWithPronounsWithoutStatus?: number;
      };
      pronouns: {
        height: number;
        centerY: number;
        centerYWithoutStatus?: number;
      };
      status: {
        height: number;
        centerY: number;
        centerYWithoutPronouns?: number;
      };
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
  styleId?: string;
  hangingLoop?: boolean;
  language?: Language;
  statusMode?: "preset" | "custom";
  hideStatus?: boolean;
  printMode?: "cfs4" | "visual";
  filamentColors?: string[];
  materialSlots?: Record<string, number>;
  displayName: string;
  friend: boolean;
  status: Status;
  dotColor: string;
  customStatus: string;
  pronouns: string;
}
export const defaults: Config = {
  styleId: defaultStyleId,
  hangingLoop: true,
  printMode: "cfs4",
  displayName: "Nagikokoro",
  friend: false,
  status: "Online",
  dotColor: "auto",
  customStatus: "无聊",
  pronouns: "",
};
export const statusIsHidden = (c: Config) => c.hideStatus ?? (getStyle(c.styleId).id === "native");
export const statusText = (c: Config) => statusIsHidden(c) ? "" : c.statusMode === "preset" ? statusLabels[c.language ?? "zh"][c.status] : c.customStatus;
export const resolvedDot = (c: Config) =>
  c.dotColor === "auto" ? statuses[c.status] : c.dotColor;
export interface Design {
  previewAvatar?: Part;
  styleId?: string;
  size?: number[];
  placeholderColors?: [string, string];
  parts: Part[];
  warnings: string[];
  errors: string[];
  textHeights: Record<string, number>;
  strokeScreening?: Record<string, number>;
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
  repairDepth = 0,
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
    // A contour pinch extrudes into a non-manifold edge (Noto 离).
    // Repair only touching contours using an integer polygon union/offset.
    // The 0.01 font-path-unit expansion scales with text size and is far below nozzle resolution.
    const contours = [outer, ...holes];
    const touching = contours.some((loop, li) =>
      loop.some((p, k) =>
        contours.some((other, oi) =>
          other.some((a, i) => {
            if (li === oi && (i === k || (i + 1) % other.length === k))
              return false;
            const b = other[(i + 1) % other.length],
              dx = b.x - a.x,
              dy = b.y - a.y,
              len = dx * dx + dy * dy;
            if (len < 1e-16) return false;
            const u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
            return (
              u >= -1e-8 &&
              u <= 1 + 1e-8 &&
              Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) < 1e-8
            );
          }),
        ),
      ),
    );
    if (touching && repairDepth < 2) {
      const scale = 100000;
      const paths = contours.map((loop) =>
        loop.map((p) => ({
          X: Math.round(p.x * scale),
          Y: Math.round(p.y * scale),
        })),
      );
      const simple = ClipperLib.Clipper.SimplifyPolygons(
        paths,
        ClipperLib.PolyFillType.pftNonZero,
      );
      const offsetter = new ClipperLib.ClipperOffset(2, 0.25 * scale),
        tree = new ClipperLib.PolyTree();
      offsetter.AddPaths(
        simple,
        ClipperLib.JoinType.jtMiter,
        ClipperLib.EndType.etClosedPolygon,
      );
      offsetter.Execute(tree, 1000);
      const fixed: THREE.Shape[] = [];
      const walk = (node: ClipperLib.PolyNode) => {
        if (!node.IsHole() && node.Contour().length) {
          const points = ClipperLib.Clipper.CleanPolygon(
            node.Contour(),
            100,
          ).map((p) => new THREE.Vector2(p.X / scale, p.Y / scale));
          const shape = new THREE.Shape(points);
          shape.holes = node
            .Childs()
            .filter((c) => c.IsHole())
            .map(
              (c) =>
                new THREE.Path(
                  ClipperLib.Clipper.CleanPolygon(c.Contour(), 100).map(
                    (p) => new THREE.Vector2(p.X / scale, p.Y / scale),
                  ),
                ),
            );
          fixed.push(shape);
        }
        for (const child of node.Childs()) walk(child);
      };
      walk(tree);
      if (!fixed.length) throw Error("Cannot repair touching glyph contours");
      append(result, extrudeShapes(fixed, depth, name, color, repairDepth + 1));
      continue;
    }
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
        const ai = start + i,
          bi = start + ((i + 1) % loop.length),
          a = flat[ai],
          b = flat[bi];
        const dx = b.x - a.x,
          dy = b.y - a.y,
          len = dx * dx + dy * dy;
        // A cap bridge can meet a different contour at a collinear point.
        // Conform the wall to the same vertices; otherwise cap edges end in a T-junction.
        const points = [
          { index: ai, u: 0 },
          { index: bi, u: 1 },
        ];
        for (let k = 0; k < flat.length; k++) {
          if (k === ai || k === bi) continue;
          const p = flat[k],
            u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
          if (
            u > 1e-8 &&
            u < 1 - 1e-8 &&
            Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) < 1e-8
          )
            points.push({ index: k, u });
        }
        points.sort((a, b) => a.u - b.u);
        for (let j = 0; j < points.length - 1; j++) {
          const a = offset + points[j].index,
            b = offset + points[j + 1].index;
          result.triangles.push([a, b, b + n], [a, b + n, a + n]);
        }
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
  font: Pick<Font, "charToGlyph" | "unitsPerEm">,
  name: string,
  color: string,
  height: number,
  cy: number,
  base: Base,
  design: Design,
): Part | null {
  if (!text.trim()) return null;
  const merged: Part = { name, color, vertices: [], triangles: [] };
  const outlines: THREE.Vector2[][][] = [];
  let x = 0;
  for (const char of text.normalize("NFC")) {
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
      outlines.push(
        shapes.flatMap((shape) => {
          const p = shape.extractPoints(8);
          return [p.shape, ...p.holes];
        }),
      );
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
    (name === "Status_Text"
      ? (base.layout.statusTextWidth ?? base.layout.textWidth)
      : base.layout.textWidth) /
      (maxX - minX),
  );
  const actual = (maxY - minY) * scale;
  design.textHeights[name] = actual;
  const strokes = outlines
    .map((p) => sampledStroke(p, scale))
    .filter((n): n is number => n !== null);
  if (strokes.length) {
    const thin = Math.min(...strokes);
    (design.strokeScreening ??= {})[name] = thin;
  }
  if (actual < base.layout.textRules.minimumHeight)
    design.errors.push(
      `${name} 缩放后仅 ${actual.toFixed(1)} mm 高，请缩短文字。`,
    );
  else if (actual < base.layout.textRules.warningHeight)
    design.warnings.push(
      `${name} 高 ${actual.toFixed(1)} mm；细笔画可能小于 0.4 mm，请检查切片。`,
    );
  merged.vertices = merged.vertices.map(([vx, vy, vz]) => [
    (name === "Status_Text"
      ? (base.layout.statusTextLeft ?? base.layout.textLeft)
      : base.layout.textLeft) +
      (vx - minX) * scale,
    cy + (vy - (minY + maxY) / 2) * scale,
    base.layout.textZ + vz,
  ]);
  return merged;
}
export function buildDesign(
  c: Config,
  base: Base,
  font: Pick<Font, "charToGlyph" | "unitsPerEm">,
): Design {
  const style = getStyle(c.styleId);
  const text = statusText(c);
  if (base.styleId && base.styleId !== style.id)
    throw Error("样式与基础模型不匹配，请等待加载完成");
  const palette: Record<string, string> = base.colors ?? style.colors;
  const d: Design = {
    styleId: style.id,
    previewAvatar: base.previewAvatar,
    size: base.layout.size,
    placeholderColors: [palette.Avatar_Back, palette.Avatar_Placeholder],
    parts: [],
    warnings: [],
    errors: [],
    textHeights: {},
  };
  if (!c.displayName.trim()) d.errors.push("请输入显示名称。");
  if (
    [c.displayName, c.pronouns, c.customStatus].some(
      (v) => v.length > base.layout.textRules.maxCharacters,
    )
  )
    d.errors.push("单个文字字段最多 120 个字符。");
  if (d.errors.length) return d;
  d.parts = base.parts
    .filter((p) => p.name !== "Hanging_Loop" || c.hangingLoop !== false)
    .map((p) => ({
      ...p,
      color: p.name === "Status_Dot" ? resolvedDot(c) : palette[p.name],
    }));
  // Actual visible bounds follow the optional hook; the body size stays unchanged.
  d.size=[0,1,2].map(axis=>{const values=d.parts.flatMap(p=>p.vertices.map(v=>v[axis]));return Math.max(...values)-Math.min(...values)});
  const hasPronouns = !!c.pronouns.trim();
  const rules = base.layout.textRules;
  const specs: [string, string, string, number, number][] = [
    [
      "Name",
      c.displayName,
      c.friend ? palette.Friend_Name : palette.Name,
      hasPronouns ? rules.name.heightWithPronouns : rules.name.height,
      hasPronouns
        ? text.trim()
          ? rules.name.centerYWithPronouns
          : (rules.name.centerYWithPronounsWithoutStatus ?? 5.5)
        : text.trim()
          ? rules.name.centerY
          : (rules.name.centerYWithoutStatus ?? 0),
    ],
    [
      "Pronouns",
      c.pronouns,
      palette.Pronouns,
      rules.pronouns.height,
      text.trim()
        ? rules.pronouns.centerY
        : (rules.pronouns.centerYWithoutStatus ?? -5.5),
    ],
    [
      "Status_Text",
      text,
      palette.Status_Text,
      rules.status.height,
      hasPronouns
        ? rules.status.centerY
        : (rules.status.centerYWithoutPronouns ?? rules.status.centerY),
    ],
  ];
  for (const [name, text, color, h, y] of specs) {
    const part = makeText(text, font, name, color, h, y, base, d);
    if (part) d.parts.push(part);
  }
  if (d.errors.length) return d;
  for (const p of d.parts) {
    const report = validateMesh(p);
    if (!report.valid)
      d.errors.push(
        `${p.name}: 网格无效 (${report.badEdges} 条异常边，${report.degenerate} 个退化面；${report.issues.join("; ")})。`,
      );
  }
  return d;
}
