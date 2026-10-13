/* Bivvo 11.22 — Copiloto Financeiro. Leitura local, determinística e sem gravações automáticas. */
import { today, diffDays, round2, ymOf, addMonthsYM, num } from './util.js';
import * as F from './finance.js';
import * as store from './store.js';
import { analyzeFinancialDecision } from './decision.js';

export function copilotSnapshot(s=store.getState()){
  const sp=F.spendable(s), dec=analyzeFinancialDecision(s), fc7=F.computeFresh(()=>F.dailyForecast(7,s)), fc30=F.computeFresh(()=>F.dailyForecast(30,s));
  const free=Math.max(0,round2(sp.free)), days=Math.max(1,sp.days), perDay=free>0?round2(free/days):0;
  const urgent=[...dec.obligations].sort((a,b)=>a.date.localeCompare(b.date)||b.score-a.score)[0]||null;
  const critical=dec.obligations.filter(x=>x.priority==='critica');
  let level='ok', headline='Seu dinheiro está organizado por enquanto.', action='Continue registrando seus gastos para manter essa visão atualizada.';
  if(sp.free<0){ level='danger'; headline=`Faltam ${Math.abs(sp.free).toFixed(2)} para cobrir os compromissos até a próxima entrada.`; action='Abra o SOS financeiro para definir a ordem mais segura de pagamento.'; }
  else if(fc7.risk||fc30.risk){ level='warn'; headline='Sua previsão entra em zona de atenção.'; action='Evite novos gastos não essenciais e confira os próximos vencimentos.'; }
  else if(sp.tone==='warn'){ level='warn'; headline='Você está gastando mais rápido do que o período está passando.'; action=`Tente ficar perto de ${perDay.toFixed(2)} por dia até a próxima entrada.`; }
  const recovery=[];
  if(sp.free<0) recovery.push({title:'Parar o déficit',done:false,text:'Priorize essenciais e compromissos com vencimento próximo.'}); else recovery.push({title:'Parar o déficit',done:true,text:'Os compromissos considerados cabem no dinheiro disponível.'});
  const overdue=dec.obligations.some(x=>x.date<today());
  recovery.push({title:'Colocar atrasados em dia',done:!overdue,text:overdue?'Há compromisso vencido que merece atenção.':'Nenhum compromisso vencido foi encontrado nesta análise.'});
  const reserveOk=(sp.saved||0)>0;
  recovery.push({title:'Construir proteção',done:reserveOk,text:reserveOk?'Você já registrou valor guardado no período.':'Quando o caixa estabilizar, comece uma reserva possível e recorrente.'});
  return {asOf:today(),sp,dec,fc7,fc30,free,perDay,days,urgent,critical,level,headline,action,recovery,nextIncome:dec.nextIncome};
}

/* 11.23 — Detector de descontrole: sinais objetivos, locais e explicáveis. */
export function financialControlDetector(s=store.getState()){
  const sp=F.spendable(s), ym=today().slice(0,7);
  const [yy,mm]=ym.split('-').map(Number);
  const prev=`${mm===1?yy-1:yy}-${String(mm===1?12:mm-1).padStart(2,'0')}`;
  const cur=F.monthSummary(ym,s), old=F.monthSummary(prev,s);
  const futureInstallments=F.installmentsCommit(3,s), activeInst=F.activeInstallments(s);
  const alerts=[];
  const add=(id,severity,title,why,action,value=0)=>alerts.push({id,severity,title,why,action,value});
  if(sp.free<0) add('deficit','danger','O dinheiro não cobre os próximos compromissos',`Faltam R$ ${Math.abs(sp.free).toFixed(2)} até a próxima entrada.`,'Abra o SOS e organize a ordem de pagamento.',Math.abs(sp.free));
  else if(sp.balance>0 && sp.free/sp.balance<0.15) add('low_free','high','Quase todo o saldo já tem destino',`Só ${Math.round((sp.free/sp.balance)*100)}% do saldo está realmente livre.`,'Evite novas compras não essenciais até a próxima entrada.',sp.free);
  if(sp.tone==='warn') add('pace','high','Seu ritmo de gasto está acelerado',`Você já usou ${Math.round(sp.moneyRatio*100)}% do dinheiro livre do ciclo, enquanto ${Math.round(sp.timeRatio*100)}% do período passou.`,'Use o limite diário do Copiloto como referência até receber novamente.');
  if(cur.incomePaid>0 && cur.spend>cur.incomePaid) add('overspend','danger','Você gastou mais do que entrou neste mês',`Gastos de R$ ${cur.spend.toFixed(2)} para R$ ${cur.incomePaid.toFixed(2)} de entradas recebidas.`,'Pause gastos adiáveis e revise os maiores gastos do mês.',cur.spend-cur.incomePaid);
  if(old.spend>0 && cur.spend>old.spend*1.25) add('spike','medium','Seus gastos subiram bastante',`O gasto registrado neste mês está ${Math.round((cur.spend/old.spend-1)*100)}% acima do mês anterior.`,'Confira as categorias que mais cresceram antes de assumir novos compromissos.');
  const incomeBase=cur.incomePaid||cur.income||0;
  if(incomeBase>0 && futureInstallments>incomeBase*0.6) add('installments','high','Parcelas futuras estão pesando',`Os próximos 3 meses já têm R$ ${futureInstallments.toFixed(2)} comprometidos em parcelas.`,'Evite novos parcelamentos e veja quanto cada compra já ocupa dos próximos meses.',futureInstallments);
  else if(activeInst.length>=4) add('many_installments','medium','Muitos parcelamentos ativos',`Há ${activeInst.length} compras parceladas ainda em andamento.`,'Antes de parcelar novamente, confira o comprometimento futuro.',activeInst.length);
  const top=cur.cats?.[0];
  if(top && cur.spend>0 && top.share>=0.45 && !['Moradia','Saúde','Educação'].includes(top.cat)) add('concentration','medium',`${top.cat} concentra grande parte dos gastos`,`${Math.round(top.share*100)}% dos gastos do mês estão nessa categoria.`,'Revise os lançamentos dessa categoria e procure o que pode ser reduzido.',top.value);
  if(sp.invList?.length && sp.invoices>Math.max(0,sp.balance)*0.7) add('invoice','high','A fatura está pressionando seu caixa',`Faturas antes da próxima entrada somam R$ ${sp.invoices.toFixed(2)}.`,'Evite novas compras no crédito e compare a ordem dos próximos pagamentos.',sp.invoices);
  const rank={danger:4,high:3,medium:2,low:1}; alerts.sort((a,b)=>rank[b.severity]-rank[a.severity]||b.value-a.value);
  const score=Math.min(100,alerts.reduce((n,a)=>n+({danger:30,high:20,medium:12,low:6}[a.severity]||0),0));
  const level=score>=50?'danger':score>=25?'high':score>0?'attention':'ok';
  return {alerts,score,level,top:alerts[0]||null,cur,old,futureInstallments,activeInstallments:activeInst.length};
}


/* 11.25 — Bloco B: sobrevivência do mês. Reusa spendable/forecast; não cria saldo paralelo. */
export function survivalPlan(s=store.getState()){
  const sp=F.spendable(s), next=sp.next||F.nextIncome(s);
  const free=round2(sp.free), days=Math.max(1,sp.days), daily=free>0?round2(free/days):0;
  const protectedMoney={
    balance:round2(sp.balance),
    bills:round2(sp.billsTotal),
    cards:round2(sp.invoices),
    safety:round2(sp.saveLeft),
    protected:round2(sp.commitments+sp.saveLeft),
    free
  };
  /* Procura a primeira quebra de caixa num horizonte útil. dailyForecast já inclui contas, faturas,
     entradas agendadas e o ritmo variável observado; por isso o risco é sempre apresentado como projeção. */
  const fc=F.computeFresh(()=>F.dailyForecast(45,s));
  const risk=fc.risk;
  const deficit=risk?round2(Math.abs(risk.balance)):0;
  const knownEvents=risk?(risk.events||[]).map(e=>({type:e.type,label:e.label,value:round2(e.value)})):[];
  const sourceLabel=next?.source==='agendada'?'entrada cadastrada':next?.source==='perfil'?'dia de receber informado':next?.source==='estimada'?'estimativa pelo histórico':'início do próximo mês';
  let status='ok', title='Seu caixa atravessa a próxima entrada sem ficar negativo.', action=`Mantenha os gastos perto de R$ ${daily.toFixed(2)} por dia até ${next?.date||sp.until}.`;
  if(free<0){status='danger';title=`Faltam R$ ${Math.abs(free).toFixed(2)} antes da próxima entrada.`;action='Priorize os compromissos essenciais e use o SOS para comparar a ordem de pagamento.';}
  else if(risk){status='danger';title=`A projeção fica negativa em ${risk.date}.`;action=`Reduzir cerca de R$ ${deficit.toFixed(2)} em gastos antes dessa data cria margem para evitar o negativo projetado.`;}
  else if(sp.tone==='warn'){status='warn';title='Seu limite diário está apertando.';action=`Tente ficar em até R$ ${daily.toFixed(2)} por dia até a próxima entrada.`;}
  return {asOf:today(),next,sourceLabel,days,free,daily,protectedMoney,forecast:fc,risk,deficit,knownEvents,status,title,action,estimated:!!fc.estimated};
}


/* 11.26 — Bloco C: comportamento. Detectores locais, explicáveis e sem classificar gasto como "errado". */
export function behaviorAnalysis(s=store.getState()){
  const ym=ymOf(today()), sm=F.monthSummary(ym,s);
  const spendRows=s.transactions.filter(t=>t.type==='expense' && F.isSpend(t) && t.date.startsWith(ym) && t.date<=today());
  const small=spendRows.filter(t=>num(t.value)>0 && num(t.value)<=30);
  const smallTotal=round2(small.reduce((a,t)=>a+num(t.value),0));
  const smallByCat=new Map();
  for(const t of small) smallByCat.set(t.cat||'Outros',(smallByCat.get(t.cat||'Outros')||0)+num(t.value));
  const smallCats=[...smallByCat.entries()].map(([cat,value])=>({cat,value:round2(value)})).sort((a,b)=>b.value-a.value).slice(0,3);
  const leakRelevant=small.length>=5 && smallTotal>=50 && (sm.spend<=0 || smallTotal/sm.spend>=0.08);

  /* Recorrências detectadas: usa cadastros explícitos e, no histórico, exige >=3 meses distintos
     com descrição normalizada e valores próximos (tolerância 15%). Não cria/cancela assinatura. */
  const explicit=F.subscriptionSummary(s);
  const norm=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b\d+\b/g,'').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
  const groups=new Map();
  for(const t of s.transactions){
    if(t.type!=='expense'||!F.isSpend(t)||num(t.value)<=0) continue;
    const key=norm(t.desc); if(key.length<3) continue;
    if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(t);
  }
  const explicitNames=new Set(explicit.rows.map(x=>norm(x.name)));
  const detected=[];
  for(const [key,rows] of groups){
    const months=new Set(rows.map(x=>ymOf(x.date))); if(months.size<3) continue;
    const vals=rows.map(x=>num(x.value)).filter(Boolean); const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
    if(!avg || vals.some(v=>Math.abs(v-avg)/avg>0.15)) continue;
    if(explicitNames.has(key)) continue;
    const last=rows.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    detected.push({name:last.desc||key,value:round2(avg),months:months.size,source:'history'});
  }
  detected.sort((a,b)=>b.value-a.value);
  const recurringMonthly=round2(explicit.monthly+detected.reduce((a,x)=>a+x.value,0));

  /* Bola de neve: somente parcelas ainda não pagas, agrupadas pelo mês real de cada parcela. */
  const active=F.activeInstallments(s), start=ym;
  const timeline=Array.from({length:6},(_,i)=>({ym:addMonthsYM(start,i),value:0,count:0}));
  const map=new Map(timeline.map(x=>[x.ym,x]));
  let futureTotal=0;
  for(const a of active) for(const t of a.rows){
    if(t.status==='Pago'||t.date<today()) continue;
    futureTotal+=num(t.value); const cell=map.get(ymOf(t.date)); if(cell){cell.value+=num(t.value);cell.count++;}
  }
  timeline.forEach(x=>x.value=round2(x.value)); futureTotal=round2(futureTotal);
  const currentLoad=timeline[0]?.value||0;
  const lastWithLoad=[...timeline].reverse().find(x=>x.value>0.004)||null;
  const firstLower=timeline.slice(1).find(x=>x.value<currentLoad-0.004)||null;
  const released=firstLower?round2(currentLoad-firstLower.value):0;
  return {
    leak:{count:small.length,total:smallTotal,share:sm.spend?smallTotal/sm.spend:0,categories:smallCats,relevant:leakRelevant},
    subscriptions:{explicit:explicit.rows,detected:detected.slice(0,8),monthly:recurringMonthly,annual:round2(recurringMonthly*12)},
    installments:{activeCount:active.length,currentLoad,futureTotal,timeline,lastWithLoad,firstLower,released},
    stopToday:{timeline,currentLoad,futureTotal,lastWithLoad,firstLower,released}
  };
}

/* 11.27 — Bloco D: recuperação. Plano adaptativo, quitação explicável e reserva somente simulada. */
export function recoveryAnalysis(s=store.getState(), reserveWithdrawal=0){
  const sp=F.spendable(s), dec=analyzeFinancialDecision(s), wealth=F.wealth(s);
  const avgSpend=Math.max(0,F.avgMonthlySpend(3,s));
  const reserve=round2(wealth.reserve||0), withdrawal=Math.max(0,round2(num(reserveWithdrawal)));
  const afterReserve=round2(Math.max(0,reserve-withdrawal));
  const monthsBefore=avgSpend>0?round2(reserve/avgSpend):0, monthsAfter=avgSpend>0?round2(afterReserve/avgSpend):0;

  /* Dívida aqui significa obrigação vencida ou fatura pendente conhecida. Não inferimos juros. */
  const debts=dec.obligations.filter(o=>o.kind==='invoice'||o.date<today()).map(o=>({
    ...o, interestKnown:false, interestRate:null,
    overdue:o.date<today(), amount:round2(o.value)
  }));
  const smallest=[...debts].sort((a,b)=>a.amount-b.amount||a.date.localeCompare(b.date));
  const lowerImpact=[...debts].sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
  const missingInterest=debts.length>0;

  const overdue=dec.obligations.filter(o=>o.date<today());
  const month=F.monthSummary(ymOf(today()),s);
  const monthlyDeficit=month.incomePaid>0 && month.spend>month.incomePaid;
  const expensiveDebtKnown=false; // o modelo atual não persiste taxa de dívida/fatura; não inventar.
  const cushionTarget=500, cushionOk=reserve>=cushionTarget;
  const reserveTarget=avgSpend>0?round2(avgSpend*3):0, reserveOk=reserveTarget>0 && reserve>=reserveTarget;
  const steps=[
    {id:'overdue',title:'Organizar contas atrasadas',done:overdue.length===0,text:overdue.length?`${overdue.length} compromisso(s) vencido(s) ainda precisam de um plano.`:'Nenhum compromisso vencido aparece na análise atual.'},
    {id:'deficit',title:'Parar o déficit mensal',done:sp.free>=0&&!monthlyDeficit,text:sp.free<0?`Faltam R$ ${Math.abs(sp.free).toFixed(2)} até a próxima entrada.`:monthlyDeficit?'Neste mês, os gastos pagos já superam as entradas recebidas.':'O caixa atual não indica déficit até a próxima entrada.'},
    {id:'debt',title:'Reduzir dívidas e faturas pendentes',done:debts.length===0,text:debts.length?`${debts.length} obrigação(ões) vencida(s) ou fatura(s) pendente(s) entram no plano.`:'Nenhuma dívida vencida ou fatura pendente foi encontrada.'},
    {id:'cushion',title:'Criar o primeiro colchão de R$ 500',done:cushionOk,text:cushionOk?`Sua reserva cadastrada já supera R$ 500.`:`Faltam R$ ${Math.max(0,cushionTarget-reserve).toFixed(2)} para chegar ao primeiro colchão.`},
    {id:'reserve',title:'Construir 3 meses de reserva',done:reserveOk,text:reserveTarget?`Referência atual: R$ ${reserveTarget.toFixed(2)} com base na média de gastos.`:'Registre mais histórico de gastos para estimar uma referência de 3 meses.'},
    {id:'invest',title:'Planejar investimentos',done:reserveOk&&debts.length===0,text:reserveOk&&debts.length===0?'Sua base de proteção permite começar a planejar objetivos de longo prazo.':'Primeiro estabilize caixa, pendências e proteção antes de priorizar esta etapa.'}
  ];
  const done=steps.filter(x=>x.done).length;
  const current=steps.find(x=>!x.done)||steps[steps.length-1];
  return {
    steps,done,total:steps.length,progress:Math.round(done/steps.length*100),current,
    debts:{rows:debts,total:round2(debts.reduce((n,x)=>n+x.amount,0)),smallest,lowerImpact,missingInterest,expensiveDebtKnown},
    reserve:{current:reserve,withdrawal,after:afterReserve,avgSpend,monthsBefore,monthsAfter,target3:reserveTarget}
  };
}

/* 11.28 — Bloco E: motivação. Vitórias e score são derivados de dados reais; não é score de crédito. */
export function motivationAnalysis(s=store.getState()){
  const ym=ymOf(today()), [yy,mm]=ym.split('-').map(Number);
  const prev=`${mm===1?yy-1:yy}-${String(mm===1?12:mm-1).padStart(2,'0')}`;
  const cur=F.monthSummary(ym,s), old=F.monthSummary(prev,s), sp=F.spendable(s), wealth=F.wealth(s);
  const detector=financialControlDetector(s), recovery=recoveryAnalysis(s);
  const active=F.activeInstallments(s), reserve=round2(wealth.reserve||0), avg=Math.max(0,F.avgMonthlySpend(3,s));
  const victories=[];
  if(old.spend>0 && cur.spend<old.spend) victories.push({id:'spend_down',icon:'📉',title:`Você gastou R$ ${round2(old.spend-cur.spend).toFixed(2)} menos que no mês passado`,detail:'Comparação dos gastos registrados até agora com o total registrado no mês anterior.'});
  if(cur.incomePaid>0 && cur.spend<=cur.incomePaid) victories.push({id:'within_income',icon:'✅',title:'Seus gastos pagos cabem nas entradas recebidas do mês',detail:`Entradas recebidas: R$ ${cur.incomePaid.toFixed(2)} · gastos: R$ ${cur.spend.toFixed(2)}.`});
  if(sp.free>=0) victories.push({id:'covered',icon:'🛡️',title:'Os compromissos considerados cabem até a próxima entrada',detail:`Margem realmente livre: R$ ${Math.max(0,sp.free).toFixed(2)}.`});
  if(reserve>=500) victories.push({id:'cushion',icon:'🎯',title:'Você já construiu o primeiro colchão de R$ 500',detail:`Reserva cadastrada: R$ ${reserve.toFixed(2)}.`});
  if(recovery.debts.rows.length===0) victories.push({id:'no_overdue',icon:'✨',title:'Nenhuma pendência vencida ou fatura pendente entrou no plano',detail:'Com base nas obrigações reconhecidas pelo Bivvo agora.'});

  /* Sequências mensais: somente meses fechados com histórico suficiente e regra objetiva. */
  const months=[]; for(let i=1;i<=6;i++){ const d=new Date(yy,mm-1-i,1), key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; months.push({ym:key,sm:F.monthSummary(key,s)}); }
  let withinIncomeStreak=0; for(const x of months){ if(x.sm.incomePaid>0 && x.sm.spend<=x.sm.incomePaid) withinIncomeStreak++; else break; }
  let savingStreak=0; for(const x of months){ if((x.sm.saved||0)>0) savingStreak++; else break; }
  const streaks=[];
  if(withinIncomeStreak>0) streaks.push({id:'income',icon:'🔥',count:withinIncomeStreak,label:`${withinIncomeStreak} mês${withinIncomeStreak===1?'':'es'} gastando até o que entrou`,detail:'Considera meses fechados com entradas recebidas registradas.'});
  if(savingStreak>0) streaks.push({id:'saving',icon:'🌱',count:savingStreak,label:`${savingStreak} mês${savingStreak===1?'':'es'} registrando valor guardado`,detail:'A sequência recomeça naturalmente se houver um mês sem valor guardado.'});

  /* Score explicável: 5 fatores de até 20 pontos. Nenhum dado externo/Serasa. */
  const factors=[]; const add=(id,label,points,max,why,action)=>factors.push({id,label,points:Math.max(0,Math.min(max,Math.round(points))),max,why,action});
  const overdueCount=recovery.debts.rows.filter(x=>x.overdue).length;
  add('bills','Contas em dia',overdueCount===0?20:Math.max(0,20-overdueCount*7),20,overdueCount===0?'Nenhum vencido reconhecido agora.':`${overdueCount} compromisso(s) vencido(s) reconhecido(s).`,'Organize primeiro os compromissos vencidos.');
  const freeRatio=sp.balance>0?sp.free/sp.balance:(sp.free>=0?1:0);
  add('free','Margem livre',sp.free<0?0:freeRatio>=.25?20:freeRatio>=.15?15:freeRatio>=.05?9:4,20,sp.free<0?`Faltam R$ ${Math.abs(sp.free).toFixed(2)} até a próxima entrada.`:`R$ ${sp.free.toFixed(2)} estão realmente livres.`,'Aumente a margem livre reduzindo gastos adiáveis ou novos compromissos.');
  const income=cur.incomePaid||cur.income||0, installment3=F.installmentsCommit(3,s), monthlyInst=installment3/3, instRatio=income>0?monthlyInst/income:0;
  add('debt','Parcelamentos e pressão',active.length===0?20:instRatio<=.1?17:instRatio<=.2?12:instRatio<=.3?7:3,20,active.length?`${active.length} parcelamento(s) ativo(s); média futura aproximada de R$ ${monthlyInst.toFixed(2)}/mês.`:'Nenhum parcelamento ativo reconhecido.','Evite novos parcelamentos enquanto a carga mensal estiver alta.');
  const reserveMonths=avg>0?reserve/avg:0;
  add('reserve','Proteção',reserveMonths>=3?20:reserve>=500?Math.min(18,8+reserveMonths*4):reserve>0?6:0,20,avg>0?`Sua reserva cobre cerca de ${reserveMonths.toFixed(1)} mês(es) da média de gastos.`:reserve>0?'Há reserva cadastrada, mas falta histórico para medir cobertura.':'Nenhuma reserva cadastrada foi reconhecida.','Construa a reserva aos poucos, depois que o caixa estiver estável.');
  add('trend','Equilíbrio do mês',cur.incomePaid>0?(cur.spend<=cur.incomePaid?20:Math.max(0,20-(cur.spend/cur.incomePaid-1)*40)):10,20,cur.incomePaid>0?`Gastos de R$ ${cur.spend.toFixed(2)} para R$ ${cur.incomePaid.toFixed(2)} recebidos.`:'Ainda não há entradas recebidas suficientes no mês para uma leitura completa.','Mantenha os gastos do mês abaixo das entradas recebidas sempre que possível.');
  const score=Math.round(factors.reduce((n,x)=>n+x.points,0));
  const level=score>=85?'Muito organizado':score>=70?'Em boa evolução':score>=50?'Em evolução':score>=30?'Atenção':'Prioridade em organizar';
  const positives=factors.filter(x=>x.points>=15).sort((a,b)=>b.points-a.points).slice(0,2);
  const improve=[...factors].sort((a,b)=>(a.points/a.max)-(b.points/b.max)).slice(0,2);
  const target=Math.min(100,Math.max(score+5,Math.ceil((score+1)/5)*5));
  return {victories:victories.slice(0,5),streaks,score,level,factors,positives,improve,target,detectorScore:detector.score};
}

/* 11.29 — Bloco F: orquestração final do Copiloto. Não cria um novo saldo; resume A–E. */
export function todayBrief(s=store.getState()){
  const snap=copilotSnapshot(s), survival=survivalPlan(s), behavior=behaviorAnalysis(s), recovery=recoveryAnalysis(s), motivation=motivationAnalysis(s), control=financialControlDetector(s);
  const actions=[];
  const add=(id,priority,title,detail,route)=>actions.push({id,priority,title,detail,route});
  if(survival.free<0) add('deficit',100,'Organize o que pagar primeiro',`Faltam R$ ${Math.abs(survival.free).toFixed(2)} antes da próxima entrada.`,'decision');
  if(survival.risk) add('negative',95,'Proteja o caixa antes da data de risco',`A projeção cruza zero em ${survival.risk.date}; a margem de referência é R$ ${survival.deficit.toFixed(2)}.`,'survival');
  if(recovery.debts.rows.some(x=>x.overdue)) add('overdue',90,'Resolva primeiro as pendências vencidas',`${recovery.debts.rows.filter(x=>x.overdue).length} compromisso(s) vencido(s) entram no plano.`,'recovery');
  if(control.top) add('control',80,control.top.title,control.top.action,'behavior');
  if(behavior.installments.activeCount>=4) add('installments',65,'Evite aumentar a bola de neve',`${behavior.installments.activeCount} parcelamento(s) estão ativos; veja quando a carga começa a cair.`,'behavior');
  if(survival.daily>0) add('daily',40,`Use ${survival.daily.toFixed(2)} por dia como referência`,`Até ${survival.next?.date||snap.sp.until}, preservando os compromissos considerados.`,'survival');
  if(!actions.length) add('steady',20,'Mantenha o plano atual','Nenhum risco forte exige uma mudança imediata com os dados cadastrados.','overview');
  actions.sort((a,b)=>b.priority-a.priority);
  return {status:snap.level,headline:snap.headline,free:snap.free,daily:survival.daily,nextIncome:survival.next,risk:survival.risk,score:motivation.score,scoreLevel:motivation.level,primary:actions[0],actions:actions.slice(0,4)};
}

export function whatIfIncomeDrop(percent=20,s=store.getState()){
  const p=Math.max(0,Math.min(100,num(percent)))/100, base=survivalPlan(s), next=base.next;
  const amount=round2(num(next?.value)*(1-p));
  const loss=round2(num(next?.value)-amount);
  return {percent:Math.round(p*100),current:round2(num(next?.value)),after:amount,loss,freeAfter:round2(base.free-loss),date:next?.date||null,source:base.sourceLabel};
}
