/* Principal devolvido pertence ao Capital; juros e outras entradas ao saldo geral.
   Leitura do histórico: não cria nem reescreve lançamentos. */
import {num, round2} from './util.js';

export function capitalReceivedValue(t) {
  if(t?.type!=='income')return 0;
  const value=Math.max(0,num(t.value));
  if(t.transactionRole==='loan_principal_return')return round2(value);
  // As versões antigas registravam principal + juros em uma única entrada.
  // Só separamos quando o próprio registro informa o principal e a ação.
  if(!t.transactionRole&&t.isLoan&&['settled','open'].includes(t.loanAction))
    return round2(Math.min(value,Math.max(0,num(t.loanPrincipal))));
  return 0;
}

export const incomeAmount = t => {
  if(t?.type!=='income')return 0;
  if(t.transactionRole==='capital_transfer_out')return round2(Math.max(0,num(t.value)));
  return round2(Math.max(0,num(t.value)-capitalReceivedValue(t)));
};

export function receivedCapitalRows(s,until) {
  return (s.transactions||[]).filter(t=>t.status==='Pago'&&(t.paidAt||t.date)<=until&&capitalReceivedValue(t)>0)
    .map(t=>({transaction:t,principal:capitalReceivedValue(t),date:t.paidAt||t.date}))
    .sort((a,b)=>b.date.localeCompare(a.date)||(b.transaction.createdAt||0)-(a.transaction.createdAt||0));
}

export const isCapitalTransfer = t => ['capital_transfer_in','capital_transfer_out'].includes(t?.transactionRole);

export function capitalAvailable(s,until) {
  const end=until||new Date().toISOString().slice(0,10);
  let value=0;
  for(const t of (s.transactions||[])){
    if(t.status!=='Pago'||(t.paidAt||t.date)>end)continue;
    const amount=Math.max(0,num(t.value)),received=capitalReceivedValue(t);
    if(t.transactionRole==='capital_transfer_in')value+=amount;
    else if(received>0)value+=received;
    else if(t.transactionRole==='capital_transfer_out'||(t.transactionRole==='loan_principal_out'&&t.capitalManaged))value-=amount;
  }
  return round2(value);
}
