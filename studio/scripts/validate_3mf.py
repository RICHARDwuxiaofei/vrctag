"""Independent package, triangle topology, orientation and bounds validation. No slicer claim."""
import json, math, sys, zipfile
from collections import defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET
NS={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
def validate(path):
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        content=ET.fromstring(z.read('[Content_Types].xml'))
        rels=ET.fromstring(z.read('_rels/.rels'))
        assert any(r.attrib['Target']=='/3D/3dmodel.model' for r in rels)
        root=ET.fromstring(z.read('3D/3dmodel.model'))
        assert root.attrib['unit']=='millimeter'
        resources=root.find('m:resources',NS)
        objects={o.attrib['id']:o for o in resources.findall('m:object',NS)}
        materials=resources.find('m:basematerials',NS)
        assert materials is not None
        parts=[]
        for oid,obj in objects.items():
            mesh=obj.find('m:mesh',NS)
            if mesh is None:
                for c in obj.find('m:components',NS): assert c.attrib['objectid'] in objects
                continue
            assert obj.attrib['pid']==materials.attrib['id']
            assert 0<=int(obj.attrib['pindex'])<len(materials)
            verts=[tuple(float(v.attrib[k]) for k in 'xyz') for v in mesh.find('m:vertices',NS)]
            assert all(math.isfinite(n) for v in verts for n in v)
            tris=[tuple(int(t.attrib[k]) for k in ['v1','v2','v3']) for t in mesh.find('m:triangles',NS)]
            edges=defaultdict(list); volume=0
            for t in tris:
                assert len(set(t))==3 and all(0<=i<len(verts) for i in t)
                a,b,c=[verts[i] for i in t]
                u=[b[i]-a[i] for i in range(3)];v=[c[i]-a[i] for i in range(3)]
                cross=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
                assert sum(n*n for n in cross)>1e-16
                volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6
                for i,j in zip(t,t[1:]+t[:1]): edges[tuple(sorted((i,j)))].append(1 if i<j else -1)
            assert all(len(e)==2 and sum(e)==0 for e in edges.values())
            assert volume>0
            parts.append({'name':obj.attrib['name'],'vertices':len(verts),'triangles':len(tris),'volumeMm3':volume,'closedOriented':True,'bounds':[[min(v[k] for v in verts),max(v[k] for v in verts)] for k in range(3)]})
        for item in root.find('m:build',NS): assert item.attrib['objectid'] in objects
        return {'file':str(path),'status':'PASS','unit':'millimeter','parts':parts,'slicerImport':'NOT_TESTED'}
if __name__=='__main__':
    paths=list(map(Path,sys.argv[1:])) or list(Path('studio/evidence').glob('*.3mf'))
    results=[validate(p) for p in paths]
    Path('studio/evidence/3mf-validation.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results,indent=2))
