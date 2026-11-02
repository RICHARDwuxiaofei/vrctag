"""Original analytic geometry. Safe-mode-compatible bpy operations; no legacy imports."""
import bpy, bmesh, math

def build_model(project_root):
    scene=bpy.context.scene
    scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=0.001;scene.unit_settings.length_unit='MILLIMETERS'
    previous=bpy.data.collections.get('VRC_Tag_Original')
    if previous:
        for obj in list(previous.objects):bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.collections.remove(previous)
    collection=bpy.data.collections.new('VRC_Tag_Original');scene.collection.children.link(collection)
    def solid(name,outer,z0,z1,color,inner=None):
        n=len(outer);loops=[outer]if inner is None else[outer,inner]
        verts=[(x,y,z)for z in(z0,z1)for loop in loops for x,y in loop];faces=[];stride=n*len(loops)
        for i in range(n):
            j=(i+1)%n;faces.append((i,j,j+stride,i+stride))
            if inner is not None:faces.extend([(n+j,n+i,n+i+stride,n+j+stride),(i+stride,j+stride,n+j+stride,n+i+stride),(j,i,n+i,n+j)])
        if inner is None:faces.extend([tuple(reversed(range(n))),tuple(range(n,2*n))])
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);collection.objects.link(obj)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        mat=bpy.data.materials.new(name+'_Material');mat.diffuse_color=(*color,1);mat.use_nodes=True;node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');node.inputs['Base Color'].default_value=(*color,1);node.inputs['Roughness'].default_value=.65;mesh.materials.append(mat)
        return obj
    def circle(cx,cy,r):return[(cx+r*math.cos(2*math.pi*i/96),cy+r*math.sin(2*math.pi*i/96))for i in range(96)]
    capsule=[]
    for cx,a0 in[(41,-math.pi/2),(-41,math.pi/2)]:capsule.extend([(cx+19*math.cos(a0+math.pi*i/48),19*math.sin(a0+math.pi*i/48))for i in range(49)])
    solid('Plate_Body',capsule,0,3,(.018,.038,.038))
    back=solid('Avatar_Back',circle(-41,0,15),3,3.8,(.13,.21,.22))
    frame=solid('Avatar_Frame',circle(-41,0,16),3,4,(.3,.43,.42),circle(-41,0,15))
    # A matching recess keeps the enlarged status dot from overlapping either avatar solid.
    cutter=solid('Dot_Recess_Tool',circle(-29,-10,3.5),2.8,4.2,(0,0,0))
    for obj in(back,frame):
        modifier=obj.modifiers.new('Status clearance','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
        modifier.solver=next(i.identifier for i in modifier.bl_rna.properties['solver'].enum_items if i.identifier.lower()=='exact')
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    solid('Status_Dot',circle(-29,-10,3.5),3,4,(.05,.8,.18))
    for name,loc in[('Name_Anchor',(-19,4.5,3)),('Pronouns_Anchor',(-19,.5,3)),('Status_Anchor',(-19,-10.5,3))]:
        obj=bpy.data.objects.new(name,None);collection.objects.link(obj);obj.location=loc;obj.empty_display_size=2
    parts=[];report=[]
    for obj in collection.objects:
        if obj.type!='MESH':continue
        bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(obj.data)
        report.append({'name':obj.name,'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'volumeMm3':bm.calc_volume(signed=True),'dimensionsMm':list(obj.dimensions)})
        bm.free();parts.append({'name':obj.name,'vertices':[list(v.co)for v in obj.data.vertices],'triangles':[list(p.vertices)for p in obj.data.polygons]})
    if any(r['nonManifoldEdges']or r['volumeMm3']<=0 for r in report):raise ValueError(str(report))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in collection.objects:
        if obj.type=='MESH':obj.select_set(True)
    bpy.context.view_layer.objects.active=bpy.data.objects['Plate_Body']
    root=project_root.rstrip('/\\')
    bpy.ops.wm.save_as_mainfile(filepath=root+'/studio/vrc-tag-original.blend')
    selected=list(bpy.context.selected_objects)
    try:
        for obj in selected:obj.scale=(.001,.001,.001)
        bpy.ops.export_scene.gltf(filepath=root+'/web/public/assets/base.glb',use_selection=True,export_format='GLB')
    finally:
        for obj in selected:obj.scale=(1,1,1)
    return {'parts':parts,'validation':report,'layout':{'unit':'millimeter','front':'+Z','size':[120,38,4],'textLeft':-19,'textWidth':69,'textZ':3,'relief':.8,'avatar':{'center':[-41,0],'radius':15,'frameWidth':1,'dotCenter':[-29,-10],'dotRadius':3.5},'textRules':{'alignment':'left','name':{'height':10,'centerY':4.5,'heightWithPronouns':9,'centerYWithPronouns':9},'pronouns':{'height':5.2,'centerY':.5},'status':{'height':5,'centerY':-10.5},'minimumHeight':2.4,'warningHeight':4.5,'maxCharacters':120}}}
