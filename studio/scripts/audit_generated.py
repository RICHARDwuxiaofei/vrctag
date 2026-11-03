"""Bounded, resumable independent audits. Shard to keep each local run short."""
import argparse,json
from pathlib import Path
from validate_3mf import validate
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--offset',type=int,default=0);p.add_argument('--stride',type=int,default=1);p.add_argument('--directory',type=Path,default=root/'studio/evidence/fixes-2026-11-03');a=p.parse_args()
out=a.directory.resolve();results=[]
for path in sorted(out.glob('*.3mf'))[a.offset::a.stride]:
 try:
  r=validate(path);r['file']=str(path.relative_to(root))
  import zipfile
  with zipfile.ZipFile(path)as z:meta=json.loads(z.read('Metadata/design.json'))
  if 'styleId'in meta:
   catalog=json.loads((root/'web/src/styles.catalog.json').read_text());profile=next(s for s in catalog['styles']if s['id']==meta['styleId'])
   assert all(abs(actual-expected)<1e-5 for actual,expected in zip(r['worldSizeMm'],profile['layout']['size'])),'Style dimensions mismatch'
   r['styleId']=meta['styleId']
 except Exception as e:r={'file':str(path.relative_to(root)),'status':'FAIL','error':str(e)}
 results.append(r);(out/f'independent-shard-{a.offset}.json').write_text(json.dumps(results,indent=2));print(path.name,r['status'],flush=True)
if any(r['status']!='PASS'for r in results):raise SystemExit(1)
