"""Read-only source/geometry acceptance; temporary Boolean audits are not saved."""
import bpy,bmesh,itertools

def check_styles(root,styles):
    reports=[]
    for style in styles:
        bpy.ops.wm.open_mainfile(filepath=root+'/studio/'+style['id']+'.blend')
        report={'styleId':style['id'],'reopened':True,'file':bpy.data.filepath,'unitScale':bpy.context.scene.unit_settings.scale_length,'parts':[],'intersections':[]}
        report['anchors']={}
        for name,key in [('Name_Anchor','name'),('Pronouns_Anchor','pronouns'),('Status_Anchor','status')]:
            rule=style['layout']['textRules'][key];expected=[style['layout'].get('statusTextLeft',style['layout']['textLeft']) if name=='Status_Anchor' else style['layout']['textLeft'],rule.get('centerYWithoutPronouns',rule['centerY']),style['layout']['textZ']]
            actual=list(bpy.data.objects[name].location);assert all(abs(a-b)<1e-6 for a,b in zip(actual,expected));report['anchors'][name]=actual
        objects=[o for o in bpy.data.objects if o.type=='MESH']
        assert sorted(o.name for o in objects)==sorted(['Plate_Body','Avatar_Back','Avatar_Frame','Status_Dot']+(['Plate_Rim'] if style['geometry'].get('family')=='medallion-panel' else []))
        assert not any(o.name.startswith('Demo_')for o in bpy.data.objects)
        for obj in objects:
            bm=bmesh.new();bm.from_mesh(obj.data)
            entry={'name':obj.name,'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'volumeMm3':bm.calc_volume(signed=True),'dimensionsMm':list(obj.dimensions)}
            assert entry['nonManifoldEdges']==0 and entry['volumeMm3']>0
            node=next(n for n in obj.data.materials[0].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
            entry['linearBaseColor']=list(node.inputs['Base Color'].default_value)
            if obj.name in style['colors']:
                rgb=[int(style['colors'][obj.name][i:i+2],16)/255 for i in (1,3,5)]
                expected=[v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4 for v in rgb]
                assert all(abs(a-b)<1e-6 for a,b in zip(expected,entry['linearBaseColor']))
            report['parts'].append(entry);bm.free()
        for a,b in itertools.combinations(objects,2):
            copy=a.copy();copy.data=a.data.copy();bpy.context.scene.collection.objects.link(copy)
            modifier=copy.modifiers.new('Audit intersection','BOOLEAN');modifier.operation='INTERSECT';modifier.object=b
            modifier.solver=next(i.identifier for i in modifier.bl_rna.properties['solver'].enum_items if i.identifier.lower()=='exact')
            bpy.context.view_layer.update()
            evaluated=copy.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
            bm=bmesh.new();bm.from_mesh(mesh);volume=abs(bm.calc_volume(signed=True));bm.free();evaluated.to_mesh_clear()
            report['intersections'].append({'a':a.name,'b':b.name,'volumeMm3':volume})
            bpy.data.objects.remove(copy,do_unlink=True)
            assert volume<0.00001
        reports.append(report)
    return reports
