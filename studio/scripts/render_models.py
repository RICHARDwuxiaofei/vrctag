"""Optional Blender CLI evidence renderer; prepare validated demo JSON with npm test first.
blender --background --python studio/scripts/render_models.py [-- --style classic]
Demo geometry is never saved to model sources. CLI clean shutdown remains environment-dependent.
"""
from pathlib import Path
import argparse,json,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import bpy
from render_styles import prepare_camera,render_design
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--style');a=p.parse_args(sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else[])
catalog=json.loads((root/'web/src/styles.catalog.json').read_text())
styles=[s for s in catalog['styles']if not a.style or s['id']==a.style]
if not styles:raise ValueError('Unknown style')
for style in styles:
    bpy.ops.wm.open_mainfile(filepath=str(root/'studio'/(style['id']+'.blend')))
    prepare_camera(style,str(root),save_source=False,normalized=True)
    for variant in ['default','friend-pronouns']:
        design=json.loads((root/'studio/evidence/classic-large-avatar-2026-11-03'/(style['id']+'-'+variant+'-design.json')).read_text())
        render_design(style,str(root),design,variant)
    print('Saved views:',style['id'])
