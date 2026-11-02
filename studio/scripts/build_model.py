"""blender --background --python studio/scripts/build_model.py [-- --root /checkout]
Paths default to this script's checkout, independent of cwd. Requires Blender Python.
"""
from pathlib import Path
import argparse,json,sys
from model_geometry import build_model
parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else[])
root=args.root.resolve();(root/'studio').mkdir(exist_ok=True);(root/'web/public/assets').mkdir(parents=True,exist_ok=True)
result=build_model(str(root));(root/'web/public/assets/base.json').write_text(json.dumps(result),encoding='utf8')
print(json.dumps(result['validation'],indent=2))
