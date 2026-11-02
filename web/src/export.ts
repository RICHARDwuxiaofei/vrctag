import { strToU8, zipSync } from 'fflate';
import {validateMesh,type Design,type Config} from './model';
const escape=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
const xml=(s:string)=>strToU8('<?xml version="1.0" encoding="UTF-8"?>'+s);
export function export3mf(d:Design,c:Config):Uint8Array {
 if(d.errors.length||!d.parts.length)throw new Error(d.errors.join('\n')||'没有可导出的网格');
 for(const p of d.parts)if(!validateMesh(p).valid)throw new Error(`拒绝导出无效网格：${p.name}`);
 const colors=[...new Set(d.parts.map(p=>p.color.toUpperCase()))];if(colors.some(c=>!/^#[0-9A-F]{6}$/.test(c)))throw new Error('无效颜色');
 const objects=d.parts.map((p,i)=>`<object id="${i+2}" type="model" name="${escape(p.name)}" pid="1" pindex="${colors.indexOf(p.color.toUpperCase())}"><mesh><vertices>${p.vertices.map(v=>`<vertex x="${v[0].toFixed(6)}" y="${v[1].toFixed(6)}" z="${v[2].toFixed(6)}"/>`).join('')}</vertices><triangles>${p.triangles.map(t=>`<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('')}</triangles></mesh></object>`).join('');
 const assembly=d.parts.length+2;
 const model=`<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">${escape(c.displayName)} — VRC Tag Studio</metadata><metadata name="Application">VRC Tag Studio 0.1</metadata><resources><basematerials id="1">${colors.map((color,i)=>`<base name="Color ${i+1}" displaycolor="${color}FF"/>`).join('')}</basematerials>${objects}<object id="${assembly}" type="model" name="VRC Tag"><components>${d.parts.map((_,i)=>`<component objectid="${i+2}"/>`).join('')}</components></object></resources><build><item objectid="${assembly}" transform="1 0 0 0 1 0 0 0 1 60 19 0"/></build></model>`;
 return zipSync({'[Content_Types].xml':xml('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="json" ContentType="application/json"/></Types>'),'_rels/.rels':xml('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),'3D/3dmodel.model':xml(model),'Metadata/design.json':strToU8(JSON.stringify({version:1,...c},null,2))},{level:6});
}
