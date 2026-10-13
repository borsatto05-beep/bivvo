const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || undefined,args:['--no-sandbox']});
 try {
  const p = await browser.newPage({viewport:{width:390,height:844}}), errors=[];
  p.setDefaultTimeout(10000);
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/api/**',r=>r.fulfill({status:204}));
  await p.route(/https:\/\//,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  await p.goto(process.env.BIVVO_TEST_URL || 'http://127.0.0.1:8779');
  await p.getByRole('button',{name:'Continuar sem rastreamento',exact:true}).click();
  await p.locator('#landingDemo').click();
  const goYou=async(params={})=>{await p.evaluate(async params=>(await import('/js/nav.js')).go('voce',params),params);await p.locator('.you-overview').waitFor();};
  const top=()=>p.locator('.you-overview');
  const dialog=()=>p.locator('.sheet-wrap:not(.out)').last().getByRole('dialog');
  const close=async()=>{await dialog().getByRole('button',{name:'Fechar',exact:true}).click();await p.waitForTimeout(280);};
  const snapshot=()=>p.evaluate(async()=>JSON.stringify((await import('/js/store.js')).serialize()));
  console.log('overview');await goYou(); const original=await snapshot();
  assert.equal(await top().locator('.menu-item').count(),8);
  assert(await p.locator('.fab-add').isHidden());
  assert.equal(await p.locator('[data-route="voce"] .life-page-tutor').count(),0);
  assert.equal(await top().getByText('Zerar todos os dados',{exact:true}).count(),0);
  assert.equal(await top().locator('.badges').count(),0);
  for(const width of [320,390,1280]) {
   await p.setViewportSize({width,height:844});
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert(await top().locator('.menu-item').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height>=44)));

  }
  await p.setViewportSize({width:390,height:844});
  await top().getByRole('button',{name:/Preferências/}).click();
  await dialog().getByRole('button',{name:/Meu perfil/}).click();
  await dialog().locator('input').first().fill('Perfil organizado');
  await dialog().getByRole('button',{name:'Salvar',exact:true}).click();await p.waitForTimeout(280);
  assert.equal(await dialog().getAttribute('aria-label'),'Preferências');
  await close();await top().getByRole('heading',{name:'Perfil organizado'}).waitFor();
  console.log('data');await top().getByRole('button',{name:/Dados e backup/}).click();
  assert.equal(await dialog().locator('button.menu-item').count(),5);
  await dialog().getByRole('button',{name:/Backup completo/}).click();
  await p.getByRole('dialog',{name:'Gerar backup?',exact:true}).waitFor();
  await dialog().getByRole('button',{name:'Cancelar',exact:true}).click();await p.waitForTimeout(280);await close();
  console.log('security');await top().getByRole('button',{name:/Segurança e privacidade/}).click();
  await dialog().getByRole('button',{name:/Ações da conta/}).click();
  await dialog().getByRole('button',{name:/Zerar todos os dados/}).click();
  assert(await dialog().getByRole('button',{name:'Zerar tudo',exact:true}).isDisabled());
  await dialog().getByRole('button',{name:'Cancelar',exact:true}).click();await p.waitForTimeout(280);await close();await close();
  await top().getByRole('button',{name:/Seu progresso/}).click();
  assert.equal(await dialog().locator('.stats').count(),1);assert(await dialog().locator('.badge-a').count()>0);await close();
  await top().getByRole('button',{name:/Assinatura/}).click();assert(await dialog().getByRole('button',{name:/Conhecer planos|Ver assinatura/}).count());await close();
  console.log('tools');await top().getByRole('button',{name:/Ferramentas e compartilhar/}).click();
  await dialog().getByRole('button',{name:/Escola financeira/}).click();
  assert.equal(await dialog().getAttribute('aria-label'),'Escola financeira pessoal');await close();await close();
  // Check back navigation from a group returns to the overview.
  console.log('data');await top().getByRole('button',{name:/Dados e backup/}).click();await p.goBack();await p.waitForTimeout(280);assert.equal(await p.locator('.sheet-wrap.in').count(),0);
  // Real account menu is reachable without exercising account mutations.
  await p.evaluate(async()=>{const nav=await import('/js/nav.js');nav.ctx.demo=false;const root=document.querySelector('.you-overview').parentElement;root.replaceChildren();(await import('/js/views/you.js')).renderYou(root);});
  console.log('security');await top().getByRole('button',{name:/Segurança e privacidade/}).click();
  assert.equal(await dialog().getByRole('button',{name:/Trocar senha/}).count(),1);
  assert.equal(await dialog().getByRole('button',{name:/Verificação em duas etapas/}).count(),1);
  await dialog().getByRole('button',{name:/Ações da conta/}).click();assert.equal(await dialog().getByRole('button',{name:/Excluir minha conta/}).count(),1);await close();await close();
  await p.evaluate(async()=>{(await import('/js/nav.js')).ctx.demo=true;});
  // Preserve all financial records when navigating and changing settings.
  const before=JSON.parse(original), after=JSON.parse(await snapshot());
  for(const key of ['transactions','cards','loans','fixed','goals'])assert.deepEqual(after[key],before[key],key);
  await top().getByRole('button',{name:/Ambiente Pessoal/}).click();await dialog().locator('.finance-space-company').click();
  await p.waitForFunction(()=>document.body.dataset.financeProfile==='company');
  await p.locator('#view[data-route="inicio"]').waitFor();
  await p.locator('.fab-add').waitFor({state:'visible'});await goYou();
  assert.equal(await top().getByRole('button',{name:/Ambiente Empresa/}).count(),1);
  await top().getByRole('button',{name:/Preferências/}).click();assert.equal(await dialog().getByRole('button',{name:/Dados do negócio/}).count(),1);assert.equal(await dialog().getByRole('button',{name:/Categorias da empresa/}).count(),1);await close();
  assert.equal(await p.locator('[data-route="voce"] .company-page-tutor').count(),0);
  await top().getByRole('button',{name:/Ambiente Empresa/}).click();await dialog().locator('.finance-space-couple').click();
  await p.waitForFunction(()=>document.body.dataset.financeProfile==='couple');await goYou({finance:'couple'});
  assert.equal(await top().locator('.menu-item').count(),6);
  assert.equal(await top().getByRole('button',{name:/Dados e backup/}).count(),0);
  await top().getByRole('button',{name:/Preferências/}).click();assert.equal(await dialog().getAttribute('aria-label'),'Configurações do Casal');assert.equal(await dialog().getByRole('button',{name:/Categorias do casal/}).count(),1);await close();
  console.log('security');await top().getByRole('button',{name:/Segurança e privacidade/}).click();assert.equal(await dialog().getByRole('button',{name:/Privacidade entre vocês/}).count(),1);await close();
  await top().getByRole('button',{name:/Ambiente Casal/}).click();await dialog().locator('.finance-space-personal').click();await p.waitForFunction(()=>document.body.dataset.financeProfile==='personal');await goYou();
  assert.deepEqual(JSON.parse(await snapshot()).transactions,before.transactions);
  assert.deepEqual(errors,[]);
  console.log('PASS: compact overview, 320/390/1280px, grouped actions, profile save and return, backup/reset cancellations, browser back, account security, progress, plan, school, three environments and financial data preserved.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
