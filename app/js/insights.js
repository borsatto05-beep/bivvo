/* Bivvo — insights derivados dos dados reais, conquistas e desafios.
   Nada aqui é texto genérico: cada frase só aparece se o número que a sustenta existe. */
import { getState } from './store.js';
import * as F from './finance.js';
import { today, ymOf, addMonthsYM, addDays, diffDays, money, money0, pct, round2, sum, monthName, uid } from './util.js';

/* ---------------------------------------------------------------- */
/* INSIGHTS                                                         */
/* ---------------------------------------------------------------- */
export function insights(limit = 3, s = getState()) {
  const t0 = today(), cur = ymOf(t0), prev = addMonthsYM(cur, -1);
  const a = F.monthSummary(cur, s), b = F.monthSummary(prev, s);
  const day = Number(t0.slice(8));
  const out = [];
  const add = (score, icon, text, tone = '', story = null) => out.push({ score, icon, text, tone, story });

  /* projeção do mês */
  const pj = F.monthProjection(cur, s);
  if (a.income > 0 && day >= 5 && day <= 27) {
    if (pj.left >= 0) add(70, '🔮', `Se mantiver esse ritmo, devem sobrar cerca de ${money0(pj.left)} no fim de ${monthName(cur)}.`, 'good');
    else add(85, '🔮', `Nesse ritmo, ${monthName(cur)} fecha com ${money0(-pj.left)} a mais de gastos do que de entradas.`, 'warn');
  }

  /* categorias vs. mês passado (comparando o mesmo pedaço do mês) */
  if (b.count) {
    const prevSame = new Map();
    for (const t of F.monthTx(prev, s)) if (F.isSpend(t) && Number(t.date.slice(8)) <= day) prevSame.set(t.cat, (prevSame.get(t.cat) || 0) + t.value);
    for (const c of a.cats.slice(0, 6)) {
      const p = prevSame.get(c.cat) || 0;
      if (p < 40) continue;
      const delta = (c.value - p) / p;
      if (delta <= -0.15 && p - c.value >= 30) add(60 + Math.min(20, -delta * 30), '📉', `Você gastou ${pct(-delta * 100)} menos com ${c.cat} do que no mesmo período de ${monthName(prev)}.`, 'good', { kind: 'cut', cat: c.cat, pct: -delta * 100 });
      else if (delta >= 0.25 && c.value - p >= 50) add(55 + Math.min(20, delta * 20), '📈', `${c.cat} está ${pct(delta * 100)} acima do mesmo período de ${monthName(prev)} (+${money0(c.value - p)}).`, 'warn');
    }
  }

  /* maior categoria */
  if (a.cats[0] && a.spend > 200 && a.cats[0].share >= 0.18) add(40, '🧭', `${a.cats[0].cat} representa ${pct(a.cats[0].share * 100)} dos seus gastos de ${monthName(cur)}.`, '', { kind: 'topcat' });

  /* pequenas compras */
  const small = F.monthTx(cur, s).filter(t => F.isSpend(t) && t.value > 0 && t.value <= 30 && !t.fixedId);
  const smallSum = sum(small);
  if (small.length >= 6 && smallSum >= 80) add(65, '🪙', `${small.length} compras pequenas (até R$ 30) já somam ${money0(smallSum)} neste mês.`, 'warn', { kind: 'small', value: smallSum, count: small.length });

  /* fatura vs. mês passado */
  for (const c of s.cards) {
    const st = F.cardStatus(c, s), prevInv = st.invoices.find(i => i.ym === addMonthsYM(st.open.ym, -1));
    if (prevInv && prevInv.total > 50 && st.open.total > 0 && day >= 10) {
      const d = st.open.total - prevInv.total;
      if (Math.abs(d) >= 80) add(50, '💳', d > 0 ? `A fatura do ${c.name} já está ${money0(d)} maior que a do mês passado.` : `A fatura do ${c.name} está ${money0(-d)} menor que a do mês passado.`, d > 0 ? 'warn' : 'good');
    }
  }

  /* parcelas comprometendo meses futuros */
  const commit = F.installmentsCommit(3, s);
  if (commit >= 100) add(45, '🗓️', `Suas parcelas já comprometem ${money0(commit)} das próximas 3 faturas.`, '', { kind: 'installments', value: commit });

  /* sequência positiva */
  const ps = F.positiveStreak(s);
  if (ps.months >= 2) add(58, '🔥', `${ps.months} meses seguidos fechando no positivo.`, 'good', { kind: 'streak', months: ps.months });

  /* reserva */
  const avg = F.avgMonthlySpend(3, s), w = F.wealth(s);
  if (w.reserve > 0 && avg > 0) {
    const m = w.reserve / avg;
    add(m < 1 ? 52 : 30, '🛡️', m >= 1 ? `Sua reserva cobre ${m.toFixed(1).replace('.', ',')} meses dos seus gastos.` : `Sua reserva cobre ${Math.round(m * 30)} dias dos seus gastos. A meta comum é 3 a 6 meses.`, m >= 3 ? 'good' : '');
  }

  /* economia acumulada: guardou mais que no mês passado */
  if (a.saved > 0 && b.saved >= 0 && a.saved > b.saved && day >= 10) add(48, '🫙', `Você já guardou ${money0(a.saved)} em ${monthName(cur)}${b.saved > 0 ? `, ${money0(a.saved - b.saved)} a mais que em ${monthName(prev)}` : ''}.`, 'good', { kind: 'saved', value: a.saved });

  return out.sort((x, y) => y.score - x.score).slice(0, limit);
}

/* ---------------------------------------------------------------- */
/* CONQUISTAS (derivadas — nunca "compradas")                       */
/* ---------------------------------------------------------------- */
export const ACHIEVEMENTS = [
  { id: 'first', icon: '🌱', title: 'Primeiro passo', text: 'Registrou o primeiro lançamento', test: s => s.transactions.some(t => !t.demoSeed && !F.isOpening(t)) },
  { id: 'log7', icon: '✍️', title: '7 dias registrando', text: 'Uma semana inteira anotando gastos', test: s => F.loggingStreak(s) >= 7 },
  { id: 'month+', icon: '☀️', title: 'Mês no positivo', text: 'Fechou um mês gastando menos do que recebeu', test: s => F.positiveStreak(s).months >= 1 },
  { id: 'streak3', icon: '🔥', title: '3 meses no positivo', text: 'Três meses seguidos com sobra', test: s => F.positiveStreak(s).months >= 3 },
  { id: 'reserve1', icon: '🛡️', title: 'Um mês de fôlego', text: 'Reserva cobre um mês de gastos', test: s => { const a = F.avgMonthlySpend(3, s); return a > 0 && F.wealth(s).reserve >= a; } },
  { id: 'reserve-created', icon: '🛡️', title: 'Reserva criada', text: 'Começou sua reserva de emergência', test: s => F.wealth(s).reserve > 0 },
  { id: 'saved-1000', icon: '💰', title: 'Primeiros R$ 1.000', text: 'Chegou a R$ 1.000 guardados entre metas e investimentos', test: s => F.wealth(s).total >= 1000 },
  { id: 'budget6', icon: '🏆', title: '6 meses no orçamento', text: 'Respeitou seus limites por seis meses fechados', test: s => { const cur = ymOf(today()); for (let i = 1; i <= 6; i++) { const ym = addMonthsYM(cur, -i), r = F.budgetRows(ym, s), m = F.monthSummary(ym, s); if (!r.length || !m.count || r.some(x => x.spent > x.limit)) return false; } return true; } },
  { id: 'goal', icon: '🏁', title: 'Meta cumprida', text: 'Completou uma meta financeira', test: s => s.goals.some(g => g.target > 0 && g.saved >= g.target) },
  { id: 'budget', icon: '🎯', title: 'Dentro do plano', text: 'Respeitou todos os limites em um mês fechado', test: s => { const p = addMonthsYM(ymOf(today()), -1), r = F.budgetRows(p, s); return r.length >= 2 && r.every(x => x.spent <= x.limit) && F.monthSummary(p, s).count > 5; } },
  { id: 'challenge', icon: '🏆', title: 'Desafio concluído', text: 'Terminou um desafio do Bivvo', test: s => s.challenges.some(c => c.status === 'done') },
  { id: 'checkin4', icon: '📅', title: 'Constância', text: '4 check-ins semanais seguidos', test: s => F.checkinStreak(s) >= 4 }
];
export const unlockedAchievements = (s = getState()) => ACHIEVEMENTS.filter(a => { try { return a.test(s); } catch { return false; } });

/* ---------------------------------------------------------------- */
/* DESAFIOS                                                         */
/* ---------------------------------------------------------------- */
const PLAYFUL = new Set(['Delivery', 'Lazer', 'Compras', 'Roupas', 'Alimentação', 'Assinaturas']);
export const CHALLENGES = [
  { type: 'log7', icon: '✍️', title: '7 dias anotando', text: 'Registre pelo menos um gasto por dia durante 7 dias.', days: 7 },
  { type: 'log30', icon: '🗒️', title: '30 dias anotando', text: 'Registre seus gastos por 30 dias. Ao final, você vai saber exatamente para onde vai cada real.', days: 30 },
  { type: 'save', icon: '🫙', title: 'Guardar um valor', text: 'Separe um valor até o fim do prazo. Pode ser na reserva, em uma meta ou investido.', days: 30, needsValue: true, defaultValue: 100 },
  { type: 'cut', icon: '✂️', title: 'Gastar menos em uma categoria', text: 'Termine o mês gastando pelo menos 20% menos que a sua média na categoria.', needsCat: true, monthly: true },
  { type: 'nospend', icon: '🧘', title: 'Dias sem compra por impulso', text: 'Fique sem gastos em delivery, lazer e compras pelo número de dias escolhido.', days: 7, choosableDays: [3, 7, 14] },
  { type: 'reserve', icon: '🛡️', title: 'Reforçar a reserva', text: 'Aumente sua reserva de emergência em um valor neste mês.', days: 30, needsValue: true, defaultValue: 200 }
];
export const challengeDef = type => CHALLENGES.find(c => c.type === type);

export function startChallenge(s, { type, value, cat, days }) {
  const def = challengeDef(type); if (!def) return null;
  const startedAt = today();
  let endsAt = addDays(startedAt, (days || def.days || 30) - 1);
  let baseline = 0;
  if (def.monthly) {
    const cur = ymOf(startedAt), [y, m] = cur.split('-').map(Number);
    endsAt = `${cur}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
    let t = 0, c = 0; for (let i = 1; i <= 3; i++) { const v = F.monthSummary(addMonthsYM(cur, -i), s).cats.find(x => x.cat === cat)?.value || 0; if (v > 0) { t += v; c++; } }
    baseline = c ? round2(t / c) : 0;
  }
  const ch = { id: uid(), type, value: round2(value || def.defaultValue || 0), cat: cat || null, days: days || def.days || null, startedAt, endsAt, baseline, status: 'active' };
  s.challenges.push(ch);
  return ch;
}

export function challengeProgress(ch, s = getState()) {
  const t0 = today(), def = challengeDef(ch.type) || {};
  const end = ch.endsAt, ended = t0 > end;
  const daysTotal = diffDays(ch.startedAt, end) + 1;
  const daysGone = Math.min(daysTotal, Math.max(0, diffDays(ch.startedAt, t0) + 1));
  let ratio = 0, label = '', done = false, failed = false;
  switch (ch.type) {
    case 'log7': case 'log30': {
      const set = F.loggingDays(s, ch.startedAt);
      const hits = [...set].filter(d => d >= ch.startedAt && d <= end).length;
      ratio = hits / daysTotal; label = `${hits} de ${daysTotal} dias`; done = hits >= daysTotal;
      failed = !done && (daysTotal - daysGone) < (daysTotal - hits);
      break;
    }
    case 'save': case 'reserve': {
      const rows = s.transactions.filter(t => t.date >= ch.startedAt && t.date <= end && (ch.type === 'reserve' ? (t.goalId && s.goals.find(g => g.id === t.goalId)?.isReserve) : true));
      const saved = round2(sum(rows.filter(F.isSave)) - sum(rows.filter(F.isWithdraw)));
      ratio = ch.value ? saved / ch.value : 0; label = `${money(Math.max(0, saved))} de ${money(ch.value)}`; done = saved >= ch.value;
      break;
    }
    case 'cut': {
      const ym = ymOf(ch.startedAt), spent = F.monthSummary(ym, s).cats.find(c => c.cat === ch.cat)?.value || 0;
      const limit = round2(ch.baseline * 0.8);
      ratio = limit > 0 ? Math.min(1, spent / limit) : 0;
      label = limit > 0 ? `${money0(spent)} de no máximo ${money0(limit)} em ${ch.cat}` : `Sem histórico de ${ch.cat} para comparar`;
      done = ended && spent <= limit; failed = spent > limit;
      return { ratio, label, done, failed, ended, daysTotal, daysGone, invert: true, def };
    }
    case 'nospend': {
      const lim = end < t0 ? end : t0;
      const hit = s.transactions.filter(t => F.isSpend(t) && PLAYFUL.has(t.cat) && t.date >= ch.startedAt && t.date <= lim && !t.fixedId).sort((a, b) => a.date.localeCompare(b.date))[0];
      const clean = hit ? diffDays(ch.startedAt, hit.date) : daysGone;
      ratio = clean / daysTotal; label = hit ? `Sequência interrompida em ${hit.date.slice(8)}/${hit.date.slice(5, 7)}` : `${clean} de ${daysTotal} dias`;
      done = !hit && daysGone >= daysTotal; failed = !!hit;
      break;
    }
  }
  if (ended && !done) failed = true;
  return { ratio: Math.max(0, Math.min(1, ratio)), label, done, failed, ended, daysTotal, daysGone, def };
}

/* Atualiza status dos desafios; devolve os recém-concluídos (para celebrar). */
export function settleChallenges(s) {
  const fresh = [];
  for (const ch of s.challenges) {
    if (ch.status !== 'active') continue;
    const p = challengeProgress(ch, s);
    if (p.done) { ch.status = 'done'; ch.completedAt = today(); fresh.push(ch); }
    else if (p.failed && p.ended) { ch.status = 'ended'; }
  }
  return fresh;
}
