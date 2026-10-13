import assert from 'node:assert/strict';
import {buildDemo,addCapitalDemoRecords} from '../js/demo.js';
import {recalculateLoan} from '../js/loan-ledger.js';
import {today} from '../js/util.js';
const s=buildDemo();assert.equal(s.loans.length,0);addCapitalDemoRecords(s);
assert.equal(s.loans.length,29);assert.equal(s.loanPayments.length,72);
assert(s.loans.some(l=>l.due<today()&&l.status!=='paid'));
assert(s.loans.some(l=>l.status==='paid'));
assert(s.loans.some(l=>l.principal>0&&l.principal<l.principalOriginal));
const copy=structuredClone(s);for(const l of copy.loans){const principal=l.principal,interest=l.interestDue;recalculateLoan(copy,l.id);assert.equal(l.principal,principal);assert.equal(l.interestDue,interest);}
addCapitalDemoRecords(s);assert.equal(s.loans.length,29);
assert.equal(s.transactions.filter(t=>t.transactionRole==='loan_interest_income').reduce((n,t)=>n+t.value,0),6425);
assert.equal(new Set(s.loanPayments.map(p=>p.date.slice(0,7))).size,6);
assert.equal(new Set(s.loans.map(l=>new Date(l.createdAt).toISOString().slice(0,7))).size,6);
assert(s.loanPayments.every(p=>p.date<=today()));
assert.equal(new Set(s.loans.map(l=>l.person)).size,10);
for(const person of new Set(s.loans.map(l=>l.person))){const monthly=s.loans.find(l=>l.person===person&&l.periodicity==='monthly');const payments=s.loanPayments.filter(p=>p.loanId===monthly.id);assert.equal(payments.length,6);assert.equal(new Set(payments.map(p=>p.date.slice(0,7))).size,6);assert(payments.every(p=>p.principal===0&&p.interest>0));assert.equal(monthly.principal,monthly.principalOriginal);assert.equal(s.loanCycles.filter(c=>c.loanId===monthly.id&&c.type==='renewal').length,6);assert(!s.transactions.some(t=>t.loanId===monthly.id&&t.transactionRole==='loan_principal_return'));}
console.log('Capital fictício: dez clientes, seis meses, 29 contratos e 72 pagamentos, livro-razão consistente, juros separados e sem duplicação.');
