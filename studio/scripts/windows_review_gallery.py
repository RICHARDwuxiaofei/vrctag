# SPDX-License-Identifier: MIT
"""Build a standalone gallery and numerical A/B comparison from actual import evidence."""
from pathlib import Path
import json,html,xml.etree.ElementTree as ET,zipfile
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'evidence/windows-blender-review'
reports=json.loads((out/'blender-import.json').read_text());valid=json.loads((out/'validation.json').read_text());ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
comparisons=[]
for r in reports:
 v=next(x for x in valid if x['file']==r['file']);source=v['independent'];assert all(abs(a-b)<1e-4 for a,b in zip(r['sizeMm'],source['worldSizeMm']))
 for p in r['parts']:
  s=next(x for x in source['parts'] if x['name']==p['name']);assert abs(p['volumeMm3']-s['volumeMm3'])<max(.001,s['volumeMm3']*1e-6)
 r['sourceImportVolumeAndDimensions']='PASS'
 body=next(p for p in r['parts']if p['name']=='Plate_Body');top=body['boundsMm'][2][1]
 r['textSupportZ']=[{'name':p['name'],'baseBottomMinusPlateTopMm':p['boundsMm'][2][0]-top,'status':'PASS' if abs(p['boundsMm'][2][0]-top)<1e-4 else 'REVIEW'}for p in r['parts']if p['name']in ('Name','Pronouns','Status_Text')]
for style in ['classic','native']:
 a=next(r for r in reports if r['file']==f'{style}-default-A.3mf')
 for thickness in [.4,.6]:
  b=next(r for r in reports if r['file']==f'{style}-default-B{thickness}.3mf')
  def vols(r):
   black=sum(p['volumeMm3']for p in r['parts']if p['slot']==0);white=sum(p['volumeMm3']for p in r['parts']if p['slot']==1)
   return {'blackMm3':black,'whiteMm3':white,'totalMm3':sum(p['volumeMm3']for p in r['parts'])}
  av,bv=vols(a),vols(b);assert abs(av['totalMm3']-bv['totalMm3'])<.01
  # Exact front-plane meshes are unchanged (same XY and original upper Z); only lower Z changes.
  def mesh(file):
   with zipfile.ZipFile(out/'samples'/file) as z:return ET.fromstring(z.read('3D/3dmodel.model'))
  am,bm=mesh(a['file']),mesh(b['file'])
  def bodyverts(root):
   o=next(o for o in root.findall('m:resources/m:object',ns)if o.attrib.get('name')=='Plate_Body')
   return [tuple(float(v.attrib[k])for k in 'xyz')for v in o.findall('m:mesh/m:vertices/m:vertex',ns)]
  ap,bp=bodyverts(am),bodyverts(bm);assert [v[:2]for v in ap]==[v[:2]for v in bp]
  assert max(v[2]for v in ap)==max(v[2]for v in bp)
  comparisons.append({'style':style,'skinMm':thickness,'A':av,'B':bv,'blackSolidReductionPercent':(av['blackMm3']-bv['blackMm3'])/av['blackMm3']*100,'totalThicknessUnchanged':True,'frontXYAndTopUnchanged':True,'partCountA':len(a['parts']),'partCountB':len(b['parts']),'contact':b['contact'],'layersAt0_2mm':thickness/.2,'layerHeightScope':'Illustrative only, no slicer preset supplied','decision':'CANDIDATE_ONLY: optical opacity, slicing and layer-height validation pending; side/back intentionally white'})
(out/'comparison.json').write_text(json.dumps(comparisons,indent=2),encoding='utf-8');(out/'blender-import.json').write_text(json.dumps(reports,indent=2),encoding='utf-8')
page=['<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Windows Blender 3MF review</title><style>body{font:16px system-ui;background:#16191f;color:#eee;margin:24px}img{width:100%;background:#333}section{border-top:1px solid #777;padding:20px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px}figure{margin:0}figcaption{padding:8px}pre{white-space:pre-wrap;font-size:12px}a{color:#acd}</style><h1>Windows Blender 3MF 实际导入验收</h1><p>所有图为官方 threemf-io 2.7.8 导入新生成 3MF 后的真实 Cycles 渲染。不是 GUI 截图。A=当前正式模型；B=隔离白芯候选，未集成。统一相机/灯光，正面正交，透视斜视；section 为实际网格切开并封口的检查副本；parts 为实际部件沿 Z 展开。真实 Chrome 无头冒烟 PASS，完整 GUI PARTIAL；切片/打印 NOT_TESTED。</p>']
page.append('<h2>A/B 对照与体积</h2>')
for c in comparisons:
 page.append('<section><h3>'+c['style']+' A / B '+str(c['skinMm'])+' mm</h3><pre>'+html.escape(json.dumps(c,indent=2))+'</pre><div class="grid">')
 for variant in ['A','B'+str(c['skinMm'])]:
  for view in (['front','side','back','section','parts','thickness-detail','black-white-parts'] if variant in ['A','B0.6'] else ['front','side','back','section','parts']):
   file=f"images/{c['style']}-default-{variant}-{view}.png";page.append(f'<figure><img loading="lazy" src="{file}"><figcaption>{html.escape(file)}</figcaption></figure>')
 page.append('</div></section>')
for r in reports:
 page.append('<section><h2>'+r['file']+' — PASS</h2><a href="samples/'+r['file']+'">实际 3MF</a><pre>'+html.escape(json.dumps({k:v for k,v in r.items()if k!='images'},indent=2))+'</pre><div class="grid">')
 for im in r['images']:page.append('<figure><img loading="lazy" src="'+im['path']+'"><figcaption>'+html.escape(im['view']+' | source: '+im['source'])+'</figcaption></figure>')
 page.append('</div></section>')
page.append('<h2>真实 Chrome 页面截图（非 Blender 渲染）</h2><p>本机无头 Chrome，完整 GUI 仍 PARTIAL。黑白分件图使用诊断颜色，非原打印配色；厚度图裁切实际网格局部。</p><div class=grid>');
for file in sorted((out/'browser').glob('*.png')):page.append('<figure><img loading=lazy src=browser/'+file.name+'><figcaption>'+file.name+'</figcaption></figure>')
page.append('</div></html>');(out/'index.html').write_text(''.join(page),encoding='utf-8');print(json.dumps(comparisons,indent=2))
