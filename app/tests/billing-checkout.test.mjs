import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { handler } = require('../netlify/functions/billing-create.js');
process.env.SUPABASE_SECRET_KEY = 'test';
process.env.MERCADOPAGO_ACCESS_TOKEN = 'test';
const original = global.fetch;
let failure = '', calls = [];
global.fetch = async (url, options = {}) => {
  const body = options.body ? JSON.parse(options.body) : null;
  calls.push({url, ...options, body});
  if (url.includes('/auth/v1/user')) return Response.json({id:'user-1',email:'payer@example.test'});
  if (url.includes('/rpc/bivvo_rate_limit')) return Response.json(true);
  if (url.endsWith('/preapproval')) {
    if (failure === 'provider') return Response.json({message:'Unavailable'}, {status:503});
    return Response.json({id:'sub-1',init_point:'https://www.mercadopago.com.br/checkout',status:'pending'});
  }
  if (url.includes('/billing_subscriptions?')) {
    if (failure === 'schema') return Response.json({code:'23514',message:'billing_subscriptions_plan_check'}, {status:400});
    if (failure === 'storage') return new Response('', {status:503});
    return new Response(null,{status:204});
  }
  if (url.endsWith('/preapproval/sub-1') && options.method === 'PUT') return Response.json({status:'cancelled'});
  throw Error('Unexpected request: '+url);
};
const run = (plan='capital', interval='monthly') => handler({httpMethod:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({plan,interval})});
try {
  for (const [interval, amount, frequency] of [['monthly',24.9,1],['annual',249,12]]) {
    calls=[]; const result=await run('capital',interval);
    assert.equal(result.statusCode,200);
    assert.match(JSON.parse(result.body).checkoutUrl,/^https:/);
    const request=calls.find(x=>x.url.endsWith('/preapproval'));
    assert.equal(request.body.auto_recurring.transaction_amount,amount);
    assert.equal(request.body.auto_recurring.frequency,frequency);
    assert(calls.some(x=>x.url.includes('on_conflict=mp_subscription_id')));
  }
  for (const [mode, code] of [['schema','BILLING_SCHEMA_OUTDATED'],['storage','BILLING_STORAGE_FAILED'],['provider','BILLING_PROVIDER_FAILED']]) {
    failure=mode;calls=[];const result=await run();const body=JSON.parse(result.body);
    assert.equal(result.statusCode,502);assert.equal(body.code,code);assert(!body.checkoutUrl);
    assert.equal(calls.some(x=>x.method==='PUT'&&x.body.status==='cancelled'),mode!=='provider');
  }
  failure='';calls=[];
  assert.equal((await run('constructor')).statusCode,400);
  assert(!calls.some(x=>x.url.endsWith('/preapproval')));
} finally { global.fetch=original; }
console.log('Checkout: Capital monthly/annual, storage failures, cancellation and provider failures passed.');
