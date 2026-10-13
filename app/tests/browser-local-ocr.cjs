const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/api/scan-receipt',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'not_configured',error:'Leitura online indisponível'})}));
 await context.route('https://cdn.jsdelivr.net/**',async route=>{
  const name=route.request().url().split('/').at(-1),path='/workspace/work/ocr-runtime/'+name;
  if(!fs.existsSync(path))throw Error('Missing runtime '+name);
  await route.fulfill({body:fs.readFileSync(path),contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.wasm')?'application/wasm':'application/octet-stream',headers:{'Access-Control-Allow-Origin':'*'}});
 });
 try{
  await page.goto(process.env.BIVVO_TEST_URL||'http://127.0.0.1:8766/privacidade/');
  const result=await page.evaluate(async()=>{
   const {readLocalText}=await import('/js/receipt-ocr.js');
   const c=document.createElement('canvas');c.width=900;c.height=750;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.fillStyle='black';x.font='30px Arial';
   const lines=['MINIMERCADO LIDER LTDA','CNPJ: 06.347.567/0001-56','DOCUMENTO AUXILIAR NFC-e','Valor total R$ 60,97','VALOR PAGO R$ 60,97','04/10/2026 11:27:48'];lines.forEach((l,i)=>x.fillText(l,40,65+i*75));
   const local=await readLocalText(c.toDataURL('image/png'));
   const {readReceipt}=await import('/js/scan.js');
   const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
   const combined=await readReceipt(new File([blob],'synthetic.png',{type:'image/png'}));
   return {local,combined};
  });
  assert.equal(result.local.status,'read',JSON.stringify(result));
  const expected={merchant:'MINIMERCADO LIDER LTDA',date:'2026-10-04',value:60.97};
  assert.deepEqual(result.local.data,expected);assert.equal(result.combined.ok,true);assert.deepEqual(result.combined.data,expected);assert.equal(result.combined.diagnostics.remoteStatus,'not_configured');assert.equal(result.combined.diagnostics.fieldsFound,3);assert.deepEqual(errors,[]);
  console.log('Actual Tesseract OCR in browser with CSP: synthetic receipt read without Gemini.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
