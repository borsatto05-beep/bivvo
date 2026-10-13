/* Bivvo 10.4 — Dividir conta por link.
   O link carrega só o que a outra pessoa precisa ver (descrição, total, parte, chave Pix opcional),
   dentro do #hash: nada passa pelo servidor e nada da sua conta é exposto. */
import { h, money, round2, today, uid, splitInstallments, shortDate } from '../util.js';
import * as store from '../store.js';
import { openSheet, toast, field } from '../ui.js';
import { moneyInput } from './forms.js';
import { ctx } from '../nav.js';
import { track } from '../analytics.js';

const S = () => store.getState();
const b64u = str => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
const appUrl = () => location.origin + location.pathname;
export const splitLink = data => `${appUrl()}#/racha?d=${b64u(JSON.stringify({ v: 1, ...data }))}`;

export function readSplitFromHash(hash = location.hash) {
  const m = String(hash).match(/^#\/racha\?d=([A-Za-z0-9_-]{8,2400})$/);
  if (!m) return null;
  try {
    const o = JSON.parse(unb64u(m[1]));
    const str = (v, n) => String(v ?? '').slice(0, n);
    const n = v => { const x = Number(v); return Number.isFinite(x) && x >= 0 && x < 1e8 ? round2(x) : 0; };
    const d = { d: str(o.d, 60), t: n(o.t), n: Math.max(2, Math.min(50, Math.floor(Number(o.n)) || 2)), s: n(o.s), f: str(o.f, 40), to: str(o.to, 40), p: str(o.p, 80), dt: /^\d{4}-\d{2}-\d{2}$/.test(o.dt) ? o.dt : '' };
    return d.d && d.s > 0 ? d : null;
  } catch { return null; }
}

/* ---------------- formulário ---------------- */
export function openSplitForm() {
  const s = S();
  const desc = h('input.input', { type: 'text', maxLength: 60, placeholder: 'Ex.: pizza de sexta', autocomplete: 'off', autofocus: true });
  const total = moneyInput(null, { big: true, label: 'Total da conta' });
  let people = 2;
  const count = h('b.split-count', '2');
  const step = d => { people = Math.max(2, Math.min(20, people + d)); count.textContent = String(people); syncNames(); calc(); };
  const stepper = h('div.split-stepper', h('button.btn.sm', { type: 'button', 'aria-label': 'Menos uma pessoa', onclick: () => step(-1) }, '−'), count, h('button.btn.sm', { type: 'button', 'aria-label': 'Mais uma pessoa', onclick: () => step(1) }, '+'));
  const namesBox = h('div.split-names');
  const nameInputs = [];
  function syncNames() {
    while (nameInputs.length < people - 1) { const i = h('input.input', { type: 'text', maxLength: 40, placeholder: `Pessoa ${nameInputs.length + 1}`, autocomplete: 'off' }); nameInputs.push(i); }
    namesBox.replaceChildren(...nameInputs.slice(0, people - 1));
  }
  const methodOpts = [{ value: 'PIX', label: 'Pix' }, { value: 'Débito', label: 'Débito' }, { value: 'Dinheiro', label: 'Dinheiro' }, ...s.cards.map(c => ({ value: 'card:' + c.name, label: `💳 ${c.name}` }))];
  const method = h('select.input', { 'aria-label': 'Como você pagou' }, methodOpts.map(o => h('option', { value: o.value }, o.label)));
  const pix = h('input.input', { type: 'text', maxLength: 80, placeholder: 'Opcional: e-mail, celular ou chave aleatória', autocomplete: 'off', value: s.profile.pixKey || '' });
  const out = h('p.calc');
  const calc = () => { const t = total.getValue(); out.textContent = t > 0 ? `Cada pessoa: ${money(splitInstallments(t, people)[0])} · você recebe ${money(t - splitInstallments(t, people)[0])}` : ''; };
  total.addEventListener('input', calc);
  syncNames();
  const msg = h('p.form-msg', { role: 'alert' });
  const sheet = openSheet({
    title: 'Dividir conta', subtitle: 'Você registra o total que pagou e o Bivvo anota quanto cada um te deve.',
    content: h('div.form', field('O que foi', desc), field('Total que você pagou', total), h('div.field', h('span', 'Quantas pessoas, contando você'), stepper), h('div.field', h('span', 'Com quem (opcional)'), namesBox), field('Você pagou com', method), field('Sua chave Pix', pix, 'Aparece só no link que você enviar.'), out, msg),
    footer: [h('button.btn.ghost', { type: 'button', onclick: () => sheet.close() }, 'Cancelar'), h('button.btn.primary', { type: 'button', onclick: () => save() }, 'Dividir e gerar links')]
  });
  function save() {
    const d = desc.value.trim(), t = total.getValue();
    if (!d) { msg.textContent = 'Diga o que foi. Ex.: pizza de sexta.'; desc.focus(); return; }
    if (!(t > 0)) { msg.textContent = 'Informe o total da conta.'; total.focus(); return; }
    const shares = splitInstallments(t, people), splitId = uid(), date = today();
    const names = nameInputs.slice(0, people - 1).map((i, k) => i.value.trim() || `Pessoa ${k + 1}`);
    const pixKey = pix.value.trim();
    store.commit(st => {
      if (pixKey) st.profile.pixKey = pixKey; else delete st.profile.pixKey;
      const cat = store.autoCategory(d, 'expense', st) || 'Outros';
      if (method.value.startsWith('card:')) store.addCardPurchase(st, { desc: d, cat, total: t, parts: 1, card: method.value.slice(5), date, note: `Dividido em ${people}` });
      else st.transactions.push({ id: uid(), date, desc: d, cat, type: 'expense', value: t, status: 'Pago', method: method.value, splitId, note: `Dividido em ${people}`, createdAt: Date.now() });
      names.forEach((name, k) => st.transactions.push({ id: uid(), date, desc: `${d} · parte de ${name}`, cat: 'Reembolso', type: 'income', value: shares[k + 1], status: 'Pendente', method: 'PIX', splitId, splitPerson: name, createdAt: Date.now() }));
    }, { reason: 'split' });
    track('split_created', { parts: people });
    sheet.close();
    setTimeout(() => openShareLinks({ d, t, n: people, shares, names, pixKey, date }), 160);
  }
}

function openShareLinks({ d, t, n, shares, names, pixKey, date }) {
  const from = S().profile.name || '';
  const rows = names.map((name, k) => {
    const link = splitLink({ d, t, n, s: shares[k + 1], f: from, to: name.startsWith('Pessoa ') ? '' : name, p: pixKey, dt: date });
    const text = `${name.startsWith('Pessoa ') ? 'Oi' : 'Oi, ' + name}! ${d} deu ${money(t)} entre ${n}. Sua parte: ${money(shares[k + 1])}.${pixKey ? ` Pix: ${pixKey}` : ''}`;
    const send = async () => {
      try {
        if (navigator.share) await navigator.share({ title: 'Bivvo · conta dividida', text, url: link });
        else { await navigator.clipboard.writeText(`${text} ${link}`); toast('Mensagem e link copiados.'); }
        btn.textContent = 'Enviado ✓'; btn.classList.remove('primary');
      } catch (e) { if (e?.name !== 'AbortError') toast('Não foi possível abrir o compartilhamento.'); }
    };
    const btn = h('button.btn.sm.primary', { type: 'button', onclick: send }, 'Enviar');
    return h('div.split-row', h('span', h('b', name), h('small', money(shares[k + 1]))), btn);
  });
  openSheet({
    title: 'Mande a parte de cada um', subtitle: `${d} · ${money(t)} entre ${n}. Quando alguém pagar, marque como recebido no Extrato.`,
    content: h('div.split-list', rows, ctx.demo ? h('p.muted.sm', 'Na demonstração os links funcionam, mas nada fica salvo.') : null)
  });
}

/* ---------------- página pública (quem recebe o link) ---------------- */
export function renderSplitPublic(root, data, { onTry, onOpen }) {
  const pixBtn = data.p ? h('button.btn.primary.block', { type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(data.p); pixBtn.textContent = 'Chave Pix copiada ✓'; } catch { toast('Copie a chave manualmente: ' + data.p); } } }, 'Copiar chave Pix') : null;
  root.replaceChildren(h('div.split-public',
    h('div.split-ticket',
      h('p.split-kicker', `${data.to ? data.to + ', ' + (data.f || 'alguém') : (data.f || 'Alguém')} te enviou uma cobrança de ${money(data.s)} pelo Bivvo`),
      h('h1', data.d),
      h('p.split-meta', `${money(data.t)} entre ${data.n} pessoas${data.dt ? ' · ' + shortDate(data.dt) : ''}`),
      h('div.split-share', h('small', 'Sua parte'), h('strong', money(data.s))),
      data.p ? h('p.split-pix', h('small', 'Chave Pix'), h('code', data.p)) : null,
      pixBtn),
    h('div.split-cta', h('img', { src: 'icon-192.png', alt: '', width: 32, height: 32 }), h('p', 'Organize seu dinheiro sem planilhas.'),
      h('button.link.sm', { type: 'button', onclick: onTry }, 'Conhecer o Bivvo'), h('button.link.sm.muted-link', { type: 'button', onclick: onOpen }, 'Já uso'))));
}
