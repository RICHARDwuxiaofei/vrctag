// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import type { Config, Design, Part, Vec3 } from "./model";

export const MIN_SIZE_PERCENT = 50;
export const MAX_SIZE_PERCENT = 150;

/** Old configs with missing fields are treated as 100%. */
export function scaleRatio(percent: number | undefined): number {
  const value = percent ?? 100;
  if (!Number.isFinite(value) || value < MIN_SIZE_PERCENT || value > MAX_SIZE_PERCENT)
    throw Error("缩放比例必须是 50–150% 的数字");
  return value / 100;
}

/** Keep saved ratios stable, including decimals needed for 0.01 mm input. */
export function clampScale(percent: number): number {
  if (!Number.isFinite(percent)) throw Error("比例必须是有效数字");
  const bounded = Math.max(MIN_SIZE_PERCENT, Math.min(MAX_SIZE_PERCENT, percent));
  return Math.round(bounded * 1_000_000) / 1_000_000;
}

/** Convert an exact millimeter input to a ratio; X/Y share one ratio. */
export function percentFromMillimeters(mm: number, referenceMm: number): number {
  if (!Number.isFinite(mm) || !Number.isFinite(referenceMm) || referenceMm <= 0)
    throw Error("毫米尺寸必须是有效正数");
  return clampScale(mm / referenceMm * 100);
}

/**
 * Baseline outer bounding dimensions at 100%.
 * Without the optional hook, both capsule/round-panel styles are bounded in Y
 * by their left/right endpoint radii rather than the ring's top.
 */
export function referenceDimensions(
  style: { layout: { size: readonly number[] }; geometry: { leftRadius: number; rightRadius: number } },
  hangingLoop = true,
): [number, number, number] {
  const size = style.layout.size;
  return [
    size[0],
    hangingLoop ? size[1] : 2 * Math.max(style.geometry.leftRadius, style.geometry.rightRadius),
    size[2],
  ];
}

export function scaledDimensions(
  dimensions: readonly number[],
  config: Pick<Config, "planarScale" | "thicknessScale">,
): [number, number, number] {
  const xy = scaleRatio(config.planarScale);
  const z = scaleRatio(config.thicknessScale);
  if (dimensions.length < 3 || dimensions.slice(0, 3).some((n) => !Number.isFinite(n)))
    throw Error("基础模型尺寸无效");
  return [dimensions[0] * xy, dimensions[1] * xy, dimensions[2] * z];
}

/** Scale every vertex including the non-printing avatar overlay; never mutate Base. */
export function scaleDesignGeometry(
  design: Design,
  config: Pick<Config, "planarScale" | "thicknessScale">,
  minimumTextHeight = 2.4,
): Design {
  const xy = scaleRatio(config.planarScale);
  const z = scaleRatio(config.thicknessScale);
  if (xy === 1 && z === 1) return design;
  const scalePart = (part: Part): Part => ({
    ...part,
    vertices: part.vertices.map(([x, y, h]): Vec3 => [x * xy, y * xy, h * z]),
  });
  const textHeights = Object.fromEntries(
    Object.entries(design.textHeights).map(([name, mm]) => [name, mm * xy]),
  );
  const warnings = [...design.warnings];
  if (z < 1)
    warnings.push("厚度缩小会同时降低文字和状态灯浮雕；50% 时为 0.3 mm，请按实际层高检查切片。缩放不保证可打印。");
  // Shrinking can make glyphs unprintable without making the 3D mesh invalid.
  if (xy < 1 && Object.values(textHeights).some((mm) => mm < minimumTextHeight))
    warnings.push("缩小后小字可能无法打印，请在切片软件检查细节。");
  return {
    ...design,
    parts: design.parts.map(scalePart),
    previewAvatar: design.previewAvatar ? scalePart(design.previewAvatar) : undefined,
    size: design.size ? scaledDimensions(design.size, config) : undefined,
    textHeights,
    strokeScreening: design.strokeScreening
      ? Object.fromEntries(
          Object.entries(design.strokeScreening).map(([name, mm]) => [name, mm * xy]),
        )
      : undefined,
    warnings,
  };
}
