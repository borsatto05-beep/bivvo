import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{syncSubscription}=require('../netlify/lib/billing.js');
process.env.SUPABASE_SECRET_KEY='test';process.env.MERCADOPAGO_ACCESS_TOKEN='test';
let mode='failure',mutations=[];
const saved=global.fetch;
global.fetch=async(url,options={})=>{
 if(url.includes('/preapproval/')) return Response.json({status:'authorized'});
 if(url.includes('/authorized_payments/search')) {
  if(mode==='failure')return new Response('',{status:503});
  return Response.json({results:[{date_created:'2026-01-01T00:00:00Z',payment:{status:mode}}]});
 }
 if(url.includes('/billing_subscriptions?') && !options.body)return Response.json([{id:1,user_id:'test-user',plan:'pro',status:'authorized'}]);
 if(options.body){mutations.push({url,method:options.method,body:JSON.parse(options.body)});return new Response(null,{status:204});}
 throw new Error('Unexpected '+url);
};
try {
 await assert.rejects(()=>syncSubscription('sub-1'),/preservado/);
 assert.equal(mutations.length,0);
 for(const status of ['pending','rejected']) {mode=status;mutations=[];await syncSubscription('sub-1');assert(!mutations.some(x=>x.url.includes('/entitlements')));}
 mode='approved';mutations=[];await syncSubscription('sub-1');
 const grant=mutations.find(x=>x.url.includes('/entitlements'));
 assert(grant.url.includes('on_conflict=user_id,source'));
 assert.equal(grant.body.expires_at,'2026-02-03T00:00:00.000Z'); // old payment cannot renew forever
 mode='refunded';mutations=[];await syncSubscription('sub-1');assert(mutations.some(x=>x.url.includes('/entitlements')&&x.method==='PATCH'));
}finally {global.fetch=saved;}
console.log('Billing: outages, pending/rejected renewals, idempotent grants, stale payment and refunds passed.');
