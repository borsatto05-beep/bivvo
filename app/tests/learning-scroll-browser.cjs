const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,bypassCSP:true});
 await p.route('**/api/**',r=>r.fulfill({status:204}));await p.route(/https:\/\//,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 await p.goto(process.env.BIVVO_TEST_URL||'http://127.0.0.1:8781');
 await p.getByRole('button',{name:'Continuar sem rastreamento',exact:true}).click();await p.locator('#landingDemo').click();await p.locator('.orbit-home').waitFor();
 const open=()=>p.evaluate(async()=>{const store=await import('/js/store.js'),L=await import('/js/learning.js'),V=await import('/js/views/learning.js');store.load(store.emptyState({name:'Ana',onboarded:true}),{demo:true});L.chooseLearningGoal('expenses','personal');V.openLearningMission('foundation','personal');});
 const body=p.locator('.sheet-wrap:not(.out) .sheet-body');
 await open();await p.waitForTimeout(300);await p.getByRole('button',{name:/^A R/}).click();assert(await p.getByRole('button',{name:'Continuar para experimentar',exact:true}).isDisabled());assert(!(await p.locator('.orbit-lesson').innerText()).includes('null'));assert(await p.getByText('Reveja a explicação e escolha outra resposta para liberar a próxima etapa.',{exact:true}).count());
 // Reproduce the old implicit grid row shrinking, which clipped the lesson.
 const old=await p.addStyleTag({content:'.sheet-body{grid-auto-rows:auto;min-height:auto;flex:1}'});
 const before=await body.evaluate(n=>({scroll:n.scrollHeight-n.clientHeight,lesson:n.firstElementChild.scrollHeight-n.firstElementChild.clientHeight}));
 console.log('Before:',before);assert(before.lesson>20,'Old layout must clip the lesson to reproduce the reported issue');await old.evaluate(n=>n.remove());
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:590,height:1280}]){
 await p.setViewportSize(viewport);await body.evaluate(n=>n.scrollTop=0);
 const geometry=await body.evaluate(n=>({scroll:n.scrollHeight-n.clientHeight,clipped:n.firstElementChild.scrollHeight-n.firstElementChild.clientHeight}));if(viewport.height<900)assert(geometry.scroll>0);assert(geometry.clipped<=1);
 const box=await body.boundingBox(),cdp=await p.context().newCDPSession(p);
 const x=box.x+box.width/2,y=box.y+box.height*.8;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*Math.min(400,box.height*.6)/12}]});await p.waitForTimeout(20);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(200);if(geometry.scroll>0)assert(await body.evaluate(n=>n.scrollTop)>0,'Touch gesture must scroll');await cdp.detach();
 await body.evaluate(n=>n.scrollTop=n.scrollHeight);await p.getByRole('button',{name:'B R$ 400, considerando essas contas',exact:true}).click();await body.evaluate(n=>n.scrollTop=n.scrollHeight);
 assert(!(await body.innerText()).includes('null'));const next=p.getByRole('button',{name:'Continuar para experimentar',exact:true});await next.click();await p.getByRole('slider').waitFor();
 await p.locator('.sheet-wrap:not(.out)').getByRole('button',{name:'Fechar',exact:true}).click();await p.waitForTimeout(280);assert(!(await p.locator('body').getAttribute('class')||'').includes('sheet-open'));await open();await p.waitForTimeout(280);
 }
 await p.screenshot({path:'/workspace/work/delivery/BIVVO_ORBITA_ROLAGEM_CORRIGIDA.png'});
 console.log('PASS: old clipping reproduced; touch scroll, last option, next phase and close work at 320/390/590px.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
