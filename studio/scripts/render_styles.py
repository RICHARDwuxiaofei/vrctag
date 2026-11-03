"""Reproducible neutral Blender evidence. Demo text is never saved into editable sources."""
import bpy, math
from mathutils import Vector

def prepare_camera(style, root, save_source=True, normalized=False):
    scene=bpy.context.scene
    scene.render.engine='BLENDER_WORKBENCH'
    scene.render.resolution_x=1200;scene.render.resolution_y=480;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
    scene.view_settings.view_transform='Standard';scene.view_settings.exposure=0;scene.view_settings.gamma=1
    shading=scene.display.shading;shading.light='STUDIO';shading.color_type='MATERIAL'
    shading.show_shadows=False;shading.show_cavity=True;shading.cavity_type='BOTH'
    camera=scene.camera
    if camera is None:
        camera=bpy.data.objects.new('Camera',bpy.data.cameras.new('Camera'));scene.collection.objects.link(camera);scene.camera=camera
    camera.rotation_mode='XYZ'
    camera.data.type='ORTHO';camera.data.ortho_scale=style['layout']['size'][1]*3.5 if normalized else style['layout']['size'][0]*1.17;camera.data.clip_end=2000
    camera.location=(0,0,220);camera.rotation_euler=(0,0,0)
    # Set the saved viewport to the same front and material-colored appearance.
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                space=area.spaces.active;space.shading.type='SOLID';space.shading.color_type='MATERIAL';space.shading.light='STUDIO'
                space.region_3d.view_rotation=(1,0,0,0);space.region_3d.view_distance=150;space.region_3d.view_location=(0,0,0)
    if save_source:bpy.ops.wm.save_as_mainfile(filepath=root+'/studio/'+style['id']+'.blend')
    scene.render.filepath=root+'/web/public/assets/styles/'+style['id']+'/front.png';bpy.ops.render.render(write_still=True)

def render_design(style,root,design,variant,folder=None):
    scene=bpy.context.scene;camera=scene.camera
    demo=bpy.data.collections.new('Temporary_Dynamic_Text');scene.collection.children.link(demo)
    for part in design['parts']:
        if part['name'] not in ['Name','Pronouns','Status_Text']:continue
        mesh=bpy.data.meshes.new('Demo_'+part['name']);mesh.from_pydata(part['vertices'],[],part['triangles']);mesh.update()
        obj=bpy.data.objects.new(mesh.name,mesh);demo.objects.link(obj)
        rgb=[int(part['color'][i:i+2],16)/255 for i in (1,3,5)]
        linear=tuple(v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4 for v in rgb)
        mat=bpy.data.materials.new(mesh.name);mat.diffuse_color=(*linear,1);mesh.materials.append(mat)
    folder=folder or root+'/studio/evidence/classic-large-avatar-2026-11-03/'
    scene.render.resolution_y=480
    camera.data.type='ORTHO';camera.location=(0,0,220);camera.rotation_euler=(0,0,0)
    scene.render.filepath=folder+style['id']+'-'+variant+'-front.png';bpy.ops.render.render(write_still=True)
    if variant=='default':
        scene.render.resolution_y=600
        camera.data.type='PERSP';camera.data.lens=52;camera.location=(30,-45,290);camera.rotation_euler=(Vector((0,0,1.5))-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath=folder+style['id']+'-'+variant+'-perspective.png';bpy.ops.render.render(write_still=True)
    for obj in list(demo.objects):bpy.data.objects.remove(obj,do_unlink=True)
    bpy.data.collections.remove(demo)
