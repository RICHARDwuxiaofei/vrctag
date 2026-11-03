# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Independent double-precision closed shell, containment and intersection checks (mm)."""
import math
from collections import defaultdict
EPS=1e-7
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):return math.sqrt(dot(a,a))
def bounds(vs):return [(min(v[k]for v in vs),max(v[k]for v in vs))for k in range(3)]
def overlaps(a,b):return all(x[1]>=y[0]-EPS and y[1]>=x[0]-EPS for x,y in zip(a,b))
def inside_triangle(p,t):
 u,v,w=sub(t[1],t[0]),sub(t[2],t[0]),sub(p,t[0]);uu,uv,vv,wu,wv=dot(u,u),dot(u,v),dot(v,v),dot(w,u),dot(w,v);den=uu*vv-uv*uv
 if abs(den)<1e-20:return False
 a,b=(vv*wu-uv*wv)/den,(uu*wv-uv*wu)/den
 return a>=-EPS and b>=-EPS and a+b<=1+EPS
def intersects(a,b,shared):
 n=cross(sub(a[1],a[0]),sub(a[2],a[0]));nl=norm(n)
 if nl<EPS:return False
 distances=[dot(n,sub(p,a[0]))/nl for p in b]
 if all(d>EPS for d in distances)or all(d<-EPS for d in distances):return False
 if all(abs(d)<EPS for d in distances):
  axis=max(range(3),key=lambda k:abs(n[k]));aa=[tuple(v for k,v in enumerate(p)if k!=axis)for p in a];polygon=[tuple(v for k,v in enumerate(p)if k!=axis)for p in b]
  def orient(p,q,r):return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
  sign=1 if orient(*aa)>0 else -1
  # Separating axes discard disjoint triangulation caps before polygon clipping.
  for polygon_a,polygon_b in[(aa,polygon),(polygon,aa)]:
   direction=1 if orient(*polygon_a)>0 else -1
   for edge in range(3):
    if max(direction*orient(polygon_a[edge],polygon_a[(edge+1)%3],point)for point in polygon_b)<=1e-10:return False
  for i in range(3):
   if not polygon:break
   p,q=aa[i],aa[(i+1)%3];out=[]
   for j,u in enumerate(polygon):
    v=polygon[(j+1)%len(polygon)];du,dv=sign*orient(p,q,u),sign*orient(p,q,v)
    if du>=0:out.append(u)
    if (du>=0)!=(dv>=0):
     t=du/(du-dv);out.append(tuple(u[k]+t*(v[k]-u[k])for k in range(2)))
   polygon=out
  return abs(sum(p[0]*polygon[(i+1)%len(polygon)][1]-p[1]*polygon[(i+1)%len(polygon)][0]for i,p in enumerate(polygon)))>1e-8
 for edges,plane in [(a,b),(b,a)]:
  n=cross(sub(plane[1],plane[0]),sub(plane[2],plane[0]));nl=norm(n)
  for i,u in enumerate(edges):
   v=edges[(i+1)%3];du,dv=dot(n,sub(u,plane[0]))/nl,dot(n,sub(v,plane[0]))/nl
   if (du>EPS and dv>EPS)or(du<-EPS and dv<-EPS)or abs(du-dv)<1e-12:continue
   t=du/(du-dv)
   if t<-EPS or t>1+EPS:continue
   p=tuple(u[k]+t*(v[k]-u[k])for k in range(3))
   if inside_triangle(p,plane)and not any(norm(sub(p,s))<EPS*10 for s in shared):return True
 return False
def contains(p,triangles):
 angle=0
 for tri in triangles:
  a,b,c=[sub(v,p)for v in tri];la,lb,lc=norm(a),norm(b),norm(c)
  angle+=2*math.atan2(dot(a,cross(b,c)),la*lb*lc+dot(a,b)*lc+dot(b,c)*la+dot(c,a)*lb)
 return abs(angle)>2*math.pi
def validate_mesh(vertices,tris):
 r=dict(valid=False,badEdges=0,degenerate=0,volume=0,nonManifoldVertices=0,intersections=0,shells=[],issues=[])
 if not vertices or not tris or any(len(v)!=3 or any(not math.isfinite(x)for x in v)for v in vertices):r['issues'].append('empty/nonfinite mesh');return r
 edges=defaultdict(list);fans=defaultdict(list);parent=list(range(len(tris)));raw=[];boxes=[]
 def root(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for i,t in enumerate(tris):
  if len(t)!=3 or len(set(t))!=3 or any(not isinstance(k,int)or k<0 or k>=len(vertices)for k in t):r['degenerate']+=1;raw.append([]);boxes.append([]);continue
  vs=[vertices[k]for k in t];raw.append(vs);boxes.append(bounds(vs))
  if norm(cross(sub(vs[1],vs[0]),sub(vs[2],vs[0])))<1e-9:r['degenerate']+=1
  for v in t:fans[v].append(i)
  for u,v in zip(t,t[1:]+t[:1]):
   key=tuple(sorted((u,v)))
   if edges[key]:parent[root(i)]=root(edges[key][0][0])
   edges[key].append((i,1 if u<v else -1))
 r['badEdges']=sum(len(e)!=2 or sum(s for _,s in e)!=0 for e in edges.values())
 if r['badEdges']or r['degenerate']:r['issues'].append('open/orientation/degenerate mesh');return r
 neighbors=defaultdict(set)
 for e in edges.values():a,b=[f for f,_ in e];neighbors[a].add(b);neighbors[b].add(a)
 for v,fs in fans.items():
  allowed=set(fs);seen=set();queue=[fs[0]]
  while queue:
   f=queue.pop()
   if f in seen:continue
   seen.add(f);queue.extend(g for g in neighbors[f]if g in allowed and v in tris[g]and g not in seen)
  if len(seen)!=len(fs):r['nonManifoldVertices']+=1
 if r['nonManifoldVertices']:r['issues'].append('disconnected vertex fan');return r
 groups=defaultdict(list)
 for i in range(len(tris)):groups[root(i)].append(i)
 shells=list(groups.values());order=sorted(range(len(tris)),key=lambda i:boxes[i][0][0]);budget=0
 for ii,i in enumerate(order):
  for j in order[ii+1:]:
   if boxes[j][0][0]>boxes[i][0][1]+EPS:break
   if not overlaps(boxes[i],boxes[j]):continue
   shared=[vertices[k]for k in tris[i]if k in tris[j]]
   budget+=1
   if budget>3000000:r['issues'].append('intersection budget exceeded');return r
   if intersects(raw[i],raw[j],shared):r['intersections']+=1;r['issues'].append(f'intersecting triangles {i}/{j}');return r
 shell_boxes=[bounds([v for f in fs for v in raw[f]])for fs in shells]
 for s,fs in enumerate(shells):
  origin=raw[fs[0]][0];volume=sum(dot(sub(raw[f][0],origin),cross(sub(raw[f][1],origin),sub(raw[f][2],origin)))/6 for f in fs);depth=0
  for other,other_fs in enumerate(shells):
   if s==other:continue
   if all(lo-EPS<=v<=hi+EPS for v,(lo,hi)in zip(origin,shell_boxes[other]))and contains(origin,[raw[f]for f in other_fs]):depth+=1
  r['shells'].append(dict(triangles=len(fs),volume=volume,depth=depth));r['volume']+=volume
  if abs(volume)<1e-7 or (1 if volume>0 else -1)!=(1 if depth%2==0 else -1):r['issues'].append(f'shell {s}: orientation at depth {depth}')
 r['valid']=not r['issues']and r['volume']>1e-7
 return r
