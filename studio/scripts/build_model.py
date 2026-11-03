# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""blender --background --python studio/scripts/build_model.py [-- --root /checkout --style classic]
Original geometry only; CLI resets its own background scene. Live MCP calls build_model directly.
"""
from pathlib import Path
import argparse,json,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from model_geometry import build_model
parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);parser.add_argument('--style')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else[])
root=args.root.resolve();source_root=Path(__file__).resolve().parents[2];catalog=json.loads((source_root/'web/src/styles.catalog.json').read_text());available=catalog['styles'];selected=[s for s in available if not args.style or s['id']==args.style]
if not selected:raise ValueError('Unknown style')
import bpy
for style in selected:
    (root/'studio').mkdir(parents=True,exist_ok=True)
    folder=root/'web/public/assets/styles'/style['id'];folder.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    result=build_model(str(root),style);(folder/'base.json').write_text(json.dumps(result),encoding='utf8')
    print(json.dumps({'style':style['id'],'validation':result['validation']},indent=2))

    if style['id']==catalog['defaultStyleId']:
        import shutil
        (root/'web/public/assets/base.json').write_text(json.dumps(result),encoding='utf8')
        shutil.copyfile(folder/'base.glb',root/'web/public/assets/base.glb')
