// SPDX-License-Identifier: MIT
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import opentype from 'opentype.js';
import {buildDesign,defaults,type Base,type Config} from '../src/model.ts';
import {export3mf} from '../src/export.ts';
const out=new URL('../../evidence/windows-blender-review/samples/',import.meta.url);mkdirSync(out,{recursive:true});
const b=readFileSync(new URL('../public/assets/NotoSansCJKsc-Bold.otf',import.meta.url));
const font=opentype.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
const cases:[string,Partial<Config>][]=[['default',{}],['friend-pronouns',{friend:true,pronouns:'They/Them'}],['mixed',{displayName:'Nagi_心こんにちは',pronouns:'随意 / Any'}],['cfs4-custom',{friend:true,filamentColors:['#16171B','#EEEEEE','#FFCE40','#51B44B']}],['long',{displayName:'A Very Long English Display Name'}],['custom-status',{customStatus:'自由 / Ready'}]];
const results=[];
for(const styleId of ['classic','native']){
const base:Base=JSON.parse(readFileSync(new URL(`../public/assets/styles/${styleId}/base.json`,import.meta.url),'utf8'));
for(const [id,patch] of cases){
const config={...defaults,...patch,styleId};const design=buildDesign(config,base,font);assert.deepEqual(design.errors,[]);
writeFileSync(new URL(`${styleId}-${id}-A.3mf`,out),export3mf(design,config));
results.push({file:`${styleId}-${id}-A.3mf`,config,warnings:design.warnings,parts:design.parts.length});
if(id==='default')for(const thickness of [.4,.6]){
const candidate=structuredClone(design);const body=candidate.parts.find(p=>p.name==='Plate_Body')!;
const z0=Math.min(...body.vertices.map(v=>v[2])),z1=Math.max(...body.vertices.map(v=>v[2]));
const core=structuredClone(body);core.name='Plate_Core';core.color='#FFFFFF';
core.vertices=core.vertices.map(([x,y,z])=>[x,y,z0+(z-z0)*(z1-z0-thickness)/(z1-z0)]);
body.vertices=body.vertices.map(([x,y,z])=>[x,y,z1-thickness+(z-z0)*thickness/(z1-z0)]);
candidate.parts.push(core);
const cfg={...config,materialSlots:{Plate_Core:1}};
writeFileSync(new URL(`${styleId}-default-B${thickness}.3mf`,out),export3mf(candidate,cfg));
results.push({file:`${styleId}-default-B${thickness}.3mf`,config:cfg,blackSkinMm:thickness,candidate:true});
}
}}
writeFileSync(new URL('../generation.json',out),JSON.stringify(results,null,2));console.log(`${results.length} fresh engine exports`);
