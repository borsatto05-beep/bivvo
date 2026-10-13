"""Local validation server; mirrors the main CSP from Netlify."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import tomllib, os
root=Path(__file__).resolve().parents[1]
config=tomllib.loads((root/'netlify.toml').read_text())
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(root/'dist'),**kw)
    def do_POST(self):
        self.send_response(204);self.end_headers()
    def end_headers(self):
        headers=config['headers'][0]['values'].copy()
        if self.path.startswith('/ferramentas/embed/'):
            headers.update(next(x['values'] for x in config['headers'] if x['for']=='/ferramentas/embed/*'))
        for k,v in headers.items():
            if v:self.send_header(k,v)
        super().end_headers()
    def log_message(self,*args): pass
if __name__=='__main__':
    ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('BIVVO_TEST_PORT','8765'))),Handler).serve_forever()
