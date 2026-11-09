// SPDX-License-Identifier: MIT
import { getStyle } from "./styles";
import { scaleRatio } from "./size-scale";
import type { Config, Part } from "./model";
/** Current production contract. Historical fixtures remain independently readable. */
export function assertPrintStructure(parts: Part[], config: Config) {
  const g = getStyle(config.styleId).geometry;
  const z = scaleRatio(config.thicknessScale);
  const bounds = (name: string) => {
    const p = parts.find((p) => p.name === name);
    if (!p?.vertices.length) throw Error(`Missing printable part: ${name}`);
    return [
      Math.min(...p.vertices.map((v) => v[2])),
      Math.max(...p.vertices.map((v) => v[2])),
    ];
  };
  if(getStyle(config.styleId).id === "native") {
    const body=bounds("Plate_Body");
    if(parts.some(p=>p.name==="Plate_Core"||p.name==="Avatar_Back") || Math.abs(body[0])>1e-5 || Math.abs(body[1]-g.bodyTop*z)>1e-5) throw Error("Native requires one full-depth black body");
  } else {
    const core=bounds("Plate_Core"),skin=bounds("Plate_Body");
    if(Math.abs(core[0])>1e-5 || Math.abs(core[1]-g.coreTop*z)>1e-5 || Math.abs(skin[0]-core[1])>1e-5 || Math.abs(skin[1]-g.bodyTop*z)>1e-5 || Math.abs(skin[1]-skin[0]-g.skinThickness*z)>1e-5) throw Error("White core / black face Z contact or thickness mismatch");
  }
  if (
    parts.some((p) => p.name === "Hanging_Loop") !==
      (config.hangingLoop !== false)
  )
    throw Error("Hanging loop does not match configuration");
}
