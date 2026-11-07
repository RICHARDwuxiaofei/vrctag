// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import defaultBambuProfile from "./bambu-default.json";
import { assertPrintStructure } from "./print-structure";
import { getStyle } from "./styles";
import { materialPlan } from "./materials";
import { strToU8, zipSync } from "fflate";
import { validateMesh, type Design, type Config } from "./model";
const escape = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const xml = (s: string) =>
  strToU8('<?xml version="1.0" encoding="UTF-8"?>' + s);
export function export3mf(d: Design, c: Config, target: "core" | "bambu" = "core", bambuProfile?: Record<string, unknown>): Uint8Array {
  if(target === "bambu" && !bambuProfile) bambuProfile=defaultBambuProfile;
  const style = getStyle(c.styleId);
  if (d.styleId && d.styleId !== style.id)
    throw Error("拒绝导出与配置不一致的样式");
  if (d.errors.length || !d.parts.length)
    throw new Error(d.errors.join("\n") || "没有可导出的网格");
  // Validate the exact rounded coordinates that will be serialized, not a higher-precision proxy.
  const parts = d.parts.map((p) => ({
    ...p,
    vertices: p.vertices.map(
      (v) => v.map((n) => Number(n.toFixed(6))) as [number, number, number],
    ),
  }));
  for (const p of parts)
    if (!validateMesh(p).valid) throw new Error(`拒绝导出无效网格：${p.name}`);
  if (d.styleId) assertPrintStructure(parts, c);
  const plan = materialPlan(c, parts);
  const colors = plan.palette;
  if(target === "bambu" && (colors.length !== 4 || !Array.isArray(bambuProfile?.filament_settings_id) || bambuProfile.filament_settings_id.length !== 4)) throw Error("Multicolor export requires four filament slots");
  if (colors.some((c) => !/^#[0-9A-F]{6}$/.test(c)))
    throw new Error("无效颜色");
  const objects = parts
    .map(
      (p, i) =>
        `<object id="${i + 2}" type="model" name="${escape(p.name)}" pid="1" pindex="${plan.parts[i].slot}"><mesh><vertices>${p.vertices.map((v) => `<vertex x="${v[0].toFixed(6)}" y="${v[1].toFixed(6)}" z="${v[2].toFixed(6)}"/>`).join("")}</vertices><triangles>${p.triangles.map((t) => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join("")}</triangles></mesh></object>`,
    )
    .join("");
  const assembly = d.parts.length + 2;
  const minX = Math.min(...parts.flatMap((p) => p.vertices.map((v) => v[0])));
  const minY = Math.min(...parts.flatMap((p) => p.vertices.map((v) => v[1])));
  const model = `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021"><metadata name="BambuStudio:3mfVersion">1</metadata><metadata name="Title">${escape(c.displayName)} — VRC Tag Studio</metadata><metadata name="Application">${target === "bambu" ? "BambuStudio-2.0.0" : "VRC Tag Studio 0.1"}</metadata><metadata name="VRC-Tag-Studio:Generator">VRC Tag Studio; Bambu-compatible export, not produced by Bambu Lab</metadata><resources><basematerials id="1">${colors.map((color, i) => `<base name="Filament ${i + 1}" displaycolor="${color}FF"/>`).join("")}</basematerials>${objects}<object id="${assembly}" type="model" name="VRC Tag"><components>${d.parts.map((_, i) => `<component objectid="${i + 2}"/>`).join("")}</components></object></resources><build><item objectid="${assembly}" transform="1 0 0 0 1 0 0 0 1 ${-minX} ${-minY} 0"/></build></model>`;
  return zipSync(
    {
      "[Content_Types].xml": xml(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="json" ContentType="application/json"/></Types>',
      ),
      "_rels/.rels": xml(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>',
      ),
      "3D/3dmodel.model": xml(model),
      // Bambu's importer ignores Core material colors in geometry-only mode.
      // Its compatibility marker above enables this per-part 1-based extruder map.
      // Bundled public starting settings are included below; no printer connection or sliced toolpath is created.
      ...(target === "bambu" ? {
      "Metadata/model_settings.config": xml(`<config><object id="${assembly}"><metadata key="name" value="${escape(c.displayName)}"/><metadata key="extruder" value="1"/>${parts.map((p,i)=>`<part id="${i+2}" subtype="normal_part"><metadata key="name" value="${escape(p.name)}"/><metadata key="extruder" value="${plan.parts[i].slot+1}"/></part>`).join("")}</object><plate><metadata key="plater_id" value="1"/><metadata key="plater_name" value="VRC Tag"/><metadata key="locked" value="false"/><model_instance><metadata key="object_id" value="${assembly}"/><metadata key="instance_id" value="0"/><metadata key="identify_id" value="1"/></model_instance></plate></config>`),
      "Metadata/project_settings.config": strToU8(JSON.stringify({...bambuProfile,filament_colour:colors,filament_self_index:colors.map((_,i)=>String(i+1)),filament_settings_id:colors.map((_,i)=>(bambuProfile!.filament_settings_id as string[])[i])},null,2)),
      } : {}),
      "Metadata/printing.json": strToU8(
        JSON.stringify(
          {
            ...plan,
            unit: "millimeter",
            requiresSlicerFilamentAssignment: true,
          },
          null,
          2,
        ),
      ),
      "Metadata/design.json": strToU8(
        JSON.stringify({ version: 1, ...c, styleId: style.id }, null, 2),
      ),
    },
    { level: 6 },
  );
}
