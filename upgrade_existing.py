"""Create colour-assigned copies of existing tags, preserving originals."""
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET
from name_tag_generator import slicer_metadata

ROOT = Path(__file__).resolve().parent.parent
for source in ROOT.glob('*/*.3mf'):
    if source.stem.endswith('_多色'):
        continue
    target = source.with_stem(source.stem + '_多色')
    if target.exists():
        continue
    with zipfile.ZipFile(source) as src:
        root = ET.fromstring(src.read('3D/3dmodel.model'))
        ns = 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'
        ET.register_namespace('', ns)
        ET.SubElement(root, '{'+ns+'}metadata', {'name': 'BambuStudio:3mfVersion'}).text = '1'
        config, project = slicer_metadata(root, source.stem)
        import json
        with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as dst:
            for item in src.infolist():
                if item.filename not in ('3D/3dmodel.model', 'Metadata/model_settings.config', 'Metadata/project_settings.config'):
                    dst.writestr(item, src.read(item.filename))
            dst.writestr('3D/3dmodel.model', ET.tostring(root, encoding='utf-8', xml_declaration=True))
            dst.writestr('Metadata/model_settings.config', config)
            dst.writestr('Metadata/project_settings.config', json.dumps(project))
    print(target)
