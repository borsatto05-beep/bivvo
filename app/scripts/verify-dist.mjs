import {readdirSync,readFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function verifyDist(root) {
 const problems=[];
 function resolve(reference,file) {
  const ref=reference.split(/[?#]/)[0];
  if(!ref || /^(https?:|data:|blob:|node:)/.test(ref))return;
  if(!ref.startsWith('.')&&!ref.startsWith('/'))return;
  const target=ref.startsWith('/')?path.join(root,ref):path.resolve(path.dirname(file),ref);
  if(!target.startsWith(path.resolve(root)+path.sep)||!existsSync(target)||!statSync(target).isFile())problems.push(`${path.relative(root,file)} -> ${reference}`);
 }
 function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);if(e.isDirectory()){walk(file);continue;}
  if(/\.(mjs|js)$/.test(file)){
   const code=readFileSync(file,'utf8');
   for(const m of code.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g))resolve(m[1],file);
  }
  if(file.endsWith('.html'))for(const m of readFileSync(file,'utf8').matchAll(/<script\b[^>]*\bsrc\s*=\s*['"]([^'"]+)['"]/gi)){
   const ref=m[1];if(!/^(https?:|data:)/.test(ref))resolve(ref.startsWith('/')||ref.startsWith('.')?ref:'./'+ref,file);
  }
 }}
 walk(root);if(problems.length)throw Error('Dependências ausentes no dist:\n'+problems.join('\n'));
 return true;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 verifyDist(path.resolve(process.argv[2]||'dist'));console.log('Imports estáticos, dinâmicos e scripts HTML do dist: OK.');
}
