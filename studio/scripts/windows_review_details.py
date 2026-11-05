# SPDX-License-Identifier: MIT
"""Additional actual imported-mesh material isolation and thickness renders."""
exec(open('studio/scripts/windows_blender_review.py',encoding='utf-8-sig').read().split('reports=[];')[0])
for style in ['classic','native']:
 for variant in ['A','B0.6']:
  path=out/'samples'/f'{style}-default-{variant}.3mf';bpy.ops.wm.read_factory_settings(use_empty=True)
  import_3mf(str(path),scene_unit='FILE',import_materials='MATERIALS',reuse_materials=False)
  scene=bpy.context.scene;factor=scene.unit_settings.scale_length*1000;objs=[o for o in scene.objects if o.type=='MESH']
  for o in objs:
   matrix=o.matrix_world.copy()
   for v in o.data.vertices:v.co=(matrix@v.co)*factor
   o.matrix_world.identity()
  pts=[v.co for o in objs for v in o.data.vertices];center=Vector([(max(v[k]for v in pts)+min(v[k]for v in pts))/2 for k in range(3)])
  scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.resolution_x=1100;scene.render.resolution_y=550;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
  scene.world=bpy.data.worlds.new('world');scene.world.use_nodes=True;next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.25,.25,.25,1)
  light=bpy.data.lights.new('Area','AREA');light.energy=300000;light.size=100;lamp=bpy.data.objects.new('Area',light);scene.collection.objects.link(lamp);lamp.location=center+Vector((0,-60,130));lamp.rotation_euler=(center-lamp.location).to_track_quat('-Z','Y').to_euler()
  data=bpy.data.cameras.new('camera');cam=bpy.data.objects.new('camera',data);scene.collection.objects.link(cam);scene.camera=cam;data.type='ORTHO'
  for view in ['thickness-detail','black-white-parts']:
   if view=='thickness-detail':
    cam.location=center+Vector((0,-180,8));data.ortho_scale=40
   else:
    cam.location=center+Vector((70,-90,140));data.ortho_scale=160
    for i,o in enumerate(objs):
     o.location.z=i*2
     mat=o.data.materials[0];node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');node.inputs['Base Color'].default_value=(.005,.005,.005,1)if o.name in ['Plate_Body','Avatar_Back']else(.9,.9,.9,1)
   cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/'images'/f'{style}-default-{variant}-{view}.png');bpy.ops.render.render(write_still=True)
print('DETAIL_RENDER_PASS')
