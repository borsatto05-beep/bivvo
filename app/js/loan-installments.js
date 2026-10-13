import {addMonthsDate,round2,today,uid} from './util.js';
export function installmentTerms(principal,total,count,firstDue,{allowZeroPrincipal=false}={}){
 const p=Math.round(Number(principal)*100),t=Math.round(Number(total)*100),n=Number(count);
 if(!Number.isSafeInteger(p)||!Number.isSafeInteger(t)||(allowZeroPrincipal?p<0:p<=0)||t<p||!Number.isInteger(n)||n<2||n>120||t<n||!/^\d{4}-\d{2}-\d{2}$/.test(firstDue)||Number.isNaN(new Date(firstDue+'T12:00:00Z').getTime())||new Date(firstDue+'T12:00:00Z').toISOString().slice(0,10)!==firstDue)throw Error('Informe valor emprestado, total igual ou maior que o principal, 2 a 120 parcelas e primeiro vencimento.');
 return {total:round2(t/100),count:n,firstDue};
}
export const installmentPrincipal = loan => Number(loan.installmentPlan?.principal ?? loan.principalOriginal);
export function installmentSchedule(loan,payments=[]){
 if(!loan.installmentPlan)return [];
 const {total,count,firstDue}=loan.installmentPlan,p=Math.round(installmentPrincipal(loan)*100),t=Math.round(total*100);let cumulative=0,previousPrincipal=0;
 return Array.from({length:count},(_,i)=>{
  const amount=Math.floor(t/count)+(i<t%count?1:0);cumulative+=amount;
  const cumulativePrincipal=Math.round(cumulative*p/t),principal=cumulativePrincipal-previousPrincipal;previousPrincipal=cumulativePrincipal;
  const paid=payments.filter(x=>x.loanId===loan.id&&x.installmentNumber===i+1),received=round2(paid.reduce((n,x)=>n+Number(x.amount||0),0)),due=addMonthsDate(firstDue,i);
  return {number:i+1,due,amount:amount/100,principal:principal/100,interest:(amount-principal)/100,received,remaining:Math.max(0,round2(amount/100-received)),paid:received+.004>=amount/100,overdue:received+.004<amount/100&&due<today(),paidAt:paid.at(-1)?.date,paymentIds:paid.map(x=>x.id)};
 });
}
export function updateInstallmentDue(loan,payments){
 if(!loan.installmentPlan)return;
 const rows=installmentSchedule(loan,payments),next=rows.find(x=>!x.paid);
 loan.due=next?.due||rows.at(-1).due;
}
export function payInstallment(state,loanId,number,date=today(),method='PIX'){
 const l=state.loans.find(x=>x.id===loanId),row=l&&installmentSchedule(l,state.loanPayments).find(x=>x.number===number);
 if(!row||row.paid)throw Error('Esta parcela já foi paga ou não está disponível.');
 if(row.received>0)throw Error('Revise o pagamento parcial antes de marcar a parcela.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today())throw Error('Informe uma data de recebimento válida, até hoje.');
 const prefix=`loan-${loanId}-installment-${number}-`,generation=Object.keys(state.deletedRecords||{}).filter(id=>id.startsWith(prefix)).length,id=prefix+generation,createdAt=Date.now();state.loanPayments.push({id,loanId,date,amount:row.amount,principal:row.principal,interest:row.interest,installmentNumber:number,method,createdAt,editable:true});
 for(const [value,role,label] of [[row.principal,'loan_principal_return','Principal recebido'],[row.interest,'loan_interest_income','Juros recebidos']])if(value>0)state.transactions.push({id:id+'-'+role,loanId,loanPaymentId:id,transactionRole:role,type:'income',value,cat:'Juros / Empréstimo',date,desc:`${label} · ${l.person} · parcela ${number}/${l.installmentPlan.count}`,method,status:'Pago',createdAt});
 const payments=state.loanPayments.filter(x=>x.loanId===loanId&&x.installmentNumber);const principal=installmentPrincipal(l);l.principal=Math.max(0,round2(principal-payments.reduce((n,x)=>n+x.principal,0)));l.interestDue=Math.max(0,round2(l.installmentPlan.total-principal-payments.reduce((n,x)=>n+x.interest,0)));l.status=l.principal+l.interestDue<.005?'paid':'open';updateInstallmentDue(l,state.loanPayments);return id;
}
