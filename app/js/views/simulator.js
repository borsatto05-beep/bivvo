/* Bivvo 10.5 — tela "Posso comprar?". Simular nunca grava; registrar exige toque explícito. */
import { h, money, money0, round2, today, uid, monthName, debounce } from '../util.js';
import * as store from '../store.js';
import { openSheet, toast, segmented, field } from '../ui.js';
import { moneyInput } from './forms.js';
import { simulatePurchase, suggestAlternative, purchaseVerdict, futurePurchaseImpact, bestPurchaseWindow, shouldImpulseBrake } from '../simulate.js';
import { track } from '../analytics.js';
import { canUseFeature } from '../plans.js';
import { openPaywall } from './pro.js';

const TONE = { tranquilo: { label: 'Tranquilo', icon: '●' }, atencao: { label: 'Atenção', icon: '▲' }, apertado: { label: 'Apertado', icon: '■' } };
const considerationList = s => Array.isArray(s.profile?.purchaseConsiderations) ? s.profile.purchaseConsiderations : [];

export function openSimulator(preset = {}) {
  const s = store.getState();
  const hasCards = s.cards.length > 0;
  const st = { method: hasCards && preset.method !== 'cash' ? 'card' : 'cash', cardName: preset.cardName || s.cards[0]?.name, parts: preset.parts || 1, down: 0 };
  const value = moneyInput(preset.value, { big: true, label: 'Valor da compra' }); value.autofocus = true;
  const desc = h('input.input', { type: 'text', maxLength: 60, placeholder: 'O que é? (opcional)', autocomplete: 'off', value: preset.desc || '' });
  const method = segmented([{ value: 'card', label: 'Cartão' }, { value: 'cash', label: 'Pix ou débito' }], st.method, v => { st.method = v; paintFields(); run(); });
  if (!hasCards) method.hidden = true;
  const card = h('select.input', { 'aria-label': 'Cartão' }, s.cards.map(c => h('option', { value: c.name }, c.name)));
  if (st.cardName) card.value = st.cardName;
  card.addEventListener('change', () => { st.cardName = card.value; run(); });
  const parts = h('select.input', { 'aria-label': 'Parcelas' }, Array.from({ length: 24 }, (_, i) => h('option', { value: i + 1 }, i ? `${i + 1}x` : 'À vista')));
  parts.value = String(st.parts);
  parts.addEventListener('change', () => { st.parts = Number(parts.value); run(); });
  const down = moneyInput(null, { label: 'Entrada', placeholder: 'Opcional' });
  const cardFields = h('div.row2', field('Cartão', card), field('Parcelas', parts));
  const downField = field('Entrada à vista', down, 'Opcional. Sai do saldo hoje.');
  const paintFields = () => { cardFields.hidden = st.method !== 'card'; downField.hidden = st.method !== 'card'; };
  paintFields();
  const result = h('div.sim-result', { 'aria-live': 'polite' });
  const confirmBtn = h('button.btn.primary', { type: 'button', disabled: true, onclick: () => register() }, 'Registrar esta compra');
  let last = null, tracked = false;
  const thinking = h('div.purchase-thinking');
  const paintThinking = () => {
    const items = considerationList(store.getState())
      .filter(x => x.status === 'waiting')
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
    thinking.replaceChildren(items.length ? h('div.thinking-box',
      h('b', 'Estou pensando em comprar'),
      h('small', `${items.length} item(ns) em reflexão`),
      ...items.map(x => h('div.thinking-item',
        h('span',
          h('strong', x.desc || 'Compra'),
          h('small', `${money(x.value)} · ${Date.now() < x.waitUntil ? 'aguarde 24h' : 'período concluído'}`)
        ),
        h('div',
          h('button.link.sm', { type: 'button', onclick: () => {
            sheet.close();
            setTimeout(() => openSimulator({ value: x.value, desc: x.desc, method: x.method, cardName: x.cardName, parts: x.parts }), 120);
          } }, 'Ainda quero'),
          h('button.link.sm', { type: 'button', onclick: () => abandon(x.id) }, 'Desisti')
        )
      ))
    ) : null);
  };
  const abandon = id => { store.commit(s2=>{ const x=considerationList(s2).find(i=>i.id===id); if(x){x.status='abandoned';x.decidedAt=Date.now();} },{reason:'purchase-consideration'}); toast('Decisão registrada. Esse valor não entra como economia real.'); paintThinking(); };
  const saveForLater = r => { const d=desc.value.trim()||'Compra'; store.commit(s2=>{ s2.profile.purchaseConsiderations = considerationList(s2).filter(x=>x.status==='waiting'); s2.profile.purchaseConsiderations.unshift({id:uid(),desc:d,value:r.opt.value,method:r.opt.method,cardName:r.opt.cardName,parts:r.opt.parts,down:r.opt.down,createdAt:Date.now(),waitUntil:Date.now()+86400000,status:'waiting'}); },{reason:'purchase-consideration'}); toast('Compra guardada por 24 horas para você pensar.'); paintThinking(); };
  paintThinking();

  const run = debounce(() => {
    const v = value.getValue();
    st.down = st.method === 'card' ? down.getValue() : 0;
    if (!(v > 0)) { last = null; confirmBtn.disabled = true; result.replaceChildren(h('p.muted.sm', 'Digite o valor para ver o impacto no seu mês. Nada é registrado.')); return; }
    last = simulatePurchase({ value: v, method: st.method, cardName: st.cardName, parts: st.parts, down: st.down });
    confirmBtn.disabled = false;
    if (!tracked) { track('simulation_used', { channel: st.method, parts: st.parts }); tracked = true; }
    paint(last, suggestAlternative(last));
  }, 220);

  function paint(r, alt) {
    const t = TONE[r.tone], verdict = purchaseVerdict(r), impact = futurePurchaseImpact(r), best = bestPurchaseWindow(r);
    const impulseOn = store.getState().profile?.impulseBrake !== false;
    const row = (k, v) => h('div.kv', h('span', k), h('b', v));
    const rows = [];
    if (r.opt.method === 'card') rows.push(row(r.opt.parts > 1 ? 'Parcela' : 'Na fatura', `${r.opt.parts > 1 ? r.opt.parts + 'x de ' : ''}${money(r.partValue)}`));
    if (r.opt.down > 0) rows.push(row('Entrada hoje', money(r.opt.down)));
    rows.push(row('Livre até o próximo dinheiro', `${money0(r.before.free)} → ${money0(r.after.free)}`));
    if (r.after.free > 0) rows.push(row('Por dia, depois da compra', `${money0(r.after.perDay)} (antes ${money0(r.before.perDay)})`));
    if (r.worst) rows.push(row(`Fatura de ${monthName(r.worst.ym)}`, `${money0(r.worst.before)} → ${money0(r.worst.after)}`));
    if (r.limitAfter != null) rows.push(row('Limite do cartão usado', `${Math.round(r.limitBefore * 100)}% → ${Math.round(r.limitAfter * 100)}%`));
    if (impact.months > 1) { rows.push(row('Acréscimo mensal', money(impact.monthlyAdded))); rows.push(row('Futuro comprometido pela compra', money(impact.futureTotal))); }
    const months = r.months.length > 1 ? h('div.sim-months', { 'aria-label': 'Impacto nas próximas faturas' }, r.months.map(m => h('div', h('i', { vars: { '--h': Math.max(8, Math.min(100, (m.after / Math.max(...r.months.map(x => x.after), 1)) * 100)) + '%' } }), h('small', monthName(m.ym).slice(0, 3))))) : null;
    const altBox = alt ? h('div.sim-alt', h('p', h('b', 'Opção mais segura: '), `${alt.opt.down > 0 ? money0(alt.opt.down) + ' de entrada + ' : ''}${alt.opt.parts}x de ${money(alt.partValue)}`, ` deixa a situação ${TONE[alt.tone].label.toLowerCase()}.`),
      h('button.link.sm', { type: 'button', onclick: () => { st.parts = alt.opt.parts; parts.value = String(alt.opt.parts); down.value = alt.opt.down ? alt.opt.down.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''; run(); } }, 'Usar esta opção')) : null;
    const proBox = canUseFeature('advancedSimulator')
      ? h('div.sim-pro', h('b','Análise Pro'),
          h('p.muted.sm', r.worst ? `Maior impacto entre as faturas simuladas: ${monthName(r.worst.ym)} · ${money0(r.worst.after)} após a compra.` : 'Esta compra não criou uma fatura futura crítica no horizonte calculado.'),
          h('p.hint', `Veredito calculado com seus dados: ${TONE[r.tone].label}. O Bivvo não inventa valores nem garante resultados futuros.`))
      : h('button.premium-cta', {type:'button', onclick:()=>openPaywall({feature:'advancedSimulator'})}, h('b','✨ Análise Pro da compra'), h('span','Veja mais impacto futuro antes de decidir'));
    const bestBox = best ? h('div.sim-alt',h('p',h('b',`Melhor janela observada: ${monthName(best.ym)}. `),`Os compromissos já cadastrados ficam cerca de ${money0(best.released)} menores. Isso é uma estimativa com os dados atuais, não garantia.`)) : null;
    const brakeBox = impulseOn && shouldImpulseBrake(r) ? h('div.impulse-brake',h('b','🟠 Pense antes de comprar'),h('p',r.dropShare>0?`Esta compra compromete aproximadamente ${Math.round(r.dropShare*100)}% do seu dinheiro livre no período analisado.`:r.message),h('div.btn-row',h('button.btn',{type:'button',onclick:()=>saveForLater(r)},'Esperar 24 horas'),h('span.muted.sm','Você continua livre para registrar a compra.'))) : null;
    result.replaceChildren(
      h('div.purchase-verdict',h('strong',`${verdict.icon} ${verdict.label}`),h('small','Recomendação calculada com os dados cadastrados.')),
      h('div.sim-verdict.' + r.tone, h('span.sim-badge', h('i', { 'aria-hidden': 'true' }, t.icon), t.label), h('p', r.message)),
      h('div.kvs', rows), months, bestBox, brakeBox, altBox, proBox,
      h('p.hint', 'Simulação feita com os seus lançamentos, contas, faturas e meta de guardar. Nada foi registrado.'));
  }
  value.addEventListener('input', run); down.addEventListener('input', run);
  const sheet = openSheet({
    title: 'Posso comprar?', subtitle: 'Veja o impacto antes de decidir.',
    content: h('div.form', field('Valor', value), method, cardFields, downField, desc, h('label.impulse-toggle',h('input',{type:'checkbox',checked:store.getState().profile?.impulseBrake!==false,onchange:e=>store.commit(s2=>{s2.profile.impulseBrake=e.target.checked},{reason:'preference'})}),h('span',h('b','Freio de impulso'),h('small','Sugere 24h de reflexão em compras de maior impacto.'))), result, thinking),
    footer: [h('button.btn.ghost', { type: 'button', onclick: () => sheet.close() }, 'Fechar'), confirmBtn]
  });
  run();

  function register() {
    if (!last) return;
    const r = last, d = desc.value.trim() || 'Compra';
    store.commit(s2 => {
      const cat = store.autoCategory(d, 'expense', s2) || 'Compras';
      const t0 = today();
      if (r.opt.method === 'card') {
        if (r.opt.down > 0) s2.transactions.push({ id: uid(), date: t0, desc: `${d} (entrada)`, cat, type: 'expense', value: round2(r.opt.down), status: 'Pago', method: 'PIX', createdAt: Date.now() });
        if (r.opt.value - r.opt.down > 0) store.addCardPurchase(s2, { desc: d, cat, total: round2(r.opt.value - r.opt.down), parts: r.opt.parts, card: r.opt.cardName || s2.cards[0]?.name, date: t0 });
      } else s2.transactions.push({ id: uid(), date: t0, desc: d, cat, type: 'expense', value: r.opt.value, status: 'Pago', method: 'PIX', createdAt: Date.now() });
    });
    track('simulation_confirmed', { channel: r.opt.method, result: r.tone });
    sheet.close();
    toast(`${d} registrada: ${money(r.opt.value)}${r.opt.method === 'card' && r.opt.parts > 1 ? ` em ${r.opt.parts}x` : ''}.`);
  }
  return sheet;
}
