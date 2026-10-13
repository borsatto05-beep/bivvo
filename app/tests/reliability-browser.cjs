const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const snapshot={family:{id:'f',name:'Casal · Ana & Caio',owner_id:'A'},members:[{id:'ma',user_id:'A',role:'owner',display_name:'Ana'},{id:'mb',user_id:'B',role:'editor',display_name:'Caio'}],shared:Array.from({length:235},(_,i)=>({id:String(1000-i),source_id:'source'+i,date:'2026-10-08',user_id:i%2?'B':'A',type:i===0?'income':'expense',value:i===0?5000:10,description:'Gasto '+i,category:'Mercado'})),shopping:[],active:true,kind:'couple',maxMembers:2};
 const requests={A:0,B:0},errors=[];let unavailable=false;
 async function pageFor(user){
  const context=await browser.newContext({viewport:{width:390,height:844}});const p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  await p.clock.install({time:new Date('2026-10-08T15:00:00Z')});
  await p.route('**/fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="/layout-refresh.css"></head><body class="in-app"><main id="view"></main><div id="toast"></div></body></html>'}));
  await p.route('**/api/family',async r=>{
   const body=r.request().postDataJSON();
   if(body.action==='get'){requests[user]++;if(unavailable)return r.fulfill({status:502,json:{error:'Sem conexão de teste'}});return r.fulfill({json:{ok:true,data:{...snapshot,membership:snapshot.members.find(m=>m.user_id===user)}}});}
   if(body.action==='share_transaction'){const t=body.transaction;snapshot.shared.unshift({id:'new',source_id:t.sourceId,user_id:user,date:t.date,description:t.desc,category:t.cat,type:t.type,value:t.value});return r.fulfill({json:{ok:true}});}
   return r.fulfill({status:400,json:{error:'unexpected '+body.action}});
  });
  await p.goto((process.env.BIVVO_TEST_URL||'http://127.0.0.1:8774')+'/fixture');
  await p.evaluate(async user=>{
   window.supabase={createClient:()=>({auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:user},access_token:'test-'+user}}}),mfa:{listFactors:async()=>({data:{totp:[]}})}}})};
   const cloud=await import('/js/cloud.js');await cloud.initAuth({});
   const store=await import('/js/store.js');store.load(store.emptyState(),{userId:user});
   const nav=await import('/js/nav.js'),view=await import('/js/views/family.js');
   nav.ctx.route='familia';nav.ctx.params={couple:'1'};nav.ctx.demo=false;
   const render=()=>{const root=document.querySelector('#view');root.replaceChildren();view.renderFamily(root);};
   nav.setHooks({render});window.testRender=render;render();
  },user);
  await p.locator('.couple-hero-balance').waitFor();return p;
 }
 try{
  const a=await pageFor('A'),b=await pageFor('B');
  assert.match(await b.locator('.couple-hero-balance').innerText(),/2\.660/);
  await a.getByRole('button',{name:/Gasto compartilhado/}).click();
  await a.getByLabel('Descrição',{exact:true}).fill('Mercado compartilhado');
  await a.getByLabel('Valor',{exact:true}).fill('50');
  await a.getByRole('button',{name:'Salvar',exact:true}).last().click();
  await a.locator('.couple-hero-balance').filter({hasText:'2.610'}).waitFor();
  await b.clock.runFor(60001);
  await b.locator('.couple-hero-balance').filter({hasText:'2.610'}).waitFor();
  assert.match(await b.locator('.shared-refresh-label').innerText(),/Atualizado/);
  // Do not replace a form or fetch while the partner is typing.
  await b.getByRole('button',{name:/Gasto compartilhado/}).click();await b.getByLabel('Descrição',{exact:true}).fill('Rascunho não salvo');
  const before=requests.B;await b.clock.runFor(60001);assert.equal(requests.B,before);assert.equal(await b.getByLabel('Descrição',{exact:true}).inputValue(),'Rascunho não salvo');
  await b.getByRole('button',{name:'Fechar',exact:true}).click();await b.clock.runFor(500);
  unavailable=true;await b.clock.runFor(60001);await b.locator('.shared-refresh-label').filter({hasText:'Sem atualização'}).waitFor();assert.match(await b.locator('.couple-hero-balance').innerText(),/2\.610/);
  unavailable=false;await b.clock.runFor(60001);await b.locator('.shared-refresh-label').filter({hasText:'Atualizado'}).waitFor();
  await b.evaluate(async()=>{const nav=await import('/js/nav.js');nav.ctx.params={couple:'1',tab:'gastos'};window.testRender();});
  assert.equal(await b.locator('.couple-recent .family-shared-row').count(),50);
  await b.locator('.couple-recent').getByRole('button',{name:/Ver mais/}).click();assert.equal(await b.locator('.couple-recent .family-shared-row').count(),100);
  await b.evaluate(async()=>{const store=await import('/js/store.js'),{today}=await import('/js/util.js');store.commit(s=>{s.transactions=[{id:'income',date:today(),type:'income',value:2000,status:'Pago',method:'PIX'},{id:'expense',date:today(),type:'expense',value:275.45,status:'Pago',cat:'Mercado',method:'Débito'}];});(await import('/js/views/life-education.js')).openLifeLesson('personal','budget');});
  assert.match(await b.locator('.sheet-body').innerText(),/275,45/);
  assert.deepEqual(errors,[]);console.log('PASS: duas sessões, gasto compartilhado, atualização em 60s, rascunho preservado, falha/recuperação, lista incremental e aula com gasto real.',requests);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
