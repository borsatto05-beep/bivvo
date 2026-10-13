/* Bivvo — componentes visuais compartilhados entre telas. */
import { h, s as svg, money, money0, monthShort, shortDate, today, diffDays } from '../util.js';
import { catIcon, progress } from '../ui.js';
import * as F from '../finance.js';
import { payInvoice,openTxDetail } from './forms.js';

export function txRow(t, { showDate = false } = {}) {
  if(t.invoiceSummary)return invoiceSummaryRow(t);
  const pending = t.status !== 'Pago';
  const meta = [t.cat];
  const capital=F.capitalReceivedValue(t);
  if(capital>0)meta.push(`${money(capital)} no capital separado`);
  if (t.method === 'Crédito') meta.push(t.card || 'Cartão');
  else if (t.method && t.type === 'expense') meta.push(t.method);
  if (showDate) meta.push(shortDate(t.date));
  let badge = null;
  if (t.installment) badge = h('span.badge', t.installment);
  else if (pending && t.method !== 'Crédito') {
    const d = diffDays(today(), t.date);
    badge = h('span.badge.' + (d < 0 ? 'late' : 'wait'), d < 0 ? 'Atrasado' : t.type === 'income' ? 'A receber' : 'A pagar');
  }
  return h('button.tx', { type: 'button', onclick: () => openTxDetail(t.id), 'aria-label': `${t.desc}, ${money(t.value)}` },
    h('span.tx-ico', { 'aria-hidden': 'true' }, catIcon(t.cat)),
    h('span.tx-main', h('b', t.desc.replace(/\s*\(\d+\/\d+\)$/, '')), h('small', meta.join(' · '))),
    h('span.tx-side', h('b.tx-val' + (t.type === 'income' ? '.in' : '') + (pending ? '.pend' : ''), (t.type === 'income' ? '+ ' : '') + money(t.value)), badge));
}

export function invoiceSummaryRow(entry){
  const {card,invoice}=entry;
  return h('button.tx.invoice-summary-row',{type:'button',onclick:()=>payInvoice(card,invoice,{early:invoice.state==='aberta'}),'aria-label':`Pagar fatura ${card.name}, ${money(invoice.unpaid)}`},
    h('span.tx-ico',{'aria-hidden':'true'},'💳'),
    h('span.tx-main',h('b',entry.desc),h('small',`Vence ${shortDate(invoice.dueDate)} · total ${money(invoice.total)}${invoice.paid>0?` · pago ${money(invoice.paid)}`:''}`)),
    h('span.tx-side',h('b.tx-val.pend',money(invoice.unpaid)),h('span.badge',invoice.state==='vencida'?'Vencida · pagar':'Pagar fatura')));
}

export function stat(label, value, sub, tone = '') {
  return h('div.stat' + (tone ? '.' + tone : ''), h('span', label), h('b', value), sub ? h('small', sub) : null);
}

/* Barras das próximas faturas. Tocar mostra o valor. */
export function invoiceBars(next, onPick) {
  const max = Math.max(1, ...next.map(n => n.total));
  const wrap = h('div.ibars', { role: 'list' });
  next.forEach((n, i) => {
    const b = h('button.ibar' + (i === 0 ? '.on' : ''), { type: 'button', role: 'listitem', 'aria-label': `${monthShort(n.ym)}: ${money(n.total)}`, onclick: () => { [...wrap.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); onPick?.(n); } },
      h('i', { vars: { '--h': Math.max(4, n.total / max * 100) + '%' } }), h('small', monthShort(n.ym)));
    wrap.append(b);
  });
  return wrap;
}

export function cardVisual(card, st) {
  return h('div.ccard.' + (card.tint || 'plum'),
    h('div.ccard-top', h('b', card.name), h('span.ccard-chip', { 'aria-hidden': 'true' })),
    h('div.ccard-mid', h('small', 'Fatura atual'), h('strong', money(st.open.total))),
    h('div.ccard-foot', h('small', `Fecha dia ${card.close} · vence dia ${card.due}`), h('small', `Livre ${money0(st.available)}`)),
    progress(st.used, card.limit, 'on-dark'));
}

/* Arco duplo do "Ritmo": tempo (externo) × dinheiro livre usado (interno). */
export function ritmoArc(timeRatio, moneyRatio, tone) {
  const arc = r => `M ${120 - r} 124 A ${r} ${r} 0 0 1 ${120 + r} 124`;
  const el = svg('svg', { viewBox: '0 0 240 132', class: 'ritmo-arc ' + tone, role: 'img', 'aria-label': `Período ${Math.round(timeRatio * 100)}% passado; dinheiro livre ${Math.round(moneyRatio * 100)}% usado` },
    svg('defs', {}, svg('linearGradient', { id: 'rg', x1: '0', x2: '1' }, svg('stop', { offset: '0', class: 's1' }), svg('stop', { offset: '1', class: 's2' }))),
    svg('path', { d: arc(108), class: 'track t-out', pathLength: '100' }),
    svg('path', { d: arc(108), class: 'fill t-out zero', pathLength: '100', 'stroke-dasharray': '0 101', 'data-p': (timeRatio * 100).toFixed(1) }),
    svg('path', { d: arc(88), class: 'track t-in', pathLength: '100' }),
    svg('path', { d: arc(88), class: 'fill t-in zero', pathLength: '100', 'stroke-dasharray': '0 101', 'data-p': (moneyRatio * 100).toFixed(1) }));
  requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.fill').forEach(p => { const v = Number(p.dataset.p); p.setAttribute('stroke-dasharray', `${v} 101`); p.classList.toggle('zero', v < 0.5); })));
  return el;
}

/* Barras horizontais de categorias */
export function catBars(cats, total, { limit = 5, onPick } = {}) {
  const max = Math.max(1, ...cats.map(c => c.value));
  return h('div.cbars', cats.slice(0, limit).map(c => h(onPick ? 'button.cbar' : 'div.cbar', onPick ? { type: 'button', onclick: () => onPick(c.cat) } : null,
    h('span.cbar-l', h('i', { 'aria-hidden': 'true' }, catIcon(c.cat)), c.cat),
    h('span.cbar-v', money0(c.value), h('small', total ? Math.round(c.value / total * 100) + '%' : '')),
    h('span.cbar-t', h('i', { vars: { '--p': (c.value / max * 100).toFixed(1) + '%' } })))));
}

export function insightList(list) {
  return h('div.insights', list.map(x => h('div.insight' + (x.tone ? '.' + x.tone : ''), h('span', { 'aria-hidden': 'true' }, x.icon), h('p', x.text))));
}
