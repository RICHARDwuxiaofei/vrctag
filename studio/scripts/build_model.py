import bpy, bmesh, math, json
from mathutils import Vector
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=0.001
scene.unit_settings.length_unit='MILLIMETERS'
collection=bpy.data.collections.new('VRC_Tag_Original')
scene.collection.children.link(collection)
def solid(name, outer, z0, z1, color, inner=None):
    n=len(outer)
    loops=[outer] if inner is None else [outer,inner]
    verts=[(x,y,z) for z in (z0,z1) for loop in loops for x,y in loop]
    faces=[]
    stride=n*len(loops)
    for i in range(n):
        j=(i+1)%n
        faces.append((i,j,j+stride,i+stride))
        if inner is None:
            pass
        else:
            faces.append((n+j,n+i,n+i+stride,n+j+stride))
            faces.append((i+stride,j+stride,n+j+stride,n+i+stride))
            faces.append((j,i,n+i,n+j))
    if inner is None:
        faces.extend([tuple(reversed(range(n))),tuple(range(n,2*n))])
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    collection.objects.link(obj)
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bmesh.ops.triangulate(bm,faces=list(bm.faces))
    bm.to_mesh(mesh);bm.free()
    mat=bpy.data.materials.new(name+'_Material');mat.diffuse_color=(*color,1)
    mat.use_nodes=True
    node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value=(*color,1)
    node.inputs['Roughness'].default_value=0.65
    mesh.materials.append(mat)
    return obj
def circle(cx,cy,r):
    return [(cx+r*math.cos(2*math.pi*i/96),cy+r*math.sin(2*math.pi*i/96)) for i in range(96)]
capsule=[]
for cx,a0 in [(41,-math.pi/2),(-41,math.pi/2)]:
    capsule.extend([(cx+19*math.cos(a0+math.pi*i/48),19*math.sin(a0+math.pi*i/48)) for i in range(49)])
solid('Plate_Body',capsule,0,3,(0.018,0.038,0.038))
solid('Avatar_Back',circle(-42,0,12),3,3.8,(0.13,0.21,0.22))
solid('Avatar_Frame',circle(-42,0,14),3,4,(0.3,0.43,0.42),circle(-42,0,12))
solid('Status_Dot',circle(-29,-11,2.5),3,4,(0.05,0.8,0.18))
for name,loc in [('Name_Anchor',(-22,4,3)),('Pronouns_Anchor',(-22,-1.5,3)),('Status_Anchor',(-22,-10,3))]:
    obj=bpy.data.objects.new(name,None);collection.objects.link(obj);obj.location=loc;obj.empty_display_size=2
bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects:
    if obj.type=='MESH':obj.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Plate_Body']
bpy.ops.wm.save_as_mainfile(filepath='/home/nagikokoro/CODE/vrctag/studio/vrc-tag-original.blend')
for obj in bpy.context.selected_objects:
    obj.scale=(0.001,0.001,0.001)
bpy.ops.export_scene.gltf(filepath='/home/nagikokoro/CODE/vrctag/web/public/assets/base.glb',use_selection=True,export_format='GLB')
for obj in bpy.context.selected_objects:
    obj.scale=(1,1,1)
report=[]
parts=[]
for obj in collection.objects:
    if obj.type!='MESH':continue
    bm=bmesh.new();bm.from_mesh(obj.data)
    report.append({'name':obj.name,'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'volumeMm3':bm.calc_volume(signed=True),'dimensionsMm':list(obj.dimensions)})
    bm.free()
    parts.append({'name':obj.name,'vertices':[list(v.co) for v in obj.data.vertices],'triangles':[list(p.vertices) for p in obj.data.polygons]})
print('STUDIO_JSON:'+json.dumps({'parts':parts,'validation':report,'layout':{'unit':'millimeter','front':'+Z','size':[120,38,4],'textLeft':-22,'textWidth':72,'textZ':3,'relief':0.8,'textRules':{'alignment':'left','name':{'height':10,'centerY':4,'heightWithPronouns':8,'centerYWithPronouns':7},'pronouns':{'height':3.7,'centerY':-1.5},'status':{'height':4,'centerY':-10.5},'minimumHeight':2.4,'warningHeight':4.5,'maxCharacters':120}}}))

