/* Bivvo — motor financeiro (funções puras sobre o estado).
   Convenções:
   - "Gasto" (consumo) = despesas que não são dinheiro guardado. Parcelas contam no mês de cada parcela.
   - "Saldo geral" = entradas sem principal devolvido − saídas pagas até hoje. Compras no crédito só saem do
     saldo quando a fatura é paga.
   - Fatura = soma das parcelas/compras cujo ciclo de fechamento cai naquele mês. Nunca o total parcelado.
   - Limite comprometido = tudo que ainda não foi pago no cartão (inclui parcelas futuras). */
import { getState, getVersion, invoiceKeyFor } from './store.js';
import { today, ymOf, addMonthsYM, dateInYM, diffDays, addDays, daysInMonth, num, round2, sum, parseISO, isoWeek } from './util.js';
import {capitalReceivedValue, incomeAmount, receivedCapitalRows, capitalAvailable, isCapitalTransfer} from './capital-balances.js';
export {capitalReceivedValue, incomeAmount};

const SAVE_CATS = new Set(['Investimentos', 'Reserva de Emergência', 'Guardado']);
export const isOpening = t => t.kind === 'opening' || t.cat === 'Saldo inicial';
export const isSave = t => t.type === 'expense' && (t.kind === 'save' || !!t.goalId || !!t.investmentId || SAVE_CATS.has(t.cat));
export const isWithdraw = t => t.type === 'income' && (t.kind === 'withdraw' || (!!t.goalId && t.type === 'income'));
export const isLoanPrincipalOut = t => t.transactionRole === 'loan_principal_out';
export const isLoanPrincipalReturn = t => t.transactionRole === 'loan_principal_return';
export const isCardPayment = t => t.transactionRole === 'card_payment';
export {isCapitalTransfer};
/* Ajuste/saldo inicial (kind 'opening') só ancora o saldo: nunca é gasto nem renda. */
export const isSpend = t => t.type === 'expense' && !isSave(t) && !isLoanPrincipalOut(t) && !isCardPayment(t) && !isOpening(t) && !isCapitalTransfer(t);

export const isRealIncome = t => t.type === 'income' && !isOpening(t) && !isWithdraw(t) && !isCapitalTransfer(t) && incomeAmount(t)>0;
export const isCredit = t => t.type === 'expense' && t.method === 'Crédito';
export const isPaid = t => t.status === 'Pago';
const effDate = t => t.paidAt || t.date;

/* memoização simples por versão do estado */
const memo = new Map();
let bypass = 0;
/* Calcula sobre um estado hipotético (simulações) sem usar nem poluir o cache do estado real. */
export function computeFresh(fn) { bypass++; try { return fn(); } finally { bypass--; } }
function cached(key, fn) {
  if (bypass) return fn();
  const v = getVersion(), hit = memo.get(key);
  if (hit && hit.v === v && hit.d === today()) return hit.r;
  const r = fn(); memo.set(key, { v, d: today(), r });
  if (memo.size > 300) memo.clear();
  return r;
}

export const monthTx = (ym, s = getState()) => cached('m' + ym, () => s.transactions.filter(t => t.date.startsWith(ym)));

/* ---------- resumo do mês ---------- */
export function monthSummary(ym, s = getState()) {
  return cached('sum' + ym, () => {
    const all = monthTx(ym, s), t0 = today();
    /* no mês corrente, "gasto" é o que já aconteceu; o que está agendado fica em "planned" */
    const isCur = ym === ymOf(t0);
    const rows = isCur ? all.filter(t => t.date <= t0) : all;
    const planned = isCur ? sum(all.filter(t => isSpend(t) && t.date > t0)) : 0;
    const income = sum(all.filter(isRealIncome),incomeAmount);
    const incomePaid = sum(all.filter(t => isRealIncome(t) && isPaid(t)),incomeAmount);
    const spend = sum(rows.filter(isSpend));
    const spendPaid = sum(rows.filter(t => isSpend(t) && isPaid(t)));
    const saved = sum(rows.filter(isSave)) - sum(rows.filter(isWithdraw)) + legacyInvestedIn(ym, s);
    const pendingBills = sum(all.filter(t => t.type === 'expense' && !isCredit(t) && !isPaid(t)));
    const byCat = new Map();
    for (const t of rows) if (isSpend(t)) byCat.set(t.cat, (byCat.get(t.cat) || 0) + t.value);
    const cats = [...byCat.entries()].map(([cat, value]) => ({ cat, value: round2(value), share: spend ? value / spend : 0 })).sort((a, b) => b.value - a.value);
    return { ym, income: round2(income), incomePaid: round2(incomePaid), spend: round2(spend), spendPaid: round2(spendPaid), saved: round2(Math.max(0, saved)),
      result: round2(income - spend - planned), planned: round2(planned), pendingBills: round2(pendingBills), cats, count: all.length };
  });
}
/* investimentos antigos (sem lançamento vinculado) contam como guardado no mês da compra */
function legacyInvestedIn(ym, s) {
  return sum(s.investments.filter(x => !x.txId && String(x.purchaseDate || '').startsWith(ym)), x => num(x.costBasis ?? x.value));
}

/* ---------- saldo ---------- */
export function balance(s = getState()) {
  return cached('bal', () => {
    const t0 = today();
    let b = 0;
    for (const t of s.transactions) {
      if (!isPaid(t) || effDate(t) > t0) continue;
      // O contrato, sozinho, não movimenta caixa. Principal recebido fica no
      // saldo separado do Capital; somente juros entram no saldo geral.
      if (isLoanPrincipalOut(t)) continue;
      // Compras no crédito administradas pelo novo livro de pagamentos não mexem no caixa
      // por conta própria. O dinheiro sai somente no lançamento card_payment correspondente.
      // Compras antigas já marcadas como Pago, sem cardPaymentManaged, continuam válidas
      // para não alterar retroativamente o saldo de usuários existentes.
      if (isCredit(t) && t.cardPaymentManaged) continue;
      b += t.type === 'income' ? incomeAmount(t) : -t.value;
    }
    return round2(b);
  });
}
// Conferir saldo zero também estabelece uma base, sem fabricar um lançamento.
export const hasBalanceBase = (s = getState()) => !!s.profile?.balanceVerifiedV1?.[s.profile?.activeFinanceProfile === 'company' ? 'company' : 'personal'] || s.transactions.some(t => isPaid(t) && ((t.type === 'income' && incomeAmount(t)>0) || isOpening(t)));

export const capitalReceipts = (s = getState()) => receivedCapitalRows(s,today());
export const capitalBalance = (s = getState()) => cached('capital-bal',()=>capitalAvailable(s,today()));
/* "Quanto você tem hoje?" é uma âncora, não uma soma: devolve o ajuste que faz o saldo calculado
   ficar igual ao informado (positivo, negativo ou zero). Calculado sobre o estado recebido, sem cache. */
export function balanceAdjustment(informed, s = getState()) {
  const current = computeFresh(() => balance(s));
  return round2(Number(informed) - current);
}
export function adjustmentTx(diff, { first = false, id, date } = {}) {
  if (Math.abs(diff) < 0.005) return null;
  return { id, date, desc: first ? 'Saldo inicial' : 'Ajuste de saldo', cat: 'Saldo inicial', kind: 'opening', type: diff > 0 ? 'income' : 'expense',
    value: round2(Math.abs(diff)), status: 'Pago', method: 'Outro', createdAt: Date.now(), note: 'Saldo conferido por você no Bivvo. Não conta como renda nem como gasto.' };
}

/* ---------- cartões e faturas ---------- */
export const cardByName = (name, s = getState()) => s.cards.find(c => c.name === name) || (s.cards.length ? s.cards[0] : null);
export const txInvoice = (t, s = getState()) => t.invoice || invoiceKeyFor(cardByName(t.card, s), t.date);
export function invoiceDates(card, ym) {
  const closeDate = dateInYM(ym, card.close);
  const dueYM = card.due > card.close ? ym : addMonthsYM(ym, 1);
  return { closeDate, dueDate: dateInYM(dueYM, card.due) };
}
export function cardPurchasePaidAmount(t) {
  if (!isCredit(t)) return 0;
  if (t.cardPaymentManaged) return round2(Math.min(num(t.value), Math.max(0, num(t.cardPaidAmount))));
  return isPaid(t) ? round2(num(t.value)) : 0;
}
export function cardPurchaseRemaining(t) {
  return round2(Math.max(0, num(t?.value) - cardPurchasePaidAmount(t)));
}
export function cardInvoices(card, s = getState()) {
  return cached('inv' + card.id, () => {
    const map = new Map();
    const ensure = ym => {
      if (!map.has(ym)) map.set(ym, { ym, total: 0, paid: 0, unpaid: 0, items: [], payments: [] });
      return map.get(ym);
    };
    for (const t of s.transactions) {
      if (!isCredit(t) || cardByName(t.card, s)?.id !== card.id) continue;
      const ym = txInvoice(t, s), inv = ensure(ym);
      inv.total += num(t.value);
      inv.paid += cardPurchasePaidAmount(t);
      inv.items.push(t);
    }
    // O pagamento é um lançamento de caixa separado. Ele fica ligado à fatura para
    // auditoria e histórico, mas a baixa econômica da compra é refletida em cardPaidAmount.
    for (const t of s.transactions) {
      if (!isCardPayment(t)) continue;
      const sameCard = t.cardId ? t.cardId === card.id : cardByName(t.card, s)?.id === card.id;
      if (!sameCard || !t.invoice) continue;
      ensure(t.invoice).payments.push(t);
    }
    const t0 = today();
    return [...map.values()].sort((a, b) => a.ym.localeCompare(b.ym)).map(inv => {
      inv.paid = Math.min(inv.total, inv.paid);
      inv.unpaid = Math.max(0, inv.total - inv.paid);
      const d = invoiceDates(card, inv.ym);
      const state = inv.unpaid < 0.005 ? 'paga' : t0 <= d.closeDate ? 'aberta' : t0 > d.dueDate ? 'vencida' : 'fechada';
      return { ...inv, total: round2(inv.total), paid: round2(inv.paid), unpaid: round2(inv.unpaid), ...d, state };
    });
  });
}
export function cardStatus(card, s = getState()) {
  return cached('cs' + card.id, () => {
    const t0 = today(), invs = cardInvoices(card, s);
    const openYM = invoiceKeyFor(card, t0);
    const open = invs.find(i => i.ym === openYM) || { ym: openYM, total: 0, unpaid: 0, items: [], ...invoiceDates(card, openYM), state: 'aberta' };
    /* fatura a pagar: a mais antiga fechada e não paga; senão, a aberta */
    const due = invs.find(i => (i.state === 'fechada' || i.state === 'vencida')) || null;
    const used = round2(sum(invs, i => i.unpaid));
    const next = [0, 1, 2, 3, 4, 5].map(n => { const ym = addMonthsYM(openYM, n); const f = invs.find(i => i.ym === ym); return { ym, total: f ? f.total : 0, unpaid: f ? f.unpaid : 0 }; });
    return { open, due, used, available: round2(Math.max(0, card.limit - used)), usage: card.limit ? used / card.limit : 0, next, invoices: invs };
  });
}
/* Faturas virtuais para a lista: nunca gravadas como uma segunda despesa. */
export function pendingCardInvoices(s=getState()){
  return s.cards.flatMap(card=>cardStatus(card,s).invoices.filter(inv=>inv.unpaid>0.004).map(invoice=>({
    id:`invoice-${card.id}-${invoice.ym}`,invoiceSummary:true,card,invoice,
    desc:`Fatura ${card.name}`,cat:'Cartão de crédito',type:'expense',method:'Fatura de cartão',
    date:invoice.dueDate,value:invoice.unpaid,status:'Pendente'
  })));
}

/* Total de parcelas futuras (próximos N meses de fatura, sem contar a aberta) */
export function installmentsCommit(months = 3, s = getState()) {
  let total = 0;
  for (const c of s.cards) {
    const st = cardStatus(c, s);
    for (const n of st.next.slice(1, 1 + months)) total += n.unpaid;
  }
  return round2(total);
}
export function activeInstallments(s = getState()) {
  const t0 = today();
  return s.installments.map(inst => {
    const rows = s.transactions.filter(t => t.installmentId === inst.id).sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) return null;
    const remaining = rows.filter(t => cardPurchaseRemaining(t) > 0.004);
    const done = rows.length - remaining.length;
    const current = rows.filter(t => t.date <= t0).length;
    return { inst, rows, parts: rows.length, paidCount: done, current: Math.max(1, current), remaining: round2(sum(remaining)), part: rows[rows.length - 1]?.value || 0, total: round2(sum(rows)), card: inst.card };
  }).filter(x => x && x.remaining > 0.004);
}

/* ---------- próxima renda e "quanto posso gastar hoje" ---------- */
export function nextIncome(s = getState()) {
  return cached('ni', () => {
    const t0 = today();
    /* partes de contas divididas não são "próximo dinheiro": ninguém sabe quando o amigo paga */
    const pending = s.transactions.filter(t => isRealIncome(t) && !isPaid(t) && !t.splitId && t.date >= t0 && diffDays(t0, t.date) <= 45).sort((a, b) => a.date.localeCompare(b.date));
    if (pending.length) return { date: pending[0].date, value: incomeAmount(pending[0]), label: pending[0].desc, source: 'agendada' };
    const day = num(s.profile.incomeDay);
    if (day >= 1) { let d = dateInYM(ymOf(t0), day); if (d <= t0) d = dateInYM(addMonthsYM(ymOf(t0), 1), day); return { date: d, value: 0, label: 'Dia de receber', source: 'perfil' }; }
    /* heurística: maior entrada do mês passado, mesmo dia no próximo ciclo */
    const prev = s.transactions.filter(t => isRealIncome(t) && isPaid(t) && t.date <= t0 && diffDays(t.date, t0) <= 40).sort((a, b) => incomeAmount(b) - incomeAmount(a))[0];
    if (prev) { const dd = Number(prev.date.slice(8)); let d = dateInYM(ymOf(t0), dd); if (d <= t0) d = dateInYM(addMonthsYM(ymOf(t0), 1), dd); return { date: d, value: incomeAmount(prev), label: prev.desc, source: 'estimada' }; }
    const [y, m] = t0.split('-').map(Number);
    return { date: addDays(`${y}-${String(m).padStart(2, '0')}-${daysInMonth(y, m)}`, 1), value: 0, label: 'Início do próximo mês', source: 'mes' };
  });
}

/* Janela do "quanto posso gastar": tudo que vence ATÉ o dia do próximo dinheiro, inclusive.
   Datas são texto AAAA-MM-DD em horário local, então a comparação de texto vale também na virada de mês e de ano.
   Regra: vencimento <= dataLimite entra; vencimento > dataLimite fica para depois. */
export const dueBy = (date, until) => !!date && date <= until;

export function spendable(s = getState()) {
  return cached('sp', () => {
    const t0 = today(), next = nextIncome(s), bal = balance(s);
    const until = next.date;
    const days = Math.max(1, diffDays(t0, until));
    /* contas (não cartão) ainda não pagas, inclusive as atrasadas, que vencem até o dia do próximo dinheiro */
    const pendingBills = s.transactions.filter(t => t.type === 'expense' && !isCredit(t) && !isPaid(t));
    const bills = pendingBills.filter(t => dueBy(t.date, until)).sort((a, b) => a.date.localeCompare(b.date));
    const billsTotal = round2(sum(bills));
    /* faturas: só a parte ainda não paga, pela data de VENCIMENTO (a compra no cartão não mexe no saldo antes disso) */
    let invoices = 0; const invList = [], afterInvoices = [];
    for (const c of s.cards) for (const inv of cardStatus(c, s).invoices) {
      if (!(inv.unpaid > 0)) continue;
      if (dueBy(inv.dueDate, until)) { invoices += inv.unpaid; invList.push({ card: c.name, ...inv }); }
      else afterInvoices.push({ card: c.name, ...inv });
    }
    invoices = round2(invoices);
    invList.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const ym = ymOf(t0), sm = monthSummary(ym, s);
    const saveTarget = round2(sm.incomePaid * (s.savingPlan.percent || 0) / 100); /* só sobre o que já entrou */
    const saveLeft = round2(Math.max(0, saveTarget - sm.saved));
    const commitments = round2(billsTotal + invoices);
    const free = round2(bal - commitments - saveLeft) + 0; /* + 0 evita "-0" (exibido como −R$ 0,00) */
    const perDay = free > 0 ? round2(free / days) : 0;
    /* o que vence logo depois do próximo dinheiro: informativo, NÃO reduz o disponível */
    const horizon = addDays(until, 15);
    const after = [
      ...pendingBills.filter(t => t.date > until && t.date <= horizon).map(t => ({ kind: 'bill', label: t.desc, date: t.date, value: round2(t.value), id: t.id })),
      ...afterInvoices.filter(i => i.dueDate <= horizon).map(i => ({ kind: 'invoice', label: i.card, date: i.dueDate, value: round2(i.unpaid), ym: i.ym }))
    ].sort((a, b) => a.date.localeCompare(b.date));
    /* ritmo: quanto do período passou vs. quanto do dinheiro livre já foi */
    const lastIncome = s.transactions.filter(t => isRealIncome(t) && isPaid(t) && t.date <= t0).sort((a, b) => b.date.localeCompare(a.date))[0];
    const start = lastIncome && diffDays(lastIncome.date, t0) < 45 ? lastIncome.date : `${ym}-01`;
    const spentSince = round2(sum(s.transactions.filter(t => isSpend(t) && !t.fixedId && t.date >= start && t.date <= t0)));
    const period = Math.max(1, diffDays(start, until));
    const timeRatio = Math.min(1, Math.max(0, diffDays(start, t0) / period));
    const pool = spentSince + Math.max(0, free);
    const moneyRatio = pool > 0 ? Math.min(1, spentSince / pool) : (free < 0 ? 1 : 0);
    const tone = free < 0 ? 'neg' : moneyRatio > timeRatio + 0.12 ? 'warn' : 'ok';
    const state = free < 0 ? 'negative' : free === 0 ? 'zero' : 'positive';
    return { balance: bal, until, days, next, bills, billsTotal, invoices, invList, commitments, saveLeft, saveTarget, saved: sm.saved, free, perDay, after, state, warnings: doubleInvoiceWarnings(s, invList), start, spentSince, timeRatio, moneyRatio, tone };
  });
}

/* Dupla contagem por lançamento manual: "Fatura Itaú" registrada como gasto pago (Pix/débito/boleto)
   enquanto a mesma fatura continua em aberto no cartão. O dinheiro sairia duas vezes do cálculo.
   Só aponta quando o valor bate (±2%) e as datas são próximas — o app nunca corrige sozinho. */
const normTxt = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function doubleInvoiceWarnings(s, invList) {
  const out = [];
  if (!invList.length) return out;
  const t0 = today();
  const paidInvoiceLike = s.transactions.filter(t => t.type === 'expense' && isPaid(t) && !isCredit(t) && !isCardPayment(t) && !isOpening(t) && /fatura/.test(normTxt(t.desc)) && diffDays(t.date, t0) <= 45 && t.date <= t0);
  for (const t of paidInvoiceLike) {
    const d = normTxt(t.desc);
    const cands = invList.filter(i => s.cards.length === 1 || d.includes(normTxt(i.card)));
    const hit = cands.find(i => Math.abs(i.unpaid - t.value) <= Math.max(1, i.unpaid * 0.02) && Math.abs(diffDays(t.date, i.dueDate)) <= 20);
    if (hit) out.push({ kind: 'invoice_paid_as_expense', txId: t.id, txDesc: t.desc, txDate: t.date, value: round2(t.value), card: hit.card, ym: hit.ym, dueDate: hit.dueDate });
  }
  return out;
}

/* Explicação do "quanto posso gastar" — a mesma usada na Início, no simulador e no Assistente.
   Não recalcula nada: só organiza o resultado de spendable().
   Nível 1 (resumo): 3 linhas + total. Nível 2 (detalhes): cada conta, cada fatura e a meta. */
export function spendableExplanation(sp = spendable()) {
  const summary = [
    { key: 'balance', label: 'Você tem hoje', value: sp.balance, sign: 0 },
    { key: 'commitments', label: 'Compromissos antes de receber', value: sp.commitments, sign: -1 },
    { key: 'save', label: 'Meta que ainda quer guardar', value: sp.saveLeft, sign: -1 }
  ];
  const details = {
    bills: sp.bills.map(t => ({ id: t.id, label: t.desc, date: t.date, value: round2(t.value), overdue: t.date < today() })),
    invoices: sp.invList.map(i => ({ label: i.card, date: i.dueDate, value: round2(i.unpaid), ym: i.ym, overdue: i.dueDate < today() })),
    save: { target: sp.saveTarget, saved: sp.saved, left: sp.saveLeft }
  };
  /* compatibilidade: formato antigo usado por versões anteriores da tela */
  const lines = [
    { key: 'balance', label: 'Saldo hoje', value: sp.balance, sign: 0 },
    { key: 'bills', label: 'Contas antes de receber', value: sp.billsTotal, sign: -1 },
    { key: 'invoices', label: 'Faturas antes de receber', value: sp.invoices, sign: -1 },
    { key: 'save', label: 'Meta que ainda quer guardar', value: sp.saveLeft, sign: -1 }
  ];
  return { summary, total: { label: 'Disponível até receber', value: sp.free }, details, after: sp.after, lines,
    free: sp.free, perDay: sp.perDay, days: sp.days, until: sp.until, state: sp.state, tone: sp.tone, next: sp.next };
}

/* ---------- projeção do mês ("se continuar assim...") ---------- */
export function monthProjection(ym = ymOf(today()), s = getState()) {
  return cached('proj' + ym, () => {
    const t0 = today();
    const [y, m] = ym.split('-').map(Number), dim = daysInMonth(y, m);
    const day = ym === ymOf(t0) ? Number(t0.slice(8)) : dim;
    const rows = monthTx(ym, s);
    const income = sum(rows.filter(isRealIncome),incomeAmount);
    const variable = sum(rows.filter(t => isSpend(t) && !t.fixedId && !t.installmentId && t.date <= t0));
    const planned = sum(rows.filter(t => isSpend(t) && (t.fixedId || t.installmentId)));
    const pace = day > 0 ? variable / day : 0;
    const projectedVariable = pace * dim;
    const projectedSpend = round2(projectedVariable + planned);
    return { income: round2(income), projectedSpend, left: round2(income - projectedSpend), pace: round2(pace), day, dim };
  });
}


/* ---------- Fase 1: previsão diária e limite financeiramente seguro ---------- */
export function dailyForecast(days = 30, s = getState()) {
  const horizon = Math.max(1, Math.min(180, Math.floor(num(days) || 30)));
  const t0 = today();
  let running = balance(s);

  /* Ritmo variável observado nos últimos 60 dias. É sempre estimativa, nunca tratado como conta real. */
  const from = addDays(t0, -60);
  const hist = s.transactions.filter(t => isSpend(t) && !t.fixedId && !t.installmentId && t.date >= from && t.date <= t0);
  const observedDays = Math.max(14, Math.min(60, diffDays(from, t0) + 1));
  const variablePerDay = round2(sum(hist) / observedDays);

  const rows = [];
  for (let i = 1; i <= horizon; i++) {
    const date = addDays(t0, i);
    let income = 0, bills = 0, invoices = 0;
    const events = [];
    for (const t of s.transactions) {
      if (t.date !== date || isPaid(t)) continue;
      if (isRealIncome(t)) { income += incomeAmount(t); events.push({ type: 'income', label: t.desc, value: incomeAmount(t) }); }
      else if (t.type === 'expense' && !isCredit(t)) { bills += t.value; events.push({ type: 'bill', label: t.desc, value: t.value }); }
    }
    for (const c of s.cards) for (const inv of cardStatus(c, s).invoices) {
      if (inv.unpaid > 0 && inv.dueDate === date) { invoices += inv.unpaid; events.push({ type: 'invoice', label: `Fatura ${c.name}`, value: inv.unpaid }); }
    }
    running = round2(running + income - bills - invoices - variablePerDay);
    rows.push({ date, balance: running, income: round2(income), bills: round2(bills), invoices: round2(invoices), estimatedVariable: variablePerDay, events });
  }
  const risk = rows.find(r => r.balance < 0) || null;
  return { days: horizon, startBalance: balance(s), variablePerDay, rows, risk, endBalance: rows.at(-1)?.balance ?? balance(s), estimated: variablePerDay > 0, sampleDays: observedDays };
}

export function safeCardLimit(card, s = getState()) {
  if (!card) return { safe: 0, available: 0, dueDate: null, projectedAtDue: 0, tone: 'neg' };
  const st = cardStatus(card, s);
  const inv = st.due || st.open;
  const days = Math.max(1, diffDays(today(), inv.dueDate));
  const fc = dailyForecast(Math.min(180, days), s);
  const projectedAtDue = fc.rows[Math.min(fc.rows.length, days) - 1]?.balance ?? balance(s);
  const sm = monthSummary(ymOf(today()), s);
  const saveTarget = round2(sm.incomePaid * (s.savingPlan.percent || 0) / 100);
  const saveLeft = round2(Math.max(0, saveTarget - sm.saved));
  const room = round2(Math.max(0, projectedAtDue - saveLeft));
  const safe = round2(Math.min(st.available, room));
  const ratio = st.available > 0 ? safe / st.available : 0;
  return { safe, available: st.available, dueDate: inv.dueDate, projectedAtDue, saveLeft, tone: safe <= 0 ? 'neg' : ratio < .35 ? 'warn' : 'ok', estimated: fc.estimated };
}

export function subscriptionSummary(s = getState()) {
  const fixed = s.fixed.filter(f => f.type !== 'income' && ['Assinaturas', 'Streaming'].includes(f.cat));
  const explicit = (s.subscriptions || []).filter(x => x && x.active !== false).map(x => ({ name: x.name || 'Assinatura', value: num(x.value), rec: x.rec === 'Anual' ? 'Anual' : 'Mensal', source: 'subscription' }));
  const rows = [...fixed.map(f => ({ name: f.name, value: f.value, rec: f.rec, source: 'fixed', id: f.id })), ...explicit];
  const monthly = round2(sum(rows, x => x.rec === 'Anual' ? x.value / 12 : x.value));
  return { rows, monthly, annual: round2(monthly * 12) };
}

/* ---------- orçamento ---------- */
export function plannedMonthlyIncome(ym = ymOf(today()), s = getState()) {
  /* Orçamento é planejamento: prioriza rendas recorrentes cadastradas (salário etc.).
     Sem renda recorrente, usa a renda real do mês; por último, a média dos 3 meses anteriores. */
  const recurring = round2(s.fixed.filter(f => f.type === 'income').reduce((total, f) => {
    const value = num(f.value);
    return total + (f.rec === 'Anual' ? value / 12 : value);
  }, 0));
  if (recurring > 0) return { value: recurring, source: 'recorrente', label: 'renda recorrente cadastrada' };
  const current = round2(monthSummary(ym, s).income);
  if (current > 0) return { value: current, source: 'mes', label: 'renda registrada no mês' };
  const previous = [];
  for (let i = 1; i <= 3; i++) {
    const value = round2(monthSummary(addMonthsYM(ym, -i), s).income);
    if (value > 0) previous.push(value);
  }
  const average = previous.length ? round2(previous.reduce((a, b) => a + b, 0) / previous.length) : 0;
  return { value: average, source: average > 0 ? 'media' : 'sem-renda', label: average > 0 ? 'média de renda dos últimos meses' : 'nenhuma renda cadastrada' };
}

export function budgetPlan(ym = ymOf(today()), s = getState()) {
  const incomeRef = plannedMonthlyIncome(ym, s);
  const income = round2(incomeRef.value);
  const savingPercent = Math.min(100, Math.max(0, num(s.savingPlan?.percent)));
  const savingTarget = round2(income * savingPercent / 100);
  const categoryLimits = round2(Object.entries(s.budget_limits || {}).reduce((total, [cat, value]) => cat === 'Investimentos' ? total : total + Math.max(0, num(value)), 0));
  const committed = round2(savingTarget + categoryLimits);
  const remaining = round2(income - committed);
  return { income, incomeSource: incomeRef.source, incomeLabel: incomeRef.label, savingPercent, savingTarget, categoryLimits, committed, remaining, ratio: income > 0 ? committed / income : 0, over: income > 0 ? Math.max(0, -remaining) : committed };
}

export function budgetConsumption(ym, s = getState()) {
  const all = monthTx(ym, s), t0 = today();
  const isCur = ym === ymOf(t0);
  // Orçamento acompanha o consumo na competência da compra. Uma compra no cartão
  // já realizada consome o orçamento independentemente de a fatura estar aberta,
  // fechada, vencida ou ainda não paga. O status Pago/Pendente da compra não
  // controla o orçamento; ele controla caixa/fatura. O pagamento da fatura é só
  // movimentação de caixa e é excluído por isSpend(), evitando dupla contagem.
  const rows = (isCur ? all.filter(t => t.date <= t0 || isCredit(t)) : all).filter(isSpend);
  const byCat = new Map();
  let card = 0, other = 0;
  for (const t of rows) {
    const value = Math.max(0, num(t.value));
    byCat.set(t.cat, (byCat.get(t.cat) || 0) + value);
    if (isCredit(t)) card += value; else other += value;
  }
  const cats = [...byCat.entries()].map(([cat, value]) => ({ cat, value: round2(value) }));
  return { total: round2(card + other), card: round2(card), other: round2(other), cats, count: rows.length };
}

export function budgetRows(ym, s = getState()) {
  const consumed = budgetConsumption(ym, s);
  const limits = s.budget_limits || {};
  const rows = Object.entries(limits).map(([cat, limit]) => {
    const spent = consumed.cats.find(c => c.cat === cat)?.value || 0;
    return { cat, limit, spent, left: round2(limit - spent), ratio: limit ? spent / limit : 0, unbudgeted: false };
  });
  // Gastos em categorias sem limite definido também precisam aparecer no orçamento.
  // Eles NÃO aumentam o orçamento planejado; apenas deixam visível que houve consumo
  // fora do plano, para o usuário decidir se cria/ajusta um limite.
  for (const item of consumed.cats) {
    if (Object.prototype.hasOwnProperty.call(limits, item.cat)) continue;
    rows.push({ cat: item.cat || 'Outros', limit: 0, spent: item.value, left: round2(-item.value), ratio: item.value > 0 ? Infinity : 0, unbudgeted: true });
  }
  return rows.sort((a, b) => {
    if (!!a.unbudgeted !== !!b.unbudgeted) return a.unbudgeted ? -1 : 1;
    return b.ratio - a.ratio;
  });
}
export function suggestBudgets(s = getState()) {
  const cur = ymOf(today()), totals = new Map();
  for (let i = 1; i <= 3; i++) for (const c of monthSummary(addMonthsYM(cur, -i), s).cats) totals.set(c.cat, (totals.get(c.cat) || 0) + c.value);
  return [...totals.entries()].map(([cat, v]) => ({ cat, value: Math.ceil(v / 3 / 10) * 10 })).filter(x => x.value >= 30).sort((a, b) => b.value - a.value).slice(0, 8);
}

/* ---------- patrimônio ---------- */
export function investmentValue(x, s = getState()) {
  if ((x.type === 'Renda fixa' || x.type === 'CDB') && num(x.value) > 0 && x.yieldRate != null && x.purchaseDate) {
    const days = Math.max(0, diffDays(x.purchaseDate, today()));
    let annual = num(x.yieldRate) / 100;
    if (String(x.yieldType || '') === 'Pós-fixado' && ['CDI', 'SELIC'].includes(String(x.yieldIndex || 'CDI'))) annual = (num(s.cdiReference) * num(x.yieldRate) / 100) / 100;
    return round2(num(x.value) * Math.pow(1 + annual, days / 365));
  }
  if (num(x.quantity) > 0 && num(x.marketPrice) > 0) return round2(num(x.quantity) * num(x.marketPrice));
  return round2(num(x.currentValue ?? x.value ?? x.costBasis));
}
export function wealth(s = getState()) {
  return cached('w', () => {
    const inv = sum(s.investments, x => investmentValue(x, s));
    const cost = sum(s.investments, x => num(x.costBasis ?? x.value));
    const goals = sum(s.goals, g => g.saved);
    const reserve = s.goals.find(g => g.isReserve);
    return { investments: round2(inv), cost: round2(cost), result: round2(inv - cost), goals: round2(goals), reserve: reserve ? reserve.saved : 0, total: round2(inv + goals) };
  });
}
export function avgMonthlySpend(n = 3, s = getState()) {
  const cur = ymOf(today()); let t = 0, c = 0;
  for (let i = 1; i <= n; i++) { const v = monthSummary(addMonthsYM(cur, -i), s).spend; if (v > 0) { t += v; c++; } }
  return c ? round2(t / c) : monthSummary(cur, s).spend;
}
export function hourlyRate(s = getState()) {
  const cur = ymOf(today()); let t = 0, c = 0;
  for (let i = 0; i <= 3; i++) { const v = monthSummary(addMonthsYM(cur, -i), s).income; if (v > 0) { t += v; c++; } }
  if (!c) return 0;
  return (t / c) / (num(s.profile.hoursPerMonth) || 176);
}

/* ---------- sequências ---------- */
/* meses seguidos fechando no positivo (renda > gastos), contando a partir do último mês fechado */
export function positiveStreak(s = getState()) {
  return cached('ps', () => {
    const cur = ymOf(today()); let n = 0;
    const curSum = monthSummary(cur, s);
    for (let i = 1; i < 36; i++) { const m = monthSummary(addMonthsYM(cur, -i), s); if (m.count === 0 || m.income <= 0 || m.result <= 0) break; n++; }
    const live = curSum.income > 0 && curSum.result > 0;
    return { months: n, liveThisMonth: live };
  });
}
export function savingStreak(s = getState()) {
  const cur = ymOf(today()); let n = 0;
  for (let i = 1; i < 36; i++) { if (monthSummary(addMonthsYM(cur, -i), s).saved > 0) n++; else break; }
  return n + (monthSummary(cur, s).saved > 0 ? 1 : 0);
}
/* dias distintos com registro nos últimos 30 dias (createdAt ou data do lançamento) */
export function loggingDays(s = getState(), from = addDays(today(), -29)) {
  const days = new Set();
  for (const t of s.transactions) {
    const d = t.createdAt ? toISO(t.createdAt) : null;
    if (d && d >= from) days.add(d);
  }
  return days;
}
const toISO = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function loggingStreak(s = getState()) {
  const set = loggingDays(s, addDays(today(), -120));
  let d = today(), n = 0;
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
export function checkinStreak(s = getState()) {
  const set = new Set(s.profile.checkins || []);
  let d = today(), n = 0;
  if (!set.has(isoWeek(d))) d = addDays(d, -7);
  while (set.has(isoWeek(d))) { n++; d = addDays(d, -7); }
  return n;
}

/* ---------- semana ---------- */
export function weekSummary(s = getState()) {
  const t0 = today(), d = parseISO(t0), dow = (d.getDay() + 6) % 7;
  const start = addDays(t0, -dow), end = addDays(start, 6), prevStart = addDays(start, -7), prevEnd = addDays(start, -1);
  const inRange = (a, b) => s.transactions.filter(t => isSpend(t) && !t.fixedId && t.date >= a && t.date <= b);
  const cur = inRange(start, end), prev = inRange(prevStart, prevEnd);
  const next7 = s.transactions.filter(t => t.type === 'expense' && !isPaid(t) && !isCredit(t) && t.date > t0 && t.date <= addDays(t0, 7));
  const byCat = new Map(); cur.forEach(t => byCat.set(t.cat, (byCat.get(t.cat) || 0) + t.value));
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  return { start, end, spent: round2(sum(cur)), prevSpent: round2(sum(prev)), top: top ? { cat: top[0], value: round2(top[1]) } : null, next7, week: isoWeek(t0) };
}
