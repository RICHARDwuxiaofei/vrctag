// SPDX-License-Identifier: MIT
import { getStyle } from "./styles";
import type { Config, Part } from "./model";
/** Current production contract. Historical fixtures remain independently readable. */
export function assertPrintStructure(parts: Part[], config: Config) {
  const g = getStyle(config.styleId).geometry;
  const bounds = (name: string) => {
    const p = parts.find((p) => p.name === name);
    if (!p?.vertices.length) throw Error(`Missing printable part: ${name}`);
    return [
      Math.min(...p.vertices.map((v) => v[2])),
      Math.max(...p.vertices.map((v) => v[2])),
    ];
  };
  const core = bounds("Plate_Core"),
    skin = bounds("Plate_Body");
  if (
    Math.abs(core[0]) > 1e-5 ||
    Math.abs(core[1] - g.coreTop) > 1e-5 ||
    Math.abs(skin[0] - core[1]) > 1e-5 ||
    Math.abs(skin[1] - g.bodyTop) > 1e-5 ||
    Math.abs(skin[1] - skin[0] - 0.6) > 1e-5
  )
    throw Error("White core / black face Z contact or thickness mismatch");
  if (
    getStyle(config.styleId).id === "classic" &&
    parts.some((p) => p.name === "Hanging_Loop") !==
      (config.hangingLoop !== false)
  )
    throw Error("Hanging loop does not match configuration");
}
