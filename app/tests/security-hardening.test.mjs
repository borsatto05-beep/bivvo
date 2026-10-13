import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const fn=require('../netlify/functions/account-delete.js');
process.env.SUPABASE_SECRET_KEY='test-placeholder';
const now=Math.floor(Date.now()/1000);
let mfa=false,unavailable=false,deletes=0;
const saved=global.fetch;
global.fetch=async(url,options={})=>{
 if(url.endsWith('/auth/v1/user')) return Response.json({id:'user-1'});
 if(url.includes('/rpc/bivvo_user_has_verified_mfa')) return unavailable?new Response('',{status:503}):Response.json(mfa);
 if(options.method==='DELETE'){deletes++;return new Response('',{status:200});}
 throw new Error('Unexpected request');
};
const event=claims=>({httpMethod:'POST',headers:{authorization:'Bearer mock.'+Buffer.from(JSON.stringify({sub:'user-1',iat:now,aal:'aal1',...claims})).toString('base64url')+'.mock'}});
try {
 assert.equal((await fn.handler(event({amr:[{method:'password',timestamp:now-86400}]}))).statusCode,401);
 assert.equal((await fn.handler(event({amr:[{method:'token_refresh',timestamp:now}]}))).statusCode,401);
 assert.equal(deletes,0);
 mfa=true;
 assert.equal((await fn.handler(event({amr:[{method:'password',timestamp:now}]}))).statusCode,403);
 assert.equal(deletes,0);
 assert.equal((await fn.handler(event({aal:'aal2',amr:[{method:'password',timestamp:now}]}))).statusCode,200);
 assert.equal(deletes,1);
 unavailable=true;
 assert.equal((await fn.handler(event({aal:'aal2',amr:[{method:'password',timestamp:now}]}))).statusCode,503);
 assert.equal(deletes,1);
 assert.equal(fn._test.recentPassword({amr:[{method:'password',timestamp:now+600}]}),false);
} finally {global.fetch=saved;}
console.log('Security: old auth, refresh-only auth, MFA, provider failure and valid deletion passed.');
