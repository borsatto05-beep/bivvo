/* Bivvo 11.21 — comparador visual do Assistente de Decisão Financeira. */
import { h, money, shortDate } from '../util.js';
import { openSheet } from '../ui.js';
import { analyzeFinancialDecision } from '../decision.js';

const riskLabel={baixo:'🟢 Baixo risco',atencao:'🟡 Atenção',alto:'🔴 Alto risco'};
function list(title,rows,key='value'){
  if(!rows.length)return null;
  return h('div.decision-list',h('b',title),rows.map(x=>h('div.decision-line',h('span',h('strong',x.label),h('small',`${shortDate(x.date)} · ${x.priority}`)),h('b',money(x[key]??x.value)))));
}
export function openDecisionAssistant(){
  const r=analyzeFinancialDecision();
  const intro=r.obligations.length
    ? h('div.decision-summary'+(r.tight?'.tight':''),h('small.eyebrow-soft',r.tight?'DINHEIRO APERTADO':'ORDEM DE PAGAMENTO'),h('h3',r.tight?'Seu dinheiro não cobre todos os próximos compromissos.':'Seus compromissos cabem no saldo atual.'),h('p',r.tight?'Vamos organizar isso sem esconder o que fica pendente.':'Veja uma ordem segura para organizar os pagamentos.'),h('div.decision-kpis',h('div',h('small','Você tem'),h('b',money(r.balance))),h('div',h('small','Precisa cobrir'),h('b',money(r.total))),h('div',h('small',r.deficit?'Está faltando':'Sobra depois'),h('b',money(r.deficit||Math.max(0,r.balance-r.total))))))
    : h('div.decision-summary',h('h3','Nada pendente até sua próxima entrada'),h('p','Quando houver contas ou faturas nesse período, o Bivvo compara as opções aqui.'));
  const cards=r.scenarios.map((x,i)=>h('article.decision-scenario'+(x.recommended?'.recommended':''),
    h('div.decision-card-head',h('div',h('small',`OPÇÃO ${i+1}`),h('h3',x.title)),x.recommended?h('span.decision-badge','★ RECOMENDADO'):null),
    h('p.decision-risk',riskLabel[x.risk]),
    list('Pagar agora',x.paid),list('Reservar / parcial',x.reserved,'reserved'),list('Continua descoberto',x.uncovered),
    h('div.decision-forecast',h('span','Saldo projetado em 7 dias',h('b',money(x.forecast7))),h('span','Saldo projetado em 30 dias',h('b',money(x.forecast30)))),
    x.missing?h('p.decision-missing',`Ainda faltariam ${money(x.missing)} para cobrir tudo.`):h('p.decision-ok','Os compromissos analisados ficam cobertos.')));
  const notes=[]; if(r.reason)notes.push(h('p',r.reason)); for(const n of r.missingInfo)notes.push(h('p',n));
  return openSheet({label:'O que pago primeiro?',wide:true,content:h('div.decision-screen',intro,r.nextIncome?h('p.decision-next',`Próxima entrada considerada: ${shortDate(r.nextIncome.date)}${r.nextIncome.label?' · '+r.nextIncome.label:''}.`):null,cards.length?h('div.decision-grid',cards):null,notes.length?h('div.decision-notes',h('b','Por que o Bivvo recomenda isso?'),notes):null,h('p.hint','Simulação somente leitura. Nenhum lançamento será alterado ou marcado como pago.'))});
}
