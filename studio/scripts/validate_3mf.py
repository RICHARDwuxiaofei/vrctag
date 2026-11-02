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
        ids=[r.attrib['id'] for r in root.find('m:resources',NS) if 'id'in r.attrib];assert len(ids)==len(set(ids))
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
        identity=[[1.,0,0,0],[0,1.,0,0],[0,0,1.,0],[0,0,0,1.]]
        def matrix(text):
            if not text:return identity
            t=list(map(float,text.split()));assert len(t)==12 and all(math.isfinite(n)for n in t)
            return [[t[0],t[3],t[6],t[9]],[t[1],t[4],t[7],t[10]],[t[2],t[5],t[8],t[11]],[0,0,0,1]]
        def multiply(a,b):return [[sum(a[i][k]*b[k][j] for k in range(4))for j in range(4)]for i in range(4)]
        world=[];leaves=[]
        def walk(oid,transform,ancestors):
            assert oid in objects and oid not in ancestors
            obj=objects[oid];mesh=obj.find('m:mesh',NS)
            if mesh is not None:
                leaves.append(obj.attrib.get('name',oid))
                for v in mesh.find('m:vertices',NS):
                    p=[float(v.attrib[k])for k in 'xyz']+[1]
                    world.append([sum(transform[i][k]*p[k]for k in range(4))for i in range(3)])
            else:
                for component in obj.find('m:components',NS):walk(component.attrib['objectid'],multiply(transform,matrix(component.attrib.get('transform'))),ancestors|{oid})
        build=root.find('m:build',NS);assert len(build)==1,'Studio export requires one assembled build item'
        for item in build:walk(item.attrib['objectid'],matrix(item.attrib.get('transform')),set())
        bounds=[[min(v[k]for v in world),max(v[k]for v in world)]for k in range(3)]
        printing=json.loads(z.read('Metadata/printing.json'))if 'Metadata/printing.json'in z.namelist()else None
        if printing and printing['mode']=='cfs4':assert len(materials)==4 and len(printing['parts'])==len(parts)
        return {'file':str(path),'status':'PASS','unit':'millimeter','parts':parts,'assemblyParts':leaves,'worldBoundsMm':bounds,'worldSizeMm':[b-a for a,b in bounds],'materialEntries':len(materials),'printing':printing,'slicerImport':'NOT_TESTED'}
if __name__=='__main__':
    paths=list(map(Path,sys.argv[1:])) or list(Path('studio/evidence').glob('*.3mf'))
    results=[validate(p) for p in paths]
    Path('studio/evidence/3mf-validation.json').write_text(json.dumps(results,indent=2))
    print(json.dumps(results,indent=2))
