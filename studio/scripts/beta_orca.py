# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Offline Orca acceptance with explicit slicer-side material assignment.
No printer/network connection; portable app and its profiles stay outside the repo.
"""
from pathlib import Path
import argparse,subprocess,os,json,zipfile,xml.etree.ElementTree as ET,re
p=argparse.ArgumentParser();p.add_argument('--app',type=Path,required=True);p.add_argument('--resume',action='store_true');a=p.parse_args()
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'studio/evidence/beta-2026-11-04';dest=out/'orca';dest.mkdir(exist_ok=True)
resource=a.app.resolve().parent/'resources/profiles/Creality'
machine=resource/'machine/Creality K2 Plus 0.4 nozzle.json';process=resource/'process/0.20mm Standard @Creality K2 Plus 0.4 nozzle.json';filament=resource/'filament/Generic PLA @K2 Plus-all.json'
env=dict(os.environ);base=Path('/tmp/vrctag-beta-tools')
for k,folder in [('XDG_CONFIG_HOME','orca-config'),('XDG_CACHE_HOME','orca-cache'),('XDG_DATA_HOME','orca-data')]:env[k]=str(base/folder)
def run(name,args):
 result=subprocess.run([str(a.app.resolve()),'--datadir',str(base/'orca-profile'),*map(str,args)],env=env,capture_output=True,text=True,timeout=120)
 (dest/(name+'.txt')).write_text(result.stdout+result.stderr);assert result.returncode==0,(name,result.returncode,result.stderr)
ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
def meshes(raw):
 root=ET.fromstring(raw);r=[]
 for o in root.findall('m:resources/m:object',ns):
  mesh=o.find('m:mesh',ns)
  if mesh is None:continue
  vertices=[tuple(float(v.attrib[k])for k in 'xyz')for v in mesh.find('m:vertices',ns)]
  triangles=[tuple(int(t.attrib[k])for k in ['v1','v2','v3'])for t in mesh.find('m:triangles',ns)]
  lo=[min(v[k]for v in vertices)for k in range(3)];hi=[max(v[k]for v in vertices)for k in range(3)]
  r.append({'id':o.attrib['id'],'name':o.attrib.get('name'),'v':vertices,'t':triangles,'size':[b-a for a,b in zip(lo,hi)],'lo':lo})
 return r
reports=json.loads((out/'orca-validation.json').read_text())if a.resume and (out/'orca-validation.json').exists()else[]
for sample in sorted(p.stem for p in (out/'samples').glob('*.3mf')):
 style,case=sample.split('-',1)
 if a.resume and any(r['styleId']==style and r['case']==case and (ROOT/r['output']).exists()for r in reports):continue
 source=out/'samples'/(sample+'.3mf');rawproject=base/(sample+'-orca-project.3mf')
 run(sample+'-core-import',['--info',source])
 run(sample+'-core-project',['--load-settings',str(machine)+';'+str(process),'--load-filaments',';'.join([str(filament)]*len(json.loads(zipfile.ZipFile(source).read('Metadata/printing.json'))['palette'])),'--export-3mf',rawproject,source])
 with zipfile.ZipFile(source)as z:original=meshes(z.read('3D/3dmodel.model'));plan=json.loads(z.read('Metadata/printing.json'))
 with zipfile.ZipFile(rawproject)as z:files={n:z.read(n)for n in z.namelist()}
 nodes=[]
 for n,raw in files.items():
  if n.startswith('3D/Objects/')and n.endswith('.model'):nodes.extend(meshes(raw))
 assert len(nodes)==len(original)
 mapping={};matches=[]
 for node in nodes:
  candidates=[m for m in original if len(m['v'])==len(node['v'])and len(m['t'])==len(node['t'])and all(abs(x-y)<1e-4 for x,y in zip(m['size'],node['size']))]
  assert len(candidates)==1,(style,node['id'],'ambiguous geometry')
  match=candidates[0]
  # Orca recenters meshes, but must retain every triangle and normalized vertex.
  assert match['t']==node['t']
  assert max(abs((v[k]-node['lo'][k])-(w[k]-match['lo'][k]))for v,w in zip(node['v'],match['v'])for k in range(3))<1e-4
  mapping[node['id']]=next(p for p in plan['parts']if p['name']==match['name']);matches.append({'orcaMesh':node['id'],'sourcePart':match['name'],'geometryUnchangedApartFromRecentering':True})
 config=ET.fromstring(files['Metadata/model_settings.config']);before=[]
 for part in config.findall('object/part'):
  part_plan=mapping[part.attrib['id']];metadata={n.attrib['key']:n for n in part.findall('metadata')}
  before.append({'part':part_plan['name'],'extruder':metadata.get('extruder').attrib['value']if'extruder'in metadata else'1 (default)'})
  for key,value in [('name',part_plan['name']),('extruder',str(part_plan['slot']+1))]:
   node=metadata.get(key)
   if node is None:node=ET.SubElement(part,'metadata',{'key':key})
   node.set('value',value)
 files['Metadata/model_settings.config']=ET.tostring(config,encoding='utf-8',xml_declaration=True)
 settings=json.loads(files['Metadata/project_settings.config']);settings['filament_colour']=plan['palette']
 n=len(plan['palette'])
 if len(settings.get('flush_volumes_matrix',[]))!=n*n:
  # Retain the stock nominal amounts, just extend the test preset's table size.
  # This is not a material-specific purge calibration or hardware recommendation.
  off=next(v for v in settings['flush_volumes_matrix']if float(v)>0)
  settings['flush_volumes_matrix']=['0'if i==j else off for i in range(n)for j in range(n)]
  settings['flush_volumes_vector']=[settings['flush_volumes_vector'][0]]*(2*n)
 files['Metadata/project_settings.config']=json.dumps(settings).encode()
 mapped=base/(sample+'-orca-assigned.3mf')
 with zipfile.ZipFile(mapped,'w',zipfile.ZIP_DEFLATED)as z:
  for n,raw in files.items():z.writestr(n,raw)
 folder=base/('slice-'+sample);folder.mkdir(exist_ok=True)
 run(sample+'-assigned-slice',['--slice','0','--outputdir',folder,'--export-3mf',sample+'-assigned-sliced.3mf',mapped])
 output=folder/(sample+'-assigned-sliced.3mf');result=json.loads((folder/'result.json').read_text());assert result['return_code']==0
 with zipfile.ZipFile(output)as z:
  gcode=z.read('Metadata/plate_1.gcode').decode();colors=json.loads(z.read('Metadata/project_settings.config'))['filament_colour']
  cfg=ET.fromstring(z.read('Metadata/model_settings.config'));assigned=[]
  for part in cfg.findall('object/part'):
   md={n.attrib['key']:n.attrib['value']for n in part.findall('metadata')};assigned.append({'name':md['name'],'extruder':int(md['extruder'])})
  assert colors==plan['palette']
  assert {(p['name'],p['extruder'])for p in assigned}=={(p['name'],p['slot']+1)for p in plan['parts']}
 tools=sorted(set(int(n)for n in re.findall(r'^T(\d+)\s*$',gcode,re.M)if int(n)<len(plan['palette'])));assert tools==sorted({p['slot']for p in plan['parts']}),tools
 (dest/output.name).write_bytes(output.read_bytes());(dest/(sample+'-result.json')).write_text(json.dumps(result,indent=2))
 (dest/(sample+'-gcode-summary.txt')).write_text('\n'.join(line for line in gcode.splitlines()if any(k in line.lower()for k in ['filament used','total layer','estimated printing','layer_height']))[:16000])
 reports.append({'styleId':style,'case':case,'version':'2.4.2','coreImport':'PASS: actual CLI import and geometry matching','coreAutomaticFilamentMapping':'PARTIAL: Core base materials are not auto-assigned by this Orca version','beforeSlicerAssignment':before,'explicitSlicerAssignment':assigned,'palette':colors,'requiresMoreThanFourAvailableFilaments':len(colors)>4,'flushTable':'Stock nominal values; resized for palette count only; not hardware calibrated','sourceGeometry':matches,'slicing':'PASS: real CLI slicing after explicit slicer-side assignment','gcodeToolIDs':tools,'printerPreset':machine.stem,'processPreset':process.stem,'layerHeight':result['layer_height'],'result':result,'output':str((dest/output.name).relative_to(ROOT)),'guiScreenshots':'NOT_TESTED: display unavailable; CLI evidence only','physicalPrint':'NOT_TESTED'})
 (out/'orca-validation.json').write_text(json.dumps(reports,indent=2));print(sample,'actual mapped slicing PASS; used tool IDs',tools,flush=True)
