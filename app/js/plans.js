/* Bivvo 11.49 — catálogo de planos, permissões e níveis de inteligência da IA.
   Os planos especializados (Casal, Empreendedor e Capital) não formam uma escada simples.
   Por isso o acesso é decidido por recurso, e não por "plano maior/menor". */
import * as cloud from './cloud.js';
import {setPaidAccess} from './paid-access.js';

export const BILLING_LIVE = true;

export const PRICES = {
  plus: { monthly: 19.90, annual: 199.00 },
  capital: { monthly: 24.90, annual: 249.00 },
  pro: { monthly: 29.90, annual: 299.00 },
  couple: { monthly: 29.90, annual: 299.00 },
  entrepreneur: { monthly: 34.90, annual: 349.00 },
  family: { monthly: 49.99, annual: 499.00 }
};

export const PLAN_NAMES = {
  free: 'Bivvo Grátis',
  plus: 'Bivvo Plus',
  pro: 'Bivvo Pro',
  couple: 'Bivvo Casal',
  capital: 'Bivvo Capital',
  entrepreneur: 'Bivvo Empreendedor',
  family: 'Bivvo Família'
};

export const PLAN_LIMITS = {
  free: { cards: 1, scansPerMonth: 5, quickCapturePerMonth: 10, aiPerMonth: 0, aiTier: 0 },
  plus: { cards: Infinity, scansPerMonth: 30, quickCapturePerMonth: Infinity, aiPerMonth: 30, aiTier: 1 },
  capital: { cards: Infinity, scansPerMonth: 60, quickCapturePerMonth: Infinity, aiPerMonth: 60, aiTier: 2 },
  pro: { cards: Infinity, scansPerMonth: 200, quickCapturePerMonth: Infinity, aiPerMonth: 300, aiTier: 3 },
  couple: { cards: Infinity, scansPerMonth: 200, quickCapturePerMonth: Infinity, aiPerMonth: 300, aiTier: 3 },
  entrepreneur: { cards: Infinity, scansPerMonth: 300, quickCapturePerMonth: Infinity, aiPerMonth: 500, aiTier: 4 },
  family: { cards: Infinity, scansPerMonth: 500, quickCapturePerMonth: Infinity, aiPerMonth: 800, aiTier: 5 }
};

export const AI_LEVELS = {
  0: { label:'Sem IA', short:'Perguntas rápidas locais' },
  1: { label:'IA Essencial', short:'Análises completas, claras e práticas' },
  2: { label:'IA Contextual', short:'Análise completa com causas, consequências e próximos passos' },
  3: { label:'IA Avançada', short:'Análise aprofundada com cenários e trade-offs' },
  4: { label:'IA Especialista', short:'Análise especialista, causa-raiz e estratégia' },
  5: { label:'IA Máxima', short:'Profundidade máxima, cenários e plano priorizado' }
};

const CORE_PLUS = ['unlimitedCards','assistant','forecast30','futureCards12','smartAlerts'];
const CORE_PRO = [...CORE_PLUS,'advancedForecast','advancedSimulator'];
export const PLAN_FEATURES = {
  free: [],
  plus: CORE_PLUS,
  pro: CORE_PRO,
  couple: [...CORE_PLUS,'couple'],
  capital: [...CORE_PLUS,'loans'],
  entrepreneur: [...CORE_PRO,'company'],
  family: [...CORE_PRO,'couple','family','company','loans']
};

/* Usado apenas para escolher um nome principal quando existem duas concessões ativas
   ao mesmo tempo (ex.: assinatura + teste promocional). As permissões são a união. */
const PRIORITY = { free:0, plus:10, capital:20, couple:30, pro:40, entrepreneur:50, family:60 };
const KNOWN = new Set(Object.keys(PLAN_NAMES));
const TEST_PLAN_SOURCE='owner_test_plan';
const PERMANENT_CAPITAL_SOURCE='owner_permanent_capital';
let permanentGrantChecked=false;
const testPlanFromRow=r=>{
  const source=String(r?.source||'');
  if(source===TEST_PLAN_SOURCE && KNOWN.has(String(r?.plan||'')))return String(r.plan);
  if(source.startsWith(TEST_PLAN_SOURCE+'_')){const plan=source.slice((TEST_PLAN_SOURCE+'_').length);if(KNOWN.has(plan)&&plan!=='free')return plan;}
  return null;
};

export const PLAN_CATALOG = [
  { key:'plus', icon:'✦', audience:'Para organizar melhor o dia a dia', title:'Plus', short:'Mais controle no financeiro pessoal.', bullets:['IA Essencial completa · 30 perguntas/mês','30 leituras de comprovante/mês','Cartões ilimitados','Previsão de 30 dias','Parcelas futuras em até 12 meses'] },
  { key:'capital', icon:'◈', audience:'Para quem empresta dinheiro', title:'Capital', short:'Gestão de empréstimos particulares e recebimentos.', bullets:['IA Contextual completa · 60 perguntas/mês','60 leituras de comprovante/mês','Carteira de empréstimos','Principal, juros e vencimentos','Histórico e resumo para WhatsApp'] },
  { key:'pro', icon:'◆', audience:'Para quem quer análise mais profunda', title:'Pro', short:'O financeiro pessoal completo.', bullets:['IA Avançada completa · 300 perguntas/mês','200 leituras de comprovante/mês','Previsão de 90 dias','Compara cenários e trade-offs','Simulador avançado antes de comprar'] },
  { key:'couple', icon:'💑', audience:'Para duas pessoas', title:'Casal', short:'Organização compartilhada sem abrir a vida pessoal.', bullets:['IA Avançada completa · 300 perguntas/mês','200 leituras de comprovante/mês','Espaço financeiro a dois','Divisão 50/50 ou proporcional','Agenda e categorias do casal'] },
  { key:'entrepreneur', icon:'🏢', audience:'Para quem administra um negócio', title:'Empreendedor', short:'PF e empresa separados no mesmo Bivvo.', bullets:['IA Especialista completa · 500 perguntas/mês','300 leituras de comprovante/mês','Ambiente Empresa separado','Fluxo de caixa, resultado e margem','Custos, impostos e contas a receber/pagar'] },
  { key:'family', icon:'⌂', audience:'Para a casa toda', title:'Família', short:'O pacote mais completo do Bivvo.', bullets:['IA Máxima completa · 800 perguntas/mês','500 leituras de comprovante/mês','Tudo do Pro','Inclui Casal + Empresa + Capital','Espaço Família para até 4 pessoas'] }
];

let current = { plan:'free', plans:['free'], source:'default', expiresAt:null, lastPaidExpiresAt:null, usage:{} };
let loading = null;
const listeners = new Set();
export const onPlanChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };

async function ensurePermanentGrant(){
  if(permanentGrantChecked)return;
  permanentGrantChecked=true;
  try{
    const c=await cloud.sb();
    const {data}=await c.auth.getSession();
    const token=data?.session?.access_token;
    if(!token)return;
    const r=await fetch('/api/permanent-grant',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},cache:'no-store'});
    if(!r.ok) permanentGrantChecked=false;
  }catch{permanentGrantChecked=false;}
}

const normalizePlans = rows => {
  const active = [...new Set((rows || []).map(r=>String(r.plan||'')).filter(p=>KNOWN.has(p) && p!=='free'))];
  return active.length ? active : ['free'];
};
const bestPlan = plans => [...plans].sort((a,b)=>(PRIORITY[b]||0)-(PRIORITY[a]||0))[0] || 'free';
const unionLimit = (plans,key) => {
  let value=0;
  for(const p of plans){ const v=PLAN_LIMITS[p]?.[key] ?? 0; if(v===Infinity)return Infinity; value=Math.max(value,Number(v)||0); }
  return value;
};
const syncPaidAccess = () => setPaidAccess({
  paid: current.plans.some(p=>p!=='free'),
  loans: canUseFeature('loans'),
  company: canUseFeature('company'),
  couple: canUseFeature('couple'),
  family: canUseFeature('family')
});

export async function refreshPlan({ timeout = 4000 } = {}) {
  if (loading) return loading;
  loading = (async () => {
    const u = cloud.currentUser();
    if (!u) {
      current = { plan:'free', plans:['free'], source:'default', expiresAt:null, lastPaidExpiresAt:null, usage:{} };
      syncPaidAccess();
      return current;
    }
    try {
      const c = await cloud.sb();
      await ensurePermanentGrant();
      const ym = new Date().toISOString().slice(0, 7);
      const now = new Date().toISOString();
      const q = Promise.all([
        c.from('entitlements').select('plan,source,starts_at,expires_at').eq('user_id', u.id).order('expires_at', { ascending: false }).limit(50),
        c.from('usage_counters').select('feature,used').eq('user_id', u.id).eq('period', ym)
      ]);
      const [ent, use] = await Promise.race([q, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeout))]);
      const allRows=(ent.data||[]).filter(r=>KNOWN.has(r.plan));
      const nowMs=Date.parse(now);
      const rows=allRows.filter(r=>(!r.starts_at||Date.parse(r.starts_at)<=nowMs)&&Date.parse(r.expires_at)>nowMs);
      const testFree=rows.find(r=>r.source==='owner_test_free'), testPaid=rows.find(r=>testPlanFromRow(r));
      const simulated=testPaid?testPlanFromRow(testPaid):null;
      const effectiveRows=testFree?[]:(testPaid?[{...testPaid,plan:simulated}]:rows.filter(r=>!/^owner_test_/.test(String(r.source||''))).map(r=>r.source===PERMANENT_CAPITAL_SOURCE?{...r,plan:'capital'}:r));
      const plans=testFree?['free']:normalizePlans(effectiveRows), plan=bestPlan(plans), primary=testFree||effectiveRows.find(r=>r.plan===plan)||effectiveRows[0];
      const lastEnded=allRows.find(r=>!/^owner_test_/.test(String(r.source||''))&&Date.parse(r.expires_at)<=nowMs);
      current = { plan, plans, source:primary?.source||'default', expiresAt:primary?.expires_at||null, lastPaidExpiresAt:lastEnded?.expires_at||null, usage:Object.fromEntries((use.data||[]).map(r=>[r.feature,r.used])) };
    } catch { /* sem rede/tabelas: mantém o último estado conhecido */ }
    syncPaidAccess();
    listeners.forEach(fn => { try { fn(current); } catch { /* ignore */ } });
    return current;
  })().finally(() => { loading = null; });
  return loading;
}

export const getUserPlan = () => current.plan;
export const getActivePlans = () => [...current.plans];
export const getPlanInfo = () => ({ ...current, name: PLAN_NAMES[current.plan] || PLAN_NAMES.free });
export function getPlanLimits(plan = null) {
  const plans = plan ? [plan] : current.plans;
  return {
    cards: unionLimit(plans,'cards'),
    scansPerMonth: unionLimit(plans,'scansPerMonth'),
    quickCapturePerMonth: unionLimit(plans,'quickCapturePerMonth'),
    aiPerMonth: unionLimit(plans,'aiPerMonth'),
    aiTier: unionLimit(plans,'aiTier')
  };
}

export function getAiLevel(plan = null) {
  const limits = getPlanLimits(plan);
  const tier = Number(limits.aiTier || 0);
  return { tier, ...(AI_LEVELS[tier] || AI_LEVELS[0]) };
}

export function canUseFeature(feature, plan = null) {
  const plans = plan ? [plan] : current.plans;
  return plans.some(p => (PLAN_FEATURES[p] || []).includes(feature));
}
export function plansForFeature(feature){ return Object.keys(PLAN_FEATURES).filter(p=>p!=='free'&&(PLAN_FEATURES[p]||[]).includes(feature)); }

export function getRemainingUsage(feature) {
  const key = feature === 'scan' ? 'scansPerMonth' : feature === 'quick' || feature === 'quick_capture' ? 'quickCapturePerMonth' : 'aiPerMonth';
  const usageKey = feature === 'quick' ? 'quick_capture' : feature;
  const limit = getPlanLimits()[key];
  const used = Number(current.usage[usageKey] || 0);
  return { limit, used, remaining: limit === Infinity ? Infinity : Math.max(0, limit - used) };
}
export function setUsage(feature, used) { current.usage = { ...current.usage, [feature]: used }; listeners.forEach(fn => fn(current)); }
export function canAddCard(count) { if (!BILLING_LIVE) return true; return count < getPlanLimits().cards; }
