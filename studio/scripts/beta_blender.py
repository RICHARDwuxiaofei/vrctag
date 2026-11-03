# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Independent background Blender acceptance; never operates the user's live scene.
blender --background --factory-startup --disable-autoexec --python THIS -- --mode check|demo
"""
from pathlib import Path
import sys, json, argparse, hashlib, zipfile, xml.etree.ElementTree as ET
import bpy, bmesh
from mathutils import Vector, Matrix
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from check_styles_blender import check_styles
p = argparse.ArgumentParser(); p.add_argument('--mode', choices=['check','demo'], required=True)
args = p.parse_args(sys.argv[sys.argv.index('--')+1:])
out = ROOT/'studio/evidence/beta-2026-11-04'
catalog = json.loads((ROOT/'web/src/styles.catalog.json').read_text())
def mesh_report(obj):
    bm=bmesh.new();bm.from_mesh(obj.data)
    r={'name':obj.name,'vertices':len(bm.verts),'triangles':len(bm.faces),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'degenerateFaces':sum(f.calc_area()<1e-10 for f in bm.faces),'signedVolume':bm.calc_volume(signed=True)}
    bm.free();return r
def bounds(objects):
    points=[o.matrix_world@Vector(c)for o in objects for c in o.bound_box]
    lo=Vector(tuple(min(v[i]for v in points)for i in range(3)));hi=Vector(tuple(max(v[i]for v in points)for i in range(3)))
    return lo,hi
if args.mode=='check':
    reports=check_styles(str(ROOT),catalog['styles'])
    for style,report in zip(catalog['styles'],reports):
        bpy.ops.wm.open_mainfile(filepath=str(ROOT/'studio'/(style['id']+'.blend')),use_scripts=False)
        base=json.loads((ROOT/'web/public/assets'/style['baseFile']).read_text())
        for part in base['parts']:
            obj=bpy.data.objects[part['name']]
            assert len(obj.data.vertices)==len(part['vertices'])
            assert all(abs(a-b)<1e-6 for v,expected in zip(obj.data.vertices,part['vertices'])for a,b in zip(v.co,expected))
            assert [list(f.vertices)for f in obj.data.polygons]==part['triangles']
        missing=[]
        for datablock in [*bpy.data.images,*bpy.data.fonts,*bpy.data.libraries]:
            path=getattr(datablock,'filepath','')
            if path and not path.startswith('<') and not getattr(datablock,'packed_file',None) and not Path(bpy.path.abspath(path)).exists():missing.append(path)
        assert not missing;report['missingExternalFiles']=missing;report['baseJSONGeometryExact']=True
        # Actual editability/exportability, saving a COPY only in this evidence folder.
        obj=bpy.data.objects['Plate_Body'];previous=obj.data.vertices[0].co.copy();obj.data.vertices[0].co.x+=.01;obj.data.vertices[0].co=previous
        bpy.ops.wm.save_as_mainfile(filepath=str(out/(style['id']+'-reopen-copy.blend')),copy=True)
        bpy.ops.object.select_all(action='DESELECT')
        for o in bpy.context.scene.objects:
            if o.type=='MESH':o.select_set(True)
        selected=[o for o in bpy.context.scene.objects if o.type=='MESH']
        for o in selected:o.scale=(.001,.001,.001)
        bpy.ops.export_scene.gltf(filepath=str(out/(style['id']+'-reopen-export.glb')),use_selection=True,export_format='GLB')
        for o in selected:o.scale=(1,1,1)
        report['editAndExportCopy']='PASS'
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'studio/vrc-tag-original.blend'),use_scripts=False)
    original={'file':'studio/vrc-tag-original.blend','opened':True,'parts':[mesh_report(o)for o in bpy.context.scene.objects if o.type=='MESH']}
    (out/'blender-sources.json').write_text(json.dumps({'formalModels':reports,'historicalOriginal':original},indent=2))
else:
    reports=[]
    for style in catalog['styles']:
        path=out/'samples'/(style['id']+'-default.3mf')
        with zipfile.ZipFile(path)as z:root=ET.fromstring(z.read('3D/3dmodel.model'))
        ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
        resources=root.find('m:resources',ns);materials=resources.find('m:basematerials',ns)
        bpy.ops.wm.read_factory_settings(use_empty=True)
        scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=.001;scene.unit_settings.length_unit='MILLIMETERS'
        assembly=bpy.data.objects.new('3MF_Assembly',None);scene.collection.objects.link(assembly)
        t=list(map(float,root.find('m:build/m:item',ns).attrib['transform'].split()))
        assembly.matrix_world=Matrix(((t[0],t[3],t[6],t[9]),(t[1],t[4],t[7],t[10]),(t[2],t[5],t[8],t[11]),(0,0,0,1)))
        objects=[]
        for resource in resources.findall('m:object',ns):
            mesh=resource.find('m:mesh',ns)
            if mesh is None:continue
            verts=[tuple(float(v.attrib[k])for k in 'xyz')for v in mesh.find('m:vertices',ns)]
            tris=[tuple(int(f.attrib[k])for k in ['v1','v2','v3'])for f in mesh.find('m:triangles',ns)]
            data=bpy.data.meshes.new(resource.attrib['name']);data.from_pydata(verts,[],tris);data.update()
            obj=bpy.data.objects.new(resource.attrib['name'],data);scene.collection.objects.link(obj);obj.parent=assembly;objects.append(obj)
            color=materials[int(resource.attrib['pindex'])].attrib['displaycolor']
            srgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];linear=tuple(v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4 for v in srgb)
            mat=bpy.data.materials.new('Filament_'+resource.attrib['pindex']);mat.diffuse_color=(*linear,1);mat.use_nodes=True
            node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');node.inputs['Base Color'].default_value=(*linear,1);node.inputs['Roughness'].default_value=.72;data.materials.append(mat)
            assert max(abs(a-b)for actual,expected in zip(data.vertices,verts)for a,b in zip(actual.co,expected))<1e-5
            assert [list(f.vertices)for f in data.polygons]==[list(t)for t in tris]
        assert {'Name','Status_Text','Status_Dot'}<={o.name for o in objects}
        bpy.context.view_layer.update();lo,hi=bounds(objects);center=(lo+hi)/2
        assert all(abs(a-b)<1e-4 for a,b in zip(hi-lo,style['layout']['size']))
        camera=bpy.data.objects.new('Camera',bpy.data.cameras.new('Camera'));scene.collection.objects.link(camera);scene.camera=camera
        camera.data.type='ORTHO';camera.data.ortho_scale=style['layout']['size'][1]*3.5;camera.data.clip_end=2000;camera.location=(center.x,center.y,220)
        scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=1200;scene.render.resolution_y=480;scene.render.resolution_percentage=100
        scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True;scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=False
        scene.view_settings.view_transform='Standard'
        note=bpy.data.texts.new('README_3MF_SOURCE');note.write('Actual exported 3MF mesh, not Blender font replacement. Source: '+str(path.relative_to(ROOT))+'\nSHA256: '+hashlib.sha256(path.read_bytes()).hexdigest()+'\nSource assembly positions preserved. No user/avatar image.\nLicenses: see root LICENSE_SCOPE.md; Classic remains CC-BY-NC-SA-4.0 pending design review; Native base CC-BY-4.0; text uses Noto OFL font.\n')
        target=ROOT/'studio/demos'/(style['id']+'-nagikokoro.blend');target.parent.mkdir(exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(target))
        scene.render.filepath=str(out/(style['id']+'-front.png'));bpy.ops.render.render(write_still=True)
        camera.data.type='PERSP';camera.data.lens=52;camera.location=(center.x+30,center.y-45,290);camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.resolution_y=600
        scene.render.filepath=str(out/(style['id']+'-perspective.png'));bpy.ops.render.render(write_still=True)
        reports.append({'styleId':style['id'],'source3mf':str(path.relative_to(ROOT)),'sourceSHA256':hashlib.sha256(path.read_bytes()).hexdigest(),'saved':str(target.relative_to(ROOT)),'dimensions':list(hi-lo),'objects':[mesh_report(o)for o in objects],'exactSerializedMesh':True,'importer':'Project exact-mesh demo importer, not official extension validation'})
        (out/'blender-demos.json').write_text(json.dumps(reports,indent=2))
print('BETA_BLENDER_COMPLETE',args.mode,flush=True)
