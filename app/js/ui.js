/* Bivvo — componentes de interface reutilizáveis (folhas, diálogos, toast). */
import { h, $, haptic } from './util.js';
import { getState } from './store.js';

/* ---------- ícones por categoria (emoji = zero peso, legível em qualquer aparelho) ---------- */
const CAT_ICON = {
  'Moradia':'🏠','Mercado':'🛒','Alimentação':'🍽️','Delivery':'🛵','Restaurantes':'🍴','Transporte':'🚗','Combustível':'⛽','Estacionamento e pedágio':'🅿️',
  'Energia':'💡','Água':'🚿','Gás':'🔥','Internet':'📶','Telefone':'📱','Saúde':'🩺','Academia':'🏋️','Educação':'📚','Lazer':'🎟️','Assinaturas':'🔁','Streaming':'📺',
  'Compras':'🛍️','Roupas':'👕','Beleza':'💅','Higiene e cuidados pessoais':'🧴','Casa e manutenção':'🛠️','Eletrônicos':'💻','Seguros':'🛡️','Serviços':'🔧','Trabalho':'💼',
  'Presentes e doações':'🎁','Dívidas e empréstimos':'📉','Impostos e taxas':'🧾','Pets':'🐾','Filhos':'🧸','Viagens':'✈️','Investimentos':'💎','Reserva de Emergência':'🛡️','Guardado':'🫙','Outros':'•',
  'Salário':'💼','Vale/Benefício':'🎫','Freelance':'🧑‍💻','Comissão':'🤝','Venda':'🏷️','Reembolso':'↩️','Rendimentos':'📈','Presente':'🎁','Juros / Empréstimo':'🤲','Saldo inicial':'🏁',
  'Mercadorias / estoque':'📦','Matéria-prima':'🧱','Fornecedores':'🤝','Folha de pagamento':'👥','Pró-labore':'👔','Encargos trabalhistas':'🧾','Impostos e tributos':'🏛️','Aluguel comercial':'🏢','Energia e água':'💡','Internet e telefone':'🌐','Marketing e anúncios':'📣','Fretes e entregas':'🚚','Combustível e frota':'⛽','Manutenção':'🛠️','Softwares e sistemas':'💻','Taxas bancárias':'🏦','Taxas de cartão / marketplace':'💳','Contabilidade':'🧮','Serviços terceirizados':'🧰','Equipamentos':'⚙️','Seguros empresariais':'🛡️','Viagens e representação':'✈️','Dívidas e financiamentos':'📉','Investimentos na empresa':'🏗️','Retirada dos sócios':'↗️','Outras despesas':'•',
  'Vendas de produtos':'🛍️','Prestação de serviços':'🧑‍💼','Recebimentos de clientes':'💰','Contratos / mensalidades':'📄','Comissões':'🤝','Marketplace':'🛒','Juros e rendimentos':'📈','Aporte dos sócios':'🏦','Empréstimo empresarial':'💵','Outras receitas':'•'
};
export const catIcon = c => getState()?.categoryIcons?.[c] || CAT_ICON[c] || '•';

/* ---------- toast ---------- */
let toastTimer;
export function toast(message, opts = {}) {
  const host = $('#toast');
  if (!host) return;
  host.replaceChildren(h('span', message));
  if (opts.action) host.append(h('button.toast-action', { type: 'button', onclick: () => { host.classList.remove('show'); opts.action.fn(); } }, opts.action.label));
  host.className = 'toast show' + (opts.tone ? ' ' + opts.tone : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => host.classList.remove('show'), opts.action ? 5200 : 2600);
}

/* ---------- folhas (bottom sheet no celular, diálogo no desktop) ---------- */
const stack = [];
let popping = false;
window.addEventListener('popstate', () => {
  if (!stack.length) return;
  // Fechar um diálogo filho já o remove da pilha antes de history.back().
  // Se o histórico voltou ao pai que ainda está aberto, mantenha esse pai.
  if (history.state?.bivvoSheet === stack[stack.length - 1].historyId) return;
  popping = true;
  stack[stack.length - 1].close();
  popping = false;
});

export function openSheet({ title, subtitle, content, footer, wide = false, full = false, onClose, label } = {}) {
  const id = 's' + Date.now() + Math.random().toString(36).slice(2, 6);
  const prevFocus = document.activeElement;
  const closeBtn = h('button.sheet-close', { type: 'button', 'aria-label': 'Fechar' }, '✕');
  const head = title ? h('header.sheet-head', h('div', h('h2', title), subtitle ? h('p.sheet-sub', subtitle) : null), closeBtn) : null;
  const panel = h('section.sheet' + (wide ? '.wide' : '') + (full ? '.full' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || 'Janela', tabindex: '-1' },
    h('div.sheet-grip', { 'aria-hidden': 'true' }), head, h('div.sheet-body', content), footer ? h('footer.sheet-foot', footer) : null);
  if (!head) panel.append(h('button.sheet-close.floating', { type: 'button', 'aria-label': 'Fechar', onclick: () => api.close() }, '✕'));
  const scrim = h('div.scrim', { onclick: () => api.close() });
  const wrap = h('div.sheet-wrap', scrim, panel);
  document.body.append(wrap);
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => wrap.classList.add('in'));
  let closed = false;
  const api = {
    historyId: id,
    el: panel,
    close(result) {
      if (closed) return; closed = true;
      const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
      wrap.classList.remove('in'); wrap.classList.add('out');
      setTimeout(() => wrap.remove(), 220);
      if (!stack.length) document.body.classList.remove('sheet-open');
      if (!popping && history.state?.bivvoSheet === id) history.back();
      try { prevFocus?.focus?.({ preventScroll: true }); } catch { /* ignore */ }
      onClose?.(result);
    }
  };
  closeBtn.addEventListener('click', () => api.close());
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); api.close(); }
    if (e.key === 'Tab') {
      const nodes=Array.from(panel.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')).filter(x=>!x.disabled&&x.tabIndex>=0&&x.getClientRects().length);
      const first=nodes[0],last=nodes.at(-1);
      if(!first){e.preventDefault();panel.focus();}
      else if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel)){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===panel)){e.preventDefault();first.focus();}
    }
  });
  stack.push(api);
  history.pushState({ ...(history.state || {}), bivvoSheet: id }, '');
  setTimeout(() => { (panel.querySelector('[autofocus]') || panel).focus({ preventScroll: true }); }, 60);
  return api;
}
export const closeAllSheets = () => [...stack].reverse().forEach(s => s.close());

export function confirmSheet({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, requireText = '', extra = null }) {
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      // Resolva a confirmação imediatamente. Não dependa do ciclo de
      // history.back()/animação do sheet para liberar o próximo passo.
      resolve(value);
    };
    const input = requireText ? h('input.input', { autocomplete: 'off', autocapitalize: 'characters', placeholder: requireText, 'aria-label': `Digite ${requireText}` }) : null;
    const go = h('button.btn' + (danger ? '.danger' : '.primary'), { type: 'button', disabled: !!requireText }, confirmLabel);
    if (input) input.addEventListener('input', () => { go.disabled = input.value.trim().toUpperCase() !== requireText; });
    let sheet;
    let accepting = false;
    const cancel = h('button.btn.ghost', { type: 'button' }, cancelLabel);
    sheet = openSheet({
      title, label: title,
      content: [h('p.sheet-text', message), extra, input ? h('label.field', h('span', `Digite ${requireText} para confirmar`), input) : null],
      footer: [cancel, go],
      // Ao confirmar, openSheet chama history.back(). O popstate dessa navegação é
      // assíncrono; abrir o próximo sheet antes dele fazia o navegador fechar
      // imediatamente o diálogo seguinte (ex.: senha da exclusão de conta).
      onClose: () => { if (!accepting) finish(false); }
    });
    cancel.addEventListener('click', () => { finish(false); sheet.close(); });
    go.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (go.disabled) return;
      accepting = true;
      sheet.close();
      // Aguarda o history.back()/popstate do sheet atual terminar antes de
      // liberar o chamador para abrir outro diálogo.
      setTimeout(() => finish(true), 120);
    });
    if (input) setTimeout(() => input.focus(), 80);
  });
}

export function askSheet({ title, message, label, type = 'text', inputmode, placeholder = '', autocomplete = 'off', confirmLabel = 'Continuar', pattern }) {
  return new Promise(resolve => {
    let value = null;
    const input = h('input.input', { type, inputmode, placeholder, autocomplete, 'aria-label': label || title });
    const form = h('form', { onsubmit: e => { e.preventDefault(); if (pattern && !pattern.test(input.value.trim())) { input.classList.add('invalid'); input.focus(); return; } value = input.value; sheet.close(); } },
      message ? h('p.sheet-text', message) : null, h('label.field', h('span', label || ''), input), h('button.hidden-submit', { type: 'submit', tabindex: '-1', 'aria-hidden': 'true' }));
    const sheet = openSheet({
      title, content: form,
      footer: [h('button.btn.ghost', { type: 'button', onclick: () => sheet.close() }, 'Cancelar'), h('button.btn.primary', { type: 'button', onclick: () => form.requestSubmit() }, confirmLabel)],
      onClose: () => resolve(value)
    });
    setTimeout(() => input.focus(), 80);
  });
}

/* ---------- pequenos componentes ---------- */
export function segmented(options, value, onChange, cls = '') {
  const wrap = h('div.seg' + (cls ? '.' + cls : ''), { role: 'tablist' });
  const paint = v => [...wrap.children].forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  for (const o of options) {
    wrap.append(h('button', { type: 'button', role: 'tab', dataset: { v: o.value }, onclick: () => { haptic(); paint(o.value); onChange(o.value); } }, o.label));
  }
  paint(value);
  wrap.setValue = paint;
  return wrap;
}
export function emptyState({ icon = '✨', title, text, action }) {
  return h('div.empty', h('div.empty-ico', { 'aria-hidden': 'true' }, icon), h('b', title), text ? h('p', text) : null,
    action ? h('button.btn.primary.sm', { type: 'button', onclick: action.fn }, action.label) : null);
}
export function field(label, input, hint) { return h('label.field', h('span', label), input, hint ? h('small.hint', hint) : null); }
export function progress(value, max, tone = '') {
  const p = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return h('div.bar' + (tone ? '.' + tone : ''), { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(p * 100)) },
    h('i', { vars: { '--p': (p * 100).toFixed(1) + '%' } }));
}
export function sectionTitle(title, action) {
  return h('div.sec-title', h('h3', title), action ? h('button.link', { type: 'button', onclick: action.fn }, action.label) : null);
}
/* Contagem animada de valores (respeita reduced motion). */
export function countUp(el, to, fmt, ms = 650) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Number.isFinite(to)) { el.textContent = fmt(to); return; }
  const from = Number(el.dataset.v || 0); el.dataset.v = to;
  if (from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
