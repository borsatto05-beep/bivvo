const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/api/**',r=>r.fulfill({status:204}));await p.route(/https:\/\//,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  await p.goto(process.env.BIVVO_TEST_URL||'http://127.0.0.1:8780');
  await p.getByRole('button',{name:'Continuar sem rastreamento',exact:true}).click();
  console.log('landing');
  await p.locator('[data-orbit-intent="reserve"]').click();
  assert.equal(await p.locator('[data-orbit-intent="reserve"]').getAttribute('aria-pressed'),'true');
  await p.locator('#landingOrbitDemo').click();await p.locator('.orbit-map').waitFor();
  assert.equal(await p.locator('.orbit-page h1').textContent(),'Começar minha reserva');
  const dialog=()=>p.locator('.sheet-wrap:not(.out)').last().getByRole('dialog');
  const close=async()=>{await dialog().getByRole('button',{name:'Fechar',exact:true}).click();await p.waitForTimeout(300);};
  const snapshot=()=>p.evaluate(async()=>{const s=(await import('/js/store.js')).getState();return JSON.stringify(Object.fromEntries(['transactions','cards','loans','fixed','goals','budget_limits','savingPlan','companyProducts'].map(k=>[k,s[k]])));});
  const navigate=async(route,params={})=>{await p.evaluate(async({route,params})=>(await import('/js/nav.js')).go(route,params),{route,params});await p.waitForTimeout(350);};
  const setGoal=async(goal,space='personal')=>{await p.evaluate(async({goal,space})=>(await import('/js/learning.js')).chooseLearningGoal(goal,space),{goal,space});await navigate('aprender',space==='couple'?{finance:'couple'}:{});};
  const current=()=>p.evaluate(async()=>{const L=await import('/js/learning.js');return L.journeySnapshot(undefined,document.body.dataset.financeProfile||'personal').current;});
  await setGoal('expenses');const original=await snapshot();
  console.log('mobile layouts');
  for(const width of [320,390,1280]){await p.setViewportSize({width,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert(await p.locator('.orbit-node').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().width>=44)));}
  await p.setViewportSize({width:390,height:844});assert.equal(await p.locator('.orbit-node:disabled').count(),6);
  console.log('learning stages and seven real actions');
  for(let i=0;i<7;i++){
   const step=await current();assert(step,`mission ${i}`);
   await p.locator('.orbit-mission .orbit-button').click();await dialog().locator('.orbit-quiz').waitFor();
   if(i===0){await dialog().locator('.orbit-answer').nth((step.correct+1)%step.options.length).click();assert.equal(await dialog().getByRole('button',{name:'Experimentar o conceito',exact:true}).count(),0);}
   await dialog().locator('.orbit-answer').nth(step.correct).click();await dialog().getByRole('button',{name:'Experimentar o conceito',exact:true}).click();
   assert(await dialog().getByRole('button',{name:'Levar para minha vida',exact:true}).isDisabled());
   await dialog().locator('input[type=range]').evaluate(n=>{n.value=Number(n.value)<Number(n.max)?Number(n.value)+Number(n.step):Number(n.value)-Number(n.step);n.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.equal(await snapshot(),original,'illustrative lab never writes financial records');
   await dialog().getByRole('button',{name:'Levar para minha vida',exact:true}).click();
   assert(await dialog().getByRole('button',{name:'Concluir esta missão',exact:true}).isDisabled());
   if(i===1){await close();await p.locator('.orbit-mission .orbit-button').click();await dialog().getByRole('button',{name:'Concluir esta missão',exact:true}).waitFor();}
   const alt=dialog().getByRole('checkbox',{name:'Confirmar alternativa da missão',exact:true});if(await alt.count())await alt.check();
   await dialog().getByRole('checkbox',{name:'Confirmei minha ação',exact:true}).check();
   await dialog().getByRole('button',{name:'Concluir esta missão',exact:true}).click();await dialog().getByRole('button',{name:'Ver meu próximo passo',exact:true}).click();await p.waitForTimeout(450);
   assert.equal(await snapshot(),original,'reviewing existing records does not invent financial changes');
  }
  assert(await p.locator('.orbit-map h2').getByText('Uma nova visão para suas decisões.',{exact:true}).count());assert.equal(await p.locator('.orbit-node.done').count(),7);
  console.log('weekly review and payload reload');
  await p.getByRole('button',{name:'Revisar esta semana',exact:true}).click();await dialog().getByRole('button',{name:'Revisar um limite',exact:true}).click();await dialog().getByRole('checkbox',{name:'Conferi os registros desta semana',exact:true}).check();await dialog().getByRole('button',{name:'Salvar minha revisão',exact:true}).click();await p.waitForTimeout(300);
  await p.evaluate(async()=>{const s=await import('/js/store.js');const payload=s.serialize();s.load(payload,{demo:true});});await navigate('aprender');assert.equal(await p.locator('.orbit-node.done').count(),7);
  console.log('plans, monthly default and cancellation');
  await p.evaluate(async()=>(await import('/js/views/pro.js')).openProScreen());await dialog().locator('.orbit-plan-focus h3').waitFor();assert.equal(await dialog().locator('.orbit-plan-focus h3').textContent(),'Bivvo Plus');assert(await dialog().getByRole('button',{name:'Mensal',exact:true}).evaluate(n=>n.classList.contains('active')));
  await dialog().locator('.orbit-other-plans summary').click();assert.equal(await dialog().locator('.pro-price:visible').count(),6);
  await dialog().getByRole('button',{name:'Assinar Plus',exact:true}).click();await dialog().getByRole('button',{name:'Cancelar',exact:true}).click();await p.waitForTimeout(300);assert.equal(await dialog().getAttribute('aria-label'),'Planos Bivvo');await close();
  console.log('three separate learning spaces');
  await p.evaluate(async()=>(await import('/js/store.js')).switchFinanceProfile('company'));await setGoal('cash','company');assert.equal(await current().then(s=>s.id),'foundation');
  assert.equal(await p.locator('.orbit-node.done').count(),0);assert.equal(await p.evaluate(async()=>(await import('/js/learning.js')).journeySnapshot(undefined,'personal').applied),7);
  await p.evaluate(async()=>(await import('/js/views/pro.js')).openProScreen());assert.equal(await dialog().locator('.orbit-plan-focus h3').textContent(),'Bivvo Empreendedor');await close();
  await p.evaluate(async()=>(await import('/js/store.js')).switchFinanceProfile('personal'));await setGoal('household','couple');
  await p.locator('.orbit-mission .orbit-button').click();const couple=await current();await dialog().locator('.orbit-answer').nth(couple.correct).click();await dialog().getByRole('button',{name:'Experimentar o conceito',exact:true}).click();await dialog().locator('input[type=range]').evaluate(n=>n.dispatchEvent(new Event('input',{bubbles:true})));await dialog().getByRole('button',{name:'Levar para minha vida',exact:true}).click();assert(await dialog().getByText(/Seus dados pessoais não são usados/).count());await dialog().getByRole('checkbox',{name:'Confirmar alternativa da missão',exact:true}).check();await dialog().getByRole('checkbox',{name:'Confirmei minha ação',exact:true}).check();await dialog().getByRole('button',{name:'Concluir esta missão',exact:true}).click();await close();assert.equal(await snapshot(),original);
  await p.evaluate(async()=>(await import('/js/views/pro.js')).openProScreen());assert.equal(await dialog().locator('.orbit-plan-focus h3').textContent(),'Bivvo Casal');await close();
  console.log('zero balance without invented income');
  await navigate('inicio');await p.evaluate(async()=>{const s=await import('/js/store.js');s.load(s.emptyState(),{demo:true});(await import('/js/views/onboarding.js')).openOpeningBalance();});await dialog().locator('input').fill('0');await dialog().getByRole('button',{name:'Salvar',exact:true}).click();await p.waitForTimeout(300);assert(await p.evaluate(async()=>(await import('/js/finance.js')).hasBalanceBase()));assert.equal(await p.evaluate(async()=>(await import('/js/store.js')).getState().transactions.length),0);
  console.log('first onboarding and nested action');
  await p.evaluate(async()=>{const s=await import('/js/store.js');s.load(s.emptyState(),{demo:true});(await import('/js/views/onboarding.js')).startOnboarding();});
  await dialog().locator('.orbit-goal').first().click();await dialog().getByRole('button',{name:'Começar minha órbita',exact:true}).click();await p.waitForTimeout(400);
  await dialog().getByRole('textbox',{name:'Renda mensal',exact:true}).fill('3000');await dialog().getByRole('spinbutton').fill('5');await dialog().getByRole('button',{name:'Continuar',exact:true}).click();
  await dialog().getByRole('textbox',{name:'Saldo de hoje',exact:true}).fill('0');await dialog().getByRole('button',{name:'Continuar',exact:true}).click();await dialog().getByRole('button',{name:'Não tenho contas agora',exact:true}).click();await dialog().getByRole('button',{name:'Abrir minha primeira missão',exact:true}).click();await p.waitForTimeout(450);
  assert.equal(await current().then(s=>s.id),'foundation');assert(await p.evaluate(async()=>(await import('/js/finance.js')).hasBalanceBase()));
  await p.evaluate(async()=>{const L=await import('/js/learning.js');L.answerLearningLesson('foundation',1);L.practiceLearningLesson('foundation');L.applyLearningLesson('foundation',{confirmed:true});});await navigate('aprender');
  await p.locator('.orbit-mission .orbit-button').click();await dialog().locator('.orbit-answer').nth(2).click();await dialog().getByRole('button',{name:'Experimentar o conceito',exact:true}).click();await dialog().locator('input[type=range]').evaluate(n=>n.dispatchEvent(new Event('input',{bubbles:true})));await dialog().getByRole('button',{name:'Levar para minha vida',exact:true}).click();assert.equal(await dialog().getByRole('checkbox',{name:'Confirmar alternativa da missão',exact:true}).count(),1);
  await dialog().getByRole('button',{name:'Registrar ou revisar um gasto ›',exact:true}).click();await dialog().getByRole('textbox',{name:'Valor',exact:true}).fill('25');await dialog().getByLabel('Descrição',{exact:true}).fill('Mercado');await dialog().getByRole('combobox',{name:'Categoria',exact:true}).selectOption('Mercado');await dialog().getByRole('button',{name:'Adicionar',exact:true}).click();await p.waitForTimeout(350);
  assert.equal(await dialog().getAttribute('aria-label'),'Registre para enxergar');await dialog().getByRole('checkbox',{name:'Confirmei minha ação',exact:true}).check();assert(await dialog().getByRole('button',{name:'Concluir esta missão',exact:true}).isEnabled());await dialog().getByRole('button',{name:'Concluir esta missão',exact:true}).click();await close();assert.equal(await p.evaluate(async()=>(await import('/js/store.js')).getState().transactions.filter(t=>t.desc==='Mercado').length),1);
  assert.deepEqual(errors,[]);console.log('PASS: goal/demo, 320/390/1280px, quiz gates, simulation isolation, 7 missions, resume, weekly review, reload, 3 spaces, contextual plans, cancellation and zero balance.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
