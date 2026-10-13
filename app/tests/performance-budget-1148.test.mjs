import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const size=f=>fs.statSync(f).size;
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).reduce((n,e)=>{
  const full=path.join(d,e.name);
  // Arquivos distribuíveis sob demanda (APK, backups etc.) não fazem parte do peso carregado pelo app/site.
  if(e.isDirectory() && path.relative('dist',full).split(path.sep)[0]==='downloads') return n;
  return n+(e.isDirectory()?walk(full):size(full));
},0);
const budgets={
  'index.html':40*1024,
  'app.css':220*1024,
  'js/main.js':45*1024,
  'js/plans.js':24*1024,
  'netlify/functions/assistant.js':24*1024
};
for(const [file,max] of Object.entries(budgets)){
  const actual=size(file);
  assert(actual<=max,`${file} excedeu orçamento estático: ${actual} > ${max}`);
}
if(fs.existsSync('dist')) assert(walk('dist')<=5*1024*1024,'dist público excedeu 5 MB');
console.log('Orçamentos estáticos de fluidez/desempenho 11.48 dentro dos limites.');
