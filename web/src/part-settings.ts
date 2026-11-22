// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
/**
 * Slicer overrides written per part into Metadata/model_settings.config.
 *
 * Bambu Studio keeps per-object settings inside the project file, not in the
 * process preset, so an exported tag always arrives with default surfaces.
 * Declaring them here means every export already carries the intended
 * per-part behaviour and the file can be opened, re-preset and printed as is.
 *
 * Keys are slicer setting names (Bambu/Orca); parts not listed stay untouched.
 */
export const partSettings: Readonly<
  Record<string, ReadonlyArray<readonly [string, string]>>
> = {
  // Display side of every tag: concentric top surface, no visible seam lines.
  Plate_Core: [["top_surface_pattern", "concentric"]],
  Plate_Rim: [["top_surface_pattern", "concentric"]],
  Hanging_Loop: [["top_surface_pattern", "concentric"]],
  Status_Dot: [["top_surface_pattern", "concentric"]],
  Name: [["top_surface_pattern", "concentric"]],
  Status_Text: [["top_surface_pattern", "concentric"]],
  // Back side: fill lines run 90° so the flat face reads clean.
  Plate_Body: [["infill_direction", "90"]],
  // Inner walls first keeps the outer wall from being pushed out by infill.
  Avatar_Back: [
    ["infill_direction", "90"],
    ["wall_sequence", "inner wall/outer wall"],
  ],
};

export const partSettingsFor = (
  name: string,
): ReadonlyArray<readonly [string, string]> => partSettings[name] ?? [];
