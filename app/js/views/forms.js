/* Bivvo — formulários e folhas de detalhe. Toda gravação passa por store.commit. */
import { h, money, money0, parseMoney, round2, today, addDays, ymOf, monthName, monthLabel, uid, num, shortDate, dayLabel, addMonthsYM, haptic, debounce, splitInstallments } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { openSheet, confirmSheet, toast, segmented, field, catIcon } from '../ui.js';
import { ctx, go } from '../nav.js';
import * as cloud from '../cloud.js';
import { openLoanForm, openLoanPaymentEditor, deleteLoanPaymentById } from './loans.js';
import { openSmartCapture } from '../quickcapture.js';
import { openSplitForm } from './split.js';
import { canAddCard } from '../plans.js';
import {canFavorite,isFavorite,toggleFavorite} from '../experience.js';

const S = () => store.getState();

/* ---------- componentes de formulário ---------- */
export function moneyInput(value, opts = {}) {
  const el = h('input.input' + (opts.big ? '.amount-input' : ''), { type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: opts.placeholder || '0,00', 'aria-label': opts.label || 'Valor' });
  if (value) el.value = num(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  el.addEventListener('blur', () => { const v = parseMoney(el.value); el.value = v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; });
  el.getValue = () => round2(parseMoney(el.value));
  return el;
}
function select(options, value, label) {
  const el = h('select.input', { 'aria-label': label });
  for (const o of options) { const v = typeof o === 'object' ? o.value : o; el.append(h('option', { value: v }, typeof o === 'object' ? o.label : o)); }
  if (value != null) el.value = value;
  return el;
}
function toggle(label, checked, hint) {
  const input = h('input', { type: 'checkbox', checked: !!checked, role: 'switch' });
  const el = h('label.toggle', h('span', h('b', label), hint ? h('small', hint) : null), input, h('i', { 'aria-hidden': 'true' }));
  el.input = input;
  return el;
}
function catChips(type, value, onPick) {
  const s = S();
  const usage = new Map();
  for (const t of s.transactions.slice(-400)) if (t.type === type) usage.set(t.cat, (usage.get(t.cat) || 0) + 1);
  const list = store.categories(type).sort((a, b) => (usage.get(b) || 0) - (usage.get(a) || 0) || a.localeCompare(b, 'pt-BR'));
  const el = h('select.input.category-select', { 'aria-label': 'Categoria' });
  el.append(h('option', { value: '' }, 'Selecionar categoria'));
  for (const c of list) el.append(h('option', { value: c }, `${catIcon(c)}  ${c}`));
  el.value = value || '';
  el.addEventListener('change', () => onPick(el.value, true));
  el.set = v => { el.value = v || ''; };
  return el;
}
function dateChips(value, onChange, requireDate = false) {
  const input = h('input.input.date', { type: 'date', value, 'aria-label': 'Data' });
  const t = today(), y = addDays(t, -1);
  const b1 = h('button.chip', { type: 'button', onclick: () => set(t) }, 'Hoje');
  const b2 = h('button.chip', { type: 'button', onclick: () => set(y) }, 'Ontem');
  const set = v => { input.value = v; paint(); onChange?.(v); };
  const paint = () => { b1.classList.toggle('on', input.value === t); b2.classList.toggle('on', input.value === y); };
  input.addEventListener('change', () => { paint(); onChange?.(input.value); });
  paint();
  const el = h('div.chips', b1, b2, input);
  el.get = () => input.value || (requireDate ? '' : t);
  return el;
}

/* ---------------------------------------------------------------- */
/* Adicionar rápido                                                 */
/* ---------------------------------------------------------------- */
export function openQuickAdd() {
  const s = S(), company=store.activeFinanceProfile()==='company';
  const item = (icon, title, sub, fn, cls = '') => h('button.qa' + (cls ? '.' + cls : ''), { type: 'button', onclick: () => { sheet.close(); setTimeout(fn, 120); } }, h('span.qa-ico', { 'aria-hidden': 'true' }, icon), h('b', title), h('small', sub));
  const companyItems = company ? [
    item('⚡', 'Lançar rápido', 'Ex.: fornecedor 850', () => openSmartCapture(), 'main'),
    item('+', 'Nova receita', 'Venda, serviço ou cliente', () => openTxForm({ mode: 'income' }), 'main'),
    item('−', 'Nova despesa', 'Fornecedor, imposto ou custo', () => openTxForm({ mode: 'expense' }), 'main'),
    item('🧾', 'Imposto / tributo', 'DAS, DARF, ISS, ICMS…', () => openTxForm({ mode: 'expense', preset:{cat:'Impostos e tributos'} })),
    item('🤝', 'Fornecedor', 'Conta a pagar ou compra', () => openTxForm({ mode: 'expense', preset:{cat:'Fornecedores'} })),
    item('💰', 'Recebimento de cliente', 'Registre valor recebido ou a receber', () => openTxForm({ mode: 'income', preset:{cat:'Recebimentos de clientes'} })),
    item('🔁', 'Custo / receita recorrente', 'Aluguel, folha, contrato mensal', () => openFixedForm()),
    item('💳', 'Compra no cartão', s.cards.length ? 'À vista ou parcelada' : 'Cadastre um cartão', () => s.cards.length ? openTxForm({ mode: 'card' }) : openCardForm()),
    s.cards.length?item('💳','Pagar cartão','Fatura total ou pagamento parcial',()=>openCardPaymentChooser()):null,
    item('▭', 'Cartão empresarial', 'Limite e vencimento', () => openCardForm())
  ] : null;
  const sheet = openSheet({
    title: company?'Adicionar na empresa':'Adicionar', label: 'Adicionar',
    content: h('div.qa-grid', ...(companyItems||[
      item('⚡', 'Anotar em 2 segundos', 'Ex.: mercado 45', () => openSmartCapture(), 'main'),
      item('−', 'Gasto', 'Pix, débito, dinheiro', () => openTxForm({ mode: 'expense' }), 'main'),
      item('+', 'Entrada', 'Salário, venda, extra', () => openTxForm({ mode: 'income' }), 'main'),
      item('💳', 'Compra no cartão', s.cards.length ? 'À vista ou parcelada' : 'Cadastre um cartão', () => s.cards.length ? openTxForm({ mode: 'card' }) : openCardForm()),
      s.cards.length?item('💳','Pagar cartão','Fatura total ou pagamento parcial',()=>openCardPaymentChooser()):null,
      item('🔁', 'Conta fixa', 'Aluguel, internet, salário', () => openFixedForm()),
      item('🫙', 'Guardar dinheiro', 'Reserva ou meta', () => openGoalMove()),
      item('💎', 'Investimento', 'CDB, ações, fundos', () => openInvestmentForm()),
      item('🛍️', 'Posso comprar?', 'Veja o impacto antes de decidir', () => import('./simulator.js').then(m => m.openSimulator()), 'main'),
      item('➗', 'Dividir conta', 'Manda a parte de cada um por link', () => openSplitForm()),
      store.loansEnabled(s) ? item('↗', 'Empréstimo', 'Principal e juros separados', () => openLoanForm()) : null,
      item('🏁', 'Nova meta', 'Viagem, celular, reserva', () => openGoalForm()),
      item('▭', 'Novo cartão', 'Limite e datas', () => openCardForm())
    ]))
  });
}

/* ---------------------------------------------------------------- */
/* Lançamento                                                       */
/* ---------------------------------------------------------------- */
export function openTxForm({ mode, tx, preset = {} } = {}) {
  const s = S(), company=store.activeFinanceProfile()==='company';
  if(tx&&!store.recordVisible(tx))return;
  if(tx?.loanPaymentId){openLoanPaymentEditor(tx.loanPaymentId);return;}
  if(tx?.locked || tx?.immutable){toast('Este lançamento está protegido e não pode ser editado.');return;}
  const editing = !!tx;
  mode = mode || (tx ? (tx.type === 'income' ? 'income' : tx.method === 'Crédito' ? 'card' : 'expense') : 'expense');
  const st = { mode, cat: tx?.cat || preset.cat || '', catTouched: !!tx };
  const amount = moneyInput(tx?.value ?? preset.value, { big: true, label: 'Valor' });
  amount.autofocus = !editing;
  const desc = h('input.input', { type: 'text', value: tx ? tx.desc.replace(/\s*\(\d+\/\d+\)$/, '') : (preset.desc || ''), maxLength: 80, placeholder: company ? 'Ex.: venda cliente X, fornecedor, DAS' : 'Ex.: mercado, iFood, salário', autocomplete: 'off', list: 'bivvoDescList', 'aria-label': 'Descrição' });
  const dl = h('datalist#bivvoDescList', [...new Set(s.transactions.slice(-300).map(t => t.desc.replace(/\s*\(\d+\/\d+\)$/, '')))].slice(-120).map(d => h('option', { value: d })));
  const date = dateChips(tx?.date || preset.date || (preset.requireDate ? '' : today()), null, !!preset.requireDate);
  const paid = toggle('Já foi pago', tx ? tx.status === 'Pago' : (preset.status ? preset.status === 'Pago' : true));
  const method = select(store.METHODS.filter(m => m !== 'Crédito'), tx && tx.method !== 'Crédito' ? tx.method : (preset.method||'PIX'), 'Forma de pagamento');
  const card = select(s.cards.map(c => c.name), tx?.card || preset.card || s.cards[0]?.name, 'Cartão');
  const parts = select(Array.from({ length: 24 }, (_, i) => ({ value: i + 1, label: i ? `${i + 1}x` : 'À vista' })), Math.min(24, Math.max(1, Number(preset.parts) || 1)), 'Parcelas');
  const repeat = toggle('Repetir todo mês', false, 'Vira uma conta fixa e aparece nos próximos meses');
  const note = h('textarea.input', { rows: 2, maxLength: 300, placeholder: 'Opcional' }); note.value = tx?.note && !/^(Compra parcelada|Conta recorrente automática|Receita recorrente)/.test(tx.note) ? tx.note : '';
  const cardSummary = h('p.calc');
  /* empréstimo (preserva o recurso da v9) */
  const loan = {
    person: h('input.input', { value: tx?.loanPerson || '', placeholder: 'Nome', maxLength: 60 }),
    principal: moneyInput(tx?.loanPrincipal, { label: 'Valor emprestado' }),
    rate: h('input.input', { type: 'text', inputmode: 'decimal', value: tx?.loanInterestInput ?? '', placeholder: 'Ex.: 10' }),
    mode: select([{ value: 'percent', label: 'Percentual (%)' }, { value: 'fixed', label: 'Valor fixo (R$)' }], tx?.loanInterestMode || 'percent', 'Tipo de juros'),
    due: h('input.input', { type: 'date', value: tx?.loanDue || '' }),
    action: select([{ value: 'open', label: 'Em aberto' }, { value: 'settled', label: 'Quitou tudo' }, { value: 'interest_only', label: 'Pagou só os juros' }], tx?.loanAction || 'open', 'Situação')
  };
  const loanCalc = () => { const p = loan.principal.getValue(), r = parseMoney(loan.rate.value); const i = loan.mode.value === 'fixed' ? r : round2(p * r / 100); return { p, i: round2(i), total: round2(p + i) }; };
  const loanOut = h('p.calc');
  const loanBox = h('div.subform', h('p.sub-title', 'Empréstimo'), field('Pessoa', loan.person), h('div.row2', field('Valor emprestado', loan.principal), field('Juros', loan.rate)), h('div.row2', field('Tipo de juros', loan.mode), field('Vencimento', loan.due)), field('Situação', loan.action), loanOut);
  const refreshLoan = () => { const c = loanCalc(); loanOut.textContent = c.p ? `Juros ${money(c.i)} · total a receber ${money(c.total)}` : ''; };
  [loan.principal, loan.rate, loan.mode, loan.action].forEach(e => e.addEventListener('input', refreshLoan));

  let chips;
  const catWrap = h('div');
  const buildChips = () => { chips = catChips(st.mode === 'income' ? 'income' : 'expense', st.cat, (c, manual) => { st.cat = c; if (manual) st.catTouched = true; sync(); }); catWrap.replaceChildren(chips); };
  const installNote = tx?.installmentId ? h('div.notice', `Parcela ${tx.installment} de uma compra de ${money(tx.purchaseTotal || 0)}. A alteração vale só para esta parcela.`) : null;

  const segOpts = company ? [{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }] : [{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Entrada' }];
  if (s.cards.length && (!editing || tx.method === 'Crédito' || tx.type === 'expense')) segOpts.push({ value: 'card', label: 'Cartão' });
  const seg = segmented(segOpts, st.mode, v => { const changedType = (v === 'income') !== (st.mode === 'income'); st.mode = v; if (changedType) { st.cat = ''; st.catTouched = false; buildChips(); autoCat(); } sync(); });
  if (editing && tx.installmentId) seg.hidden = true;

  const rows = {
    method: field('Forma de pagamento', method), paid,
    card: h('div.row2', field('Cartão', card), field('Parcelas', parts)), cardSummary,
    repeat
  };
  const autoCat = () => { if (st.catTouched) return; const c = store.autoCategory(desc.value, st.mode === 'income' ? 'income' : 'expense'); if (c) { st.cat = c; chips.set(c); } };
  desc.addEventListener('input', debounce(autoCat, 200));
  const sync = () => {
    const isCard = st.mode === 'card';
    rows.method.hidden = isCard || st.mode === 'income';
    paid.querySelector('b').textContent = st.mode === 'income' ? (company?'Já foi recebida':'Já recebi') : (company?'Já foi paga':'Já foi pago');
    paid.hidden = isCard;
    rows.card.hidden = !isCard || !!tx?.installmentId;
    parts.disabled = editing;
    cardSummary.hidden = !isCard;
    repeat.hidden = editing || isCard;
    loanBox.hidden = !store.loansEnabled(s) || !(st.mode === 'income' && st.cat === 'Juros / Empréstimo');
    if (isCard) {
      const v = amount.getValue(), n = Number(parts.value) || 1, c = s.cards.find(x => x.name === card.value);
      if (c) {
        const inv = store.invoiceKeyFor(c, date.get());
        cardSummary.textContent = v ? (n > 1 ? `${n}x de ${money(splitInstallments(v, n)[0])} · total ${money(v)} · 1ª parcela na fatura de ${monthName(inv)}` : `Entra na fatura de ${monthName(inv)} do ${c.name}`) : `Entra na fatura de ${monthName(inv)} do ${c.name}`;
      }
    }
    refreshLoan();
  };
  [amount, parts, card].forEach(e => e.addEventListener('input', sync));
  date.addEventListener('change', sync);
  buildChips();
  if (!st.cat) autoCat();

  const msg = h('p.form-msg', { role: 'alert' });
  const form = h('form.form', { onsubmit: e => { e.preventDefault(); save(); } },
    dl, h('div.amount-wrap', h('span.cur', 'R$'), amount), seg, installNote,
    field('Descrição', desc), h('div.field', h('span', 'Categoria'), catWrap), h('div.field', h('span', 'Data'), date),
    h('details.more.tx-options', {open:st.mode==='card'||!!tx}, h('summary', 'Mais opções'), rows.method, rows.card, cardSummary, paid, repeat, loanBox, field('Observação',note)), msg, h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  seg.addEventListener('click',()=>{if(st.mode==='card'||st.cat==='Juros / Empréstimo')form.querySelector('.tx-options').open=true;});
  catWrap.addEventListener('change',()=>{if(st.cat==='Juros / Empréstimo')form.querySelector('.tx-options').open=true;});
  sync();

  const footer = [];
  if (editing) footer.push(h('button.btn.ghost.danger-text', { type: 'button', onclick: () => { sheet.close(); deleteTx(tx); } }, 'Excluir'));
  footer.push(h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, editing ? 'Salvar alterações' : 'Adicionar'));
  const sheet = openSheet({ title: editing ? 'Editar lançamento' : (mode === 'income' ? (company?'Nova receita':'Nova entrada') : mode === 'card' ? 'Compra no cartão' : (company?'Nova despesa':'Novo gasto')), content: form, footer });

  function save() {
    const value = amount.getValue(), d = desc.value.trim(), dt = date.get();
    if (!(value > 0)) { msg.textContent = 'Informe um valor maior que zero.'; amount.focus(); return; }
    if (!d) { msg.textContent = 'Dê um nome ao lançamento.'; desc.focus(); return; }
    if (preset.requireDate && (!dt || dt>today() || !Number.isFinite(Date.parse(dt)))) { msg.textContent='Informe a data da compra.';date.querySelector('input').focus();return; }
    const cat = st.cat || (company?(st.mode==='income'?'Outras receitas':'Outras despesas'):'Outros');
    if (st.mode === 'income' && cat === 'Juros / Empréstimo' && !(loanCalc().p > 0)) { msg.textContent = 'Informe o valor emprestado.'; return; }
    let feedback = '';
    store.commit(s => {
      store.learnCategory(s, d, cat);
      if (st.mode === 'card' && !editing) {
        const n = Number(parts.value) || 1;
        store.addCardPurchase(s, { desc: d, cat, total: value, parts: n, card: card.value, date: dt, note: note.value.trim() });
        feedback = n > 1 ? `${n} parcelas de ${money(splitInstallments(value, n)[0])} criadas` : 'Compra adicionada à fatura';
        return;
      }
      const base = editing ? s.transactions.find(t => t.id === tx.id) : { id: uid(), createdAt: Date.now() };
      if (!base) return;
      const isCard = st.mode === 'card';
      Object.assign(base, {
        type: st.mode === 'income' ? 'income' : 'expense', value, cat, date: dt,
        desc: base.installment ? `${d} (${base.installment})` : d,
        method: isCard ? 'Crédito' : (st.mode === 'income' ? (base.method && base.method !== 'Crédito' ? base.method : 'Transferência') : method.value),
        status: isCard ? (base.status === 'Pago' ? 'Pago' : (base.installmentId ? 'Parcelado' : 'Pendente')) : (paid.input.checked ? 'Pago' : 'Pendente'),
        note: note.value.trim() || base.note || '',
        ...(preset.captureSource ? {captureSource:preset.captureSource} : {})
      });
      if (isCard) { base.card = base.installmentId ? base.card : card.value; if (!base.installmentId) { const c = s.cards.find(x => x.name === base.card); base.invoice = store.invoiceKeyFor(c, dt); } }
      else { delete base.card; delete base.invoice; }
      if (base.status === 'Pago' && !base.paidAt && dt > today()) base.paidAt = today();
      if (base.status !== 'Pago') delete base.paidAt;
      /* empréstimo */
      if (base.type === 'income' && cat === 'Juros / Empréstimo') {
        const c = loanCalc(), action = loan.action.value;
        Object.assign(base, { isLoan: true, loanPerson: loan.person.value.trim(), loanPrincipal: c.p, loanInterestMode: loan.mode.value, loanInterestInput: parseMoney(loan.rate.value), loanInterestValue: c.i, loanTotal: c.total, loanDue: loan.due.value || dt, loanAction: action });
        if (action === 'settled') { base.value = c.total; base.status = 'Pago'; base.loanBalance = 0; }
        else if (action === 'interest_only') {
          base.value = c.i; base.status = 'Pago'; base.loanBalance = c.p;
          if (!s.transactions.some(x => x.renewedFrom === base.id)) {
            const due = addMonthsYM(ymOf(base.loanDue), 1) + base.loanDue.slice(7);
            s.transactions.push({ ...base, id: uid(), date: due, loanDue: due, loanAction: 'open', status: 'Pendente', value: c.total, renewedFrom: base.id, note: `Renovação: ${money(c.p)} + juros ${money(c.i)}`, createdAt: Date.now() });
            feedback = 'Juros recebidos. Empréstimo renovado para o mês seguinte.';
          }
        } else { base.value = c.total; base.status = 'Pendente'; base.loanBalance = c.p; }
      }
      if (!editing) {
        s.transactions.push(base);
        if (repeat.input.checked) {
          const f = { id: uid(), name: d, value, due: Number(dt.slice(8)), cat, rec: 'Mensal', type: base.type, startYM: ymOf(dt), method: base.method };
          s.fixed.push(f);
          const key = `fixed|${f.id}|${ymOf(dt)}`; base.recurringKey = key; base.fixedId = f.id; s.generatedRecurring.push(key);
          feedback = 'Salvo. Vai se repetir todo mês.';
        }
      }
    });
    haptic(12);
    sheet.close();
    toast(feedback || (editing ? 'Alterações salvas' : st.mode === 'income' ? (company?'Receita adicionada':'Entrada adicionada') : (company?'Despesa adicionada':'Gasto adicionado')));
  }
}

/* ---------- detalhe ---------- */
export function openTxDetail(id) {
  const s = S(), tx = s.transactions.find(t => t.id === id);
  if (!tx || !store.recordVisible(tx)) return;
  const rows = [];
  const row = (k, v) => rows.push(h('div.kv', h('span', k), h('b', v)));
  row('Data', dayLabel(tx.date) + ' · ' + shortDate(tx.date));
  row('Categoria', tx.cat);
  const capital=F.capitalReceivedValue(tx);
  if(capital>0){
    row('Destino do principal','Saldo de capital recebido');
    row('Capital neste recebimento',money(capital));
    if(F.incomeAmount(tx)>0)row('Juros no saldo geral',money(F.incomeAmount(tx)));
  }else if(tx.transactionRole==='loan_interest_income'||(tx.isLoan&&tx.loanAction==='interest_only'))row('Destino dos juros','Saldo geral');
  if (tx.method === 'Crédito') {
    row('Cartão', tx.card || '—');
    row('Fatura', monthLabel(F.txInvoice(tx)));
    const c=F.cardByName(tx.card,s),inv=c&&F.cardStatus(c,s).invoices.find(i=>i.ym===F.txInvoice(tx,s));
    if(inv){row('Total da fatura',money(inv.total));row('Fatura em aberto',money(inv.unpaid));}
    if (tx.installment) row('Parcela', `${tx.installment} de uma compra de ${money(tx.purchaseTotal || 0)}`);
  } else row(tx.type === 'income' ? 'Recebido via' : 'Forma de pagamento', tx.method);
  row('Situação', tx.method === 'Crédito' ? (tx.status === 'Pago' ? 'Fatura paga' : 'Na fatura') : tx.status === 'Pago' ? (tx.type === 'income' ? 'Recebido' : 'Pago') : (tx.type === 'income' ? 'A receber' : 'A pagar'));
  if (tx.fixedId) row('Recorrência', 'Todo mês');
  if (tx.isLoan) row('Empréstimo', `${tx.loanPerson || '—'} · total ${money(tx.loanTotal)}`);
  if (tx.note) row('Observação', tx.note);
  const hr = F.hourlyRate(s);
  const work = tx.type === 'expense' && hr > 0 && !F.isSave(tx) ? h('div.work', h('span', { 'aria-hidden': 'true' }, '⏱'), h('p', `Isso equivale a cerca de `, h('b', fmtHours(tx.value / hr)), ' do que você recebe por hora trabalhada.')) : null;
  const actions = [];
  if(canFavorite(tx)&&!F.isSave(tx)){
    const favorite=h('button.btn.ghost',{type:'button',onclick:()=>{const active=toggleFavorite(tx);favorite.textContent=active?'★ Remover dos favoritos':'☆ Favoritar gasto';toast(active?'Gasto favoritado. Você pode repetir no início.':'Gasto removido dos favoritos.');}},isFavorite(tx.id)?'★ Remover dos favoritos':'☆ Favoritar gasto');actions.push(favorite);
    actions.push(h('button.btn',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>openTxForm({mode:'expense',preset:{desc:tx.desc,value:tx.value,cat:tx.cat,method:tx.method}}),120);}},'Repetir gasto'));
  }
  const loanPaymentTx=!!tx.loanPaymentId;
  const cardPaymentTx=F.isCardPayment(tx);
  if(cardPaymentTx){
    rows.push(h('div.kv',h('span','Origem'),h('b','Pagamento de cartão')));
    if(tx.card) rows.push(h('div.kv',h('span','Cartão'),h('b',tx.card)));
    if(tx.invoice) rows.push(h('div.kv',h('span','Fatura'),h('b',monthLabel(tx.invoice))));
    rows.push(h('p.notice','Este lançamento é a saída de caixa do pagamento da fatura. As compras continuam no histórico para não perder o detalhamento do consumo.'));
    actions.push(h('button.btn.ghost.danger-text',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>deleteCardPayment(tx),120);}},'Estornar pagamento'));
  }else if(loanPaymentTx){
    rows.push(h('div.kv',h('span','Origem'),h('b','Pagamento de empréstimo')));
    rows.push(h('p.notice','Para manter principal e juros sincronizados, este lançamento é editado pelo histórico do empréstimo.'));
    actions.push(h('button.btn.primary',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>openLoanPaymentEditor(tx.loanPaymentId),120);}},'Editar pagamento'));
    actions.push(h('button.btn.ghost.danger-text',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>deleteLoanPaymentById(tx.loanPaymentId),120);}},'Excluir pagamento'));
  }else{
    if(tx.method==='Crédito'){const c=F.cardByName(tx.card,s),inv=c&&F.cardStatus(c,s).invoices.find(i=>i.ym===F.txInvoice(tx,s));if(inv?.unpaid>0.004)actions.push(h('button.btn.primary',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>payInvoice(c,inv,{early:inv.state==='aberta'}),250);}},'Pagar fatura'));}
    if (tx.method !== 'Crédito') actions.push(h('button.btn', { type: 'button', onclick: () => { sheet.close(); store.commit(st => { const t = st.transactions.find(x => x.id === id); if (!t) return; t.status = t.status === 'Pago' ? 'Pendente' : 'Pago'; if (t.status === 'Pago' && t.date > today()) t.paidAt = today(); if (t.status !== 'Pago') delete t.paidAt; }); toast(tx.status === 'Pago' ? 'Marcado como pendente' : (tx.type === 'income' ? 'Marcado como recebido' : 'Marcado como pago')); } }, tx.status === 'Pago' ? 'Marcar como pendente' : (tx.type === 'income' ? 'Marcar como recebido' : 'Marcar como pago')));
    actions.push(h('button.btn', { type: 'button', onclick: () => { sheet.close(); setTimeout(() => openTxForm({ tx }), 120); } }, 'Editar'));
    if (tx.installmentId) actions.push(h('button.btn.ghost.danger-text', { type: 'button', onclick: () => { sheet.close(); deleteInstallmentGroup(tx.installmentId); } }, 'Excluir compra inteira'));
    actions.push(h('button.btn.ghost.danger-text', { type: 'button', onclick: () => { sheet.close(); deleteTx(tx); } }, tx.installmentId ? 'Excluir só esta parcela' : 'Excluir'));
  }
  const sheet = openSheet({
    label: tx.desc,
    content: [h('div.detail-head', h('span.tx-ico.lg', { 'aria-hidden': 'true' }, catIcon(tx.cat)), h('h2', tx.desc), h('p.detail-amount' + (tx.type === 'income' ? '.in' : ''), (tx.type === 'income' ? '+ ' : '') + money(tx.value))), work, h('div.kvs', rows), h('div.stack-actions', actions)]
  });
}
export const fmtHours = hrs => hrs < 1 ? `${Math.max(1, Math.round(hrs * 60))} min` : hrs < 10 ? `${hrs.toFixed(1).replace('.', ',')} h` : `${Math.round(hrs)} h`;

export function deleteTx(tx) {
  if(tx?.loanPaymentId){deleteLoanPaymentById(tx.loanPaymentId);return;}
  if(tx?.locked || tx?.immutable){toast('Este lançamento está protegido e não pode ser excluído.');return;}
  let removed = null;
  store.commit(s => {
    const i = s.transactions.findIndex(t => t.id === tx.id); if (i < 0) return;
    removed = s.transactions.splice(i, 1)[0];
  });
  store.markDeleted(tx.id);
  if (removed) toast('Lançamento excluído', { action: { label: 'Desfazer', fn: () => { store.restoreRecords({transactions:[removed]}); } } });
}
export async function deleteCardPayment(payment) {
  if(!payment || !F.isCardPayment(payment)) return;
  const ok = await confirmSheet({ title:'Estornar pagamento da fatura?', message:`${money(payment.value)} voltarão ao saldo e a fatura/limite voltarão ao estado anterior a este pagamento.`, confirmLabel:'Estornar pagamento', danger:true });
  if(!ok) return;
  store.commit(s => {
    const p = s.transactions.find(x => x.id === payment.id);
    if(!p) return;
    for(const a of Array.isArray(p.allocations)?p.allocations:[]){
      const t=s.transactions.find(x=>x.id===a.txId); if(!t) continue;
      t.cardPaidAmount=round2(Math.max(0,num(t.cardPaidAmount)-num(a.value)));
      t.cardPaymentIds=(Array.isArray(t.cardPaymentIds)?t.cardPaymentIds:[]).filter(id=>id!==p.id);
      if(t.cardPaidAmount >= num(t.value)-0.004){
        t.status='Pago';
      }else{
        t.status=t.installmentId?'Parcelado':(t.cardOriginalStatus&&t.cardOriginalStatus!=='Pago'?t.cardOriginalStatus:'Pendente');
        delete t.paidAt; delete t.settledByCardPaymentId;
      }
      if(t.cardPaidAmount<=0.004 && !t.cardPaymentIds.length){
        delete t.cardPaidAmount; delete t.cardPaymentIds; delete t.cardPaymentManaged; delete t.invoicePaidEarly; delete t.cardOriginalStatus; delete t.settledByCardPaymentId;
      }
    }
    s.transactions=s.transactions.filter(x=>x.id!==p.id);
    store.markDeleted(p.id);
  });
  toast('Pagamento estornado. Saldo, fatura e limite foram recalculados.');
}

export async function deleteInstallmentGroup(instId) {
  const s = S(), inst = s.installments.find(i => i.id === instId);
  const rows = s.transactions.filter(t => t.installmentId === instId);
  const ok = await confirmSheet({ title: 'Excluir compra parcelada?', message: `${inst?.name || 'Compra'}: ${rows.length} parcela(s) serão removidas, inclusive das faturas futuras.`, confirmLabel: 'Excluir compra', danger: true });
  if (!ok) return;
  let snapshot = null;
  store.commit(st => { snapshot = { inst: st.installments.find(i => i.id === instId), rows: st.transactions.filter(t => t.installmentId === instId) }; store.markDeleted(store.removeInstallmentGroup(st, instId), instId); });
  toast('Compra parcelada excluída', { action: { label: 'Desfazer', fn: () => store.restoreRecords({installments:snapshot.inst ? [snapshot.inst] : [],transactions:snapshot.rows}) } });
}

/* ---------------------------------------------------------------- */
/* Cartão                                                           */
/* ---------------------------------------------------------------- */
export function openCardForm(card) {
  if (!card && !canAddCard(S().cards.length)) { import('./pro.js').then(m => m.openPaywall({ feature: 'cards' })); return; }
  const name = h('input.input', { value: card?.name || '', maxLength: 30, placeholder: 'Ex.: Nubank, Inter', autofocus: !card });
  const limit = moneyInput(card?.limit, { label: 'Limite' });
  const close = h('input.input', { type: 'number', inputmode: 'numeric', min: 1, max: 31, value: card?.close || '', placeholder: 'Ex.: 3' });
  const due = h('input.input', { type: 'number', inputmode: 'numeric', min: 1, max: 31, value: card?.due || '', placeholder: 'Ex.: 10' });
  let tint = card?.tint || 'plum';
  const tints = h('div.tints', { role: 'radiogroup', 'aria-label': 'Cor do cartão' }, store.CARD_TINTS.map(t => h('button.tint.' + t, { type: 'button', role: 'radio', 'aria-label': t, 'aria-checked': t === tint, onclick: e => { tint = t; [...tints.children].forEach(b => b.setAttribute('aria-checked', b === e.currentTarget)); } })));
  const msg = h('p.form-msg', { role: 'alert' });
  const form = h('form.form', { onsubmit: e => { e.preventDefault(); save(); } }, field('Nome do cartão', name), field('Limite total', limit),
    h('div.row2', field('Dia do fechamento', close, 'Compras depois desse dia vão para a fatura seguinte'), field('Dia do vencimento', due)), h('div.field', h('span', 'Cor'), tints),
    h('p.hint', 'O Bivvo nunca pede número do cartão.'), msg, h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  const footer = [];
  if (card) footer.push(h('button.btn.ghost.danger-text', { type: 'button', onclick: () => removeCard(card) }, 'Excluir cartão'));
  footer.push(h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, card ? 'Salvar' : 'Adicionar cartão'));
  const sheet = openSheet({ title: card ? 'Editar cartão' : 'Novo cartão', content: form, footer });
  function save() {
    const n = name.value.trim(), c = Math.floor(num(close.value)), d = Math.floor(num(due.value));
    if (!n) { msg.textContent = 'Dê um nome ao cartão.'; return; }
    if (!(c >= 1 && c <= 31) || !(d >= 1 && d <= 31)) { msg.textContent = 'Fechamento e vencimento devem ser dias entre 1 e 31.'; return; }
    if (S().cards.some(x => x.name.toLowerCase() === n.toLowerCase() && x.id !== card?.id)) { msg.textContent = 'Já existe um cartão com esse nome.'; return; }
    store.commit(s => {
      if (card) {
        const x = s.cards.find(k => k.id === card.id); if (!x) return;
        if (x.name !== n) s.transactions.forEach(t => { if (t.card === x.name) t.card = n; }), s.installments.forEach(i => { if (i.card === x.name) i.card = n; });
        Object.assign(x, { name: n, limit: limit.getValue(), close: c, due: d, tint });
      } else s.cards.push({ id: uid(), name: n, limit: limit.getValue(), close: c, due: d, tint });
    });
    sheet.close(); toast(card ? 'Cartão atualizado' : 'Cartão adicionado');
  }
  async function removeCard(c) {
    const n = S().transactions.filter(t => t.card === c.name).length;
    const ok = await confirmSheet({ title: `Excluir ${c.name}?`, message: n ? `As ${n} compras deste cartão continuam no extrato, mas deixam de ter um cartão vinculado.` : 'O cartão será removido.', confirmLabel: 'Excluir', danger: true });
    if (!ok) return;
    sheet.close(); store.markDeleted(c.id);
    store.commit(s => { s.cards = s.cards.filter(x => x.id !== c.id); });
    toast('Cartão excluído');
  }
}
export function openCardPaymentChooser(){
  const invoices=F.pendingCardInvoices(S()).sort((a,b)=>a.date.localeCompare(b.date));
  let sheet;
  sheet=openSheet({title:'Pagar cartão',subtitle:'Escolha a fatura. Você pode pagar tudo ou só uma parte.',content:invoices.length
    ?h('div.list',invoices.map(entry=>h('button.tx',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>payInvoice(entry.card,entry.invoice,{early:entry.invoice.state==='aberta'}),250);}},h('span.tx-ico','💳'),h('span.tx-main',h('b',entry.desc),h('small',`${monthLabel(entry.invoice.ym)} · vence ${shortDate(entry.date)}`)),h('span.tx-side',h('b.tx-val',money(entry.value))))))
    :h('p.notice','Nenhuma fatura em aberto. As compras no cartão geram os valores das faturas automaticamente.')});
}
export function payInvoice(card, inv, opts = {}) {
  const early = !!opts.early;
  const liveInv = () => F.cardStatus(card, S()).invoices.find(i => i.ym === inv.ym) || inv;
  const initial = liveInv();
  if (!(initial.unpaid > 0.004)) { toast('Esta fatura já está quitada.'); return; }

  const value = moneyInput(initial.unpaid, { big: true, label: 'Valor do pagamento' });
  const msg = h('p.form-msg', { role: 'alert' });
  const info = h('div.notice',
    h('b', early ? 'Pagamento antecipado' : 'Pagamento da fatura'),
    h('p', `Fatura de ${monthName(inv.ym)} · ${card.name}`),
    h('small', early
      ? 'O valor sai do saldo hoje, reduz a fatura e libera o mesmo valor do limite. Novas compras podem voltar a aumentar uma fatura ainda aberta.'
      : 'O valor sai do saldo hoje, reduz a fatura e libera o mesmo valor do limite.'));
  const form = h('form.form', { onsubmit: e => { e.preventDefault(); save(); } },
    info,
    h('div.amount-wrap', h('span.cur', 'R$'), value),
    h('p.calc', `Em aberto agora: ${money(initial.unpaid)}`),
    msg,
    h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  const sheet = openSheet({
    title: early ? `Antecipar fatura de ${monthName(inv.ym)}` : `Pagar fatura de ${monthName(inv.ym)}`,
    subtitle: 'Você pode pagar o valor total ou apenas uma parte.',
    content: form,
    footer: [h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, early ? 'Registrar pagamento antecipado' : 'Registrar pagamento')]
  });

  function save() {
    const amount = value.getValue();
    const current = liveInv();
    if (!(amount > 0)) { msg.textContent = 'Informe um valor maior que zero.'; value.focus(); return; }
    if (amount > current.unpaid + 0.004) { msg.textContent = `O valor em aberto é ${money(current.unpaid)}.`; value.focus(); return; }

    const paidAt = today();
    const paymentId = uid();
    let paid = 0;
    store.commit(s => {
      const rows = s.transactions
        .filter(t => t.method === 'Crédito' && F.cardByName(t.card, s)?.id === card.id && F.txInvoice(t, s) === inv.ym)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
      let left = amount;
      const allocations = [];
      for (const t of rows) {
        if (left <= 0.004) break;
        const before = F.cardPurchasePaidAmount(t);
        const open = Math.max(0, round2(num(t.value) - before));
        if (open <= 0.004) continue;
        const part = round2(Math.min(open, left));
        if (!(part > 0)) continue;
        if (!t.cardPaymentManaged) t.cardOriginalStatus = t.status;
        t.cardPaymentManaged = true;
        t.cardPaidAmount = round2(before + part);
        t.cardPaymentIds = [...new Set([...(Array.isArray(t.cardPaymentIds) ? t.cardPaymentIds : []), paymentId])];
        t.invoicePaidEarly = early || t.invoicePaidEarly || undefined;
        if (t.cardPaidAmount >= num(t.value) - 0.004) {
          t.cardPaidAmount = round2(num(t.value));
          t.status = 'Pago';
          t.paidAt = paidAt;
          t.settledByCardPaymentId = paymentId;
        } else {
          t.status = t.installmentId ? 'Parcelado' : 'Pendente';
          delete t.paidAt;
          delete t.settledByCardPaymentId;
        }
        allocations.push({ txId: t.id, value: part });
        left = round2(left - part);
        paid = round2(paid + part);
      }
      if (paid <= 0.004) return;
      s.transactions.push({
        id: paymentId,
        date: paidAt,
        paidAt,
        desc: `${early ? 'Pagamento antecipado' : 'Pagamento'} · Fatura ${card.name} ${monthName(inv.ym)}`,
        cat: 'Cartão de crédito',
        type: 'expense',
        value: paid,
        status: 'Pago',
        method: 'Pagamento de cartão',
        transactionRole: 'card_payment',
        cardId: card.id,
        card: card.name,
        invoice: inv.ym,
        cardPaymentEarly: early,
        allocations,
        locked: true,
        immutable: true,
        createdAt: Date.now(),
        note: early ? 'Pagamento antecipado de fatura. Reduz saldo e libera limite sem duplicar o gasto das compras.' : 'Pagamento de fatura. Reduz saldo e libera limite sem duplicar o gasto das compras.'
      });
    });
    if (!(paid > 0.004)) { msg.textContent = 'Não foi possível registrar o pagamento. Atualize a tela e tente novamente.'; return; }
    haptic(15); sheet.close();
    const after = liveInv();
    toast(after.unpaid > 0.004
      ? `${money(paid)} pagos. Restam ${money(after.unpaid)} na fatura.`
      : `${early ? 'Pagamento antecipado' : 'Fatura'} quitado. Saldo atualizado e limite liberado.`);
  }
}

/* ---------------------------------------------------------------- */
/* Contas fixas                                                     */
/* ---------------------------------------------------------------- */
export function openFixedForm(f) {
  const company=store.activeFinanceProfile()==='company';
  const st = { type: f?.type || 'expense', cat: f?.cat || '' };
  const name = h('input.input', { value: f?.name || '', maxLength: 60, placeholder: company?'Ex.: aluguel, folha, contrato mensal':'Ex.: aluguel, internet, salário', autofocus: !f });
  const value = moneyInput(f?.value);
  const due = h('input.input', { type: 'number', inputmode: 'numeric', min: 1, max: 31, value: f?.due || '', placeholder: 'Dia' });
  const rec = select(['Mensal', 'Anual'], f?.rec || 'Mensal', 'Recorrência');
  const paidNow = toggle('Este mês já está pago', false);
  let chips; const catWrap = h('div');
  const build = () => { chips = catChips(st.type, st.cat, c => { st.cat = c; }); catWrap.replaceChildren(chips); };
  name.addEventListener('input', debounce(() => { if (!st.cat) { const c = store.autoCategory(name.value, st.type); if (c) { st.cat = c; chips.set(c); } } }, 200));
  const seg = segmented([{ value: 'expense', label: 'Conta a pagar' }, { value: 'income', label: 'Receita fixa' }], st.type, v => { st.type = v; st.cat = ''; build(); paidNow.querySelector('b').textContent = v === 'income' ? 'Este mês já recebi' : 'Este mês já está pago'; });
  build();
  const msg = h('p.form-msg', { role: 'alert' });
  const form = h('form.form', { onsubmit: e => { e.preventDefault(); save(); } }, seg, field('Nome', name), h('div.row2', field('Valor', value), field('Dia do mês', due)), h('div.field', h('span', 'Categoria'), catWrap), field('Repete', rec), f ? null : paidNow, msg, h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  const footer = [];
  if (f) footer.push(h('button.btn.ghost.danger-text', { type: 'button', onclick: () => remove() }, 'Excluir'));
  footer.push(h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, f ? 'Salvar' : 'Adicionar'));
  const sheet = openSheet({ title: f ? (company?'Editar recorrência':'Editar conta fixa') : (company?'Nova recorrência empresarial':'Nova conta fixa'), subtitle: company?'Cadastre custos fixos e receitas recorrentes do negócio. O Bivvo cria cada ocorrência automaticamente.':'O Bivvo cria a ocorrência de cada mês automaticamente.', content: form, footer });
  function save() {
    const n = name.value.trim(), v = value.getValue(), d = Math.floor(num(due.value));
    if (!n || !(v > 0)) { msg.textContent = 'Informe nome e valor.'; return; }
    if (!(d >= 1 && d <= 31)) { msg.textContent = 'Informe um dia entre 1 e 31.'; return; }
    store.commit(s => {
      const cur = ymOf(today());
      if (f) {
        const x = s.fixed.find(k => k.id === f.id); if (!x) return;
        Object.assign(x, { name: n, value: v, due: d, rec: rec.value, type: st.type, cat: st.cat || (company?(st.type==='income'?'Outras receitas':'Outras despesas'):'Outros') });
        /* atualiza ocorrências futuras ainda pendentes */
        for (const t of s.transactions) if (t.fixedId === x.id && t.status !== 'Pago' && t.date >= today()) { Object.assign(t, { desc: n, value: v, cat: x.cat, type: x.type }); t.date = fixDay(t.date, d); }
      } else s.fixed.push({ id: uid(), name: n, value: v, due: d, rec: rec.value, type: st.type, cat: st.cat || (company?(st.type==='income'?'Outras receitas':'Outras despesas'):'Outros'), startYM: cur, month: Number(cur.slice(5)), paidThroughYM: paidNow.input.checked ? cur : undefined });
    });
    sheet.close(); toast(f ? 'Conta fixa atualizada' : 'Conta fixa criada');
  }
  async function remove() {
    const ok = await confirmSheet({ title: `Excluir ${f.name}?`, message: 'Ocorrências futuras ainda não pagas também serão removidas. O histórico fica no extrato.', confirmLabel: 'Excluir', danger: true });
    if (!ok) return;
    sheet.close();
    store.commit(s => { const gone = s.transactions.filter(t => t.fixedId === f.id && t.status !== 'Pago' && t.date >= today()).map(t => t.id); store.markDeleted(gone, f.id); s.transactions = s.transactions.filter(t => !gone.includes(t.id)); s.fixed = s.fixed.filter(x => x.id !== f.id); });
    toast('Conta fixa excluída');
  }
}
function fixDay(date, d) { const [y, m] = date.split('-').map(Number); const last = new Date(y, m, 0).getDate(); return `${date.slice(0, 8)}${String(Math.min(d, last)).padStart(2, '0')}`; }

/* ---------------------------------------------------------------- */
/* Metas e dinheiro guardado                                        */
/* ---------------------------------------------------------------- */
const GOAL_EMOJIS = ['🛡️', '🏝️', '🏠', '🚗', '📱', '🎓', '💍', '🎁', '🐶', '🫙'];
export function openGoalForm(g, preset = {}) {
  const name = h('input.input', { value: g?.name || preset.name || '', maxLength: 50, placeholder: 'Ex.: viagem, reserva de emergência', autofocus: !g });
  const target = moneyInput(g?.target || preset.target, { label: 'Objetivo' });
  const saved = moneyInput(g ? null : 0, { label: 'Já tenho guardado' });
  const date = h('input.input', { type: 'date', value: g?.date || '' });
  let emoji = g?.emoji || preset.emoji || '🫙';
  const em = h('div.chips.scroll', GOAL_EMOJIS.map(e => h('button.chip.emoji', { type: 'button', 'aria-label': e, onclick: ev => { emoji = e; [...em.children].forEach(b => b.classList.toggle('on', b === ev.currentTarget)); } }, e)));
  [...em.children].forEach(b => b.classList.toggle('on', b.textContent === emoji));
  const reserve = toggle('É minha reserva de emergência', g ? g.isReserve : !!preset.isReserve, 'Usada para calcular quantos meses de fôlego você tem');
  const msg = h('p.form-msg', { role: 'alert' });
  const form = h('form.form', { onsubmit: e => { e.preventDefault(); save(); } }, h('div.field', h('span', 'Ícone'), em), field('Nome da meta', name), h('div.row2', field('Quanto quer juntar', target), g ? null : field('Já tem guardado', saved)), field('Prazo (opcional)', date), reserve, msg, h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  const footer = [];
  if (g) footer.push(h('button.btn.ghost.danger-text', { type: 'button', onclick: async () => { const ok = await confirmSheet({ title: `Excluir ${g.name}?`, message: 'A meta será removida. Os lançamentos de guardar continuam no extrato.', confirmLabel: 'Excluir', danger: true }); if (!ok) return; sheet.close(); store.markDeleted(g.id); store.commit(s => { s.goals = s.goals.filter(x => x.id !== g.id); }); toast('Meta excluída'); } }, 'Excluir'));
  footer.push(h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, g ? 'Salvar' : 'Criar meta'));
  const sheet = openSheet({ title: g ? 'Editar meta' : 'Nova meta', content: form, footer });
  function save() {
    const n = name.value.trim(), t = target.getValue();
    if (!n || !(t > 0)) { msg.textContent = 'Informe o nome e quanto quer juntar.'; return; }
    store.commit(s => {
      if (reserve.input.checked) s.goals.forEach(x => { if (x.id !== g?.id) x.isReserve = false; });
      if (g) Object.assign(s.goals.find(x => x.id === g.id) || {}, { name: n, target: t, date: date.value, emoji, isReserve: reserve.input.checked });
      else s.goals.push({ id: uid(), name: n, target: t, saved: saved.getValue(), date: date.value, emoji, isReserve: reserve.input.checked });
      if (reserve.input.checked) s.emergencyPlan.target = t;
    });
    sheet.close(); toast(g ? 'Meta atualizada' : 'Meta criada');
  }
}
export function openGoalMove(goalId, dir = 'in') {
  const s = S();
  if (!s.goals.length) { openGoalForm(null, { name: 'Reserva de emergência', emoji: '🛡️', isReserve: true }); return; }
  const goal = select(s.goals.map(g => ({ value: g.id, label: `${g.emoji || '🫙'} ${g.name}` })), goalId || (s.goals.find(g => g.isReserve) || s.goals[0]).id, 'Meta');
  const value = moneyInput(null, { big: true }); value.autofocus = true;
  let mode = dir;
  const fromBalance = toggle(dir === 'in' ? 'Tirar do meu saldo' : 'Devolver para o meu saldo', true, 'Desative se o dinheiro já estava guardado em outro lugar');
  const info = h('p.calc');
  const paint = () => { const g = S().goals.find(x => x.id === goal.value); info.textContent = g ? `Guardado: ${money(g.saved)} de ${money(g.target)}` : ''; };
  goal.addEventListener('change', paint); paint();
  const seg = segmented([{ value: 'in', label: 'Guardar' }, { value: 'out', label: 'Retirar' }], mode, v => { mode = v; fromBalance.querySelector('b').textContent = v === 'in' ? 'Tirar do meu saldo' : 'Devolver para o meu saldo'; });
  const msg = h('p.form-msg', { role: 'alert' });
  const form = h('form.form', { onsubmit: e => { e.preventDefault(); save(); } }, h('div.amount-wrap', h('span.cur', 'R$'), value), seg, field('Meta', goal), info, fromBalance, msg, h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  const sheet = openSheet({ title: 'Movimentar dinheiro guardado', content: form, footer: [h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, 'Confirmar')] });
  function save() {
    const v = value.getValue(), g = S().goals.find(x => x.id === goal.value);
    if (!(v > 0) || !g) { msg.textContent = 'Informe um valor.'; return; }
    if (mode === 'out' && v > g.saved + 0.004) { msg.textContent = `Essa meta tem ${money(g.saved)} guardados.`; return; }
    let reached = false;
    store.commit(st => {
      const x = st.goals.find(k => k.id === g.id);
      x.saved = round2(x.saved + (mode === 'in' ? v : -v));
      reached = mode === 'in' && x.target > 0 && x.saved >= x.target && g.saved < g.target;
      if (fromBalance.input.checked) st.transactions.push({ id: uid(), date: today(), desc: mode === 'in' ? `Guardar em ${x.name}` : `Retirada de ${x.name}`, cat: x.isReserve ? 'Reserva de Emergência' : 'Guardado', type: mode === 'in' ? 'expense' : 'income', kind: mode === 'in' ? 'save' : 'withdraw', value: v, status: 'Pago', method: 'Transferência', goalId: x.id, createdAt: Date.now() });
    });
    haptic(15); sheet.close();
    toast(reached ? `Meta ${g.name} concluída! 🎉` : mode === 'in' ? `${money(v)} guardados` : `${money(v)} retirados`);
  }
}

/* ---------------------------------------------------------------- */
/* Investimentos                                                    */
/* ---------------------------------------------------------------- */
const INV_TYPES = ['Ações', 'Fundos', 'CDB', 'Renda fixa', 'Poupança', 'Cripto', 'Outros'];
const B3_FALLBACK = [['PETR4', 'Petrobras PN'], ['VALE3', 'Vale ON'], ['ITUB4', 'Itaú Unibanco PN'], ['BBAS3', 'Banco do Brasil ON'], ['WEGE3', 'WEG ON'], ['BBDC4', 'Bradesco PN'], ['ABEV3', 'Ambev ON'], ['B3SA3', 'B3 ON'], ['MXRF11', 'Maxi Renda FII'], ['HGLG11', 'CSHG Logística'], ['KNRI11', 'Kinea Renda Imobiliária'], ['XPML11', 'XP Malls'], ['BTLG11', 'BTG Logística'], ['IVVB11', 'iShares S&P 500']];
async function searchB3(term) {
  try {
    const r = await fetch('/api/b3-assets?search=' + encodeURIComponent(term), { cache: 'no-store' });
    if (!r.ok) throw new Error();
    const j = await r.json();
    return (j.stocks || []).slice(0, 12).map(x => [String(x), '']);
  } catch { const t = term.toUpperCase(); return B3_FALLBACK.filter(([k, n]) => k.includes(t) || n.toUpperCase().includes(t)); }
}
export async function fetchQuote(ticker) {
  if (ctx.demo) throw new Error('Cotações em tempo real ficam disponíveis com conta criada.');
  const token = await cloud.accessToken();
  const r = await fetch('/api/quote?ticker=' + encodeURIComponent(ticker), { cache: 'no-store', headers: token ? { Authorization: 'Bearer ' + token } : {} });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Cotação indisponível agora.');
  return num(j.price);
}
export function openInvestmentForm(inv) {
  const st = { type: inv?.type || 'CDB' };
  const name = h('input.input', { value: inv?.name || '', maxLength: 40, placeholder: 'Ex.: PETR4, CDB Inter, Tesouro Selic', autocomplete: 'off' });
  const sugg = h('div.chips.scroll.sugg');
  const qty = h('input.input', { type: 'text', inputmode: 'decimal', value: inv?.quantity || '', placeholder: 'Ex.: 10' });
  const price = moneyInput(inv?.purchasePrice, { label: 'Preço pago por cota' });
  const quoteMsg = h('p.calc');
  const value = moneyInput(inv?.costBasis ?? inv?.value, { label: 'Valor aplicado' });
  const yieldType = select(['Pós-fixado', 'Prefixado'], inv?.yieldType || 'Pós-fixado', 'Tipo de rendimento');
  const rate = h('input.input', { type: 'text', inputmode: 'decimal', value: inv?.yieldRate ?? '', placeholder: 'Ex.: 110' });
  const index = select(['CDI', 'SELIC', 'IPCA', 'Outro'], inv?.yieldIndex || 'CDI', 'Indexador');
  const date = h('input.input', { type: 'date', value: inv?.purchaseDate || today() });
  const goal=h('select.input',{'aria-label':'Meta deste investimento'},h('option',{value:''},'Sem meta definida'),store.getState().goals.map(g=>h('option',{value:g.id},g.name)));goal.value=inv?.goalId||'';
  const fromBalance = toggle('Tirar do meu saldo', !inv, 'Registra a aplicação como dinheiro guardado no mês');
  const market = h('div.subform', field('Ativo (ticker)', name), sugg, h('div.row2', field('Quantidade', qty), field('Preço pago por cota', price)), quoteMsg);
  const fixedInc = h('div.subform', field('Nome', name.cloneNode()), h('div.row2', field('Rendimento', yieldType), field('Taxa (%)', rate)), field('Indexador', index), h('p.hint', 'Pós-fixado: % do indexador (ex.: 110% do CDI). Prefixado: taxa ao ano.'));
  const nameFixed = fixedInc.querySelector('input'); nameFixed.value = inv?.name || '';
  const plain = h('div.subform', field('Nome', h('input.input', { value: inv?.name || '', maxLength: 40, placeholder: 'Ex.: Poupança Caixa' })));
  const namePlain = plain.querySelector('input');
  const valueField = field('Valor aplicado', value);
  const seg = h('div.chips.scroll', INV_TYPES.map(t => h('button.chip', { type: 'button', dataset: { v: t }, onclick: () => { st.type = t; paint(); } }, t)));
  const paint = () => {
    [...seg.children].forEach(b => b.classList.toggle('on', b.dataset.v === st.type));
    const isMarket = st.type === 'Ações' || st.type === 'Fundos', isFixed = st.type === 'CDB' || st.type === 'Renda fixa';
    market.hidden = !isMarket; fixedInc.hidden = !isFixed; plain.hidden = isMarket || isFixed; valueField.hidden = isMarket;
  };
  paint();
  const runSearch = debounce(async () => {
    const t = name.value.trim(); if (t.length < 2) { sugg.replaceChildren(); return; }
    const list = await searchB3(t);
    sugg.replaceChildren(...list.map(([k, n]) => h('button.chip', { type: 'button', onclick: () => { name.value = k; sugg.replaceChildren(); getQuote(); } }, k, n ? h('small', n) : null)));
  }, 300);
  name.addEventListener('input', runSearch);
  async function getQuote() {
    const t = name.value.trim().toUpperCase(); if (!t) return;
    quoteMsg.textContent = 'Buscando cotação…';
    try { const p = await fetchQuote(t); quoteMsg.textContent = `Cotação atual: ${money(p)}`; quoteMsg.dataset.price = p; if (!price.value) price.value = p.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
    catch (e) { quoteMsg.textContent = e.message; delete quoteMsg.dataset.price; }
  }
  const msg = h('p.form-msg', { role: 'alert' });
  const form = h('form.form', { onsubmit: e => { e.preventDefault(); save(); } }, h('div.field', h('span', 'Tipo'), seg), market, fixedInc, plain, valueField, field('Data da aplicação', date),field('Vincular a uma meta',goal,'A aplicação conta no progresso da meta. Vincular não transfere dinheiro.'), inv ? null : fromBalance, msg, h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  const footer = [];
  if (inv) footer.push(h('button.btn.ghost.danger-text', { type: 'button', onclick: () => removeInv() }, 'Resgatar / excluir'));
  footer.push(h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, inv ? 'Salvar' : 'Registrar aplicação'));
  const sheet = openSheet({ title: inv ? 'Editar investimento' : 'Novo investimento', content: form, footer });
  function save() {
    const t = st.type, isMarket = t === 'Ações' || t === 'Fundos', isFixed = t === 'CDB' || t === 'Renda fixa';
    const nm = (isMarket ? name.value.trim().toUpperCase() : isFixed ? nameFixed.value.trim() : namePlain.value.trim());
    const q = parseMoney(qty.value), p = price.getValue();
    const cost = isMarket ? round2(q * p) : value.getValue();
    if (!nm) { msg.textContent = 'Informe o nome do investimento.'; return; }
    if (!(cost > 0)) { msg.textContent = isMarket ? 'Informe quantidade e preço pago.' : 'Informe o valor aplicado.'; return; }
    store.commit(s => {
      const base = inv ? s.investments.find(x => x.id === inv.id) : { id: uid() };
      Object.assign(base, { type: t, name: nm, value: cost, costBasis: cost, purchaseDate: date.value || today(), goalId:goal.value||null });
      if (isMarket) Object.assign(base, { quantity: q, purchasePrice: p, marketPrice: num(quoteMsg.dataset.price) || base.marketPrice || p });
      else { delete base.quantity; delete base.purchasePrice; delete base.marketPrice; }
      if (isFixed) Object.assign(base, { yieldType: yieldType.value, yieldRate: parseMoney(rate.value), yieldIndex: index.value }); else { delete base.yieldRate; }
      if (!inv) {
        s.investments.push(base);
        if (fromBalance.input.checked) { const tx = { id: uid(), date: base.purchaseDate, desc: `Aplicação em ${nm}`, cat: 'Investimentos', type: 'expense', kind: 'save', value: cost, status: 'Pago', method: 'Transferência', investmentId: base.id, createdAt: Date.now() }; s.transactions.push(tx); base.txId = tx.id; }
      }
    });
    sheet.close(); toast(inv ? 'Investimento atualizado' : 'Aplicação registrada');
  }
  async function removeInv() {
    const current = F.investmentValue(inv);
    const credit = toggle('Devolver o valor ao meu saldo', true);
    const ok = await confirmSheet({ title: `Resgatar ${inv.name}?`, message: `Valor estimado hoje: ${money(current)}. O investimento sai da sua carteira.`, confirmLabel: 'Resgatar', danger: true, extra: credit });
    if (!ok) return;
    sheet.close(); store.markDeleted(inv.id);
    store.commit(s => { s.investments = s.investments.filter(x => x.id !== inv.id); if (credit.input.checked && current > 0) s.transactions.push({ id: uid(), date: today(), desc: `Resgate de ${inv.name}`, cat: 'Rendimentos', type: 'income', kind: 'withdraw', value: current, status: 'Pago', method: 'Transferência', createdAt: Date.now() }); });
    toast('Investimento resgatado');
  }
}
export async function refreshQuotes() {
  const list = S().investments.filter(x => (x.type === 'Ações' || x.type === 'Fundos') && num(x.quantity) > 0);
  if (!list.length) return toast('Nenhum ativo de bolsa na carteira.');
  let ok = 0, last = '';
  for (const x of list) { try { const p = await fetchQuote(x.name); store.commit(s => { const y = s.investments.find(k => k.id === x.id); if (y) { y.marketPrice = p; y.quoteAt = today(); } }, { reason: 'quotes' }); ok++; } catch (e) { last = e.message; } }
  toast(ok ? `${ok} cotação(ões) atualizada(s)` : last);
}

/* ---------------------------------------------------------------- */
/* Orçamento                                                        */
/* ---------------------------------------------------------------- */
export function openBudgetForm() {
  const s = S(), ym=ctx.month || ymOf(today()), plan=F.budgetPlan(ym,s);
  const cats = store.categories('expense').filter(c => c !== 'Investimentos');
  const inputs = new Map();
  const list = h('div.budget-edit');
  const summary=h('div.budget-form-summary');
  const essential=new Set(['Moradia','Mercado','Alimentação','Transporte','Combustível','Energia','Água','Gás','Internet','Telefone','Saúde','Educação','Seguros','Filhos']);
  const flexible=new Set(['Delivery','Restaurantes','Lazer','Assinaturas','Streaming','Compras','Roupas','Beleza','Eletrônicos','Viagens','Presentes e doações']);
  const suggestions=new Map(F.suggestBudgets(s).map(x=>[x.cat,x.value]));
  const advice=cat=>{
    if(cat==='Mercado')return 'Use a média dos últimos meses e divida por 4,3 para enxergar um limite semanal.';
    if(cat==='Moradia')return 'Use o valor contratual de aluguel/financiamento e despesas obrigatórias. Não reduza no papel.';
    if(cat==='Lazer')return 'Defina depois dos essenciais e da meta de guardar. Deve caber sem depender do cartão.';
    if(cat==='Dívidas e empréstimos')return 'Use as parcelas e acordos que realmente vencem no mês antes de planejar extras.';
    if(essential.has(cat))return 'Use o valor real ou a média recente, com uma pequena margem para variações.';
    if(flexible.has(cat))return 'Parta da sua média e reduza gradualmente se precisar liberar renda para prioridades.';
    return 'Comece por um valor realista e revise depois de 2 ou 3 meses de histórico.';
  };
  const updateSummary=()=>{
    const total=round2([...inputs.values()].reduce((a,i)=>a+i.getValue(),0)), committed=round2(total+plan.savingTarget), left=round2(plan.income-committed), tone=left<0?'bad':left<plan.income*.05?'warn':'good';
    summary.replaceChildren(
      h('div',h('span','Receita'),h('b',money0(plan.income))),
      h('div',h('span','Meta de guardar'),h('b',`− ${money0(plan.savingTarget)}`)),
      h('div',h('span','Categorias'),h('b',`− ${money0(total)}`)),
      h('div.budget-form-left.'+tone,h('span',left>=0?'Ainda disponível':'Acima da renda'),h('strong',money0(Math.abs(left))))
    );
    summary.dataset.over=left<-.004?'1':'0'; summary.dataset.overValue=String(Math.max(0,-left));
  };
  const openHelp=cat=>openSheet({title:`Como definir ${cat}`,content:[
    h('p.sheet-text',advice(cat)),
    suggestions.has(cat)?h('div.important',h('b','Referência pelos seus dados'),h('p',`Sua média recente sugere cerca de ${money0(suggestions.get(cat))}. Use como ponto de partida, não como regra.`)):h('p.hint','Ainda não há histórico suficiente dessa categoria. Comece com o valor que você conhece hoje e revise depois.'),
    h('p.hint',`A sua meta de guardar (${money0(plan.savingTarget)}) já está reservada dentro da renda de ${money0(plan.income)}.`)
  ]});
  const paint = values => {
    inputs.clear();
    list.replaceChildren(...cats.map(c => {
      const i = moneyInput(values[c] || null, { label: c, placeholder: 'Sem limite' }); inputs.set(c, i);
      i.addEventListener('input',updateSummary); i.addEventListener('blur',updateSummary);
      const ref=suggestions.get(c);
      return h('label.budget-row.educational',
        h('span.budget-row-name',h('i', { 'aria-hidden': 'true' }, catIcon(c)),h('span',h('b',c),ref?h('small',`Sua média ≈ ${money0(ref)}`):h('small',essential.has(c)?'Essencial':flexible.has(c)?'Flexível':'Planejada')),h('button.budget-help',{type:'button','aria-label':`Ajuda sobre ${c}`,onclick:e=>{e.preventDefault();e.stopPropagation();openHelp(c);}},'?')),
        i);
    }));
    queueMicrotask(updateSummary);
  };
  paint(s.budget_limits);
  const sug = F.suggestBudgets(s);
  const suggestBtn = sug.length ? h('button.btn.sm', { type: 'button', onclick: () => { const v = { ...Object.fromEntries([...inputs].map(([c, i]) => [c, i.getValue()])) }; sug.forEach(x => { v[x.cat] = x.value; }); paint(v); toast('Sugestão baseada na sua média dos últimos 3 meses'); } }, 'Usar minha média como ponto de partida') : null;
  const sheet = openSheet({
    title: 'Monte seus limites', subtitle: 'Meta de guardar + categorias nunca podem ultrapassar sua receita.',
    content: [h('div.budget-form-intro',h('b','Como fazer'),h('p','1. Proteja os essenciais. 2. Reserve sua meta de guardar. 3. Distribua o restante entre categorias flexíveis. 4. Deixe uma margem para imprevistos.')),summary,suggestBtn, list],
    footer: [h('button.btn.primary', { type: 'button', onclick: () => {
      updateSummary();
      if(plan.income<=0)return toast('Cadastre uma renda ou salário recorrente antes de montar o orçamento.');
      if(summary.dataset.over==='1')return toast(`Seu orçamento passa da renda em ${money0(Number(summary.dataset.overValue)||0)}. Reduza algum limite antes de salvar.`);
      store.commit(st => { st.budget_limits = {}; for (const [c, i] of inputs) { const v = i.getValue(); if (v > 0) st.budget_limits[c] = v; } },{reason:'budget-limits'}); sheet.close(); toast('Orçamento salvo dentro da sua renda');
    } }, 'Salvar orçamento')]
  });
}
export { money0 };
