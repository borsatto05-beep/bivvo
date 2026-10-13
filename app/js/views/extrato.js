/* Bivvo — Extrato: lista por dia, busca, filtros e calendário do mês. */
import { h, money, money0, today, ymOf, addMonthsYM, monthLabel, dayLabel, groupBy, daysInMonth, pad, parseISO } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { emptyState, segmented, catIcon } from '../ui.js';
import { txRow, stat, catBars } from './components.js';
import { payInvoice,openTxForm } from './forms.js';
import { ctx, go, rerender } from '../nav.js';
import {matchesTransaction} from '../experience.js';

const ui = { q: '', kind: 'all', cat: '', view: 'list', day: null };

export function monthSwitcher(onChange) {
  const ym = ctx.month;
  const shift = n => { ctx.month = addMonthsYM(ctx.month, n); ui.day = null; onChange(); };
  return h('div.month-switch', { role: 'group', 'aria-label': 'Mês' },
    h('button.icon-btn', { type: 'button', 'aria-label': 'Mês anterior', onclick: () => shift(-1) }, '‹'),
    h('button.month-label', { type: 'button', onclick: () => { if (ctx.month !== ymOf(today())) { ctx.month = ymOf(today()); onChange(); } } }, monthLabel(ym)),
    h('button.icon-btn', { type: 'button', 'aria-label': 'Próximo mês', onclick: () => shift(1) }, '›'));
}

export function renderExtrato(root) {
  const company=store.activeFinanceProfile()==='company';
  const actual=store.getState();const s={...actual,transactions:actual.transactions.filter(t=>store.recordVisible(t,actual))};
  if (ctx.params.v === 'cal') { ui.view = 'cal'; ctx.params.v = null; }
  if (ctx.params.cat) { ui.cat = ctx.params.cat; ctx.params.cat = null; }
  const ym = ctx.month, sm = F.monthSummary(ym, actual);
  const rows = F.monthTx(ym, s).filter(t => !F.isLoanPrincipalOut(t) && !F.isLoanPrincipalReturn(t));

  const invoiceRows=F.pendingCardInvoices(actual);
  const monthInvoices=invoiceRows.filter(t=>t.date.startsWith(ym));
  const search = h('input.input.search', { type: 'search', placeholder: 'Local, valor, categoria ou data', value: ui.q, 'aria-label': 'Buscar lançamentos' });
  const listHost = h('div');
  search.addEventListener('input', () => { ui.q = search.value; paintList(); });
  const kinds = segmented(company?[{ value:'all',label:'Tudo'},{value:'expense',label:'Despesas'},{value:'income',label:'Receitas'},{value:'card',label:'Cartão'},{value:'pending',label:'Pendentes'}]:[{ value: 'all', label: 'Tudo' }, { value: 'expense', label: 'Gastos' }, { value: 'income', label: 'Entradas' }, { value: 'card', label: 'Cartão' }, { value: 'pending', label: 'Pendentes' }], ui.kind, v => { ui.kind = v; paintList(); }, 'scroll');
  const catSel = h('select.input.sm', { 'aria-label': 'Categoria' }, h('option', { value: '' }, 'Todas as categorias'), [...new Set(s.transactions.map(t => t.cat))].sort().map(c => h('option', { value: c }, c)));
  catSel.value = ui.cat;
  catSel.addEventListener('change', () => { ui.cat = catSel.value; paintList(); });
  const viewSeg = segmented([{ value: 'list', label: 'Lista' }, { value: 'cal', label: 'Calendário' }], ui.view, v => { ui.view = v; rerender(); });

  root.append(
    h('div.page-head', monthSwitcher(rerender), viewSeg),
    h('div.stats.card.flat', stat(company?'Receitas':'Entradas', money0(sm.income), sm.income > sm.incomePaid ? `${money0(sm.income - sm.incomePaid)} a receber` : null, 'in'), stat(company?(sm.planned?'Despesas até hoje':'Despesas'):(sm.planned ? 'Gastos até hoje' : 'Gastos'), money0(sm.spend)),
      sm.planned ? stat('Agendado', money0(sm.planned), 'contas e parcelas do mês') : stat('Resultado', money0(sm.result), null, sm.result < 0 ? 'neg' : '')));

  if (!rows.length && !s.transactions.length && !monthInvoices.length) {
    root.append(emptyState({ icon: '🧾', title: `Nada registrado em ${monthLabel(ym).toLowerCase()}`, text: ym > ymOf(today()) ? (company?'Custos recorrentes, recebimentos e parcelas aparecem aqui automaticamente.':'Contas fixas e parcelas aparecem aqui automaticamente.') : (company?'Registre uma receita ou despesa para começar a acompanhar o fluxo de caixa.':'Registre um gasto para começar a ver para onde vai seu dinheiro.'), action: { label: company?'Adicionar despesa':'Adicionar gasto', fn: () => openTxForm({ mode: 'expense' }) } }));
    return;
  }

  if (ui.view === 'cal') { root.append(calendar(ym, rows)); return; }

  if (sm.cats.length) root.append(h('details.card.cats-card', { open: false }, h('summary', h('b', company?'Despesas por categoria':'Gastos por categoria'), h('span.muted.sm', 'Toque para filtrar')), catBars(sm.cats, sm.spend, { limit: 8, onPick: c => { ui.cat = c; catSel.value = c; paintList(); listHost.scrollIntoView({ behavior: 'smooth' }); } })));
  const filtersPanel = h('details.filters-card',{open:ui.kind!=='all'||!!ui.cat},
    h('summary', h('span', '☰ Filtros'), h('small.muted', 'Tipo e categoria')),
    h('div.filters', kinds, catSel));
  root.append(h('div.search-global',search,h('small.muted','A busca pesquisa todos os meses.')),filtersPanel, listHost);
  paintList();

  function paintList() {
    const q = ui.q.trim().toLowerCase();
    const source=q?[...s.transactions.filter(t=>!F.isLoanPrincipalOut(t)&&!F.isLoanPrincipalReturn(t)),...invoiceRows]:[...rows,...monthInvoices];
    const list = source.filter(t => {
      if (ui.cat && t.cat !== ui.cat) return false;
      if (ui.kind === 'expense' && t.type !== 'expense') return false;
      if (ui.kind === 'income' && t.type !== 'income') return false;
      if (ui.kind === 'card' && t.method !== 'Crédito' && !F.isCardPayment(t) && !t.invoiceSummary) return false;
      if (ui.kind === 'pending' && (t.status === 'Pago' || t.method === 'Crédito')) return false;
      if (!matchesTransaction(t,q)) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
    if (!list.length) { listHost.replaceChildren(emptyState({ icon: '🔎', title: 'Nenhum lançamento com esses filtros', action: { label: 'Limpar filtros', fn: () => { ui.q = ''; ui.kind = 'all'; ui.cat = ''; rerender(); } } })); return; }
    const t0 = today();
    const past = list.filter(t => t.date <= t0), future = list.filter(t => t.date > t0).sort((a, b) => a.date.localeCompare(b.date));
    const section = items => [...groupBy(items, t => t.date)].map(([d, rows]) => {
      const out = rows.filter(t => t.type === 'expense' && !F.isSave(t) && !F.isCardPayment(t) && !t.invoiceSummary).reduce((a, t) => a + t.value, 0);
      return h('section.day', h('header.day-head', h('b', dayLabel(d)), out ? h('span', '− ' + money(out)) : null), h('div.list', rows.map(t => txRow(t))));
    });
    listHost.replaceChildren(...(q?[h('p.search-results',{role:'status'},`${list.length} resultado(s) em todos os meses`)]:[]),...section(past), ...(future.length ? [h('h3.upcoming', q?'Agendados encontrados':`Agendado para ${monthLabel(ym).split(' ')[0].toLowerCase()}`)] : []), ...section(future), h('p.muted.sm.center', `${list.length} lançamento(s)`));
  }
}

function calendar(ym, rows) {
  const [y, m] = ym.split('-').map(Number), dim = daysInMonth(y, m);
  const first = (parseISO(`${ym}-01`).getDay() + 6) % 7;
  const spendBy = new Map(), billsBy = new Map(), incBy = new Map();
  for (const t of rows) {
    if (F.isSpend(t) && (t.date <= today() || t.status === 'Pago')) spendBy.set(t.date, (spendBy.get(t.date) || 0) + t.value);
    if (t.type === 'expense' && t.status !== 'Pago' && t.method !== 'Crédito') billsBy.set(t.date, (billsBy.get(t.date) || 0) + 1);
    if (F.isRealIncome(t)) incBy.set(t.date, (incBy.get(t.date) || 0) + F.incomeAmount(t));
  }
  const actual=store.getState();const s={...actual,transactions:actual.transactions.filter(t=>store.recordVisible(t,actual))};
  for (const c of s.cards) for (const inv of F.cardStatus(c, s).invoices) if (inv.dueDate.startsWith(ym) && inv.unpaid > 0) billsBy.set(inv.dueDate, (billsBy.get(inv.dueDate) || 0) + 1);
  const max = Math.max(1, ...spendBy.values());
  const t0 = today();
  const detail = h('div.cal-detail');
  const grid = h('div.cal-grid', { role: 'grid', 'aria-label': 'Calendário de ' + monthLabel(ym) },
    ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(d => h('span.cal-dow', { 'aria-hidden': 'true' }, d)),
    Array.from({ length: first }, () => h('span.cal-pad')),
    Array.from({ length: dim }, (_, i) => {
      const d = `${ym}-${pad(i + 1)}`, v = spendBy.get(d) || 0;
      const lvl = v ? Math.min(4, 1 + Math.floor(v / max * 3.99)) : 0;
      return h('button.cal-day.l' + lvl + (d === t0 ? '.today' : '') + (d === ui.day ? '.sel' : ''), { type: 'button', 'aria-label': `${i + 1}: gastos ${money(v)}`, onclick: e => { ui.day = d; grid.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); e.currentTarget.classList.add('sel'); paint(); } },
        h('b', i + 1), v ? h('small', money0(v).replace('R$', '').trim()) : null, billsBy.get(d) ? h('i.dot-bill', { 'aria-hidden': 'true' }) : null, incBy.get(d) ? h('i.dot-in', { 'aria-hidden': 'true' }) : null);
    }));
  const paint = () => {
    const d = ui.day || (t0.startsWith(ym) ? t0 : null);
    if (!d) { detail.replaceChildren(h('p.muted.sm', 'Toque em um dia para ver os lançamentos.')); return; }
    const items = rows.filter(t => t.date === d);
    const due = []; for (const c of s.cards) for (const inv of F.cardStatus(c, s).invoices) if (inv.dueDate === d && inv.unpaid > 0) due.push(h('button.btn.inv-due',{type:'button',onclick:()=>payInvoice(c,inv,{early:inv.state==='aberta'})}, `💳 Fatura ${c.name}: ${money(inv.unpaid)} · pagar`));
    detail.replaceChildren(h('h3', dayLabel(d)), ...due, items.length ? h('div.list', items.map(t => txRow(t))) : h('p.muted.sm', 'Sem lançamentos neste dia.'));
  };
  paint();
  return h('div.card.cal', grid, h('div.cal-legend', h('span', h('i.sw.l1'), 'menos'), h('span', h('i.sw.l4'), 'mais gasto'), h('span', h('i.dot-bill'), 'conta a pagar'), h('span', h('i.dot-in'), 'entrada')), detail);
}
