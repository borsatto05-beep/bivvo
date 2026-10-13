/* Bivvo 10.5 — "Posso comprar?": simulação determinística.
   Copia o estado, aplica a compra na cópia com as MESMAS regras do app (addCardPurchase etc.)
   e recalcula com as MESMAS funções financeiras. Nada é gravado aqui. */
import { round2, today, ymOf, addMonthsYM, uid, monthName } from './util.js';
import * as store from './store.js';
import * as F from './finance.js';

const clone = () => JSON.parse(JSON.stringify(store.getState()));

/* Renda mensal de referência: média das entradas reais dos últimos 3 meses fechados; senão, entradas fixas. */
export function monthlyIncomeRef(s = store.getState()) {
  const cur = ymOf(today());
  const vals = [1, 2, 3].map(n => F.monthSummary(addMonthsYM(cur, -n), s).income).filter(v => v > 0);
  if (vals.length) return round2(vals.reduce((a, b) => a + b, 0) / vals.length);
  return round2(s.fixed.filter(f => f.type === 'income').reduce((a, f) => a + (Number(f.value) || 0), 0));
}

function apply(s, { value, method, cardName, parts, down }) {
  const t0 = today();
  const card = s.cards.find(c => c.name === cardName) || s.cards[0];
  if (method === 'card' && card) {
    if (down > 0) s.transactions.push({ id: uid(), date: t0, desc: 'Simulação (entrada)', cat: 'Compras', type: 'expense', value: round2(down), status: 'Pago', method: 'PIX', createdAt: Date.now() });
    if (value - down > 0) store.addCardPurchase(s, { desc: 'Simulação', cat: 'Compras', total: round2(value - down), parts, card: card.name, date: t0 });
  } else s.transactions.push({ id: uid(), date: t0, desc: 'Simulação', cat: 'Compras', type: 'expense', value: round2(value), status: 'Pago', method: 'PIX', createdAt: Date.now() });
  return card;
}

export function simulatePurchase(input) {
  const opt = { value: round2(Number(input.value) || 0), method: input.method === 'card' ? 'card' : 'cash', cardName: input.cardName, parts: Math.max(1, Math.min(24, Math.floor(input.parts) || 1)), down: Math.max(0, round2(Number(input.down) || 0)) };
  if (opt.method !== 'card') { opt.parts = 1; opt.down = 0; }
  opt.down = Math.min(opt.down, opt.value);
  const base = clone(), after = clone();
  return F.computeFresh(() => {
    const sp0 = F.spendable(base);
    const card = apply(after, opt);
    const sp1 = F.spendable(after);
    const income = monthlyIncomeRef(base);
    let months = [], limitAfter = null, limitBefore = null, overLimit = false;
    if (opt.method === 'card' && card) {
      const c0 = F.cardStatus(base.cards.find(c => c.id === card.id), base);
      const c1 = F.cardStatus(after.cards.find(c => c.id === card.id), after);
      months = c1.next.map((n, k) => ({ ym: n.ym, before: c0.next[k]?.total || 0, after: n.total, delta: round2(n.total - (c0.next[k]?.total || 0)) })).filter(m => m.delta > 0.004);
      limitBefore = card.limit ? c0.used / card.limit : null;
      limitAfter = card.limit ? c1.used / card.limit : null;
      overLimit = card.limit > 0 && c1.used > card.limit + 0.004;
    }
    const freeDrop = round2(sp0.free - sp1.free);
    const dropShare = sp0.free > 0 ? freeDrop / sp0.free : (freeDrop > 0 ? 1 : 0);
    const worst = months.slice().sort((a, b) => b.after - a.after)[0] || null;
    const pressure = worst && income > 0 ? worst.after / income : 0;
    let tone = 'tranquilo';
    if (sp1.free < 0 || overLimit || pressure > 0.6 || dropShare > 0.8) tone = 'apertado';
    else if (dropShare > 0.45 || (limitAfter != null && limitAfter > 0.8) || pressure > 0.4) tone = 'atencao';
    const partValue = opt.method === 'card' ? round2((opt.value - opt.down) / opt.parts) : opt.value;
    let message;
    if (overLimit) message = 'Essa compra passa do limite disponível do cartão.';
    else if (sp1.free < 0) message = 'Com essa compra, as contas até o próximo dinheiro ficam maiores que o seu saldo.';
    else if (tone === 'apertado' && worst && pressure > 0.6) message = `Você consegue, mas a fatura de ${monthName(worst.ym)} ficaria muito pesada.`;
    else if (tone === 'apertado') message = `Essa compra comprometeria ${Math.round(dropShare * 100)}% do seu dinheiro livre.`;
    else if (tone === 'atencao' && worst && pressure > 0.4) message = `Você consegue fazer essa compra, mas ${monthName(worst.ym)} ficará apertado.`;
    else if (tone === 'atencao' && limitAfter > 0.8) message = `Dá para comprar, mas o cartão ficaria com ${Math.round(limitAfter * 100)}% do limite usado.`;
    else if (tone === 'atencao') message = `Dá para comprar, mas leva ${Math.round(dropShare * 100)}% do seu dinheiro livre até o próximo dinheiro.`;
    else message = opt.method === 'card' && freeDrop < 0.01 ? 'Cabe com folga: a primeira parcela só vence depois do seu próximo dinheiro.' : 'Cabe com folga no seu mês.';
    return { opt, tone, message, partValue, before: { free: sp0.free, perDay: sp0.perDay }, after: { free: sp1.free, perDay: sp1.perDay, days: sp1.days, until: sp1.until }, freeDrop, dropShare, months, worst, limitBefore, limitAfter, overLimit, income };
  });
}

/* 11.24 — camada comportamental do Posso comprar? 2.0.
   Só interpreta números já calculados; não grava nem inventa juros/datas. */
export function purchaseVerdict(r) {
  if (r.overLimit || r.after.free < 0) return { level:'nao', label:'Não recomendado agora', icon:'🔴' };
  if (r.tone === 'apertado' || r.dropShare > .65) return { level:'arriscada', label:'Compra arriscada', icon:'🟠' };
  if (r.tone === 'atencao') return { level:'esperar', label:'Melhor esperar', icon:'🟡' };
  return { level:'pode', label:'Pode comprar', icon:'🟢' };
}

export function futurePurchaseImpact(r) {
  const monthlyAdded = r.opt.method === 'card' ? r.partValue : 0;
  const futureTotal = r.opt.method === 'card' ? round2(r.opt.value - r.opt.down) : 0;
  const currentPeak = r.worst ? round2(r.worst.before) : 0;
  const afterPeak = r.worst ? round2(r.worst.after) : 0;
  return { monthlyAdded, futureTotal, months: r.opt.method === 'card' ? r.opt.parts : 0, currentPeak, afterPeak };
}

/* Procura, nas faturas reais já calculadas, o primeiro mês futuro cuja carga cai
   de forma relevante. É uma janela melhor observável, não uma promessa. */
export function bestPurchaseWindow(r) {
  if (r.opt.method !== 'card' || r.tone === 'tranquilo' || !r.months.length) return null;
  const rows = r.months;
  const now = rows[0]?.before || 0;
  const threshold = Math.max(r.partValue * .75, now * .15, 1);
  const hit = rows.slice(1).find(x => now - x.before >= threshold);
  if (!hit) return null;
  return { ym: hit.ym, released: round2(Math.max(0, now - hit.before)), before: round2(hit.before), reason:`Os compromissos já cadastrados no cartão caem cerca de ${Math.round(Math.max(0, now-hit.before))} reais até esse mês.` };
}

export function shouldImpulseBrake(r) {
  return purchaseVerdict(r).level !== 'pode' && (r.dropShare >= .35 || r.tone === 'apertado' || r.overLimit || r.after.free < 0 || (r.limitAfter != null && r.limitAfter >= .8));
}

const RANK = { tranquilo: 0, atencao: 1, apertado: 2 };
/* Procura uma alternativa simples que melhore o resultado: mais parcelas e/ou uma entrada. */
export function suggestAlternative(res) {
  if (res.tone === 'tranquilo' || res.opt.method !== 'card') return null;
  const tries = [];
  for (const p of [res.opt.parts + 2, res.opt.parts + 4, 10, 12]) if (p > res.opt.parts && p <= 12) tries.push({ ...res.opt, parts: p });
  const downOpts = [0.2, 0.3].map(k => Math.round(res.opt.value * k / 50) * 50).filter(d => d > 0 && d < res.before.free);
  for (const d of downOpts) { tries.push({ ...res.opt, down: d }); tries.push({ ...res.opt, down: d, parts: Math.max(res.opt.parts, 10) }); }
  let best = null;
  for (const t of tries) {
    const r = simulatePurchase(t);
    if (RANK[r.tone] < RANK[res.tone] && (!best || RANK[r.tone] < RANK[best.tone])) best = r;
    if (best && best.tone === 'tranquilo') break;
  }
  return best;
}
