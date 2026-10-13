/* Bivvo — Cartões: fatura por mês, limite comprometido e parcelamentos. */
import { h, money, money0, monthName, monthLabel, shortDate, today, addMonthsYM } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { emptyState, sectionTitle, progress } from '../ui.js';
import { txRow, cardVisual, invoiceBars, stat } from './components.js';
import { openCardForm, openTxForm, payInvoice, deleteInstallmentGroup } from './forms.js';
import { ctx } from '../nav.js';
import { canUseFeature } from '../plans.js';
import {getFreeCardGraceStatus,formatFreeCardGrace,setFreeCardToKeep} from '../card-retention.js';
import { openPaywall } from './pro.js';

let selected = null, selectedYM = null;

export function renderCards(root) {
  const s = store.getState();
  if (!s.cards.length) {
    root.append(emptyState({ icon: '💳', title: 'Nenhum cartão ainda', text: 'Adicione seu cartão para ver a fatura de cada mês, quanto do limite está comprometido e quanto as parcelas já tomam dos próximos meses.', action: { label: 'Adicionar cartão', fn: () => openCardForm() } }));
    return;
  }
  if (ctx.params.c) { selected = ctx.params.c; ctx.params.c = null; selectedYM = null; }
  let card = s.cards.find(c => c.id === selected) || s.cards[0];
  selected = card.id;

  const grace=getFreeCardGraceStatus();
  let graceBanner=null;
  if(grace.active){
    const count=h('span.card-grace-count',formatFreeCardGrace(grace.remainingMs));
    const tick=()=>{
      if(!count.isConnected)return;
      const cur=getFreeCardGraceStatus();
      if(!cur.active){count.textContent='';return;}
      count.textContent=formatFreeCardGrace(cur.remainingMs);
      setTimeout(tick,60000);
    };
    setTimeout(tick,60000);
    const deadline=shortDate(String(grace.expiresAt||'').slice(0,10));
    const qty=grace.excess;
    const keepCurrent=grace.keepCardId===card.id;
    graceBanner=h('section.card-grace-banner',
      h('div.card-grace-copy',
        h('div.card-grace-title',h('span',{'aria-hidden':'true'},'⏳'),h('b',grace.testMode?'Simulação do prazo do Grátis':`${qty} cartão${qty===1?'':'ões'} acima do limite do Grátis`),count),
        h('p',grace.testMode
          ?`Modo de homologação: o contador simula os 15 dias, mas nenhum cartão desta conta de teste será apagado.`
          :`Se você não renovar até ${deadline}, ${qty===1?'o cartão excedente será apagado':'os cartões excedentes serão apagados'} automaticamente. As compras continuam no extrato.`),
        h('small',`Cartão que será mantido: ${grace.keepCardName||'primeiro cartão'}.`)),
      h('div.card-grace-actions',
        !keepCurrent?h('button.btn.ghost.sm',{type:'button',onclick:()=>{setFreeCardToKeep(card.id);}},'Manter este cartão'):h('span.card-grace-kept','✓ Este fica no Grátis'),
        !grace.testMode?h('button.btn.primary.sm',{type:'button',onclick:()=>openPaywall({feature:'cards'})},'Renovar plano'):null));
  }

  /* carrossel de cartões */
  const strip = h('div.card-strip', { role: 'tablist', 'aria-label': 'Seus cartões' },
    s.cards.map(c => { const st = F.cardStatus(c, s); return h('button.ccard-btn' + (c.id === card.id ? '.on' : ''), { type: 'button', role: 'tab', 'aria-selected': c.id === card.id, onclick: () => { selected = c.id; selectedYM = null; ctx.params = {}; root.replaceChildren(); renderCards(root); } }, cardVisual(c, st)); }),
    h('button.ccard-add', { type: 'button', onclick: () => openCardForm() }, h('span', '+'), 'Novo cartão'));

  const st = F.cardStatus(card, s);
  const invoices = st.invoices;
  const ym = selectedYM || st.due?.ym || st.open.ym;
  const inv = invoices.find(i => i.ym === ym) || { ym, total: 0, paid: 0, unpaid: 0, items: [], payments: [], ...F.invoiceDates(card, ym), state: 'aberta' };
  const stateLabel = { aberta: `Aberta · fecha em ${shortDate(inv.closeDate)}`, fechada: `Fechada · vence em ${shortDate(inv.dueDate)}`, vencida: `Vencida em ${shortDate(inv.dueDate)}`, paga: 'Paga' }[inv.state];
  const futureYM = ym > st.open.ym;

  const changeInvoice=n=>{selectedYM=addMonthsYM(ym,n);root.replaceChildren();renderCards(root);};
  const invSection = h('section.card.invoice',
    h('div.month-switch',{'aria-label':'Mês da fatura'},h('button.icon-btn',{type:'button','aria-label':'Fatura anterior',onclick:()=>changeInvoice(-1)},'‹'),h('b.month-label',monthLabel(ym)),h('button.icon-btn',{type:'button','aria-label':'Próxima fatura',onclick:()=>changeInvoice(1)},'›')),
    h('div.card-head', h('div', h('h3', `Fatura de ${monthName(ym)}`), h('p.muted.sm', futureYM ? `Prevista · vence em ${shortDate(inv.dueDate)}` : stateLabel)), h('button.link.sm', { type: 'button', onclick: () => openCardForm(card) }, 'Editar cartão')),
    h('strong.inv-total', money(inv.total)),
    h('div.invoice-balance-summary',
      h('span', h('small','Pago'), h('b', money0(inv.paid || 0))),
      h('span', h('small','Em aberto'), h('b', money0(inv.unpaid || 0)))),
    inv.unpaid > 0 ? h('div.invoice-pay-actions',
      h('button.btn.primary', { type: 'button', onclick: () => payInvoice(card, inv, { early: inv.state === 'aberta' || futureYM }) },
        inv.state === 'aberta' ? `Pagar antecipadamente (${money0(inv.unpaid)})`
          : futureYM ? `Antecipar esta fatura (${money0(inv.unpaid)})`
          : `Pagar fatura (${money0(inv.unpaid)})`),
      (inv.state === 'aberta' || futureYM) ? h('small.muted', futureYM
        ? 'O valor sai do saldo hoje e libera o limite referente a esta fatura futura.'
        : 'Você pode quitar o que já está lançado antes do fechamento. Novas compras podem gerar saldo novamente nesta fatura.') : null) : null,
    (inv.payments || []).length ? h('div.invoice-payment-history',
      h('div.invoice-payment-history-head', h('b','Pagamentos desta fatura'), h('small',`${inv.payments.length} registro${inv.payments.length===1?'':'s'}`)),
      [...inv.payments].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(p => h('div.invoice-payment-row',
        h('span', h('b', p.cardPaymentEarly ? 'Antecipado' : 'Pagamento'), h('small', shortDate(p.date))),
        h('strong', `− ${money0(p.value)}`)))) : null,
    invoiceBars(st.next.map(n => ({ ...n })), n => { selectedYM = n.ym; root.replaceChildren(); renderCards(root); }),
    h('p.hint', 'Cada parcela entra só na fatura do seu mês. Pagamentos reduzem a fatura, liberam limite e saem do saldo na data em que você paga.'));
  /* marca a barra selecionada */
  invSection.querySelectorAll('.ibar').forEach((b, i) => b.classList.toggle('on', st.next[i]?.ym === ym));

  const safe = F.safeCardLimit(card, s);
  const limit = h('section.card',
    sectionTitle('Limite'),
    h('div.stats', stat('Comprometido', money0(st.used)), stat('Disponível', money0(st.available), null, st.usage > 0.85 ? 'neg' : ''), stat('Limite', money0(card.limit))),
    progress(st.used, card.limit, st.usage > 0.85 ? 'bad' : st.usage > 0.6 ? 'warn' : ''),
    h('div.safe-limit.' + safe.tone,
      h('span', 'Bivvo recomenda até'), h('strong', money0(safe.safe)),
      h('small', `Banco disponível: ${money0(safe.available)} · considerando a projeção até ${shortDate(safe.dueDate)}`)),
    h('p.hint', 'O comprometido inclui todas as parcelas futuras ainda não pagas. O limite seguro do Bivvo considera também o que você terá para pagar, e nunca supera o limite disponível do banco.'));

  const items = inv.items.slice().sort((a, b) => b.date.localeCompare(a.date));
  const purchases = h('section.card', sectionTitle(`Compras nesta fatura (${items.length})`, { label: 'Nova compra', fn: () => openTxForm({ mode: 'card', preset: { card: card.name } }) }),
    items.length ? h('div.list', items.map(t => txRow(t, { showDate: true }))) : h('p.muted.sm', 'Nenhuma compra nesta fatura.'));

  const act = F.activeInstallments(s).filter(x => F.cardByName(x.card, s)?.id === card.id);
  const commit3 = st.next.slice(1, 4).reduce((a, n) => a + n.unpaid, 0);
  const remaining12 = act.reduce((a,x)=>a+x.rows.filter(t=>t.status!=='Pago').filter(t=>t.date <= new Date(Date.now()+366*86400000).toISOString().slice(0,10)).reduce((n,t)=>n+t.value,0),0);
  const futurePremium = canUseFeature('futureCards12')
    ? h('div.premium-inline', h('b','Visão de 12 meses'), h('span', `${money0(remaining12)} em parcelas ainda não pagas neste cartão.`))
    : h('button.premium-cta', {type:'button', onclick:()=>openPaywall({feature:'futureCards12'})}, h('b','Ver 12 meses de parcelas'), h('span','Disponível no Bivvo Plus'));
  const inst = h('section.card', sectionTitle('Parcelamentos ativos'),
    act.length ? h('p.muted.sm', `As parcelas deste cartão já comprometem ${money0(commit3)} das próximas 3 faturas.`) : null,
    act.length ? futurePremium : null,
    act.length ? h('div.list', act.map(x => h('div.inst',
      h('div.inst-top', h('b', x.inst.name), h('button.link.sm.danger-text', { type: 'button', onclick: () => deleteInstallmentGroup(x.inst.id) }, 'Excluir')),
      h('small.muted', `${x.paidCount} de ${x.parts} pagas · ${money(x.part)} por mês · faltam ${money(x.remaining)}`),
      progress(x.paidCount, x.parts)))) : h('p.muted.sm', 'Nenhuma compra parcelada em andamento.'));

  root.append(graceBanner, strip, h('div.cards-grid', h('div.col', invSection, purchases), h('div.col', limit, inst)));
}
