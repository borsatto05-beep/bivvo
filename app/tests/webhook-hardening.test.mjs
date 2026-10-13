import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{verifySignature}=require('../netlify/lib/webhook-security.js');
const fn=require('../netlify/functions/billing-webhook.js');
process.env.SUPABASE_SECRET_KEY='test';process.env.MERCADOPAGO_ACCESS_TOKEN='test';process.env.MERCADOPAGO_WEBHOOK_SECRET='test-secret';
const ts=String(Date.now()),id='sub-1',request='request-1';
const v1=crypto.createHmac('sha256','test-secret').update(`id:${id};request-id:${request};ts:${ts};`).digest('hex');
const event={httpMethod:'POST',queryStringParameters:{'data.id':id},headers:{'x-signature':`ts=${ts},v1=${v1}`,'x-request-id':request},body:JSON.stringify({id:'notification-1',type:'subscription_preapproval',data:{id}})};
assert(verifySignature(event,'test-secret'));assert(!verifySignature(event,'wrong'));assert(!verifySignature(event,'test-secret',Date.now()+11*60*1000));
let state='retry',providerFails=true,syncCalls=0;
const saved=global.fetch;
global.fetch=async(url,options={})=>{
 if(url.includes('/rpc/bivvo_claim_webhook')) {const claim=state==='done'?'done':state==='processing'?'busy':'claimed';if(claim==='claimed')state='processing';return Response.json(claim);}
 if(url.includes('/rpc/bivvo_finish_webhook')) {state=JSON.parse(options.body).p_success?'done':'retry';return new Response(null,{status:204});}
 if(url.includes('/preapproval/')) {syncCalls++;return providerFails?new Response('',{status:503}):Response.json({status:'authorized'});}
 if(url.includes('/billing_subscriptions?'))return Response.json([]);
 throw new Error('Unexpected '+url);
};
try {
 assert.equal((await fn.handler({...event,headers:{...event.headers,'x-signature':`ts=${ts},v1=${'0'.repeat(64)}`}})).statusCode,401);
 assert.equal(syncCalls,0);
 assert.equal((await fn.handler(event)).statusCode,503);assert.equal(state,'retry');
 providerFails=false;assert.equal((await fn.handler(event)).statusCode,200);assert.equal(state,'done');
 const calls=syncCalls;assert.equal((await fn.handler(event)).body,'duplicate');assert.equal(syncCalls,calls);
 assert.equal((await fn.handler({...event,body:JSON.stringify({type:'subscription',data:{id:'other'}})})).statusCode,400);
 state='processing';assert.equal((await fn.handler(event)).statusCode,503);
}finally{global.fetch=saved;}
console.log('Webhook: signatures, replay window, body mismatch, retries, duplicates and concurrent delivery passed.');
