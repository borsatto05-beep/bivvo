/* Bivvo — Início: "quanto posso gastar hoje" + o essencial do mês. */
import { h, money, money0, today, ymOf, addMonthsYM, monthName, dayLabel, shortDate, diffDays, pct, isoWeek, haptic,addDays } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { insights, challengeProgress, challengeDef } from '../insights.js';
import { openSheet, emptyState, sectionTitle, progress, countUp, toast } from '../ui.js';
import { txRow, stat, invoiceBars, ritmoArc, insightList } from './components.js';
import { openTxForm, openTxDetail, openCardForm, payInvoice } from './forms.js';
import { go, ctx } from '../nav.js';
import { openRetrospective, openYearWrapped, wrappedSeasonYear, yearFacts, openStoryComposer } from './stories.js';
import { captureBar } from '../quickcapture.js';
import { startOnboarding, openOpeningBalance } from './onboarding.js';
import { adminTrack } from '../admin-analytics.js';
import { openCopilot } from './copilot.js';
import { financialControlDetector } from '../copilot.js';
import { recoveryHomeCard } from './recovery.js';
import {favorites,canFavorite,removeFavorite} from '../experience.js';
import {homeVisible,openHomePreferences} from './homeprefs.js';
import {renderCompanyHome} from './company-home.js';
import {renderLearningHome,learningLaunchCard} from './learning.js';

function greeting(name) {
  const hr = new Date().getHours();
  const g = hr < 5 ? 'Boa noite' : hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${g}, ${name}` : g;
}

export function renderHome(root) {
  if(store.activeFinanceProfile()==='company'){root.append(learningLaunchCard('company'));renderCompanyHome(root);return;}
  // 11.65 — restaura o Início completo e mantém a Órbita como atalho compacto e clicável.
  root.append(learningLaunchCard('personal'));
  renderHomeFull(root);
}

function renderHomeFull(root) {
  if(store.activeFinanceProfile()==='company'){renderCompanyHome(root);return;}
  const s = store.getState();
  const t0 = today(), cur = ymOf(t0), prev = addMonthsYM(cur, -1);
  const hasData = s.transactions.length > 0 || s.cards.length > 0;
  const head = h('div.home-head', h('h1.greet', greeting(s.profile.name)), h('p.muted', dayLabel(t0) === 'Hoje' ? new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''));
  head.append(h('button.link.sm',{type:'button',onclick:openHomePreferences},'Personalizar início'));
  if (!hasData) {
    root.append(head, h('section.qc-shell',h('h2','Anotar por texto ou voz'),captureBar()), h('div.card.hero.empty-hero',
      h('p.eyebrow-soft', 'Seu dinheiro, mais claro'),
      h('h2', 'Comece pelo que você já sabe'),
      h('p', 'Registre quanto tem hoje e sua renda. Em menos de um minuto o Bivvo mostra quanto você pode gastar por dia até receber de novo.'),
      h('div.btn-row', h('button.btn.primary', { type: 'button', onclick: () => startOnboarding({}) }, 'Configurar em 1 minuto'), h('button.btn', { type: 'button', onclick: () => openTxForm({ mode: 'expense' }) }, 'Só registrar um gasto'))));
    return;
  }
  const sp = F.spendable(s);
  const controlDetector = financialControlDetector(s);
  const left = h('div.col'), right = h('div.col');
  left.append(recoveryHomeCard(s));

  /* ---------- herói: "quanto posso gastar" (resumo quando olho, detalhes quando toco) ---------- */
  const big = h('strong.hero-num');
  const untilTxt = sp.next.source === 'mes' ? 'o fim do mês' : longDate(sp.until);
  const explainBtn = h('button.btn.sm.hero-explain', { type: 'button', onclick: () => explainSpendable(sp) }, 'Entenda o cálculo');
  let hero;
  if (sp.state === 'negative') {
    hero = h('section.card.hero.neg.hero-alert', { 'aria-label': 'Quanto posso gastar até o próximo dinheiro' },
      h('div.hero-top', h('span.hero-label', h('span', { 'aria-hidden': 'true' }, '⚠️ '), 'Até seu próximo dinheiro')),
      h('h2.hero-headline', 'Seus compromissos precisam de atenção.'),
      h('p.hero-gap', 'Faltam ', h('strong', money(-sp.free)), ` para cobrir seus compromissos até ${untilTxt}.`),
      explainBtn);
  } else if (sp.state === 'zero') {
    hero = h('section.card.hero.warn.hero-alert', { 'aria-label': 'Quanto posso gastar até o próximo dinheiro' },
      h('div.hero-top', h('span.hero-label', 'Até seu próximo dinheiro')),
      h('h2.hero-headline', 'Seu dinheiro está comprometido com as contas.'),
      h('p.hero-gap', `O que você tem cobre exatamente seus compromissos até ${untilTxt}. Evite novos gastos.`),
      explainBtn);
  } else {
    hero = h('section.card.hero.' + sp.tone, { 'aria-label': 'Quanto posso gastar hoje' },
      h('div.hero-top', h('span.hero-label.hero-kicker', 'Você pode gastar')),
      h('div.hero-gauge', ritmoArc(sp.timeRatio, sp.moneyRatio, sp.tone), h('div.hero-center', big, h('span.hero-unit', 'por dia'))),
      h('p.hero-sub', `até ${untilTxt}`),
      h('p.hero-msg', sp.tone === 'warn' ? 'Você está gastando mais rápido do que o calendário anda.' : 'Sem comprometer suas contas e sua meta.'),
      explainBtn);
    countUp(big, sp.perDay, v => money0(v));
  }
  if(sp.state!=='positive')hero.append(h('button.btn.sm.primary',{type:'button',onclick:()=>go('calendario')},'Revisar próximas contas'));
  hero.append(h('button.hero-sim', { type: 'button', onclick: () => import('./simulator.js').then(m => m.openSimulator()) }, h('span', { 'aria-hidden': 'true' }, '🛍️'), 'Posso comprar? Simule antes'));
  if (!F.hasBalanceBase(s)) hero.append(h('button.btn.sm.hero-cta', { type: 'button', onclick: () => openOpeningBalance() }, 'Informar quanto tenho hoje'));
  left.prepend(hero);
  left.append(agendaCard(s),repeatCard(s),h('section.qc-shell',h('h2','Anotar por texto ou voz'),captureBar()));

  /* Fase 8.19.3 — ativação: chegar ao primeiro valor antes de pedir uso avançado. */
  const hasIncome = s.fixed.some(x => x.type === 'income') || s.transactions.some(t => F.isRealIncome(t));
  const hasOpening = s.transactions.some(t => F.isOpening(t));
  const hasBills = s.fixed.some(x => x.type === 'expense');
  const valueSeen = !!s.profile?.activationValueSeen;
  const activation = [
    ['Renda mensal', hasIncome, () => startOnboarding({})],
    ['Saldo de hoje', hasOpening, () => openOpeningBalance()],
    ['Próximas contas', hasBills, () => startOnboarding({})]
  ];
  const activationDone = activation.filter(x => x[1]).length;
  if (!valueSeen) {
    left.append(h('section.card.activation-card',
      h('div.card-head', h('div', h('small.eyebrow-soft','PRIMEIRO VALOR'), h('h3','Descubra quanto pode gastar')), h('b', `${activationDone}/3`)),
      h('p.muted.sm','Renda, saldo e contas principais. O resto pode ficar para depois.'),
      h('div.activation-list', activation.map(([label,done,fn]) => h('button.activation-item'+(done?'.done':''), { type:'button', disabled:done, onclick:fn }, h('span', done?'✓':'○'), h('span',label), done?null:h('span','›')))),
      h('button.btn.sm.primary',{type:'button',onclick:()=>startOnboarding({})},'Terminar configuração')));
    try { if (!sessionStorage.getItem('bivvo_activation_started_8193')) { sessionStorage.setItem('bivvo_activation_started_8193','1'); adminTrack('activation_started','home').catch(()=>{}); } } catch {}
  }

  /* 11.42.5 — recursos secundários ficam recolhidos na Início por padrão.
     A configuração ainda aparece normalmente enquanto estiver incompleta. */
  const optionalHome = [];
  if (valueSeen) {
    optionalHome.push(h('section.card.activation-card.done',
      h('small.eyebrow-soft','BIVVO CONFIGURADO'), h('h3','Agora você já tem uma visão do seu dinheiro'),
      h('p.muted.sm', sp.tone === 'neg' ? `Seus compromissos passam do saldo em ${money0(-sp.free)}.` : `${money0(sp.free)} estão livres até ${sp.next.source === 'mes' ? 'o fim do mês' : dayLabel(sp.until).toLowerCase()} — cerca de ${money0(sp.perDay)} por dia.`),
      h('div.btn-row',
        h('button.link.sm',{type:'button',onclick:()=>explainSpendable(sp)},'Entender esse cálculo'),
        !hasBills ? h('button.link.sm',{type:'button',onclick:()=>go('planos',{tab:'fixas'})},'Adicionar contas') : null)));
  }

  /* ---------- Bivvo Copiloto 11.22 ---------- */
  optionalHome.push(h('section.card.copilot-home',
    h('div.card-head',h('div',h('small.eyebrow-soft','BIVVO COPILOTO'),h('h3','O que preciso saber hoje?')),h('span.copilot-mini '+(sp.state==='negative'?'danger':sp.tone==='warn'?'warn':'ok'),sp.state==='negative'?'SOS':sp.tone==='warn'?'Atenção':'Em dia')),
    h('p.muted.sm',sp.state==='negative'?`Seus compromissos passam do dinheiro disponível em ${money0(-sp.free)}.`:`Você tem ${money0(Math.max(0,sp.free))} realmente livres — cerca de ${money0(sp.perDay)} por dia.`),
    controlDetector.top?h('div.copilot-home-risk',`⚠ ${controlDetector.top.title}`):h('div.copilot-home-risk','✓ Nenhum sinal forte de descontrole agora'),
    h('div.btn-row',h('button.btn.primary',{type:'button',onclick:()=>openCopilot()},'Abrir Copiloto'),h('button.btn',{type:'button',onclick:()=>openCopilot({sos:true})},'SOS financeiro'))));

  /* ---------- Fase 3: Bivvo IA ---------- */
  left.append(h('button.card.ai-home', { type:'button', onclick:()=>go('assistente') },
    h('span.ai-home-ico', {'aria-hidden':'true'}, '✦'),
    h('span', h('b','Pergunte ao Bivvo IA'), h('small','Entenda seu dinheiro com os números que o Bivvo já calculou.')) ,
    h('span.ai-home-go', {'aria-hidden':'true'}, '›')));

  /* Fechado por padrão: não polui a tela inicial, mas mantém os recursos acessíveis. */
  left.append(h('details.home-optional',
    h('summary.home-optional-summary',
      h('span', h('b','Mais recursos'), h('small','Copiloto e status da configuração')),
      h('span.home-optional-chevron',{'aria-hidden':'true'},'›')),
    h('div.home-optional-content', optionalHome)));

  /* ---------- Bivvo Wrapped (dezembro e janeiro) ---------- */
  const wy = wrappedSeasonYear();
  if (wy && yearFacts(wy, s).active.length >= 2) left.append(h('button.card.closing.wrapped', { type: 'button', onclick: () => openYearWrapped(wy) },
    h('span.closing-ico', { 'aria-hidden': 'true' }, '✦'), h('span', h('b', `Seu ${wy} no Bivvo`), h('small', 'A retrospectiva do seu ano está pronta. Veja e compartilhe.'))));

  /* ---------- mês ---------- */
  const a = F.monthSummary(cur, s), b = F.monthSummary(prev, s);
  const sameDay = Number(t0.slice(8));
  const prevSame = F.monthTx(prev, s).filter(t => F.isSpend(t) && Number(t.date.slice(8)) <= sameDay).reduce((x, t) => x + t.value, 0);
  const cmp = prevSame > 0 && sameDay >= 5 ? (a.spend - prevSame) / prevSame : null;


  left.append(h('section.card.month',{'aria-label':'Resumo do mês'},h('div.card-head',h('h3','Seu '+monthName(cur)),h('button.link.sm',{type:'button',onclick:()=>openRetrospective(cur)},'Ver meu mês')),h('div.stats',stat('Entrou',money0(a.incomePaid),a.income>a.incomePaid?`+${money0(a.income-a.incomePaid)} a receber`:null,'in'),stat('Gastei',money0(a.spend),a.planned?`+${money0(a.planned)} agendado`:null),stat('Guardei',money0(a.saved),a.income?`${Math.round(a.saved/a.income*100)}% da renda`:null))));

  /* ---------- fechamento do mês anterior (primeira semana) ---------- */
  if (sameDay <= 7 && b.count > 5) left.append(h('button.card.closing', { type: 'button', onclick: () => openRetrospective(prev) },
    h('span.closing-ico', { 'aria-hidden': 'true' }, '▶'), h('span', h('b', `${monthName(prev)[0].toUpperCase() + monthName(prev).slice(1)} fechou`), h('small', b.result >= 0 ? `Sobraram ${money0(b.result)}. Veja seu mês em 15 segundos.` : 'Veja o resumo do mês em 15 segundos.'))));

  /* ---------- insights ---------- */
  const ins = insights(3, s);
  if (ins.length) left.append(h('section.card.home-insights', sectionTitle('O que mudou'), insightList(ins)));

  /* ---------- check-in semanal ---------- */
  const wk = isoWeek(t0), done = (s.profile.checkins || []).includes(wk);
  const dow = new Date().getDay();
  if (!done && (ctx.demo || dow === 0 || dow === 1 || dow >= 5)) right.append(checkinCard());

  /* ---------- cartões ---------- */
  if (s.cards.length) {
    for (const c of s.cards.slice(0, 2)) {
      const st = F.cardStatus(c, s);
      const payable=st.due||(st.open.unpaid>0.004?st.open:null);
      const pick = h('p.muted.sm');
      const setPick = n => { pick.textContent = `Fatura de ${monthName(n.ym)}: ${money(n.total)}`; };
      setPick(st.next[0]);
      right.append(h('section.card.inv', { 'aria-label': `Cartão ${c.name}` },
        h('div.card-head', h('h3', c.name), h('button.link.sm', { type: 'button', onclick: () => go('cartoes', { c: c.id }) }, 'Detalhes')),
        h('div.inv-main', h('div', h('small', `Fatura de ${monthName(st.open.ym)} · fecha ${shortDate(st.open.closeDate)}`), h('strong', money(st.open.total))),
          payable ? h('button.btn.sm' + (payable.state === 'vencida' ? '.danger' : ''), { type: 'button', onclick: () => payInvoice(c, payable,{early:payable.state==='aberta'}) }, payable.state === 'vencida' ? `Fatura vencida · pagar ${money0(payable.unpaid)}` : `Pagar fatura · ${money0(payable.unpaid)}`) : null),
        invoiceBars(st.next, setPick), pick));
    }
  } else right.append(h('button.card.add-card', { type: 'button', onclick: () => openCardForm() }, h('b', 'Usa cartão de crédito?'), h('small', 'Adicione para ver a fatura de cada mês e quanto as parcelas já comprometem.')));

  /* ---------- próximas contas ---------- */
  const bills = s.transactions.filter(t => store.recordVisible(t,s) && t.type === 'expense' && t.method !== 'Crédito' && t.status !== 'Pago' && diffDays(t0, t.date) <= 15).sort((x, y) => x.date.localeCompare(y.date));
  const incomes = s.transactions.filter(t => store.recordVisible(t,s) && F.isRealIncome(t) && t.status !== 'Pago' && diffDays(t0, t.date) <= 15 && t.date >= t0).sort((x, y) => x.date.localeCompare(y.date));
  if (bills.length || incomes.length) {
    right.append(h('section.card', sectionTitle('Próximos 15 dias', { label: 'Calendário', fn: () => go('calendario') }),
      h('div.list', [...bills.slice(0, 5), ...incomes.slice(0, 2)].sort((x, y) => x.date.localeCompare(y.date)).map(t => txRow(t, { showDate: true }))),
      bills.length > 5 ? h('p.muted.sm', `E mais ${bills.length - 5} conta(s).`) : null));
  }

  /* ---------- Fase 1: Meu Dia / previsão ---------- */
  const f7 = F.dailyForecast(7, s), f30 = F.dailyForecast(30, s);
  const nextCommit = [...s.transactions].filter(t => t.type === 'expense' && t.method !== 'Crédito' && t.status !== 'Pago' && t.date >= t0).sort((a,b)=>a.date.localeCompare(b.date))[0];
  left.append(h('section.card.my-day',
    sectionTitle('Meu Dia · próximos 30 dias', { label: 'Ver previsão', fn: () => go('previsao') }),
    h('div.stats', stat('Em 7 dias', money0(f7.endBalance), null, f7.endBalance < 0 ? 'neg' : ''), stat('Em 30 dias', money0(f30.endBalance), null, f30.endBalance < 0 ? 'neg' : '')),
    f30.risk ? h('div.notice.warn', h('b', `⚠️ Dia de risco: ${shortDate(f30.risk.date)}`), h('span', `Saldo estimado em ${money0(f30.risk.balance)}.`)) : h('p.good-note', '✓ Nenhum dia negativo previsto nos próximos 30 dias.'),
    nextCommit ? h('p.muted.sm', `Próximo compromisso: ${nextCommit.desc} · ${money0(nextCommit.value)} · ${shortDate(nextCommit.date)}.`) : null,
    h('p.hint', f30.estimated ? 'A previsão inclui uma estimativa do seu ritmo recente de gastos variáveis.' : 'A previsão usa somente os compromissos encontrados nos seus dados.')));

  /* ---------- desafio ativo ---------- */
  const ch = s.challenges.find(c => c.status === 'active');
  if (ch) {
    const p = challengeProgress(ch, s), def = challengeDef(ch.type);
    right.append(h('button.card.challenge-mini', { type: 'button', onclick: () => go('planos', { tab: 'desafios' }) },
      h('span.ch-ico', { 'aria-hidden': 'true' }, def?.icon || '🏆'), h('span.ch-body', h('b', def?.title + (ch.cat ? ` · ${ch.cat}` : '')), h('small', p.label), progress(p.ratio, 1, p.invert ? (p.ratio >= 1 ? 'bad' : '') : 'good'))));
  }

  /* ---------- recentes ---------- */
  const recent = s.transactions.filter(t => store.recordVisible(t,s) && t.date <= t0 && (t.status === 'Pago' || t.method === 'Crédito')).sort((x, y) => y.date.localeCompare(x.date) || (y.createdAt || 0) - (x.createdAt || 0)).slice(0, 5);
  if (recent.length) left.append(h('section.card.home-recent', sectionTitle('Últimas movimentações', { label: 'Ver todas', fn: () => go('extrato') }), h('div.list', recent.map(t => txRow(t, { showDate: true })))));

  left.append(weeklyCard(s));
  const grid=h('div.home-grid',left,right);
  const map={month:'.month',favorites:'.home-favorites',weekly:'.home-weekly',agenda:'.home-agenda',cards:'.inv',recent:'.home-recent',insights:'.home-insights',forecast:'.my-day'};
  for(const [key,selector] of Object.entries(map))grid.querySelectorAll(selector).forEach(el=>{el.hidden=!homeVisible(key,s);});
  const essential=document.createDocumentFragment();
  for(const selector of ['.qc-shell','.hero','.home-agenda','.home-favorites','.month','.home-weekly']){const node=left.querySelector(selector);if(node)essential.append(node);}
  left.prepend(essential);
  const advanced=left.querySelector('.home-optional-content');const ai=left.querySelector('.ai-home');if(advanced&&ai)advanced.append(ai);const checkin=right.querySelector('.checkin');if(advanced&&checkin)advanced.append(checkin);
  root.append(head,grid);
}

function checkinCard() {
  const s = store.getState(), w = F.weekSummary(s);
  const diff = w.prevSpent > 0 ? (w.spent - w.prevSpent) / w.prevSpent : null;
  return h('section.card.checkin', { 'aria-label': 'Check-in da semana' },
    h('div.card-head', h('h3', 'Check-in da semana'), h('span.muted.sm', `${F.checkinStreak(s)} seguidos`)),
    h('p', `Gastos variáveis da semana: `, h('b', money0(w.spent)), diff == null ? '.' : `, ${diff <= 0 ? Math.round(-diff * 100) + '% menos' : Math.round(diff * 100) + '% mais'} que a semana passada.`),
    w.top ? h('p.muted.sm', `Onde mais foi: ${w.top.cat} (${money0(w.top.value)}).`) : null,
    w.next7.length ? h('p.muted.sm', `Nos próximos 7 dias: ${w.next7.length} conta(s), ${money0(w.next7.reduce((a, t) => a + t.value, 0))}.`) : h('p.muted.sm', 'Nenhuma conta nos próximos 7 dias.'),
    h('button.btn.sm.primary', { type: 'button', onclick: () => { haptic(12); store.commit(st => { const wk = isoWeek(today()); st.profile.checkins = [...new Set([...(st.profile.checkins || []), wk])].slice(-60); }); toast('Check-in feito. Semana revisada.'); } }, 'Revisei minha semana'));
}

function longDate(iso) { const d = Number(String(iso).slice(8, 10)); return `${d} de ${monthName(String(iso).slice(0, 7))}`; }
const dm = iso => `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}`;

function explainSpendable(sp) {
  const ex = F.spendableExplanation(sp);
  const line = (label, value, cls = '') => h('div.calc-row' + cls, h('span', label), h('b', value));
  const item = (label, sub, value, overdue) => h('div.calc-item', h('span', h('b', label), h('small', overdue ? `venceu ${dm(sub)}` : `vence ${dm(sub)}`)), h('b', money(value)));
  const neg = v => v > 0 ? '− ' + money(v) : money(0);
  const untilTxt = sp.next.source === 'mes' ? 'o fim do mês' : longDate(sp.until);
  const why = sp.next.source === 'agendada' ? `quando entra ${sp.next.label}` : sp.next.source === 'perfil' ? 'seu dia de receber' : sp.next.source === 'estimada' ? 'estimado pela sua última entrada' : '';
  const d = ex.details;
  const full = h('details.calc-more',
    h('summary', 'Ver cálculo completo'),
    h('div.calc-detail',
      h('h4', 'Contas'), d.bills.length ? d.bills.map(b => item(b.label, b.date, b.value, b.overdue)) : h('p.hint', 'Nenhuma conta vence antes de receber.'),
      h('h4', 'Faturas'), d.invoices.length ? d.invoices.map(i => item(i.label, i.date, i.value, i.overdue)) : h('p.hint', 'Nenhuma fatura vence antes de receber.'),
      h('h4', 'Meta'), d.save.left > 0 ? h('div.calc-item', h('span', h('b', 'Meta mensal'), h('small', 'Falta guardar')), h('b', money(d.save.left))) : h('p.hint', d.save.target > 0 ? 'Meta do mês já guardada.' : 'Sem meta de guardar ativa.'),
      ex.after.length ? h('div.calc-after', h('h4', 'Depois do próximo recebimento'), h('p.hint', 'Não diminui o que você tem disponível agora.'), ex.after.map(a => item(a.label, a.date, a.value, false))) : null,
      h('p.hint.calc-card', 'Compras no cartão entram no cálculo quando a fatura precisa ser paga. ',
        h('button.link.sm', { type: 'button', onclick: e => { e.currentTarget.replaceWith(h('span', 'A compra ocupa o limite e entra na fatura do mês certo; o dinheiro só sai da sua conta no vencimento. Por isso ela não é descontada duas vezes.')); } }, 'Saiba mais'))));
  const warns = (sp.warnings || []).map(w => h('div.calc-warn', { role: 'note' },
    h('p', h('b', 'Possível dupla contagem. '), `"${w.txDesc}" (${money(w.value)}, ${dm(w.txDate)}) foi lançado como gasto, mas a fatura do ${w.card} ainda está em aberto.`),
    h('button.btn.sm', { type: 'button', onclick: () => { sheet.close(); fixDoubleInvoice(w); } }, 'Considerar a fatura paga')));
  const sheet = openSheet({
    title: 'Como chegamos nesse número',
    subtitle: `Até ${untilTxt}${why ? ` (${why})` : ''}.`,
    content: [
      h('div.calc-summary',
        line(ex.summary[0].label, money(ex.summary[0].value)),
        line(ex.summary[1].label, neg(ex.summary[1].value)),
        line(ex.summary[2].label, neg(ex.summary[2].value)),
        h('div.calc-total' + (sp.free < 0 ? '.neg' : ''), h('span', ex.total.label), h('strong', money(ex.total.value))),
        sp.free > 0 ? line('Limite seguro por dia', `${money(sp.perDay)} por ${sp.days} ${sp.days === 1 ? 'dia' : 'dias'}`, '.perday')
          : h('p.calc-msg', sp.free < 0 ? `Seu saldo está comprometido até receber. Faltam ${money(-sp.free)} para cobrir seus compromissos.` : 'Você chegou ao limite até receber.')),
      ...warns,
      full,
      h('button.link.sm.calc-balance', { type: 'button', onclick: () => { sheet.close(); setTimeout(() => openOpeningBalance(), 160); } }, 'Seu saldo está diferente do banco? Ajustar quanto tenho hoje')
    ]
  });
}
/* Corrige a dupla contagem apontada: a fatura passa a constar como paga na data do lançamento e o lançamento manual sai. */
function fixDoubleInvoice(w) {
  store.markDeleted([w.txId]);
  store.commit(s => {
    for (const t of s.transactions) if (t.method === 'Crédito' && t.status !== 'Pago' && F.cardByName(t.card, s)?.name === w.card && F.txInvoice(t, s) === w.ym) { t.status = 'Pago'; t.paidAt = w.txDate; }
    s.transactions = s.transactions.filter(t => t.id !== w.txId);
  });
  toast(`Fatura do ${w.card} marcada como paga em ${dm(w.txDate)}. O lançamento duplicado saiu.`);
}

function agendaCard(s){
 const cutoff=addDays(today(),30),items=[];
 for(const t of s.transactions.filter(t=>store.recordVisible(t,s)&&t.type==='expense'&&t.method!=='Crédito'&&t.status!=='Pago'&&t.date<=cutoff&&!F.isLoanPrincipalOut(t)&&!F.isSave(t)))items.push({label:t.desc,value:t.value,date:t.date,open:()=>openTxDetail(t.id)});
 for(const card of s.cards)for(const invoice of F.cardStatus(card,s).invoices.filter(i=>i.unpaid>0&&i.dueDate<=cutoff))items.push({label:'Fatura '+card.name,value:invoice.unpaid,date:invoice.dueDate,open:()=>payInvoice(card,invoice)});
 items.sort((a,b)=>a.date.localeCompare(b.date));
 return h('section.card.home-agenda',sectionTitle('Próximas contas',{label:'Ver agenda',fn:()=>go('calendario')}),items.length?items.slice(0,3).map(item=>h('button.agenda-row',{type:'button',onclick:item.open},h('span',h('b',item.label),h('small',item.date<today()?'Vencida · '+shortDate(item.date):dayLabel(item.date))),h('strong',money(item.value)))):h('p.muted.sm','Nenhuma conta pendente nos próximos 30 dias.'));
}
function repeatCard(s){
 const saved=favorites(s),recent=s.transactions.filter(t=>store.recordVisible(t,s)&&canFavorite(t)&&!F.isSave(t)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
 const seen=new Set(),items=(saved.length?saved:recent).filter(t=>{const key=t.desc.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;}).slice(0,4);
 return h('section.card.home-favorites',sectionTitle(saved.length?'Seus favoritos':'Repetir um gasto'),items.length?h('div.repeat-chips',items.map(t=>h('div.repeat-item',h('button.chip',{type:'button',onclick:()=>openTxForm({mode:'expense',preset:{desc:t.desc,value:t.value,cat:t.cat,method:t.method}})},t.desc+' · '+money(t.value)),saved.length?h('button.favorite-remove',{type:'button','aria-label':'Remover favorito '+t.desc,onclick:()=>removeFavorite(t.id)},'×'):null))):h('p.muted.sm','Favoritos aparecem aqui depois que você favoritar um gasto.'),h('small.muted','Os dados abrem para conferir antes de adicionar.'));
}
function weeklyCard(s){
 const from=addDays(today(),-6),rows=s.transactions.filter(t=>store.recordVisible(t,s)&&t.date>=from&&t.date<=today()),income=rows.filter(t=>F.isRealIncome(t)&&t.status==='Pago').reduce((n,t)=>n+F.incomeAmount(t),0),spent=rows.filter(t=>F.isSpend(t)&&(t.status==='Pago'||t.method==='Crédito')).reduce((n,t)=>n+t.value,0),w=F.weekSummary(s);
 return h('section.card.home-weekly',sectionTitle('Últimos 7 dias'),h('div.stats',stat('Entrou',money0(income)),stat('Gastei',money0(spent))),h('p.muted.sm',w.next7.length?'Confira as próximas contas para planejar a semana.':'Reserve um momento para revisar os gastos recentes.'),h('button.link.sm',{type:'button',onclick:()=>go('extrato')},'Revisar movimentações'));
}
