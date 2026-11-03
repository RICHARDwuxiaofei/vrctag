# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Independent actual-3MF support/contact screening, separate from mesh validity."""
from pathlib import Path
import json,zipfile,xml.etree.ElementTree as ET
from validate_3mf import validate,NS
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'studio/evidence/beta-2026-11-04';results=[]
def xy_inside(x,y,tri):
    vals=[(tri[(i+1)%3][0]-a[0])*(y-a[1])-(tri[(i+1)%3][1]-a[1])*(x-a[0])for i,a in enumerate(tri)]
    return all(v>=-1e-5 for v in vals)or all(v<=1e-5 for v in vals)
for path in sorted((out/'samples').glob('*.3mf')):
    report=validate(path)
    with zipfile.ZipFile(path)as z:root=ET.fromstring(z.read('3D/3dmodel.model'))
    parts={}
    for obj in root.findall('m:resources/m:object',NS):
        mesh=obj.find('m:mesh',NS)
        if mesh is None:continue
        v=[tuple(float(p.attrib[k])for k in 'xyz')for p in mesh.find('m:vertices',NS)]
        t=[tuple(int(p.attrib[k])for k in ['v1','v2','v3'])for p in mesh.find('m:triangles',NS)]
        parts[obj.attrib['name']]={'v':v,'t':t,'bounds':[(min(p[k]for p in v),max(p[k]for p in v))for k in range(3)]}
    body=parts['Plate_Body'];front=body['bounds'][2][1]
    support=[]
    for t in body['t']:
        tri=[body['v'][i]for i in t]
        if all(abs(v[2]-front)<1e-6 for v in tri):support.append(tri)
    textnames=[name for name in ['Name','Pronouns','Status_Text']if name in parts];contacts=[]
    for name in textnames:
        p=parts[name];assert abs(p['bounds'][2][0]-front)<1e-6
        probes=[v for v in p['v']if abs(v[2]-front)<1e-6]
        for t in p['t']:
            tri=[p['v'][i]for i in t]
            if all(abs(v[2]-front)<1e-6 for v in tri):
                probes.append(tuple(sum(v[k]for v in tri)/3 for k in range(3)))
                probes.extend(tuple((tri[i][k]+tri[(i+1)%3][k])/2 for k in range(3))for i in range(3))
        for x,y,z in probes:assert any(xy_inside(x,y,tri)for tri in support),(path.name,name,x,y,'unsupported text')
        contacts.append({'part':name,'bottomZ':p['bounds'][2][0],'supportTopZ':front,'sampledVerticesCentroidsAndEdgeMidpoints':len(probes),'status':'PASS'})
    clearance=[]
    for i,name in enumerate(textnames):
        for other in textnames[i+1:]+['Status_Dot','Avatar_Frame']:
            a=parts[name]['bounds'];b=parts[other]['bounds']
            gap=max(max(a[k][0]-b[k][1],b[k][0]-a[k][1])for k in [0,1])
            assert gap>0,(path.name,name,other,'overlapping text/component bands')
            clearance.append({'a':name,'b':other,'axisSeparationMm':gap})
    report['textSupport']=contacts;report['textComponentClearance']=clearance
    report['supportScope']='Exact bottom contact plus dense top-footprint sampling; not minimum-wall or layer-adhesion certification'
    results.append(report);(out/'independent-print-audit.json').write_text(json.dumps(results,indent=2));print(path.name,'PASS',flush=True)
