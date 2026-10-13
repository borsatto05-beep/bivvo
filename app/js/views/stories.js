import {journeySnapshot,learningSpace} from '../learning.js';
/* Bivvo — "Meu mês em 15 segundos" e Bivvo Stories (cards 9:16 compartilháveis).
   Privacidade: por padrão os cards mostram só percentuais. Saldo, dívidas, cartões e
   descrições de lançamentos nunca entram em um card. */
import { h, money0, monthName, today, ymOf, addMonthsYM, prefersReducedMotion, haptic, sha256Hex } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { challengeDef } from '../insights.js';
import { openSheet, toast, segmented, catIcon } from '../ui.js';
import { fmtHours } from './forms.js';
import { ctx } from '../nav.js';
import * as cloud from '../cloud.js';
import { track, flush as flushAnalytics } from '../analytics.js';

const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

/* ---------------------------------------------------------------- */
/* Retrospectiva                                                    */
/* ---------------------------------------------------------------- */
function monthFacts(ym, s = store.getState()) {
  const a = F.monthSummary(ym, s), prev = F.monthSummary(addMonthsYM(ym, -1), s);
  const isCurrent = ym === ymOf(today());
  const biggest = F.monthTx(ym, s).filter(t => F.isSpend(t) && !t.fixedId).sort((x, y) => y.value - x.value)[0];
  const hr = F.hourlyRate(s);
  let cmp = null;
  if (prev.spend > 0) {
    if (isCurrent) { const d = Number(today().slice(8)); const ps = F.monthTx(addMonthsYM(ym, -1), s).filter(t => F.isSpend(t) && Number(t.date.slice(8)) <= d).reduce((x, t) => x + t.value, 0); cmp = ps > 0 ? (a.spend - ps) / ps : null; }
    else cmp = (a.spend - prev.spend) / prev.spend;
  }
  return { a, prev, biggest, hr, cmp, isCurrent, streak: F.positiveStreak(s), saveRate: a.income ? a.saved / a.income : 0 };
}

export function openRetrospective(ym) {
  const f = monthFacts(ym);
  const name = cap(monthName(ym));
  const slides = [];
  slides.push(h('div.slide.s-intro', h('p', f.isCurrent ? 'Até agora' : 'Retrospectiva'), h('h2', name), h('p.muted', 'Seu mês em 15 segundos')));
  const max = Math.max(f.a.income, f.a.spend, 1);
  slides.push(h('div.slide', h('p', 'Entrou e saiu'),
    h('div.io', h('div', h('small', 'Entrou'), h('b', money0(f.a.income)), h('i.io-bar.in', { vars: { '--w': (f.a.income / max * 100) + '%' } })), h('div', h('small', 'Gastou'), h('b', money0(f.a.spend)), h('i.io-bar', { vars: { '--w': (f.a.spend / max * 100) + '%' } }))),
    h('h3', f.a.result >= 0 ? `Sobraram ${money0(f.a.result)}` : `Faltaram ${money0(-f.a.result)}`)));
  if (f.a.cats.length) slides.push(h('div.slide', h('p', 'Para onde foi'), h('div.rank', f.a.cats.slice(0, 3).map((c, i) => h('div.rank-row', h('span.rank-n', String(i + 1)), h('span', catIcon(c.cat) + ' ' + c.cat), h('b', Math.round(c.share * 100) + '%')))),
    h('p.muted', `${f.a.cats[0].cat} levou ${money0(f.a.cats[0].value)}.`)));
  if (f.biggest) slides.push(h('div.slide', h('p', 'O maior gasto'), h('h2.sm', f.biggest.desc.replace(/\s*\(\d+\/\d+\)$/, '')), h('h3', money0(f.biggest.value)),
    f.hr > 0 ? h('p.muted', `Isso equivale a ${fmtHours(f.biggest.value / f.hr)} do seu trabalho.`) : null));
  if (f.cmp != null) slides.push(h('div.slide', h('p', `Comparado a ${monthName(addMonthsYM(ym, -1))}`), h('h2', `${f.cmp <= 0 ? '−' : '+'}${Math.abs(Math.round(f.cmp * 100))}%`), h('p.muted', f.cmp <= 0 ? 'de gastos. Seu bolso agradece.' : 'de gastos. Vale olhar as categorias que cresceram.')));
  slides.push(h('div.slide', h('p', 'Guardado'), h('h2', money0(f.a.saved)), h('p.muted', f.a.income ? `${Math.round(f.saveRate * 100)}% do que entrou.` : ''), f.streak.months >= 2 ? h('h3', `🔥 ${f.streak.months} meses seguidos no positivo`) : null));
  slides.push(h('div.slide.s-end', h('h2', 'Esse foi o seu ' + monthName(ym) + '.'), h('p.muted', 'Compartilhe só o que quiser. Valores ficam ocultos por padrão.'),
    h('div.btn-row', h('button.btn.primary', { type: 'button', onclick: () => { ctl.close(); openStoryComposer({ template: 'month', ym }); } }, 'Criar meu card'), h('button.btn', { type: 'button', onclick: () => ctl.close() }, 'Fechar'))));

  const ctl = playSlides(slides, `Retrospectiva de ${name}`);
}

/* ---------------------------------------------------------------- */
/* Bivvo Wrapped: retrospectiva do ano                              */
/* ---------------------------------------------------------------- */
/* Dezembro mostra o ano corrente; janeiro ainda mostra o ano que acabou. */
export function wrappedSeasonYear(d = new Date()) { const m = d.getMonth() + 1; return m === 12 ? d.getFullYear() : m === 1 ? d.getFullYear() - 1 : null; }
export const wrappedDefaultYear = (d = new Date()) => wrappedSeasonYear(d) ?? d.getFullYear();

export function yearFacts(year, s = store.getState()) {
  const curYM = ymOf(today());
  const months = [];
  for (let m = 1; m <= 12; m++) { const ym = `${year}-${String(m).padStart(2, '0')}`; months.push(ym <= curYM ? { ym, ...F.monthSummary(ym, s) } : null); }
  const active = months.filter(x => x && x.count > 0);
  const sumOf = k => active.reduce((a, x) => a + (x[k] || 0), 0);
  const income = sumOf('income'), spend = sumOf('spend'), saved = sumOf('saved');
  const catMap = new Map();
  for (const mo of active) for (const c of mo.cats) catMap.set(c.cat, (catMap.get(c.cat) || 0) + c.value);
  const cats = [...catMap.entries()].map(([cat, value]) => ({ cat, value, share: spend ? value / spend : 0 })).sort((a, b) => b.value - a.value);
  /* mês corrente incompleto não disputa "mais econômico" */
  const closed = active.filter(x => x.ym < curYM && x.spend > 0);
  const best = closed.slice().sort((a, b) => a.spend - b.spend)[0] || null;
  const avg = closed.length ? closed.reduce((a, x) => a + x.spend, 0) / closed.length : 0;
  const txs = s.transactions.filter(t => t.date.startsWith(String(year)) && !t.fixedId && !F.isOpening(t));
  const days = new Set(txs.map(t => t.date)).size;
  const biggest = txs.filter(t => F.isSpend(t)).sort((a, b) => b.value - a.value)[0] || null;
  const positive = active.filter(x => x.ym < curYM ? x.result > 0 : false).length;
  return { year, months, active, income, spend, saved, result: income - spend, cats, best, avg, txCount: txs.length, days, biggest, positive, saveRate: income ? saved / income : 0, inProgress: String(year) === curYM.slice(0, 4) && curYM.slice(5) !== '12' };
}

export function openYearWrapped(year = wrappedDefaultYear()) {
  const f = yearFacts(year);
  track('wrapped_opened');
  if (f.active.length < 1) { toast(`Ainda não há lançamentos em ${year} para montar a retrospectiva.`); return; }
  const slides = [];
  slides.push(h('div.slide.s-intro.s-year', h('p', f.inProgress ? 'Até agora' : 'Retrospectiva do ano'), h('h2', `Seu ${year}`), h('p.muted', 'Um ano de dinheiro mais claro')));
  slides.push(h('div.slide', h('p', 'Você anotou'), h('h2', String(f.txCount)), h('p.muted', `lançamentos em ${f.days} ${f.days === 1 ? 'dia' : 'dias'} diferentes.`)));
  const max = Math.max(f.income, f.spend, 1);
  slides.push(h('div.slide', h('p', 'Entrou e saiu'),
    h('div.io', h('div', h('small', 'Entrou'), h('b', money0(f.income)), h('i.io-bar.in', { vars: { '--w': (f.income / max * 100) + '%' } })), h('div', h('small', 'Gastou'), h('b', money0(f.spend)), h('i.io-bar', { vars: { '--w': (f.spend / max * 100) + '%' } }))),
    h('h3', f.result >= 0 ? `Sobraram ${money0(f.result)}` : `Faltaram ${money0(-f.result)}`)));
  if (f.cats.length) slides.push(h('div.slide', h('p', 'Para onde foi'), h('div.rank', f.cats.slice(0, 3).map((c, i) => h('div.rank-row', h('span.rank-n', String(i + 1)), h('span', catIcon(c.cat) + ' ' + c.cat), h('b', Math.round(c.share * 100) + '%'))))));
  if (f.best && f.avg > 0) slides.push(h('div.slide', h('p', 'Seu mês mais econômico'), h('h2', cap(monthName(f.best.ym))), h('p.muted', `${money0(f.best.spend)} em gastos, ${Math.round((1 - f.best.spend / f.avg) * 100)}% abaixo da sua média.`)));
  if (f.biggest) slides.push(h('div.slide', h('p', 'A maior compra'), h('h2.sm', f.biggest.desc.replace(/\s*\(\d+\/\d+\)$/, '')), h('h3', money0(f.biggest.purchaseTotal || f.biggest.value))));
  slides.push(h('div.slide', h('p', 'Guardado no ano'), h('h2', money0(f.saved)), h('p.muted', f.income ? `${Math.round(f.saveRate * 100)}% do que entrou.` : ''), f.positive ? h('h3', `${f.positive} ${f.positive === 1 ? 'mês' : 'meses'} fechando no positivo`) : null));
  slides.push(h('div.slide.s-end', h('h2', `Esse foi o seu ${year}.`), h('p.muted', 'Compartilhe só o que quiser. Valores ficam ocultos por padrão.'),
    h('div.btn-row', h('button.btn.primary', { type: 'button', onclick: () => { ctl.close(); openStoryComposer({ template: 'year', year }); } }, 'Criar meu card do ano'), h('button.btn', { type: 'button', onclick: () => ctl.close() }, 'Fechar'))));
  const ctl = playSlides(slides, `Retrospectiva de ${year}`);
}

/* Player de slides em tela cheia (mês e ano usam o mesmo). */
function playSlides(slides, label) {
  const bars = h('div.rp-bars', slides.map(() => h('span', h('i'))));
  const stage = h('div.rp-stage', slides);
  const player = h('div.retro', { role: 'dialog', 'aria-modal': 'true', 'aria-label': label, tabindex: '-1' },
    bars, h('button.rp-close', { type: 'button', 'aria-label': 'Fechar', onclick: () => close() }, '✕'), stage,
    h('div.rp-brand', h('img', { src: 'icon-192.png', alt: '', width: 22, height: 22 }), 'Bivvo'),
    h('button.rp-prev', { type: 'button', 'aria-label': 'Anterior', onclick: () => goTo(i - 1) }), h('button.rp-next', { type: 'button', 'aria-label': 'Próximo', onclick: () => goTo(i + 1) }));
  document.body.append(player); document.body.classList.add('sheet-open');
  requestAnimationFrame(() => player.classList.add('in'));
  player.focus();
  let i = 0, timer = null, paused = false;
  const DUR = 2600;
  function goTo(n) {
    if (n >= slides.length) n = slides.length - 1;
    if (n < 0) n = 0;
    i = n; haptic(5);
    slides.forEach((sl, k) => sl.classList.toggle('on', k === i));
    [...bars.children].forEach((b, k) => { b.className = k < i ? 'done' : k === i ? 'run' : ''; });
    clearTimeout(timer);
    if (i < slides.length - 1 && !prefersReducedMotion()) timer = setTimeout(() => { if (!paused) goTo(i + 1); }, DUR);
  }
  player.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; paused = true; player.classList.add('paused'); });
  player.addEventListener('pointerup', () => { if (!paused) return; paused = false; player.classList.remove('paused'); goTo(i + 1); });
  player.addEventListener('keydown', e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') goTo(i + 1); if (e.key === 'ArrowLeft') goTo(i - 1); });
  function close() { clearTimeout(timer); player.classList.remove('in'); setTimeout(() => player.remove(), 250); if (!document.querySelector('.sheet-wrap')) document.body.classList.remove('sheet-open'); }
  goTo(0);
  return { close };
}

/* ---------------------------------------------------------------- */
/* Composer de Stories                                              */
/* ---------------------------------------------------------------- */
const TEMPLATES = [
  { value: 'mission', label: 'Minhas missões' }, { value: 'spendable', label: 'Quanto posso gastar' }, { value: 'month', label: 'Meu mês' }, { value: 'year', label: 'Meu ano' }, { value: 'health', label: 'Minha evolução' }, { value: 'saved', label: 'Guardei' }, { value: 'cut', label: 'Gastei menos' },
  { value: 'topcat', label: 'Maior categoria' }, { value: 'goal', label: 'Meta' }, { value: 'streak', label: 'Sequência' }, { value: 'challenge', label: 'Desafio' }
];
export function storyContent(opt) {
  const s = store.getState(), ym = opt.ym || ymOf(today()), f = monthFacts(ym, s);
  const showValues = opt.values, m = monthName(ym);
  switch (opt.template) {
    case 'mission': {
      const snapshot=journeySnapshot(s,learningSpace(opt.space||store.activeFinanceProfile()));
      if(!snapshot.applied)return null;
      return {kicker:'Meu aprendizado no Bivvo',big:`${snapshot.applied}/${snapshot.total}`,line:'missões com ações conferidas',list:['Um passo possível por vez','Experimente sua primeira missão'],visual:{type:'ring',p:snapshot.applied/snapshot.total}};
    }
    case 'spendable': {
      const sp = F.spendable(s);
      if (!sp || sp.state !== 'positive' || !Number.isFinite(sp.perDay) || sp.perDay <= 0) return null;
      const days = Math.max(1, Number(sp.days || 1));
      const big = showValues ? `${money0(sp.perDay)}/dia` : 'EU SEI';
      const line = showValues
        ? 'quanto posso gastar por dia sem comprometer minhas contas e minha meta'
        : 'quanto posso gastar sem comprometer minhas contas e minha meta';
      return {
        kicker: 'Meu número de hoje no Bivvo',
        big, bigSmall: !showValues, line,
        list: [days === 1 ? 'Planejado até amanhã' : `Planejado para os próximos ${days} dias`, 'Saldo, contas, cartões e meta no mesmo cálculo'],
        visual: { type: 'ring', p: Math.max(.06, Math.min(1, Number(sp.moneyRatio ?? .45))) }
      };
    }
    case 'year': {
      const y = yearFacts(opt.year || wrappedDefaultYear(), s);
      if (y.active.length < 2) return null;
      const lines = [];
      if (y.positive) lines.push(`${y.positive} ${y.positive === 1 ? 'mês' : 'meses'} no positivo`);
      if (y.income) lines.push(`${Math.round(y.saveRate * 100)}% da renda guardada`);
      if (y.cats[0]) lines.push(`Maior categoria: ${y.cats[0].cat}`);
      if (y.best) lines.push(`Mês mais econômico: ${monthName(y.best.ym)}`);
      if (showValues && y.saved > 0) lines.push(`Guardei ${money0(y.saved)}`);
      return { kicker: `Meu ${y.year} no Bivvo`, big: String(y.year), list: lines, visual: { type: 'months', values: y.months.map(x => x && x.count ? x.spend : null), best: y.best ? Number(y.best.ym.slice(5)) - 1 : -1 } };
    }
    case 'health': {
      const pos = f.streak.months || 0;
      const lines = [];
      if (pos) lines.push(`${pos} ${pos === 1 ? 'mês' : 'meses'} seguidos no positivo`);
      if (f.a.income) lines.push(`${Math.round(f.saveRate * 100)}% da renda guardada neste mês`);
      if (f.cmp != null && f.cmp < 0) lines.push(`${Math.round(-f.cmp * 100)}% menos gastos que no mês anterior`);
      if (f.a.cats[0]) lines.push(`Categoria mais presente: ${f.a.cats[0].cat}`);
      if (!lines.length) lines.push('Estou começando a deixar meu dinheiro mais claro');
      return { kicker: 'Minha evolução no Bivvo', big: pos ? `${pos}x` : 'Comecei', bigSmall: !pos, list: lines.slice(0, 3), visual: pos ? { type: 'dots', n: Math.min(12, pos) } : { type: 'ring', p: .12 } };
    }
    case 'saved': return f.a.saved > 0
      ? { kicker: `Em ${m}`, big: showValues ? money0(f.a.saved) : Math.round(f.saveRate * 100) + '%', line: showValues ? 'guardados este mês' : 'da minha renda foi guardada', visual: { type: 'ring', p: Math.min(1, f.saveRate / 0.3) } }
      : null;
    case 'cut': return f.cmp != null && f.cmp < 0 ? { kicker: `${cap(m)} vs. ${monthName(addMonthsYM(ym, -1))}`, big: `−${Math.round(-f.cmp * 100)}%`, line: 'nos meus gastos', visual: { type: 'bars2', a: 1, b: 1 + f.cmp } } : null;
    case 'topcat': { const c = f.a.cats[0]; return c ? { kicker: `Em ${m}, para onde foi`, big: `${catIcon(c.cat)} ${c.cat}`, bigSmall: true, line: `${Math.round(c.share * 100)}% dos meus gastos${showValues ? ` · ${money0(c.value)}` : ''}`, visual: { type: 'cats', cats: f.a.cats.slice(0, 4) } } : null; }
    case 'goal': {
      const g = s.goals.find(x => x.id === opt.goalId) || s.goals.slice().sort((a, b) => (b.saved / b.target || 0) - (a.saved / a.target || 0))[0];
      if (!g || !g.target) return null;
      const r = Math.min(1, g.saved / g.target);
      return { kicker: opt.goalName === false ? 'Minha meta' : `${g.emoji || '🫙'} ${g.name}`, big: Math.round(r * 100) + '%', line: r >= 1 ? 'meta concluída' : showValues ? `${money0(g.saved)} de ${money0(g.target)}` : 'do caminho já percorrido', visual: { type: 'ring', p: r } };
    }
    case 'streak': { const n = f.streak.months; return n >= 1 ? { kicker: 'Sequência', big: `${n}`, line: n === 1 ? 'mês fechando no positivo' : 'meses seguidos no positivo', visual: { type: 'dots', n: Math.min(12, n) } } : null; }
    case 'challenge': {
      const ch = s.challenges.find(c => c.id === opt.challengeId) || s.challenges.filter(c => c.status === 'done').slice(-1)[0];
      if (!ch || ch.status !== 'done') return null; const def = challengeDef(ch.type);
      return { kicker: 'Desafio concluído', big: def.icon, line: def.title + (ch.cat ? ` · ${ch.cat}` : ''), visual: { type: 'trophy' } };
    }
    default: {
      const lines = [];
      if (f.a.income) lines.push(`${Math.round(f.saveRate * 100)}% da renda guardada`);
      if (f.cmp != null) lines.push(`${f.cmp <= 0 ? '−' : '+'}${Math.abs(Math.round(f.cmp * 100))}% de gastos vs. ${monthName(addMonthsYM(ym, -1))}`);
      if (f.a.cats[0]) lines.push(`Maior categoria: ${f.a.cats[0].cat}`);
      if (showValues && f.a.result > 0) lines.push(`Sobraram ${money0(f.a.result)}`);
      return { kicker: 'Meu mês no Bivvo', big: cap(m), bigSmall: true, list: lines, visual: { type: 'cats', cats: f.a.cats.slice(0, 4) } };
    }
  }
}
const THEMES = { claro: { bg: '#F6F4F8', ink: '#1E1B24', soft: '#6B6675', a: '#7B22C9', b: '#C8177F', track: '#E7E2EE' }, grafite: { bg: '#1E1B24', ink: '#FFFFFF', soft: '#B9B3C2', a: '#B061F2', b: '#F0479F', track: '#3A3542' }, magenta: { bg: '#7B22C9', ink: '#FFFFFF', soft: '#F3DDF2', a: '#FFFFFF', b: '#FFD3EC', track: 'rgba(255,255,255,.25)', grad: true } };

let logoImg = null;
async function loadLogo() { if (logoImg) return logoImg; logoImg = new Image(); logoImg.src = 'icon-192.png'; await logoImg.decode().catch(() => {}); return logoImg; }

export async function drawStory(canvas, content, themeName) {
  const T = THEMES[themeName] || THEMES.claro;
  const W = 1080, H = 1920; canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  await document.fonts.load('700 120px Bricolage').catch(() => {});
  const display = (w, px) => `${w} ${px}px Bricolage, system-ui, sans-serif`;
  const body = (w, px) => `${w} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  /* fundo */
  if (T.grad) { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#6A1FC0'); g.addColorStop(1, '#C8177F'); c.fillStyle = g; } else c.fillStyle = T.bg;
  c.fillRect(0, 0, W, H);
  if (!T.grad) { const rg = c.createRadialGradient(W * 0.85, H * 0.12, 20, W * 0.85, H * 0.12, 900); rg.addColorStop(0, T.a + '40'); rg.addColorStop(1, T.a + '00'); c.fillStyle = rg; c.fillRect(0, 0, W, H); const rg2 = c.createRadialGradient(W * 0.1, H * 0.95, 20, W * 0.1, H * 0.95, 800); rg2.addColorStop(0, T.b + '30'); rg2.addColorStop(1, T.b + '00'); c.fillStyle = rg2; c.fillRect(0, 0, W, H); }
  const pad = 96;
  c.fillStyle = T.soft; c.font = body(650, 52); c.textBaseline = 'alphabetic';
  wrapText(c, content.kicker, pad, 300, W - pad * 2, 64);
  c.fillStyle = T.ink;
  let y = 560;
  const bigPx = content.bigSmall ? 150 : 300;
  c.font = display(800, bigPx);
  fitText(c, content.big, W - pad * 2, bigPx, w => display(800, w));
  c.fillText(content.big, pad - 6, y);
  y += 110;
  if (content.line) { c.font = body(650, 64); c.fillStyle = T.ink; y = wrapText(c, content.line, pad, y, W - pad * 2, 78) + 40; }
  if (content.list) { c.font = body(650, 58); for (const l of content.list) { c.fillStyle = T.a; c.beginPath(); c.arc(pad + 14, y - 18, 10, 0, Math.PI * 2); c.fill(); c.fillStyle = T.ink; y = wrapText(c, l, pad + 50, y, W - pad * 2 - 50, 72) + 26; } }
  /* visual */
  const v = content.visual || {}, vy = Math.max(y + 60, 1050);
  if (v.type === 'ring') {
    const cx = W / 2, cy = vy + 260, r = 230;
    c.lineWidth = 46; c.lineCap = 'round'; c.strokeStyle = T.track; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    const g = c.createLinearGradient(cx - r, cy, cx + r, cy); g.addColorStop(0, T.a); g.addColorStop(1, T.b);
    c.strokeStyle = g; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, v.p)); c.stroke();
  } else if (v.type === 'bars2') {
    const bw = 300, base = vy + 520, hmax = 460;
    [[v.a, 'antes', T.track], [Math.max(0.05, v.b), 'agora', null]].forEach(([p, lb, col], k) => {
      const x = W / 2 - bw - 30 + k * (bw + 60), hh = hmax * p;
      if (col) c.fillStyle = col; else { const g = c.createLinearGradient(0, base - hh, 0, base); g.addColorStop(0, T.a); g.addColorStop(1, T.b); c.fillStyle = g; }
      roundRect(c, x, base - hh, bw, hh, 36); c.fill();
      c.fillStyle = T.soft; c.font = body(600, 40); c.fillText(lb, x + 20, base + 60);
    });
  } else if (v.type === 'cats' && v.cats?.length) {
    let yy = vy + 40; const tot = v.cats.reduce((a, x) => a + x.share, 0) || 1;
    for (const ct of v.cats) {
      c.fillStyle = T.track; roundRect(c, pad, yy, W - pad * 2, 34, 17); c.fill();
      const g = c.createLinearGradient(pad, 0, W - pad, 0); g.addColorStop(0, T.a); g.addColorStop(1, T.b); c.fillStyle = g;
      roundRect(c, pad, yy, Math.max(40, (W - pad * 2) * ct.share / Math.max(...v.cats.map(x => x.share))), 34, 17); c.fill();
      c.fillStyle = T.ink; c.font = body(600, 42); c.fillText(`${ct.cat}`, pad, yy - 22); c.textAlign = 'right'; c.fillText(Math.round(ct.share / tot * tot * 100) + '%', W - pad, yy - 22); c.textAlign = 'left';
      yy += 150;
    }
  } else if (v.type === 'dots') {
    const per = 6, size = 92, gap = 34; const startX = (W - (per * size + (per - 1) * gap)) / 2;
    for (let k = 0; k < 12; k++) { const x = startX + (k % per) * (size + gap), yy = vy + 120 + Math.floor(k / per) * (size + gap); c.fillStyle = k < v.n ? T.a : T.track; c.beginPath(); c.arc(x + size / 2, yy + size / 2, size / 2, 0, Math.PI * 2); c.fill(); }
  } else if (v.type === 'months' && v.values) {
    const vals = v.values, mx = Math.max(1, ...vals.filter(x => x != null));
    const base = Math.min(vy + 460, H - 340), hmax = Math.max(160, base - vy - 40);
    const gap = 18, bw = (W - pad * 2 - gap * 11) / 12;
    vals.forEach((val, k) => {
      const x = pad + k * (bw + gap);
      if (val == null) { c.fillStyle = T.track; roundRect(c, x, base - 10, bw, 10, 5); c.fill(); }
      else {
        const hh = Math.max(24, hmax * val / mx);
        if (k === v.best) { const g = c.createLinearGradient(0, base - hh, 0, base); g.addColorStop(0, T.a); g.addColorStop(1, T.b); c.fillStyle = g; }
        else c.fillStyle = T.track;
        roundRect(c, x, base - hh, bw, hh, Math.min(18, bw / 2)); c.fill();
      }
      c.fillStyle = k === v.best ? T.ink : T.soft; c.font = body(k === v.best ? 800 : 600, 34); c.textAlign = 'center'; c.fillText('JFMAMJJASOND'[k], x + bw / 2, base + 50); c.textAlign = 'left';
    });
  } else if (v.type === 'trophy') {
    c.font = display(800, 420); c.textAlign = 'center'; c.fillText('🏆', W / 2, vy + 460); c.textAlign = 'left';
  }
  /* assinatura */
  const logo = await loadLogo();
  if (logo.complete && logo.naturalWidth) { c.save(); roundRect(c, pad, H - 220, 96, 96, 24); c.clip(); c.drawImage(logo, pad, H - 220, 96, 96); c.restore(); }
  c.fillStyle = T.ink; c.font = display(800, 56); c.fillText('Bivvo', pad + 124, H - 168);
  c.fillStyle = T.soft; c.font = body(500, 38); c.fillText(location.hostname, pad + 124, H - 120);
  c.font=body(600,32);c.fillText('Descubra seu próximo passo no Bivvo',pad,H-60);
}
function roundRect(c, x, y, w, h0, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h0, r); c.arcTo(x + w, y + h0, x, y + h0, r); c.arcTo(x, y + h0, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function fitText(c, text, max, px, font) { let p = px; c.font = font(p); while (c.measureText(text).width > max && p > 60) { p -= 8; c.font = font(p); } }
function wrapText(c, text, x, y, max, lh) {
  const words = String(text || '').split(' '); let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > max && line) { c.fillText(line, x, y); y += lh; line = w; } else line = t; }
  if (line) c.fillText(line, x, y);
  return y + lh;
}

async function storyInviteUrl() {
  try {
    const url = new URL('/quanto-posso-gastar-hoje/', location.origin);
    url.searchParams.set('utm_source', 'bivvo_share');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'viral_8192');
    const u = cloud.currentUser();
    if (u && !ctx.demo) url.searchParams.set('ref', (await sha256Hex('bivvo:' + u.id)).slice(0, 8));
    return url.toString();
  } catch { return location.origin + '/quanto-posso-gastar-hoje/'; }
}

export function openStoryComposer(init = {}) {
  const opt = { template: init.template || 'month', source: init.source || 'composer', ym: init.ym, year: init.year, goalId: init.goalId, challengeId: init.challengeId, values: false, theme: 'claro', goalName: false, space:init.space };
  const canvas = h('canvas.story-canvas', { width: 1080, height: 1920, role: 'img', 'aria-label': 'Prévia do card' });
  const note = h('p.form-msg');
  const valuesT = h('input', { type: 'checkbox', role: 'switch' });
  const goalT = h('input', { type: 'checkbox', role: 'switch', checked: false });
  const goalRow = h('label.toggle', h('span', h('b', 'Mostrar nome da meta')), goalT, h('i', { 'aria-hidden': 'true' }));
  let busy = false, created=false;
  const paint = async () => {
    const content = storyContent(opt);
    goalRow.hidden = opt.template !== 'goal';
    if (!content) { note.textContent = 'Ainda não há dados suficientes para esse card. Tente outro modelo.'; canvas.classList.add('dim'); return; }
    note.textContent = ''; canvas.classList.remove('dim');
    await drawStory(canvas, content, opt.theme);
    if(!created){created=true;track('story_created',{source:opt.template});}
  };
  valuesT.addEventListener('change', () => { opt.values = valuesT.checked; paint(); });
  goalT.addEventListener('change', () => { opt.goalName = goalT.checked; paint(); });
  const tpl = segmented(TEMPLATES, opt.template, v => { opt.template = v; if (v === 'spendable') track('spendable_card_opened', { source: 'composer' }); paint(); }, 'scroll');
  const theme = segmented([{ value: 'claro', label: 'Claro' }, { value: 'grafite', label: 'Grafite' }, { value: 'magenta', label: 'Magenta' }], opt.theme, v => { opt.theme = v; paint(); });
  const shareBtn = h('button.btn.primary', { type: 'button', onclick: () => share() }, 'Compartilhar');
  const sheet = openSheet({
    title: 'Bivvo Wrapped & Stories', subtitle: 'Crie um card para compartilhar sua evolução. Saldo, dívidas e cartões nunca aparecem; valores em reais ficam ocultos por padrão.', wide: true,
    content: h('div.composer', h('div.story-frame', canvas), h('div.composer-ctl', h('div.field', h('span', 'Modelo'), tpl), h('div.field', h('span', 'Estilo'), theme),
      h('label.toggle', h('span', h('b', 'Mostrar valores em reais'), h('small', 'Desligado: só percentuais')), valuesT, h('i', { 'aria-hidden': 'true' })), goalRow, note)),
    footer: [h('button.btn', { type: 'button', onclick: () => download() }, 'Baixar imagem'), shareBtn]
  });
  paint();
  if (opt.template === 'spendable') track('spendable_card_opened', { source: opt.source });
  async function blob() { await paint(); return new Promise(r => canvas.toBlob(r, 'image/png')); }
  async function share() {
    if (busy || canvas.classList.contains('dim')) return; busy = true;
    try {
      const b = await blob(); const file = new File([b], 'bivvo-story.png', { type: 'image/png' });
      const shareText = opt.template === 'spendable'
        ? 'Eu finalmente sei quanto posso gastar sem comprometer minhas contas. Descubra o seu número no Bivvo:'
        : 'Estou deixando meu dinheiro mais claro com o Bivvo. Se quiser testar, use meu convite:';
      const url = await storyInviteUrl();
      if (navigator.canShare?.({ files: [file] })) {
        /* A tentativa é separada do retorno do sistema. Web Share pode suspender a PWA antes de devolver o controle ao JS.
           Registra e persiste a tentativa ANTES de abrir a folha nativa. Se o usuário
           cancelar e o navegador devolver AbortError, gravamos um evento de cancelamento;
           o retorno do sistema não comprova postagem, entrega ou leitura. */
        track('story_share_attempt', { source: opt.template });
        
        await flushAnalytics();
        try {
          await navigator.share({ files: [file], title: 'Meu Bivvo', text: shareText, url });
          track('story_shared', {source:opt.template,result:'system_completed'});
          if(opt.template==='spendable')track('spendable_card_shared',{source:'native_share',result:'system_completed'});
          haptic(10);
        } catch (e) {
          if (e?.name === 'AbortError') {
            track('story_share_canceled', { source: opt.template,result:'attempt_canceled' });
            if (opt.template === 'spendable') track('spendable_card_share_canceled', { source: 'native_share',result:'attempt_canceled' });
            await flushAnalytics();
          }
          throw e;
        }
      }
      else {
        saveBlob(b);
        let copied=false;try { await navigator.clipboard.writeText(`${shareText} ${url}`);copied=true; } catch {}
        track('story_downloaded', { source: opt.template });
        if (opt.template === 'spendable') track('spendable_card_downloaded', { source: 'fallback' });
        toast(copied?'Download solicitado e link de convite copiado.':'Download solicitado. Copie o endereço do Bivvo para acompanhar a imagem.');
      }
    } catch (e) { if (e?.name !== 'AbortError') toast('Não foi possível compartilhar. Tente baixar a imagem.'); }
    finally { busy = false; }
  }
  async function download() {
    if (canvas.classList.contains('dim')) return;
    saveBlob(await blob()); track('story_downloaded', { source: opt.template });
    if (opt.template === 'spendable') track('spendable_card_downloaded', { source: 'download' });
    toast('Imagem salva.');
  }
  return sheet;
}
function saveBlob(b) { const url = URL.createObjectURL(b); const a = h('a', { href: url, download: 'bivvo-story.png' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }

/* ---------------------------------------------------------------- */
export function celebrateChallenge(ch) {
  const def = challengeDef(ch.type); if (!def) return;
  haptic([10, 40, 10]);
  const sheet = openSheet({ label: 'Desafio concluído', content: h('div.celebrate', h('div.trophy', { 'aria-hidden': 'true' }, '🏆'), h('h2', 'Desafio concluído'), h('p', def.title + (ch.cat ? ` · ${ch.cat}` : '')), h('p.muted', 'Foi você quem fez. O Bivvo só mediu.')),
    footer: [h('button.btn', { type: 'button', onclick: () => sheet.close() }, 'Fechar'), h('button.btn.primary', { type: 'button', onclick: () => { sheet.close(); openStoryComposer({ template: 'challenge', challengeId: ch.id }); } }, 'Criar card')] });
}

/* ---------------------------------------------------------------- */
/* Convite (pronto para código de indicação e benefícios futuros)    */
/* ---------------------------------------------------------------- */
export async function inviteFriend() {
  let code = '';
  const u = cloud.currentUser();
  if (u && !ctx.demo) code = (await sha256Hex('bivvo:' + u.id)).slice(0, 8);
  const inviteUrl = new URL('/quanto-posso-gastar-hoje/', location.origin);
  inviteUrl.searchParams.set('utm_source', 'bivvo_share');
  inviteUrl.searchParams.set('utm_medium', 'referral');
  inviteUrl.searchParams.set('utm_campaign', 'viral_8192');
  if (code) inviteUrl.searchParams.set('ref', code);
  const url = inviteUrl.toString();
  const shareText = 'Descubra quanto você pode gastar sem comprometer suas contas. Entre pelo meu convite do Bivvo e, depois de começar a usar, você ganha 7 dias de Pro:';
  const status = h('div.referral-status', h('b', 'Carregando seu progresso…'));
  const link = h('input.input', { value: url, readOnly: true, 'aria-label': 'Seu link de indicação' });
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); toast('Link de indicação copiado.'); track('referral_link_copied', { source: 'referral_center' }); }
    catch { link.select(); document.execCommand('copy'); toast('Link copiado.'); }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Bivvo', text: shareText, url });
      else { await navigator.clipboard.writeText(`${shareText} ${url}`); toast('Convite copiado.'); }
      if (!ctx.demo) { store.commit(s => { s.profile.invitesSent = (s.profile.invitesSent || 0) + 1; }, { reason: 'invite' }); track('referral_sent', { source: 'referral_center' }); }
    } catch (e) { if (e?.name !== 'AbortError') toast('Não foi possível compartilhar.'); }
  };
  const content = [
    h('div.referral-hero', h('h3', 'Convide amigos. Os dois ganham.'), h('p.muted', 'Seu amigo ganha 7 dias de Pro após confirmar o e-mail e salvar 3 lançamentos próprios com pelo menos 2 datas diferentes. A cada 3 amigos ativados, você ganha 30 dias de Pro.')),
    status,
    h('div.referral-how', h('b', 'Como funciona'), h('p', '1. Envie seu link pessoal.'), h('p', '2. Seu amigo cria a conta pelo link.'), h('p', '3. Quando ele confirmar o e-mail e salvar 3 lançamentos próprios com pelo menos 2 datas diferentes, a indicação é ativada.')),
    h('div', h('small.muted', 'Seu link pessoal'), link),
    h('div.btn-row', h('button.btn', { type:'button', onclick: copy }, 'Copiar link'), h('button.btn.primary', { type:'button', onclick: share }, 'Convidar agora')),
    h('small.muted', 'Limite de até 4 recompensas de 30 dias em um período de 12 meses. Uma conta indicada só pode gerar uma ativação.')
  ];
  openSheet({ title: '🎁 Indique e ganhe Pro', subtitle: 'Cresça com o Bivvo e ganhe tempo de Pro.', content });
  if (ctx.demo || !u) { status.replaceChildren(h('p.muted', 'Entre em uma conta para gerar seu link e acompanhar as indicações.')); return code; }
  track('referral_center_viewed');
  try {
    const r=await fetch('/api/referral-status',{headers:{Authorization:'Bearer '+await cloud.accessToken()}}), j=await r.json();
    if(!r.ok||!j.ok) throw new Error();
    const capped=j.needed===0 && j.activated>=12;
    status.replaceChildren(
      h('div.referral-progress', h('small', 'AMIGOS ATIVADOS NOS ÚLTIMOS 12 MESES'), h('strong', String(j.activated)), h('p', capped ? 'Você atingiu o limite atual de recompensas.' : `${j.progress}/3 para a próxima recompensa`)),
      h('div.referral-reward', h('b', `${j.rewards} recompensa${j.rewards===1?'':'s'} conquistada${j.rewards===1?'':'s'}`), h('small', `${j.rewards*30} dias de Pro concedidos pelo programa neste período`))
    );
  } catch { status.replaceChildren(h('p.muted', 'Seu link está pronto. O progresso ficará disponível quando o servidor conseguir sincronizar.')); }
  return code;
}
