const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/api/**',r=>r.fulfill({status:204}));await p.route(/https:\/\//,r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 await p.goto(process.env.BIVVO_TEST_URL||'http://127.0.0.1:8778');await p.getByRole('button',{name:'Continuar sem rastreamento',exact:true}).click();await p.evaluate(async()=>(await import('/js/nav.js')).enterDemo());await p.waitForTimeout(500);console.log('Startup errors',errors);
 await p.evaluate(async()=>{
  const st=await import('/js/store.js'),u=await import('/js/util.js'),nav=await import('/js/nav.js'),date=u.today(),ym=u.ymOf(date),prev=u.addMonthsYM(ym,-1);
  st.commit(s=>{
   const clean=st.emptyState({...s.profile,onboarded:true,activeFinanceProfile:'personal',modules:{loans:true}});Object.assign(s,clean);
   s.cards=[{id:'c1',name:'Cartão teste',close:28,due:30,limit:10000,tint:'plum'}];
   s.transactions=[{id:'balance',type:'income',desc:'Saldo inicial',cat:'Saldo inicial',kind:'opening',method:'PIX',status:'Pago',date,value:20000},
   {id:'out',loanId:'existing',transactionRole:'loan_principal_out',type:'expense',desc:'Empréstimo para Cliente existente',cat:'Juros / Empréstimo',date,method:'PIX',value:4000,status:'Pago'},
   {id:'old-principal',loanId:'existing',loanPaymentId:'old',transactionRole:'loan_principal_return',type:'income',desc:'Principal recebido',cat:'Juros / Empréstimo',date,method:'PIX',value:1000,status:'Pago'},
   {id:'old-interest',loanId:'existing',loanPaymentId:'old',transactionRole:'loan_interest_income',type:'income',desc:'Juros recebidos',cat:'Juros / Empréstimo',date,method:'PIX',value:400,status:'Pago'},
   {id:'purchase-old',type:'expense',desc:'Compra antiga',cat:'Compras',date:prev+'-08',method:'Crédito',card:'Cartão teste',invoice:prev,value:120,status:'Pendente'},
   {id:'purchase-open',type:'expense',desc:'Compra atual',cat:'Compras',date,method:'Crédito',card:'Cartão teste',invoice:ym,value:250,status:'Pendente'}];
   s.loans=[{id:'existing',person:'Cliente existente',principalOriginal:4000,principal:3000,interestMode:'fixed',interestFixed:400,interestDue:400,periodicity:'monthly',due:date,status:'open'}];
   s.loanPayments=[{id:'old',loanId:'existing',principal:1000,interest:400,amount:1400,date,method:'PIX'}];
   s.loanCycles=[{id:'created',loanId:'existing',type:'created',principal:4000,interest:400,date,due:date},{id:'renew',loanId:'existing',type:'renewal',principal:3000,interest:400,date,due:date}];
  });nav.ctx.month=ym;nav.go('emprestimos');
 });
 const balance=()=>p.evaluate(async()=>(await import('/js/finance.js')).balance());
 const initialBalance=await balance();
 await p.getByRole('button',{name:'Parcelar saldo',exact:true}).click();await p.getByLabel('Total do novo acordo (com juros)',{exact:true}).fill('8000');await p.getByRole('button',{name:'Confirmar parcelamento',exact:true}).click();await p.locator('.loan-installment-row').first().waitFor();
 assert.equal(await p.locator('.loan-installment-row').count(),10);
 for(const width of [320,390,1280]){await p.setViewportSize({width,height:900});assert(await p.locator('.loan-installment-row').first().evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
 await p.setViewportSize({width:390,height:844});assert.equal(await balance(),initialBalance);
 assert.match(await p.locator('.sheet').last().innerText(),/Principal parcelado R\$\s*3\.000,00/);
 assert.match(await p.locator('.sheet').last().innerText(),/Histórico anterior ao parcelamento \(1\)/);
 await p.locator('.loan-installment-row').first().getByRole('button',{name:'Marcar como paga',exact:true}).click();await p.getByRole('button',{name:'Confirmar pagamento',exact:true}).click();await p.locator('.loan-installment-row.paid').waitFor();assert.equal(await balance(),initialBalance+500);assert.equal(await p.evaluate(async()=>(await import('/js/finance.js')).capitalBalance()),1300);
 await p.getByRole('button',{name:'Compartilhar com cliente',exact:true}).click();assert.match(await p.getByLabel('Mensagem para o cliente').inputValue(),/Saldo pendente: R\$\s*7\.200,00/);
 await p.getByRole('button',{name:'Fechar',exact:true}).last().click();await p.waitForTimeout(300);
 await p.getByRole('button',{name:'Ver parcelas',exact:true}).click();await p.getByRole('button',{name:'Desfazer pagamento',exact:true}).click();await p.getByRole('button',{name:'Excluir pagamento',exact:true}).click();await p.locator('.loan-installment-row').first().waitFor();await p.waitForTimeout(350);
 assert.equal(await p.locator('.loan-installment-row.paid').count(),0);assert.equal(await balance(),initialBalance);
 assert.equal(await p.evaluate(async()=>(await import('/js/store.js')).getState().loanPayments.length),1);
 await p.getByRole('button',{name:'Fechar',exact:true}).last().click();await p.waitForTimeout(300);
 await p.evaluate(async()=>(await import('/js/nav.js')).go('cartoes'));
 await p.locator('.invoice-pay-actions button').waitFor();assert.match(await p.locator('.inv-total').innerText(),/120,00/);
 await p.locator('.invoice-pay-actions button').click();assert.equal(await p.getByLabel('Valor do pagamento',{exact:true}).inputValue(),'120,00');await p.getByRole('button',{name:'Registrar pagamento',exact:true}).click();await p.waitForTimeout(350);assert.equal(await balance(),initialBalance-120);
 await p.evaluate(async()=>(await import('/js/nav.js')).go('inicio'));
 await p.locator('.orbit-full summary').click();await p.getByRole('button',{name:'Pagar fatura · R$ 250',exact:true}).click();await p.getByLabel('Valor do pagamento',{exact:true}).fill('100');await p.getByRole('button',{name:'Registrar pagamento antecipado',exact:true}).click();await p.waitForTimeout(350);assert.equal(await balance(),initialBalance-220);
 await p.evaluate(async()=>(await import('/js/views/forms.js')).openQuickAdd());await p.getByRole('button',{name:/Pagar cartão Fatura total/}).click();await p.getByRole('heading',{name:'Pagar cartão',exact:true}).waitFor();assert.match(await p.locator('.sheet').last().innerText(),/150,00/);await p.getByRole('button',{name:'Fechar',exact:true}).last().click();await p.waitForTimeout(300);
 await p.evaluate(async()=>(await import('/js/nav.js')).go('extrato'));await p.locator('.invoice-summary-row').waitFor();assert.match(await p.locator('.invoice-summary-row').innerText(),/150,00/);assert.match(await p.locator('.invoice-summary-row').innerText(),/total R\$\s*250,00/);assert.match(await p.locator('.invoice-summary-row').innerText(),/pago R\$\s*100,00/);
 assert.equal(await p.evaluate(async()=>{const F=await import('/js/finance.js'),u=await import('/js/util.js');return F.monthSummary(u.ymOf(u.today())).spend}),250);
 for(const width of [320,390,1280]){await p.setViewportSize({width,height:900});assert(await p.locator('.invoice-summary-row').evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
 await p.setViewportSize({width:390,height:844});await p.locator('.invoice-summary-row').scrollIntoViewIfNeeded();
 await p.locator('.invoice-summary-row').click();assert.equal(await p.getByLabel('Valor do pagamento',{exact:true}).inputValue(),'150,00');await p.getByRole('button',{name:'Registrar pagamento antecipado',exact:true}).click();await p.locator('.invoice-summary-row').waitFor({state:'detached'});assert.equal(await balance(),initialBalance-370);
 const paymentRows=await p.evaluate(async()=>(await import('/js/store.js')).getState().transactions.filter(t=>t.transactionRole==='card_payment').map(t=>t.value));assert.deepEqual(paymentRows,[120,100,150]);assert.deepEqual(errors,[]);
 console.log('PASS: parcelar contrato existente com histórico, pagar/desfazer/compartilhar, fatura vencida e aberta, atalho +, pagamentos parciais e valor no extrato sem dupla contagem.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
