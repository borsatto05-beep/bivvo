const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.BIVVO_TEST_URL||'http://127.0.0.1:8765';
const out=process.env.BIVVO_ARTIFACT_DIR||path.resolve('work/validation');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),events=[],errors=[],httpErrors=[],signups=[];
 await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.pathname.startsWith('/api/')){try{const e=JSON.parse(r.request().postData());if(e.event)events.push(e);}catch{}return r.fulfill({status:200,contentType:'application/json',body:'{}'});}
  if(u.origin!==new URL(base).origin){
   if(u.hostname==='gqfirbhzjuzspermyvfy.supabase.co'&&u.pathname==='/auth/v1/signup'){
    const data=JSON.parse(r.request().postData());signups.push(data);
    return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'11111111-1111-4111-8111-111111111111',email:data.email,identities:[{id:'fake'}],user_metadata:data.data,confirmation_sent_at:new Date().toISOString()})});
   }
   return r.fulfill({status:200,contentType:'application/javascript',body:''});
  }
  return r.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(base).origin)httpErrors.push(r.status()+' '+r.url());});
 try{
  await page.goto(base+'/quanto-posso-gastar-hoje/?ref=abcdef12&utm_source=instagram&utm_medium=social&utm_campaign=reel_test');
  await page.waitForSelector('[data-bv42-share]');
  const initialConsent=page.getByRole('button',{name:'Continuar sem rastreamento',exact:true});if(await initialConsent.isVisible())await initialConsent.click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('bivvo_ref')),'abcdef12');
  const calculatorTop=await page.locator('#qSaldo').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  assert(calculatorTop<600,'calculator available in the first mobile screen');
  await page.click('#qCalc');assert.equal(await page.locator('#qResultado').innerText(),'—');
  await page.waitForTimeout(200);assert.equal(events.filter(e=>e.event==='seo_tool_completed').length,0,'invalid calculation cannot complete');
  await page.fill('#qSaldo','1500');await page.fill('#qContas','900');await page.fill('#qDias','10');await page.click('#qCalc');
  assert.match(await page.locator('#qResultado').innerText(),/60,00/);
  await page.waitForFunction(()=>document.querySelector('#spendableTool').dataset.toolCompleted==='true');await page.waitForTimeout(300);
  assert.equal(events.filter(e=>e.event==='seo_tool_completed').length,1);assert.equal(events.filter(e=>e.event==='seo_tool_started').length,1);
  const shareTop=await page.locator('[data-bv42-share]').evaluate(e=>e.getBoundingClientRect().top+scrollY),resultTop=await page.locator('.live-result').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  assert(shareTop-resultTop<700,'share next to result');assert.equal(await page.locator('#bv84-card-values').isChecked(),false);
  // Record text painted into the downloadable canvas: default excludes user numbers.
  await page.evaluate(()=>{window.__drawn=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__drawn.push(text);return original.call(this,text,...args);};});
  let download=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar cartão',exact:true}).click();const story=await download;await story.saveAs(path.join(out,'card-story-private.png'));
  const pixels=await page.evaluate(()=>new Promise(resolve=>{const c=document.createElement('canvas');c.width=1080;c.height=1920;resolve([c.width,c.height]);}));
  const png=fs.readFileSync(path.join(out,'card-story-private.png'));assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1920);
  assert(!(await page.evaluate(()=>window.__drawn.join(' '))).includes('60,00'));
  await page.check('#bv84-card-values');download=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar cartão',exact:true}).click();await(await download).saveAs(path.join(out,'card-story-optin.png'));
  assert((await page.evaluate(()=>window.__drawn.join(' '))).includes('60,00'));
  await page.uncheck('#bv84-card-values');await page.selectOption('select[aria-label="Formato do cartão"]','square');download=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar cartão',exact:true}).click();await(await download).saveAs(path.join(out,'card-square.png'));const square=fs.readFileSync(path.join(out,'card-square.png'));assert.equal(square.readUInt32BE(20),1080);
  // Cancelling native share is distinct from the successful system callback.
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Canceled','AbortError');}}));
  await page.getByRole('button',{name:'Compartilhar',exact:true}).click();await page.waitForTimeout(200);assert(events.some(e=>e.event==='organic_share_canceled'));assert(!events.some(e=>e.event==='organic_share_native'));
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async(payload)=>{window.__share=payload;}}));
  await page.getByRole('button',{name:'Compartilhar',exact:true}).click();await page.waitForTimeout(200);assert.equal(events.filter(e=>e.event==='organic_share_native').length,1);
  const shared=await page.evaluate(()=>window.__share);assert(!/1500|900|60,00|ref=|salary=/.test(shared.url));
  // A second person opens the shared URL in an independent browser session.
  const second=await browser.newContext();await second.route('**/api/**',r=>r.fulfill({status:204}));await second.route(/https:\/\//,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));const recipient=await second.newPage();await recipient.goto(shared.url);await recipient.waitForSelector('#qCalc');assert.equal(await recipient.evaluate(()=>new URL(location.href).searchParams.get('utm_medium')),'share');await second.close();
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,'calculator-mobile.png'),fullPage:false});
  // No duplicate page view on a reload in the same session.
  await page.reload();await page.waitForSelector('[data-bv42-share]');await page.waitForTimeout(200);assert.equal(events.filter(e=>e.event==='seo_page_viewed').length,1);
  await page.fill('#qSaldo','100');await page.fill('#qContas','200');await page.fill('#qDias','10');await page.click('#qCalc');assert.match(await page.locator('#qTexto').innerText(),/não há sobra/);
  await page.click('#qSignup');await page.waitForSelector('#authEmail');
  const consent=page.getByRole('button',{name:'Continuar sem rastreamento',exact:true});if(await consent.isVisible())await consent.click();
  assert.equal(await page.locator('#authName').evaluate(e=>e.required),false);assert.equal(await page.locator('#authPhone').evaluate(e=>e.required),false);
  await page.fill('#authEmail','test@example.com');await page.fill('#authPassword','Test-password-123');await page.fill('#authConfirm','Test-password-123');await page.click('#authSubmit');
  await page.waitForTimeout(400);assert.equal(signups.length,1,'signup dispatched only to mock backend');assert.equal(signups[0].data.referred_by,'abcdef12');assert.equal(signups[0].data.phone,'');assert.equal(signups[0].data.full_name,'');
  assert.equal(new URL(page.url()).searchParams.get('utm_source'),'instagram');
  assert(!events.some(e=>JSON.stringify(e).includes('1500')||JSON.stringify(e).includes('60,00')||JSON.stringify(e).includes('test@example.com')),'analytics excludes user inputs and email');
  for(const width of [320,390,1280]){await page.setViewportSize({width,height:844});await page.goto(base+'/quanto-posso-gastar-hoje/');await page.waitForSelector('[data-bv42-share]');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow at '+width);}
  await page.goto(base+'/ferramentas/embed/?tool=parcelas');await page.fill('input[name=total]','1200');await page.fill('input[name=months]','12');await page.getByRole('button',{name:'Calcular',exact:true}).click();assert.match(await page.locator('.bv42-embed-result').innerText(),/100,00/);
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/');await page.waitForFunction(()=>!document.body.classList.contains('booting'));await page.click('#landingDemo');await page.waitForSelector('#view .card,#view section');
  await page.evaluate(()=>{document.querySelector('#toast')?.classList.remove('show');window.scrollTo(0,0);});await page.screenshot({path:path.join(out,'demo-mobile.png')});
  await page.evaluate(async()=>{const store=await import('/js/store.js');store.commit(s=>{s.profile.modules={...s.profile.modules,loans:true};});location.hash='#/emprestimos';});
  await page.locator('#view').getByRole('heading',{name:'Bivvo Capital',exact:true}).waitFor();assert.equal(await page.evaluate(async()=>(await import('/js/store.js')).getState().loans.length),29);
  assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({calculatorTop,shareTop,resultTop,events:events.map(e=>({event:e.event,content:e.content})),signupMocked:true,errors,httpErrors},null,2));
  console.log('Growth browser: dist with CSP, mobile calculator, valid completion, referral through mocked signup, private cards 9:16/1:1, opt-in, share cancellation, second visitor, no duplicate view, demo and Capital passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
