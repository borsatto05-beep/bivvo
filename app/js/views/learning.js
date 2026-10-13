import {openStoryComposer} from './stories.js';
/* Órbita Bivvo — uma decisão, uma missão e uma ação por vez. */
import { h, money, money0, today, shortDate, isoWeek } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { openSheet, toast } from '../ui.js';
import { go } from '../nav.js';
import { adminTrack } from '../admin-analytics.js';
import { currentFinanceContext } from './finance-profiles.js';
import { LEARNING_GOALS, LEARNING_LESSONS, learningSpace, learningGoal, journeySnapshot, chooseLearningGoal, startLearningLesson, answerLearningLesson, practiceLearningLesson, applyLearningLesson, learningEvidence, exerciseResult, reviewLearningWeek } from '../learning.js';

const event = (name,space,id='') => { if(!store.isDemo())adminTrack(name,'aprender',{content:`${space}:${id}`}).catch(()=>{}); };
const spaceName = s => s==='company'?'do negócio':s==='couple'?'a dois':'pessoal';
const active = () => learningSpace(currentFinanceContext());
const jump = (route,space,params={}) => go(route,{...params,...(space==='couple'?{finance:'couple'}:{})});
export function openLearningGoal({space=active(),onChosen}={}) {
  const current=learningGoal(store.getState(),space);
  let intent='';try{intent=sessionStorage.getItem('bivvo_learning_intent_v1')||'';}catch{}
  let selected=current?.id || (LEARNING_GOALS[space].some(g=>g.id===intent)?intent:'');
  const choices=h('div.orbit-goals'), status=h('p.orbit-helper',{role:'status'},'Você pode mudar o objetivo depois. Seu aprendizado fica guardado.');
  const submit=h('button.orbit-button',{type:'button',disabled:!selected,onclick:()=>{
    try{const changed=chooseLearningGoal(selected,space);if(changed)event('learning_goal_selected',space,selected);try{sessionStorage.removeItem('bivvo_learning_intent_v1');}catch{}sheet.close();setTimeout(()=>{if(onChosen)onChosen();else jump('aprender',space);},180);}catch(e){status.textContent=e.message;}
  }},current?'Atualizar meu objetivo':'Começar minha órbita');
  const paint=()=>choices.replaceChildren(...LEARNING_GOALS[space].map(goal=>h('button.orbit-goal'+(selected===goal.id?'.selected':''),{type:'button','aria-pressed':selected===goal.id,onclick:()=>{selected=goal.id;submit.disabled=false;paint();}},h('span.orbit-goal-icon',{'aria-hidden':'true'},goal.icon),h('span',h('b',goal.title),h('small',goal.detail)),h('span',{'aria-hidden':'true'},selected===goal.id?'✓':'›'))));
  const sheet=openSheet({title:'Qual é seu próximo objetivo?',subtitle:`Uma jornada ${spaceName(space)}, no seu ritmo.`,content:h('div.orbit-surface.orbit-goal-picker',h('span.orbit-eyebrow','BIVVO · ÓRBITA'),h('h3','Comece por uma escolha.'),h('p','Sete missões para entender, experimentar e aplicar.'),choices,status),footer:[submit]});paint();
}

function orbitArt(snap,{interactive=false,space=snap.space}={}) {
  const core=h('div.orbit-core',h('span.orbit-core-glow',{'aria-hidden':'true'}),h('small',snap.goal?'AÇÕES APLICADAS':'SEU PRÓXIMO PASSO'),h('strong',snap.goal?`${snap.applied}`:'B'),h('span',snap.goal?`de ${snap.total} missões`:'começa aqui'));
  const visual=h('div.orbit-visual',h('div.orbit-ring.ring-one',{'aria-hidden':'true'}),h('div.orbit-ring.ring-two',{'aria-hidden':'true'}),h('div.orbit-ring.ring-three',{'aria-hidden':'true'}),core);
  if(interactive)for(const step of snap.steps){const locked=!step.applied&&step.id!==snap.current?.id;visual.append(h('button.orbit-node'+(step.applied?'.done':step.id===snap.current?.id?'.current':''),{type:'button',disabled:locked,'aria-label':`Missão ${step.index+1}: ${step.title}${step.applied?', aplicada':locked?', conclua a missão atual primeiro':', continuar'}`,vars:{'--node-x':`${50+40*Math.cos((step.index*360/7-90)*Math.PI/180)}%`,'--node-y':`${50+40*Math.sin((step.index*360/7-90)*Math.PI/180)}%`},onclick:()=>openLearningMission(step.id,space)},h('span',step.applied?'✓':String(step.index+1).padStart(2,'0'))));}
  else visual.append(h('span.orbit-star.star-one',{'aria-hidden':'true'},'✦'),h('span.orbit-star.star-two',{'aria-hidden':'true'},'✧'));
  return visual;
}

export function learningLaunchCard(space=active()) {
  const snap=journeySnapshot(store.getState(),space);
  return h('button.orbit-launch',{type:'button',onclick:()=>snap.goal?jump('aprender',space):openLearningGoal({space})},h('span.orbit-launch-icon',{'aria-hidden':'true'},'✦'),h('span',h('small','ÓRBITA DE APRENDIZADO'),h('b',snap.goal?snap.complete?'Revise sua evolução':snap.current.title:'Escolha seu próximo objetivo'),h('small',snap.goal?`${snap.applied} de ${snap.total} ações aplicadas · ${spaceName(space)}`:'Sete missões. Um passo real por vez.')),h('span',{'aria-hidden':'true'},'›'));
}

export function renderLearning(root) {
  const space=active(),snap=journeySnapshot(store.getState(),space);
  const page=h('div.orbit-page');
  page.append(h('div.orbit-page-head',h('div',h('small.orbit-eyebrow','BIVVO · ÓRBITA'),h('h1',snap.goal?snap.goal.title:'Aprenda. Experimente. Aplique.'),h('p','Sete missões, no seu ritmo. Cada ação tem um motivo.')),h('button.orbit-link',{type:'button',onclick:()=>openLearningGoal({space})},snap.goal?'Mudar objetivo':'Escolher objetivo')));
  if(!snap.goal){page.append(h('section.orbit-surface.orbit-welcome',h('div',h('span.orbit-eyebrow','UM NOVO JEITO DE APRENDER'),h('h2','Seu dinheiro pode fazer sentido.'),h('p','Entenda uma ideia, teste numa simulação e leve uma decisão para sua vida.'),h('button.orbit-button',{type:'button',onclick:()=>openLearningGoal({space})},'Escolher meu objetivo')),orbitArt(snap)));root.append(page);return;}
  page.append(h('section.orbit-surface.orbit-map',h('div.orbit-map-copy',h('span.orbit-eyebrow',`JORNADA ${spaceName(space).toUpperCase()}`),h('h2',snap.complete?'Uma nova visão para suas decisões.':'Um passo abre o próximo.'),h('p',snap.complete?'Você concluiu as sete missões deste objetivo. Continue revisando e aplicando no seu ritmo.':'Entenda uma ideia. Teste um cenário. Aplique uma ação.'),h('div.orbit-progress-pair',h('div',h('strong',String(snap.understood)),h('span','conceitos entendidos')),h('div',h('strong',String(snap.applied)),h('span','ações aplicadas'))),h('p.orbit-helper','Este mapa acompanha seu aprendizado e suas ações.')),orbitArt(snap,{interactive:true})));
  if(snap.current)page.append(missionCard(snap,space));
  page.append(h('details.orbit-path',h('summary','Ver os sete passos da jornada'),h('ol',snap.steps.map(step=>h('li'+(step.applied?'.done':''),h('span',step.applied?'✓':String(step.index+1).padStart(2,'0')),h('div',h('b',step.title),h('small',step.applied?'Entendido e aplicado':step.id===snap.current?.id?'Sua missão atual':'Abre após a missão anterior')))))));
  if(snap.applied>0)page.append(evolutionCard(space),h('button.orbit-button',{type:'button',onclick:()=>openStoryComposer({template:'mission',space})},'Criar card das minhas missões'));
  page.append(h('button.orbit-link',{type:'button',onclick:()=>space==='couple'?go('familia',{couple:'1'}):go('inicio')},space==='couple'?'Voltar ao painel do casal':'Voltar ao início'));
  root.append(page);
}

function missionCard(snap,space) {
  const mission=snap.current, stage=mission.understood?mission.practiced?'APLICAR':'EXPERIMENTAR':'ENTENDER';
  return h('section.orbit-mission',h('div.orbit-mission-top',h('span.orbit-eyebrow',`MISSÃO ${String(mission.index+1).padStart(2,'0')} / 07`),h('span.orbit-phase-pill',stage)),h('h2',mission.title),h('p',mission.understood?mission.practiced?'Você entendeu a ideia e testou o cenário. Agora leve uma ação para o Bivvo.':'Você entendeu a ideia. Experimente como os números mudam.':'Uma explicação curta. Uma pergunta. Um próximo passo possível.'),h('button.orbit-button',{type:'button',onclick:()=>openLearningMission(mission.id,space)},mission.understood?'Continuar missão':'Abrir minha missão'));
}

function exerciseView(step,onDone) {
  const config={
    cards:{min:1,max:12,value:12,unit:'parcelas',label:'Número de parcelas',intro:'Compra de R$ 1.200 sem juros. Mude o prazo e observe a parcela e o total.',read:r=>[money(r.primary)+' / mês',`Total: ${money(r.total)}. O prazo distribui o compromisso; não reduz o custo.`]},
    reserve:{min:1,max:12,value:3,unit:'meses',label:'Meses de proteção',intro:'Essenciais de R$ 1.800 por mês. Explore um cenário de proteção.',read:r=>[money(r.primary),`${r.months} mês(es) × R$ 1.800. Adapte a referência à sua realidade.`]},
    debt:{min:9,max:24,value:12,unit:'meses',label:'Prazo do compromisso',intro:'Valor recebido: R$ 1.000. Parcela de R$ 120. Mude o prazo e veja o custo total.',read:r=>[money(r.total),`Diferença sobre o valor recebido: ${money(r.cost)}. Confira juros e taxas de uma proposta real.`]},
    split:{min:0,max:6000,value:3000,unit:'R$',label:'Renda da pessoa A',intro:'Conta de R$ 1.500. A pessoa B recebe R$ 2.000. Compare uma divisão proporcional.',read:r=>[money(r.primary)+' para A',`${money(r.other)} para B · A participa com ${Math.round(r.share*100)}% da renda. É um cenário para conversar.`]},
    margin:{min:0,max:100,value:55,unit:'R$',label:'Custo variável por venda',intro:'Preço de R$ 100. Mude o custo variável e veja a contribuição antes dos custos fixos.',read:r=>[money(r.primary),`${Math.round(r.share*100)}% de contribuição sobre o preço. Ainda não é lucro líquido.`]},
    budget:{min:0,max:1500,value:500,unit:'R$',label:'Gastos variáveis planejados',intro:'Renda de R$ 3.000, essenciais de R$ 1.800 e meta de R$ 300.',read:r=>[money(r.primary),r.primary<0?'O cenário ultrapassa a renda. Revise as escolhas.':'Valor que sobra neste cenário depois das escolhas informadas.']},
    free:{min:0,max:1600,value:800,unit:'R$',label:'Compromissos conhecidos',intro:'Saldo ilustrativo de R$ 1.200. Ajuste as contas e veja quanto sobra.',read:r=>[money(r.primary),r.primary<0?'Os compromissos ultrapassam o saldo neste cenário.':'Referência após essas contas. Outros gastos ainda podem mudar o resultado.']}
  }[step.exercise];
  let interacted=false;
  const output=h('div.orbit-experiment-result',{'aria-live':'polite'}),readout=h('output');
  const range=h('input.orbit-range',{type:'range',min:config.min,max:config.max,step:config.unit==='R$'?step.exercise==='margin'?1:50:1,value:config.value,'aria-label':config.label});
  const finish=h('button.orbit-button',{type:'button',disabled:true,onclick:onDone},'Levar para minha vida');
  const paint=()=>{const value=Number(range.value),r=exerciseResult(step.exercise,value),[headline,note]=config.read(r);readout.textContent=config.unit==='R$'?money(value):`${value} ${config.unit}`;output.replaceChildren(h('strong',headline),h('p',note));};
  range.addEventListener('input',()=>{interacted=true;finish.disabled=!interacted;paint();});paint();
  return h('div.orbit-experiment',h('span.orbit-eyebrow','LABORATÓRIO · CENÁRIO ILUSTRATIVO'),h('h3','Mude uma escolha. Veja o efeito.'),h('p',config.intro),h('label.orbit-range-label',h('span',config.label),readout,range),output,h('p.orbit-helper','Esta simulação não altera seu saldo nem cria lançamentos.'),finish);
}

async function practiceAction(task,space) {
  if(space==='couple'){go('familia',{couple:'1',...(task==='split'?{tab:'divisao'}:{})});return;}
  if(task==='balance'){const m=await import('./onboarding.js');space==='company'?m.openOpeningBalance():m.startOnboarding({skipLearningGoal:true});return;}
  if(task==='record'){(await import('./forms.js')).openTxForm({mode:'expense'});return;}
  if(task==='cards'){go('cartoes');return;}
  if(task==='reserve'){const s=store.getState();if(s.goals.some(g=>g.isReserve||/reserva/i.test(g.name||''))){go('planos',{tab:'metas'});return;}(await import('./forms.js')).openGoalForm(null,{name:space==='company'?'Reserva do negócio':'Reserva de emergência',emoji:'✧',isReserve:true});return;}
  if(task==='budget'){go('planos',{tab:'orcamento'});return;}
  if(['margin','pricing'].includes(task)){go('planos',{tab:'produtos'});return;}
  if(task==='costs'){go('planos',{tab:'fixas'});return;}
  if(task==='decision'){(await import('./simulator.js')).openSimulator();return;}
  if(task==='debt'){go('jornada');return;}
  if(task==='review'){go('inicio');return;}
  go('calendario');
}

export function openLearningMission(id,space=active()) {
  let sheet, unsubscribe=()=>{}, phase=0, feedback='', chosen=-1, alternative=false, confirmed=false, saved=false;
  let step=journeySnapshot(store.getState(),space).steps.find(x=>x.id===id);
  if(!step)return;
  try{if(startLearningLesson(id,space))event('learning_lesson_started',space,id);}catch(e){toast(e.message);return;}
  phase=step.applied?3:step.practiced?2:step.understood?1:0;
  const content=h('div.orbit-surface.orbit-lesson');
  const paint=()=>{
    step=journeySnapshot(store.getState(),space).steps.find(x=>x.id===id);if(!step)return;
    content.replaceChildren(h('div.orbit-lesson-steps',...[['Entender',0],['Experimentar',1],['Aplicar',2]].map(([title,i])=>h('span'+(phase>=i?'.active':''),h('i',phase>i?'✓':String(i+1)),title))));
    if(phase===3){content.append(h('div.orbit-success',h('span.orbit-success-mark',{'aria-hidden':'true'},'✧'),h('span.orbit-eyebrow','ENTENDIDO + APLICADO'),h('h3','Uma decisão ganhou clareza.'),h('p',LEARNING_LESSONS[id].feedback),h('small',step.evidence==='record-reviewed'?'Registro existente conferido por você.':'Ação confirmada por você.'),h('button.orbit-button',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>jump('aprender',space),180);}},'Ver meu próximo passo')));return;}
    if(phase===0){content.append(h('p.orbit-concept',step.concept),h('div.orbit-example',h('small','EXEMPLO'),h('p',step.example)),h('fieldset.orbit-quiz',h('legend',step.question),step.options.map((option,i)=>h('button.orbit-answer'+(chosen===i?'.selected':''),{type:'button','aria-pressed':chosen===i,onclick:()=>{chosen=i;const answer=answerLearningLesson(id,i,space);feedback=answer.correct?step.feedback:'Vamos rever: '+step.feedback;paint();if(answer.changed)event('learning_concept_understood',space,id);}},h('span',String.fromCharCode(65+i)),option))),...(feedback?[h('p.orbit-feedback',{role:'status'},feedback)]:[]),h('p.orbit-helper',chosen<0?'Escolha uma resposta para continuar.':chosen!==step.correct?'Reveja a explicação e escolha outra resposta para liberar a próxima etapa.':'Resposta correta. Continue para experimentar o conceito.'),h('button.orbit-button',{type:'button',disabled:chosen!==step.correct,onclick:()=>{if(chosen!==step.correct)return;feedback='';phase=1;paint();sheet.el.querySelector('.sheet-body').scrollTop=0;}},'Continuar para experimentar'));return;}
    if(phase===1){content.append(exerciseView(step,()=>{if(practiceLearningLesson(id,space))event('learning_simulation_completed',space,id);feedback='';phase=2;paint();}));return;}
    const evidence=learningEvidence(id,store.getState(),space);
    const note=h('p.orbit-feedback',{role:'status'},feedback||evidence.label);
    const verify=h('input',{type:'checkbox',checked:confirmed,'aria-label':'Confirmei minha ação'});
    const confirmBtn=h('button.orbit-button',{type:'button',disabled:!confirmed||(!evidence.ready&&!alternative),onclick:()=>{
      if(saved)return;try{const changed=applyLearningLesson(id,{confirmed,alternative},space);saved=true;phase=3;paint();if(changed)event('learning_action_applied',space,id);const snap=journeySnapshot(store.getState(),space);if(changed&&snap.complete)event('learning_journey_completed',space,snap.goal.id);if(changed&&id==='review')event('learning_review_completed',space,id);}catch(e){feedback=e.message;paint();}
    }},'Concluir esta missão');
    verify.addEventListener('change',()=>{confirmed=verify.checked;confirmBtn.disabled=!confirmed||(!evidence.ready&&!alternative);});
    const alternativeCopy={record:'Revisei o período e não tenho gastos para registrar agora.',costs:'Identifiquei os custos que preciso levantar antes de cadastrar.',margin:'Calculei um cenário e defini quais dados reais preciso conferir.',pricing:'Comparei custo e preço num cenário e defini o que preciso conferir.'};
    const alt=evidence.manual&&!evidence.ready?h('label.orbit-check',h('input',{type:'checkbox',checked:alternative,'aria-label':'Confirmar alternativa da missão',onchange:e=>{alternative=e.target.checked;confirmBtn.disabled=!confirmed||(!evidence.ready&&!alternative);}}),h('span',space==='couple'?'Conferi o espaço compartilhado ou defini um acordo para conversar.':alternativeCopy[step.task]|| (step.task==='cards'?'Não uso cartão. Revisei como evitar assumir esse compromisso sem necessidade.':step.task==='reserve'?'Escolhi uma primeira meta possível, mesmo sem cadastrar uma reserva agora.':step.task==='commitments'?'Conferi e não tenho outros compromissos para cadastrar agora.':step.task==='budget'?'Defini um limite possível antes de cadastrá-lo.':step.task==='review'?'Revisei entradas, gastos e próximos compromissos.':step.task==='decision'?'Testei um cenário e escolhi meu próximo passo.':'Conferi a pendência e defini uma ação possível.'))):null;
    content.append(h('span.orbit-eyebrow','AGORA, NO SEU BIVVO'),h('h3','Uma ação possível para hoje.'),h('p',step.feedback),h('button.orbit-action',{type:'button',onclick:async()=>{try{await practiceAction(step.task,space);}catch(e){feedback=e.message;paint();}}},step.actionLabel,' ›'),note,alt,h('label.orbit-check',verify,h('span',evidence.ready?'Conferi esse registro e entendi o que fazer com ele.':'Realizei ou revisei a ação escolhida.')),confirmBtn,h('p.orbit-helper','Aprender não exige gastar, contratar crédito ou guardar um valor que não cabe na sua realidade.'));
  };
  sheet=openSheet({title:step.title,subtitle:`Missão ${step.index+1} de 7 · ${spaceName(space)}`,content});
  unsubscribe=store.onChange(()=>{if(phase===2)paint();});
  // openSheet calls onClose for all closing paths, including browser Back.
  const close=sheet.close.bind(sheet);sheet.close=result=>{unsubscribe();close(result);};
  paint();
}

function evolutionCard(space) {
  const snap=journeySnapshot(store.getState(),space);
  const notes=[];
  if(space==='personal'){const state=store.getState(),week=F.computeFresh(()=>F.weekSummary(state));notes.push(`${week.next7.length} compromisso(s) encontrado(s) para os próximos sete dias.`);notes.push('Mais registros podem aumentar o total visível sem significar que você gastou mais.');}
  else notes.push(space==='couple'?'Sua revisão educativa usa os acordos confirmados, sem ler o financeiro pessoal.':'Confira também datas de recebimento, custos e compromissos do negócio.');
  return h('section.orbit-evolution',h('div',h('span.orbit-eyebrow','EVIDÊNCIAS DA SUA EVOLUÇÃO'),h('h3','Pequenos passos, visíveis.'),h('p',`Você entendeu ${snap.understood} conceito(s) e aplicou ${snap.applied} ação(ões) neste objetivo.`),h('button.orbit-link',{type:'button',onclick:()=>openLearningReview(space)},'Revisar esta semana')),h('details',h('summary','O que vale revisar agora'),notes.map(note=>h('p',note)),h('button.orbit-link',{type:'button',onclick:()=>openLearningMission(snap.current?.id||'review',space)},snap.current?'Continuar minha missão':'Reabrir minha revisão')));
}

export function renderLearningHome(root,renderFull) {
  const state=store.getState(),space='personal',snap=journeySnapshot(state,space),base=F.hasBalanceBase(state);
  const sp=base?F.computeFresh(()=>F.spendable(state)):null;
  const page=h('div.orbit-home');
  page.append(h('header.orbit-home-head',h('div',h('small.orbit-eyebrow','SEU DINHEIRO · SEU PRÓXIMO PASSO'),h('h1',state.profile.name?`Vamos com calma, ${state.profile.name}.`:'Uma escolha de cada vez.')),h('button.orbit-link',{type:'button',onclick:()=>openLearningGoal({space})},snap.goal?'Mudar foco':'Escolher foco')));
  page.append(h('section.orbit-surface.orbit-money',h('div.orbit-money-copy',h('span.orbit-eyebrow',base?'REFERÊNCIA PELOS DADOS REGISTRADOS':'SEU PONTO DE PARTIDA'),h('h2',base?sp.free<0?'Priorize seus compromissos.':'Seu dinheiro tem um horizonte.':'Antes do número, uma escolha.'),h('div.orbit-money-value',h('strong',base?money0(sp.free<0?-sp.free:Math.max(0,sp.perDay)):'Comece aqui'),h('span',base?sp.free<0?'diferença a cobrir':'estimativa por dia':'sem precisar saber tudo')),h('p',base?`Até ${shortDate(sp.until)} · contas e metas informadas entram no cálculo.`:'Escolha um objetivo. Depois, informe renda, saldo e contas para entender o próximo passo.'),h('button.orbit-action',{type:'button',onclick:()=>base?jump('aprender',space):openLearningGoal({space,onChosen:()=>import('./onboarding.js').then(m=>m.startOnboarding({skipLearningGoal:true}))})},base?'Ver minha órbita ›':'Escolher objetivo e começar ›'),h('small.orbit-data-note',base?'Estimativa, não garantia. Confira contas esquecidas e mudanças na renda.':'Seus valores ficam no Bivvo. A demonstração usa dados fictícios.')),orbitArt(snap)));
  page.append(snap.current?missionCard(snap,space):snap.complete?learningLaunchCard(space):h('button.orbit-mission.orbit-intent',{type:'button',onclick:()=>openLearningGoal({space})},h('span.orbit-eyebrow','MISSÃO ZERO'),h('h2','O que você quer resolver primeiro?'),h('p','Gastos, cartões, dívidas ou reserva. A próxima missão começa na sua escolha.'),h('span.orbit-intent-cta','Escolher meu objetivo ›')));
  const pending=state.transactions.filter(t=>store.recordVisible(t,state)&&t.type==='expense'&&t.method!=='Crédito'&&t.status!=='Pago').map(t=>({label:t.desc,value:t.value,date:t.date}));
  for(const card of state.cards)for(const invoice of F.computeFresh(()=>F.cardStatus(card,state)).invoices)if(invoice.unpaid>0&&invoice.dueDate)pending.push({label:`Fatura ${card.name}`,value:invoice.unpaid,date:invoice.dueDate});
  pending.sort((a,b)=>a.date.localeCompare(b.date));const next=pending[0];
  page.append(h('section.orbit-next',h('div',h('span.orbit-eyebrow','O QUE MERECE ATENÇÃO'),h('h3',next?next.date<today()?'Confira um compromisso vencido.':'Seu próximo compromisso.':base?'Confira se está tudo registrado.':'Monte uma referência confiável.'),h('p',next?`${next.label} · ${money(next.value)} · ${shortDate(next.date)}`:base?'Não encontramos contas pendentes nos registros. Veja se faltou alguma.':'Renda, saldo e próximas contas ajudam a dar sentido ao cálculo.')),h('button.orbit-link',{type:'button',onclick:()=>next||base?go('calendario'):import('./onboarding.js').then(m=>m.startOnboarding({}))},next||base?'Conferir agenda ›':'Configurar meu Bivvo ›')));
  page.append(h('div.orbit-home-tools',h('button',{type:'button',onclick:()=>import('./forms.js').then(m=>m.openTxForm({mode:'expense'}))},h('span',{'aria-hidden':'true'},'+'),'Registrar um gasto'),h('button',{type:'button',onclick:()=>import('./simulator.js').then(m=>m.openSimulator())},h('span',{'aria-hidden':'true'},'⌁'),'Simular uma compra'),h('button',{type:'button',onclick:()=>go('assistente')},h('span',{'aria-hidden':'true'},'✦'),'Perguntar ao Bivvo')));
  if(snap.applied>0)page.append(evolutionCard(space),h('button.orbit-button',{type:'button',onclick:()=>openStoryComposer({template:'mission',space})},'Criar card das minhas missões'));
  let mounted=false;const host=h('div.orbit-full-host');const full=h('details.orbit-full',h('summary','Abrir meu painel completo'),host);full.addEventListener('toggle',()=>{if(full.open&&!mounted){mounted=true;renderFull(host);}});page.append(full);
  root.append(page);
}

export function openLearningReview(space=active()) {
  const snap=journeySnapshot(store.getState(),space);if(snap.applied<1){toast('Aplique sua primeira missão para abrir a revisão.');return;}
  const data=store.getState(), notes=[];let chosen='',confirmed=false;
  if(space!=='couple'){const week=F.computeFresh(()=>F.weekSummary(data));notes.push(`${money(week.spent)} em gastos variáveis encontrados nesta semana.`);notes.push(`${week.next7.length} compromisso(s) encontrado(s) para os próximos sete dias.`);}else notes.push('Abra o painel do casal e confira apenas os registros compartilhados.');
  const choices=h('div.orbit-review-choices');
  const submit=h('button.orbit-button',{type:'button',disabled:true,onclick:()=>{if(!chosen||!confirmed)return;try{if(reviewLearningWeek(chosen,space))event('learning_review_completed',space,'weekly');sheet.close();toast('Revisão salva. Seu próximo passo ficou escolhido.');}catch(e){toast(e.message);}}},'Salvar minha revisão');
  const paint=()=>choices.replaceChildren(...[['records','Atualizar registros'],['bills','Conferir uma conta'],['budget','Revisar um limite'],['reserve','Revisar minha meta']].map(([id,label])=>h('button.orbit-answer'+(chosen===id?'.selected':''),{type:'button','aria-pressed':chosen===id,onclick:()=>{chosen=id;submit.disabled=!confirmed;paint();}},label)));
  const sheet=openSheet({title:'Sua revisão da semana',subtitle:'Uma decisão possível, sem cobrança de perfeição.',content:h('div.orbit-surface.orbit-lesson',h('span.orbit-eyebrow','REVISAR · ESCOLHER · CONTINUAR'),h('h3','O que merece seu próximo passo?'),notes.map(note=>h('p',note)),h('p.orbit-helper','O total reflete os registros encontrados. Informações ausentes ou recém-adicionadas mudam a leitura.'),choices,h('label.orbit-check',h('input',{type:'checkbox','aria-label':'Conferi os registros desta semana',onchange:e=>{confirmed=e.target.checked;submit.disabled=!chosen||!confirmed;}}),h('span','Conferi os registros e escolhi uma ação que cabe na minha realidade.'))),footer:[submit]});paint();
}
