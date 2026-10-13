/* Bivvo — Fase 2: previsão por horizonte, com profundidade premium e cálculo local. */
import { h, money0, shortDate } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { canUseFeature, getUserPlan } from '../plans.js';
import { sectionTitle } from '../ui.js';
import { stat } from './components.js';
import { openPaywall } from './pro.js';
import { track } from '../analytics.js';

export function renderForecast(root) {
  const s = store.getState(), plan = getUserPlan();
  const f7 = F.dailyForecast(7, s);
  const has30 = canUseFeature('forecast30'), has90 = canUseFeature('advancedForecast');
  const f30 = has30 ? F.dailyForecast(30, s) : null;
  const f90 = has90 ? F.dailyForecast(90, s) : null;
  const main = f90 || f30 || f7;
  track('spendable_seen', { source:'forecast' });

  root.append(h('div.page-head', h('div', h('h2.h2', 'Previsão financeira'), h('p.muted', 'Uma estimativa baseada nos seus lançamentos, contas, faturas e ritmo recente de gastos.'))));
  root.append(h('section.card.forecast-hero' + (main.risk ? '.warn' : '.ok'),
    h('p.eyebrow-soft', main.risk ? 'Atenção antecipada' : `Próximos ${main.days} dias`),
    h('h3', main.risk ? `Risco de saldo negativo em ${shortDate(main.risk.date)}` : `Saldo estimado em ${main.days} dias: ${money0(main.endBalance)}`),
    h('p.muted', main.risk ? `Nesse dia a projeção chega a ${money0(main.risk.balance)}.` : 'Com os dados atuais, a projeção não cruza zero nesse período.')));

  root.append(h('section.card', sectionTitle('Horizontes'), h('div.stats',
    stat('7 dias', money0(f7.endBalance), 'Grátis', f7.endBalance < 0 ? 'neg' : ''),
    has30 ? stat('30 dias', money0(f30.endBalance), plan === 'plus' ? 'Plus' : 'Incluído', f30.endBalance < 0 ? 'neg' : '') : h('button.premium-lock', {type:'button', onclick:()=>openPaywall({feature:'forecast30'})}, h('b','30 dias'), h('span','Plus · desbloquear')),
    has90 ? stat('90 dias', money0(f90.endBalance), 'Pro', f90.endBalance < 0 ? 'neg' : '') : h('button.premium-lock', {type:'button', onclick:()=>openPaywall({feature:'advancedForecast'})}, h('b','90 dias'), h('span','Pro · desbloquear'))),
    h('p.hint', main.estimated ? `Inclui uma estimativa de ${money0(main.variablePerDay)}/dia para gastos variáveis, calculada pelo seu histórico recente.` : 'Ainda não há histórico suficiente de gastos variáveis para estimar um ritmo diário.')));

  const notable=main.rows.filter(r=>r.events.length || r.balance<0).slice(0,24);
  root.append(h('section.card', sectionTitle(`Linha do tempo · ${main.days} dias`), notable.length ? h('div.forecast-list', notable.map(r=>h('div.forecast-row',
    h('div', h('b', shortDate(r.date)), h('small.muted', r.events.length ? r.events.map(e=>e.label).join(' · ') : 'Saldo projetado')),
    h('strong.'+(r.balance<0?'down':'up'), money0(r.balance))))) : h('p.muted.sm','Nenhum compromisso relevante encontrado nesse período.')),
    h('p.hint','Previsão não é garantia. Valores estimados são identificados e mudam quando seus lançamentos mudam.'));
}
