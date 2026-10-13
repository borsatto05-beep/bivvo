/* Bivvo 11.30 — RecoveryEngine: camada agregadora sobre os motores A–F. */
import { today, diffDays, round2, num, parseISO } from './util.js';
import * as F from './finance.js';
import * as store from './store.js';
import { financialControlDetector, survivalPlan, behaviorAnalysis, recoveryAnalysis, motivationAnalysis, todayBrief } from './copilot.js';
import { analyzeFinancialDecision } from './decision.js';

const ESSENTIAL = new Set(['Moradia','Alimentação','Mercado','Água','Energia','Transporte','Combustível','Saúde','Telefone','Internet']);
const essential = x => ESSENTIAL.has(String(x?.cat||''));
const naturalDate = iso => { try{return parseISO(iso).toLocaleDateString('pt-BR',{day:'numeric',month:'long'});}catch{return String(iso||'');} };

export function getSurvivalMinimum(s=store.getState()){
  const ym=today().slice(0,7), sm=F.monthSummary(ym,s);
  const fixed=(s.fixed||[]).filter(x=>x.type==='expense' && essential(x)).reduce((n,x)=>n+num(x.value),0);
  const variable=(s.transactions||[]).filter(x=>x.type==='expense' && F.isSpend(x) && x.date.startsWith(ym) && essential(x)).reduce((n,x)=>n+num(x.value),0);
  const amount=round2(Math.max(fixed,variable));
  const income=round2(sm.incomePaid||sm.income||0);
  return {amount,income,remaining:round2(income-amount),categories:[...ESSENTIAL],estimated:true};
}

export function getTrueFreeMoney(s=store.getState()){
  const sp=F.spendable(s), survival=getSurvivalMinimum(s);
  const protectedMoney=round2(sp.commitments+sp.saveLeft);
  return {balance:round2(sp.balance),protected:protectedMoney,free:round2(sp.free),perDay:sp.free>0?round2(sp.free/Math.max(1,sp.days)):0,days:Math.max(1,sp.days),until:sp.until,survivalMinimum:survival.amount};
}

export function getRecoveryPriority(s=store.getState()){
  const sp=F.spendable(s), dec=analyzeFinancialDecision(s), behavior=behaviorAnalysis(s), recovery=recoveryAnalysis(s);
  const overdueEssential=dec.obligations.find(x=>x.date<today() && essential(x));
  const overdue=dec.obligations.find(x=>x.date<today());
  const fc=F.computeFresh(()=>F.dailyForecast(30,s));
  if(sp.free<0) return {id:'essential_cash',rank:1,title:'Proteja o dinheiro essencial',detail:`Faltam R$ ${Math.abs(sp.free).toFixed(2)} antes da próxima entrada.`,action:'crisis'};
  if(fc.risk) return {id:'negative_forecast',rank:2,title:'Seu dinheiro pode não chegar até o próximo pagamento',detail:`Com os dados atuais, a projeção pode ficar negativa em ${naturalDate(fc.risk.date)}.`,action:'crisis'};
  if(overdueEssential) return {id:'essential_overdue',rank:3,title:'Revise uma conta essencial vencida',detail:`${overdueEssential.label} merece atenção primeiro.`,action:'decision'};
  if(overdue) return {id:'overdue',rank:4,title:'Organize uma pendência vencida',detail:`${overdue.label} está vencida.`,action:'decision'};
  if(recovery.debts.rows.length) return {id:'debt',rank:5,title:'Reduza uma pendência por vez',detail:`Há ${recovery.debts.rows.length} obrigação(ões) no plano de recuperação.`,action:'recovery'};
  if(behavior.installments.activeCount>=4) return {id:'installments',rank:6,title:'Evite uma nova parcela hoje',detail:`Você já tem ${behavior.installments.activeCount} parcelamentos ativos.`,action:'behavior'};
  if(behavior.leak.relevant) return {id:'leak',rank:7,title:'Observe os pequenos gastos hoje',detail:`Pequenos gastos somam R$ ${behavior.leak.total.toFixed(2)} neste mês.`,action:'behavior'};
  return {id:'steady',rank:10,title:'Mantenha o plano de hoje',detail:'Nenhum risco forte exige uma mudança imediata.',action:'overview'};
}

export function getFinancialStage(s=store.getState()){
  const sp=F.spendable(s), control=financialControlDetector(s), recovery=recoveryAnalysis(s), motivation=motivationAnalysis(s), fc=F.computeFresh(()=>F.dailyForecast(30,s));
  let id='GROWTH',label='CRESCIMENTO',tone='growth',reason='Seu caixa está estável e há espaço para objetivos de longo prazo.';
  if(sp.free<0 || fc.risk){id='CRITICAL';label='SOBREVIVÊNCIA';tone='danger';reason=sp.free<0?'Seus compromissos até a próxima entrada superam o dinheiro disponível.':'Sua projeção entra no negativo nos próximos 30 dias.';}
  else if(recovery.debts.rows.some(x=>x.overdue) || control.score>=50){id='RECOVERY';label='RECUPERAÇÃO';tone='warn';reason='Há pendências ou sinais fortes de pressão que merecem prioridade.';}
  else if(control.score>=25 || motivation.score<70){id='CONTROL';label='CONTROLE';tone='attention';reason='Seu dinheiro cabe, mas ainda há sinais que pedem acompanhamento.';}
  else if(motivation.score<85 || (F.wealth(s).reserve||0)<500){id='STABLE';label='ESTABILIDADE';tone='stable';reason='Seu caixa está organizado; o próximo passo é aumentar sua proteção.';}
  return {id,label,tone,reason,score:motivation.score,detectorScore:control.score};
}

export function getControlDays(s=store.getState()){
  const rows=[]; const tx=s.transactions||[];
  for(let i=6;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);const iso=d.toISOString().slice(0,10);const spent=tx.filter(t=>t.date===iso&&t.type==='expense'&&F.isSpend(t)).reduce((n,t)=>n+num(t.value),0);rows.push({date:iso,spent,status:spent===0?'neutral':'ok'});}
  return {rows,controlled:rows.filter(x=>x.status==='ok').length,informational:true};
}

export function recoverySnapshot(s=store.getState()){
  const stage=getFinancialStage(s), money=getTrueFreeMoney(s), survival=getSurvivalMinimum(s), priority=getRecoveryPriority(s), brief=todayBrief(s), motivation=motivationAnalysis(s), plan=survivalPlan(s);
  return {stage,money,survival,priority,brief,motivation,plan,asOf:today()};
}

export function saveDailyCheckin(value){
  const allowed=['crisis','tight','ok','calm']; if(!allowed.includes(value)) return false;
  store.commit(s=>{s.profile.recoveryCheckins=s.profile.recoveryCheckins||{};s.profile.recoveryCheckins[today()]={value,at:new Date().toISOString()};},{reason:'recovery-checkin'}); return true;
}

export function todayCheckin(s=store.getState()){return s.profile?.recoveryCheckins?.[today()]?.value||null;}
