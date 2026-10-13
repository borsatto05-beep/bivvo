const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[];
 let external=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({status:204}));
 await page.route(/https:\/\//,r=>{external++;return r.fulfill({status:200,contentType:'application/javascript',body:''});});
 const url=process.env.BIVVO_TEST_URL || 'http://127.0.0.1:8765';
 try {
  await page.goto(url);await page.waitForSelector('.privacy-panel');
  await page.waitForFunction(()=>document.querySelector('#landingDemo') && !document.body.classList.contains('booting'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no mobile overflow');
  assert.equal(external,0,'no external requests before consent (SDK is local)');
  await page.getByRole('button',{name:'Continuar sem rastreamento',exact:true}).click();
  await page.locator('#landingDemo').click();await page.waitForSelector('#view [data-qa],#view .card,#view section');
  assert.equal(await page.locator('.privacy-toggle').count(),0,'no floating privacy button');
  assert.equal(await page.evaluate(()=>window.bivvoPrivacy.marketingAllowed()),false);
  await page.evaluate(()=>{location.hash='#/voce';});
  await page.locator('#view').getByRole('button',{name:/Segurança e privacidade/}).click();
  await page.getByRole('button',{name:/Revisar permissões/}).click();
  await page.getByRole('button',{name:'Permitir medição de campanhas',exact:true}).click();
  await page.waitForFunction(()=>window.__bivvoPixelLoaded===true);await page.waitForTimeout(150);
  assert(external>=1,'pixel loads only after consent');
  await page.evaluate(()=>{location.hash='#/voce';});
  await page.getByRole('button',{name:/Revisar permissões/}).click();
  await page.getByRole('button',{name:'Continuar sem rastreamento',exact:true}).click();
  assert.equal(await page.locator('.privacy-toggle').count(),0,'no floating privacy button');
  assert.equal(await page.evaluate(()=>window.bivvoPrivacy.marketingAllowed()),false);
  const previousExternal=external;
  await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('booting'));
  assert.equal(external,previousExternal,'revocation survives reload');
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
  await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.route('**/js/util.js?release-probe=1',r=>r.fulfill({status:200,contentType:'application/javascript',body:"throw new Error('mixed release');"}));
  assert.equal(await page.evaluate(async()=> (await import('/js/util.js?release-probe=1')).VERSION),JSON.parse(fs.readFileSync('package.json','utf8')).version,'active worker keeps its installed module version');
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('booting'));
  await page.locator('#landingDemo').click();await page.waitForSelector('#view .card,#view section');
  const qrPixels=fs.readFileSync('tests/fixtures/receipt-qr.png').toString('base64');
  const decoded=await page.evaluate(async(base64)=>{
    window.BarcodeDetector=undefined; // simula navegador sem leitor nativo, como iPhone
    const { _test }=await import('/js/scan.js');
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    const image=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    canvas.getContext('2d').drawImage(image,0,0);
    const qr=await _test.detectQr(canvas);return {qr,data:_test.qrFields(qr)};
  },qrPixels);
  assert.equal(decoded.qr.detected,true,'QR decoded without native BarcodeDetector');
  assert.deepEqual(decoded.data,{merchant:null,date:'2026-10-04',value:83.54});
  for (let mask=0;mask<8;mask++) {
    await page.evaluate(async(mask)=>{
      const {openScanConfirm}=await import('/js/views/scanconfirm.js');
      openScanConfirm({merchant:mask&1?'Loja teste':null,date:mask&2?'2026-10-04':null,value:mask&4?60.97:null});
    },mask);
    await page.getByRole('heading',{name:'Novo gasto',exact:true}).waitFor();
    assert.equal(await page.locator('.scan-confirm').count(),0,'no separate scanner screen');
    assert.equal(await page.locator('input[aria-label="Descrição"]').inputValue(),mask&1?'Loja teste':'');
    assert.equal(await page.locator('input[aria-label="Data"]').inputValue(),mask&2?'2026-10-04':'','missing date not invented');
    assert.equal(await page.locator('input[aria-label="Valor"]').inputValue(),mask&4?'60,97':'');
    if(mask===0){await page.getByRole('dialog').getByRole('button',{name:'Adicionar',exact:true}).click();assert((await page.locator('form.form .form-msg:visible').innerText()).includes('Informe um valor'));}
    if(mask===5){await page.getByRole('dialog').getByRole('button',{name:'Adicionar',exact:true}).click();assert((await page.locator('form.form .form-msg:visible').innerText()).includes('Informe a data'));}
    await page.locator('input[aria-label="Descrição"]').focus();
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('input[aria-label="Descrição"]'));
  }
  await context.setOffline(false);
  await page.goto(url+'/privacidade/');assert.equal(await page.locator('h1').innerText(),'Privacidade no Bivvo');
  // A deploy that changes mid-install must fail as a whole, leaving no partial shell.
  const asset='dist/js/util.js',original=fs.readFileSync(asset);
  const fresh=await browser.newContext();
  try {
    fs.appendFileSync(asset,'\n/* release mismatch fixture */');
    const check=await fresh.newPage();await check.goto(url+'/privacidade/');
    const state=await check.evaluate(async()=>{
      const reg=await navigator.serviceWorker.register('/sw.js');
      const worker=reg.installing;
      if(!worker)return reg.active?.state || 'missing';
      return new Promise(resolve=>{worker.addEventListener('statechange',()=>{if(['redundant','activated'].includes(worker.state))resolve(worker.state);});});
    });
    assert.equal(state,'redundant','mixed release cannot activate');
    assert.equal(await check.evaluate(async(prefix)=> (await caches.keys()).filter(x=>x.startsWith(prefix)).length,'bivvo-v'+JSON.parse(fs.readFileSync('package.json','utf8')).version.replaceAll('.','-')),0,'partial cache removed');
  }finally{fs.writeFileSync(asset,original);await fresh.close();}
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('Browser: consent/revocation, local SDK, mobile demo, complete offline shell, scanner review, keyboard close and privacy page passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
