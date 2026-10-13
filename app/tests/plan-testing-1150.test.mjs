import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

const client=fs.readFileSync('js/plans.js','utf8');
const landing=fs.readFileSync('index.html','utf8');
const you=fs.readFileSync('js/views/you.js','utf8');
const testerClient=fs.readFileSync('js/tester-plan.js','utf8');
const serverPlans=fs.readFileSync('netlify/lib/plans.js','utf8');
const fnSource=fs.readFileSync('netlify/functions/test-plan.js','utf8');
const toml=fs.readFileSync('netlify.toml','utf8');

assert(client.includes("free: { cards: 1, scansPerMonth: 5, quickCapturePerMonth: 10, aiPerMonth: 0, aiTier: 0 }"),'Grátis deve permitir somente 1 cartão');
assert(landing.includes('1 cartão no Grátis'));
assert(landing.includes('✓ 1 cartão de crédito'));
assert(landing.includes('<tr><td>Cartões de crédito</td><td>1</td>'));
assert(!landing.includes('Até 3 cartões no Grátis'));
assert(you.includes('mountTesterPlanSwitch'));
assert(testerClient.includes("'/api/test-plan'"));
assert(testerClient.includes("'real','free','plus','capital','pro','couple','entrepreneur','family'"));
assert(toml.includes('from = "/api/test-plan"'));
assert(serverPlans.includes("r.source==='owner_test_free'"));
assert(serverPlans.includes("TEST_PLAN_SOURCE='owner_test_plan'"));
assert(client.includes("r.source==='owner_test_free'"));
assert(client.includes("TEST_PLAN_SOURCE='owner_test_plan'"));
assert(!/gmail\.com/i.test(fnSource),'e-mail real do tester não deve ficar em texto puro no backend');

// Exercita autorização e troca sem checkout com um hash injetado só no teste.
const testEmail='owner@example.test';
process.env.SUPABASE_SECRET_KEY='test-secret';
process.env.BIVVO_TESTER_EMAIL_SHA256=crypto.createHash('sha256').update(testEmail).digest('hex');
let authEmail=testEmail;
let writes=[];
global.fetch=async (url,opts={})=>{
  const u=String(url), method=String(opts.method||'GET').toUpperCase();
  if(u.includes('/auth/v1/user')) return Response.json({id:'user-1',email:authEmail});
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
assert.equal(_test.emailHash(testEmail),process.env.BIVVO_TESTER_EMAIL_SHA256);

let res=await handler({httpMethod:'POST',headers:{authorization:'Bearer x'},body:JSON.stringify({plan:'family'})});
assert.equal(res.statusCode,200);
assert.equal(JSON.parse(res.body).testPlan,'family');
assert(writes.some(x=>x.method==='POST'&&x.body?.plan==='family'&&x.body?.source==='owner_test_plan_family'));

writes=[];
res=await handler({httpMethod:'POST',headers:{authorization:'Bearer x'},body:JSON.stringify({plan:'free'})});
assert.equal(res.statusCode,200);
assert.equal(JSON.parse(res.body).testPlan,'free');
assert(writes.some(x=>x.method==='POST'&&x.body?.source==='owner_test_free'));

writes=[];
res=await handler({httpMethod:'POST',headers:{authorization:'Bearer x'},body:JSON.stringify({plan:'real'})});
assert.equal(res.statusCode,200);
assert.equal(JSON.parse(res.body).testPlan,'real');
assert.equal(writes.filter(x=>x.method==='POST').length,0,'plano real só deve expirar overrides');

authEmail='other@example.test';
res=await handler({httpMethod:'POST',headers:{authorization:'Bearer x'},body:JSON.stringify({plan:'family'})});
assert.equal(res.statusCode,403,'outras contas não podem usar o modo de teste');

console.log('Bivvo 11.50: Grátis com 1 cartão e modo privado de homologação por plano validados.');
