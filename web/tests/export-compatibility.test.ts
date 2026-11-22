// SPDX-License-Identifier: MIT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {export3mf} from '../src/export.ts';
import {exportBlender} from '../src/blender-export.ts';
import {defaults,type Design} from '../src/model.ts';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
const design:Design={parts:[{name:'Name',color:'#ffffff',vertices:[[0,0,0],[10,0,0],[0,20,0],[0,0,3]],triangles:[[0,2,1],[0,1,3],[0,3,2],[1,2,3]]}],errors:[],warnings:[],textHeights:{}};
test('every custom 3MF metadatum prefix is bound, in both export formats',()=>{
 for(const target of ['core','bambu'] as const){
  const xml=strFromU8(unzipSync(export3mf(design,defaults,target))['3D/3dmodel.model']);
  for(const m of xml.matchAll(/<metadata name="([^":]+):[^\"]+"/g))assert(xml.includes(`xmlns:${m[1]}="`),`unbound prefix ${m[1]} in ${target}`);
 }
});
test('browser GLB exporter converts millimeter Z-up model into meter Y-up glTF',async()=>{
 const previous=globalThis.FileReader;
 globalThis.FileReader=class{result:ArrayBuffer|null=null;onloadend:(()=>void)|null=null;readAsArrayBuffer(blob:Blob){void blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.()})}} as unknown as typeof FileReader;
 try{
  const bytes=await exportBlender(design,'');assert.equal(new DataView(bytes).getUint32(0,true),0x46546c67);assert.equal(new DataView(bytes).getUint32(8,true),bytes.byteLength);
  const gltf=await new GLTFLoader().parseAsync(bytes,'');const bounds=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  assert(Math.abs(bounds.x-.01)<1e-6);assert(Math.abs(bounds.y-.003)<1e-6);assert(Math.abs(bounds.z-.02)<1e-6);assert(gltf.scene.getObjectByName('Name'));
 }finally{globalThis.FileReader=previous}
});

test('Bambu export carries per-part slicer settings so tags open already configured',()=>{
 const expected:Record<string,Record<string,string>>={
  Plate_Core:{top_surface_pattern:'concentric'},
  Plate_Rim:{top_surface_pattern:'concentric'},
  Hanging_Loop:{top_surface_pattern:'concentric'},
  Status_Dot:{top_surface_pattern:'concentric'},
  Name:{top_surface_pattern:'concentric'},
  Status_Text:{top_surface_pattern:'concentric'},
  Plate_Body:{infill_direction:'90'},
  Avatar_Back:{infill_direction:'90',wall_sequence:'inner wall/outer wall'},
 };
 for(const [name,settings] of Object.entries(expected)){
  const one:Design={...design,parts:design.parts.map(p=>({...p,name}))};
  const ms=strFromU8(unzipSync(export3mf(one,defaults,'bambu'))['Metadata/model_settings.config']);
  for(const [key,value] of Object.entries(settings))
   assert(ms.includes(`<metadata key="${key}" value="${value}"/>`),`${name} missing ${key}=${value}`);
 }
 const unknown:Design={...design,parts:design.parts.map(p=>({...p,name:'Unlisted_Part'}))};
 const ms=strFromU8(unzipSync(export3mf(unknown,defaults,'bambu'))['Metadata/model_settings.config']);
 assert(!ms.includes('top_surface_pattern')&&!ms.includes('infill_direction'),'unlisted part must stay untouched');
});
