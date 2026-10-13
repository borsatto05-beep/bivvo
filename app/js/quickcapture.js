/* Bivvo 10.4 — captura rápida: barra fixa na Início, folha rápida e lembrete noturno.
   O interpretador fica em quickparse.js (puro e testado). Todo salvamento oferece Desfazer. */
import { h, money, today, uid, dayLabel, shortDate } from './util.js';
import * as store from './store.js';
import { openSheet, toast, catIcon, confirmSheet } from './ui.js';
import { parseQuick } from './quickparse.js';
import { voiceSupported, listen } from './voice.js';
import { track, trackOnce } from './analytics.js';
import { adminTrack } from './admin-analytics.js';
import * as F from './finance.js';
import * as cloud from './cloud.js';
import { getRemainingUsage, setUsage } from './plans.js';

const S = () => store.getState();
export const parse = (text, opts = {}) => { const s = S(); return parseQuick(text, { cards: s.cards, autoCategory: (d, t) => store.autoCategory(d, t, s), spoken: !!opts.spoken }); };

async function showQuickPaywall(usage) {
  const { openPaywall } = await import('./views/pro.js');
  openPaywall({ feature:'quick', usage });
}
async function consumeQuickUse() {
  const local = getRemainingUsage('quick');
  if (local.limit === Infinity || store.isDemo() || !cloud.currentUser()) return { ok:true, metered:false };
  if (local.remaining <= 0) { await showQuickPaywall({ used:local.used, limit:local.limit }); return { ok:false, metered:false }; }
  try {
    const token = await cloud.accessToken();
    if (!token) { toast('Entre novamente para validar sua cota de anotações.', { tone:'warn' }); return { ok:false, metered:false }; }
    const r = await fetch('/api/quick-capture-usage', { method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' }, body:'{}' });
    const j = await r.json().catch(()=>({}));
    if (r.status === 402 || j.code === 'quota') { await showQuickPaywall(j.usage || { used:local.limit, limit:local.limit }); return { ok:false, metered:false }; }
    if (!r.ok) { toast(j.error || 'Não foi possível validar sua cota de anotações.', { tone:'warn' }); return { ok:false, metered:false }; }
    if (j.usage?.used != null) setUsage('quick_capture', j.usage.used);
    return { ok:true, metered:!j.unlimited };
  } catch {
    toast('Não foi possível validar sua cota agora. Tente novamente.', { tone:'warn' });
    return { ok:false, metered:false };
  }
}
async function refundQuickUse() {
  try {
    const token = await cloud.accessToken(); if (!token) return;
    await fetch('/api/quick-capture-usage', { method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' }, body:JSON.stringify({action:'refund'}) });
    const u=getRemainingUsage('quick'); if(u.used>0)setUsage('quick_capture',u.used-1);
  } catch { /* melhor esforço */ }
}
function captureConfig(options={}) {
  return {
    parseFn: options.parseFn || parse,
    categoriesFn: options.categoriesFn || (type => store.categories(type, S())),
    cardsFn: options.cardsFn || (() => S().cards),
    saveFn: options.saveFn || ((p, choice) => saveParsed(p, choice)),
    scanFn: options.scanFn || (() => startScan()),
    detailsFn: options.detailsFn,
    placeholder: options.placeholder || 'Ex.: mercado 45 ou iFood 32 no Nubank',
    ariaLabel: options.ariaLabel || 'Anotar gasto ou entrada',
    examples: options.examples || 'Exemplos: mercado 45 · ifood 32 nubank · tv 3x 900 · farmácia 20 ontem',
    title: options.title || 'Anotar em 2 segundos',
    subtitle: options.subtitle || 'Descrição e valor. Data, cartão e parcelas são opcionais.',
    label: options.label || 'Anotação rápida',
    voicePrompt: options.voicePrompt || 'Ouvindo… ex.: "gastei 87 no mercado no pix"',
    draftKey: options.draftKey || 'personal',
    quota: options.quota !== false
  };
}
async function performCaptureSave(cfg,p,choice,source='text') {
  const gate = cfg.quota ? await consumeQuickUse() : {ok:true,metered:false};
  if(!gate.ok)return false;
  try { await cfg.saveFn(p,{...choice,source}); return true; }
  catch(e){ if(gate.metered)await refundQuickUse(); toast(e?.message||'Não foi possível salvar esta anotação.',{tone:'warn'}); return false; }
}

/* ---------------- gravação + desfazer ---------------- */
export function saveParsed(p, { cat, cardName, source = 'text' } = {}) {
  const hadRealTx = S().transactions.some(t => t.kind !== 'opening' && !t.demoSeed);
  let created = [], insts = [];
  const category = cat || p.cat;
  const card = p.card ? (S().cards.find(c => c.name === (cardName || p.card.name)) || p.card) : null;
  store.commit(s => {
    const before = new Set(s.transactions.map(t => t.id)), instBefore = new Set(s.installments.map(i => i.id));
    store.learnCategory(s, p.desc, category);
    if (card && p.type === 'expense') {
      const added = store.addCardPurchase(s, { desc: p.desc, cat: category, total: p.value, parts: p.parts || 1, card: card.name, date: p.date });
      added.forEach(t => { t.captureSource = source; });
    } else s.transactions.push({ id: uid(), date: p.date, desc: p.desc, cat: category, type: p.type, value: p.value, status: p.future ? 'Pendente' : 'Pago', method: p.method && p.method !== 'Crédito' ? p.method : (p.type === 'income' ? 'Transferência' : 'PIX'), createdAt: Date.now(), source: 'quick', captureSource: source });
    created = s.transactions.filter(t => !before.has(t.id)).map(t => t.id);
    insts = s.installments.filter(i => !instBefore.has(i.id)).map(i => i.id);
  });
  const when = p.date === today() ? '' : `, ${dayLabel(p.date) === 'Ontem' ? 'ontem' : 'em ' + shortDate(p.date)}`;
  const parts = card && p.parts > 1 ? ` em ${p.parts}x` : '';
  track(source === 'voice' ? 'voice_used' : source === 'scan' ? 'scan_used' : 'quick_capture_used', { channel: card ? 'card' : 'cash', parts: p.parts || 1 });
  trackOnce('first_tx');
  if (!hadRealTx) {
    adminTrack('first_transaction','activation').catch(()=>{});
    const sNow = S();
    const hasIncome = sNow.fixed.some(x => x.type === 'income') || sNow.transactions.some(t => F.isRealIncome(t));
    const hasOpening = sNow.transactions.some(t => F.isOpening(t));
    if (sNow.profile.onboarded && !sNow.profile.activationValueSeen && hasIncome && hasOpening) {
      try {
        if (!localStorage.getItem('bivvo_first_value_shown_v1')) {
          localStorage.setItem('bivvo_first_value_shown_v1','1');
          setTimeout(() => showFirstValue(), 220);
        }
      } catch { setTimeout(() => showFirstValue(), 220); }
    }
  }
  toast(`Anotado: ${p.desc}, ${money(p.value)}${parts}${when}`, { action: { label: 'Desfazer', fn: () => undoSave(created, insts) } });
  return created;
}
function showFirstValue() {
  const sp = F.spendable(S());
  const result = sp.tone === 'neg'
    ? h('div.onb-result', h('p.muted','Com o que você informou, seus compromissos passam do saldo em'), h('strong', money(-sp.free)), h('p.muted','O Bivvo vai ajudar você a enxergar o que precisa ser ajustado primeiro.'))
    : h('div.onb-result', h('p.muted','Com o que você informou, você tem aproximadamente'), h('strong', money(sp.free)), h('p.muted',`livres até ${sp.next.source === 'mes' ? 'o fim do mês' : 'o próximo dinheiro'} — cerca de ${money(sp.perDay)} por dia.`));
  store.commit(s => { s.profile.activationValueSeen = true; s.profile.activationAt = s.profile.activationAt || new Date().toISOString(); }, { reason:'activation-value', silent:true });
  const sheet = openSheet({
    title: '🎉 Seu Bivvo está pronto',
    subtitle: 'Agora você já tem uma primeira visão do seu dinheiro.',
    content: result,
    footer: [h('button.btn.primary',{type:'button',onclick:()=>sheet.close()},'Ver meu painel')],
    label: 'Bivvo configurado'
  });
  adminTrack('first_value_shown','activation').catch(()=>{});
  adminTrack('activation_completed','activation').catch(()=>{});
}

function undoSave(ids, insts) {
  if (!ids.length) return;
  store.markDeleted(ids, insts);
  store.commit(s => {
    const drop = new Set(ids), dropInst = new Set(insts);
    s.transactions = s.transactions.filter(t => !drop.has(t.id));
    s.installments = s.installments.filter(i => !dropInst.has(i.id));
  });
  toast('Desfeito. Nada foi salvo.');
}

/* ---------------- prévia compartilhada ---------------- */
function previewBox(options={}) {
  const cfg=captureConfig(options);
  const box = h('div.qc-preview', { 'aria-live': 'polite' });
  const st = { cat: null, card: null };
  box.paint = p => {
    box.replaceChildren();
    if (!p || p.error) { box.classList.add('empty'); box.append(h('small', p?.error && box.dataset.touched ? p.error : cfg.examples)); return; }
    box.classList.remove('empty');
    const cats = cfg.categoriesFn(p.type) || [];
    if (st.cat && !cats.includes(st.cat)) st.cat = null;
    const catSel = h('select.qc-chip', { 'aria-label': 'Categoria' }, cats.map(c => h('option', { value: c }, `${catIcon(c)} ${c}`)));
    if(cats.length){catSel.value = st.cat || p.cat; if (!catSel.value) catSel.value = cats[0]; catSel.addEventListener('change', () => { st.cat = catSel.value; });}
    const meta = [cats.length?catSel:null, h('span.qc-chip.static', p.date === today() ? 'Hoje' : dayLabel(p.date))].filter(Boolean);
    const cards=cfg.cardsFn()||[];
    if (p.card && cards.length) {
      const cardSel = h('select.qc-chip', { 'aria-label': 'Cartão' }, cards.map(c => h('option', { value: c.name }, `💳 ${c.name}`)));
      cardSel.value = st.card || p.card.name;
      cardSel.addEventListener('change', () => { st.card = cardSel.value; });
      meta.push(cardSel);
      if (p.parts > 1) meta.push(h('span.qc-chip.static', `${p.parts}x de ${money(p.value / p.parts)}`));
    } else if (p.type === 'expense') meta.push(h('span.qc-chip.static', p.future ? 'Agendado' : `${p.method === 'Débito' ? 'Débito' : p.method === 'Dinheiro' ? 'Dinheiro' : 'Pix'} · pago`));
    else meta.push(h('span.qc-chip.static.in', 'Entrada'));
    box.append(h('div.qc-main', h('b', p.desc), h('strong' + (p.type === 'income' ? '.in' : ''), (p.type === 'income' ? '+ ' : '− ') + money(p.value))), h('div.qc-meta', meta));
    if (p.needsCard) box.append(h('small.qc-note', 'Para parcelar, cadastre um cartão. Por enquanto vai como gasto à vista.'));
    if (p.card && p.cardGuessed) box.append(h('small.qc-note', 'Confira o cartão antes de salvar.'));
  };
  box.choices = () => ({ cat: st.cat, cardName: st.card });
  box.reset = () => { st.cat = null; st.card = null; };
  return box;
}

/* ---------------- barra fixa da Início ---------------- */
const captureDrafts=new Map(),captureFocus=new Set();
export function captureBar(options={}) {
  const cfg=captureConfig(options),key=cfg.draftKey;
  const input = h('input.qc-input', { type: 'text', inputmode: 'text', enterKeyHint: 'done', autocomplete: 'off', autocapitalize: 'none', spellcheck: false, placeholder: cfg.placeholder, 'aria-label': cfg.ariaLabel });
  const btn = h('button.qc-save', { type: 'submit', 'aria-label': 'Salvar' }, 'Salvar');
  const preview = previewBox(options);
  const mic = h('button.qc-mic', { type: 'button', 'aria-label': voiceSupported() ? 'Falar a movimentação' : 'Entrada por voz indisponível neste navegador', disabled: !voiceSupported(), onclick: () => openSmartCapture({ ...options, voice: true }) }, '🎙');
  const camera = h('button.qc-mic.qc-camera', { type: 'button', 'aria-label': 'Escanear comprovante com a câmera', onclick: () => cfg.scanFn() }, '📷');
  const quotaNote=h('small.qc-limit');
  const paintQuota=()=>{const u=getRemainingUsage('quick');if(u.limit===Infinity){quotaNote.hidden=true;return;}quotaNote.hidden=false;quotaNote.textContent=`Grátis · ${u.remaining} de ${u.limit} anotações rápidas restantes neste mês`;};
  const wrap = h('form.card.qc-bar', { onsubmit: e => { e.preventDefault(); save(); } },
    h('div.qc-row', h('span.qc-bolt', { 'aria-hidden': 'true' }, '⚡'), input, mic, camera, btn), preview, quotaNote);
  const paint = () => {
    captureDrafts.set(key,input.value);
    const has = !!input.value.trim();
    wrap.classList.toggle('open', has);
    btn.disabled = !has;
    preview.dataset.touched = has ? '1' : '';
    preview.paint(has ? cfg.parseFn(input.value) : null);
  };
  input.addEventListener('input', () => { preview.reset(); paint(); });
  input.addEventListener('focus', () => { captureFocus.add(key); setTimeout(() => wrap.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250); });
  input.addEventListener('blur', () => { setTimeout(() => { if (document.activeElement !== input) captureFocus.delete(key); }, 0); });
  async function save() {
    const p = cfg.parseFn(input.value);
    if (p.error) { preview.dataset.touched = '1'; preview.paint(p); input.focus(); return; }
    const choice = preview.choices();
    btn.disabled=true;
    const ok=await performCaptureSave(cfg,p,choice,'text');
    btn.disabled=false;
    if(!ok)return;
    paintQuota();
    captureDrafts.set(key,''); captureFocus.delete(key); input.value=''; input.blur(); preview.reset(); paint();
  }
  input.value = captureDrafts.get(key)||''; paint(); paintQuota();
  if (captureFocus.has(key)) requestAnimationFrame(() => { input.focus(); const n = input.value.length; try { input.setSelectionRange(n, n); } catch { /* ignore */ } });
  return wrap;
}

/* ---------------- folha rápida (botão +, atalho e lembrete) ---------------- */
export function openSmartCapture(options = {}) {
  const { startup = false, onDisable, voice = false } = options, cfg=captureConfig(options);
  const input = h('input.input.qc-input-lg', { type: 'text', inputmode: 'text', enterKeyHint: 'done', autocomplete: 'off', autocapitalize: 'none', spellcheck: false, placeholder: cfg.placeholder, autofocus: true, 'aria-label': cfg.ariaLabel });
  const preview = previewBox(options);
  let parsed = null, spoken = false, source = 'text', listening = null, voiceError = false;
  const paint = () => { parsed = cfg.parseFn(input.value, { spoken }); preview.dataset.touched = input.value.trim() ? '1' : ''; preview.paint(input.value.trim() ? parsed : null); };
  input.addEventListener('input', () => { spoken = false; source = 'text'; preview.reset(); paint(); });
  const voiceMsg = h('p.qc-voice-msg', { role: 'status' });
  const micBtn = h('button.qc-tool', { type: 'button', onclick: () => toggleVoice() }, h('span', { 'aria-hidden': 'true' }, '🎙'), 'Falar');
  const scanBtn = h('button.qc-tool', { type: 'button', 'aria-label': 'Abrir câmera para escanear comprovante', onclick: () => { sheet.close(); setTimeout(() => cfg.scanFn(), 150); } }, h('span', { 'aria-hidden': 'true' }, '📷'), 'Câmera');
  function toggleVoice() {
    if (listening) { listening.stop(); return; }
    if (!voiceSupported()) { voiceMsg.textContent = 'Este navegador não reconhece fala. Digite abaixo.'; input.focus(); return; }
    voiceError = false;
    micBtn.classList.add('on'); voiceMsg.textContent = cfg.voicePrompt;
    listening = listen({
      onText: t => { input.value = t; spoken = true; source = 'voice'; preview.reset(); paint(); },
      onEnd: () => { listening = null; micBtn.classList.remove('on'); if (!voiceError) voiceMsg.textContent = input.value ? 'Confira e toque em Salvar.' : ''; },
      onError: m => { voiceError = true; listening = null; micBtn.classList.remove('on'); voiceMsg.textContent = m; }
    });
  }
  const tools = h('div.qc-tools', voiceSupported() ? micBtn : null, scanBtn);
  const details = options.detailsFn === false ? null : h('button.link.sm', { type: 'button', onclick: () => {
    const p = parsed && !parsed.error ? parsed : {};
    const c = preview.choices();
    sheet.close();
    if(typeof cfg.detailsFn==='function'){setTimeout(()=>cfg.detailsFn(p,c),120);return;}
    setTimeout(async () => { const { openTxForm } = await import('./views/forms.js'); openTxForm({ mode: p.card ? 'card' : p.type || 'expense', preset: { value: p.value, desc: p.desc, cat: c.cat || p.cat, card: c.cardName || p.card?.name, date: p.date, parts: p.parts } }); }, 120);
  } }, 'Adicionar detalhes');
  const links = h('div.qc-links', details, startup ? h('button.link.sm.muted-link', { type: 'button', onclick: () => { sheet.close(); onDisable?.(); } }, 'Não lembrar à noite') : null);
  const form = h('form.form.qc-sheet', { onsubmit: e => { e.preventDefault(); save(); } }, input, tools, voiceMsg, preview, links, h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
  const saveBtn=h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, 'Salvar');
  const footer = [h('button.btn.ghost', { type: 'button', onclick: () => sheet.close() }, startup ? 'Agora não' : 'Cancelar'), saveBtn];
  const sheet = openSheet({ title: startup ? 'Vamos registrar seu primeiro gasto?' : voice ? 'Falar movimentação' : cfg.title, subtitle: startup ? 'Digite do seu jeito. O Bivvo organiza para você.' : cfg.subtitle, content: form, footer, label: cfg.label });
  paint();
  async function save() {
    paint();
    if (!parsed || parsed.error) { preview.dataset.touched = '1'; preview.paint(parsed); input.focus(); return; }
    const c = preview.choices();
    saveBtn.disabled=true;
    const ok=await performCaptureSave(cfg,parsed,c,source);
    saveBtn.disabled=false;
    if(!ok)return;
    listening?.stop(); sheet.close();
  }
  if (voice) setTimeout(() => toggleVoice(), 300);
  return sheet;
}

/* ---------------- lembrete ao abrir: só à noite e só se nada foi anotado hoje ---------------- */
const localISO = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function loggedToday(s = S()) {
  const t0 = today();
  return s.transactions.some(t => !t.demoSeed && !t.fixedId && !t.recurringKey && t.kind !== 'opening' && !t.loanId && t.createdAt && localISO(t.createdAt) === t0);
}
export function shouldOfferEveningCapture({ demo }) {
  const s = S();
  if (demo || !s.profile.onboarded || s.profile.eveningCapture === false) return false;
  if (new Date().getHours() < 18) return false;
  if (loggedToday(s)) return false;
  try { if (localStorage.getItem('bivvo_evening_capture') === today()) return false; } catch { /* modo privado */ }
  return true;
}
export function markEveningCaptureShown() { try { localStorage.setItem('bivvo_evening_capture', today()); } catch { /* ignore */ } }

/* ---------------- comprovante: escolher → ler → CONFIRMAR ---------------- */
export async function startScan(file, { onResult } = {}) {
  const [{ pickImage, captureSmartReceipt, readReceipt }, { openScanConfirm, openScanUnavailable }, cloud, { openPaywall }] = await Promise.all([import('./scan.js?v=11.47.0'), import('./views/scanconfirm.js?v=11.47.0'), import('./cloud.js'), import('./views/pro.js')]);
  if (store.isDemo() || !cloud.currentUser()) { openScanUnavailable('demo'); return; }
  adminTrack('receipt_scanner_opened', 'scan').catch(()=>{});
  if (!file) { try { if (!localStorage.getItem('bivvo_scan_tip_v4')) { toast('Dica: enquadre o comprovante inteiro. O Bivvo usa uma única foto e faz várias conferências internas automaticamente.'); localStorage.setItem('bivvo_scan_tip_v4', '1'); } } catch { /* ignore */ } }
  const f = file || await captureSmartReceipt().catch(() => pickImage());
  if (!f) return;
  const busy = toastBusy('Lendo local, data e valor…');
  const r = await readReceipt(f).catch(e => ({ ok: false, error: e.message }));
  busy();
  const diagnosticSummary=Object.entries(r.diagnostics||{remoteStatus:r.code||'image_error'}).map(([key,value])=>key+':'+String(value)).join('/');
  adminTrack('receipt_reading_diagnostics','scan',{error_type:'receipt_reader',error_message:diagnosticSummary,app_version:'11.47.0'}).catch(()=>{});
  if (r.ok) { adminTrack('receipt_scanner_completed', 'scan').catch(()=>{}); if(typeof onResult==='function')onResult(r.data);else openScanConfirm(r.data); return; }
  track('scan_failed', { result: r.code || 'error' });
  adminTrack('receipt_scanner_failed', 'scan', { error_type: r.code || 'error', error_message: r.error || '' }).catch(()=>{});
  toast(r.code==='not_configured'?'Não foi possível acessar a leitura online. Preencha os dados que faltarem.':r.code==='quota'?'Leitura online no limite do mês. Preencha os dados que faltarem.':'Não consegui identificar os dados desta foto. Preencha o gasto abaixo.',{tone:'warn'});
  if(typeof onResult==='function')onResult(r.data || {});else openScanConfirm(r.data || {});
}
function toastBusy(text) { toast(text); const t = setInterval(() => toast(text), 2400); return () => clearInterval(t); }
