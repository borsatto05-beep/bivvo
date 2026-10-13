import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {verifyDist} from '../scripts/verify-dist.mjs';
const root=mkdtempSync(path.join(tmpdir(),'bivvo-modules-'));
try{
 writeFileSync(path.join(root,'app.js'),"import {x} from './missing.mjs'; export const later=()=>import('./dynamic.js?version=1');");
 assert.throws(()=>verifyDist(root),/missing.mjs/);
 writeFileSync(path.join(root,'missing.mjs'),'export const x=1;');assert.throws(()=>verifyDist(root),/dynamic.js/);
 writeFileSync(path.join(root,'dynamic.js'),'export const ok=true;');assert(verifyDist(root));
 writeFileSync(path.join(root,'index.html'),'<script type="module" src="/missing-script.js"></script>');assert.throws(()=>verifyDist(root),/missing-script.js/);
 writeFileSync(path.join(root,'missing-script.js'),'');assert(verifyDist(root));
}finally{rmSync(root,{recursive:true});}
assert(verifyDist(path.resolve('dist')));
const sw=readFileSync('dist/sw.js','utf8');assert(sw.includes('/js/growth-utils.mjs'));
console.log('Dist: arquivos .mjs, imports dinâmicos/estáticos, scripts HTML e precache verificados.');
