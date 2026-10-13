/* Bivvo 11.16 — regressão determinística do motor "quanto posso gastar".
   Rodar:  node tests/finance-regression.mjs
   Não usa dados reais nem valores fixos de resposta: o esperado é calculado a partir das entradas de cada caso. */
const RealDate = Date;
let FIX = new RealDate(2026, 9, 5, 12).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [FIX])); } static now() { return FIX; } };
const setToday = iso => { const [y, m, d] = iso.split('-').map(Number); FIX = new RealDate(y, m - 1, d, 12).getTime(); };
globalThis.window = globalThis.window || { addEventListener() {} };
globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.localStorage = globalThis.sessionStorage;

const store = await import('../js/store.js');
const F = await import('../js/finance.js');
const { round2 } = await import('../js/util.js');

let pass = 0, fail = 0;
const ok = (cond, name, extra = '') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra); } };
const near = (a, b) => Math.abs(a - b) < 0.005;
let n = 0; const id = () => 't' + (++n);

/* monta um estado: hoje, próximo dinheiro agendado, saldo âncora, cartões com compras, contas */
function build({ todayISO, nextIncome, balance = 1000, cards = [], bills = [], savePct = 0, paidIncomeThisMonth = 0 }) {
  setToday(todayISO);
  const s = store.emptyState({ onboarded: true, checkins: [], seenAchievements: [], invitesSent: 0 });
  s.savingPlan = { ...(s.savingPlan || {}), percent: savePct };
  const cur = todayISO.slice(0, 7);
  if (paidIncomeThisMonth) s.transactions.push({ id: id(), date: `${cur}-01`, desc: 'Entrada do mês', cat: 'Freelance', type: 'income', value: paidIncomeThisMonth, status: 'Pago', method: 'PIX' });
  if (nextIncome) s.transactions.push({ id: id(), date: nextIncome, desc: 'Próximo dinheiro', cat: 'Freelance', type: 'income', value: 2000, status: 'Pendente', method: 'PIX' });
  for (const c of cards) {
    s.cards.push({ id: id(), name: c.name, limit: c.limit || 5000, close: c.close, due: c.due, tint: 'plum' });
    for (const p of c.purchases || []) s.transactions.push({ id: id(), date: p.date, desc: p.desc || 'Compra', cat: 'Compras', type: 'expense', value: p.value, status: 'Pendente', method: 'Crédito', card: c.name });
  }
  for (const b of bills) s.transactions.push({ id: id(), date: b.date, desc: b.desc || 'Conta', cat: 'Moradia', type: 'expense', value: b.value, status: b.paid ? 'Pago' : 'Pendente', method: 'Boleto' });
  store.load(s, { demo: true });
  /* saldo de hoje informado pelo usuário = âncora (mesma função usada pela tela) */
  store.commit(st => { const tx = F.adjustmentTx(F.balanceAdjustment(balance, st), { first: true, id: id(), date: todayISO }); if (tx) st.transactions.push(tx); });
  return store.getState();
}
const invoiceIn = (sp, card) => sp.invList.some(i => i.card === card);

console.log('Caso 1–3: data limite 10/10, faturas vencendo 09, 10 e 11/10');
for (const [due, expected] of [[9, true], [10, true], [11, false]]) {
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: 800, cards: [{ name: 'C' + due, close: 1, due, purchases: [{ date: '2026-09-15', value: 100 }] }] });
  const sp = F.spendable();
  ok(sp.until === '2026-10-10', `limite = 10/10 (vencimento ${due}/10)`);
  ok(invoiceIn(sp, 'C' + due) === expected, `fatura vencendo ${due}/10 ${expected ? 'INCLUÍDA' : 'NÃO incluída'}`, JSON.stringify(sp.invList.map(i => i.dueDate)));
  ok(near(sp.free, round2(800 - (expected ? 100 : 0))), `disponível = ${round2(800 - (expected ? 100 : 0))}`, sp.free);
}

console.log('Contas: mesma regra (09, 10, 11/10)');
{
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: 800, bills: [{ date: '2026-10-09', value: 10, desc: 'B9' }, { date: '2026-10-10', value: 20, desc: 'B10' }, { date: '2026-10-11', value: 40, desc: 'B11' }, { date: '2026-10-02', value: 5, desc: 'Atrasada' }] });
  const sp = F.spendable(); const names = sp.bills.map(b => b.desc);
  ok(names.includes('B9') && names.includes('B10') && names.includes('Atrasada') && !names.includes('B11'), 'contas até 10/10 (inclusive) e atrasadas entram; 11/10 não', names.join(','));
  ok(near(sp.billsTotal, 35), 'total de contas = 9 + 10 + atrasada', sp.billsTotal);
  ok(sp.after.some(a => a.label === 'B11'), 'conta de 11/10 aparece em "depois do próximo recebimento"');
}

console.log('Caso 4: virada do mês (hoje 28/10, recebe 05/11)');
{
  build({ todayISO: '2026-10-28', nextIncome: '2026-11-05', balance: 900, cards: [{ name: 'Dentro', close: 25, due: 3, purchases: [{ date: '2026-10-10', value: 50 }] }, { name: 'Fora', close: 28, due: 6, purchases: [{ date: '2026-10-10', value: 70 }] }], bills: [{ date: '2026-10-31', value: 30, desc: 'Fim do mês' }, { date: '2026-11-05', value: 15, desc: 'Dia 5' }] });
  const sp = F.spendable();
  ok(invoiceIn(sp, 'Dentro') && !invoiceIn(sp, 'Fora'), 'fatura 03/11 entra; 06/11 não', JSON.stringify(sp.invList.map(i => [i.card, i.dueDate])));
  ok(sp.bills.length === 2, 'contas de 31/10 e 05/11 entram');
  ok(sp.days === 8, 'dias até receber = 8', sp.days);
}

console.log('Caso 5: virada do ano (hoje 28/12, recebe 05/01)');
{
  build({ todayISO: '2026-12-28', nextIncome: '2027-01-05', balance: 1000, cards: [{ name: 'Jan5', close: 26, due: 5, purchases: [{ date: '2026-12-10', value: 200 }] }, { name: 'Jan7', close: 29, due: 7, purchases: [{ date: '2026-12-10', value: 300 }] }], bills: [{ date: '2026-12-31', value: 40 }] });
  const sp = F.spendable();
  ok(sp.until === '2027-01-05', 'limite em 05/01/2027');
  ok(invoiceIn(sp, 'Jan5') && !invoiceIn(sp, 'Jan7'), 'fatura 05/01 entra; 07/01 não', JSON.stringify(sp.invList.map(i => [i.card, i.dueDate])));
  ok(near(sp.free, 1000 - 200 - 40), 'disponível = 1000 − 200 − 40', sp.free);
}

console.log('Caso 6: sem contas e sem faturas');
{
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: 500 });
  const sp = F.spendable();
  ok(sp.commitments === 0 && near(sp.free, 500) && near(sp.perDay, 100), 'disponível = saldo; 100/dia em 5 dias', JSON.stringify([sp.free, sp.perDay, sp.days]));
}

console.log('Casos 7–9: positivo, zero e negativo');
for (const [bal, state] of [[600, 'positive'], [300, 'zero'], [250, 'negative']]) {
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: bal, bills: [{ date: '2026-10-08', value: 300 }] });
  const sp = F.spendable();
  ok(sp.state === state && near(sp.free, bal - 300) && (state === 'positive' ? sp.perDay > 0 : sp.perDay === 0), `saldo ${bal} − conta 300 → ${state} (${round2(bal - 300)})`, JSON.stringify([sp.state, sp.free, sp.perDay]));
}

console.log('Caso 10: compra no cartão não sai do saldo e da fatura ao mesmo tempo');
{
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: 1000, cards: [{ name: 'Visa', close: 1, due: 8 }] });
  const bal0 = F.balance(), free0 = F.spendable().free;
  store.commit(st => store.addCardPurchase(st, { desc: 'TV', cat: 'Eletrônicos', total: 1200, parts: 12, card: 'Visa', date: '2026-10-05' }));
  const after = F.spendable();
  ok(near(F.balance(), bal0), 'saldo não muda na compra', F.balance());
  const parcelas = store.getState().transactions.filter(t => t.installmentId);
  ok(parcelas.length === 12 && parcelas.every(t => near(t.value, 100)), '12 parcelas de 100 (não 1.200 por mês)');
  /* a 1ª parcela cai na fatura de novembro (compra depois do fechamento do dia 1) → vence 08/11, depois do limite */
  ok(near(after.free, free0), 'disponível até 10/10 não muda (1ª parcela vence em 08/11)', [free0, after.free]);
  ok(near(store.getState().transactions.filter(t => t.type === 'expense' && t.status === 'Pago' && !F.isOpening(t)).reduce((a, t) => a + t.value, 0), 0), 'nenhuma despesa paga criada pela compra');
  /* pagar a fatura: o dinheiro sai uma única vez */
  const c = store.getState().cards[0]; const inv = F.cardStatus(c).invoices[0];
  store.commit(st => { for (const t of st.transactions) if (t.method === 'Crédito' && t.status !== 'Pago' && F.txInvoice(t, st) === inv.ym) { t.status = 'Pago'; t.paidAt = '2026-10-05'; } });
  ok(near(F.balance(), bal0 - inv.total), 'ao pagar a fatura, saldo cai só o valor da fatura', [F.balance(), bal0 - inv.total]);
  ok(!F.cardStatus(c).invoices.find(i => i.ym === inv.ym).unpaid, 'fatura paga não volta a ser contada');
}

console.log('Caso real: 05/10/2026 · recebe 10/10 (Rafael Bike) · Itaú Pai vence 10/10 · Nubank vence 13/10');
{
  const itau = 316.34, nubank = 40.63, informado = 400, meta = 100;
  /* histórico que, sem âncora, deixava o saldo calculado negativo */
  setToday('2026-10-05');
  const s = store.emptyState({ onboarded: true, checkins: [], seenAchievements: [], invitesSent: 0 });
  s.savingPlan = { ...(s.savingPlan || {}), percent: 10 };
  s.transactions.push({ id: id(), date: '2026-10-01', desc: 'Entrada', cat: 'Freelance', type: 'income', value: meta * 10, status: 'Pago', method: 'PIX' });
  s.transactions.push({ id: id(), date: '2026-10-02', desc: 'Gastos sem saldo inicial', cat: 'Moradia', type: 'expense', value: 1600.71, status: 'Pago', method: 'PIX' });
  s.transactions.push({ id: id(), date: '2026-10-10', desc: 'Rafael Bike', cat: 'Freelance', type: 'income', value: 500, status: 'Pendente', method: 'PIX' });
  s.cards.push({ id: 'itau', name: 'Itaú Pai', limit: 3000, close: 3, due: 10, tint: 'plum' }, { id: 'nu', name: 'Nubank', limit: 3000, close: 6, due: 13, tint: 'plum' });
  s.transactions.push({ id: id(), date: '2026-09-20', desc: 'Compras', cat: 'Compras', type: 'expense', value: itau, status: 'Pendente', method: 'Crédito', card: 'Itaú Pai' });
  s.transactions.push({ id: id(), date: '2026-09-25', desc: 'Compras', cat: 'Compras', type: 'expense', value: nubank, status: 'Pendente', method: 'Crédito', card: 'Nubank' });
  store.load(s, { demo: true });
  ok(near(F.balance(), -600.71), 'reproduz o saldo calculado de −R$ 600,71 sem âncora', F.balance());
  const spBefore = F.spendable();
  ok(spBefore.next.label === 'Rafael Bike' && spBefore.until === '2026-10-10', 'próximo dinheiro = Rafael Bike em 10/10');
  ok(invoiceIn(spBefore, 'Itaú Pai'), 'Itaú Pai (vence 10/10): INCLUÍDA');
  ok(!invoiceIn(spBefore, 'Nubank'), 'Nubank (vence 13/10): NÃO INCLUÍDA');
  ok(spBefore.after.some(a => a.label === 'Nubank' && a.date === '2026-10-13'), 'Nubank aparece em "depois do próximo recebimento"');
  /* o usuário informa quanto tem hoje → ajuste (não soma) */
  store.commit(st => { const tx = F.adjustmentTx(F.balanceAdjustment(informado, st), { id: id(), date: '2026-10-05' }); if (tx) st.transactions.push(tx); });
  const sp = F.spendable();
  ok(near(sp.balance, informado), 'saldo de hoje = valor informado', sp.balance);
  ok(near(sp.saveLeft, meta), 'meta que falta = 10% de 1.000 já recebidos', sp.saveLeft);
  ok(near(sp.free, round2(informado - itau - meta)), `disponível = ${informado} − ${itau} − ${meta} = ${round2(informado - itau - meta)}`, sp.free);
  ok(sp.state === 'negative' && sp.perDay === 0, 'estado negativo, sem valor por dia');
  const sum = F.monthSummary('2026-10');
  ok(near(sum.spend, 1600.71) && near(sum.income, meta * 10 + 500), 'ajuste de saldo não vira gasto nem renda no mês', JSON.stringify([sum.spend, sum.income]));
  const ex = F.spendableExplanation(sp);
  ok(ex.summary.length === 3 && ex.details.invoices.length === 1 && ex.details.invoices[0].label === 'Itaú Pai', 'explicação: 3 linhas no resumo e só a Itaú Pai nas faturas');
}

console.log('Zero nunca vira "-0"');
{
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: 416.34, cards: [{ name: 'Itaú Pai', close: 3, due: 10, purchases: [{ date: '2026-09-20', value: 316.34 }] }], bills: [{ date: '2026-10-07', value: 100 }] });
  const sp = F.spendable();
  ok(sp.state === 'zero' && Object.is(sp.free, 0), 'disponível exatamente zero é +0', String(Object.is(sp.free, -0)));
}

console.log('Dupla contagem: fatura paga lançada como gasto enquanto a fatura segue em aberto');
{
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: 600, cards: [{ name: 'Itaú Pai', close: 3, due: 10, purchases: [{ date: '2026-09-20', value: 316.34 }] }, { name: 'Nubank', close: 6, due: 13, purchases: [{ date: '2026-09-25', value: 40.63 }] }],
    bills: [{ date: '2026-10-04', value: 316.34, desc: 'Pagamento fatura Itaú Pai', paid: true }] });
  const sp = F.spendable();
  ok(sp.warnings.length === 1 && sp.warnings[0].card === 'Itaú Pai', 'aponta a possível dupla contagem da Itaú Pai', JSON.stringify(sp.warnings));
  build({ todayISO: '2026-10-05', nextIncome: '2026-10-10', balance: 600, cards: [{ name: 'Itaú Pai', close: 3, due: 10, purchases: [{ date: '2026-09-20', value: 316.34 }] }], bills: [{ date: '2026-10-04', value: 89.9, desc: 'Fatura da academia', paid: true }] });
  ok(F.spendable().warnings.length === 0, 'não acusa quando o valor não bate');
}

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
