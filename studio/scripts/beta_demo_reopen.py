# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Read-only persisted demo acceptance, in a separate background Blender."""
from pathlib import Path
import json,hashlib,bpy,bmesh
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'studio/evidence/beta-2026-11-04';reports=[]
for style in ['classic','native']:
 path=ROOT/'studio/demos'/(style+'-nagikokoro.blend');before=hashlib.sha256(path.read_bytes()).hexdigest()
 bpy.ops.wm.open_mainfile(filepath=str(path),use_scripts=False)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert {'Name','Status_Text','Status_Dot'}<={o.name for o in meshes}
 assert not any(o.type=='FONT'for o in bpy.context.scene.objects)
 for obj in meshes:
  bm=bmesh.new();bm.from_mesh(obj.data);assert all(e.is_manifold for e in bm.edges)and bm.calc_volume(signed=True)>0;bm.free()
 assert 'Actual exported 3MF mesh' in bpy.data.texts['README_3MF_SOURCE'].as_string()
 assert before==hashlib.sha256(path.read_bytes()).hexdigest()
 reports.append({'file':str(path.relative_to(ROOT)),'reopened':True,'meshObjects':len(meshes),'dynamicTextIsRealMesh':True,'sourceUnchanged':True,'sha256':before})
(out/'demo-reopen.json').write_text(json.dumps(reports,indent=2));print('DEMO_REOPEN_PASS')
