import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
let referrer='owner',written=[],txs=[],confirmed=true;
const state={exports:{},console:{error(){}},require:()=>({adminKey:()=>true,userFromJwt:async()=>({id:'new-user',email_confirmed_at:confirmed?'2026-10-13':null,created_at:new Date().toISOString(),user_metadata:{referred_by:'abcdef12'}}),rateLimit:async()=>true,rest:async(path,opt={})=>{
 if(path==='rpc/bivvo_referrer_by_code')return referrer;
 if(path.startsWith('referrals?referred_user='))return [];
 if(path.startsWith('finance_data?'))return [{payload:{transactions:txs}}];
 if(path==='referrals'&&opt.method==='POST'){written.push(opt.body);return null;}
 if(path.startsWith('entitlements')){written.push(opt.body);return null;}
 if(path.startsWith('referrals?referrer='))return [{id:'one'}];
 throw Error('Unexpected '+path);
}})};
vm.runInNewContext(fs.readFileSync('netlify/functions/referral-activate.js','utf8'),state);
const call=async()=>JSON.parse((await state.exports.handler({httpMethod:'POST',headers:{authorization:'Bearer token'}})).body);
referrer='new-user';assert.equal((await call()).reason,'invalid_referrer');assert.equal(written.length,0);
referrer=null;assert.equal((await call()).reason,'invalid_referrer');
referrer='owner';confirmed=false;assert.equal((await call()).reason,'email_unconfirmed');confirmed=true;
txs=[{date:'2026-10-01'},{date:'2026-10-01'},{date:'2026-10-01'}];assert.equal((await call()).reason,'not_active_yet');
txs=[{date:'2026-10-01'},{date:'2026-10-02'},{date:'2026-10-02',demoSeed:true}];assert.equal((await call()).reason,'not_active_yet');
txs=[{date:'2026-10-01'},{date:'2026-10-02'},{date:'2026-10-02'}];assert.equal((await call()).ok,true);assert.equal(written.filter(x=>x.source==='referral_welcome').length,1);
console.log('Indicação no servidor: autoindicação, e-mail, registros fictícios e critérios reais da recompensa.');
