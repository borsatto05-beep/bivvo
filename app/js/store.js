/* Bivvo — estado único do app.
   - Formato compatível com o payload salvo pelas versões 9.x em finance_data.payload.
   - Migração idempotente (schema 10) corrige parcelas antigas gravadas com o valor total.
   - Nenhum dado financeiro vai para localStorage. sessionStorage guarda só um cache da sessão. */
import {hasPaidAccess} from './paid-access.js';
import { uid, num, round2, today, addMonthsDate, addMonthsYM, ymOf, dateInYM, splitInstallments, pad } from './util.js';

export const SCHEMA = 11;
export const EXPENSE_CATS = ['Moradia', 'Mercado', 'Alimentação', 'Delivery', 'Restaurantes', 'Transporte', 'Combustível', 'Estacionamento e pedágio', 'Energia', 'Água', 'Gás', 'Internet', 'Telefone', 'Saúde', 'Academia', 'Educação', 'Lazer', 'Assinaturas', 'Streaming', 'Compras', 'Roupas', 'Beleza', 'Higiene e cuidados pessoais', 'Casa e manutenção', 'Eletrônicos', 'Seguros', 'Serviços', 'Trabalho', 'Presentes e doações', 'Dívidas e empréstimos', 'Impostos e taxas', 'Pets', 'Filhos', 'Viagens', 'Investimentos', 'Reserva de Emergência', 'Outros'];
export const INCOME_CATS = ['Salário', 'Vale/Benefício', 'Freelance', 'Comissão', 'Venda', 'Reembolso', 'Rendimentos', 'Presente', 'Juros / Empréstimo', 'Outros'];
/* O ambiente Empresa usa categorias próprias. Evita misturar despesas domésticas
   com custos, receitas e obrigações do negócio. */
export const COMPANY_EXPENSE_CATS = ['Mercadorias / estoque', 'Matéria-prima', 'Fornecedores', 'Embalagens', 'Comissões de vendas', 'Folha de pagamento', 'Pró-labore', 'Encargos trabalhistas', 'Impostos e tributos', 'Aluguel comercial', 'Energia e água', 'Internet e telefone', 'Marketing e anúncios', 'Fretes e entregas', 'Combustível e frota', 'Manutenção', 'Softwares e sistemas', 'Taxas bancárias', 'Taxas de cartão / marketplace', 'Contabilidade', 'Serviços terceirizados', 'Equipamentos', 'Seguros empresariais', 'Viagens e representação', 'Dívidas e financiamentos', 'Investimentos na empresa', 'Retirada dos sócios', 'Outras despesas'];
export const COMPANY_INCOME_CATS = ['Vendas de produtos', 'Prestação de serviços', 'Recebimentos de clientes', 'Contratos / mensalidades', 'Comissões', 'Marketplace', 'Juros e rendimentos', 'Aporte dos sócios', 'Empréstimo empresarial', 'Reembolso', 'Outras receitas'];
export const METHODS = ['PIX', 'Débito', 'Crédito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro'];
export const CARD_TINTS = ['plum', 'graphite', 'rose', 'pearl', 'wine'];
const ARRAYS = ['transactions', 'fixed', 'cards', 'installments', 'investments', 'goals', 'subscriptions', 'challenges', 'loans', 'loanPayments', 'loanCycles', 'companyProducts'];

export function emptyState(profile) {
  return {
    schema: SCHEMA,
    transactions: [], fixed: [], cards: [], installments: [], investments: [], goals: [], subscriptions: [], loans: [], loanPayments: [], loanCycles: [], companyProducts: [],
    deletedRecords: {}, generatedRecurring: [], categoryRules: {}, customCategories: [], categoryIcons: {}, budget_limits: {},
    savingPlan: { percent: 10 }, emergencyPlan: { target: 0 }, cdiReference: 10.5,
    challenges: [],
    profile: profile ? { ...profile } : { onboarded: false, checkins: [], seenAchievements: [], invitesSent: 0 }
  };
}

/* ---------------------------------------------------------------- */
let state = emptyState();
let personalSnapshot=null;
let financialProfiles={};
let version = 0;
let demo = false;
const listeners = new Set();
let persistHook = null;
const deleted = new Set(); // ids excluídos nesta sessão (usado na mesclagem de conflitos)

export const getState = () => state;
export const getVersion = () => version;
export const isDemo = () => demo;
export const deletedIds = () => deleted;
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const setPersistHook = fn => { persistHook = fn; };

export function load(payload, opts = {}) {
  demo = !!opts.demo;
  const canonical=migrate(payload||{});
  financialProfiles=canonical.financialProfiles||{};delete canonical.financialProfiles;personalSnapshot=null;
  if(canonical.profile.activeFinanceProfile==='company'){personalSnapshot=canonical;state=migrate({...financialProfiles.company,profile:canonical.profile});}else state=canonical;
  deleted.clear();
  Object.keys(state.deletedRecords).forEach(id => deleted.add(id));
  generateRecurring(state);
  version++;
  if (!demo) saveSessionCache(opts.userId);
  listeners.forEach(fn => fn({ reason: 'load' }));
}

/* Toda mutação passa por aqui: um único render e uma única gravação. */
export function commit(mutator, { reason = 'edit', silent = false } = {}) {
  const before = new Set(ARRAYS.flatMap(k => state[k].map(x => x.id)).filter(Boolean));
  const r = mutator(state);
  const after = new Set(ARRAYS.flatMap(k => state[k].map(x => x.id)).filter(Boolean));
  const now = new Date().toISOString();
  for (const id of before) if (!after.has(id)) { state.deletedRecords[id] = now; deleted.add(id); }
  // Restoring an entry creates a new id; a deleted id is never reused.
  for (const k of ARRAYS) state[k] = state[k].filter(x => !state.deletedRecords[x.id]);
  normalizeLight(state);
  generateRecurring(state);
  version++;
  if (!demo) { saveSessionCache(); persistHook?.(); }
  if (!silent) listeners.forEach(fn => fn({ reason }));
  return r;
}
/* Módulo Empréstimos: opcional. Sem escolha salva, liga sozinho para quem já tem contratos. */
export const loansEnabled = (s = state) => (demo||hasPaidAccess('loans')) && (s.profile?.modules?.loans ?? ((s.loans || []).length > 0));
export const loanRecord = t => !!(t.loanId || t.loanPaymentId || t.isLoan || String(t.transactionRole||'').startsWith('loan_') || t.cat==='Juros / Empréstimo');
export const recordVisible = (t,s=state) => loansEnabled(s)||!loanRecord(t);
export function markDeleted(...ids) {
  const now = new Date().toISOString();
  ids.flat().forEach(id => { if (id) { deleted.add(id); state.deletedRecords[id] = now; } });
  if (!demo) { saveSessionCache(); persistHook?.(); }
}

/* Desfazer usa novos ids: não reativa um registro apagado em outro aparelho. */
export function restoreRecords(groups) {
  const ids = new Map(Object.values(groups).flat().filter(Boolean).map(x => [x.id,uid()]));
  commit(s => {
    for (const [k,rows] of Object.entries(groups)) {
      if (!ARRAYS.includes(k)) continue;
      for (const row of rows.filter(Boolean)) {
        const copy = {...row};
        for (const [key,value] of Object.entries(copy)) if (typeof value === 'string' && ids.has(value)) copy[key] = ids.get(value);
        s[k].push(copy);
      }
    }
  });
}

/* ---------- cache de sessão (não persiste após fechar o navegador) ---------- */
const CACHE_KEY = 'bivvo_v10_cache';
let cacheUser = null;
function saveSessionCache(userId) {
  if (userId) cacheUser = userId;
  if (!cacheUser) return;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ uid: cacheUser, payload: serialize() })); } catch { /* quota */ }
}
export function readSessionCache(userId) {
  try { const o = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null'); return o && o.uid === userId ? o.payload : null; } catch { return null; }
}
export function clearSessionCache() {
  cacheUser = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
    /* resíduos das versões 9.x */
    for (const k of Object.keys(sessionStorage)) if (/^mf_/.test(k)) sessionStorage.removeItem(k);
    for (const k of Object.keys(localStorage)) if (/^(mf_(?!notification)|bivvo_demo|bivvo_v7|v724)/i.test(k)) localStorage.removeItem(k);
  } catch { /* ignore */ }
}

export function activeFinanceProfile(){return state.profile.activeFinanceProfile==='company'?'company':'personal';}
export function switchFinanceProfile(next){
  if(!['personal','company'].includes(next))throw Error('Perfil inválido.');
  if(next==='company'&&!demo&&!hasPaidAccess('company'))throw Error('O perfil Empresa está disponível no Bivvo Empreendedor ou Família.');
  if(next===activeFinanceProfile())return;
  const canonical=serialize();canonical.profile.activeFinanceProfile=next;
  load(canonical,{demo,userId:cacheUser});
  if(!demo)persistHook?.();
}
export function serialize(){
  const clone=o=>JSON.parse(JSON.stringify(o));
  const canonical=clone(personalSnapshot||state),profiles=clone(financialProfiles);
  canonical.profile=clone(state.profile);
  if(personalSnapshot){const company=clone(state);delete company.profile;delete company.financialProfiles;profiles.company=company;}
  canonical.financialProfiles=profiles;
  return canonical;
}

/* ---------------------------------------------------------------- */
/* Migração / normalização                                          */
/* ---------------------------------------------------------------- */
const arr = v => Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : [];
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) ? String(d) : null;
const parsePart = v => { const m = String(v || '').trim().match(/^(\d{1,3})\s*\/\s*(\d{1,3})$/); return m && +m[2] >= 2 ? { k: +m[1], n: +m[2] } : null; };
const clampDay = v => Math.min(31, Math.max(1, Math.floor(num(v)) || 1));
const STATUS = new Set(['Pago', 'Pendente', 'Parcelado']);

export function migrate(input) {
  const o = obj(input);
  const s = emptyState(obj(o.profile).onboarded !== undefined ? { ...emptyState().profile, ...obj(o.profile) } : null);
  for (const k of ARRAYS) s[k] = arr(o[k]).map(x => ({ ...x }));
  s.deletedRecords = {};
  for (const [id, at] of Object.entries(obj(o.deletedRecords))) {
    if (id && typeof at === "string" && Number.isFinite(Date.parse(at))) s.deletedRecords[id] = at;
  }
  for (const k of ARRAYS) s[k] = s[k].filter(x => !s.deletedRecords[x.id]);
  s.generatedRecurring = Array.isArray(o.generatedRecurring) ? o.generatedRecurring.map(String) : [];
  s.categoryRules = obj(o.categoryRules);
  s.customCategories = (Array.isArray(o.customCategories) ? o.customCategories : []).map(x => String(x || '').trim()).filter(Boolean);
  s.categoryIcons = {};
  for (const [k, v] of Object.entries(obj(o.categoryIcons))) { const name = String(k || '').trim(); const icon = String(v || '').trim().slice(0, 12); if (name && icon) s.categoryIcons[name] = icon; }
  s.budget_limits = {};
  for (const [k, v] of Object.entries(obj(o.budget_limits))) if (num(v) > 0) s.budget_limits[k] = round2(v);
  s.savingPlan = { percent: Math.min(100, Math.max(0, num(obj(o.savingPlan).percent ?? 10))) };
  s.emergencyPlan = { target: Math.max(0, num(obj(o.emergencyPlan).target)) };
  s.cdiReference = num(o.cdiReference) > 0 ? num(o.cdiReference) : 10.5;
  if (o.resetAt) s.resetAt = String(o.resetAt);
  if (o.rev) s.rev = String(o.rev);
  s.profile = { onboarded: false, checkins: [], seenAchievements: [], invitesSent: 0, ...obj(o.profile) };
  if (!Array.isArray(s.profile.checkins)) s.profile.checkins = [];
  if (!Array.isArray(s.profile.seenAchievements)) s.profile.seenAchievements = [];
  /* Usuários das versões 9.x já tinham dados: não mostrar onboarding para eles. */
  if (o.profile === undefined && (s.transactions.length || s.cards.length || s.fixed.length)) s.profile.onboarded = true;
  /* 8.19.3: contas antigas já chegaram ao primeiro valor; o novo onboarding é só para novos usuários. */
  if (s.profile.activationValueSeen === undefined && s.profile.onboarded && (s.transactions.length || s.cards.length || s.fixed.length)) s.profile.activationValueSeen = true;
  if (s.profile.onboardingDeferred === undefined) s.profile.onboardingDeferred = false;

  normalizeLight(s);
  if (num(o.schema) < SCHEMA) fixLegacyInstallments(s);
  s.schema = SCHEMA;
  if(obj(o.financialProfiles).company){const company=migrate({...o.financialProfiles.company,financialProfiles:null});delete company.financialProfiles;delete company.profile;s.financialProfiles={company};}
  return s;
}

export function normalizeLight(s) {
  const t0 = today();
  /* cartões: nomes únicos (o vínculo das compras é pelo nome, como nas versões anteriores) */
  const names = new Set();
  s.cards = s.cards.map((c, i) => {
    let name = String(c.name || 'Cartão ' + (i + 1)).trim().slice(0, 40) || 'Cartão';
    while (names.has(name)) name += ' ·';
    names.add(name);
    return { ...c, id: c.id || uid(), name, limit: Math.max(0, round2(c.limit)), close: clampDay(c.close), due: clampDay(c.due), tint: c.tint || 'plum' };
  });
  s.transactions = s.transactions.map(t => {
    const rawType = String(t.type ?? t.kindType ?? '').toLowerCase();
    const type = rawType === 'income' || /^(entrada|receita)$/.test(rawType) ? 'income' : 'expense';
    let method = String(t.method ?? t.paymentMethod ?? t.formaPagamento ?? 'Outro').trim();
    if (/^pix$/i.test(method)) method = 'PIX';
    // Compatibilidade com compras cadastradas por versões antigas/importações.
    // Se existe vínculo explícito com cartão, ou a forma de pagamento era escrita
    // como "Cartão de crédito"/"Credito", normalize para o formato canônico.
    if (type === 'expense' && t.transactionRole !== 'card_payment' && (t.card || t.cardName || /cart[aã]o.*cr[eé]dito|^cr[eé]dito$/i.test(method))) method = 'Crédito';
    const legacyDate = t.date ?? t.purchaseDate ?? t.data;
    const legacyDesc = t.desc ?? t.description ?? t.name ?? t.descricao;
    const legacyCat = t.cat ?? t.category ?? t.categoria;
    const legacyValue = t.value ?? t.amount ?? t.valor;
    const x = { ...t, id: t.id || uid(), type, date: validDate(legacyDate) || t0, desc: String(legacyDesc ?? '').slice(0, 120) || (type === 'income' ? 'Entrada' : 'Gasto'),
      cat: String(legacyCat || 'Outros'), value: Math.max(0, round2(legacyValue)), status: STATUS.has(t.status) ? t.status : 'Pago', method };
    if (!x.card && t.cardName) x.card = String(t.cardName);
    if (!x.invoice && t.invoiceMonth) x.invoice = String(t.invoiceMonth);
    if (x.method !== 'Crédito' && x.transactionRole !== 'card_payment') delete x.invoice;
    if (x.loanPaymentId || x.transactionRole === 'loan_principal_return' || x.transactionRole === 'loan_interest_income') { delete x.locked; delete x.immutable; }
    return x;
  });
  s.fixed = s.fixed.map(f => ({ ...f, id: f.id || uid(), name: String(f.name || 'Conta').slice(0, 80), value: Math.max(0, round2(f.value)), due: clampDay(f.due),
    cat: String(f.cat || 'Outros'), rec: f.rec === 'Anual' ? 'Anual' : 'Mensal', type: f.type === 'income' ? 'income' : 'expense' }));
  s.goals = s.goals.map(g => ({ ...g, id: g.id || uid(), name: String(g.name || 'Meta').slice(0, 60), target: Math.max(0, round2(g.target)), saved: Math.max(0, round2(g.saved)),
    isReserve: g.isReserve ?? /reserva de emerg/i.test(String(g.name || '')) }));
  s.investments = s.investments.map(x => ({ ...x, id: x.id || uid(), value: round2(x.value ?? x.costBasis), type: String(x.type || 'Outros'), name: String(x.name || 'Investimento').slice(0, 60) }));
  s.installments = s.installments.map(x => ({ ...x, id: x.id || uid() }));
  s.challenges = s.challenges.map(c => ({ ...c, id: c.id || uid() }));
  s.loans = s.loans.map(x => ({ ...x, id: x.id || uid(), principalOriginal: Math.max(0, round2(x.principalOriginal ?? x.principal)), principal: Math.max(0, round2(x.principal)), interestRate: Math.max(0, num(x.interestRate)), interestFixed: Math.max(0, round2(x.interestFixed)), status: x.status || 'open' }));
  s.loanPayments = s.loanPayments.map(x => { const p={ ...x, id: x.id || uid(), amount: Math.max(0, round2(x.amount)), interest: Math.max(0, round2(x.interest)), principal: Math.max(0, round2(x.principal)), editable: true }; delete p.immutable; return p; });
  s.loanCycles = s.loanCycles.map(x => ({ ...x, id: x.id || uid(), interest: Math.max(0, round2(x.interest)) }));
  s.companyProducts = s.companyProducts.map(x => ({ ...x, id: x.id || uid(), name: String(x.name || 'Produto').slice(0, 80), kind: x.kind === 'service' ? 'service' : 'product', category: String(x.category || 'Geral').slice(0, 40), purchaseCost: Math.max(0, round2(x.purchaseCost)), freight: Math.max(0, round2(x.freight)), packaging: Math.max(0, round2(x.packaging)), otherDirect: Math.max(0, round2(x.otherDirect)), fixedAllocation: Math.max(0, round2(x.fixedAllocation)), salePrice: Math.max(0, round2(x.salePrice)), cardFeePct: Math.max(0, Math.min(100, num(x.cardFeePct))), taxPct: Math.max(0, Math.min(100, num(x.taxPct))), commissionPct: Math.max(0, Math.min(100, num(x.commissionPct))), targetMarginPct: Math.max(0, Math.min(90, num(x.targetMarginPct || 20))), soldQty: Math.max(0, num(x.soldQty)), stockQty: Math.max(0, num(x.stockQty)), minStock: Math.max(0, num(x.minStock)) }));
}

/* Corrige o bug histórico em que a parcela era gravada com o valor total da compra
   e recria parcelas que só existiam no registro "installments". */
function fixLegacyInstallments(s) {
  for (const inst of s.installments) {
    const parts = Math.floor(num(inst.parts)), total = round2(inst.total);
    if (parts < 2 || total <= 0) continue;
    const split = splitInstallments(total, parts);
    inst.partValue = split[0];
    for (let k = 1; k <= parts; k++) {
      const key = `${k}/${parts}`;
      let tx = s.transactions.find(t => t.installmentId === inst.id && String(t.installment) === key);
      if (!tx) tx = s.transactions.find(t => !t.installmentId && t.method === 'Crédito' && (t.card === inst.card || !t.card) && (t.desc === `${inst.name} (${key})` || (t.desc === inst.name && String(t.installment) === key)));
      if (tx) {
        tx.installmentId = inst.id;
        if (Math.abs(tx.value - total) < 0.01 || Math.abs(tx.value * 100 - Math.round(tx.value * 100)) > 1e-6) tx.value = split[k - 1];
        tx.purchaseTotal = total; tx.installmentTotal = parts;
      } else if (validDate(inst.date)) {
        s.transactions.push({ id: uid(), date: addMonthsDate(inst.date, k - 1), desc: `${inst.name} (${key})`, cat: inst.cat || 'Compras', type: 'expense', value: split[k - 1],
          status: 'Parcelado', method: 'Crédito', card: inst.card, installment: key, installmentId: inst.id, purchaseTotal: total, installmentTotal: parts, note: 'Compra parcelada' });
      }
    }
  }
  /* parcelas soltas com metadados de total, mas valor cheio */
  for (const t of s.transactions) {
    if (t.method !== 'Crédito') continue;
    const p = parsePart(t.installment), parts = num(t.installmentTotal || p?.n), total = num(t.purchaseTotal);
    if (parts >= 2 && total > 0 && Math.abs(t.value - total) < 0.01) t.value = splitInstallments(total, parts)[(p?.k || 1) - 1] ?? round2(total / parts);
  }
}

/* ---------- contas e receitas recorrentes ----------
   Gera o mês atual e o próximo. Uma chave gerada nunca é recriada:
   se o usuário apagar a ocorrência, ela não volta. */
export function generateRecurring(s) {
  if (!s.fixed.length) return false;
  const cur = ymOf(today()), months = [cur, addMonthsYM(cur, 1)];
  const keys = new Set(s.generatedRecurring);
  let changed = false;
  for (const f of s.fixed) {
    if (!(f.value > 0) || f.paused) continue;
    const startYM = f.startYM || cur;
    for (const ym of months) {
      if (ym < startYM) continue;
      if (f.rec === 'Anual') { const base = Number(f.month || f.startMonth || 0) || Number(String(startYM).slice(5)); if (Number(ym.slice(5)) !== base) continue; }
      const key = `fixed|${f.id}|${ym}`;
      if (keys.has(key)) continue;
      const exists = s.transactions.some(t => t.recurringKey === key || (t.fixedId === f.id && ymOf(t.date) === ym) ||
        (ymOf(t.date) === ym && t.desc === f.name && String(t.note || '').includes('Conta recorrente automática')));
      keys.add(key); changed = true;
      if (exists) continue;
      const paidNow = f.paidThroughYM && ym <= f.paidThroughYM;
      s.transactions.push({ id: uid(), date: dateInYM(ym, f.due), desc: f.name, cat: f.cat, type: f.type, value: f.value,
        status: paidNow ? 'Pago' : 'Pendente', method: f.method || (f.type === 'income' ? 'Transferência' : 'Boleto'),
        recurringKey: key, fixedId: f.id, note: f.type === 'income' ? 'Receita recorrente' : 'Conta recorrente automática' });
    }
  }
  if (changed) s.generatedRecurring = [...keys].slice(-600);
  return changed;
}

/* ---------- categorias ---------- */
export function categories(type = 'expense', s = state) {
  const company = activeFinanceProfile()==='company';
  const base = company
    ? (type === 'income' ? COMPANY_INCOME_CATS : COMPANY_EXPENSE_CATS)
    : (type === 'income' ? INCOME_CATS : EXPENSE_CATS);
  return [...new Set([...base, ...(type === 'expense' ? s.customCategories : [])])].filter(c=>loansEnabled(s)||c!=='Juros / Empréstimo');
}
export function autoCategory(desc, type = 'expense', s = state) {
  const raw = String(desc || '').toLowerCase().trim();
  if (!raw) return null;
  if (s.categoryRules[raw]) return s.categoryRules[raw];
  const company = activeFinanceProfile()==='company';
  const companyRules = type === 'income'
    ? [[/venda|pedido|produto|mercadoria/, 'Vendas de produtos'], [/servi[cç]o|projeto|consultoria|manuten[cç][aã]o/, 'Prestação de serviços'], [/cliente|recebimento|pix recebido|boleto recebido/, 'Recebimentos de clientes'], [/mensalidade|contrato|recorr[eê]ncia/, 'Contratos / mensalidades'], [/marketplace|mercado livre|shopee|amazon|ifood/, 'Marketplace'], [/comiss[aã]o/, 'Comissões'], [/aporte|capital social|s[oó]cio/, 'Aporte dos sócios'], [/empr[eé]stimo|capital de giro/, 'Empréstimo empresarial'], [/reembolso|estorno/, 'Reembolso'], [/juros|rendimento/, 'Juros e rendimentos']]
    : [[/fornecedor|distribuidor/, 'Fornecedores'], [/estoque|mercadoria|revenda/, 'Mercadorias / estoque'], [/mat[eé]ria.?prima|insumo/, 'Matéria-prima'], [/embalagem|sacola|caixa de envio/, 'Embalagens'], [/comiss[aã]o.*venda|comissionado/, 'Comissões de vendas'], [/sal[aá]rio|folha|funcion[aá]rio|colaborador/, 'Folha de pagamento'], [/pr[oó].?labore/, 'Pró-labore'], [/inss|fgts|encargo trabalhista/, 'Encargos trabalhistas'], [/das|darf|simples nacional|mei|iss|icms|pis|cofins|imposto|tributo/, 'Impostos e tributos'], [/aluguel|condom[ií]nio comercial/, 'Aluguel comercial'], [/luz|energia|[aá]gua|saneamento/, 'Energia e água'], [/internet|telefone|claro|vivo|tim|oi /, 'Internet e telefone'], [/meta ads|facebook ads|google ads|tiktok ads|tr[aá]fego|marketing|an[uú]ncio/, 'Marketing e anúncios'], [/frete|transportadora|correios|entrega/, 'Fretes e entregas'], [/posto|gasolina|etanol|diesel|combust|frota/, 'Combustível e frota'], [/software|sistema|saas|assinatura|hosting|hospedagem|dom[ií]nio|chatgpt/, 'Softwares e sistemas'], [/maquininha|adquirente|taxa.*cart[aã]o|marketplace/, 'Taxas de cartão / marketplace'], [/tarifa|taxa banc[aá]ria|ted|doc/, 'Taxas bancárias'], [/contador|contabilidade/, 'Contabilidade'], [/terceiriz|prestador/, 'Serviços terceirizados'], [/equipamento|computador|impressora|m[aá]quina|ferramenta/, 'Equipamentos'], [/seguro/, 'Seguros empresariais'], [/viagem|hotel|passagem|representa[cç][aã]o/, 'Viagens e representação'], [/financiamento|empr[eé]stimo|parcela banco/, 'Dívidas e financiamentos'], [/retirada.*s[oó]cio|distribui[cç][aã]o.*lucro/, 'Retirada dos sócios']];
  const rules = company ? companyRules : (type === 'income'
    ? [[/sal[aá]rio|folha|pagamento/, 'Salário'], [/freela|job|projeto/, 'Freelance'], [/reembolso|estorno/, 'Reembolso'], [/rendimento|dividendo|juros/, 'Rendimentos'], [/venda|vendi/, 'Venda'], [/vale|vr|va |benef/, 'Vale/Benefício']]
    : [[/ifood|rappi|delivery|ze delivery|z[eé] delivery|aiqfome|99food/, 'Delivery'], [/uber|99|taxi|t[aá]xi|metr[oô]|[oô]nibus|bilhete/, 'Transporte'],
      [/posto|gasolina|etanol|combust/, 'Combustível'], [/mercado|supermercado|assa[ií]|carrefour|atacad|hortifruti|feira|p[aã]o de a[cç]/, 'Mercado'],
      [/restaurante|lanche|padaria|caf[eé]|almo[cç]o|jantar|pizza|hamb/, 'Alimentação'], [/netflix|spotify|prime|disney|hbo|max|youtube|globoplay|deezer|icloud|chatgpt/, 'Assinaturas'],
      [/aluguel|condom[ií]nio|iptu/, 'Moradia'], [/luz|energia|enel|cemig|light|copel/, 'Energia'], [/[aá]gua|sabesp|saneamento/, 'Água'],
      [/internet|claro|vivo|tim|oi |net /, 'Internet'], [/farm[aá]cia|drogaria|m[eé]dico|consulta|exame|plano de sa[uú]de|dentista/, 'Saúde'],
      [/escola|faculdade|curso|livro|mensalidade/, 'Educação'], [/cinema|show|bar|balada|ingresso|jogo|steam|playstation/, 'Lazer'],
      [/shopee|amazon|mercado livre|shein|magalu|loja|compra/, 'Compras'], [/roupa|t[eê]nis|renner|riachuelo|c&a|zara/, 'Roupas'],
      [/pet|ra[cç][aã]o|veterin/, 'Pets'], [/passagem|hotel|airbnb|viagem|booking/, 'Viagens']]);
  for (const [re, cat] of rules) if (re.test(raw)) return cat;
  return null;
}

/* ---------- operações de domínio usadas por várias telas ---------- */
export function invoiceKeyFor(card, date) {
  const [y, m, d] = String(date).split('-').map(Number);
  const ym = `${y}-${pad(m)}`;
  return d > (card?.close || 1) ? addMonthsYM(ym, 1) : ym;
}
/* Cria a compra no crédito: 1x vira um lançamento; Nx vira N parcelas,
   cada uma na sua fatura. A fatura nunca recebe o valor total. */
export function addCardPurchase(s, { desc, cat, total, parts, card, date, note = '' }) {
  parts = Math.max(1, Math.min(48, Math.floor(parts) || 1));
  const c = s.cards.find(x => x.name === card) || s.cards[0];
  const firstInvoice = invoiceKeyFor(c, date);
  if (parts === 1) {
    const t = { id: uid(), date, desc, cat, type: 'expense', value: round2(total), status: 'Pendente', method: 'Crédito', card: c?.name || card, invoice: firstInvoice, note, createdAt: Date.now() };
    s.transactions.push(t);
    return [t];
  }
  const inst = { id: uid(), name: desc, card: c?.name || card, cat, total: round2(total), parts, partValue: splitInstallments(total, parts)[0], current: 1, date };
  s.installments.push(inst);
  const split = splitInstallments(total, parts), out = [];
  for (let k = 1; k <= parts; k++) {
    const t = { id: uid(), date: addMonthsDate(date, k - 1), desc: `${desc} (${k}/${parts})`, cat, type: 'expense', value: split[k - 1], status: 'Parcelado', method: 'Crédito',
      card: inst.card, installment: `${k}/${parts}`, installmentId: inst.id, purchaseTotal: inst.total, installmentTotal: parts, invoice: addMonthsYM(firstInvoice, k - 1), note: note || 'Compra parcelada', createdAt: Date.now() };
    s.transactions.push(t); out.push(t);
  }
  return out;
}
export function removeInstallmentGroup(s, instId) {
  const ids = s.transactions.filter(t => t.installmentId === instId).map(t => t.id);
  s.transactions = s.transactions.filter(t => t.installmentId !== instId);
  s.installments = s.installments.filter(i => i.id !== instId);
  return ids;
}
export function learnCategory(s, desc, cat) {
  const k = String(desc || '').toLowerCase().replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
  if (k && cat) s.categoryRules[k] = cat;
  const keys = Object.keys(s.categoryRules); if (keys.length > 400) delete s.categoryRules[keys[0]];
}
