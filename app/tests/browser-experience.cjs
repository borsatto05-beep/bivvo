const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await context.route('**/api/**',r=>r.fulfill({status:204}));await context.route(/https:\/\//,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 try{
  await page.goto(process.env.BIVVO_TEST_URL||'http://127.0.0.1:8766');await page.getByRole('button',{name:'Continuar sem rastreamento',exact:true}).click();await page.locator('#landingDemo').click();await page.waitForSelector('.qc-shell');
  assert.equal(await page.locator('.tabbar button:visible').count(),5);assert.equal(await page.locator('.fab-add').isVisible(),false,'home uses its visible quick-capture controls');assert(await page.locator('.qc-shell').isVisible());
  await page.evaluate(async()=>{const store=await import('/js/store.js'),{today,addMonthsYM}=await import('/js/util.js');store.commit(s=>{s.profile.modules={...s.profile.modules,loans:true};s.transactions.push({id:'ux-old',type:'expense',desc:'Padaria São João',cat:'Mercado',value:42.9,date:addMonthsYM(today().slice(0,7),-1)+'-03',status:'Pago',method:'Débito',createdAt:1},{id:'ux-pending',type:'expense',desc:'Conta teste pendente',cat:'Outros',value:70,date:today(),status:'Pendente',method:'PIX',createdAt:2});});});
  await page.waitForTimeout(100);assert.equal(await page.locator('.tabbar button:visible').count(),5);assert(await page.locator('.home-agenda').getByText('Conta teste pendente',{exact:true}).isVisible());
  const count=await page.evaluate(async()=> (await import('/js/store.js')).getState().transactions.length);
  await page.evaluate(async()=> (await import('/js/views/forms.js')).openTxDetail('ux-old'));
  await page.getByRole('button',{name:'☆ Favoritar gasto',exact:true}).click();
  assert.equal(await page.evaluate(async()=> (await import('/js/store.js')).getState().transactions.length),count,'favoriting does not create a transaction');
  await page.getByRole('dialog').getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.sheet-wrap'));
  await page.evaluate(async()=> (await import('/js/views/forms.js')).openTxDetail('ux-old'));await page.getByRole('button',{name:'Repetir gasto',exact:true}).click();await page.getByRole('heading',{name:'Novo gasto',exact:true}).waitFor();
  assert.equal(await page.locator('input[aria-label="Valor"]').inputValue(),'42,90');assert.equal(await page.locator('input[aria-label="Descrição"]').inputValue(),'Padaria São João');
  const today=await page.evaluate(async()=> (await import('/js/util.js')).today());assert.equal(await page.locator('input[aria-label="Data"]').inputValue(),today);assert.equal(await page.locator('.tx-options').getAttribute('open'),null,'extra controls folded');
  await page.getByRole('dialog').getByRole('button',{name:'Adicionar',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.sheet-wrap'));assert.equal(await page.evaluate(async()=> (await import('/js/store.js')).getState().transactions.length),count+1);
  await page.locator('.tabbar button').filter({hasText:'Movimentos'}).click();await page.getByRole('searchbox',{name:'Buscar lançamentos'}).fill('sao joao');
  assert((await page.locator('.search-results').innerText()).includes('todos os meses'));assert.equal(await page.locator('#view .tx').count(),2);
  await page.getByRole('searchbox',{name:'Buscar lançamentos'}).fill('42,90');assert((await page.locator('#view').innerText()).includes('Padaria São João'));
  await page.locator('.tabbar button').filter({hasText:'Planejamento'}).click();await page.getByRole('tab',{name:'Agenda de contas'}).waitFor();assert(await page.locator('.tabbar button').filter({hasText:'Capital'}).isVisible());
  await page.getByRole('tab',{name:'Agenda de contas'}).click();await page.locator('.agenda-month').getByText('Conta teste pendente',{exact:true}).waitFor();
  await page.locator('.tabbar button').filter({hasText:'Início'}).click();await page.getByRole('button',{name:'Personalizar início',exact:true}).click();await page.getByRole('checkbox',{name:'Cartões',exact:true}).uncheck();await page.getByRole('dialog',{name:'Personalizar início',exact:true}).getByRole('button',{name:'Salvar',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.sheet-wrap'));assert.equal(await page.locator('.inv').first().isVisible(),false);
  await page.evaluate(async()=>{const e=await import('/js/experience.js');e.removeFavorite(e.favorites()[0].id);});await page.waitForTimeout(100);assert.equal(await page.evaluate(async()=> (await import('/js/experience.js')).favorites().length),0);
  await page.evaluate(()=>window.dispatchEvent(new Event('offline')));assert((await page.locator('#syncStatus').innerText()).includes('Sem conexão'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no mobile overflow');
  await page.evaluate(()=>document.querySelector('#toast').classList.remove('show'));
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(250);
  await page.screenshot({path:'/workspace/work/home-experience.png',fullPage:false});for(const width of [320,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow at '+width);}
  assert.deepEqual(errors,[]);console.log('UX: five-tab navigation, agenda, favorites without duplicate save, confirmed repetition, global accent/amount search, planning shortcuts, preferences and sync indicator passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
