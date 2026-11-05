# SPDX-License-Identifier: MIT
from pathlib import Path
import http.server,threading,urllib.request,hashlib,json,mimetypes
ROOT=Path(__file__).resolve().parents[2];dist=ROOT/'web/dist';out=ROOT/'evidence/windows-blender-review'
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(dist),**kw)
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
results=[]
try:
 for p in sorted(dist.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(dist).as_posix();req=urllib.request.urlopen(base+'/'+rel);body=req.read();mime=req.headers.get_content_type();sha=hashlib.sha256(body).hexdigest()
  assert req.status==200 and sha==hashlib.sha256(p.read_bytes()).hexdigest()
  if p.suffix=='.js':assert mime in ('text/javascript','application/javascript'),(rel,mime)
  if p.suffix=='.json':assert mime=='application/json',(rel,mime)
  assert p.stat().st_size<=25*1024*1024
  results.append({'path':rel,'status':req.status,'mime':mime,'bytes':len(body),'sha256':sha})
 assert len(results)<20000
 root=urllib.request.urlopen(base+'/');assert root.read()==(dist/'index.html').read_bytes()
 assert any('worker-' in r['path'] for r in results)
 (out/'http-static.json').write_text(json.dumps({'status':'PASS','base':base,'files':results,'browserGUI':'BLOCKED - no browser automation invoked','httpsBlob':'NOT_TESTED'},indent=2),encoding='utf-8')
 print('HTTP_PASS',len(results),'files',max(r['bytes']for r in results))
finally:server.shutdown();server.server_close()
