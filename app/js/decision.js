/* Bivvo 11.21 — Assistente de Decisão Financeira.
   Motor determinístico e local: não envia extrato, não inventa juros/multas e nunca grava sozinho. */
import { today, diffDays, round2 } from './util.js';
import * as F from './finance.js';
import * as store from './store.js';

const PRIORITY = { critica:4, alta:3, media:2, baixa:1 };
const ESSENTIAL = /moradia|aluguel|financiamento|energia|água|agua|gás|gas|mercado|aliment|saúde|saude|medic|filhos/i;
const LOW = /streaming|lazer|assinatura|viagem|presente/i;
const HIGH = /dívida|divida|empréstimo|emprestimo|cheque especial/i;

function billPriority(t){
  const text=`${t.cat||''} ${t.desc||''}`;
  if(ESSENTIAL.test(text)) return 'critica';
  if(HIGH.test(text)) return 'alta';
  if(LOW.test(text)) return 'baixa';
  return 'media';
}
function urgency(date){ const d=diffDays(today(),date); return d<0?40:d===0?35:d<=2?28:d<=7?18:d<=15?10:4; }
function score(o){
  const essential=PRIORITY[o.priority]*18;
  const overdue=o.date<today()?18:0;
  const credit=o.kind==='invoice'?16:0; // cartão recebe peso de custo potencial, sem presumir taxa.
  return essential+urgency(o.date)+overdue+credit;
}
function obligations(s){
  const sp=F.spendable(s), out=[];
  for(const t of sp.bills) out.push({id:t.id,kind:'bill',label:t.desc,value:round2(t.value),date:t.date,priority:billPriority(t),cat:t.cat||'Outros'});
  for(const i of sp.invList) out.push({id:`invoice:${i.card}:${i.ym}`,kind:'invoice',label:`Fatura ${i.card}`,card:i.card,ym:i.ym,value:round2(i.unpaid),date:i.dueDate,priority:'alta'});
  return out.map(x=>({...x,score:score(x)}));
}
function allocate(order,balance){
  let cash=Math.max(0,balance), paid=[], reserved=[], uncovered=[];
  for(const o of order){
    if(cash>=o.value){ paid.push({...o,paid:o.value}); cash=round2(cash-o.value); }
    else if(cash>0){ reserved.push({...o,reserved:cash,missing:round2(o.value-cash)}); cash=0; }
    else uncovered.push({...o,missing:o.value});
  }
  return {paid,reserved,uncovered,cash};
}
function hypothetical(s,alloc){
  const c=structuredClone(s), now=today();
  for(const p of alloc.paid){
    if(p.kind==='bill') { const t=c.transactions.find(x=>x.id===p.id); if(t){t.status='Pago';t.paidAt=now;} }
    else for(const t of c.transactions){ if(F.isCredit(t) && !F.isPaid(t) && F.txInvoice(t,c)===p.ym && F.cardByName(t.card,c)?.name===p.card){t.status='Pago';t.paidAt=now;} }
  }
  return c;
}
function scenario(id,title,order,balance,s){
  const a=allocate(order,balance), hs=hypothetical(s,a);
  const f7=F.computeFresh(()=>F.dailyForecast(7,hs)), f30=F.computeFresh(()=>F.dailyForecast(30,hs));
  const missing=round2(a.reserved.reduce((n,x)=>n+x.missing,0)+a.uncovered.reduce((n,x)=>n+x.value,0));
  const criticalOpen=[...a.reserved,...a.uncovered].filter(x=>x.priority==='critica').length;
  const overdueOpen=[...a.reserved,...a.uncovered].filter(x=>x.date<today()).length;
  let risk='baixo'; if(f30.risk||criticalOpen||overdueOpen>1) risk='alto'; else if(missing>0||f7.risk) risk='atencao';
  const penalty=(criticalOpen*100)+(overdueOpen*45)+(missing>0?20:0)+(f30.risk?35:0);
  return {id,title,...a,missing,forecast7:round2(f7.endBalance),forecast30:round2(f30.endBalance),risk,penalty};
}
export function analyzeFinancialDecision(s=store.getState()){
  const bal=F.balance(s), obs=obligations(s), total=round2(obs.reduce((n,x)=>n+x.value,0)), deficit=round2(Math.max(0,total-bal));
  const priority=[...obs].sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
  const earliest=[...obs].sort((a,b)=>a.date.localeCompare(b.date)||b.score-a.score);
  const essentialFirst=[...obs].sort((a,b)=>PRIORITY[b.priority]-PRIORITY[a.priority]||a.date.localeCompare(b.date)||b.score-a.score);
  const raw=[scenario('smart','Menor impacto',priority,bal,s),scenario('due','Vencimentos primeiro',earliest,bal,s),scenario('essential','Essenciais primeiro',essentialFirst,bal,s)];
  const unique=[]; for(const x of raw){ const sig=x.paid.map(p=>p.id).join('|')+'#'+x.reserved.map(p=>p.id).join('|'); if(!unique.some(u=>u.sig===sig)) unique.push({...x,sig}); }
  unique.sort((a,b)=>a.penalty-b.penalty||b.forecast30-a.forecast30); if(unique[0]) unique[0].recommended=true;
  const best=unique[0]||null, next=F.nextIncome(s);
  const missingInfo=[]; if(obs.some(x=>x.kind==='invoice')) missingInfo.push('O Bivvo não tem a taxa de juros/multa da fatura cadastrada; por isso não inventa esse custo.');
  if(!F.hasBalanceBase(s)) missingInfo.push('Confirme seu saldo atual para aumentar a precisão da análise.');
  let reason='Não há compromissos pendentes até a próxima entrada.';
  if(best&&obs.length){ const first=best.paid[0]||best.reserved[0]||best.uncovered[0]; reason=`${first.label} aparece primeiro porque combina vencimento, essencialidade e risco de atraso. A análise também protege os compromissos essenciais antes de priorizar gastos adiáveis.`; }
  return {asOf:today(),balance:bal,total,deficit,tight:total>bal,obligations:priority,nextIncome:next,scenarios:unique,best,reason,missingInfo};
}
