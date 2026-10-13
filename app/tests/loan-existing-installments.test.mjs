import assert from 'node:assert/strict';
import {parcelExistingLoan,recalculateLoan,paymentBeforeInstallmentAgreement} from '../js/loan-ledger.js';
import {installmentSchedule,payInstallment} from '../js/loan-installments.js';
import {loanShareText} from '../js/loan-share.js';
import {today} from '../js/util.js';
// Three old interest-only payments and one amortization. All stay in the same contract.
const l={id:'existing',person:'Cliente antigo',principalOriginal:4000,principal:3000,interestMode:'fixed',interestFixed:400,interestDue:400,periodicity:'monthly',due:today(),status:'open'};
const oldPayments=[1,2,3].map(i=>({id:'old'+i,loanId:l.id,principal:i===3?1000:0,interest:400,amount:i===3?1400:400,date:today()}));
const s={loans:[l],loanPayments:oldPayments,loanCycles:[{id:'created',loanId:l.id,type:'created',principal:4000,interest:400,due:today()},...[1,2,3].map(i=>({id:'renew'+i,loanId:l.id,type:'renewal',principal:i===3?3000:4000,interest:400,due:today()}))],transactions:oldPayments.map(p=>({id:'tx-'+p.id,loanPaymentId:p.id,value:p.amount})),deletedRecords:{}};
const previous=structuredClone(s),pid=oldPayments[0].id;
parcelExistingLoan(s,l.id,8000,10,'2026-10-10');
assert.equal(s.loans.length,1);assert.equal(l.principalOriginal,4000);assert.equal(l.principal,3000);assert.equal(l.interestDue,5000);assert.equal(l.periodicity,'single');
assert.deepEqual(s.loanPayments,previous.loanPayments);assert.deepEqual(s.transactions,previous.transactions);assert.deepEqual(s.loanCycles.slice(0,-1),previous.loanCycles);assert(paymentBeforeInstallmentAgreement(l,oldPayments[0]));
let rows=installmentSchedule(l,s.loanPayments);assert.equal(rows.length,10);assert(rows.every(r=>r.amount===800&&r.principal===300&&r.interest===500));
assert.match(loanShareText(l,s.loanPayments),/Principal parcelado: R\$\s*3\.000,00/);assert.match(loanShareText(l,s.loanPayments),/Saldo pendente: R\$\s*8\.000,00/);
const payId=payInstallment(s,l.id,1,today());assert.equal(l.principal,2700);assert.equal(l.interestDue,4500);recalculateLoan(s,l.id);assert.equal(l.principal,2700);assert.equal(l.interestDue,4500);
s.loanPayments=s.loanPayments.filter(p=>p.id!==payId);s.transactions=s.transactions.filter(t=>t.loanPaymentId!==payId);recalculateLoan(s,l.id);assert.equal(l.principal,3000);assert.equal(l.interestDue,5000);assert(s.loanPayments.some(p=>p.id===pid));
for(let i=1;i<=10;i++)payInstallment(s,l.id,i,today());recalculateLoan(s,l.id);assert.equal(l.status,'paid');assert.equal(l.principal,0);assert.equal(l.interestDue,0);
assert.throws(()=>parcelExistingLoan(s,l.id,8000,10,today()));
// Renegotiation may reduce old pending interest without rewriting previous cycles.
const b={loans:[{id:'b',principalOriginal:4000,principal:4000,interestDue:4000,status:'open',periodicity:'monthly'}],loanPayments:[],loanCycles:[{id:'bc',loanId:'b',type:'created',principal:4000,interest:4000}],transactions:[]};
parcelExistingLoan(b,'b',5000,5,today());assert.equal(b.loans[0].interestDue,1000);assert.equal(b.loanCycles[1].interestAdjustment,-3000);
assert.throws(()=>parcelExistingLoan(structuredClone(previous),l.id,2000,10,today()));
console.log('Parcelar saldo aberto: histórico, juros renegociados, amortização, baixa e estorno.');

const interestOnly={loans:[{id:'interest-only',principalOriginal:4000,principal:0,interestDue:1000,status:'open'}],loanPayments:[{id:'principal-returned',loanId:'interest-only',principal:4000,interest:0,amount:4000}],loanCycles:[{id:'ic',loanId:'interest-only',type:'created',principal:4000,interest:1000}],transactions:[],deletedRecords:{}};
parcelExistingLoan(interestOnly,'interest-only',1000,5,today());assert(installmentSchedule(interestOnly.loans[0],interestOnly.loanPayments).every(r=>r.principal===0&&r.interest===200));payInstallment(interestOnly,'interest-only',1,today());recalculateLoan(interestOnly,'interest-only');assert.equal(interestOnly.loans[0].interestDue,800);assert.equal(interestOnly.loans[0].principal,0);
