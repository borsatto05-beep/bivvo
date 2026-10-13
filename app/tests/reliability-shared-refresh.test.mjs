import assert from 'node:assert/strict';
import {createSharedRefresh} from '../js/shared-refresh.js';
let user='A',clock=0,allowed=true,calls=0,resolveFetch,rejectFetch,values=[],states=[];
const c=createSharedRefresh({getIdentity:()=>user,canRefresh:()=>allowed,now:()=>clock,onData:v=>values.push(v),onStatus:s=>states.push(s),fetchData:()=>{calls++;return new Promise((resolve,reject)=>{resolveFetch=resolve;rejectFetch=reject;});}});
const a=c.refresh();c.refresh();assert.equal(calls,1);resolveFetch('A snapshot');await a;assert.deepEqual(values,['A snapshot']);
await c.refresh();assert.equal(calls,1);clock=16000;
const stale=c.refresh(),resolveOld=resolveFetch;user='B';const b=c.refresh();assert.equal(calls,3);resolveFetch('B snapshot');await b;resolveOld('old account');await stale;assert(!values.includes('old account')); // Each account has a distinct pending request.
// New controller explicitly exercises old-account completion and local invalidation.
let pending=[];values=[];
const d=createSharedRefresh({getIdentity:()=>user,canRefresh:()=>allowed,now:()=>clock,onData:v=>values.push(v),fetchData:()=>new Promise((r,j)=>pending.push({r,j}))});
user='A';const old=d.refresh();user='B';const newer=d.refresh();pending[0].r('private A');await old;assert.equal(values.length,0);pending[1].r('shared B');await newer;assert.deepEqual(values,['shared B']);
clock+=16000;const whileEditing=d.refresh();allowed=false;pending[2].r('background');await whileEditing;assert.deepEqual(values,['shared B']);
allowed=true;clock+=16000;const failed=d.refresh();pending[3].j(new Error('offline'));assert.equal(await failed,false);assert.deepEqual(values,['shared B']);
clock+=16000;const beforeLocal=d.refresh();d.reset();pending[4].r('older remote');await beforeLocal;assert.deepEqual(values,['shared B']);
const recovered=d.refresh();pending[5].r('latest');await recovered;assert.deepEqual(values,['shared B','latest']);
console.log('Uma consulta por vez; limite de frequência; isolamento entre contas; formulários, falha e recuperação.');
