/* Bivvo — Planos: orçamento, metas, desafios, contas fixas e investimentos. */
import { h, money, money0, today, ymOf, monthName, monthLabel, diffDays, addMonthsYM, parseMoney, round2, shortDate, num, uid } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { CHALLENGES, challengeDef, challengeProgress, startChallenge } from '../insights.js';
import { emptyState, sectionTitle, progress, segmented, openSheet, toast, catIcon, field, confirmSheet } from '../ui.js';
import { stat } from './components.js';
import { openBudgetForm, openGoalForm, openGoalMove, openFixedForm, openInvestmentForm, refreshQuotes, moneyInput } from './forms.js';
import { monthSwitcher } from './extrato.js';
import { ctx, rerender,go } from '../nav.js';
import { openStoryComposer } from './stories.js';
import { donut } from '../charts.js';
import {renderCalendar} from './calendar.js';
import * as CM from '../company-metrics.js';
import {openBusinessLesson,lessonButton,importanceBadge,cadenceText,fieldHelpButton,openBusinessSimulator} from './company-education.js';

let tab = 'agenda';
const TABS=[{value:'agenda',label:'Agenda de contas'},{value:'fixas',label:'Contas recorrentes'},{value:'orcamento',label:'Orçamento'},{value:'metas',label:'Metas e investimentos'},{value:'desafios',label:'Desafios'}];
export function renderPlans(root){
  if(store.activeFinanceProfile()==='company'){renderCompanyPlans(root);return;}
  const requested=ctx.params.tab,alias={assinaturas:'fixas',investimentos:'metas'};
  if(requested){const selected=alias[requested]||requested;if(TABS.some(t=>t.value===selected))tab=selected;ctx.params.tab=null;}
  const body=h('div.plans-body');
  const paint=()=>{body.replaceChildren();({agenda:renderCalendar,orcamento:budget,metas:savings,desafios:challenges,fixas:recurring})[tab](body);};
  const bar=segmented(TABS,tab,value=>{tab=value;paint();bar.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},'planning-tabs');
  bar.setAttribute('aria-label','Seções do planejamento');
  root.append(bar,h('p.planning-bar-hint','Deslize a barra para ver todas as opções.'),body);paint();
}

let recurringFilter='all';
function recurring(root){
  const s=store.getState(), company=store.activeFinanceProfile()==='company', isSub=f=>f.type!=='income'&&['Assinaturas','Streaming'].includes(f.cat);
  if(company){companyRecurring(root,s);return;}
  const expenses=s.fixed.filter(f=>f.type!=='income'), legacy=(s.subscriptions||[]).filter(x=>x&&x.active!==false);
  const monthly=x=>x.rec==='Anual'?num(x.value)/12:num(x.value);
  const total=round2(expenses.reduce((v,x)=>v+monthly(x),0)+legacy.reduce((v,x)=>v+monthly(x),0));
  root.append(h('div.page-head',h('div',h('h2.h2','Contas recorrentes'),h('p.muted','Todas as suas contas que se repetem.')),h('button.btn.sm.primary',{type:'button',onclick:()=>openFixedForm()},'Nova conta')),
    h('div.stats.card.flat',stat('Contas por mês',money0(total)),stat('Assinaturas por mês',money0(expenses.filter(isSub).reduce((v,x)=>v+monthly(x),0)+legacy.reduce((v,x)=>v+monthly(x),0)))));
  const list=h('div.recurring-list');
  const paint=()=>{list.replaceChildren();const records=s.fixed.filter(f=>recurringFilter==='all'||(recurringFilter==='subscriptions'?isSub(f):!isSub(f)));
    const row=f=>h('button.tx',{type:'button',onclick:()=>openFixedForm(f)},h('span.tx-ico',{'aria-hidden':'true'},catIcon(f.cat)),h('span.tx-main',h('b',f.name),h('small',`${f.due?'Dia '+f.due:'Sem dia definido'} · ${f.rec==='Anual'?'Anual':'Mensal'} · ${isSub(f)?'Assinatura':f.type==='income'?'Receita':'Conta fixa'}`)),h('span.tx-side',h('b.tx-val'+(f.type==='income'?'.in':''),(f.type==='income'?'+ ':'')+money(f.value))));
    const inc=records.filter(f=>f.type==='income'),exp=records.filter(f=>f.type!=='income').sort((a,b)=>num(a.due)-num(b.due));
    if(exp.length)list.append(h('section.card',sectionTitle('Contas'),h('div.list',exp.map(row))));
    if(recurringFilter!=='fixed'&&legacy.length)list.append(h('section.card',sectionTitle('Outras assinaturas'),h('div.list',legacy.map(x=>h('div.tx',h('span.tx-ico',{'aria-hidden':'true'},'↻'),h('span.tx-main',h('b',x.name||'Assinatura'),h('small',x.rec==='Anual'?'Cobrança anual':'Cobrança mensal')),h('span.tx-side',h('b.tx-val',money(x.value))))))));
    if(inc.length)list.append(h('section.card',sectionTitle('Receitas recorrentes'),h('div.list',inc.map(row))));
    if(!list.childElementCount)list.append(h('div.empty',h('b','Nenhuma conta neste filtro.'),h('p','Cadastre uma conta ou escolha outro filtro.')));
  };
  root.append(segmented([{value:'all',label:'Todas'},{value:'fixed',label:'Contas fixas'},{value:'subscriptions',label:'Assinaturas'}],recurringFilter,v=>{recurringFilter=v;paint();}),list);paint();
}
let savingsView='goals';
function savings(root){
  const s=store.getState(),w=F.wealth(s);
  root.append(h('div.page-head',h('div',h('h2.h2','Metas e investimentos'),h('p.muted','Veja seus objetivos e seu dinheiro acumulado.'))),h('div.stats.card.flat',stat('Total acumulado',money0(w.total)),stat('Guardado em metas',money0(w.goals)),stat('Investido',money0(w.investments))));
  const content=h('div.savings-detail');
  const paint=()=>{content.replaceChildren();const host=h('div.'+(savingsView==='goals'?'savings-goals':'savings-investments'));(savingsView==='goals'?goals:investments)(host);content.append(host);};
  const toggle=segmented([{value:'goals',label:'Metas'},{value:'investments',label:'Investimentos'}],savingsView,v=>{savingsView=v;paint();},'savings-tabs');toggle.setAttribute('aria-label','Visualização de metas e investimentos');
  const summary=root.querySelector('.stats');if(summary)summary.before(toggle);else root.append(toggle);root.append(content);paint();
}

/* ---------------- orçamento ---------------- */
const BUDGET_ESSENTIAL = new Set(['Moradia','Mercado','Alimentação','Transporte','Combustível','Energia','Água','Gás','Internet','Telefone','Saúde','Educação','Seguros','Filhos']);
const BUDGET_FLEX = new Set(['Delivery','Restaurantes','Lazer','Assinaturas','Streaming','Compras','Roupas','Beleza','Eletrônicos','Viagens','Presentes e doações']);

function budgetCategoryAdvice(cat, s=store.getState()) {
  const avgRow=F.suggestBudgets(s).find(x=>x.cat===cat);
  const avg=avgRow?.value||0;
  const essential=BUDGET_ESSENTIAL.has(cat), flexible=BUDGET_FLEX.has(cat);
  let how='Comece pelo que você realmente gastou nos últimos meses e escolha um valor que consiga cumprir.';
  let why='Um limite realista ajuda a perceber cedo quando essa categoria está consumindo mais do que deveria.';
  if(essential) how='Use contas, contratos e sua média real. Em gasto essencial, prefira um valor realista com pequena margem para variação em vez de um teto artificialmente baixo.';
  else if(flexible) how='Olhe a média dos últimos 3 meses e decida conscientemente quanto quer permitir. Se precisa liberar renda, reduza aos poucos até chegar a um valor sustentável.';
  if(cat==='Mercado') how='Some as compras de mercado dos últimos 3 meses, faça a média e divida por 4,3 para enxergar um teto semanal. Ajuste por tamanho da casa e rotina.';
  if(cat==='Moradia') how='Inclua aluguel ou financiamento, condomínio e despesas obrigatórias ligadas à moradia. Não reduza no papel um valor que já é contratual.';
  if(cat==='Transporte'||cat==='Combustível') how='Use deslocamentos necessários primeiro. Some combustível, passagem, aplicativos, estacionamento e pedágio que realmente se repetem.';
  if(cat==='Lazer') how='Defina depois de proteger essenciais e a meta de guardar. O valor deve caber na renda restante sem depender do cartão para fechar o mês.';
  if(cat==='Dívidas e empréstimos') how='Use as parcelas e acordos que vencem no mês. Dívida já assumida vem antes de novos gastos discricionários.';
  return {avg,essential,flexible,how,why};
}

function openBudgetCategoryLesson(cat) {
  const s=store.getState(), a=budgetCategoryAdvice(cat,s), plan=F.budgetPlan(ctx.month,s);
  const content=[
    h('div.budget-lesson',
      h('span.budget-lesson-icon',{'aria-hidden':'true'},catIcon(cat)),
      h('div',h('h3',cat),h('p.muted',a.essential?'Categoria essencial':a.flexible?'Categoria flexível':'Categoria pessoal'))),
    h('div.edu-grid',
      h('article',h('b','Como escolher o valor'),h('p',a.how)),
      h('article',h('b','Por que isso importa'),h('p',a.why))),
    a.avg>0?h('div.important',h('b','Sua referência'),h('p',`Pelos meses anteriores, uma referência inicial para ${cat} é cerca de ${money0(a.avg)}. Não é uma regra: ajuste para a sua realidade.`)):h('div.important',h('b','Ainda sem histórico suficiente'),h('p','Use um valor que você conhece hoje. Depois de 2 ou 3 meses, revise com base no que realmente aconteceu.')),
    h('p.hint',`Seu orçamento usa ${money0(plan.income)} de ${plan.incomeLabel}. A meta de guardar já ocupa ${money0(plan.savingTarget)} antes das categorias.`)
  ];
  openSheet({title:`Como definir ${cat}`,content});
}

function openBudgetEducation() {
  let step=0; const host=h('div.budget-wizard');
  const sheet=openSheet({title:'Monte seu orçamento passo a passo',wide:true,content:host});
  const paint=()=>{
    const s=store.getState(), plan=F.budgetPlan(ctx.month,s), sug=F.suggestBudgets(s), top=sug.slice(0,5);
    host.replaceChildren();
    host.append(h('div.wizard-progress',...[0,1,2,3].map(i=>h('i'+(i<=step?'.on':'')))),h('p.muted.sm',`Passo ${step+1} de 4`));
    if(step===0){
      host.append(h('h2.h2','1. Comece pela renda que realmente existe'),
        h('p','O orçamento não começa pelo cartão nem pelo que você gostaria de gastar. Ele começa pelo dinheiro que normalmente entra no mês.'),
        h('div.budget-wizard-number',h('span','Renda usada no planejamento'),h('strong',money0(plan.income)),h('small',plan.incomeLabel)),
        plan.income<=0?h('div.important.bad',h('b','Cadastre sua renda primeiro'),h('p','Sem uma renda de referência, o Bivvo não consegue impedir que o orçamento passe do que você ganha. Cadastre um salário ou outra renda recorrente em Contas recorrentes.')):null,
        h('div.edu-grid',h('article',h('b','Renda fixa'),h('p','Use salário e outras entradas recorrentes que você espera receber de verdade.')),h('article',h('b','Renda variável'),h('p','Prefira uma referência conservadora. Não planeje gastos contando com um extra que ainda não aconteceu.'))));
    }else if(step===1){
      const choices=[5,10,15,20];
      host.append(h('h2.h2','2. Reserve a meta de guardar antes dos extras'),h('p','A meta faz parte do orçamento. Quando você escolhe guardar uma parte da renda, esse dinheiro deixa de estar disponível para outras categorias.'),
        h('div.save-choice-grid',choices.map(v=>h('button.save-choice'+(Number(s.savingPlan.percent)===v?'.on':''),{type:'button',onclick:()=>{
          const categoryTotal=Object.values(s.budget_limits||{}).reduce((a,b)=>a+num(b),0), target=round2(plan.income*v/100);
          if(plan.income>0&&categoryTotal+target>plan.income+.004)return toast(`Com ${v}%, seu plano passaria da renda. Reduza categorias primeiro.`);
          store.commit(st=>{st.savingPlan.percent=v;},{reason:'budget-guide-saving'});paint();
        }},h('b',`${v}%`),h('span',money0(plan.income*v/100))))),
        h('p.hint','Não existe percentual mágico. Escolha um valor que caiba sem atrasar contas. Consistência vale mais do que uma meta impossível.'));
    }else if(step===2){
      host.append(h('h2.h2','3. Dê um teto realista para cada categoria'),h('p','Comece pelos gastos essenciais e depois distribua o restante entre categorias flexíveis. O histórico serve como ponto de partida, não como ordem.'),
        top.length ? h('div.budget-suggestion-list', top.map(x =>
          h('button.budget-suggestion',{type:'button',onclick:()=>openBudgetCategoryLesson(x.cat)},
            h('span',h('i',{'aria-hidden':'true'},catIcon(x.cat)),h('b',x.cat)),
            h('span',h('small','Referência pela sua média'),h('strong',money0(x.value)))
          )
        )) : h('div.important',h('b','Sem histórico suficiente'),h('p','Cadastre limites com os valores que você conhece hoje. O Bivvo melhora as referências conforme seus meses ficam completos.')),
        h('div.edu-grid',h('article',h('b','Essenciais primeiro'),h('p','Moradia, alimentação, transporte, saúde e compromissos já assumidos precisam caber antes dos extras.')),h('article',h('b','Flexíveis depois'),h('p','Lazer, delivery, compras e similares são onde normalmente existe mais espaço para ajuste.'))));
    }else{
      const tone=plan.remaining<0?'bad':plan.remaining<plan.income*.05?'warn':'good';
      host.append(h('h2.h2','4. Confira se o plano fecha'),h('p','A conta final precisa caber dentro da renda. Se não fechar no planejamento, dificilmente fechará na vida real.'),
        h('div.budget-plan-summary',
          h('div',h('span','Renda planejada'),h('b',money0(plan.income))),
          h('div',h('span','Meta de guardar'),h('b',`− ${money0(plan.savingTarget)}`)),
          h('div',h('span','Categorias'),h('b',`− ${money0(plan.categoryLimits)}`)),
          h('div.budget-plan-result.'+tone,h('span',plan.remaining>=0?'Ainda disponível':'Acima da renda'),h('strong',money0(Math.abs(plan.remaining))))),
        plan.remaining>0?h('p.hint','Você não precisa distribuir cada real. Deixar uma margem para imprevistos costuma tornar o orçamento mais resistente.'):plan.remaining<0?h('div.important.bad',h('b','Seu plano não fecha'),h('p',`Reduza pelo menos ${money0(-plan.remaining)} entre categorias ou meta de guardar.`)):h('p.hint','Seu plano usa 100% da renda. Considere deixar alguma margem para imprevistos.'));
    }
    const controls=h('div.wizard-actions',step>0?h('button.btn',{type:'button',onclick:()=>{step--;paint();}},'Voltar'):h('span'),step<3?h('button.btn.primary',{type:'button',disabled:step===0&&plan.income<=0,onclick:()=>{step++;paint();}},'Continuar'):h('button.btn.primary',{type:'button',onclick:()=>{sheet.close();openBudgetForm();}},'Definir minhas categorias'));
    host.append(controls);
  };
  paint();
}

function budget(root) {
  const s = store.getState(), ym = ctx.month, sm = F.monthSummary(ym, s), plan=F.budgetPlan(ym,s), consumption=F.budgetConsumption(ym,s);
  const rows = F.budgetRows(ym, s);
  const target = plan.savingTarget;
  const totalBudget = round2(plan.categoryLimits + target);
  const totalSpent = round2(consumption.total);
  const cardSpent = round2(consumption.card);
  const otherSpent = round2(consumption.other);
  const savedTowardTarget = round2(Math.min(Math.max(0, num(sm.saved)), Math.max(0, target)));
  const totalConsumed = round2(totalSpent + savedTowardTarget);
  const totalRemaining = round2(Math.max(0, totalBudget - totalConsumed));
  const totalOver = round2(Math.max(0, totalConsumed - totalBudget));
  const totalRatio = totalBudget > 0 ? totalConsumed / totalBudget : 0;
  const totalTone = totalRatio > 1 ? 'bad' : totalRatio >= .9 ? 'warn' : 'good';
  const pctInput = h('input.input.sm.pct-input', { type: 'number', inputmode: 'decimal', min: 0, max: 100, step: 1, value: s.savingPlan.percent, 'aria-label': 'Percentual da renda para guardar' });
  pctInput.addEventListener('change', () => {
    const v = Math.min(100, Math.max(0, num(pctInput.value))), candidate=round2(plan.income*v/100), total=plan.categoryLimits+candidate;
    if(plan.income<=0&&v>0){pctInput.value=s.savingPlan.percent;return toast('Cadastre uma renda antes de definir a meta de guardar.');}
    if(total>plan.income+.004){pctInput.value=s.savingPlan.percent;return toast(`Esse plano ultrapassaria sua renda em ${money0(total-plan.income)}. Reduza categorias ou a meta.`);}
    store.commit(st => { st.savingPlan.percent = v; },{reason:'budget-saving-percent'}); toast(`Meta de guardar: ${v}% da renda`);rerender();
  });
  root.append(h('div.page-head', monthSwitcher(rerender)));
  root.append(h('section.card.budget-learning-callout',
    h('div',h('span.eyebrow','ORÇAMENTO GUIADO'),h('h3','Aprenda a montar um orçamento que cabe na sua renda'),h('p','O Bivvo usa sua renda, reserva a meta de guardar e ensina como escolher o limite de cada categoria.')),
    h('button.btn.primary',{type:'button',onclick:openBudgetEducation},'Montar passo a passo')));

  root.append(h('section.card.budget-income-plan',
    h('div.card-head',h('h3','Seu plano do mês'),h('small.muted',plan.incomeLabel)),
    h('div.budget-plan-summary',
      h('div',h('span','Receita para planejar'),h('b',money0(plan.income))),
      h('div',h('span','Meta de guardar'),h('b',money0(plan.savingTarget))),
      h('div',h('span','Categorias planejadas'),h('b',money0(plan.categoryLimits))),
      h('div.budget-plan-result.'+(plan.remaining<0?'bad':plan.remaining<plan.income*.05?'warn':'good'),h('span',plan.remaining>=0?'Ainda disponível':'Acima da receita'),h('strong',money0(Math.abs(plan.remaining))))),
    plan.income>0?h('p.hint',`${Math.round(plan.ratio*100)}% da renda já tem destino. Meta de guardar + categorias nunca podem passar de ${money0(plan.income)}.`):h('p.hint','Cadastre um salário ou renda recorrente para o Bivvo proteger seu orçamento.')));

  root.append(h('section.card.budget-total-overview',
    h('div.card-head',
      h('div',h('span.eyebrow','VISÃO GERAL'),h('h3','Orçamento total do mês')),
      h('small.muted',monthName(ym))),
    h('div.budget-total-kpis',
      h('div.budget-total-kpi',h('span','Orçamento total'),h('strong',money0(totalBudget)),h('small','Categorias + meta de guardar')),
      h('div.budget-total-kpi',h('span','Já consumido'),h('strong',money0(totalConsumed)),h('small',`${money0(totalSpent)} em gastos + ${money0(savedTowardTarget)} guardados`)),
      h('div.budget-total-kpi',h('span','Compras no cartão'),h('strong',money0(cardSpent)),h('small','Já contam no orçamento, mesmo antes de pagar a fatura')),
      h('div.budget-total-kpi',h('span','Outros gastos'),h('strong',money0(otherSpent)),h('small','Pix, débito, dinheiro e demais formas')),
      h('div.budget-total-kpi.'+totalTone,h('span',totalOver>0?'Acima do orçamento':'Ainda disponível'),h('strong',money0(totalOver>0?totalOver:totalRemaining)),h('small',totalOver>0?'Revise categorias ou reduza gastos':'Quanto ainda falta realizar do plano'))),
    h('div.budget-total-progress',
      progress(totalConsumed,totalBudget,totalTone),
      h('div.budget-total-progress-text',h('b',`${Math.round(totalRatio*100)}% consumido`),h('span.muted',totalOver>0?`Você passou ${money0(totalOver)} do total planejado.`:`Restam ${money0(totalRemaining)} do orçamento total.`))),
    h('p.hint','O total inclui os limites das categorias e a sua meta de guardar. “Já consumido” soma os gastos reais do mês com o valor que você realmente guardou até a meta.'),
    h('p.hint','Compra efetivada no cartão consome o orçamento na data da compra/parcela. Quando a fatura for paga, esse pagamento não entra de novo no orçamento.')));

  root.append(h('section.card.save-plan',
    h('div.card-head', h('h3', 'Meta de guardar'), h('label.inline', pctInput, h('span', '% da renda'))),
    h('div.stats', stat('Meta do mês', money0(target)), stat('Guardado de verdade', money0(sm.saved), null, sm.saved >= target && target > 0 ? 'in' : ''), stat('Falta guardar', money0(Math.max(0, target - sm.saved)))),
    progress(sm.saved, target, 'good'),
    h('p.hint', 'A meta ocupa espaço no orçamento desde o início, mas só conta como “guardado” quando o dinheiro realmente vai para uma meta, reserva ou investimento.')));

  if (!rows.length) {
    const sug = F.suggestBudgets(s);
    root.append(emptyState({ icon: '🎯', title: 'Agora distribua a renda entre suas categorias', text: sug.length ? `Pela sua média, ${sug[0].cat} gira em torno de ${money0(sug[0].value)} por mês. Use isso como referência e ajuste para sua realidade.` : 'Comece pelos essenciais. Depois distribua o que restar entre categorias flexíveis, sempre respeitando sua receita.', action: { label: 'Definir limites', fn: openBudgetForm } }));
    return;
  }
  const totalLimit = rows.reduce((a, r) => a + r.limit, 0), categorySpent = rows.reduce((a, r) => a + r.spent, 0);
  const [y, m] = ym.split('-').map(Number), dim = new Date(y, m, 0).getDate();
  const day = ym === ymOf(today()) ? Number(today().slice(8)) : ym < ymOf(today()) ? dim : 0;
  root.append(h('section.card',
    h('div.card-head', h('h3', 'Limites de ' + monthName(ym)), h('button.link.sm', { type: 'button', onclick: openBudgetForm }, 'Editar')),
    h('p.muted.sm', `${money0(categorySpent)} de ${money0(totalLimit)} usados · ${Math.round(day / dim * 100)}% do mês passou`),
    h('div.budget-list', rows.map(r => {
      const tone = r.unbudgeted ? 'bad' : r.ratio >= 1 ? 'bad' : r.ratio >= 0.8 ? 'warn' : 'good';
      const paceAhead = !r.unbudgeted && day > 0 && day < dim && r.ratio > day / dim + 0.15;
      return h('div.brow'+(r.unbudgeted?'.unbudgeted':''),
        h('div.brow-top', h('span', h('i', { 'aria-hidden': 'true' }, catIcon(r.cat)), r.cat,h('button.budget-help',{type:'button','aria-label':`Como escolher o limite de ${r.cat}`,onclick:()=>openBudgetCategoryLesson(r.cat)},'?')), h('b', r.unbudgeted ? `${money0(r.spent)} · sem limite` : `${money0(r.spent)} / ${money0(r.limit)}`)),
        r.unbudgeted ? progress(r.spent, Math.max(r.spent, .01), 'bad') : progress(r.spent, r.limit, tone),
        h('small.muted', r.unbudgeted ? `Esse gasto já consumiu seu orçamento, mas ${r.cat} ainda não tem limite definido.` : (r.left >= 0 ? `${money0(r.left)} disponível${paceAhead ? ' · ritmo acima do mês' : ''}` : `${money0(-r.left)} acima do limite`)));
    }))));
}

/* ---------------- metas ---------------- */
function goals(root) {
  const s = store.getState();
  root.append(h('div.page-head', h('h2.h2', 'Seus objetivos'), h('button.btn.sm.primary', { type: 'button', onclick: () => openGoalForm() }, 'Nova meta')));
  if (!s.goals.length) {
    root.append(emptyState({ icon: '🛡️', title: 'Comece pela reserva de emergência', text: 'É o dinheiro que segura imprevistos. A referência comum é de 3 a 6 meses dos seus gastos.', action: { label: 'Criar reserva', fn: () => openGoalForm(null, { name: 'Reserva de emergência', emoji: '🛡️', isReserve: true, target: Math.round(F.avgMonthlySpend(3, s) * 3 / 100) * 100 || null }) } }));
    return;
  }
  const avg = F.avgMonthlySpend(3, s);
  const list = s.goals.slice().sort((a, b) => (b.isReserve ? 1 : 0) - (a.isReserve ? 1 : 0));
  root.append(h('div.goals', list.map(g => {
    const linked=s.investments.filter(x=>x.goalId===g.id),invested=linked.reduce((v,x)=>v+F.investmentValue(x,s),0), accumulated=round2(g.saved+invested);
    const ratio = g.target ? accumulated / g.target : 0, done = ratio >= 1;
    let plan = null;
    if (!done && g.date) { const months = Math.max(1, Math.ceil(diffDays(today(), g.date) / 30.4)); plan = `Guardando ${money0((g.target - accumulated) / months)} por mês você chega lá até ${shortDate(g.date)}.`; }
    if (g.isReserve && avg > 0) plan = `Cobre ${(g.saved / avg).toFixed(1).replace('.', ',')} ${g.saved / avg >= 1.95 ? 'meses' : 'mês'} dos seus gastos.` + (plan ? ' ' + plan : '');
    return h('section.card.goal' + (done ? '.done' : ''),
      h('div.goal-top', h('span.goal-ico', { 'aria-hidden': 'true' }, g.emoji || (g.isReserve ? '🛡️' : '🫙')), h('div', h('h3', g.name), h('small.muted', g.isReserve ? 'Reserva de emergência' : g.date ? `Prazo ${shortDate(g.date)}` : 'Sem prazo')), h('button.link.sm', { type: 'button', onclick: () => openGoalForm(g) }, 'Editar')),
      h('div.goal-num', h('strong', money0(accumulated)), h('span.muted', ` de ${money0(g.target)}`), h('b.goal-pct', Math.round(ratio * 100) + '%')),
      progress(accumulated, g.target, 'good'),
      h('p.muted.sm',`${money0(g.saved)} guardados + ${money0(invested)} investidos`),
      h('p.muted.sm',done?'Meta alcançada!':`Faltam ${money0(Math.max(0,g.target-accumulated))} para sua meta.`),
      plan ? h('p.muted.sm', plan) : null,
      !done && g.target > accumulated ? h('p.hint', 'Cenários: ' + [100, 250, 500].map(v => { const m = Math.ceil((g.target - accumulated) / v); return `${money0(v)}/mês ≈ ${m} ${m === 1 ? 'mês' : 'meses'}`; }).join(' · ')) : null,
      h('div.btn-row', h('button.btn.sm.primary', { type: 'button', onclick: () => openGoalMove(g.id, 'in') }, 'Guardar'), g.saved > 0 ? h('button.btn.sm', { type: 'button', onclick: () => openGoalMove(g.id, 'out') }, 'Retirar') : null,
        ratio >= 0.25 ? h('button.btn.sm.ghost', { type: 'button', onclick: () => openStoryComposer({ template: 'goal', goalId: g.id }) }, 'Compartilhar progresso') : null));
  })));
}

/* ---------------- desafios ---------------- */
function challenges(root) {
  const s = store.getState();
  const active = s.challenges.filter(c => c.status === 'active');
  const doneList = s.challenges.filter(c => c.status === 'done').slice(-6).reverse();
  root.append(h('p.lede', 'Desafios curtos, medidos com os seus próprios lançamentos. Sem pontos falsos: só o que aconteceu de verdade.'));
  if (active.length) root.append(h('section.card', sectionTitle('Em andamento'), h('div.ch-list', active.map(ch => {
    const p = challengeProgress(ch, s), def = challengeDef(ch.type);
    return h('div.ch',
      h('div.ch-top', h('span.ch-ico', { 'aria-hidden': 'true' }, def.icon), h('div', h('b', def.title + (ch.cat ? ` · ${ch.cat}` : '')), h('small.muted', `${p.label} · termina ${shortDate(ch.endsAt)}`)),
        h('button.link.sm', { type: 'button', onclick: async () => { if (await confirmSheet({ title: 'Desistir do desafio?', message: 'Você pode começar outro quando quiser.', confirmLabel: 'Desistir' })) store.commit(st => { const x = st.challenges.find(c => c.id === ch.id); if (x) x.status = 'quit'; }); } }, 'Desistir')),
      progress(p.ratio, 1, p.invert ? (p.failed ? 'bad' : 'good') : 'good'),
      p.failed && !p.ended ? h('small.warn-text', 'Esse desafio não vai fechar desta vez. Tudo bem: tente de novo quando quiser.') : null);
  }))));
  const busy = new Set(active.map(c => c.type));
  root.append(h('section.card', sectionTitle('Começar um desafio'), h('div.ch-catalog', CHALLENGES.map(def => h('button.ch-pick', { type: 'button', disabled: busy.has(def.type), onclick: () => pickChallenge(def) },
    h('span.ch-ico', { 'aria-hidden': 'true' }, def.icon), h('span', h('b', def.title), h('small', busy.has(def.type) ? 'Em andamento' : def.text)))))));
  if (doneList.length) root.append(h('section.card', sectionTitle('Concluídos'), h('div.list', doneList.map(ch => { const def = challengeDef(ch.type); return h('div.ch-done', h('span', { 'aria-hidden': 'true' }, '🏆'), h('span', h('b', def?.title + (ch.cat ? ` · ${ch.cat}` : '')), h('small.muted', `Concluído em ${shortDate(ch.completedAt || ch.endsAt)}`)), h('button.btn.sm', { type: 'button', onclick: () => openStoryComposer({ template: 'challenge', challengeId: ch.id }) }, 'Compartilhar')); }))));
}
function pickChallenge(def) {
  const s = store.getState();
  const content = [h('p.sheet-text', def.text)];
  let value = null, cat = null, days = def.days;
  if (def.needsValue) { value = moneyInput(def.defaultValue, { label: 'Valor' }); content.push(field('Quanto', value)); }
  if (def.needsCat) {
    const sm = F.monthSummary(addMonthsYM(ymOf(today()), -1), s);
    const opts = (sm.cats.length ? sm.cats.map(c => c.cat) : store.categories('expense')).filter(c => !['Moradia', 'Investimentos'].includes(c));
    cat = h('select.input', opts.map(c => h('option', { value: c }, c)));
    if (opts.includes('Delivery')) cat.value = 'Delivery';
    content.push(field('Categoria', cat));
  }
  if (def.choosableDays) { const sel = h('select.input', def.choosableDays.map(d => h('option', { value: d }, `${d} dias`))); sel.value = String(def.days); sel.addEventListener('change', () => { days = Number(sel.value); }); content.push(field('Duração', sel)); }
  const sheet = openSheet({ title: def.title, content, footer: [h('button.btn.primary', { type: 'button', onclick: () => {
    store.commit(st => startChallenge(st, { type: def.type, value: value?.getValue(), cat: cat?.value, days }));
    sheet.close(); toast('Desafio começou hoje. Boa!');
  } }, 'Começar hoje')] });
}

/* ---------------- investimentos ---------------- */
function investments(root) {
  const s = store.getState(), w = F.wealth(s);
  root.append(h('div.page-head', h('h2.h2', 'Seus investimentos'), h('button.btn.sm.primary', { type: 'button', onclick: () => openInvestmentForm() }, 'Nova aplicação')));
  root.append(h('p.muted.sm',`Resultado dos investimentos: ${(w.result>=0?'+':'')+money0(w.result)}`));
  if (!s.investments.length) { root.append(emptyState({ icon: '💎', title: 'Nenhuma aplicação registrada', text: 'Registre CDBs, Tesouro, ações e fundos para acompanhar o patrimônio junto com o resto das suas finanças.', action: { label: 'Registrar aplicação', fn: () => openInvestmentForm() } })); return; }
  // Carteira por ativo: cada ticker/aplicação recebe sua própria fatia. Ativos com o mesmo nome são somados.
  const byAsset = new Map();
  for (const x of s.investments) {
    const key = String(x.name || x.type || 'Investimento').trim().toUpperCase();
    const value = F.investmentValue(x, s);
    const row = byAsset.get(key) || { label: key, value: 0, items: [] };
    row.value += value; row.items.push(x); byAsset.set(key, row);
  }
  const assets = [...byAsset.values()].filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const assetTotal = assets.reduce((a, b) => a + b.value, 0) || 1;
  const showAsset = picked => {
    const group = picked.items || [];
    const cost = group.reduce((a, x) => a + num(x.costBasis ?? x.value), 0);
    const current = group.reduce((a, x) => a + F.investmentValue(x, s), 0);
    const result = current - cost;
    const qtyTotal = group.reduce((a, x) => a + num(x.quantity), 0);
    const first = group[0] || {};
    const share = current / assetTotal * 100;
    const details = h('div.asset-pop',
      h('div.asset-pop-hero', h('strong', picked.label), h('span', `${share.toFixed(1).replace('.', ',')}% da carteira`)),
      h('div.stats.card.flat', stat('Valor atual', money0(current)), stat('Aplicado', money0(cost)), stat('Resultado', (result >= 0 ? '+' : '') + money0(result), null, result >= 0 ? 'in' : 'neg')),
      h('div.asset-detail-list',
        h('div', h('span', 'Tipo'), h('b', first.type || 'Investimento')),
        qtyTotal > 0 ? h('div', h('span', 'Quantidade'), h('b', String(round2(qtyTotal)).replace('.', ','))) : null,
        first.marketPrice ? h('div', h('span', 'Última cotação'), h('b', money(first.marketPrice))) : null,
        first.purchasePrice ? h('div', h('span', 'Preço médio registrado'), h('b', money(first.purchasePrice))) : null,
        first.yieldRate ? h('div', h('span', 'Rendimento'), h('b', `${String(first.yieldRate).replace('.', ',')}%${first.yieldType === 'Pós-fixado' ? ' do ' + (first.yieldIndex || 'CDI') : ' a.a.'}`)) : null,
        first.purchaseDate ? h('div', h('span', 'Primeira aplicação'), h('b', shortDate(first.purchaseDate))) : null
      ),
      h('p.hint', group.length > 1 ? `${group.length} registros de ${picked.label} foram somados nesta fatia.` : 'Toque em editar para alterar os dados deste investimento.')
    );
    const footer = group.length === 1 ? [h('button.btn.primary', { type: 'button', onclick: () => { sheet.close(); openInvestmentForm(group[0]); } }, 'Editar investimento')] : null;
    const sheet = openSheet({ title: 'Detalhes do ativo', subtitle: picked.label, content: details, footer });
  };
  root.append(h('section.card.asset-allocation-card',
    h('div.card-head', h('div', h('h3', 'Carteira por ativo'), h('p.hint', 'Cada fatia representa um ativo. Toque no gráfico ou na legenda para ver os detalhes.'))),
    donut(assets, { center: 'Carteira', onPick: showAsset }),
    h('div.asset-pie-legend', assets.map((x, i) => h('button', { type: 'button', onclick: () => showAsset(x), 'aria-label': `Abrir detalhes de ${x.label}` }, h('i', { class: `v${i % 6}` }), h('span', x.label), h('b', `${(x.value / assetTotal * 100).toFixed(1).replace('.', ',')}%`), h('small', money0(x.value)))))
  ));
  const cdi = h('input.input.sm.pct-input', { type: 'text', inputmode: 'decimal', value: String(s.cdiReference).replace('.', ','), 'aria-label': 'CDI de referência ao ano' });
  cdi.addEventListener('change', () => { const v = parseMoney(cdi.value); if (v > 0 && v < 50) { store.commit(st => { st.cdiReference = v; }); toast('CDI de referência atualizado'); } });
  root.append(h('section.card', h('div.card-head', h('h3', 'Carteira'), h('button.link.sm', { type: 'button', onclick: refreshQuotes }, 'Atualizar cotações')),
    h('div.list', s.investments.map(x => {
      const v = F.investmentValue(x, s), cost = num(x.costBasis ?? x.value), r = v - cost;
      return h('button.tx', { type: 'button', onclick: () => openInvestmentForm(x) }, h('span.tx-ico', { 'aria-hidden': 'true' }, '💎'),
        h('span.tx-main', h('b', x.name), h('small', [x.type, x.goalId&&s.goals.find(g=>g.id===x.goalId)?'Meta: '+s.goals.find(g=>g.id===x.goalId).name:'Sem meta definida', x.quantity ? `${x.quantity} cotas` : null, x.yieldRate ? `${String(x.yieldRate).replace('.', ',')}%${x.yieldType === 'Pós-fixado' ? ' do ' + (x.yieldIndex || 'CDI') : ' a.a.'}` : null].filter(Boolean).join(' · '))),
        h('span.tx-side', h('b.tx-val', money(v)), h('small.' + (r >= 0 ? 'up' : 'down'), (r >= 0 ? '+' : '') + money(r))));
    })),
    h('label.inline.hint', 'CDI de referência para estimar CDBs pós-fixados:', cdi, h('span', '% a.a.')),
    h('p.hint', 'Valores de renda fixa são estimativas antes de impostos. Ações e fundos usam a última cotação obtida.')));
}


/* ---------------- ambiente Empresa ---------------- */
let companyTab='guia';
const COMPANY_TABS=[{value:'guia',label:'Comece aqui'},{value:'simuladores',label:'Simuladores'},{value:'agenda',label:'Agenda financeira'},{value:'produtos',label:'Produtos e serviços'},{value:'fixas',label:'Recorrências'},{value:'custos',label:'Controle de custos'},{value:'indicadores',label:'Indicadores'}];
function renderCompanyPlans(root){
  const requested=ctx.params.tab;
  const aliases={guia:'guia',aprender:'guia',simular:'simuladores',simuladores:'simuladores',orcamento:'custos',fixas:'fixas',agenda:'agenda',indicadores:'indicadores',produtos:'produtos',precificacao:'produtos'};
  if(requested){const selected=aliases[requested]||requested;if(COMPANY_TABS.some(t=>t.value===selected))companyTab=selected;ctx.params.tab=null;}
  const body=h('div.plans-body.company-management');
  const paint=()=>{body.replaceChildren();({guia:companyGuide,simuladores:companySimulators,agenda:companyAgenda,produtos:companyProducts,fixas:recurring,custos:companyCosts,indicadores:companyIndicators})[companyTab](body);};
  const bar=segmented(COMPANY_TABS,companyTab,value=>{companyTab=value;paint();bar.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},'planning-tabs');
  bar.setAttribute('aria-label','Gestão financeira da empresa');
  root.append(h('div.company-management-head',h('span.eyebrow-soft','GESTÃO + APRENDIZADO'),h('h2','Aprenda a gerir o negócio enquanto usa o Bivvo'),h('p.muted','Cada área explica o que é, por que importa, como calcular, o jeito certo de fazer e os erros mais comuns. Comece pela aba “Comece aqui” se você é novo no empreendedorismo.')),bar,h('p.planning-bar-hint','Deslize a barra para ver todas as opções.'),body);paint();
 }
function companyGuide(root){
  const s=store.getState(),ym=ctx.month,rows=F.monthTx(ym,s).filter(t=>store.recordVisible(t,s));
  const fixed=companyMonthlyFixed(s),dre=CM.statement(rows,{periodMonths:1,monthlyFixedFallback:fixed}),cash=F.balance(s);
  const context={revenue:dre.revenue,variableCosts:dre.variableCosts,contribution:dre.contribution,contributionMargin:dre.contributionMargin,fixedExpenses:dre.fixedExpenses+dre.otherOpex,ebitda:dre.ebitdaApprox,netProfit:dre.netProfit,breakEven:dre.breakEven,cash};
  const lessons=[
    ['pfPj','🏦','Separe empresa e vida pessoal','Antes de qualquer conta, trate o dinheiro do negócio como uma coisa separada.'],
    ['revenue','💰','Entenda faturamento','Saiba quanto vendeu sem confundir venda com dinheiro recebido.'],
    ['variableCosts','📦','Descubra o custo de vender','Fornecedor não é o custo inteiro: frete, taxa, comissão e imposto também pesam.'],
    ['contribution','🧮','Aprenda margem de contribuição','Descubra quanto cada venda deixa para pagar a estrutura e gerar lucro.'],
    ['fixedOpex','🏢','Conheça sua estrutura fixa','Saiba quanto custa manter a empresa aberta mesmo sem vender.'],
    ['cashProjection','🔭','Controle fluxo de caixa','Veja quando o dinheiro entra e sai para não ser surpreendido.'],
    ['workingCapital','🛟','Entenda capital de giro','Aprenda por que uma empresa pode dar lucro e mesmo assim ficar sem dinheiro para operar.'],
    ['breakEven','🎯','Calcule o ponto de equilíbrio','Descubra quanto precisa faturar só para empatar.'],
    ['pricing','🏷️','Aprenda a formar preço','Preço certo considera custo real, taxas, margem e mercado.'],
    ['productProfit','📊','Saiba o que realmente dá dinheiro','O produto que mais vende pode não ser o que mais lucra.'],
    ['receivable','🤝','Aprenda a vender a prazo sem perder o controle','Venda feita não é dinheiro no banco. Organize clientes, vencimentos e cobranças.'],
    ['stock','📦','Entenda estoque e capital parado','Estoque demais prende caixa; estoque de menos perde venda. Aprenda a buscar equilíbrio.'],
    ['budget','🧭','Planeje antes de gastar','Use orçamento para decidir antes, acompanhar desvios e cortar com critério.'],
    ['target','🎯','Crie metas que façam sentido','Meta de faturamento precisa respeitar margem, capacidade e caixa.'],
    ['proLabore','👤','Defina pró-labore','Remunere o sócio sem usar o caixa da empresa como carteira pessoal.'],
    ['taxes','🧾','Planeje impostos','Separe dinheiro e vencimentos; regra tributária varia conforme regime.'],
    ['dre','📑','Leia uma DRE gerencial','Aprenda a sequência faturamento → custos → margem → despesas → resultado.']
  ];
  root.append(
    h('section.card.company-guide-hero',
      h('div',h('span.eyebrow-soft','COMECE AQUI'),h('h2','O Bivvo vai te ensinar a pensar como dono'),h('p','Não é um curso separado do aplicativo. Cada conceito abaixo abre uma explicação simples com o que é, por que importa, fórmula, exemplo usando seus dados, como saber se está bom, jeito certo de fazer, erros comuns e a próxima ação.')),
      h('div.company-guide-hero-side',h('b','Regra principal'),h('span','Primeiro entenda margem e caixa. Depois aprofunde os indicadores avançados.'))),
    h('section.company-guide-lessons',lessons.map(([key,icon,title,text],i)=>h('button.company-guide-lesson',{type:'button',onclick:()=>openBusinessLesson(key,context)},
      h('span.company-guide-index',String(i+1).padStart(2,'0')),h('span.company-guide-icon',icon),h('span.company-guide-copy',h('b',title),h('small',text),h('em',cadenceText(key))),importanceBadge(key),h('i','›')))),
    h('section.card.company-routine',sectionTitle('Rotina simples do dono'),
      h('div.company-routine-grid',
        routine('Todo dia','5 minutos',['Veja o caixa disponível','Registre vendas e pagamentos','Confira contas que vencem hoje']),
        routine('Toda semana','20 minutos',['Cobre atrasados','Olhe caixa projetado','Veja custos que subiram','Compare ritmo da meta']),
        routine('Todo mês','45 minutos',['Feche faturamento e margem','Revise custos fixos','Calcule ponto de equilíbrio','Veja lucro por produto','Separe impostos e pró-labore']))),
      h('p.hint','Se você fizer apenas essa rotina com dados bem registrados, já evita boa parte dos erros financeiros comuns de um negócio pequeno.')),
    h('section.card.company-learning-order',sectionTitle('O que é importante primeiro — e o que pode esperar'),
      h('div.company-priority-columns',
        h('div.essential',h('h3','Aprenda primeiro'),h('p','Faturamento, custo real, margem de contribuição, caixa, contas a pagar/receber, ponto de equilíbrio e pró-labore. Eles decidem se o negócio sobrevive.')),
        h('div.important',h('h3','Depois melhore'),h('p','Ticket médio, orçamento por categoria, receita por origem, giro de estoque, metas e lucro por produto. Eles ajudam a crescer com mais controle.')),
        h('div.advanced',h('h3','Aprofunde quando fizer sentido'),h('p','EBITDA, índices compostos e análises avançadas. São úteis, mas não devem esconder os fundamentos.'))));
}

function companySimulators(root){
  const s=store.getState(),ym=ctx.month,rows=F.monthTx(ym,s).filter(t=>store.recordVisible(t,s));
  const fixed=companyMonthlyFixed(s),dre=CM.statement(rows,{periodMonths:1,monthlyFixedFallback:fixed});
  const sample=(s.companyProducts||[])[0],pm=sample?CM.productMetrics(sample,fixed):null;
  const marginPct=dre.contributionMargin>0?dre.contributionMargin*100:20;
  const cards=[
    ['🏷️','Preço ideal','Calcule um preço que cubra custo, taxas e a margem desejada.','price',{cost:pm?.realCost||0,ratePct:sample?num(sample.cardFeePct)+num(sample.taxPct)+num(sample.commissionPct):0,marginPct:sample?.targetMarginPct||20},'pricing'],
    ['📈','Lucro por produto','Teste preço, custo, volume e descubra o impacto no mês.','profit',{price:pm?.sale||0,variableCost:pm?.variableCost||0,fixedAllocation:pm?.fixedAllocation||0,qty:sample?.soldQty||1},'productProfit'],
    ['🎯','Ponto de equilíbrio','Veja quanto precisa faturar apenas para pagar a estrutura.','breakeven',{fixed:dre.monthlyFixed,marginPct},'breakEven'],
    ['🏷️','Desconto sem destruir margem','Teste uma promoção antes de oferecer ao cliente.','discount',{price:pm?.sale||0,variableCost:pm?.variableCost||0,discountPct:10},'contribution'],
    ['🚀','Meta de faturamento','Transforme custos fixos + lucro desejado em uma meta com lógica.','target',{fixed:dre.monthlyFixed,profit:Math.max(0,dre.monthlyFixed*.2),marginPct},'target']
  ];
  root.append(
    h('section.card.company-simulators-hero',h('div',h('small.eyebrow-soft','LABORATÓRIO DO EMPREENDEDOR'),h('h2','Teste decisões antes de arriscar dinheiro real'),h('p','Os simuladores transformam fórmulas de gestão em perguntas simples. Altere os números, veja o impacto na hora e abra “Entenda” quando quiser aprender a lógica.')),h('span','🧪')),
    h('section.company-simulator-grid',cards.map(([icon,title,text,type,defaults,key])=>h('article.card.company-simulator-card',h('span',icon),h('div',h('h3',title),h('p',text)),h('div.btn-row',h('button.btn.sm.primary',{type:'button',onclick:()=>openBusinessSimulator(type,defaults)},'Simular agora'),lessonButton(key,{},'? Entenda'))))),
    h('section.card.company-sim-learning',sectionTitle('Como usar simuladores do jeito certo'),h('div.company-routine-grid',
      routine('1. Use dados reais','primeiro passo',['Pegue custos, taxas e preços do próprio negócio.','Se não souber um valor, use um cenário conservador.']),
      routine('2. Teste cenários','antes da decisão',['Compare preço atual x novo preço.','Teste desconto, aumento de custo e queda de vendas.']),
      routine('3. Registre o que decidiu','depois do teste',['Atualize produto, orçamento ou meta.','Acompanhe o resultado real e ajuste as premissas.']))));
}
function routine(title,time,items){return h('article.company-routine-card',h('div',h('b',title),h('small',time)),h('ul',...items.map(x=>h('li',x))));}
function companyAgenda(root){
  root.append(companyTeachBanner('cashProjection','Agenda financeira','Aqui você transforma contas futuras em previsão. Cadastre vencimentos e recebimentos para o Bivvo mostrar antes quando o caixa pode apertar.'));
  renderCalendar(root);
}
function companyTeachBanner(key,title,text,context={}){
  return h('section.card.company-teach-banner',h('span','📘'),h('div',h('small','APRENDA ENQUANTO USA'),h('h3',title),h('p',text)),lessonButton(key,context,'? Entenda'));
}
function eduStat(label,value,key,context={},hint=null,tone=''){
  return h('button.company-edu-stat'+(tone?'.'+tone:''),{type:'button',onclick:()=>openBusinessLesson(key,context)},h('small',label),h('b',value),hint?h('span',hint):null,h('em','? Entenda'));
}
function companyMonthlyFixed(s){
  return round2((s.fixed||[]).filter(x=>x.type!=='income').reduce((n,x)=>n+(x.rec==='Anual'?num(x.value)/12:num(x.value)),0));
}
function pctText(v){return `${(num(v)*100).toFixed(1).replace('.',',')}%`;}
function companyProducts(root){
  const s=store.getState(), fixed=companyMonthlyFixed(s), portfolio=CM.productPortfolio(s.companyProducts||[],fixed);
  root.append(
    h('div.page-head',
      h('div',h('h2.h2','Produtos, serviços e precificação'),h('p.muted','Aqui você aprende a calcular o custo real e a descobrir se cada produto ou serviço realmente deixa dinheiro.')),
      h('button.btn.sm.primary',{type:'button',onclick:()=>openCompanyProductForm()},'+ Novo produto/serviço')),
    companyTeachBanner('pricing','Como formar um preço sem chutar','O Bivvo considera custo direto, frete, embalagem, taxas, impostos, comissão, rateio e margem desejada. Clique para entender a lógica antes de cadastrar.'),
    h('div.company-edu-stats',
      h('article.company-simple-stat',h('small','Itens cadastrados'),h('b',String(portfolio.rows.length)),h('span','produtos e serviços')),
      eduStat('Faturamento estimado',money0(portfolio.revenue),'revenue',{revenue:portfolio.revenue},'preço × quantidade informada','good'),
      eduStat('Lucro estimado',money0(portfolio.profit),'productProfit',{},'considerando volume e custos',portfolio.profit<0?'bad':'good'),
      eduStat('Estoque a custo',money0(portfolio.inventoryValue),'stock',{inventoryValue:portfolio.inventoryValue},'capital imobilizado'),
      h('article.company-simple-stat'+(portfolio.lowStock?'.bad':''),h('small','Estoque baixo'),h('b',String(portfolio.lowStock)),h('span','item(ns) no limite')))
  );
  root.append(h('section.card.company-business-basics',
    sectionTitle('Fundamentos que o dono precisa acompanhar'),
    h('div.company-basics-grid',
      businessConcept('1','Faturamento','Tudo que a empresa vendeu no período.','revenue',{revenue:portfolio.revenue}),
      businessConcept('2','Custos','Gastos diretamente ligados ao produto ou serviço vendido.','variableCosts',{}),
      businessConcept('3','Despesas','Gastos para manter a empresa funcionando, mesmo sem vender.','fixedOpex',{fixedExpenses:fixed}),
      businessConcept('4','Margem de contribuição','Venda − custos e despesas variáveis. É o que sobra para pagar a estrutura fixa e gerar lucro.','contribution',{}),
      businessConcept('5','Lucro','O que sobra depois de custos, despesas e obrigações gerenciais.','netProfit',{}),
      businessConcept('6','Fluxo de caixa','Quando o dinheiro efetivamente entra e sai da conta. Lucro e caixa podem ser diferentes.','cashProjection',{})),
    h('div.company-formula-strip',
      h('span',h('b','Margem de contribuição'),' = venda − custos variáveis'),
      h('span',h('b','Ponto de equilíbrio'),' = custos fixos ÷ % margem de contribuição'),
      h('span',h('b','Margem'),' = lucro ÷ preço de venda'),
      h('span',h('b','Markup'),' = preço ÷ custo − 1'))
  ));
  if(!portfolio.rows.length){
    root.append(emptyState({icon:'📦',title:'Cadastre o primeiro produto ou serviço',text:'Informe compra/mão de obra direta, frete, embalagem, taxas, impostos, comissão e preço de venda. O Bivvo faz as contas automaticamente.',action:{label:'Cadastrar agora',fn:()=>openCompanyProductForm()}}));
    return;
  }
  const sorted=[...portfolio.rows].sort((a,b)=>b.metrics.profitTotal-a.metrics.profitTotal);
  root.append(h('section.card.company-product-profit',
    sectionTitle('Lucro por produto/serviço'),
    h('p.hint','O item que mais vende nem sempre é o que mais dá dinheiro. O ranking usa a quantidade vendida informada em cada cadastro.'),
    h('div.company-product-list',sorted.map((p,i)=>productRow(p,fixed,i)))));
}
function businessConcept(n,title,text,key='',context={}){return h('button.company-business-concept',{type:'button',onclick:key?()=>openBusinessLesson(key,context):null},h('span',n),h('div',h('b',title),h('small',text),key?h('em','? Entenda e veja como calcular'):null));}
function productRow(p,fixed,index){
  const m=p.metrics||CM.productMetrics(p,fixed), low=p.kind!=='service'&&num(p.minStock)>0&&m.stockQty<=num(p.minStock);
  return h('button.company-product-row',{type:'button',onclick:()=>openCompanyProductForm(p)},
    h('span.company-product-rank',String(index+1)),
    h('span.company-product-main',h('b',p.name),h('small',`${p.kind==='service'?'Serviço':'Produto'} · ${p.category||'Geral'} · venda ${money(m.sale)} · custo real ${money(m.realCost)}`),low?h('em','Estoque baixo'):null),
    h('span.company-product-metrics',
      h('span',h('small','Margem contribuição'),h('b',{class:m.contributionMargin>=.2?'good':m.contributionMargin>0?'warn':'bad'},pctText(m.contributionMargin))),
      h('span',h('small','Lucro unitário'),h('b',{class:m.unitProfit>=0?'good':'bad'},money(m.unitProfit))),
      h('span',h('small','Lucro estimado'),h('b',{class:m.profitTotal>=0?'good':'bad'},money(m.profitTotal)))));
}
function productNumberInput(value,label,{pct=false}={}){
  return h('input.input',{type:'text',inputmode:'decimal',value:String(value??0).replace('.',','),'aria-label':label,dataset:{pct:pct?'1':'0'}});
}
function guidedProductField(label,input,helpKey,hint=''){
  return h('label.field.company-guided-field',h('span.company-guided-label',h('span',label),fieldHelpButton(helpKey,'?')),input,hint?h('small.hint',hint):null);
}
function openCompanyProductForm(existing=null){
  const s=store.getState(), fixed=companyMonthlyFixed(s);
  const name=h('input.input',{type:'text',maxlength:'80',value:existing?.name||'',placeholder:'Ex.: Camiseta Premium'});
  const kind=h('select.input',{},h('option',{value:'product'},'Produto'),h('option',{value:'service'},'Serviço'));kind.value=existing?.kind||'product';
  const category=h('input.input',{type:'text',maxlength:'40',value:existing?.category||'',placeholder:'Ex.: Roupas, Instalação, Consultoria'});
  const purchase=productNumberInput(existing?.purchaseCost,'Custo de compra ou mão de obra direta');
  const freight=productNumberInput(existing?.freight,'Frete por unidade');
  const packaging=productNumberInput(existing?.packaging,'Embalagem por unidade');
  const other=productNumberInput(existing?.otherDirect,'Outros custos diretos');
  const sale=productNumberInput(existing?.salePrice,'Preço de venda');
  const fee=productNumberInput(existing?.cardFeePct,'Taxa cartão/marketplace',{pct:true});
  const tax=productNumberInput(existing?.taxPct,'Impostos sobre a venda',{pct:true});
  const commission=productNumberInput(existing?.commissionPct,'Comissão sobre a venda',{pct:true});
  const allocation=productNumberInput(existing?.fixedAllocation,'Rateio fixo por unidade');
  const target=productNumberInput(existing?.targetMarginPct||20,'Margem de contribuição desejada',{pct:true});
  const sold=productNumberInput(existing?.soldQty,'Quantidade vendida no mês');
  const stock=productNumberInput(existing?.stockQty,'Estoque atual');
  const minStock=productNumberInput(existing?.minStock,'Estoque mínimo');
  const read=()=>({
    id:existing?.id||uid(),name:name.value.trim(),kind:kind.value,category:category.value.trim()||'Geral',
    purchaseCost:parseMoney(purchase.value),freight:parseMoney(freight.value),packaging:parseMoney(packaging.value),otherDirect:parseMoney(other.value),salePrice:parseMoney(sale.value),
    cardFeePct:parseMoney(fee.value),taxPct:parseMoney(tax.value),commissionPct:parseMoney(commission.value),fixedAllocation:parseMoney(allocation.value),targetMarginPct:parseMoney(target.value),
    soldQty:parseMoney(sold.value),stockQty:parseMoney(stock.value),minStock:parseMoney(minStock.value)
  });
  const shell=h('div.company-product-wizard');
  let step=1,sheet=null;
  const inputs=[name,kind,category,purchase,freight,packaging,other,sale,fee,tax,commission,allocation,target,sold,stock,minStock];
  const stepper=()=>h('div.company-wizard-stepper',[1,2,3,4].map(n=>h('button'+(step===n?'.on':'')+(step>n?'.done':''),{type:'button',onclick:()=>{step=n;draw();}},h('span',step>n?'✓':String(n)),h('small',['Identificação','Custo real','Venda e taxas','Resultado'][n-1]))));
  const intro=(icon,title,text)=>h('div.company-wizard-intro',h('span',icon),h('div',h('h3',title),h('p',text)));
  const statusFor=m=>m.contributionMargin>=.25?['good','Saudável','A margem tem boa folga para ajudar a pagar a estrutura.']:m.contributionMargin>=.12?['warn','Atenção','Existe contribuição, mas mudanças de custo ou desconto podem apertar o resultado.']:['bad','Risco','A margem está muito apertada ou negativa. Revise preço e custos antes de crescer volume.'];
  const save=()=>{const p=read();if(!p.name){toast('Informe o nome do produto ou serviço.',{tone:'warn'});step=1;draw();setTimeout(()=>name.focus(),60);return;}if(p.salePrice<=0){toast('Informe o preço de venda.',{tone:'warn'});step=3;draw();setTimeout(()=>sale.focus(),60);return;}store.commit(st=>{const i=st.companyProducts.findIndex(x=>x.id===p.id);if(i>=0)st.companyProducts[i]=p;else st.companyProducts.push(p);});sheet.close();toast(existing?'Produto/serviço atualizado':'Produto/serviço cadastrado');rerender();};
  const nav=()=>h('div.company-wizard-nav',step>1?h('button.btn.ghost',{type:'button',onclick:()=>{step--;draw();}},'← Voltar'):h('span'),step<4?h('button.btn.primary',{type:'button',onclick:()=>{if(step===1&&!name.value.trim()){toast('Dê um nome ao produto ou serviço.',{tone:'warn'});name.focus();return;}step++;draw();}},'Continuar →'):h('button.btn.primary',{type:'button',onclick:save},existing?'Salvar alterações':'Cadastrar'));
  const resultStep=()=>{const p=read(),m=CM.productMetrics(p,fixed),[tone,label,explain]=statusFor(m);return h('div.company-wizard-result',
    intro('✅','Resultado automático','Agora o Bivvo junta tudo o que você informou e traduz em números de decisão.'),
    h('div.company-wizard-semaphore',{class:tone},h('span',tone==='good'?'🟢':tone==='warn'?'🟡':'🔴'),h('div',h('b',label),h('p',explain))),
    h('div.company-product-preview-grid',
      metricMini('Custo direto',money(m.baseDirect)),metricMini('Custos % da venda',money(m.percentageCosts)),metricMini('Custo variável',money(m.variableCost)),metricMini('Custo real + rateio',money(m.realCost)),
      metricMini('Contribuição por unidade',money(m.contribution),m.contribution>=0?'good':'bad'),metricMini('Margem de contribuição',pctText(m.contributionMargin),tone),metricMini('Markup',pctText(m.markup)),metricMini('Lucro unitário estimado',money(m.unitProfit),m.unitProfit>=0?'good':'bad'),
      metricMini('Preço mínimo sugerido',m.recommendedMinPrice?money(m.recommendedMinPrice):'—'),metricMini('Ponto de equilíbrio',m.breakEvenUnits?`${Math.ceil(m.breakEvenUnits)} un./mês`:'—'),metricMini('Lucro no volume informado',money(m.profitTotal),m.profitTotal>=0?'good':'bad')),
    h('section.company-wizard-reading',h('h4','Como interpretar'),h('p',`Se vender por ${money(m.sale||0)}, cada unidade deixa aproximadamente ${money(m.contribution)} de margem de contribuição antes da estrutura fixa. Com os dados informados, a margem é ${pctText(m.contributionMargin)}.`),h('p',m.recommendedMinPrice?`Para buscar ${String(p.targetMarginPct).replace('.',',')}% de margem desejada, o preço mínimo gerencial calculado é ${money(m.recommendedMinPrice)}.`:'Revise margem desejada e percentuais para calcular um preço mínimo válido.')),
    h('div.company-product-learn-actions',lessonButton('variableCosts',{revenue:m.sale,variableCosts:m.variableCost,contribution:m.contribution},'? Entenda custo'),lessonButton('contribution',{revenue:m.sale,variableCosts:m.variableCost,contribution:m.contribution,contributionMargin:m.contributionMargin},'? Entenda margem'),lessonButton('pricing',{sale:m.sale,variableCost:m.variableCost,contribution:m.contribution},'? Entenda preço'),lessonButton('productProfit',{productName:p.name||'Item',sale:m.sale,realCost:m.realCost,unitProfit:m.unitProfit,contributionMargin:m.contributionMargin},'? Entenda lucro'),h('button.btn.sm',{type:'button',onclick:()=>openBusinessSimulator('discount',{price:m.sale,variableCost:m.variableCost,discountPct:10})},'Testar desconto')));
  };
  const draw=()=>{
    shell.replaceChildren(stepper());
    if(step===1)shell.append(intro('1️⃣','Identifique o que você vende','Comece simples. Nome e categoria servem para comparar produtos e serviços depois.'),h('div.company-wizard-panel',guidedProductField('Nome',name,'name'),guidedProductField('Tipo',kind,'name'),guidedProductField('Categoria',category,'category')));
    if(step===2)shell.append(intro('2️⃣','Descubra o custo real por unidade','Não olhe só o fornecedor. Some tudo que existe para entregar uma unidade ao cliente.'),h('div.company-wizard-panel.form-grid.two',guidedProductField('Compra / matéria-prima / mão de obra direta',purchase,'purchaseCost'),guidedProductField('Frete por unidade',freight,'freight'),guidedProductField('Embalagem por unidade',packaging,'packaging'),guidedProductField('Outros custos diretos',other,'otherDirect')),h('div.company-wizard-tip',h('b','Regra prática'),h('p','Se o gasto só existe porque uma unidade foi vendida, provavelmente é custo direto/variável. Aluguel e contador não entram aqui.')),lessonButton('variableCosts',{},'? Aula: custo real'));
    if(step===3)shell.append(intro('3️⃣','Informe venda, taxas e estrutura','Agora entram os percentuais que comem parte da venda e as premissas para simular margem.'),h('div.company-wizard-panel.form-grid.two',guidedProductField('Preço de venda',sale,'salePrice'),guidedProductField('Taxa cartão / marketplace (%)',fee,'cardFeePct'),guidedProductField('Impostos (%)',tax,'taxPct','Use a alíquota efetiva da sua empresa quando souber.'),guidedProductField('Comissão (%)',commission,'commissionPct'),guidedProductField('Rateio fixo por unidade',allocation,'fixedAllocation'),guidedProductField('Margem desejada (%)',target,'targetMarginPct'),guidedProductField('Quantidade vendida no mês',sold,'soldQty')),kind.value==='product'?h('div.company-wizard-panel.form-grid.two',guidedProductField('Estoque atual',stock,'stockQty'),guidedProductField('Estoque mínimo',minStock,'minStock')):null,h('div.company-product-learn-actions',lessonButton('pricing',{},'? Como formar preço'),h('button.btn.sm',{type:'button',onclick:()=>openBusinessSimulator('price',{cost:CM.productMetrics(read(),fixed).realCost,ratePct:parseMoney(fee.value)+parseMoney(tax.value)+parseMoney(commission.value),marginPct:parseMoney(target.value)})},'Simular preço ideal')));
    if(step===4)shell.append(resultStep());
    shell.append(nav());
  };
  inputs.forEach(el=>{el.addEventListener('input',()=>{if(step===4)draw();});el.addEventListener('change',()=>{if(el===kind||step===4)draw();});});
  const footer=existing?[h('button.btn.ghost.danger-text',{type:'button',onclick:async()=>{if(!await confirmSheet({title:`Excluir ${existing.name}?`,message:'O cadastro do produto/serviço será removido. Os lançamentos financeiros não são apagados.',confirmLabel:'Excluir',danger:true}))return;sheet.close();store.commit(st=>{st.companyProducts=st.companyProducts.filter(x=>x.id!==existing.id);});toast('Produto/serviço excluído');rerender();}},'Excluir')]:[];
  sheet=openSheet({title:existing?'Editar produto/serviço':'Novo produto ou serviço',subtitle:'Cadastro guiado · o Bivvo explica cada etapa',content:shell,footer,wide:true});draw();
}
function metricMini(label,value,tone=''){return h('div.company-metric-mini',h('small',label),h('b',{class:tone},value));}

function companyRecurring(root,s){
  const monthly=x=>x.rec==='Anual'?num(x.value)/12:num(x.value);
  const exp=s.fixed.filter(f=>f.type!=='income'),inc=s.fixed.filter(f=>f.type==='income');
  const cost=round2(exp.reduce((v,x)=>v+monthly(x),0)),revenue=round2(inc.reduce((v,x)=>v+monthly(x),0));
  root.append(h('div.page-head',h('div',h('h2.h2','Custos e receitas recorrentes'),h('p.muted','O objetivo é descobrir quanto custa manter a empresa aberta antes mesmo de vender.')),h('button.btn.sm.primary',{type:'button',onclick:()=>openFixedForm()},'Nova recorrência')),
    companyTeachBanner('recurring','Por que cadastrar recorrências?','Aluguel, folha, pró-labore, sistemas, contratos e gastos anuais formam a estrutura que sua margem precisa pagar todos os meses.'),
    h('div.company-edu-stats',
      eduStat('Custos fixos / mês',money0(cost),'fixedOpex',{fixedExpenses:cost},'estrutura mensal'),
      h('article.company-simple-stat.good',h('small','Receitas recorrentes / mês'),h('b',money0(revenue)),h('span','previsibilidade de receita')),
      h('article.company-simple-stat'+(revenue-cost<0?'.bad':'.good'),h('small','Saldo recorrente'),h('b',money0(revenue-cost)),h('span','receitas recorrentes − custos fixos'))));
  const row=f=>h('button.tx',{type:'button',onclick:()=>openFixedForm(f)},h('span.tx-ico',{'aria-hidden':'true'},catIcon(f.cat)),h('span.tx-main',h('b',f.name),h('small',`${f.due?'Dia '+f.due:'Sem dia definido'} · ${f.rec==='Anual'?'Anual':'Mensal'} · ${f.cat}`)),h('span.tx-side',h('b.tx-val'+(f.type==='income'?'.in':''),(f.type==='income'?'+ ':'')+money(f.value))));
  if(exp.length)root.append(h('section.card',sectionTitle('Custos recorrentes'),h('div.list',exp.sort((a,b)=>num(a.due)-num(b.due)).map(row))));
  if(inc.length)root.append(h('section.card',sectionTitle('Receitas recorrentes'),h('div.list',inc.sort((a,b)=>num(a.due)-num(b.due)).map(row))));
  if(!s.fixed.length)root.append(emptyState({icon:'🔁',title:'Cadastre o que se repete todo mês',text:'Comece pelos custos que a empresa paga mesmo sem vender: aluguel, folha, pró-labore, contabilidade, sistemas e contratos.',action:{label:'Criar recorrência',fn:()=>openFixedForm()}}));
}
function companyCosts(root){
  const s=store.getState(),ym=ctx.month,rows=F.budgetRows(ym,s),sm=F.monthSummary(ym,s);
  const expenseRows=F.monthTx(ym,s).filter(t=>F.isSpend(t));
  const totalExpense=round2(expenseRows.reduce((n,t)=>n+num(t.value),0));
  const limits=round2(rows.reduce((n,r)=>n+num(r.limit),0));
  root.append(h('div.page-head',monthSwitcher(rerender),h('button.btn.sm.primary',{type:'button',onclick:openBudgetForm},'Definir limites')),
    companyTeachBanner('budget','Controle de custos sem cortar no escuro','Orçamento é um limite planejado, não uma ordem automática de corte. Priorize categorias relevantes e investigue a causa quando houver estouro.',{spent:totalExpense,limit:limits}),
    h('div.company-edu-stats',
      eduStat('Despesas lançadas',money0(totalExpense),'costMix',{categoryValue:totalExpense,share:1},'total registrado'),
      eduStat('Limites definidos',money0(limits),'budget',{spent:totalExpense,limit:limits},'planejamento do mês'),
      h('article.company-simple-stat'+(sm.income-totalExpense<0?'.bad':'.good'),h('small','Resultado simples do mês'),h('b',money0(sm.income-totalExpense)),h('span','receitas − despesas lançadas'))));
  root.append(h('section.card.company-cost-guide',h('div.card-head',h('h3','Controle por centro de custo'),lessonButton('budget',{spent:totalExpense,limit:limits},'? Como usar')),h('p.muted.sm','Defina teto para categorias como Marketing, Folha, Fornecedores, Frota e Softwares. O objetivo é perceber estouros antes que virem problema de caixa.')));
  if(!rows.length){root.append(emptyState({icon:'📊',title:'Defina limites para os custos que mais pesam',text:'Escolha as categorias importantes do negócio e informe quanto pretende gastar por mês em cada uma.',action:{label:'Configurar custos',fn:openBudgetForm}}));return;}
  root.append(h('section.card',h('div.card-head',h('h3','Custos de '+monthName(ym)),h('button.link.sm',{type:'button',onclick:openBudgetForm},'Editar limites')),h('div.budget-list',rows.map(r=>{
    const tone=r.ratio>=1?'bad':r.ratio>=.8?'warn':'good';
    return h('div.brow',h('div.brow-top',h('span',h('i',{'aria-hidden':'true'},catIcon(r.cat)),r.cat),h('b',`${money0(r.spent)} / ${money0(r.limit)}`)),progress(r.spent,r.limit,tone),h('small.muted',r.left>=0?`${money0(r.left)} ainda disponível`:`${money0(-r.left)} acima do limite`));
  }))));
}
function companyIndicators(root){
  const s=store.getState(),ym=ctx.month,rows=F.monthTx(ym,s).filter(t=>store.recordVisible(t,s));
  const fixedFallback=companyMonthlyFixed(s),dre=CM.statement(rows,{periodMonths:1,monthlyFixedFallback:fixedFallback});
  const portfolio=CM.productPortfolio(s.companyProducts||[],fixedFallback);
  const receivable=round2(dre.revenueRows.filter(t=>t.status!=='Pago').reduce((n,t)=>n+num(t.value),0));
  const payable=round2(rows.filter(t=>t.type==='expense'&&t.method!=='Crédito'&&t.status!=='Pago').reduce((n,t)=>n+num(t.value),0));
  const tax=round2(rows.filter(t=>t.type==='expense'&&t.cat==='Impostos e tributos').reduce((n,t)=>n+num(t.value),0));
  const payroll=round2(rows.filter(t=>t.type==='expense'&&['Folha de pagamento','Pró-labore','Encargos trabalhistas'].includes(t.cat)).reduce((n,t)=>n+num(t.value),0));
  const cash=F.balance(s),totalExpenses=round2(dre.variableCosts+dre.fixedExpenses+dre.otherOpex+dre.financialExpenses);
  const contributionPct=dre.revenue?dre.contributionMargin:0;
  const ctxLesson={revenue:dre.revenue,variableCosts:dre.variableCosts,contribution:dre.contribution,contributionMargin:dre.contributionMargin,fixedExpenses:dre.fixedExpenses+dre.otherOpex,ebitda:dre.ebitdaApprox,netProfit:dre.netProfit,breakEven:dre.breakEven,cash,receivable,payable,inventoryValue:portfolio.inventoryValue};
  root.append(
    h('div.page-head',monthSwitcher(rerender)),
    companyTeachBanner('dre','Como ler os indicadores sem se perder','Leia sempre na mesma ordem: venda → custo variável → margem → estrutura → resultado. Depois confira o caixa. Essa sequência evita confundir faturamento, lucro e dinheiro disponível.',ctxLesson),
    h('section.card.company-indicator-hero',
      h('div.company-educational-title',h('div',h('small.eyebrow-soft','DRE GERENCIAL SIMPLIFICADA'),h('h3','A lógica do lucro, passo a passo'),h('p.muted.sm','Clique em qualquer número para aprender o conceito, a fórmula e ver um exemplo com seus próprios dados.')),lessonButton('dre',ctxLesson,'? Como ler a DRE')),
      h('div.company-edu-stats.flow',
        eduStat('1. Faturamento',money0(dre.revenue),'revenue',ctxLesson,'tudo que foi vendido','good'),
        eduStat('2. Custos variáveis',money0(dre.variableCosts),'variableCosts',ctxLesson,'custos ligados à venda'),
        eduStat('3. Margem de contribuição',money0(dre.contribution),'contribution',ctxLesson,`${pctText(contributionPct)} do faturamento`,dre.contribution<0?'bad':'good'),
        eduStat('4. Despesas fixas + operação',money0(dre.fixedExpenses+dre.otherOpex),'fixedOpex',ctxLesson,'estrutura do negócio'),
        eduStat('5. EBITDA aprox.',money0(dre.ebitdaApprox),'ebitda',ctxLesson,'leitura operacional',dre.ebitdaApprox<0?'bad':'good'),
        eduStat('6. Lucro gerencial',money0(dre.netProfit),'netProfit',ctxLesson,'resultado gerencial',dre.netProfit<0?'bad':'good'))),
    h('section.card',
      h('div.company-educational-title',h('div',h('h3','Sobrevivência financeira: ponto de equilíbrio e caixa'),h('p.muted.sm','Esses números respondem duas perguntas diferentes: “quanto preciso vender para me pagar?” e “tenho dinheiro para cumprir os próximos compromissos?”'))),
      h('div.company-edu-stats',
        eduStat('Ponto de equilíbrio',dre.breakEven?money0(dre.breakEven)+'/mês':'—','breakEven',ctxLesson,'mínimo estimado para cobrir a estrutura'),
        eduStat('Custos fixos estimados',money0(dre.monthlyFixed),'fixedOpex',{fixedExpenses:dre.monthlyFixed},'estrutura mensal'),
        eduStat('Caixa atual',money0(cash),'cash',ctxLesson,'dinheiro efetivamente disponível',cash<0?'bad':'good'),
        eduStat('A receber',money0(receivable),'receivable',ctxLesson,'vendas que ainda não viraram caixa','good'),
        eduStat('A pagar',money0(payable),'payable',ctxLesson,'dinheiro já comprometido'),
        eduStat('Estoque a custo',money0(portfolio.inventoryValue),'stock',{inventoryValue:portfolio.inventoryValue},'capital parado em produtos'))),
    h('section.card.company-business-basics',sectionTitle('Fundamentos — toque para aprender'),
      h('div.company-basics-grid',
        businessConcept('1','Faturamento','Soma das receitas operacionais lançadas, mesmo quando ainda estão a receber.','revenue',ctxLesson),
        businessConcept('2','Custos variáveis','Mercadoria, matéria-prima, fornecedores, embalagem, frete, taxas, comissão, terceiros e tributos ligados à venda.','variableCosts',ctxLesson),
        businessConcept('3','Margem de contribuição','Faturamento − custos variáveis. É o valor que sobra para pagar a estrutura fixa e depois gerar lucro.','contribution',ctxLesson),
        businessConcept('4','Despesas fixas / operacionais','Folha, pró-labore, aluguel, sistemas, contabilidade e outros gastos para manter a empresa funcionando.','fixedOpex',ctxLesson),
        businessConcept('5','EBITDA aproximado','Margem de contribuição − despesas fixas/operacionais. É uma visão gerencial, não uma DRE contábil.','ebitda',ctxLesson),
        businessConcept('6','Lucro gerencial','Resultado operacional depois das despesas financeiras cadastradas.','netProfit',ctxLesson)),
      h('div.company-formula-strip',
        h('button',{type:'button',onclick:()=>openBusinessLesson('contribution',ctxLesson)},'Margem de contribuição = faturamento − custos variáveis'),
        h('button',{type:'button',onclick:()=>openBusinessLesson('breakEven',ctxLesson)},'Ponto de equilíbrio = custos fixos ÷ margem de contribuição %'),
        h('button',{type:'button',onclick:()=>openBusinessLesson('cash',ctxLesson)},'Lucro ≠ caixa: recebimentos e pagamentos podem acontecer em datas diferentes.'))),
    h('section.card',
      h('div.company-educational-title',h('div',h('h3','Obrigações e estrutura'),h('p.muted.sm','Não são “detalhes”: imposto, folha, pró-labore, dívida e estoque mudam a capacidade de crescer.'))),
      h('div.company-edu-stats',
        eduStat('Impostos lançados',money0(tax),'taxes',{},'confira regime e vencimentos'),
        eduStat('Folha + pró-labore',money0(payroll),'proLabore',{},'remuneração e equipe'),
        h('article.company-simple-stat',h('small','Despesas financeiras'),h('b',money0(dre.financialExpenses)),h('span','juros e taxas financeiras')),
        h('article.company-simple-stat',h('small','Produtos/serviços'),h('b',String(portfolio.rows.length)),h('span','itens analisados')),
        eduStat('Estoque baixo',String(portfolio.lowStock),'stock',{inventoryValue:portfolio.inventoryValue},'item(ns) no limite',portfolio.lowStock?'bad':'good'))));

  const by=new Map();for(const t of dre.expenseRows)by.set(t.cat,(by.get(t.cat)||0)+num(t.value));
  const top=[...by.entries()].map(([cat,value])=>({cat,value,share:totalExpenses?value/totalExpenses:0})).sort((a,b)=>b.value-a.value).slice(0,8);
  const ranking=[...portfolio.rows].sort((a,b)=>b.metrics.profitTotal-a.metrics.profitTotal).slice(0,6);
  root.append(
    h('section.card',h('div.card-head',h('h3','Maiores custos e despesas do mês'),lessonButton('costMix',{categoryValue:top[0]?.value||0,share:top[0]?.share||0},'? Como analisar')),top.length?h('div.budget-list',top.map(x=>h('div.brow',h('div.brow-top',h('span',h('i',{'aria-hidden':'true'},catIcon(x.cat)),x.cat),h('b',money0(x.value))),progress(x.share,1,x.share>.35?'warn':'good'),h('small.muted',`${Math.round(x.share*100)}% do total de custos e despesas`)))):h('p.muted.sm','Registre despesas para formar os indicadores.')),
    h('section.card',h('div.card-head',h('div',h('h3','Lucro por produto / serviço'),h('small.muted','Descubra o que realmente gera dinheiro, não apenas o que mais vende.')),h('div.btn-row',lessonButton('productProfit',{},'? Entenda'),h('button.link.sm',{type:'button',onclick:()=>{companyTab='produtos';rerender();}},portfolio.rows.length?'Abrir produtos':'Cadastrar produto'))),
      ranking.length?h('div.list',ranking.map(p=>h('button.tx',{type:'button',onclick:()=>openCompanyProductForm(p)},h('span.tx-ico',{'aria-hidden':'true'},p.kind==='service'?'🧑‍💼':'📦'),h('span.tx-main',h('b',p.name),h('small',`Faturamento estimado ${money0(p.metrics.revenueTotal)} · margem contribuição ${pctText(p.metrics.contributionMargin)}`)),h('span.tx-side',h('b.tx-val'+(p.metrics.profitTotal>=0?'.in':''),money0(p.metrics.profitTotal)),h('small','lucro estimado'))))):h('p.muted.sm','Cadastre produtos ou serviços e informe custo, preço e volume para comparar rentabilidade.')),
    h('section.card',h('h3','Leitura do dono'),h('div.company-reading',
      h('p',h('b',dre.contribution>=0?'✓ A venda está contribuindo para a estrutura.':'⚠ A venda não cobre os custos variáveis.'),' ',dre.revenue?`A margem de contribuição está em ${pctText(dre.contributionMargin)} (${money0(dre.contribution)}).`:'Ainda não há faturamento suficiente para calcular a margem.'),
      h('p',h('b',dre.netProfit>=0?'✓ Resultado gerencial positivo.':'⚠ Resultado gerencial negativo.'),' ',dre.netProfit>=0?`Depois dos custos e despesas cadastrados, sobram ${money0(dre.netProfit)} no mês.`:`Faltam ${money0(Math.abs(dre.netProfit))} para custos e despesas caberem no faturamento do mês.`),
      h('p',h('b',dre.breakEven&&dre.revenue>=dre.breakEven?'✓ Acima do ponto de equilíbrio.':dre.breakEven?'Ponto de equilíbrio ainda não atingido.':'Ponto de equilíbrio sem base.'),' ',dre.breakEven?`Referência atual: cerca de ${money0(dre.breakEven)} de faturamento por mês.`:'Cadastre custos fixos e receitas para o Bivvo estimar.'),
      h('p.hint','Indicadores de gestão baseados nos lançamentos do Bivvo. Classificação de custos e impostos pode variar por negócio e regime tributário; valide a apuração contábil e fiscal com seu contador.'))));
}
