import {installmentPrincipal,installmentSchedule} from './loan-installments.js';
import {money,round2} from './util.js';

export function loanShareSummary(loan){
  const principal=Math.max(0,Number(loan.principal)||0);
  const interest=Math.max(0,round2(loan.interestDue!=null?Number(loan.interestDue)||0:loan.interestMode==='fixed'?Number(loan.interestFixed)||0:principal*(Number(loan.interestRate)||0)/100));
  const original=Math.max(0,Number(loan.principalOriginal??principal)||0);
  const due=/^\d{4}-\d{2}-\d{2}$/.test(loan.due||'')?loan.due.split('-').reverse().join('/'):'Não informado';
  const period=loan.periodicity==='monthly'?'ao mês':'único';
  const terms=loan.installmentPlan?`${money(loan.installmentPlan.total-installmentPrincipal(loan))} no acordo · ${loan.installmentPlan.count} parcelas`:loan.interestMode==='fixed'?`${money(loan.interestFixed||0)} (${period})`:`${Number(loan.interestRate)||0}% (${period})`;
  return {principal,interest,original,due,terms,total:round2(principal+interest),paid:loan.status==='paid'||principal+interest<=0.004};
}

export function loanShareText(loan,payments=[]){
  if(loan.installmentPlan){const rows=installmentSchedule(loan,payments),paid=rows.filter(x=>x.paid),received=round2(rows.reduce((n,x)=>n+x.received,0)),date=x=>x.split('-').reverse().join('/');return [`Olá, ${loan.person||'cliente'}! 👋`,'','📋 *Seu acordo parcelado*',`💵 Valor emprestado originalmente: ${money(loan.principalOriginal)}`,`🧾 Principal parcelado: ${money(installmentPrincipal(loan))}`,`📈 Juros do acordo: ${money(loan.installmentPlan.total-installmentPrincipal(loan))}`,`💰 Total combinado: ${money(loan.installmentPlan.total)}`,`🗓️ ${rows.length} parcelas · primeira ${date(rows[0].due)}`,'',`✅ Pagas: ${paid.length}/${rows.length} · recebido ${money(received)}`,`⏳ Saldo pendente: ${money(Math.max(0,round2(loan.installmentPlan.total-received)))}`,'','*Acompanhe suas parcelas*',...rows.map(x=>`${x.paid?'✅ Paga':x.overdue?'🔴 Vencida':'⏳ Pendente'} · ${x.number}/${rows.length} · vence ${date(x.due)} · ${money(x.amount)}${x.paidAt?' · pago em '+date(x.paidAt):''}`),'','Valores conforme os pagamentos registrados.'].join('\n');}

  const s=loanShareSummary(loan);
  const lines=[`Olá, ${loan.person||'cliente'}! 👋`, '', '📋 *Resumo do seu empréstimo*', '', `💵 Valor emprestado: ${money(s.original)}`, `📈 Juros combinados: ${s.terms}`];
  if(s.principal!==s.original)lines.push(`✅ Valor emprestado já devolvido: ${money(Math.max(0,round2(s.original-s.principal)))}`);
  lines.push('', '🧾 *O que falta pagar*', `Valor emprestado restante: ${money(s.principal)}`, `Juros a pagar: ${money(s.interest)}`, '', `💰 *Total a pagar: ${money(s.total)}*`, `📅 *Vencimento: ${s.due}*`, '', s.paid?'✅ Empréstimo quitado.':'O total acima já considera os pagamentos registrados.');
  return lines.join('\n');
}
