/* Bivvo — utilitários puros e construtor de DOM seguro.
   Regra da casa: texto vindo do usuário entra SEMPRE como textContent. */

export const VERSION = '11.84.0';
export const RELEASE_DATE = '13/10/2026';

/* ---------- números e moeda ---------- */
export const round2 = v => Math.round((Number(v) || 0) * 100) / 100;
export const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const money = v => BRL.format(Math.round(num(v) * 100) / 100 + 0); /* arredonda e soma 0: nunca mostra "-R$ 0,00" */
export const money0 = v => BRL0.format(Math.round(num(v)));
export const moneyShort = v => {
  const n = num(v), a = Math.abs(n);
  if (a >= 1e6) return (n < 0 ? '-' : '') + 'R$ ' + (a / 1e6).toFixed(1).replace('.', ',') + ' mi';
  if (a >= 1e4) return (n < 0 ? '-' : '') + 'R$ ' + (a / 1e3).toFixed(1).replace('.', ',') + ' mil';
  return money0(n);
};
export const pct = (v, d = 0) => (num(v)).toFixed(d).replace('.', ',') + '%';
/* Converte "1.234,56", "1234.56", "R$ 12" em número. */
export function parseMoney(s) {
  if (typeof s === 'number') return s;
  let t = String(s ?? '').replace(/[^\d,.-]/g, '');
  if (!t) return 0;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}
/* Divide um total em n parcelas que somam exatamente o total. */
export function splitInstallments(total, parts) {
  const cents = Math.round(num(total) * 100), n = Math.max(1, Math.floor(parts));
  const base = Math.floor(cents / n), rest = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < rest ? 1 : 0)) / 100);
}

/* ---------- datas (sempre no fuso local; nunca toISOString para "hoje") ---------- */
export const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso(new Date());
export const parseISO = s => { const [y, m, d] = String(s || '').split('-').map(Number); return new Date(y || 1970, (m || 1) - 1, d || 1, 12); };
export const ymOf = s => String(s || '').slice(0, 7);
export const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m: 1-12
export function addMonthsYM(ym, n) {
  const [y, m] = String(ym).split('-').map(Number);
  const t = (y * 12 + (m - 1)) + n;
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
}
/* Soma meses mantendo o dia, limitado ao último dia do mês (31/jan + 1 = 28 ou 29/fev). */
export function addMonthsDate(date, n, dayHint) {
  const [y, m, d] = String(date).split('-').map(Number);
  const ym = addMonthsYM(`${y}-${pad(m)}`, n);
  const [yy, mm] = ym.split('-').map(Number);
  const day = Math.min(dayHint || d || 1, daysInMonth(yy, mm));
  return `${ym}-${pad(day)}`;
}
export function dateInYM(ym, day) {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${pad(Math.min(Math.max(1, Math.floor(day) || 1), daysInMonth(y, m)))}`;
}
export const addDays = (date, n) => { const d = parseISO(date); d.setDate(d.getDate() + n); return iso(d); };
export const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const monthName = ym => MONTHS[Number(String(ym).slice(5, 7)) - 1] || '';
export const monthLabel = ym => { const n = monthName(ym); return n.charAt(0).toUpperCase() + n.slice(1) + ' ' + String(ym).slice(0, 4); };
export const monthShort = ym => monthName(ym).slice(0, 3);
export function dayLabel(date) {
  const t = today();
  if (date === t) return 'Hoje';
  if (date === addDays(t, -1)) return 'Ontem';
  if (date === addDays(t, 1)) return 'Amanhã';
  const d = parseISO(date);
  const w = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return `${w}, ${d.getDate()} de ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
export const shortDate = date => { const d = parseISO(date); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
export function isoWeek(date) {
  const d = parseISO(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day + 3);
  const firstThu = new Date(d.getFullYear(), 0, 4); const w = 1 + Math.round(((d - firstThu) / 86400000 - 3 + ((firstThu.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${pad(w)}`;
}

/* ---------- ids ---------- */
export const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

/* ---------- DOM seguro ---------- */
/* h('div.card#x', {onclick, dataset:{}, attrs}, 'texto', node, [nodes]) */
export function h(sel, props, ...kids) {
  const m = String(sel).match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i) || [];
  const el = document.createElement(m[1] || 'div');
  (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, v) => { if (t === '.') el.classList.add(v); else el.id = v; });
  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) { kids.unshift(props); props = null; }
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') String(v).split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'text') el.textContent = v;
    else if (k === 'vars') for (const [n, val] of Object.entries(v)) el.style.setProperty(n, val); /* CSSOM: permitido pela CSP */
    else if (k in el && k !== 'list' && k !== 'form') { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, kids);
  return el;
}
export function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false || k === true) continue;
    el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}
const SVGNS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const k of kids.flat()) if (k != null) el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
}
export const $ = (q, r = document) => r.querySelector(q);
export const $$ = (q, r = document) => [...r.querySelectorAll(q)];
export const clear = el => { el.replaceChildren(); return el; };

export function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const sum = (arr, f = x => (x && typeof x === 'object' ? x.value : x)) => arr.reduce((a, x) => a + num(f(x)), 0);
export function groupBy(arr, f) { const m = new Map(); for (const x of arr) { const k = f(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; }
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function haptic(ms = 8) { try { navigator.vibrate?.(ms); } catch { /* sem suporte */ } }

/* Pseudoaleatório determinístico (demo estável). */
export function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
