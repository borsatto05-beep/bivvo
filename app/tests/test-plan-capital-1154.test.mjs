import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

const testEmail='owner@example.test';
process.env.SUPABASE_SECRET_KEY='test-secret';
process.env.BIVVO_TESTER_EMAIL_SHA256=crypto.createHash('sha256').update(testEmail).digest('hex');
let writes=[];
global.fetch=async (url,opts={})=>{
  const u=String(url), method=String(opts.method||'GET').toUpperCase();
  if(u.includes('/auth/v1/user')) return Response.json({id:'user-1',email:testEmail});
  if(u.includes('/rest/v1/entitlements')){
    if(method==='GET') return Response.json([]);
    writes.push({url:u,method,body:opts.body?JSON.parse(opts.body):null});
    return new Response(null,{status:204});
  }
  throw new Error('fetch inesperado '+u);
};
const require=createRequire(import.meta.url);
const modPath=require.resolve('../netlify/functions/test-plan.js');
delete require.cache[modPath];
const {handler,_test}=require(modPath);

const res=await handler({httpMethod:'POST',headers:{authorization:'Bearer x'},body:JSON.stringify({plan:'capital'})});
assert.equal(res.statusCode,200);
assert.equal(JSON.parse(res.body).testPlan,'capital');
const post=writes.find(x=>x.method==='POST');
assert(post,'deve gravar um entitlement de homologação');
assert.equal(post.body.plan,'family','Capital de homologação usa entitlement compatível para não depender do CHECK novo');
assert.equal(post.body.source,'owner_test_plan_capital');
assert.equal(_test.simulatedPlanFromRow({plan:'family',source:'owner_test_plan_capital'}),'capital');
assert.equal(_test.storagePlanFor('capital'),'family');
assert.equal(_test.storagePlanFor('plus'),'plus');

console.log('Bivvo 11.54: modo de homologação Capital compatível com schema antigo validado.');
