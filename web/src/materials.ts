import type {Config,Part}from './model';import{resolvedDot}from'./model';
export function materialPlan(c:Config,parts:Part[]){
 const color=(v:string)=>{if(!/^#[0-9a-f]{6}$/i.test(v))throw Error('无效打印耗材颜色');return v.toUpperCase();};
 if(c.printMode==='visual'){const palette=[...new Set(parts.map(p=>color(p.color)))];return {mode:'visual',palette,parts:parts.map(p=>({name:p.name,slot:palette.indexOf(color(p.color)),color:color(p.color)}))};}
 const palette=(c.filamentColors??['#102b2a','#f3f6ed','#ffd45d','auto']).map((v,i)=>color(v==='auto'&&i===3?resolvedDot(c):v));if(palette.length!==4)throw Error('四槽方案需要四个耗材颜色');
 const defaultSlot=(name:string)=>name==='Plate_Body'||name==='Avatar_Back'?0:name==='Status_Dot'?3:name==='Name'&&c.friend?2:1;
 return {mode:'cfs4',palette,parts:parts.map(p=>{const slot=c.materialSlots?.[p.name]??defaultSlot(p.name);if(!Number.isInteger(slot)||slot<0||slot>3)throw Error('无效耗材槽位');return{name:p.name,slot,color:palette[slot]};})};
}
