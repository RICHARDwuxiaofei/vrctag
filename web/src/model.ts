// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { statusLabels, type Language } from "./i18n";
import { getStyle, defaultStyleId } from "./styles";
import { sampledStroke } from "./printability";
import { validateMesh } from "./mesh-validation";
import {
  nameFontScaleRatio,
  scaleDesignGeometry,
  scaleRatio,
} from "./size-scale";
import { materialPlan } from "./materials";
import { resolvedDot, type Status } from "./status-colors";
export { statuses, resolvedDot, type Status } from "./status-colors";
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
export interface Config {
  styleId?: string;
  hangingLoop?: boolean;
  language?: Language;
  statusMode?: "preset" | "custom";
  hideStatus?: boolean;
  printMode?: "cfs4" | "visual";
  /** Locked X/Y size as a percent of the original. */
  planarScale?: number;
  /** Separate Z thickness percent. */
  thicknessScale?: number;
  /** Custom name font scale percent relative to the style's default title size (50–150). */
  nameFontScale?: number;
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
  planarScale: 100,
  thicknessScale: 100,
  nameFontScale: 100,
  displayName: "Nagikokoro",
  friend: false,
  status: "Online",
  dotColor: "auto",
  customStatus: "无聊",
  pronouns: "",
};
export const statusIsHidden = (c: Config) => c.hideStatus ?? (getStyle(c.styleId).id === "native");
export const statusText = (c: Config) => statusIsHidden(c) ? "" : c.statusMode === "preset" ? statusLabels[c.language ?? "zh"][c.status] : c.customStatus;
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
  nameFontClamped?: boolean;
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
// Reference height of the default title ("Nagikokoro" at font size 100) in Noto Sans CJK SC Bold.
const REFERENCE_NAME_BOX = 105.4;
// Reserve 3.2 mm inside the right end curve for Name text without mutating base.layout.
const NAME_RIGHT_MARGIN = 3.2;

/** Convert a Clipper PolyTree back into Three.js Shapes while preserving nested islands. */
function polyTreeToShapes(
  tree: ClipperLib.PolyTree,
  scale: number,
): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];
  const cleanPoints = (contour: ClipperLib.IntPoint[]) =>
    ClipperLib.Clipper.CleanPolygon(contour, 100).map(
      (p) => new THREE.Vector2(p.X / scale, p.Y / scale),
    );
  const walk = (node: ClipperLib.PolyNode) => {
    if (!node.IsHole() && node.Contour().length) {
      const outer = cleanPoints(node.Contour());
      if (outer.length >= 3) {
        const shape = new THREE.Shape(outer);
        shape.holes = node
          .Childs()
          .filter((c) => c.IsHole())
          .map((c) => cleanPoints(c.Contour()))
          .filter((pts) => pts.length >= 3)
          .map((pts) => new THREE.Path(pts));
        shapes.push(shape);
      }
    }
    for (const child of node.Childs()) walk(child);
  };
  walk(tree);
  return shapes;
}

/**
 * Convert font subpaths via Clipper Non-Zero winding so arbitrary contour
 * ordering (e.g. Noto "电", "回", "明") preserves every hole and nested island.
 */
function subPathsToShapes(shapePath: THREE.ShapePath): THREE.Shape[] {
  const scale = 100000;
  const paths: ClipperLib.IntPoint[][] = [];
  for (const sub of shapePath.subPaths) {
    const pts = sub.getPoints(8);
    if (pts.length < 3) continue;
    paths.push(
      pts.map((p) => ({
        X: Math.round(p.x * scale),
        Y: Math.round(p.y * scale),
      })),
    );
  }
  if (!paths.length) return [];
  const clipper = new ClipperLib.Clipper();
  clipper.StrictlySimple = true;
  clipper.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
  const tree = new ClipperLib.PolyTree();
  clipper.Execute(
    ClipperLib.ClipType.ctUnion,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  return polyTreeToShapes(tree, scale);
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
      const fixed = polyTreeToShapes(tree, scale);
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
type TextOptions = {
  referenceBox?: number;
  maxWidth?: number;
  maxBandHeight?: number;
  onClamped?: (clamped: boolean) => void;
};
function makeText(
  text: string,
  font: Pick<Font, "charToGlyph" | "unitsPerEm">,
  name: string,
  color: string,
  height: number,
  cy: number,
  base: Base,
  design: Design,
  options?: TextOptions,
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
    const shapes = subPathsToShapes(shapePath);
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
  const rawW = maxX - minX,
    rawH = maxY - minY;
  if (rawW <= 0 || rawH <= 0) return null;
  const allowedWidth =
    options?.maxWidth ??
    (name === "Status_Text"
      ? (base.layout.statusTextWidth ?? base.layout.textWidth)
      : base.layout.textWidth);
  const desiredScale =
    height /
    (options?.referenceBox ? Math.max(options.referenceBox, rawH) : rawH);
  const widthScale = allowedWidth / rawW;
  const bandScale =
    options?.maxBandHeight && options.maxBandHeight > 0
      ? options.maxBandHeight / rawH
      : Infinity;
  const scale = Math.min(desiredScale, widthScale, bandScale);
  options?.onClamped?.(scale < desiredScale - 1e-9);
  const actual = rawH * scale;
  design.textHeights[name] = actual;
  const strokes = outlines
    .map((p) => sampledStroke(p, scale))
    .filter((n): n is number => n !== null);
  if (strokes.length) {
    const thin = Math.min(...strokes);
    (design.strokeScreening ??= {})[name] = thin;
  }
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
  if (d.errors.length)
    return scaleDesignGeometry(d, c, base.layout.textRules.minimumHeight);
  d.parts = base.parts
    .filter((p) => p.name !== "Hanging_Loop" || c.hangingLoop !== false)
    .map((p) => ({
      ...p,
      color: p.name === "Status_Dot" ? resolvedDot(c) : palette[p.name],
    }));
  // Actual visible bounds follow the optional hook; the body size stays unchanged.
  d.size=[0,1,2].map(axis=>{const values=d.parts.flatMap(p=>p.vertices.map(v=>v[axis]));return Math.max(...values)-Math.min(...values)});
  const hasPronouns = !!c.pronouns.trim();
  const hasStatus = !!text.trim();
  const rules = base.layout.textRules;
  const nameScale = nameFontScaleRatio(c.nameFontScale);
  const baseNameHeight = hasPronouns
    ? rules.name.heightWithPronouns
    : rules.name.height;
  const nameCenterY = hasPronouns
    ? hasStatus
      ? rules.name.centerYWithPronouns
      : (rules.name.centerYWithPronounsWithoutStatus ?? 5.5)
    : hasStatus
      ? rules.name.centerY
      : (rules.name.centerYWithoutStatus ?? 0);
  const pronounsCenterY = hasStatus
    ? rules.pronouns.centerY
    : (rules.pronouns.centerYWithoutStatus ?? -5.5);
  const statusCenterY = hasPronouns
    ? rules.status.centerY
    : (rules.status.centerYWithoutPronouns ?? rules.status.centerY);
  const nameMaxWidth = Math.max(10, base.layout.textWidth - NAME_RIGHT_MARGIN);
  const g = style.geometry as {
    family?: string;
    panelHalfHeight?: number;
    rimWidth?: number;
    rightCenter: number;
    rightRadius: number;
  };
  const innerHalf =
    g.family === "reference-round-panel" &&
    g.panelHalfHeight !== undefined &&
    g.rimWidth !== undefined
      ? g.panelHalfHeight - g.rimWidth
      : g.rightRadius;
  const dx = Math.max(0, base.layout.textLeft + nameMaxWidth - g.rightCenter);
  const plateTopY = Math.sqrt(Math.max(0, innerHalf * innerHalf - dx * dx));
  const avatar = base.layout.avatar;
  const dotTop =
    avatar && avatar.dotCenter[0] + avatar.dotRadius > base.layout.textLeft
      ? avatar.dotCenter[1] + avatar.dotRadius + 0.1
      : -Infinity;
  let floorY = Math.max(-plateTopY + 0.4, dotTop);
  if (hasPronouns) {
    floorY = Math.max(floorY, pronounsCenterY + rules.pronouns.height / 2 + 0.4);
  } else if (hasStatus) {
    floorY = Math.max(floorY, statusCenterY + rules.status.height / 2 + 0.5);
  }
  const maxNameBandHeight =
    2 * Math.max(0, Math.min(plateTopY - 0.4 - nameCenterY, nameCenterY - floorY));
  const specs: [string, string, string, number, number, TextOptions?][] = [
    [
      "Name",
      c.displayName,
      c.friend ? palette.Friend_Name : palette.Name,
      baseNameHeight * nameScale,
      nameCenterY,
      {
        referenceBox: REFERENCE_NAME_BOX,
        maxWidth: nameMaxWidth,
        maxBandHeight: maxNameBandHeight,
        onClamped: (clamped) => {
          d.nameFontClamped = clamped;
        },
      },
    ],
    [
      "Pronouns",
      c.pronouns,
      palette.Pronouns,
      rules.pronouns.height,
      pronounsCenterY,
    ],
    [
      "Status_Text",
      text,
      palette.Status_Text,
      rules.status.height,
      statusCenterY,
    ],
  ];
  for (const [name, text, color, h, y, options] of specs) {
    const part = makeText(text, font, name, color, h, y, base, d, options);
    if (part) d.parts.push(part);
  }
  // Restored custom filament settings must be visible in both preview and GLB.
  // Keep visual mode and the original no-customization appearance unchanged.
  if (
    c.printMode !== "visual" &&
    (c.filamentColors !== undefined || c.materialSlots !== undefined)
  ) {
    const plan = materialPlan(c, d.parts);
    d.parts = d.parts.map((part, i) => ({ ...part, color: plan.parts[i].color }));
  }
  // The complete generated mesh is scaled once. Preview, 3MF and GLB all
  // consume these same real-world millimeter coordinates, including invalid
  // previews that remain visible while the user corrects unsupported/small text.
  const scaled = scaleDesignGeometry(d, c, base.layout.textRules.minimumHeight);
  const xy = scaleRatio(c.planarScale);
  for (const [name, baselineHeight] of Object.entries(d.textHeights)) {
    const actual = scaled.textHeights[name];
    // Preserve the established 50–100% acceptance boundary: shrinking an
    // otherwise valid design remains allowed with the existing warnings.
    // Enlargement can rescue text once its final height reaches the threshold.
    const checkedHeight = baselineHeight * Math.max(1, xy);
    if (checkedHeight < rules.minimumHeight)
      scaled.errors.push(
        `${name} 缩放后仅 ${actual.toFixed(1)} mm 高，请缩短文字。`,
      );
    else if (checkedHeight < rules.warningHeight)
      scaled.warnings.push(
        `${name} 高 ${actual.toFixed(1)} mm；细笔画可能小于 0.4 mm，请检查切片。`,
      );
  }
  if (scaled.errors.length) return scaled;
  for (const p of scaled.parts) {
    const report = validateMesh(p);
    if (!report.valid)
      scaled.errors.push(
        `${p.name}: 网格无效 (${report.badEdges} 条异常边，${report.degenerate} 个退化面；${report.issues.join("; ")})。`,
      );
  }
  return scaled;
}
