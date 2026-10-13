import assert from 'node:assert/strict';
const clone=x=>JSON.parse(JSON.stringify(x));
let remote={rev:'v1',transactions:[{id:'a',value:20,date:'2026-10-07',type:'expense'}]},beforeWrite=null,fail=false;
const storage=new Map();
globalThis.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
globalThis.localStorage=globalThis.sessionStorage;
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
class Query {
 constructor(){this.filters=[];}
 select(){return this;}
 eq(k,v){this.filters.push([k,v]);return this;}
 is(k,v){this.filters.push([k,v]);return this;}
 async maybeSingle(){return {data:remote?{payload:clone(remote)}:null,error:null};}
 update(body){this.body=body;this.mode='update';return this;}
 async insert(body){if(beforeWrite){beforeWrite();beforeWrite=null;}if(remote)return {error:{code:'23505'}};remote=clone(body.payload);return {error:null};}
 async upsert(body){remote=clone(body.payload);return {error:null};}
 then(resolve,reject){return (async()=>{
  if(beforeWrite){beforeWrite();beforeWrite=null;}
  if(fail)return {error:{message:'Network failed'}};
  const expected=this.filters.find(([k])=>k==='payload->>rev')?.[1];
  if((remote?.rev||null)!==expected)return {data:[],error:null};
  remote=clone(this.body.payload);return {data:[{user_id:'user'}],error:null};
 })().then(resolve,reject);}
}
const client={from:()=>new Query(),auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'user'}}}}),mfa:{listFactors:async()=>({data:{totp:[]}})},signOut:async()=>({error:null})}};
globalThis.window={supabase:{createClient:()=>client},addEventListener(){},dispatchEvent(){}};
const store=await import('../js/store.js'),cloud=await import('../js/cloud.js');
const open=()=>cloud.initAuth({onSignedIn:async()=>store.load(await cloud.loadRemote(),{userId:'user'})});
await open();
store.commit(s=>s.transactions.push({id:'b',value:30,date:'2026-10-07',type:'expense'}));
beforeWrite=()=>{remote={rev:'v2',transactions:[]};};
await cloud.flush();
assert.deepEqual(remote.transactions.map(x=>x.id),['b']);assert(remote.deletedRecords.a);
await cloud.signOut();remote=null;await open();
store.commit(s=>s.transactions.push({id:'local',value:1,date:'2026-10-07'}));
beforeWrite=()=>{remote={rev:'race',transactions:[{id:'other-device',value:2,date:'2026-10-07'}]};};
await cloud.flush();assert.deepEqual(new Set(remote.transactions.map(x=>x.id)),new Set(['local','other-device']));
store.commit(s=>s.transactions[0].value=10);fail=true;
await assert.rejects(()=>cloud.signOut());assert(cloud.currentUser(),'failed sync must not clear current session');
fail=false;await cloud.flush();await cloud.signOut();
console.log('Sync integration: optimistic conflicts, insertion race, bounded flush and failed-logout preservation passed.');
