import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
const original=Array.from({length:235},(_,i)=>({id:String(1000-i),date:i<125?'2026-10-08':'2026-09-04',family_id:'f',user_id:i%2?'partner':'user',type:i%3?'expense':'income',value:10,description:'Item '+i})).sort((a,b)=>a.date===b.date?(a.id<b.id?1:a.id>b.id?-1:0):(a.date<b.date?1:-1));
// O mock respeita a mesma ordem date.desc,id.desc solicitada ao PostgREST.
let rows=original.slice(),queries=[],limits=[],authenticated=true,hasMembership=true,failPage=false;
const rest=async(path,opt={})=>{
 if(path.startsWith('family_members?user_id'))return hasMembership?[{id:'member',family_id:'f',user_id:'user',role:'owner'}]:[];
 if(path.startsWith('families?id'))return [{id:'f',owner_id:'user',name:'Casal · Teste'}];
 if(path.startsWith('family_members?family_id'))return [{id:'member',user_id:'user',role:'owner'},{id:'other',user_id:'partner',role:'editor'}];
 if(path.startsWith('family_shopping_items?'))return [];
 if(path.startsWith('family_transactions?')){
  queries.push(path);assert(path.includes('family_id=eq.f'));assert(path.includes('order=date.desc,id.desc'));
  const after=/date.lt.([^,]+),and\(date.eq.[^,]+,id.lt.([^)]*)\)/.exec(path);
  if(failPage&&after)throw Error('Page failed');
  const eligible=after?rows.filter(x=>x.date<after[1]||(x.date===after[1]&&x.id<after[2])):rows;
  return eligible.slice(0,100);
 }
 throw Error(path);
};
const sandbox={exports:{},console:{error(){}},require:n=>n==='crypto'?{randomBytes:()=>({toString:()=> 'code'})}:n.includes('supabase-admin')?{rest,adminKey:()=>true,userFromJwt:async()=>authenticated?{id:'user'}:null,rateLimit:async(...args)=>{limits.push(args);return true;}}:{hasFeature:async()=>true}};
vm.runInNewContext(fs.readFileSync('netlify/functions/family.js','utf8'),sandbox);
const call=()=>sandbox.exports.handler({httpMethod:'POST',headers:{authorization:'Bearer token'},body:JSON.stringify({action:'get'})});
const r=await call();assert.equal(r.statusCode,200);const d=JSON.parse(r.body).data;
assert.equal(d.shared.length,235);assert.equal(new Set(d.shared.map(x=>x.id)).size,235);assert.equal(d.shared.filter(x=>x.date.startsWith('2026-09')).length,110);
assert.equal(d.shared.reduce((n,x)=>n+(x.type==='income'?x.value:-x.value),0),original.reduce((n,x)=>n+(x.type==='income'?x.value:-x.value),0));assert.equal(queries.length,3);
assert.deepEqual(limits[0],['family-read:user',240,3600]);
rows=original.slice(0,200);queries=[];assert.equal(JSON.parse((await call()).body).data.shared.length,200);assert.equal(queries.length,3);
failPage=true;assert.equal((await call()).statusCode,502);failPage=false;
hasMembership=false;queries=[];assert.equal(JSON.parse((await call()).body).data,null);assert.equal(queries.length,0);
authenticated=false;assert.equal((await call()).statusCode,401);
console.log('Histórico >100 registros, mês anterior, páginas exatas, falha sem totais parciais e acesso isolado.');
