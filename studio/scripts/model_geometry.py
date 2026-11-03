# SPDX-License-Identifier: MIT
# Copyright (c) 2026 RICHARDwuxiaofei
"""Original style-driven analytic solids; no legacy imports. sRGB palette is shared with web."""
import bpy, bmesh, math

def build_model(project_root, style):
    scene=bpy.context.scene
    scene.unit_settings.system='METRIC'
    scene.unit_settings.scale_length=0.001
    scene.unit_settings.length_unit='MILLIMETERS'
    for name in ['VRC_Tag_Original','VRC_Tag_Style']:
        previous=bpy.data.collections.get(name)
        if previous:
            for obj in list(previous.objects):bpy.data.objects.remove(obj,do_unlink=True)
            bpy.data.collections.remove(previous)
    collection=bpy.data.collections.new('VRC_Tag_Style')
    scene.collection.children.link(collection)
    layout=style['layout'];g=style['geometry'];avatar=layout['avatar']
    def linear_color(value):
        rgb=[int(value[i:i+2],16)/255 for i in (1,3,5)]
        return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)
    def solid(name,outer,z0,z1,hex_color,inner=None):
        n=len(outer);loops=[outer]if inner is None else[outer,inner]
        verts=[(x,y,z)for z in(z0,z1)for loop in loops for x,y in loop];faces=[];stride=n*len(loops)
        for i in range(n):
            j=(i+1)%n;faces.append((i,j,j+stride,i+stride))
            if inner is not None:faces.extend([(n+j,n+i,n+i+stride,n+j+stride),(i+stride,j+stride,n+j+stride,n+i+stride),(j,i,n+i,n+j)])
        if inner is None:faces.extend([tuple(reversed(range(n))),tuple(range(n,2*n))])
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);collection.objects.link(obj)
        bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
        color=linear_color(hex_color);mat=bpy.data.materials.new(style['id']+'_'+name+'_Material');mat.diffuse_color=(*color,1);mat.use_nodes=True
        node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');node.inputs['Base Color'].default_value=(*color,1);node.inputs['Roughness'].default_value=.72;mesh.materials.append(mat)
        return obj
    def circle(cx,cy,r):return[(cx+r*math.cos(2*math.pi*i/96),cy+r*math.sin(2*math.pi*i/96))for i in range(96)]
    # Common external tangents join unequal end circles without a sharp shoulder.
    lc,rc,lr,rr=[g[k] for k in ('leftCenter','rightCenter','leftRadius','rightRadius')]
    theta=math.acos((lr-rr)/(rc-lc))
    capsule=[]
    for cx,r,a0,sweep in [(rc,rr,-theta,2*theta),(lc,lr,theta,2*math.pi-2*theta)]:
        angles=[a0+sweep*i/48 for i in range(49)]
        angles+= [a for a in [0,math.pi/2,math.pi,3*math.pi/2,2*math.pi] if a0<a<a0+sweep]
        capsule.extend([(cx+r*math.cos(a),r*math.sin(a))for a in sorted(set(angles))])
    clean=[]
    for p in capsule:
        if not clean or math.dist(p,clean[-1])>1e-7:clean.append(p)
    if math.dist(clean[0],clean[-1])<1e-7:clean.pop()
    capsule=clean
    colors=style['colors']
    if g.get('family')=='medallion-panel':
        # Independently chosen circle-and-rectangular-shoulder outline. Never imports a reference mesh.
        def shoulder(inset):
            radius=g['leftRadius']-inset;half=g['panelHalfHeight']-inset
            corner=g['rightRadius']-inset;right=g['rightEdge']-inset
            alpha=math.asin(half/radius)
            angles=sorted([alpha+(2*math.pi-2*alpha)*i/96 for i in range(97)]+[math.pi/2,math.pi,3*math.pi/2])
            angles=[a for i,a in enumerate(angles) if i==0 or abs(a-angles[i-1])>1e-9]
            path=[(g['leftCenter']+radius*math.cos(a),radius*math.sin(a)) for a in angles]
            for cy,start in [(-half+corner,-math.pi/2),(half-corner,0)]:
                path.extend([(right-corner+corner*math.cos(start+math.pi/2*i/24),cy+corner*math.sin(start+math.pi/2*i/24)) for i in range(25)])
            return path
        outer=shoulder(0);inside=shoulder(g['rimWidth'])
        solid('Plate_Rim',outer,0,g['rimTop'],colors['Plate_Rim'],inside)
        capsule=inside
    solid('Plate_Body',capsule,0,g['bodyTop'],colors['Plate_Body'])
    cx,cy=avatar['center'];radius=avatar['radius'];outer=radius+avatar['frameWidth'];dx,dy=avatar['dotCenter'];dot=avatar['dotRadius']
    back=solid('Avatar_Back',circle(cx,cy,radius),g['bodyTop'],g['avatarTop'],colors['Avatar_Back'])
    frame=solid('Avatar_Frame',circle(cx,cy,outer),g['bodyTop'],g['frameTop'],colors['Avatar_Frame'],circle(cx,cy,radius))
    # No-op for the classic disjoint dot; subtract only when circles actually intersect.
    if math.hypot(dx-cx,dy-cy) < outer+dot:
        cutter=solid('Dot_Recess_Tool',circle(dx,dy,dot),g['bodyTop']-.2,max(g['dotTop'],g['frameTop'])+.2,'#000000')
        for obj in(back,frame):
            modifier=obj.modifiers.new('Status clearance','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
            modifier.solver=next(i.identifier for i in modifier.bl_rna.properties['solver'].enum_items if i.identifier.lower()=='exact')
            bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
    solid('Status_Dot',circle(dx,dy,dot),g['bodyTop'],g['dotTop'],'#2ed319')
    for name,rule in [('Name_Anchor',layout['textRules']['name']),('Pronouns_Anchor',layout['textRules']['pronouns']),('Status_Anchor',layout['textRules']['status'])]:
        obj=bpy.data.objects.new(name,None);collection.objects.link(obj);obj.location=(layout.get('statusTextLeft',layout['textLeft']) if name=='Status_Anchor' else layout['textLeft'],rule.get('centerYWithoutPronouns',rule['centerY']),layout['textZ']);obj.empty_display_size=2
    parts=[];report=[]
    for obj in collection.objects:
        if obj.type!='MESH':continue
        bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(obj.data)
        report.append({'name':obj.name,'degenerateFaces':sum(f.calc_area()<1e-10 for f in bm.faces),'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'volumeMm3':bm.calc_volume(signed=True),'dimensionsMm':list(obj.dimensions)})
        bm.free();parts.append({'name':obj.name,'vertices':[list(v.co)for v in obj.data.vertices],'triangles':[list(p.vertices)for p in obj.data.polygons]})
    if any(r['degenerateFaces']or r['nonManifoldEdges']or r['volumeMm3']<=0 for r in report):raise ValueError(str(report))
    bpy.ops.object.select_all(action='DESELECT')
    for obj in collection.objects:
        if obj.type=='MESH':obj.select_set(True)
    bpy.context.view_layer.objects.active=bpy.data.objects['Plate_Body']
    root=project_root.rstrip('/\\')
    bpy.ops.wm.save_as_mainfile(filepath=root+'/studio/'+style['id']+'.blend')
    selected=[o for o in collection.objects if o.type=='MESH']
    try:
        for obj in selected:obj.scale=(.001,.001,.001)
        bpy.ops.export_scene.gltf(filepath=root+'/web/public/assets/styles/'+style['id']+'/base.glb',use_selection=True,export_format='GLB')
    finally:
        for obj in selected:obj.scale=(1,1,1)
    return {'styleId':style['id'],'parts':parts,'validation':report,'colors':colors,'layout':layout}
