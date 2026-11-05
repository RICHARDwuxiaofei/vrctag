# SPDX-License-Identifier: MIT
"""Candidate-only safety gate; does not alter or enable the production generator."""
from pathlib import Path
import json,zipfile,xml.etree.ElementTree as ET,copy
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'evidence/windows-blender-review';ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
def gate(root,thickness):
 parts={o.attrib.get('name'):o for o in root.findall('m:resources/m:object',ns) if o.find('m:mesh',ns)is not None}
 assert 'Plate_Core'in parts and 'Plate_Body'in parts,'missing core or skin'
 core,skin=parts['Plate_Core'],parts['Plate_Body'];assert core.attrib['pindex']=='1' and skin.attrib['pindex']=='0','wrong slot'
 def vertices(o):return [tuple(float(v.attrib[k])for k in 'xyz')for v in o.findall('m:mesh/m:vertices/m:vertex',ns)]
 cv,sv=vertices(core),vertices(skin);cz=[p[2]for p in cv];sz=[p[2]for p in sv]
 assert abs(max(cz)-min(sz))<1e-6,'gap/overlap';assert abs(max(sz)-min(sz)-thickness)<1e-6,'skin thickness'
 assert min(cz)==0 and set(p[:2]for p in cv)==set(p[:2]for p in sv),'footprint'
 assert all(min(float(v.attrib['z'])for v in o.findall('m:mesh/m:vertices/m:vertex',ns))>=max(sz)-1e-6 for name,o in parts.items()if name in ['Name','Pronouns','Status_Text']),'text intersects skin'
 return True
results=[]
for path in sorted((out/'samples').glob('*-B*.3mf')):
 thickness=float(path.stem.rsplit('B',1)[1])
 with zipfile.ZipFile(path)as z:root=ET.fromstring(z.read('3D/3dmodel.model'))
 assert gate(root,thickness);results.append({'file':path.name,'case':'valid','status':'PASS'})
 for mutation in ['missing-skin','gap','overlap','wrong-slot']:
  r=copy.deepcopy(root);skin=next(o for o in r.findall('m:resources/m:object',ns)if o.attrib.get('name')=='Plate_Body')
  if mutation=='missing-skin':r.find('m:resources',ns).remove(skin)
  elif mutation=='wrong-slot':skin.attrib['pindex']='1'
  else:
   delta=.05 if mutation=='gap' else -.05
   for v in skin.findall('m:mesh/m:vertices/m:vertex',ns):v.attrib['z']=str(float(v.attrib['z'])+delta)
  try:gate(r,thickness)
  except AssertionError:results.append({'file':path.name,'case':mutation,'status':'PASS - rejected'})
  else:raise AssertionError('unsafe mutation accepted')
(out/'candidate-regressions.json').write_text(json.dumps(results,indent=2));print(len(results),'candidate gates PASS')
