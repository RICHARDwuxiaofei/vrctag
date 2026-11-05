# SPDX-License-Identifier: MIT
"""Independent Windows Core 3MF and official lib3mf audit; evidence only."""
from pathlib import Path
import sys,json,zipfile
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'evidence/windows-blender-review'
sys.path.insert(0,str(ROOT/'studio/scripts'));sys.path.insert(0,str(out/'tools/python'))
from validate_3mf import validate
import lib3mf
w=lib3mf.get_wrapper();results=[]
for path in sorted((out/'samples').glob('*.3mf')):
 r=validate(path)
 model=w.CreateModel();reader=model.QueryReader('3mf');reader.SetStrictModeActive(True);reader.ReadFromFile(str(path))
 with zipfile.ZipFile(path) as z:plan=json.loads(z.read('Metadata/printing.json'))
 it=model.GetMeshObjects();parts=[]
 while it.MoveNext():
  obj=it.GetCurrentMeshObject();pid,prop,has=obj.GetObjectLevelProperty();group=model.GetBaseMaterialGroupByID(pid);c=group.GetDisplayColor(prop);color='#{:02X}{:02X}{:02X}'.format(c.Red,c.Green,c.Blue)
  expected=next(p for p in plan['parts'] if p['name']==obj.GetName())
  assert has and color==expected['color'] and obj.IsValid() and obj.IsManifoldAndOriented()
  parts.append({'name':obj.GetName(),'color':color,'slot':prop})
 assert len(parts)==len(plan['parts']) and reader.GetWarningCount()==0
 it=model.GetBuildItems();count=0
 while it.MoveNext():count+=1;assert it.GetCurrent().GetObjectResource().IsComponentsObject()
 assert count==1
 results.append({'file':path.name,'status':'PASS','independent':r,'lib3mf':{'version':list(w.GetLibraryVersion()),'strict':True,'warnings':0,'parts':parts}})
 (out/'validation.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
 print(path.name,'PASS',flush=True)
