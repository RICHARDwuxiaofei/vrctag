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
    # External tangents join both end circles. For Native, matched radii\n    # make the upper and lower sides horizontal (no left-to-right taper).
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
    colors=style['colors'];preview_avatar=None
    if g.get('family')=='reference-round-panel':
        # Analytic reconstruction of the user's single-rim reference silhouette.
        # No private reference mesh or text is embedded in runtime assets.
        cx=g['leftCenter'];radius=g['leftRadius'];right=g['rightCenter'];half=g['panelHalfHeight'];rim=g['rimWidth']
        alpha=math.asin(half/radius)
        outer=[(cx+radius*math.cos(a),radius*math.sin(a)) for a in sorted(set([alpha+(2*math.pi-2*alpha)*i/128 for i in range(129)]+[math.pi/2,math.pi,3*math.pi/2]))]
        outer += [(right+half*math.cos(a),half*math.sin(a)) for a in [-math.pi/2+math.pi*i/96 for i in range(97)]]
        # Concave left boundary follows the avatar circle; right end is a semicircle.
        innerHalf=half-rim;angle=math.asin(innerHalf/radius)
        panel=[(cx+radius*math.cos(a),radius*math.sin(a)) for a in [angle-2*angle*i/64 for i in range(65)]]
        panel += [(right+innerHalf*math.cos(a),innerHalf*math.sin(a)) for a in [-math.pi/2+math.pi*i/96 for i in range(97)]]
        core=solid('Plate_Core',outer,0,g['coreTop'],colors['Plate_Core'])
        body=solid('Plate_Body',panel,g['coreTop'],g['bodyTop'],colors['Plate_Body'])
        back=solid('Avatar_Back',circle(cx,0,avatar['radius']),g['coreTop'],g['bodyTop'],colors['Avatar_Back'])
        border=solid('Plate_Rim',outer,g['coreTop'],g['rimTop'],colors['Plate_Rim'])
        for name,shape in [('AvatarHole',circle(cx,0,avatar['radius']+.0001)),('PanelHole',[(30+(x-30)*1.00001,y*1.00001)for x,y in panel])]:
            cutter=solid(name,shape,g['coreTop']-.1,g['rimTop']+.1,'#000000')
            mod=border.modifiers.new('Single rim openings','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
            mod.solver=next(i.identifier for i in mod.bl_rna.properties['solver'].enum_items if i.identifier.lower()=='exact')
            bpy.context.view_layer.objects.active=border;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        # Half-annulus legs touch the top border at Y=half, with no overlap.
        hx=g['hookCenter'];ro=g['hookOuter'];ri=g['hookInner']
        hook=[(hx+ro*math.cos(a),half+ro*math.sin(a))for a in [math.pi*i/64 for i in range(65)]]
        hook += [(hx+ri*math.cos(a),half+ri*math.sin(a))for a in [math.pi-math.pi*i/64 for i in range(65)]]
        solid('Hanging_Loop',hook,0,g['rimTop'],colors['Hanging_Loop'])
        dx,dy=avatar['dotCenter'];solid('Status_Dot',circle(dx,dy,avatar['dotRadius']),g['bodyTop'],g['dotTop'],'#2ed319')
    else:
        solid('Plate_Body',capsule,0,g['bodyTop'],colors['Plate_Body'])
        cx,cy=avatar['center'];radius=avatar['radius'];outer=radius+avatar['frameWidth'];dx,dy=avatar['dotCenter'];dot=avatar['dotRadius']
        back=solid('Avatar_Back',circle(cx,cy,radius),g['bodyTop'],g['avatarTop'],colors['Avatar_Back'])
        frame=solid('Avatar_Frame',circle(cx,cy,outer),g['bodyTop'],g['frameTop'],colors['Avatar_Frame'],circle(cx,cy,radius))
        if math.hypot(dx-cx,dy-cy) < outer+dot:
            cutter=solid('Dot_Recess_Tool',circle(dx,dy,dot),g['bodyTop']-.2,max(g['dotTop'],g['frameTop'])+.2,'#000000')
            for obj in(back,frame):
                modifier=obj.modifiers.new('Status clearance','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
                modifier.solver=next(i.identifier for i in modifier.bl_rna.properties['solver'].enum_items if i.identifier.lower()=='exact')
                bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)
            bpy.data.objects.remove(cutter,do_unlink=True)
        # Keep a photo surface only as preview metadata; it is not a printable part.
        # Boolean caps contain n-gons; Three.js indices require explicit triangles.
        bm=bmesh.new();bm.from_mesh(back.data)
        bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(back.data);bm.free()
        top=max(v.co.z for v in back.data.vertices)
        preview_avatar={'name':'Avatar_Preview','color':colors['Plate_Body'],'vertices':[[v.co.x,v.co.y,g['bodyTop']]for v in back.data.vertices],'triangles':[list(p.vertices)for p in back.data.polygons if all(abs(back.data.vertices[i].co.z-top)<1e-5 for i in p.vertices)]}
        bpy.data.objects.remove(back,do_unlink=True)
        solid('Status_Dot',circle(dx,dy,dot),g['bodyTop'],g['dotTop'],'#2ed319')
        # Attach both hook legs exactly to the capsule's sloped upper tangent.
        nx=(g['leftRadius']-g['rightRadius'])/(g['rightCenter']-g['leftCenter']);ny=math.sqrt(1-nx*nx)
        hx=g['hookCenter'];hy=(g['leftRadius']+nx*g['leftCenter']-nx*hx)/ny
        angles=sorted(set([math.pi*i/64 for i in range(65)]+[math.atan2(ny,-nx)]))
        def hook_point(r,a):
            u=r*math.cos(a);v=r*math.sin(a)
            return (hx+ny*u+nx*v,hy-nx*u+ny*v)
        hook=[hook_point(g['hookOuter'],a)for a in angles]+[hook_point(g['hookInner'],a)for a in reversed(angles)]
        solid('Hanging_Loop',hook,0,g['hookTop'],colors['Hanging_Loop'])
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
    return {'styleId':style['id'],'parts':parts,'validation':report,'colors':colors,'layout':layout,**({'previewAvatar':preview_avatar}if preview_avatar else {})}
