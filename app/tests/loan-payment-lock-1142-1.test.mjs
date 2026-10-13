import fs from 'node:fs';
import assert from 'node:assert/strict';
import { emptyState, normalizeLight } from '../js/store.js';
import { loanCapacity, recalculateLoan, ensureLoanLedger } from '../js/loan-ledger.js';

let passed=0;
const ok=(name,fn)=>{fn();console.log(`  ✓ ${name}`);passed++;};

const s=emptyState();
s.loans.push({id:'l1',person:'Teste',principalOriginal:1000,principal:900,interestMode:'percent',interestRate:10,interestFixed:0,due:'2026-11-06',status:'open'});
s.loanCycles.push({id:'c0',loanId:'l1',date:'2026-10-01',due:'2026-10-06',principal:1000,interest:100,type:'created'});
s.loanCycles.push({id:'c1',loanId:'l1',paymentId:'p1',date:'2026-10-06',due:'2026-11-06',principal:900,interest:90,type:'renewal',automatic:true});
s.loanPayments.push({id:'p1',loanId:'l1',amount:200,interest:100,principal:100,date:'2026-10-06',autoRenewed:true});
s.transactions.push({id:'t1',loanId:'l1',loanPaymentId:'p1',transactionRole:'loan_interest_income',type:'income',value:100,cat:'Juros / Empréstimo',date:'2026-10-06',desc:'Juros recebidos',method:'Transferência',status:'Pago',locked:true,immutable:true});
normalizeLight(s);

ok('normalização libera pagamento antigo para correção',()=>{
  assert.equal(s.loanPayments[0].editable,true);
  assert.equal(s.loanPayments[0].immutable,undefined);
});
ok('normalização remove flags de trava dos lançamentos de empréstimo',()=>{
  assert.equal(s.transactions[0].locked,undefined);
  assert.equal(s.transactions[0].immutable,undefined);
});
ok('capacidade de edição desconsidera o próprio pagamento',()=>{
  const cap=loanCapacity(s,'l1','p1');
  assert.equal(cap.principal,1000);
  assert.equal(cap.interest,190);
});
ok('recalcula principal e juros a partir do livro-razão',()=>{
  recalculateLoan(s,'l1');
  assert.equal(s.loans[0].principal,900);
  assert.equal(s.loans[0].interestDue,90);
  assert.equal(s.loans[0].status,'open');
});
ok('migração cria ciclo inicial quando legado não tem created',()=>{
  const legacy=emptyState();
  legacy.loans.push({id:'legacy',principalOriginal:500,principal:500,interestDue:50,due:'2026-10-10'});
  ensureLoanLedger(legacy,'legacy');
  assert.equal(legacy.loanCycles.length,1);
  assert.equal(legacy.loanCycles[0].type,'created');
  assert.equal(legacy.loanCycles[0].interest,50);
});

const loans=fs.readFileSync(new URL('../js/views/loans.js',import.meta.url),'utf8');
const forms=fs.readFileSync(new URL('../js/views/forms.js',import.meta.url),'utf8');
ok('histórico oferece editar e excluir pagamentos',()=>{
  assert.match(loans,/Editar pagamento/);
  assert.match(loans,/Excluir pagamento/);
  assert.match(loans,/editLoanPayment/);
  assert.match(loans,/deleteLoanPayment/);
});
ok('há fluxo explícito para receber somente juros',()=>{
  assert.match(loans,/Receber só juros/);
  assert.match(loans,/interestOnly/);
  assert.match(loans,/Principal recebido/);
});
ok('lançamento do extrato redireciona para editor do pagamento',()=>{
  assert.match(forms,/openLoanPaymentEditor\(tx\.loanPaymentId\)/);
  assert.match(forms,/Excluir pagamento/);
});
ok('contrato pode ser excluído mesmo com histórico mediante confirmação forte',()=>{
  assert.match(loans,/requireText:hasPayments\?'EXCLUIR':''/);
  assert.match(loans,/Contrato e histórico removidos/);
});
console.log(`\n${passed} passaram, 0 falharam`);
