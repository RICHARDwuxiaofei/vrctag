// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import type { Config, Design, Part, Vec3 } from "./model";

export const MIN_SIZE_PERCENT = 50;
export const MAX_SIZE_PERCENT = 150;

/** Old configs with missing fields are treated as 100%. */
export function scaleRatio(percent: number | undefined): number {
  const value = percent ?? 100;
  if (!Number.isInteger(value) || value < MIN_SIZE_PERCENT || value > MAX_SIZE_PERCENT)
    throw Error("缩放比例必须是 50–150% 的整数");
  return value / 100;
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
