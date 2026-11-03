# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Use the unmodified official lib3mf wheel, via PYTHONPATH, to read Beta exports."""
from pathlib import Path
import json,zipfile
import lib3mf
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'studio/evidence/beta-2026-11-04'
w=lib3mf.get_wrapper();results=[]
for path in sorted((out/'samples').glob('*.3mf')):
    model=w.CreateModel();reader=model.QueryReader('3mf');reader.SetStrictModeActive(True);reader.ReadFromFile(str(path))
    with zipfile.ZipFile(path)as z:plan=json.loads(z.read('Metadata/printing.json'))
    parts=[];it=model.GetMeshObjects()
    while it.MoveNext():
        obj=it.GetCurrentMeshObject();pid,prop,has=obj.GetObjectLevelProperty();group=model.GetBaseMaterialGroupByID(pid)
        rgba=group.GetDisplayColor(prop);name=obj.GetName();expected=next(p for p in plan['parts']if p['name']==name)
        actual='#{:02X}{:02X}{:02X}'.format(rgba.Red,rgba.Green,rgba.Blue)
        assert has and actual==expected['color']
        assert obj.IsValid() and obj.IsManifoldAndOriented()
        parts.append({'name':name,'vertices':obj.GetVertexCount(),'triangles':obj.GetTriangleCount(),'valid':True,'manifoldOriented':True,'color':actual,'propertyID':prop,'materialGroup':pid})
    assert len(parts)==len(plan['parts'])
    count=0;it=model.GetBuildItems()
    while it.MoveNext():count+=1;assert it.GetCurrent().GetObjectResource().IsComponentsObject()
    assert count==1 and reader.GetWarningCount()==0
    results.append({'file':path.name,'status':'PASS','warnings':[],'unit':str(model.GetUnit()),'singleAssembly':True,'parts':parts})
    (out/'lib3mf-validation.json').write_text(json.dumps({'version':list(w.GetLibraryVersion()),'source':'3MFConsortium/lib3mf v2.5.0 official Linux wheel','strictMode':True,'results':results},indent=2))
print('Official lib3mf:',len(results),'files PASS')
