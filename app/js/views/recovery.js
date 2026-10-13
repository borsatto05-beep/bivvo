import { h, money, today, parseISO } from '../util.js';
import * as store from '../store.js';
import { openSheet, toast } from '../ui.js';
import { go, rerender } from '../nav.js';
import { recoverySnapshot, saveDailyCheckin, todayCheckin } from '../recovery.js';

const CRISIS_CTX='bivvo_recovery_crisis_context_v1';
const naturalDate=iso=>{try{return parseISO(iso).toLocaleDateString('pt-BR',{day:'numeric',month:'long'});}catch{return String(iso||'');}};
const icon={CRITICAL:'🔴',RECOVERY:'🟠',CONTROL:'🟡',STABLE:'🟢',GROWTH:'🔵'};

export function recoveryHomeCard(s=store.getState()){
  const r=recoverySnapshot(s), checked=todayCheckin(s);
  const check=checked?null:h('div.recovery-checkin',h('b','Como está seu dinheiro hoje?'),h('div.recovery-checkin-grid',
    ...[['crisis','😰','Não vai dar'],['tight','😟','Apertado'],['ok','😐','Dá para passar'],['calm','🙂','Tranquilo']].map(([v,e,l])=>h('button.recovery-feel',{type:'button',onclick:()=>{saveDailyCheckin(v);if(v==='crisis')openCrisisMode();else{toast('Check-in salvo.');rerender();}}},h('span',e),h('small',l)))));
  return h('section.card.recovery-hero',
    h('div.recovery-stage',h('span.recovery-dot',icon[r.stage.id]),h('div',h('small','SUA JORNADA AGORA'),h('h2',r.stage.label))),
    h('p.recovery-reason',r.stage.reason),
    h('div.recovery-money',h('div',h('small','Você tem'),h('b',money(r.money.balance))),h('div',h('small','Protegido'),h('b',money(r.money.protected))),h('div',h('small','Livre de verdade'),h('strong',money(r.money.free)))),
    r.money.free>0?h('p.recovery-daily',`Referência: ${money(r.money.perDay)} por dia por ${r.money.days} dia(s).`):h('p.recovery-daily.danger','Agora a prioridade é proteger o essencial antes de assumir novos gastos.'),
    h('div.recovery-mission',h('small','SUA MISSÃO DE HOJE'),h('b',r.priority.title),h('p',r.priority.detail)),
    h('div.btn-row',h('button.btn.primary',{type:'button',onclick:()=>r.stage.id==='CRITICAL'?openCrisisMode():openJourney()},r.stage.id==='CRITICAL'?'🚨 Preciso de ajuda':'Minha jornada'),h('button.btn',{type:'button',onclick:()=>go('assistente')},'Perguntar ao Bivvo')),
    check);
}

export function openCrisisMode(){
  const r=recoverySnapshot(), priorities=[];
  try{sessionStorage.setItem(CRISIS_CTX,JSON.stringify({active:true,at:Date.now(),free:r.money.free,perDay:r.money.perDay,days:r.money.days,until:r.money.until}));}catch{}
  if(r.money.protected>0) priorities.push('Proteja primeiro as contas e compromissos que vencem antes da próxima entrada.');
  if(r.survival.amount>0) priorities.push(`Seu mínimo essencial estimado no mês é ${money(r.survival.amount)}.`);
  priorities.push(r.priority.detail);
  openSheet({title:'🚨 Meu dinheiro não vai dar',subtitle:'Vamos reduzir o problema ao próximo passo possível.',content:[
    h('div.crisis-summary',h('div',h('small','Disponível'),h('b',money(r.money.balance))),h('div',h('small','Protegido'),h('b',money(r.money.protected))),h('div',h('small','Livre'),h('strong',money(r.money.free)))),
    r.money.free>0?h('div.notice.warn',h('b',`Você tem ${money(r.money.perDay)} por dia pelos próximos ${r.money.days} dias.`),h('span','Use isso como referência temporária enquanto protege seus compromissos.')):null,
    h('div.notice.warn',h('b','Primeiro: mantenha sua vida funcionando.'),h('span','Moradia, alimentação, água, energia, transporte necessário e saúde vêm antes de gastos adiáveis. Ajuste as prioridades conforme sua realidade.')),
    h('ol.recovery-priorities',...priorities.slice(0,3).map(x=>h('li',x))),
    h('p.hint','Estas são recomendações com base nos dados cadastrados, não decisões automáticas. Valores essenciais são estimativas e podem ser ajustados por você.'),
    h('button.btn.primary',{type:'button',onclick:()=>go('assistente')},'Montar meu plano')
  ]});
}

export function openJourney(){
  const r=recoverySnapshot(), stages=[['CRITICAL','Sobrevivência'],['RECOVERY','Recuperação'],['CONTROL','Controle'],['STABLE','Estabilidade'],['GROWTH','Crescimento']];
  const pos=stages.findIndex(x=>x[0]===r.stage.id);
  openSheet({title:'Minha Jornada',subtitle:'Progresso, não perfeição.',content:[
    h('div.journey-list',...stages.map((x,i)=>h('div.journey-step'+(i===pos?'.current':''),h('span',i<pos?'✓':i===pos?'●':'○'),h('div',h('b',x[1]),i===pos?h('small','Você está aqui'):null)))),
    h('div.card.soft',h('b',`Bivvo Score: ${r.motivation.score}/100`),h('p',r.motivation.level),r.motivation.improve?.[0]?h('small',`Próximo foco: ${r.motivation.improve[0].action}`):null),
    h('p.hint',`Leitura atualizada em ${today().split('-').reverse().join('/')}. O Bivvo só mostra evolução que consegue derivar dos seus dados.`)
  ]});
}

export function renderRecovery(root){
  const s=store.getState(); root.append(h('div.home-head',h('h1','Minha Jornada'),h('p.muted','Seu caminho do aperto ao controle.')),recoveryHomeCard(s));
}
