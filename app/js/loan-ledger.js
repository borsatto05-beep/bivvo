import {installmentTerms,updateInstallmentDue} from './loan-installments.js';
import {today} from './util.js';
/* Bivvo — utilitários puros do livro-razão de empréstimos.
   Mantém principal/juros consistentes quando pagamentos são corrigidos. */
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const r2=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
const pos=v=>Math.max(0,r2(v));

export function paymentsFor(state, loanId){
  return (state.loanPayments||[]).filter(p=>p.loanId===loanId);
}

export function cyclesFor(state, loanId){
  return (state.loanCycles||[]).filter(c=>c.loanId===loanId);
}

export function ensureLoanLedger(state, loanId){
  const loan=(state.loans||[]).find(x=>x.id===loanId);
  if(!loan) return null;
  const cycles=cyclesFor(state,loanId);
  if(cycles.some(c=>c.type==='created')) return loan;
  const payments=paymentsFor(state,loanId);
  const renewalInterest=cycles.reduce((a,c)=>a+pos(c.interest)+n(c.interestAdjustment),0);
  const capitalized=cycles.reduce((a,c)=>a+pos(c.capitalized),0);
  const paidInterest=payments.reduce((a,p)=>a+pos(p.interest),0);
  const inferredInitialInterest=pos(pos(loan.interestDue)+paidInterest+capitalized-renewalInterest);
  const paidPrincipal=payments.reduce((a,p)=>a+pos(p.principal),0);
  const inferredPrincipal=Math.max(pos(loan.principalOriginal),pos(loan.principal)+paidPrincipal-capitalized);
  state.loanCycles=state.loanCycles||[];
  state.loanCycles.unshift({
    id:`legacy-created-${loan.id}`,
    loanId:loan.id,
    date:loan.createdAt?new Date(loan.createdAt).toISOString().slice(0,10):(loan.due||''),
    due:loan.initialDue||loan.due||'',
    principal:inferredPrincipal,
    interest:inferredInitialInterest,
    type:'created',
    migrated:true
  });
  return loan;
}

export function loanCapacity(state, loanId, excludePaymentId=null){
  const loan=(state.loans||[]).find(x=>x.id===loanId);
  if(!loan) return {principal:0,interest:0};
  ensureLoanLedger(state,loanId);
  const cycles=cyclesFor(state,loanId);
  const payments=paymentsFor(state,loanId).filter(p=>p.id!==excludePaymentId);
  const capitalized=cycles.reduce((a,c)=>a+pos(c.capitalized),0);
  const interestCharged=cycles.reduce((a,c)=>a+pos(c.interest)+n(c.interestAdjustment),0);
  const principalBase=Math.max(pos(loan.principalOriginal)+capitalized,pos(loan.principalOriginal));
  return {
    principal:pos(principalBase-payments.reduce((a,p)=>a+pos(p.principal),0)),
    interest:pos(interestCharged-capitalized-payments.reduce((a,p)=>a+pos(p.interest),0))
  };
}

export function recalculateLoan(state, loanId){
  const loan=(state.loans||[]).find(x=>x.id===loanId);
  if(!loan) return null;
  ensureLoanLedger(state,loanId);
  const cycles=cyclesFor(state,loanId);
  const payments=paymentsFor(state,loanId);
  const capitalized=cycles.reduce((a,c)=>a+pos(c.capitalized),0);
  const interestCharged=cycles.reduce((a,c)=>a+pos(c.interest)+n(c.interestAdjustment),0);
  const paidInterest=payments.reduce((a,p)=>a+pos(p.interest),0);
  const paidPrincipal=payments.reduce((a,p)=>a+pos(p.principal),0);
  const principalBase=Math.max(pos(loan.principalOriginal)+capitalized,pos(loan.principalOriginal));
  loan.principal=pos(principalBase-paidPrincipal);
  loan.interestDue=pos(interestCharged-capitalized-paidInterest);
  loan.status=(loan.principal<=0.004&&loan.interestDue<=0.004)?'paid':'open';
  const latest=cycles.length?cycles[cycles.length-1]:null;
  if(latest?.due) loan.due=latest.due;
  updateInstallmentDue(loan,state.loanPayments);
  return loan;
}

export function relatedPaymentTransactions(state, paymentId){
  return (state.transactions||[]).filter(t=>t.loanPaymentId===paymentId);
}

export function findAutoRenewCycle(state, payment){
  if(!payment?.autoRenewed) return null;
  const cycles=cyclesFor(state,payment.loanId);
  return cycles.find(c=>c.paymentId===payment.id)
    || [...cycles].reverse().find(c=>c.automatic&&c.date===payment.date&&!c.paymentId)
    || null;
}

/* Parcelar um saldo existente preserva o contrato e todos os recebimentos. */
export function parcelExistingLoan(state,loanId,total,count,firstDue){
  const loan=(state.loans||[]).find(l=>l.id===loanId);
  if(!loan||loan.installmentPlan||loan.status==='paid'||pos(loan.principal)+pos(loan.interestDue)<=0.004)throw Error('Escolha um empréstimo aberto que ainda não esteja parcelado.');
  const terms=installmentTerms(loan.principal,total,count,firstDue,{allowZeroPrincipal:true});
  ensureLoanLedger(state,loanId);
  const current=loanCapacity(state,loanId);
  if(Math.abs(current.principal-loan.principal)>0.004||Math.abs(current.interest-pos(loan.interestDue))>0.004)throw Error('Revise o histórico do contrato antes de parcelar: os saldos não conferem.');
  const previousTerms={periodicity:loan.periodicity,interestMode:loan.interestMode,interestRate:loan.interestRate,interestFixed:loan.interestFixed,due:loan.due};
  const newInterest=r2(terms.total-current.principal),createdAt=Date.now();
  loan.installmentPlan={...terms,principal:current.principal,agreedAt:today(),previousPaymentIds:paymentsFor(state,loanId).map(p=>p.id),previousTerms};
  state.loanCycles.push({id:`installment-agreement-${loanId}`,loanId,type:'installment_agreement',date:today(),due:firstDue,principal:current.principal,interest:0,interestAdjustment:r2(newInterest-current.interest),previousInterest:current.interest,total:terms.total,count:terms.count,createdAt});
  loan.periodicity='single';loan.interestMode='fixed';loan.interestRate=0;loan.interestFixed=newInterest;
  recalculateLoan(state,loanId);
  return loan;
}
export const paymentBeforeInstallmentAgreement=(loan,payment)=>!!loan.installmentPlan?.previousPaymentIds?.includes(payment.id);
