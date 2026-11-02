"""Independent package, triangle topology, orientation and bounds validation. No slicer claim."""
import json, math, sys, zipfile
from collections import defaultdict
from pathlib import Path
import xml.etree.ElementTree as ET
sys.path.insert(0,str(Path(__file__).resolve().parent))
from mesh_validation import validate_mesh
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
            report=validate_mesh(verts,tris)
            if not report['valid']:raise ValueError(obj.attrib['name']+': '+str(report['issues']))
            parts.append({'name':obj.attrib['name'],'vertices':len(verts),'triangles':len(tris),'volumeMm3':report['volume'],'closedOriented':True,'shells':report['shells'],'bounds':[[min(v[k] for v in verts),max(v[k] for v in verts)] for k in range(3)]})
        for item in root.find('m:build',NS): assert item.attrib['objectid'] in objects
        return {'file':str(path),'status':'PASS','unit':'millimeter','parts':parts,'slicerImport':'NOT_TESTED'}
if __name__=='__main__':
    paths=list(map(Path,sys.argv[1:])) or list(Path('studio/evidence').glob('*.3mf'))
    results=[validate(p) for p in paths]
    Path('studio/evidence/3mf-validation.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results,indent=2))
