"""Optional offline XSD audit using installed lxml and user-supplied official schemas."""
import argparse,json,hashlib,zipfile
from pathlib import Path
from lxml import etree
p=argparse.ArgumentParser();p.add_argument('--core',type=Path,required=True);p.add_argument('--xml',type=Path,required=True);p.add_argument('--directory',type=Path,default=Path(__file__).resolve().parents[1]/'evidence/fixes-2026-11-03');a=p.parse_args()
class Resolver(etree.Resolver):
 def resolve(self,url,pubid,context):
  if url in ['http://www.w3.org/2001/xml.xsd','https://www.w3.org/2001/xml.xsd']:return self.resolve_filename(str(a.xml.resolve()),context)
parser=etree.XMLParser(no_network=True,resolve_entities=False);parser.resolvers.add(Resolver())
# Installed schema compilers expand/reject the official INT_MAX occurrence limit.
# For documents bounded below 1 million total XML nodes, an unbounded repetition
# plus this stricter independent document bound preserves every original maximum.
core=a.core.read_bytes();bounded=core.replace(b'maxOccurs="2147483647"',b'maxOccurs="unbounded"')
schema=etree.XMLSchema(etree.fromstring(bounded,parser));results=[]
for path in sorted(a.directory.glob('*.3mf')):
 with zipfile.ZipFile(path)as z:
  raw=z.read('3D/3dmodel.model');assert b'<!DOCTYPE'not in raw.upper();document=etree.fromstring(raw,parser);assert sum(1 for _ in document.iter())<1000000;valid=schema.validate(document);results.append({'file':path.name,'status':'PASS'if valid else'FAIL','errors':str(schema.error_log)if not valid else''})
report={'source':'3MF Consortium Core specification Appendix B.1.1; spec blob 8bd3d83575ba53b80aa0d83d16c0c7d37c5a3523','coreSchemaSHA256':hashlib.sha256(a.core.read_bytes()).hexdigest(),'xmlSchemaSHA256':hashlib.sha256(a.xml.read_bytes()).hexdigest(),'scope':'Model XML only; INT_MAX repetition compiled as unbounded with separately enforced total XML nodes < 1,000,000 (stricter than every 2,147,483,647 occurrence bound). No other schema normalization. Not slicer certification or full OPC certification. Unmodified-schema compiler run remains BLOCKED.','results':results};(a.directory/'xsd-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps({'files':len(results),'pass':sum(r['status']=='PASS'for r in results),'fail':sum(r['status']=='FAIL'for r in results)},indent=2))
if any(r['status']=='FAIL'for r in results):raise SystemExit(1)
