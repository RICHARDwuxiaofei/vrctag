# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Run the verified official-listing extension in a disposable background process.
Pass --extension /temporary/extracted/path; no preferences/addons are installed globally.
"""
from pathlib import Path
import sys, argparse, importlib.util, json, zipfile
import bpy, bmesh
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--extension',type=Path,required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);folder=a.extension.resolve()
spec=importlib.util.spec_from_file_location('vrctag_test_threemf',folder/'__init__.py',submodule_search_locations=[str(folder)])
addon=importlib.util.module_from_spec(spec);sys.modules[spec.name]=addon;spec.loader.exec_module(addon)
from vrctag_test_threemf.api import import_3mf
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'studio/evidence/beta-2026-11-04';reports=[]
for style in ['classic','native']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    path=out/'samples'/(style+'-default.3mf')
    result=import_3mf(str(path),scene_unit='FILE',import_materials='MATERIALS',reuse_materials=False)
    objs=[o for o in bpy.context.scene.objects if o.type=='MESH'];scale=bpy.context.scene.unit_settings.scale_length*1000
    points=[o.matrix_world@Vector(v)for o in objs for v in o.bound_box]
    size=[(max(v[k]for v in points)-min(v[k]for v in points))*scale for k in range(3)]
    parts=[]
    for obj in objs:
        bm=bmesh.new();bm.from_mesh(obj.data)
        parts.append({'name':obj.name,'vertices':len(bm.verts),'faces':len(bm.faces),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'signedVolumeBU3':bm.calc_volume(signed=True),'materials':[{ 'name':m.name,'rgba':list(m.diffuse_color)}for m in obj.data.materials if m]});bm.free()
    expected=[134,52,4]if style=='classic'else[118,40,3.6]
    assert all(abs(a-b)<1e-3 for a,b in zip(size,expected)),size
    assert len(parts)==(7 if style=='classic'else 6),parts
    with zipfile.ZipFile(path)as z:plan=json.loads(z.read('Metadata/printing.json'))
    for part in parts:
        item=next(p for p in plan['parts']if p['name']==part['name']);rgb=[int(item['color'][i:i+2],16)/255 for i in (1,3,5)]
        linear=[v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4 for v in rgb]
        assert all(abs(a-b)<1e-5 for a,b in zip(linear,part['materials'][0]['rgba'][:3])), 'Imported color mismatch'
    assert all(p['nonManifoldEdges']==0 and p['signedVolumeBU3']>0 and p['materials']for p in parts)
    reports.append({'styleId':style,'status':'PASS','sizeMm':size,'sceneScale':bpy.context.scene.unit_settings.scale_length,'parts':parts,'warnings':result.warnings,'pipeline':'Official Blender Extensions threemf-io 2.7.8 programmatic API, same import pipeline; no GUI use','noGlobalInstallation':True})
    bpy.ops.wm.save_as_mainfile(filepath=str(out/(style+'-official-extension-import.blend')))
    (out/'blender-extension-import.json').write_text(json.dumps(reports,indent=2))
print('BETA_EXTENSION_IMPORT_COMPLETE',flush=True)
