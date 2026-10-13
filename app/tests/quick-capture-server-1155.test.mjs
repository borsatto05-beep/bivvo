import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
process.env.SUPABASE_SECRET_KEY='test-secret';
let plan='free',consumeCalls=[];
const saved=global.fetch;
global.fetch=async(url,opts={})=>{
  const u=String(url),method=String(opts.method||'GET').toUpperCase();
  if(u.includes('/auth/v1/user'))return Response.json({id:'u1',email:'x@test.local'});
  if(u.includes('/rpc/bivvo_rate_limit'))return Response.json(true);
  if(u.includes('/entitlements?'))return Response.json(plan==='free'?[]:[{plan,source:'billing'}]);
  if(u.includes('/rpc/bivvo_consume_usage')){consumeCalls.push(JSON.parse(opts.body));return Response.json(1);}
  if(u.includes('/rpc/bivvo_refund_usage'))return new Response(null,{status:204});
  throw new Error(`fetch inesperado ${method} ${u}`);
};
try{
  const modPath=require.resolve('../netlify/functions/quick-capture-usage.js');delete require.cache[modPath];
  const {handler}=require(modPath);
  let r=await handler({httpMethod:'POST',headers:{authorization:'Bearer x'},body:'{}'});
  assert.equal(r.statusCode,200);let j=JSON.parse(r.body);assert.equal(j.usage.limit,10);assert.equal(consumeCalls[0].p_feature,'quick_capture');assert.equal(consumeCalls[0].p_limit,10);
  plan='plus';consumeCalls=[];r=await handler({httpMethod:'POST',headers:{authorization:'Bearer x'},body:'{}'});j=JSON.parse(r.body);assert.equal(r.statusCode,200);assert.equal(j.unlimited,true);assert.equal(consumeCalls.length,0,'plano pago não precisa consumir contador da anotação rápida');
}finally{global.fetch=saved;delete process.env.SUPABASE_SECRET_KEY;}
console.log('Bivvo 11.55: servidor limita 10 anotações rápidas no Grátis e libera texto/voz nos pagos.');
