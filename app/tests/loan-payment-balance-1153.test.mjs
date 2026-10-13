/* Bivvo 11.53 — principal recebido e juros movimentam saldos separados. */
const RealDate = Date;
const FIX = new RealDate(2026, 9, 7, 12).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [FIX])); } static now() { return FIX; } };
globalThis.window = globalThis.window || { addEventListener() {} };
globalThis.sessionStorage = { getItem(){return null;}, setItem(){}, removeItem(){} };
globalThis.localStorage = globalThis.sessionStorage;

import assert from 'node:assert/strict';
const store = await import('../js/store.js');
const F = await import('../js/finance.js');

let passed=0;
const ok=(name,fn)=>{fn();console.log(`  ✓ ${name}`);passed++;};
const s=store.emptyState({onboarded:true});
s.transactions.push({id:'base',date:'2026-10-01',desc:'Saldo base',cat:'Saldo inicial',kind:'opening',type:'income',value:1000,status:'Pago',method:'Outro'});
s.transactions.push({id:'int',date:'2026-10-07',desc:'Juros recebidos · Cliente',cat:'Juros / Empréstimo',transactionRole:'loan_interest_income',loanId:'l1',loanPaymentId:'p1',type:'income',value:100,status:'Pago',method:'PIX'});
s.transactions.push({id:'pr',date:'2026-10-07',desc:'Principal recebido · Cliente',cat:'Juros / Empréstimo',transactionRole:'loan_principal_return',loanId:'l1',loanPaymentId:'p1',type:'income',value:400,status:'Pago',method:'PIX'});
store.load(s,{demo:true});

ok('juros entram no saldo geral e principal fica separado',()=>{
  assert.equal(F.balance(),1100);
  assert.equal(F.capitalBalance(),400);
  assert.equal(F.balance()+F.capitalBalance(),1500);
});
ok('principal devolvido não vira renda do mês',()=>{
  const m=F.monthSummary('2026-10');
  assert.equal(m.income,100);
  assert.equal(m.incomePaid,100);
});
ok('editar principal recebido atualiza apenas o capital',()=>{
  store.commit(st=>{st.transactions.find(t=>t.id==='pr').value=250;});
  assert.equal(F.balance(),1100);
  assert.equal(F.capitalBalance(),250);
  assert.equal(F.monthSummary('2026-10').income,100);
});
ok('excluir pagamento remove cada parte do respectivo saldo',()=>{
  store.commit(st=>{st.transactions=st.transactions.filter(t=>t.loanPaymentId!=='p1');});
  assert.equal(F.balance(),1000);
  assert.equal(F.capitalBalance(),0);
  assert.equal(F.monthSummary('2026-10').income,0);
});
console.log(`\n${passed} passaram, 0 falharam`);
