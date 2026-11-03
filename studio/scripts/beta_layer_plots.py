# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Scientific toolpath plots from actual Orca G-code, NOT GUI screenshots."""
from pathlib import Path
import math,re,json,zipfile,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'studio/evidence/beta-2026-11-04';folder=out/'orca'
ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'};pns='{http://schemas.microsoft.com/3dmanufacturing/production/2015/06}'
font=ImageFont.truetype(str(ROOT/'web/public/assets/NotoSansCJKsc-Bold.otf'),22);small=ImageFont.truetype(str(ROOT/'web/public/assets/NotoSansCJKsc-Bold.otf'),16)
def transform(text,v):
 t=list(map(float,text.split()))if text else[1,0,0,0,1,0,0,0,1,0,0,0]
 return tuple(sum(t[j*3+k]*v[j]for j in range(3))+t[9+k]for k in range(3))
reports=[]
for result in json.loads((out/'orca-validation.json').read_text()):
 path=ROOT/result['output'];sample=result['styleId']+'-'+result['case']
 with zipfile.ZipFile(path)as z:
  gcode=z.read('Metadata/plate_1.gcode').decode();root=ET.fromstring(z.read('3D/3dmodel.model'))
  item=root.find('m:build/m:item',ns);obj=next(o for o in root.findall('m:resources/m:object',ns)if o.attrib['id']==item.attrib['objectid']);points=[]
  for c in obj.find('m:components',ns):
   r=ET.fromstring(z.read(c.attrib[pns+'path'].lstrip('/')));m=next(o for o in r.findall('m:resources/m:object',ns)if o.attrib['id']==c.attrib['objectid'])
   for v in m.find('m:mesh/m:vertices',ns):points.append(transform(item.attrib.get('transform'),transform(c.attrib.get('transform'),tuple(float(v.attrib[k])for k in 'xyz'))))
 lo=[min(v[k]for v in points)for k in range(3)];hi=[max(v[k]for v in points)for k in range(3)]
 pose=list(map(float,item.attrib['transform'].split()));angle=math.atan2(pose[1],pose[0]);cs=math.cos(angle);sn=math.sin(angle);wcx=(lo[0]+hi[0])/2;wcy=(lo[1]+hi[1])/2
 def canonical(x,y):return(cs*(x-wcx)+sn*(y-wcy),-sn*(x-wcx)+cs*(y-wcy))
 view=[canonical(v[0],v[1])for v in points];vlo=[min(v[k]for v in view)for k in [0,1]];vhi=[max(v[k]for v in view)for k in [0,1]]
 layers=[];current=None;x=y=e=0.;tool=0;relative_e=True;relative_xy=False
 for line in gcode.splitlines():
  if line.startswith(';Z:'):
   current={'z':float(line[3:]),'segments':[]};layers.append(current);continue
  code=line.split(';')[0].strip()
  if re.fullmatch(r'T[0-3]',code):tool=int(code[1:]);continue
  if code=='M83':relative_e=True
  if code=='M82':relative_e=False
  if code=='G91':relative_xy=True
  if code=='G90':relative_xy=False
  vals={k:float(v)for k,v in re.findall(r'([XYZ EIJR])\s*([-+]?(?:\d+(?:\.\d*)?|\.\d+))',code)}
  if code.startswith('G92'):
   e=vals.get('E',e);continue
  if not re.match(r'^G[0123]\s',code):continue
  nx=(x+vals.get('X',0)if relative_xy else vals.get('X',x));ny=(y+vals.get('Y',0)if relative_xy else vals.get('Y',y))
  de=vals.get('E',0)if relative_e else vals.get('E',e)-e
  if current is not None and de>0:
   path=[(x,y),(nx,ny)]
   if re.match(r'^G[23]\s',code):
    assert 'R'not in vals, 'Radius-mode arcs require another parser'
    cx=x+vals.get('I',0);cy=y+vals.get('J',0);r=math.hypot(x-cx,y-cy)
    start=math.atan2(y-cy,x-cx);end=math.atan2(ny-cy,nx-cx)
    sweep=(end-start)%(2*math.pi)if code.startswith('G3 ')else-((start-end)%(2*math.pi))
    if abs(sweep)<1e-10:sweep=2*math.pi if code.startswith('G3 ')else-2*math.pi
    count=max(2,min(4096,math.ceil(abs(sweep)*r/.15)))
    path=[(cx+r*math.cos(start+sweep*i/count),cy+r*math.sin(start+sweep*i/count))for i in range(count+1)];path[0]=(x,y);path[-1]=(nx,ny)
   for (ax,ay),(bx,by)in zip(path,path[1:]):
    if all(lo[k]-1<=v<=hi[k]+1 for k,v in [(0,ax),(0,bx),(1,ay),(1,by)]):current['segments'].append((ax,ay,bx,by,tool))
  if 'E'in vals:e=vals['E']if not relative_e else e+vals['E']
  x,y=nx,ny
 assert layers and all(layer['segments']for layer in layers)
 body=2.6 if result['styleId']=='classic'else 2.8
 indices=list(dict.fromkeys([0,min(range(len(layers)),key=lambda i:abs(layers[i]['z']-(body-.2))),min(range(len(layers)),key=lambda i:abs(layers[i]['z']-(body+.2))),len(layers)-1]))
 image=Image.new('RGB',(1200,1000),'#1b1d22');draw=ImageDraw.Draw(image);draw.text((25,15),sample+' | actual Orca 2.4.2 sliced extrusion paths',font=font,fill='white')
 for n,index in enumerate(indices):
  layer=layers[index];ox=(n%2)*600;oy=65+(n//2)*430
  draw.text((ox+20,oy),f"Layer {index+1}/{len(layers)} | Z {layer['z']:.2f} mm",font=font,fill='white')
  scale=min(550/(vhi[0]-vlo[0]),330/(vhi[1]-vlo[1]));cx=ox+300;cy=oy+210
  for x1,y1,x2,y2,t in layer['segments']:
   a,b=canonical(x1,y1),canonical(x2,y2)
   coords=(cx+(a[0]-(vhi[0]+vlo[0])/2)*scale,cy-(a[1]-(vhi[1]+vlo[1])/2)*scale,cx+(b[0]-(vhi[0]+vlo[0])/2)*scale,cy-(b[1]-(vhi[1]+vlo[1])/2)*scale)
   draw.line(coords,fill=result['palette'][t],width=max(1,round(.42*scale)))
 draw.text((25,940),'Derived CLI evidence, not an Orca GUI screenshot. View aligned to model; travel/purge tower omitted.',font=small,fill='#c4c6ce')
 draw.text((25,968),'Preset: Creality K2 Plus 0.4 / 0.20 mm. Offline test only; no printer connection or physical print.',font=small,fill='#c4c6ce')
 image.save(folder/(sample+'-layers.png'))
 reports.append({'sample':sample,'actualLayers':len(layers),'shownLayers':[{'index':i+1,'z':layers[i]['z'],'segments':len(layers[i]['segments'])}for i in indices],'plot':'Actual extrusion centerlines at nominal line width; not GUI/hardware certification','viewRotationDegrees':-math.degrees(angle),'objectBoundsMm':[lo,hi]})
(out/'layer-plots.json').write_text(json.dumps(reports,indent=2));print('Rendered',len(reports),'actual G-code layer plots')
