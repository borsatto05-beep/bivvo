from pathlib import Path
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET, json
from PIL import Image

root=Path(__file__).resolve().parents[1]
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[x.text.strip() for x in ET.parse(root/'sitemap.xml').getroot().findall('.//s:loc',ns)]
errors=[]; titles={}; canons={}; descs={}

def route_file(path):
    if path=='/': return root/'index.html'
    p=root/path.strip('/')
    if p.is_dir(): return p/'index.html'
    if p.exists(): return p
    if p.with_suffix('.html').exists(): return p.with_suffix('.html')
    return p/'index.html'

def local_exists(url, base_path='/'):
    if url.startswith(('mailto:','tel:','javascript:','data:','#')): return True
    u=urlparse(url)
    if u.scheme and u.netloc and u.netloc!='maisbivvo.netlify.app': return True
    path=u.path or base_path
    if not path.startswith('/'):
        base=Path(base_path.strip('/')).parent
        path='/' + str((base/path).as_posix())
    return route_file(unquote(path)).exists()

for u in urls:
    path=urlparse(u).path; f=route_file(path)
    if not f.exists(): errors.append(f'MISSING_HTML {path} -> {f}'); continue
    soup=BeautifulSoup(f.read_text(encoding='utf-8'),'html.parser')
    title=(soup.title.string.strip() if soup.title and soup.title.string else '')
    desc=soup.find('meta',attrs={'name':'description'}); descv=desc.get('content','').strip() if desc else ''
    canon=soup.find('link',rel='canonical'); canonv=canon.get('href','').strip() if canon else ''
    h1=soup.find_all('h1')
    if not title: errors.append(f'NO_TITLE {path}')
    if not descv: errors.append(f'NO_DESC {path}')
    if not canonv: errors.append(f'NO_CANON {path}')
    if len(h1)!=1: errors.append(f'H1_{len(h1)} {path}')
    if title in titles and titles[title]!=path: errors.append(f'DUP_TITLE {path} = {titles[title]}')
    else: titles[title]=path
    if canonv in canons and canons[canonv]!=path: errors.append(f'DUP_CANON {path} = {canons[canonv]}')
    else: canons[canonv]=path
    if descv in descs and descs[descv]!=path: errors.append(f'DUP_DESC {path} = {descs[descv]}')
    else: descs[descv]=path
    for ld in soup.find_all('script',attrs={'type':'application/ld+json'}):
        try: json.loads(ld.string or ld.get_text())
        except Exception as e: errors.append(f'BAD_JSONLD {path}: {e}')
    for tag,attr in [('script','src'),('link','href'),('img','src')]:
        for x in soup.find_all(tag):
            ref=x.get(attr)
            if not ref: continue
            if tag=='link' and x.get('rel') and not any(v in ['stylesheet','icon','manifest'] for v in x.get('rel')): continue
            if not local_exists(ref,path): errors.append(f'BROKEN_ASSET {path} {ref}')
    for a in soup.find_all('a',href=True):
        href=a['href']
        if href.startswith(('#','mailto:','tel:','javascript:')): continue
        pu=urlparse(href)
        if pu.scheme and pu.netloc and pu.netloc!='maisbivvo.netlify.app':
            if a.get('target')=='_blank':
                rel=set(a.get('rel') or [])
                if not {'noopener','noreferrer'} <= rel: errors.append(f'BLANK_REL {path} {href}')
            continue
        if pu.path in ('','/'): continue
        if not local_exists(href,path): errors.append(f'BROKEN_LINK {path} {href}')
    if path!='/':
        pas=[x for x in soup.find_all('script',src=True) if 'public-acquisition.js' in x.get('src','')]
        gs=[x for x in soup.find_all('script',src=True) if 'growth-share-1142.js' in x.get('src','')]
        legacy=[x for x in soup.find_all('script',src=True) if 'seo-track.js' in x.get('src','')]
        if len(pas)!=1 or json.loads((root/'package.json').read_text())['version'] not in pas[0].get('src',''): errors.append(f'PUBLIC_ACQ_{len(pas)} {path}')
        if len(gs)!=1: errors.append(f'GROWTH_SHARE_{len(gs)} {path}')
        if legacy: errors.append(f'LEGACY_TRACK {path}')

for p in ['/ferramentas/','/ferramentas/incorporar/','/recursos/','/imprensa/']:
    if 'https://maisbivvo.netlify.app'+p not in urls: errors.append('SITEMAP_MISSING '+p)
if any('/ferramentas/embed/' in u for u in urls): errors.append('EMBED_IN_SITEMAP')
for name in ['planilha-gastos.png','salario-liquido.png','calculadora-ferias.png','quanto-gastar.png','ferramentas-bivvo.png']:
    p=root/'media/og'/name
    if not p.exists(): errors.append('OG_MISSING '+name)
    else:
        with Image.open(p) as im:
            if im.size!=(1200,630): errors.append(f'OG_SIZE {name} {im.size}')
print('SITEMAP_URLS',len(urls)); print('UNIQUE_TITLES',len(titles),'UNIQUE_CANONICALS',len(canons),'UNIQUE_DESCS',len(descs)); print('ERRORS',len(errors))
for e in errors: print(e)
raise SystemExit(1 if errors else 0)
