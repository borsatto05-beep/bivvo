import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {restoreBinaryAssets} from '../scripts/restore-binary-assets.mjs';
const root=mkdtempSync(path.join(tmpdir(),'bivvo-assets-')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
try{
 mkdirSync(path.join(root,'assets'));mkdirSync(path.join(root,'parts'));
 const a=Buffer.from([0,255,1,2]),b=Buffer.from([128,13,10,0]),all=Buffer.concat([a,b]);
 writeFileSync(path.join(root,'parts/a'),a);writeFileSync(path.join(root,'parts/b'),b);
 const m={files:[{path:'downloads/test.apk',bytes:all.length,sha256:hash(all),parts:[{path:'parts/a',bytes:a.length,sha256:hash(a)},{path:'parts/b',bytes:b.length,sha256:hash(b)}]}]};
 writeFileSync(path.join(root,'assets/binary-assets.json'),JSON.stringify(m));
 restoreBinaryAssets(root);assert.deepEqual(readFileSync(path.join(root,'downloads/test.apk')),all);restoreBinaryAssets(root);
 writeFileSync(path.join(root,'downloads/test.apk'),'wrong');assert.throws(()=>restoreBinaryAssets(root),/Asset existente/);
 rmSync(path.join(root,'downloads/test.apk'));writeFileSync(path.join(root,'parts/b'),'wrong');assert.throws(()=>restoreBinaryAssets(root),/Parte de asset/);assert(!existsSync(path.join(root,'downloads/test.apk')));
 m.files[0].path='../outside.apk';writeFileSync(path.join(root,'assets/binary-assets.json'),JSON.stringify(m));assert.throws(()=>restoreBinaryAssets(root),/Caminho/);
}finally{rmSync(root,{recursive:true});}
console.log('Assets binários: reconstituição byte a byte, integridade, idempotência e isolamento de caminhos.');
