import {readdirSync,readFileSync,writeFileSync,mkdirSync,rmSync,copyFileSync} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {verifyDist} from './verify-dist.mjs';
import {restoreBinaryAssets} from './restore-binary-assets.mjs';
restoreBinaryAssets();
const appVersion=JSON.parse(readFileSync('package.json','utf8')).version;
const root=path.resolve('.'),out=path.join(root,'dist');
const excluded=new Set(['dist','netlify','tests','scripts','node_modules','.git','_seo','work','output']);
const allowed=/\.(html|css|m?js|png|jpe?g|svg|ico|woff2?|webmanifest|xlsx|xml|apk)$/i;
const paths=[];
function visit(dir,rel='') {
 for (const e of readdirSync(dir,{withFileTypes:true})) {
  const sub=path.posix.join(rel,e.name);
  if(e.isSymbolicLink()) throw new Error('Symlink not allowed: '+sub);
  if(e.isDirectory()) {if(!excluded.has(e.name)&&!e.name.startsWith('.'))visit(path.join(dir,e.name),sub);}
  else if((allowed.test(e.name)&&e.name!=='sw.js') || /^js\/vendor\/LICENSE-.*\.txt$/.test(sub) || (!rel&&['_headers','_redirects','robots.txt','llms.txt'].includes(e.name)) || (!rel&&/^[a-f0-9]{32}\.txt$/.test(e.name))) paths.push(sub);
 }
}
visit(root);rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const p of paths) {mkdirSync(path.dirname(path.join(out,p)),{recursive:true});copyFileSync(path.join(root,p),path.join(out,p));}
// Content-derived cache identity: even an accidental same-version deploy gets its own complete shell.
const coreRoot=new Set(['index.html','app.css','nova.css','nova-public.css','budget-guided.css','company-education.css','life-education.css','landing-v4.css','orbit.css','privacy.css','loan-installments.css','landing-v4.js','orbit-landing.js','seo-premium-1140.css','seo-premium-1140.js','manifest.webmanifest','apple-touch-icon.png','favicon-16.png','favicon-32.png','favicon.ico','icon-192.png','icon-512.png']);
// Offline shell must contain the app itself, not every SEO/marketing page. Pre-caching the
// entire public site made one optional asset/network race abort the service-worker install.
const shell=paths.filter(p=>p.startsWith('js/') || p.startsWith('fonts/') || coreRoot.has(p)).sort();
const hash=crypto.createHash('sha256');for(const p of shell)hash.update(p).update(readFileSync(path.join(root,p)));
const release=hash.digest('hex').slice(0,16);
const sourceSw=readFileSync('sw.js','utf8');
const sw=sourceSw.replace(/const VERSION = '[^']+';/,`const VERSION = 'bivvo-v${appVersion.replaceAll('.','-')}-${release}';`)
 .replace(/\/\* BUILD_PRECACHE \*\/ \[[^\n]*\]/,JSON.stringify(shell.map(p=>({url:'/'+p,sha256:crypto.createHash('sha256').update(readFileSync(path.join(root,p))).digest('hex')}))));
if(sw.includes('BUILD_PRECACHE'))throw Error('Service worker: precache não gerado');
writeFileSync(path.join(out,'sw.js'),sw);
writeFileSync('build-manifest.json',JSON.stringify({version:appVersion,release,files:paths.length,precache:shell.length},null,2)+'\n');
verifyDist(out);
console.log(`Built ${paths.length+1} public files; ${shell.length} precached assets; release ${release}`);
