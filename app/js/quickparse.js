/* Bivvo 10.4 — interpretador da captura rápida.
   Puro (sem DOM, sem estado global) para poder ser testado isoladamente.
   Entende: "mercado 1.250,00", "presente 2.500", "gasolina 200 dia 3", "tv 3x 900",
   "tv 10x de 90", "farmácia 45 ontem", "uber 18 sexta", "+ salario 2200", "ifood 32 nubank". */

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const pad = n => String(n).padStart(2, '0');
const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (date, n) => { const d = parseISO(date); d.setDate(d.getDate() + n); return isoOf(d); };
const dim = (y, m) => new Date(y, m, 0).getDate();

/* "1.250,00" → 1250 · "2.500" → 2500 · "12,50" → 12.5 · "12.50" → 12.5 · "1250" → 1250 */
export function toNumber(txt) {
  let t = String(txt || '').trim();
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d+,\d{1,2}$/.test(t)) t = t.replace(',', '.');
  else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(t)) t = t.replace(/,/g, '');
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

const NUM = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2}|\d+\.\d{1,2}(?!\d)|\d+`;
const WEEKDAYS = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
const INCOME_WORDS = /^(recebi|recebido|entrada|salario|freela|freelance|venda|vendi|reembolso|ganhei|pix recebido|rendimento|comissao)\b/;
const CREDIT_WORDS = /(?:^|\s)(no\s+)?(credito|cartao)(?=\s|$)/;
const EDGE_FILLER = /^(?:de|do|da|em|no|na|num|numa|nuns|com|pro|pra|para|o|a|e|um|uma|r\$)\s+|\s+(?:de|do|da|em|no|na|num|numa|com|pro|pra|para|o|a|e|r\$)$/i;

/* ---------- fala: números por extenso → dígitos ("mil e duzentos" → 1200, "seis vezes" → 6 vezes) ---------- */
const UNITS = { zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900 };
export function wordsToNumbers(text) {
  const words = String(text || '').split(/\s+/);
  const out = [];
  let i = 0;
  while (i < words.length) {
    const w = norm(words[i]);
    if (UNITS[w] == null && w !== 'mil') { out.push(words[i]); i++; continue; }
    /* lê uma sequência numérica: [N] [mil] [e] [N] ... */
    let total = 0, group = 0, j = i, used = false, last = Infinity;
    /* só junta "e" quando a ordem de grandeza desce: "trinta e dois" = 32, mas "trinta e dois e cinquenta" = 32 e 50 */
    const place = v => v >= 100 ? 100 : v >= 20 ? 10 : 1;
    while (j < words.length) {
      const x = norm(words[j]);
      if (UNITS[x] != null) { const v = UNITS[x]; if (used && place(v) >= last) break; group += v; last = v >= 10 && v < 20 ? 1 : place(v); used = true; j++; }
      else if (x === 'mil') { total += (group || 1) * 1000; group = 0; last = 1000; used = true; j++; }
      else if (x === 'e' && j + 1 < words.length && UNITS[norm(words[j + 1])] != null && used && place(UNITS[norm(words[j + 1])]) < last) { j++; }
      else break;
    }
    total += group;
    /* "um/uma" sozinho é artigo ("uma pizza"), não número */
    if (j === i + 1 && /^(um|uma)$/.test(w)) { out.push(words[i]); i++; continue; }
    out.push(String(total)); i = j;
  }
  /* "87 reais e 50 centavos" → "87,50 reais" */
  return out.join(' ').replace(/(\d+)\s+reais\s+e\s+(\d{1,2})\s+centavos?/gi, (_, a, b) => `${a},${b.padStart(2, '0')} reais`).replace(/(\d+)\s+e\s+(\d{1,2})(?=\s|$)/g, (m, a, b) => Number(a) >= 1 && b.length === 2 ? `${a},${b}` : m);
}
const METHOD_WORDS = [[/(?:^|\s)(?:no|pelo|via|por)?\s*pix(?=\s|$)/i, 'PIX'], [/(?:^|\s)(?:no|pelo)?\s*d[eé]bito(?=\s|$)/i, 'Débito'], [/(?:^|\s)(?:em|no)?\s*dinheiro(?=\s|$)/i, 'Dinheiro']];
const LEAD_VERBS = /^(?:eu\s+)?(?:gastei|paguei|comprei|foi|deu|torrei)(?:\s+|$)/i;

/* Remove o trecho [start, end) de um texto mantendo o restante legível. */
const cut = (txt, start, end) => (txt.slice(0, start) + ' ' + txt.slice(end)).replace(/\s+/g, ' ').trim();

export function parseQuick(text, { cards = [], autoCategory = () => '', now, spoken = false } = {}) {
  const t0 = now || isoOf(new Date());
  let raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (spoken) raw = wordsToNumbers(raw).replace(/[.!?]+$/, '');
  if (!raw) return { error: 'Digite o que foi e o valor. Ex.: mercado 45' };

  let type = 'expense';
  if (/^\+/.test(raw)) { type = 'income'; raw = raw.replace(/^\+\s*/, ''); }
  else if (/^-\s*/.test(raw)) raw = raw.replace(/^-\s*/, '');

  let work = raw;
  let date = t0, dateHint = '';

  /* ---------- datas ---------- */
  const rel = [[/(?:^|\s)(anteontem)(?=\s|$)/i, -2, 'Anteontem'], [/(?:^|\s)(ontem)(?=\s|$)/i, -1, 'Ontem'], [/(?:^|\s)(hoje)(?=\s|$)/i, 0, ''], [/(?:^|\s)(amanh[ãa])(?=\s|$)/i, 1, 'Amanhã']];
  for (const [re, n, label] of rel) {
    const m = work.match(re);
    if (m) { date = addDays(t0, n); dateHint = label; work = cut(work, m.index, m.index + m[0].length); break; }
  }
  if (!dateHint) {
    const m = work.match(/(?:^|\s)(?:dia\s+)(\d{1,2})(?:\/(\d{1,2})(?:\/(\d{2,4}))?)?(?=\s|$)/i)
      || work.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$)/);
    if (m) {
      const [y0, m0, d0] = t0.split('-').map(Number);
      const day = Number(m[1]);
      let month = m[2] ? Number(m[2]) : m0, year = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : y0;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        let cand = `${year}-${pad(month)}-${pad(Math.min(day, dim(year, month)))}`;
        /* sem mês: "dia 15" no futuro deste mês = mês passado (quem anota rápido está lembrando de algo que já foi) */
        if (!m[2] && cand > t0) { const pm = m0 === 1 ? 12 : m0 - 1, py = m0 === 1 ? y0 - 1 : y0; cand = `${py}-${pad(pm)}-${pad(Math.min(day, dim(py, pm)))}`; }
        else if (m[2] && !m[3] && cand > addDays(t0, 31)) cand = `${year - 1}-${pad(month)}-${pad(Math.min(day, dim(year - 1, month)))}`;
        if (day <= 31) { date = cand; dateHint = 'set'; }
      }
      /* o trecho de data sai da frase mesmo se for inválido, para nunca virar valor */
      work = cut(work, m.index, m.index + m[0].length);
    }
  }
  if (!dateHint) {
    const nw = norm(work);
    for (const [w, dow] of Object.entries(WEEKDAYS)) {
      const re = new RegExp(`(?:^|\\s)(?:na\\s+|no\\s+)?${w}(?:-feira)?(?=\\s|$)`);
      const m = nw.match(re);
      if (m) {
        const cur = parseISO(t0).getDay();
        date = addDays(t0, -((cur - dow + 7) % 7));
        dateHint = 'set';
        /* norm() preserva o comprimento para letras acentuadas compostas? Não sempre — recorta pelo texto normalizado. */
        const words = work.split(' '), nwords = nw.split(' ');
        const idx = nwords.findIndex(x => x === w || x === w + '-feira');
        if (idx >= 0) { const drop = new Set([idx]); if (idx > 0 && /^(na|no)$/.test(nwords[idx - 1])) drop.add(idx - 1); work = words.filter((_, k) => !drop.has(k)).join(' '); }
        break;
      }
    }
  }

  /* ---------- parcelas: "3x", "em 3x", "3 vezes", "10x de 90" ---------- */
  let parts = 1, perPart = null;
  {
    const re = new RegExp(String.raw`(?:^|\s)(?:parcelad[oa]\s+)?(?:em\s+)?(\d{1,2})\s*(?:x|vezes)(?:\s+de\s+(?:r\$\s*)?(${NUM}))?(?=\s|$)`, 'i');
    const m = work.match(re);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= 48) {
      parts = Number(m[1]);
      if (m[2]) perPart = toNumber(m[2]);
      work = cut(work, m.index, m.index + m[0].length);
    }
  }

  /* ---------- valor: prefere o número com "cara de dinheiro"; empate → o último ---------- */
  let value = 0;
  if (perPart) value = Math.round(perPart * parts * 100) / 100;
  else {
    const re = new RegExp(String.raw`(r\$\s*)?(?<![\p{L}\d.,])(${NUM})(\s*(?:k|mil)(?![\p{L}]))?(?![\p{L}\d])(\s*(?:reais|real|conto|contos|pila)(?![\p{L}]))?`, 'giu');
    const cands = [...work.matchAll(re)].map(m => {
      let v = toNumber(m[2]);
      if (m[3]) v *= 1000;
      const explicit = !!(m[1] || m[3] || m[4] || /[.,]/.test(m[2]));
      return { v, explicit, start: m.index, end: m.index + m[0].length };
    }).filter(c => c.v > 0);
    if (!cands.length) return { error: 'Inclua o valor. Ex.: mercado 45' };
    const pool = cands.some(c => c.explicit) ? cands.filter(c => c.explicit) : cands;
    const pick = pool[pool.length - 1];
    value = Math.round(pick.v * 100) / 100;
    work = cut(work, pick.start, pick.end);
  }
  if (!(value > 0)) return { error: 'Informe um valor maior que zero.' };
  if (value > 9999999) return { error: 'Esse valor parece grande demais. Confira os números.' };

  /* ---------- cartão ---------- */
  let card = null, creditWord = false;
  for (const c of cards) {
    const key = norm(c.name);
    if (!key) continue;
    const nwords = norm(work).split(' '), words = work.split(' ');
    const kw = key.split(' ');
    for (let i = 0; i + kw.length <= nwords.length; i++) {
      if (kw.every((k, j) => nwords[i + j] === k)) {
        card = c;
        const drop = new Set(kw.map((_, j) => i + j));
        if (i > 0 && /^(no|na|pelo|pela|cartao)$/.test(nwords[i - 1])) drop.add(i - 1);
        work = words.filter((_, k) => !drop.has(k)).join(' ');
        break;
      }
    }
    if (card) break;
  }
  {
    const m = norm(work).match(CREDIT_WORDS);
    if (m) { creditWord = true; const words = work.split(' '); const nwords = norm(work).split(' '); work = words.filter((_, k) => !/^(credito|cartao)$/.test(nwords[k]) && !(nwords[k] === 'no' && /^(credito|cartao)$/.test(nwords[k + 1] || ''))).join(' '); }
  }

  /* ---------- forma de pagamento falada/escrita ---------- */
  let method = null;
  for (const [re, m] of METHOD_WORDS) { const mm = work.match(re); if (mm) { method = m; work = cut(work, mm.index, mm.index + mm[0].length); break; } }

  /* ---------- tipo e descrição ---------- */
  let desc = work.replace(/r\$/ig, ' ').replace(/\s+/g, ' ').trim().replace(LEAD_VERBS, '');
  for (let k = 0; k < 4; k++) desc = desc.replace(EDGE_FILLER, '').trim();
  if (type === 'expense' && INCOME_WORDS.test(norm(desc))) type = 'income';
  if (type === 'income') { card = null; creditWord = false; parts = 1; }
  if (!desc) desc = type === 'income' ? 'Entrada' : 'Compra';
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);

  const wantsCard = type === 'expense' && (card || creditWord || parts > 1);
  if (wantsCard && !card && cards.length) card = cards[0];
  const cat = autoCategory(desc, type) || 'Outros';
  return {
    value, desc, type, cat, date, parts: card ? parts : 1, method: wantsCard && card ? 'Crédito' : (method || null),
    card: wantsCard ? card : null,
    needsCard: wantsCard && !cards.length,
    future: date > t0,
    cardGuessed: wantsCard && !!card && !cards.some(c => norm(raw).includes(norm(c.name)))
  };
}
