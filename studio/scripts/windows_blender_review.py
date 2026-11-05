# SPDX-License-Identifier: MIT
"""Official extension imports and real Cycles renders, isolated background only."""
from pathlib import Path
import bpy,bmesh,sys,json,importlib.util,zipfile,math,os
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];out=Path(os.environ.get('VRC_REVIEW_OUTPUT',ROOT/'evidence/windows-blender-review'));folder=ROOT/'evidence/windows-blender-review/tools/threemf'
spec=importlib.util.spec_from_file_location('review_threemf',folder/'__init__.py',submodule_search_locations=[str(folder)])
addon=importlib.util.module_from_spec(spec);sys.modules[spec.name]=addon;spec.loader.exec_module(addon);addon.register()
from review_threemf.api import import_3mf
reports=[];(out/'images').mkdir(exist_ok=True)
for path in sorted((out/'samples').glob('*.3mf')):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 result=import_3mf(str(path),scene_unit='FILE',import_materials='MATERIALS',reuse_materials=False)
 scene=bpy.context.scene;scale=scene.unit_settings.scale_length*1000
 objs=[o for o in scene.objects if o.type=='MESH']
 with zipfile.ZipFile(path) as z:plan=json.loads(z.read('Metadata/printing.json'))
 points=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box];lo=Vector([min(v[k] for v in points) for k in range(3)]);hi=Vector([max(v[k] for v in points) for k in range(3)])
 size=[(hi[k]-lo[k])*scale for k in range(3)];expected=[134,52,4] if path.name.startswith('classic') else [118,40,3.6]
 assert all(abs(a-b)<1e-3 for a,b in zip(size,expected)),size
 parts=[]
 for obj in objs:
  bm=bmesh.new();bm.from_mesh(obj.data);bm.transform(obj.matrix_world)
  volume=bm.calc_volume(signed=True)*scale**3;bad=sum(not e.is_manifold for e in bm.edges);deg=sum(f.calc_area()*scale**2<1e-10 for f in bm.faces)
  assert volume>0 and bad==0 and deg==0,(obj.name,volume,bad,deg)
  item=next(p for p in plan['parts'] if p['name']==obj.name);rgb=[int(item['color'][i:i+2],16)/255 for i in (1,3,5)];linear=[v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4 for v in rgb]
  mat=obj.data.materials[0];assert all(abs(a-b)<1e-5 for a,b in zip(linear,mat.diffuse_color[:3])),(obj.name,'color mismatch')
  pts=[obj.matrix_world@v.co for v in obj.data.vertices];bounds=[[min(v[k] for v in pts)*scale,max(v[k] for v in pts)*scale]for k in range(3)]
  parts.append({'name':obj.name,'volumeMm3':volume,'nonManifold':bad,'degenerate':deg,'color':item['color'],'slot':item['slot'],'boundsMm':bounds});bm.free()
 assert len(parts)==len(plan['parts'])
 contact=None
 if '-B' in path.name:
  core=next(p for p in parts if p['name']=='Plate_Core');skin=next(p for p in parts if p['name']=='Plate_Body')
  assert abs(core['boundsMm'][2][1]-skin['boundsMm'][2][0])<1e-5
  assert core['boundsMm'][:2]==skin['boundsMm'][:2]
  contact={'gapMm':skin['boundsMm'][2][0]-core['boundsMm'][2][1],'skinMm':skin['boundsMm'][2][1]-skin['boundsMm'][2][0],'sameXYFootprint':True,'method':'Same original extrusion, split shared Z plane; full planar contact, no volumetric overlap'}
 report={'file':path.name,'status':'PASS','extension':'official threemf-io 2.7.8 API','sizeMm':size,'parts':parts,'contact':contact,'warnings':list(result.warnings),'images':[]};reports.append(report)
 if os.environ.get('VRC_SAVE_DEMOS')=='1' and path.name.endswith('-default-A.3mf'):
  text=bpy.data.texts.new('README_3MF_SOURCE');text.write('Actual exported 3MF mesh; current reference revision. Official threemf-io import. '+path.name)
  bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'studio/demos'/(path.name.split('-')[0]+'-nagikokoro.blend')))
 # Normalize imported geometry into mm for consistent framing; render only this disposable scene.
 for obj in objs:
  matrix=obj.matrix_world.copy()
  for v in obj.data.vertices:v.co=(matrix@v.co)*scale
  obj.matrix_world.identity()
 center=(lo+hi)*(.5*scale)
 scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
 scene.render.resolution_x=900;scene.render.resolution_y=480;scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG';scene.world=bpy.data.worlds.new('Review World');scene.world.use_nodes=True
 next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.18,.18,.18,1)
 for name,loc,power,sizeLight in [('Key',(20,-40,130),280000,100),('Fill',(-70,50,100),180000,100)]:
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=sizeLight;o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=center+Vector(loc);o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler()
 data=bpy.data.cameras.new('Review Camera');cam=bpy.data.objects.new('Review Camera',data);scene.collection.objects.link(cam);scene.camera=cam;data.type='ORTHO';data.ortho_scale=160
 views={'front':(0,0,180),'perspective':(100,-100,145)}
 if '-default-' in path.name:views.update({'back':(0,0,-180),'side':(0,-180,0),'parts':(80,-80,150),'section':(0,-180,25)})
 for view,direction in views.items():
  cam.location=center+Vector(direction);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
  # True perspective for 45-ish oblique; identical settings for all samples.
  data.type='PERSP' if view=='perspective' else 'ORTHO';data.lens=45
  originals={o.name:[v.co.copy() for v in o.data.vertices] for o in objs};savedMats={}
  if view=='parts':
   for index,o in enumerate(objs):o.location.z=index*2
  if view=='section':
   # Real mesh section via bisect and cap, never an invented proxy.
   for o in objs:
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=(0,center.y,0),plane_no=(0,1,0),clear_outer=True,dist=1e-6)
    edges=[e for e in bm.edges if e.is_boundary]
    if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
    bm.to_mesh(o.data);bm.free()
  image=f'images/{path.stem}-{view}.png';scene.render.filepath=str(out/image);bpy.ops.render.render(write_still=True);report['images'].append({'view':view,'path':image,'source':path.name})
  if view=='section':
   # Last view: geometry is deliberately cut for inspection, do not save as source.
   pass
  for o in objs:o.location.z=0
 (out/'blender-import.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
 print('IMPORTED_RENDERED',path.name,flush=True)
print('ALL_IMPORT_RENDER_PASS',flush=True)
