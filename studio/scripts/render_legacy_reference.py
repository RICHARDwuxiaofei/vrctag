"""REFERENCE ONLY: render the preserved legacy template without saving or exporting it.
Its render remains subject to WiseWolf attribution/CC BY-NC-SA 4.0. Never use
these objects, vertices or rendered pixels as input to the production builder.
Run in a separate Blender session; this opens a different file.
"""
from pathlib import Path
import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
out = root / 'studio/evidence/classic-large-avatar-2026-11-03/reference'
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / 'nametag_template.blend'), load_ui=False, use_scripts=False)
s = bpy.context.scene
s.render.engine = 'BLENDER_WORKBENCH'
s.render.resolution_x = 1200
s.render.resolution_y = 480
s.render.resolution_percentage = 100
s.render.image_settings.file_format = 'PNG'
s.render.film_transparent = True
s.view_settings.view_transform = 'Standard'
s.view_settings.exposure = 0
s.view_settings.gamma = 1
s.display.shading.light = 'STUDIO'
s.display.shading.color_type = 'MATERIAL'
s.display.shading.show_shadows = False
s.display.shading.show_cavity = True
white = bpy.data.materials.new('Reference_White')
white.diffuse_color = (.85, .85, .85, 1)
bpy.data.objects['White_Rim'].data.materials.append(white)
camera = bpy.data.objects.new('Reference_Camera', bpy.data.cameras.new('Reference_Camera'))
s.collection.objects.link(camera)
s.camera = camera
# Coarse source bounds are used ONLY to frame this reference image.
points = [o.matrix_world @ Vector(c) for o in s.objects if o.type == 'MESH' for c in o.bound_box]
lo = Vector(tuple(min(v[k] for v in points) for k in range(3)))
hi = Vector(tuple(max(v[k] for v in points) for k in range(3)))
center = (lo + hi) / 2
camera.data.type = 'ORTHO'
camera.data.ortho_scale = (hi.y - lo.y) * 3.5
camera.data.clip_end = 2000
camera.location = (center.x, center.y, 220)
camera.rotation_euler = (0, 0, 0)
s.render.filepath = str(out / 'legacy-template-front.png')
bpy.ops.render.render(write_still=True)
camera.data.type = 'PERSP'
camera.data.lens = 52
camera.location = (center.x + 30, center.y - 50, 285)
camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
s.render.resolution_y = 600
s.render.filepath = str(out / 'legacy-template-perspective.png')
bpy.ops.render.render(write_still=True)
print('Reference renders only; original template was not saved or exported.')
