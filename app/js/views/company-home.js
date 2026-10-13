/* Bivvo Empresa — cockpit gerencial interativo inspirado em BI.
   Não substitui contabilidade: organiza fluxo de caixa e decisões do dono. */
import {h,s,money,money0,today,ymOf,addDays,addMonthsYM,shortDate,monthName,monthShort,round2,num} from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import {sectionTitle,catIcon,openSheet} from '../ui.js';
import {txRow} from './components.js';
import {openTxForm,openTxDetail,openFixedForm} from './forms.js';
import {openOpeningBalance} from './onboarding.js';
import {go} from '../nav.js';
import {captureBar} from '../quickcapture.js';
import * as CM from '../company-metrics.js';
import {openBusinessLesson,lessonButton,importanceBadge,cadenceText} from './company-education.js';

const NON_OPERATIONAL_INCOME=new Set(['Aporte dos sócios','Empréstimo empresarial','Reembolso','Saldo inicial']);
const OWNER_OUT=new Set(['Retirada dos sócios','Investimentos na empresa']);
const PALETTE=['#16808A','#6C42C2','#D9863D','#B6406A','#51966D','#667386','#D4A72C','#825B4E'];
const sum=(rows,fn=x=>x.value)=>round2(rows.reduce((n,x)=>n+num(fn(x)),0));
const isPaid=t=>t.status==='Pago';
let activePeriod=6;
let focusMonth='';
let focusCost='';

function operationalRevenue(t){return F.isRealIncome(t)&&!NON_OPERATIONAL_INCOME.has(t.cat);}
function operationalExpense(t){return F.isSpend(t)&&!OWNER_OUT.has(t.cat);}
function monthlyFixedCost(st){return round2(st.fixed.filter(x=>x.type!=='income').reduce((n,x)=>n+(x.rec==='Anual'?num(x.value)/12:num(x.value)),0));}
function cardOutstanding(st,until){
  const rows=[];
  for(const c of st.cards)for(const inv of F.cardStatus(c,st).invoices){
    if(inv.unpaid>0&&(!until||inv.dueDate<=until))rows.push({kind:'invoice',id:`${c.id}-${inv.ym}`,label:`Fatura ${c.name}`,cat:'Cartão empresarial',value:inv.unpaid,date:inv.dueDate,open:()=>go('cartoes')});
  }
  return rows;
}
function pendingRows(st,type,until){
  return st.transactions.filter(t=>store.recordVisible(t,st)&&t.type===type&&(type!=='income'||F.incomeAmount(t)>0)&&t.method!=='Crédito'&&!isPaid(t)&&(!until||t.date<=until)).map(t=>({kind:'tx',id:t.id,label:t.desc,cat:t.cat,value:type==='income'?F.incomeAmount(t):t.value,date:t.date,open:()=>openTxDetail(t.id)}));
}
function periodMonths(cur,n){return Array.from({length:n},(_,i)=>addMonthsYM(cur,i-(n-1)));}
function rowsForPeriod(st,months){const set=new Set(months);return st.transactions.filter(t=>store.recordVisible(t,st)&&set.has(ymOf(t.date)));}
function monthlySeries(st,months){return months.map(ym=>{const rows=st.transactions.filter(t=>store.recordVisible(t,st)&&ymOf(t.date)===ym);const revenue=sum(rows.filter(operationalRevenue),F.incomeAmount);const expenses=sum(rows.filter(operationalExpense));return {ym,revenue,expenses,result:round2(revenue-expenses)};});}
function deltaPct(now,prev){if(!prev)return now?100:0;return ((now-prev)/Math.abs(prev))*100;}
function trendLabel(v){if(Math.abs(v)<1)return 'estável';return `${v>0?'+':''}${Math.round(v)}% vs período anterior`;}
function rerender(root){root.replaceChildren();renderCompanyHome(root);}

export function renderCompanyHome(root){
  const st=store.getState(),t0=today(),cur=ymOf(t0);
  const hasData=st.transactions.length>0||st.fixed.length>0||st.cards.length>0;
  const period=activePeriod===1?1:activePeriod;
  const months=periodMonths(cur,period),prevMonths=periodMonths(addMonthsYM(months[0],-1),period);
  if(focusMonth&&!months.includes(focusMonth))focusMonth='';
  const periodRows=rowsForPeriod(st,months),prevRows=rowsForPeriod(st,prevMonths);
  const revenueRows=periodRows.filter(operationalRevenue),expenseRows=periodRows.filter(operationalExpense);
  const billed=sum(revenueRows,F.incomeAmount),received=sum(revenueRows.filter(isPaid),F.incomeAmount);
  const expenses=sum(expenseRows),expensesPaid=sum(expenseRows.filter(isPaid));
  const result=round2(billed-expenses),margin=billed>0?result/billed:0,box=F.balance(st);
  const prevRevenue=sum(prevRows.filter(operationalRevenue),F.incomeAmount),prevExpenses=sum(prevRows.filter(operationalExpense));
  const salesCount=revenueRows.length,ticket=salesCount?round2(billed/salesCount):0;
  const horizon=addDays(t0,45);
  const receivableAll=pendingRows(st,'income').filter(x=>!NON_OPERATIONAL_INCOME.has(st.transactions.find(t=>t.id===x.id)?.cat));
  const payableAll=[...pendingRows(st,'expense'),...cardOutstanding(st)].sort((a,b)=>a.date.localeCompare(b.date));
  const receivable=receivableAll.filter(x=>x.date<=horizon),payable=payableAll.filter(x=>x.date<=horizon);
  const receivableTotal=sum(receivableAll),payableTotal=sum(payableAll),fixedCost=monthlyFixedCost(st);
  const taxRows=periodRows.filter(t=>t.type==='expense'&&t.cat==='Impostos e tributos');
  const taxTotal=sum(taxRows),taxPending=sum(st.transactions.filter(t=>store.recordVisible(t,st)&&t.type==='expense'&&t.cat==='Impostos e tributos'&&!isPaid(t)));
  const overdueReceivable=receivableAll.filter(x=>x.date<t0),overduePayable=payableAll.filter(x=>x.date<t0);
  const cashProjection=round2(box+sum(receivable)-sum(payable));
  const series=monthlySeries(st,months);
  const dre=CM.statement(periodRows,{periodMonths:period,monthlyFixedFallback:fixedCost});
  const fixedOpex=round2(dre.fixedExpenses+dre.otherOpex);
  const revenueDelta=deltaPct(billed,prevRevenue),expenseDelta=deltaPct(expenses,prevExpenses);
  const lessonCtx={revenue:dre.revenue,variableCosts:dre.variableCosts,contribution:dre.contribution,contributionMargin:dre.contributionMargin,fixedExpenses:fixedOpex,ebitda:dre.ebitdaApprox,netProfit:dre.netProfit,cash:box,receivable:receivableTotal,payable:payableTotal,projectedCash:cashProjection,breakEven:dre.breakEven,ticket,salesCount};

  const head=h('div.home-head.company-home-head',
    h('div',h('span.eyebrow-soft','BIVVO EMPRESA · COCKPIT DO DONO'),h('h1.greet',st.profile?.companyName||'Seu negócio'),h('p.muted',`${period===1?monthName(cur):`Últimos ${period} meses`} · indicadores, caixa, custos e operação`)),
    h('button.btn.sm',{type:'button',onclick:()=>go('voce')},'Configurar empresa'));

  if(!hasData){
    const emptyCtx={revenue:0,variableCosts:0,contribution:0,contributionMargin:0,fixedExpenses:0,ebitda:0,netProfit:0,cash:box,receivable:0,payable:0,projectedCash:box,breakEven:0,ticket:0,salesCount:0};
    root.append(
      head,
      h('section.qc-shell.profile-qc.company-qc',h('div.profile-qc-head',h('div',h('h2','Anotar por texto ou voz'),h('p.muted.sm','Vendas, recebimentos, fornecedores e despesas entram direto no caixa da empresa.'))),captureBar({draftKey:'company',placeholder:'Ex.: venda 1200 ou fornecedor 450',ariaLabel:'Anotar movimentação da empresa',examples:'Exemplos: venda 1200 · fornecedor 450 · DAS 80 · + recebimento cliente 2500',title:'Anotar na empresa',subtitle:'O Bivvo identifica receita ou despesa, categoria, data e forma de pagamento.',label:'Anotação rápida da empresa',voicePrompt:'Ouvindo… ex.: "venda mil e duzentos" ou "paguei fornecedor quatrocentos e cinquenta"'})),
      h('section.card.company-start.company-start-learning',
        h('span.company-start-icon',{'aria-hidden':'true'},'🎓'),
        h('div',h('small.eyebrow-soft','COMECE DO JEITO CERTO'),h('h2','Seu primeiro passo como empreendedor não é decorar indicadores'),h('p','É criar uma rotina simples: separar o dinheiro da empresa, registrar o que vende, entender quanto custa vender e acompanhar o caixa. O Bivvo vai ensinar cada etapa enquanto você cadastra seus primeiros dados.')),
        h('div.btn-row',h('button.btn.primary',{type:'button',onclick:openOpeningBalance},'1. Informar caixa da empresa'),h('button.btn',{type:'button',onclick:()=>openBusinessLesson('pfPj',emptyCtx)},'2. Aprender PF x PJ'),h('button.btn',{type:'button',onclick:()=>openTxForm({mode:'income'})},'3. Registrar primeira venda'))),
      entrepreneurLearningHub(st,emptyCtx),
      h('section.card.company-first-week',
        h('div.company-educational-title',h('div',h('small.eyebrow-soft','ROTEIRO DA PRIMEIRA SEMANA'),h('h3','Faça só o essencial primeiro'),h('p.muted.sm','Não tente controlar 30 indicadores no primeiro dia. Siga esta ordem e o painel começa a fazer sentido.'))),
        h('div.company-first-week-grid',
          beginnerTask('1','Separe PF e PJ','Escolha uma conta/caixa da empresa. Aporte e retirada de sócio não são faturamento.',()=>openBusinessLesson('pfPj',emptyCtx)),
          beginnerTask('2','Registre cada venda','Anote a venda mesmo quando o cliente pagar depois. Venda e recebimento são datas diferentes.',()=>openBusinessLesson('revenue',emptyCtx)),
          beginnerTask('3','Registre o custo da venda','Fornecedor, mercadoria, frete, embalagem, taxa, comissão e imposto podem fazer parte do custo.',()=>openBusinessLesson('variableCosts',emptyCtx)),
          beginnerTask('4','Cadastre gastos que se repetem','Aluguel, folha, pró-labore, contador e sistemas formam sua estrutura mensal.',()=>openBusinessLesson('recurring',emptyCtx)),
          beginnerTask('5','Olhe o caixa futuro','Cadastre vencimentos e recebimentos para saber antes se vai faltar dinheiro.',()=>openBusinessLesson('cashProjection',emptyCtx)),
          beginnerTask('6','Só depois aprenda preço e lucro','Com custos bem registrados, o Bivvo calcula margem, ponto de equilíbrio e ajuda na precificação.',()=>openBusinessLesson('pricing',emptyCtx)))));
    return;
  }

  root.append(
    head,
    companyFilterBar(root,period),
    h('section.qc-shell.profile-qc.company-qc',
      h('div.profile-qc-head',h('div',h('h2','Anotar por texto ou voz'),h('p.muted.sm','Vendas, recebimentos, fornecedores e despesas entram direto no caixa da empresa.'))),
      captureBar({draftKey:'company',placeholder:'Ex.: venda 1200 ou fornecedor 450',ariaLabel:'Anotar movimentação da empresa',examples:'Exemplos: venda 1200 · fornecedor 450 · DAS 80 · + recebimento cliente 2500',title:'Anotar na empresa',subtitle:'O Bivvo identifica receita ou despesa, categoria, data e forma de pagamento.',label:'Anotação rápida da empresa',voicePrompt:'Ouvindo… ex.: "venda mil e duzentos" ou "paguei fornecedor quatrocentos e cinquenta"'})),
    entrepreneurLearningHub(st,lessonCtx),
    companyStageIntro('1','Primeiro: descubra se vender está gerando resultado','Leia da esquerda para a direita. Essa sequência ensina como o dinheiro de uma venda vira — ou não vira — lucro. Toque em “Entenda” em qualquer etapa.'),
    h('section.company-profit-flow',
      businessKpi('Faturamento',dre.revenue,trendLabel(revenueDelta),'💰','good','revenue',lessonCtx),
      flowArrow(),
      businessKpi('Custos variáveis',dre.variableCosts,'ligados diretamente à venda','📦',dre.variableCosts>dre.revenue?'bad':'','variableCosts',lessonCtx),
      flowArrow(),
      businessKpi('Margem de contribuição',dre.contribution,`${(dre.contributionMargin*100).toFixed(1).replace('.',',')}% do faturamento`,'🧮',dre.contributionMargin<0?'bad':dre.contributionMargin<.15?'warn':'good','contribution',lessonCtx),
      flowArrow(),
      businessKpi('Despesas fixas / operação',fixedOpex,'estrutura para manter o negócio','🏢','','fixedOpex',lessonCtx),
      flowArrow(),
      businessKpi('EBITDA aproximado',dre.ebitdaApprox,'resultado operacional gerencial','📈',dre.ebitdaApprox<0?'bad':'good','ebitda',lessonCtx),
      flowArrow(),
      businessKpi('Lucro gerencial',dre.netProfit,'resultado após despesas financeiras cadastradas','✅',dre.netProfit<0?'bad':'good','netProfit',lessonCtx)),
    companyStageIntro('2','Depois: cuide do dinheiro que realmente entra e sai','Lucro e caixa são coisas diferentes. Aqui você enxerga se haverá dinheiro para pagar as contas mesmo quando a empresa vende bem.'),
    h('section.company-kpis.company-cash-kpis',
      businessKpi('Caixa atual',box,`projeção 45d ${money0(cashProjection)}`,'🏦',box<0?'bad':'good','cash',lessonCtx),
      businessKpi('A receber',receivableTotal,overdueReceivable.length?`${overdueReceivable.length} em atraso`:`${receivableAll.length} título(s)`,'🤝',overdueReceivable.length?'warn':'','receivable',lessonCtx),
      businessKpi('A pagar',payableTotal,overduePayable.length?`${overduePayable.length} em atraso`:`${payableAll.length} compromisso(s)`,'🧾',overduePayable.length?'bad':'','payable',lessonCtx),
      businessKpi('Caixa projetado',cashProjection,'considerando próximos 45 dias','🔭',cashProjection<0?'bad':'good','cashProjection',lessonCtx)),
    businessMentorCard({dre,fixedOpex,box,cashProjection,receivableTotal,payableTotal,overdueReceivable,overduePayable,revenueDelta,expenseDelta}),
    companyStageIntro('3','Agora: entenda por que os números estão mudando','Os gráficos abaixo ajudam a encontrar a causa. Clique em qualquer gráfico para abrir uma aula curta + detalhes dos seus próprios dados.'),
    h('section.company-bi-grid.company-bi-top',
      monthlyPerformanceCard(root,series),
      cashForecastCard(box,receivable,payable,t0,horizon),
      expenseMixCard(root,expenseRows,expenses),
      receivableAgingCard(receivableAll,t0)),
    h('section.company-bi-grid.company-bi-middle',
      targetCard(st,billed,period),
      revenueSourceCard(revenueRows,billed),
      fixedVariableCard(expenseRows),
      healthScoreCard({billed,expenses,margin,cashProjection,overdueReceivable,overduePayable,taxPending,box,payableTotal})),
    companyStageIntro('4','Por fim: transforme leitura em ação','Registre o que aconteceu, planeje o que vai acontecer e revise os indicadores. Um negócio melhora quando o dono cria rotina, não quando olha o painel só no aperto.'),
    h('section.card.company-actions.power-actions',sectionTitle('Ações rápidas'),h('div.company-action-grid',
      quick('+','Nova receita','Venda ou serviço',()=>openTxForm({mode:'income'}),'income'),
      quick('−','Nova despesa','Custo ou fornecedor',()=>openTxForm({mode:'expense'}),'expense'),
      quick('🤝','Cliente a receber','Venda ainda não recebida',()=>openTxForm({mode:'income',preset:{cat:'Recebimentos de clientes',status:'Pendente'}})),
      quick('🧾','Lançar imposto','DAS, DARF, ISS, ICMS…',()=>openTxForm({mode:'expense',preset:{cat:'Impostos e tributos'}})),
      quick('🔁','Recorrência','Aluguel, folha, contrato',()=>openFixedForm()),
      quick('📈','Gestão detalhada','Custos, produtos e indicadores',()=>go('planos')))));

  const cols=h('div.home-grid.company-grid.company-operational-grid'),left=h('div.col'),right=h('div.col');
  left.append(queueCard('Contas a receber · próximos 45 dias',receivable,'Nenhum recebimento pendente nos próximos 45 dias.',()=>openTxForm({mode:'income',preset:{status:'Pendente'}}),'Receber'),queueCard('Contas a pagar · próximos 45 dias',payable,'Nenhum pagamento pendente nos próximos 45 dias.',()=>openTxForm({mode:'expense',preset:{status:'Pendente'}}),'Pagar'));
  const recent=st.transactions.filter(t=>store.recordVisible(t,st)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0)).slice(0,8);
  if(recent.length)left.append(h('section.card.company-recent',sectionTitle('Últimos lançamentos',{label:'Abrir caixa',fn:()=>go('extrato')}),h('div.list',recent.map(t=>txRow(t,{showDate:true})))));

  right.append(ownerReadingCard({result,margin,cashProjection,billed,taxTotal,taxPending,box,payableTotal,st}),attentionCard({taxPending,overdueReceivable,overduePayable,st}));
  cols.append(left,right);root.append(cols,h('p.hint.company-bi-disclaimer','Painel gerencial de fluxo de caixa. Os gráficos usam os lançamentos cadastrados no Bivvo; para apuração contábil e fiscal, valide os números com seu contador.'));
}

function companyFilterBar(root,period){
  return h('section.card.company-bi-toolbar',
    h('div.company-bi-toolbar-copy',h('small.eyebrow-soft','FILTROS DO PAINEL'),h('b','Período de análise'),h('span','Todos os gráficos e KPIs respondem ao período selecionado.')),
    h('div.company-period-filter',[1,3,6,12].map(n=>h('button'+(period===n?'.on':''),{type:'button',onclick:()=>{activePeriod=n;focusMonth='';focusCost='';rerender(root);}},n===1?'Este mês':`${n} meses`))),
    h('button.btn.sm',{type:'button',onclick:()=>go('extrato')},'Abrir fluxo de caixa'));
}

function monthlyPerformanceCard(root,series){
  const max=Math.max(1,...series.flatMap(x=>[x.revenue,x.expenses]));
  const chosen=focusMonth?series.find(x=>x.ym===focusMonth):series.at(-1);
  const totalRevenue=sum(series,x=>x.revenue),totalExpenses=sum(series,x=>x.expenses),totalResult=round2(totalRevenue-totalExpenses);
  const best=series.slice().sort((a,b)=>b.result-a.result)[0];
  const detail=()=>openCompanyInsight({
    icon:'📈',title:'Desempenho mensal',subtitle:'Receita, despesas e resultado do período selecionado.',
    stats:[['Faturamento',money0(totalRevenue)],['Despesas',money0(totalExpenses)],['Resultado',money0(totalResult)],['Melhor mês',best?monthName(best.ym):'—']],
    sections:[{title:'Mês a mês',rows:series.slice().reverse().map(x=>[monthName(x.ym),`Receita ${money0(x.revenue)} · Despesa ${money0(x.expenses)} · Resultado ${money0(x.result)}`,x.result>=0?'positivo':'atenção'])}],
    note:totalResult>=0?'No agregado, as receitas superam as despesas no período.':'No agregado, as despesas superam as receitas. Vale revisar custos, preço e volume de vendas.',
    lessonKey:'revenue',lessonContext:{revenue:totalRevenue}
  });
  return interactiveBICard({title:'Desempenho mensal',sub:'Receita x despesas · clique em um mês para detalhar',icon:'📈',cls:'company-monthly',detail,content:[
    h('div.company-bar-chart',series.map(x=>h('button.company-month-group'+(chosen?.ym===x.ym?'.selected':''),{type:'button',title:`${monthName(x.ym)}: receita ${money(x.revenue)}, despesas ${money(x.expenses)}, resultado ${money(x.result)}`,onclick:()=>{focusMonth=x.ym;rerender(root);}},
      h('div.company-month-bars',h('i.revenue',{vars:{'--bar-h':`${Math.max(3,x.revenue/max*100)}%`}}),h('i.expense',{vars:{'--bar-h':`${Math.max(3,x.expenses/max*100)}%`}})),h('small',monthShort(x.ym))))),
    h('div.company-chart-legend',h('span',h('i.revenue'),'Receita'),h('span',h('i.expense'),'Despesa')),
    chosen?h('div.company-chart-detail',h('div',h('small',monthName(chosen.ym)),h('b',money0(chosen.result)),h('span',chosen.result>=0?'resultado positivo':'resultado negativo')),h('div',h('span',`Receita ${money0(chosen.revenue)}`),h('span',`Despesa ${money0(chosen.expenses)}`))):null
  ]});
}

function cashForecastCard(box,receivable,payable,t0,horizon){
  const events=[...receivable.map(x=>({...x,delta:num(x.value)})),...payable.map(x=>({...x,delta:-num(x.value)}))].sort((a,b)=>a.date.localeCompare(b.date));
  const points=[{date:t0,balance:box,label:'Hoje'}];let bal=box;
  for(const e of events){bal=round2(bal+e.delta);points.push({date:e.date,balance:bal,label:e.label,delta:e.delta});}
  if(points.at(-1)?.date!==horizon)points.push({date:horizon,balance:bal,label:'45 dias'});
  const min=Math.min(0,...points.map(x=>x.balance)),max=Math.max(1,...points.map(x=>x.balance));
  const w=520,hg=170,pad=18,range=max-min||1;
  const xy=(p,i)=>({x:pad+(w-pad*2)*(points.length===1?0:i/(points.length-1)),y:pad+(hg-pad*2)*(1-(p.balance-min)/range)});
  const path=points.map((p,i)=>{const q=xy(p,i);return `${i?'L':'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`;}).join(' ');
  const detail=()=>openCompanyInsight({icon:'🏦',title:'Projeção de caixa',subtitle:'Como os recebimentos e pagamentos cadastrados podem mover o caixa nos próximos 45 dias.',
    stats:[['Caixa hoje',money0(box)],['Em 45 dias',money0(bal)],['Menor ponto',money0(Math.min(...points.map(x=>x.balance)))],['Eventos',String(events.length)]],
    sections:[{title:'Próximos movimentos',rows:events.slice(0,12).map(e=>[shortDate(e.date),`${e.label} · ${e.delta>=0?'+':'−'} ${money0(Math.abs(e.delta))}`,e.delta>=0?'entrada':'saída'])}],
    note:bal>=0?'A projeção termina positiva com os eventos cadastrados. Continue mantendo contas futuras atualizadas.':'A projeção termina negativa. Antecipe recebimentos, adie despesas não essenciais ou reforce capital de giro.',lessonKey:'cashProjection',lessonContext:{cash:box,projectedCash:bal,receivable:sum(receivable),payable:sum(payable)}});
  const svg=s('svg',{viewBox:`0 0 ${w} ${hg}`,role:'img','aria-label':'Projeção do caixa pelos próximos 45 dias'},
    s('line',{x1:pad,y1:(pad+(hg-pad*2)*(1-(0-min)/range)).toFixed(1),x2:w-pad,y2:(pad+(hg-pad*2)*(1-(0-min)/range)).toFixed(1),class:'company-zero-line'}),
    s('path',{d:path,class:'company-cash-path'}),
    ...points.map((p,i)=>{const q=xy(p,i);return s('circle',{cx:q.x,cy:q.y,r:i===0||i===points.length-1?5:3.5,class:p.balance<0?'bad':'good'},s('title',{},`${p.date}: ${money(p.balance)}`));}));
  return interactiveBICard({title:'Projeção de caixa',sub:'Recebimentos e pagamentos cadastrados · 45 dias',icon:'🏦',cls:'company-forecast',detail,content:[h('div.company-svg-wrap',svg),h('div.company-forecast-foot',h('span',h('small','Hoje'),h('b',money0(box))),h('span',h('small','Em 45 dias'),h('b',{class:bal<0?'neg':'in'},money0(bal))),h('span',h('small','Eventos'),h('b',String(events.length))))]});
}

function expenseMixCard(root,rows,total){
  const map=new Map();for(const t of rows)map.set(t.cat,(map.get(t.cat)||0)+num(t.value));
  const all=[...map.entries()].map(([cat,value])=>({cat,value:round2(value),share:total?value/total:0})).sort((a,b)=>b.value-a.value);
  const top=all.slice(0,6),rest=sum(all.slice(6));if(rest>0)top.push({cat:'Outros',value:rest,share:rest/total});
  const r=52,c=2*Math.PI*r;let offset=0;
  const detail=()=>openCompanyInsight({icon:'📦',title:'Mapa de custos',subtitle:'Quais categorias mais consomem dinheiro no período.',stats:[['Despesas',money0(total)],['Categorias',String(all.length)],['Maior custo',all[0]?.cat||'—'],['Peso do maior',all[0]?`${Math.round(all[0].share*100)}%`:'—']],sections:[{title:'Composição das despesas',rows:all.map(x=>[x.cat,`${money0(x.value)} · ${Math.round(x.share*100)}% do total`,x.share>.25?'alto peso':''])}],note:all[0]?.share>.35?'Uma única categoria concentra mais de 35% dos gastos. Vale investigar se existe dependência ou oportunidade de negociação.':'A distribuição de custos está menos concentrada entre as categorias cadastradas.',lessonKey:'costMix',lessonContext:{categoryValue:all[0]?.value||0,share:all[0]?.share||0}});
  const circles=top.map((x,i)=>{const len=x.share*c,start=offset;offset+=len;return s('circle',{cx:70,cy:70,r,fill:'none',stroke:PALETTE[i%PALETTE.length],'stroke-width':18,'stroke-dasharray':`${len} ${Math.max(0,c-len)}`,'stroke-dashoffset':`${-start}`,transform:'rotate(-90 70 70)'},s('title',{},`${x.cat}: ${money(x.value)} (${Math.round(x.share*100)}%)`));});
  const active=focusCost&&all.find(x=>x.cat===focusCost);
  return interactiveBICard({title:'Mapa de custos',sub:'Participação das despesas no período',icon:'📦',cls:'company-donut-card',detail,content:[
    total?h('div.company-donut-layout',h('div.company-donut',s('svg',{viewBox:'0 0 140 140',role:'img','aria-label':'Distribuição das despesas por categoria'},s('circle',{cx:70,cy:70,r,fill:'none',class:'company-donut-bg','stroke-width':18}),...circles,s('text',{x:70,y:66,'text-anchor':'middle',class:'company-donut-total-label'},'DESPESAS'),s('text',{x:70,y:84,'text-anchor':'middle',class:'company-donut-total-value'},money0(total)))),h('div.company-donut-legend',top.map((x,i)=>h('button'+(focusCost===x.cat?'.on':''),{type:'button',onclick:()=>{focusCost=focusCost===x.cat?'':x.cat;rerender(root);}},h('i',{vars:{'--dot':PALETTE[i%PALETTE.length]}}),h('span',h('b',x.cat),h('small',`${Math.round(x.share*100)}% · ${money0(x.value)}`)))))):h('p.muted.sm','Ainda não há despesas suficientes para formar o gráfico.'),
    active?h('div.company-chart-detail.compact',h('div',h('small','Categoria selecionada'),h('b',active.cat),h('span',`${Math.round(active.share*100)}% do gasto`)),h('button.btn.sm',{type:'button',onclick:()=>go('extrato')},'Ver lançamentos')):null
  ]});
}

function receivableAgingCard(rows,t0){
  const buckets=[
    {label:'A vencer',test:d=>d>=t0},{label:'1–7 dias',test:d=>d<t0&&d>=addDays(t0,-7)},{label:'8–30 dias',test:d=>d<addDays(t0,-7)&&d>=addDays(t0,-30)},{label:'31+ dias',test:d=>d<addDays(t0,-30)}
  ];
  const data=buckets.map(b=>{const filtered=rows.filter(x=>b.test(x.date));return {...b,value:sum(filtered),count:filtered.length,items:filtered};});
  const max=Math.max(1,...data.map(x=>x.value)),tones=['#51966D','#D4A72C','#D9863D','#B6406A'];
  const overdue=sum(data.slice(1),x=>x.value),detail=()=>openCompanyInsight({icon:'🤝',title:'Aging de recebíveis',subtitle:'Idade dos valores que seus clientes ainda precisam pagar.',stats:[['A receber',money0(sum(data,x=>x.value))],['Em atraso',money0(overdue)],['Títulos',String(rows.length)],['31+ dias',money0(data[3].value)]],sections:[{title:'Faixas de atraso',rows:data.map(x=>[x.label,`${money0(x.value)} · ${x.count} título(s)`,x.label==='A vencer'?'normal':x.value?'atenção':''])}],note:overdue>0?'Existe valor vencido. Priorize cobranças antigas e acompanhe concentração por cliente.':'Os recebíveis cadastrados não apresentam atraso no momento.',lessonKey:'aging',lessonContext:{overdue}});
  const list=h('div.company-aging');data.forEach((x,i)=>list.append(h('button.company-aging-row.bi-row-button',{type:'button',onclick:detail},h('span',h('b',x.label),h('small',`${x.count} título(s)`)),h('div.company-aging-bar',h('i',{vars:{'--aging-w':`${x.value/max*100}%`,'--aging-tone':tones[i]}})),h('b',money0(x.value)))));
  return interactiveBICard({title:'Aging de recebíveis',sub:'Quanto está a vencer e há quanto tempo está atrasado',icon:'🤝',detail,content:[list]});
}

function targetCard(st,billed,period){
  const target=num(st.profile?.companyRevenueTarget)*(period||1),pct=target>0?Math.min(1.2,billed/target):0,r=46,c=2*Math.PI*r;
  const detail=()=>openCompanyInsight({icon:'🎯',title:'Meta de faturamento',subtitle:'Quanto do objetivo de vendas já foi alcançado.',stats:[['Realizado',money0(billed)],['Meta',target?money0(target):'Não definida'],['Progresso',target?`${Math.round(billed/target*100)}%`:'—'],['Falta',target?money0(Math.max(0,target-billed)):'—']],note:!target?'Defina uma meta para transformar o faturamento em uma referência de execução.':billed>=target?'Meta atingida no período. Avalie margem e capacidade antes de elevar o próximo objetivo.':'Acompanhe o ritmo de vendas e quanto precisa entrar para alcançar a meta.',lessonKey:'target',lessonContext:{target,revenue:billed}});
  if(!target)return interactiveBICard({title:'Meta de faturamento',sub:period===1?'Meta mensal':`Meta mensal acumulada em ${period} meses`,icon:'🎯',cls:'company-target',detail,content:[h('div.company-empty-bi',h('span','🎯'),h('p','Defina uma meta mensal em Você → Dados do negócio para acompanhar o progresso aqui.'),h('button.btn.sm',{type:'button',onclick:()=>go('voce')},'Definir meta'))]});
  const gauge=s('svg',{viewBox:'0 0 120 120'},s('circle',{cx:60,cy:60,r,fill:'none',class:'company-gauge-bg','stroke-width':12}),s('circle',{cx:60,cy:60,r,fill:'none',class:'company-gauge-value','stroke-width':12,'stroke-dasharray':`${Math.min(c,pct*c)} ${c}`,'stroke-dashoffset':'0',transform:'rotate(-90 60 60)'}),s('text',{x:60,y:57,'text-anchor':'middle',class:'company-gauge-number'},`${Math.round(pct*100)}%`),s('text',{x:60,y:75,'text-anchor':'middle',class:'company-gauge-label'},'da meta'));
  return interactiveBICard({title:'Meta de faturamento',sub:period===1?'Meta mensal':`Meta mensal acumulada em ${period} meses`,icon:'🎯',cls:'company-target',detail,content:[h('div.company-target-layout',gauge,h('div',h('b',`${money0(billed)} de ${money0(target)}`),h('p',billed>=target?'Meta atingida no período.':`Faltam ${money0(Math.max(0,target-billed))} para a meta acumulada.`)))]});
}

function revenueSourceCard(rows,total){
  const map=new Map();for(const t of rows)map.set(t.cat,(map.get(t.cat)||0)+num(t.value));
  const all=[...map.entries()].map(([cat,value])=>({cat,value,share:total?value/total:0})).sort((a,b)=>b.value-a.value),top=all.slice(0,5),max=Math.max(1,...top.map(x=>x.value));
  const detail=()=>openCompanyInsight({icon:'💼',title:'Receita por origem',subtitle:'Quais fontes sustentam o faturamento.',stats:[['Faturamento',money0(total)],['Origens',String(all.length)],['Principal origem',all[0]?.cat||'—'],['Concentração',all[0]?`${Math.round(all[0].share*100)}%`:'—']],sections:[{title:'Fontes de receita',rows:all.map(x=>[x.cat,`${money0(x.value)} · ${Math.round(x.share*100)}% do faturamento`,x.share>.5?'alta concentração':''])}],note:all[0]?.share>.6?'Mais de 60% da receita vem de uma única origem. Diversificar pode reduzir risco comercial.':'A receita está distribuída entre as fontes cadastradas.',lessonKey:'revenueSource',lessonContext:{sourceValue:all[0]?.value||0,share:all[0]?.share||0}});
  if(!top.length)return interactiveBICard({title:'Receita por origem',sub:'Quais fontes sustentam o faturamento',icon:'💼',detail,content:[h('p.muted.sm','Registre receitas para identificar as principais origens.')]});
  const list=h('div.company-hbar-list');top.forEach((x,i)=>list.append(h('button.company-hbar-row.bi-row-button',{type:'button',onclick:detail},h('span',h('b',x.cat),h('small',`${Math.round(x.share*100)}% do faturamento`)),h('div.company-hbar',h('i',{vars:{'--hbar-w':`${x.value/max*100}%`,'--hbar-tone':PALETTE[i%PALETTE.length]}})),h('b',money0(x.value)))));
  return interactiveBICard({title:'Receita por origem',sub:'Quais fontes sustentam o faturamento',icon:'💼',detail,content:[list]});
}

function fixedVariableCard(rows){
  const fixed=rows.filter(t=>t.fixedId||t.recurringKey),variable=rows.filter(t=>!t.fixedId&&!t.recurringKey),fv=sum(fixed),vv=sum(variable),total=fv+vv;
  const detail=()=>openCompanyInsight({icon:'⚖️',title:'Estrutura de custos',subtitle:'Quanto das despesas depende do volume vendido e quanto permanece mesmo sem vendas.',stats:[['Custos totais',money0(total)],['Fixos',money0(fv)],['Variáveis',money0(vv)],['Peso fixo',total?`${Math.round(fv/total*100)}%`:'—']],note:total&&fv/total>.7?'A estrutura está bastante rígida: mais de 70% das despesas registradas são fixas. Isso aumenta a necessidade de faturamento recorrente.':'A proporção entre custos fixos e variáveis está visível para apoiar decisões de capacidade e preço.',lessonKey:'costStructure',lessonContext:{fixed:fv,variable:vv}});
  if(!total)return interactiveBICard({title:'Estrutura de custos',sub:'Fixos x variáveis no período',icon:'⚖️',detail,content:[h('p.muted.sm','Cadastre recorrências e despesas para comparar a estrutura de custos.')]});
  return interactiveBICard({title:'Estrutura de custos',sub:'Fixos x variáveis no período',icon:'⚖️',detail,content:[h('div.company-cost-structure',h('div.company-cost-split',{onclick:detail},h('i.fixed',{vars:{'--split':`${fv/total*100}%`}}),h('i.variable')),h('div.company-cost-structure-legend',h('div',h('span',h('i.fixed-dot'),'Fixos'),h('b',money0(fv)),h('small',`${Math.round(fv/total*100)}%`)),h('div',h('span',h('i.variable-dot'),'Variáveis'),h('b',money0(vv)),h('small',`${Math.round(vv/total*100)}%`))))]});
}

function healthScoreCard(x){
  let score=100;if(x.margin<0)score-=35;else if(x.margin<.1)score-=18;if(x.cashProjection<0)score-=28;if(x.overdueReceivable.length)score-=Math.min(18,x.overdueReceivable.length*4);if(x.overduePayable.length)score-=Math.min(25,x.overduePayable.length*5);if(x.taxPending>0)score-=10;score=Math.max(0,Math.round(score));
  const tone=score>=80?'good':score>=55?'warn':'bad';
  const detail=()=>openCompanyInsight({icon:'🧭',title:'Saúde operacional',subtitle:'Leitura combinada de margem, caixa futuro e atrasos.',stats:[['Índice',`${score}/100`],['Margem',`${(x.margin*100).toFixed(1).replace('.',',')}%`],['Caixa futuro',money0(x.cashProjection)],['Pendências',String(x.overduePayable.length+x.overdueReceivable.length)]],sections:[{title:'Fatores avaliados',rows:[['Margem',x.margin>=.1?'Saudável':'Abaixo de 10%',x.margin>=.1?'ok':'atenção'],['Caixa futuro',x.cashProjection>=0?'Positivo':'Negativo',x.cashProjection>=0?'ok':'atenção'],['Pagamentos',x.overduePayable.length?`${x.overduePayable.length} vencido(s)`:'Em dia',x.overduePayable.length?'atenção':'ok'],['Cobranças',x.overdueReceivable.length?`${x.overdueReceivable.length} atrasada(s)`:'Em dia',x.overdueReceivable.length?'atenção':'ok']] }],note:score>=80?'Os indicadores atuais não apontam sinal crítico.':score>=55?'Há pontos de atenção. Abra cada gráfico para entender onde agir primeiro.':'O painel detectou risco relevante; priorize caixa, atrasos e rentabilidade antes de expandir gastos.',lessonKey:'health',lessonContext:{score}});
  return interactiveBICard({title:'Saúde operacional',sub:'Leitura rápida baseada nos dados cadastrados',icon:'🧭',cls:'company-health-score',detail,content:[h('div.company-score',{onclick:detail},h('strong',{class:tone},String(score)),h('span','/ 100')),h('p',score>=80?'Operação sem sinais críticos nos dados atuais.':score>=55?'Há pontos de atenção que merecem acompanhamento.':'O painel detectou riscos relevantes de caixa, margem ou atrasos.'),h('div.company-score-factors',h('span',{class:x.margin>=.1?'ok':'attention'},'Margem'),h('span',{class:x.cashProjection>=0?'ok':'attention'},'Caixa futuro'),h('span',{class:!x.overduePayable.length?'ok':'attention'},'Pagamentos'),h('span',{class:!x.overdueReceivable.length?'ok':'attention'},'Cobranças'))]});
}

function ownerReadingCard(x){
  return h('section.card.company-health',h('div.card-head',h('h3','Leitura do dono'),lessonButton('dre',{revenue:x.billed,netProfit:x.result,cash:x.box,projectedCash:x.cashProjection},'? Como interpretar')), 
    decision('Resultado operacional',x.result>=0?`${money0(x.result)} positivo`:`${money0(-x.result)} negativo`,x.result>=0?'A receita operacional supera as despesas no período selecionado.':'As despesas operacionais superam as receitas no período selecionado.',x.result>=0?'good':'bad'),
    decision('Margem',x.billed?`${(x.margin*100).toFixed(1).replace('.',',')}%`:'Sem base',x.billed?(x.margin>=.2?'Margem confortável para absorver oscilações.':x.margin>=.1?'Margem moderada: vigie custos e preço.':'Margem apertada: revise preço, mix e despesas.'):'Registre receitas para calcular.',x.margin>=.2?'good':x.margin>=.1?'warn':'bad'),
    decision('Caixa projetado',money0(x.cashProjection),x.cashProjection>=0?'Os eventos cadastrados mantêm caixa positivo em 45 dias.':'Mesmo recebendo o previsto, o caixa projetado cruza a zona negativa.',x.cashProjection>=0?'good':'bad'),
    x.st.profile.companyRevenueTarget>0?decision('Meta mensal',`${Math.min(999,Math.round(x.billed/(x.st.profile.companyRevenueTarget*activePeriod)*100))}%`,`Faturamento acumulado ${money0(x.billed)}.`,x.billed>=x.st.profile.companyRevenueTarget*activePeriod?'good':'warn'):null,
    decision('Impostos',money0(x.taxTotal),x.taxPending>0?`${money0(x.taxPending)} pendentes no cadastro.`:'Nenhum imposto pendente lançado.',x.taxPending>0?'warn':'good'));
}

function attentionCard({taxPending,overdueReceivable,overduePayable,st}){
  const obligations=[];
  if(taxPending>0)obligations.push({icon:'🧾',title:'Impostos pendentes',text:`${money0(taxPending)} cadastrados como não pagos.`,fn:()=>go('extrato')});
  if(overdueReceivable.length)obligations.push({icon:'🤝',title:'Cobranças em atraso',text:`${overdueReceivable.length} recebimento(s) já venceram.`,fn:()=>go('extrato')});
  if(overduePayable.length)obligations.push({icon:'⚠️',title:'Pagamentos vencidos',text:`${overduePayable.length} compromisso(s) precisam de atenção.`,fn:()=>go('calendario')});
  if(!st.fixed.length)obligations.push({icon:'🔁',title:'Cadastre os custos fixos',text:'Aluguel, folha, sistemas e contratos tornam a projeção mais fiel.',fn:()=>openFixedForm()});
  return h('section.card.company-attention',sectionTitle('Atenção do empresário'),obligations.length?h('div.company-alert-list',obligations.map(x=>h('button.company-alert',{type:'button',onclick:x.fn},h('span',x.icon),h('span',h('b',x.title),h('small',x.text)),h('span','›')))):h('p.good-note','✓ Nenhuma pendência crítica identificada nos dados cadastrados.'));
}

function cardHead(title,sub,icon,detail){
  return h('div.company-bi-card-head',
    h('div',h('span',icon),h('div',h('b',title),h('small',sub))),
    detail?h('button.bi-expand',{type:'button','aria-label':`Abrir detalhes de ${title}`,title:'Abrir detalhes',onclick:e=>{e.stopPropagation();detail();}},'↗'):null
  );
}
function interactiveBICard({title,sub,icon,detail,content=[],cls=''}){
  const open=()=>detail?.();
  return h('section.card.company-bi-card.bi-interactive'+(cls?'.'+cls:''),{
    tabindex:'0',role:'button','aria-label':`${title}. Abrir detalhes`,
    onclick:e=>{if(e.target.closest('button,a,input,select,textarea'))return;open();},
    onkeydown:e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('button,a,input,select,textarea')){e.preventDefault();open();}}
  },cardHead(title,sub,icon,detail),...content);
}
function openCompanyInsight({icon='📊',title,subtitle='',stats=[],sections=[],note='',lessonKey='',lessonContext={}}){
  const statGrid=h('div.bi-modal-stats',stats.map(([label,value,hint])=>h('article',h('small',label),h('b',value),hint?h('span',hint):null)));
  const blocks=sections.map(sec=>h('section.bi-modal-section',h('div.bi-modal-section-head',h('b',sec.title),sec.hint?h('small',sec.hint):null),h('div.bi-modal-list',sec.rows?.length?sec.rows.map(([label,value,tone])=>h('div.bi-modal-row',h('span',h('b',label),tone?h('small',{class:tone==='atenção'?'bad':tone==='ok'?'good':''},tone):null),h('strong',value))):h('p.muted.sm','Sem dados suficientes.'))));
  const guide=lessonKey?CM.businessGuide(lessonKey):null;
  const learn=guide?h('section.company-insight-learning',
    h('div.company-insight-learning-head',h('div',h('small','APRENDA ENQUANTO ANALISA'),h('b',guide.title)),lessonButton(lessonKey,lessonContext,'Abrir aula completa')),
    h('div.company-insight-learning-grid',
      h('article',h('small','O QUE É'),h('p',guide.what)),
      h('article',h('small','POR QUE IMPORTA'),h('p',guide.importance)),
      h('article.formula',h('small','COMO CALCULAR'),h('code',guide.formula)))):null;
  openSheet({wide:true,label:`Detalhes: ${title}`,content:h('div.bi-detail-modal',h('div.bi-modal-hero',h('span',{'aria-hidden':'true'},icon),h('div',h('small','DETALHES DO PAINEL'),h('h2',title),subtitle?h('p',subtitle):null)),learn,statGrid,...blocks,note?h('div.bi-modal-note',h('span','💡'),h('p',note)):null)});
}

function feature(icon,title,text){
  return h('div.company-feature',h('span',icon),h('div',h('b',title),h('small',text)));
}
function companyStageIntro(n,title,text){
  return h('section.company-stage-intro',h('span.company-stage-number',n),h('div',h('small','PASSO '+n),h('h2',title),h('p',text)));
}
function flowArrow(){return h('span.company-flow-arrow',{'aria-hidden':'true'},'→');}
function entrepreneurLearningHub(st,ctx){
  const hasRevenue=(st.transactions||[]).some(operationalRevenue),hasExpense=(st.transactions||[]).some(operationalExpense),hasFixed=(st.fixed||[]).some(x=>x.type!=='income'),hasProducts=(st.companyProducts||[]).length>0;
  const steps=[
    ['pfPj','1','Separe PF e PJ',true,'Regra número 1: dinheiro da empresa não é sua carteira pessoal.'],
    ['revenue','2','Aprenda faturamento',hasRevenue,'Registre vendas corretamente e não confunda venda com recebimento.'],
    ['variableCosts','3','Classifique custos',hasExpense,'Descubra quanto custa realmente vender.'],
    ['contribution','4','Entenda sua margem',ctx.revenue>0,'Saiba quanto cada R$ 100 vendidos deixa para pagar a estrutura.'],
    ['cashProjection','5','Controle o caixa',hasRevenue||hasExpense||num(ctx.cash)!==0,'Antecipe falta de dinheiro antes do vencimento.'],
    ['workingCapital','6','Entenda capital de giro',num(ctx.cash)!==0||num(ctx.receivable)>0||num(ctx.payable)>0,'Saiba quanto de folga a operação precisa entre pagar e receber.'],
    ['breakEven','7','Saiba o mínimo para empatar',num(ctx.breakEven)>0,'Descubra quanto precisa faturar só para não perder dinheiro.'],
    ['pricing','8','Precifique do jeito certo',hasProducts,'Custo, taxas, impostos, comissão, margem e preço mínimo.'],
    ['proLabore','9','Defina pró-labore',(st.fixed||[]).some(x=>x.cat==='Pró-labore')||(st.transactions||[]).some(x=>x.cat==='Pró-labore'),'Separe remuneração do sócio do lucro e das retiradas.']
  ];
  const done=steps.filter(x=>x[3]).length;
  return h('section.card.company-learning-hub',
    h('div.company-learning-head',h('div',h('span.eyebrow-soft','BIVVO ESCOLA DO EMPREENDEDOR'),h('h2','Aprenda a administrar enquanto usa o app'),h('p','Você não precisa saber gestão antes de começar. O Bivvo explica o que cada número significa, como calcular e qual decisão ele ajuda a tomar.')),h('div.company-learning-progress',h('b',`${done}/${steps.length}`),h('small','fundamentos com dados'))),
    h('div.company-learning-steps',steps.map(([key,n,title,complete,text])=>h('button.company-learning-step'+(complete?'.done':''),{type:'button',onclick:()=>openBusinessLesson(key,ctx)},h('span',complete?'✓':n),h('div',h('b',title),h('small',text)),h('em',importanceBadge(key)),h('i','›')))),
    h('p.company-learning-tip','Dica: comece pelos itens marcados como Essencial. EBITDA, indicadores compostos e análises avançadas vêm depois que faturamento, margem e caixa estiverem bem registrados.'));
}
function beginnerTask(n,title,text,fn){
  return h('button.company-beginner-task',{type:'button',onclick:fn},h('span',n),h('div',h('b',title),h('small',text)),h('i','Aprender ›'));
}
function businessKpi(label,value,sub,icon,tone='',lessonKey='',lessonContext={}){
  const open=lessonKey?()=>openBusinessLesson(lessonKey,lessonContext):null;
  const signal=tone==='good'?['🟢','Saudável']:tone==='warn'?['🟡','Atenção']:tone==='bad'?['🔴','Risco']:['⚪','Acompanhe'];
  return h('article.company-kpi.company-edu-kpi'+(tone?'.'+tone:''),{tabindex:open?'0':null,role:open?'button':null,onclick:e=>{if(!open||e.target.closest('button'))return;open();},onkeydown:e=>{if(open&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}}},
    h('div.company-kpi-top',h('span',icon),h('small',label),lessonKey?lessonButton(lessonKey,lessonContext,'?'):null),
    h('strong',typeof value==='number'?money0(value):value),
    h('span',sub),
    h('div.company-kpi-signal',{class:tone||'neutral'},h('span',signal[0]),h('b',signal[1])),
    lessonKey?h('footer',importanceBadge(lessonKey),h('small',cadenceText(lessonKey))):null
  );
}

function businessMentorCard({dre,fixedOpex,box,cashProjection,receivableTotal,payableTotal,overdueReceivable,overduePayable,revenueDelta,expenseDelta}){
  const items=[];
  if(dre.revenue<=0)items.push(['🟡','Comece registrando vendas','Sem faturamento registrado o Bivvo não consegue calcular margem, ponto de equilíbrio ou lucro.','revenue']);
  else if(dre.contributionMargin<.12)items.push(['🔴','Margem muito apertada',`Sua margem de contribuição está em ${(dre.contributionMargin*100).toFixed(1).replace('.',',')}%. Revise preço, fornecedor, taxa, imposto e comissão antes de buscar mais volume.`,'contribution']);
  else if(dre.contributionMargin<.25)items.push(['🟡','Margem merece atenção',`A margem está em ${(dre.contributionMargin*100).toFixed(1).replace('.',',')}%. Faça testes de preço e custo para criar mais folga.`,'contribution']);
  else items.push(['🟢','Margem com boa folga',`A margem está em ${(dre.contributionMargin*100).toFixed(1).replace('.',',')}%. Agora confirme se a estrutura fixa e o caixa também estão saudáveis.`,'contribution']);
  if(dre.breakEven>0)items.push([dre.revenue>=dre.breakEven?'🟢':'🟡',dre.revenue>=dre.breakEven?'Acima do ponto de equilíbrio':'Abaixo do ponto de equilíbrio',`O ponto de equilíbrio estimado é ${money0(dre.breakEven)}. O faturamento do recorte está em ${money0(dre.revenue)}.`,'breakEven']);
  if(cashProjection<0)items.push(['🔴','Caixa futuro negativo',`A projeção em 45 dias é ${money0(cashProjection)}. Aja antes: cobre clientes, negocie vencimentos e segure gastos não essenciais.`,'cashProjection']);
  else if(payableTotal>box+receivableTotal)items.push(['🟡','Capital de giro apertado',`Há ${money0(payableTotal)} a pagar contra ${money0(box)} em caixa e ${money0(receivableTotal)} a receber. Datas de vencimento importam.`,'workingCapital']);
  else items.push(['🟢','Caixa futuro sob controle',`A projeção cadastrada termina em ${money0(cashProjection)}. Continue atualizando recebimentos e pagamentos.`,'cashProjection']);
  if(overdueReceivable.length)items.push(['🟡','Cobrança precisa de rotina',`${overdueReceivable.length} recebimento(s) estão vencidos. Faturamento só vira caixa quando o cliente paga.`,'receivable']);
  if(overduePayable.length)items.push(['🔴','Há contas vencidas',`${overduePayable.length} compromisso(s) precisam ser regularizados ou renegociados.`,'payable']);
  if(revenueDelta>0&&expenseDelta>revenueDelta)items.push(['🟡','Despesas estão crescendo mais que vendas',`Receita variou ${Math.round(revenueDelta)}%, mas despesas variaram ${Math.round(expenseDelta)}%. Crescer faturamento sem controlar custo pode piorar o resultado.`,'costMix']);
  return h('section.card.company-mentor-card',h('div.company-mentor-head',h('span','🧠'),h('div',h('small','BIVVO MENTOR'),h('h3','O que seus números estão tentando te dizer'),h('p','Não precisa interpretar tudo sozinho. O Bivvo destaca o que merece atenção e explica o porquê.'))),h('div.company-mentor-list',items.slice(0,4).map(([signal,title,text,key])=>h('button.company-mentor-item',{type:'button',onclick:()=>openBusinessLesson(key,{revenue:dre.revenue,variableCosts:dre.variableCosts,contribution:dre.contribution,contributionMargin:dre.contributionMargin,fixedExpenses:fixedOpex,netProfit:dre.netProfit,cash:box,projectedCash:cashProjection,receivable:receivableTotal,payable:payableTotal,breakEven:dre.breakEven})},h('span',signal),h('div',h('b',title),h('small',text)),h('i','Entender ›')))));
}
function quick(icon,title,sub,fn,tone=''){
  return h('button.company-action'+(tone?'.'+tone:''),{type:'button',onclick:fn},h('span',icon),h('span',h('b',title),h('small',sub)));
}
function queueCard(title,rows,empty,add,label){
  const visible=rows.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
  const body=visible.length
    ?h('div.company-queue-list',visible.map(x=>h('button.company-queue-row',{type:'button',onclick:x.open},h('span',h('b',x.label),h('small',`${x.cat||label} · ${x.date<today()?'Vencido '+shortDate(x.date):'vence '+shortDate(x.date)}`)),h('strong',money(x.value)))))
    :h('p.muted.sm',empty);
  const key=title.includes('receber')?'receivable':title.includes('pagar')?'payable':'';
  return h('section.card.company-queue',
    h('div.card-head',h('div',h('h3',title),key?h('small.muted',key==='receivable'?'Dinheiro vendido que ainda precisa entrar no caixa.':'Compromissos que já consomem o caixa futuro.'):null),h('div.btn-row',key?lessonButton(key,{},'? Entenda'):null,h('button.link.sm',{type:'button',onclick:add},'+ Adicionar'))),body);
}
function decision(label,value,text,tone){
  return h('div.company-decision',h('div',h('small',label),h('b',{class:tone},value)),h('p',text));
}
