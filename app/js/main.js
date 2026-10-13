/* Bivvo — entrada do app: autenticação, roteamento, ciclo de vida. */
import { h, $, $$, clear, VERSION, today, debounce } from './util.js';
import * as store from './store.js';
import * as cloud from './cloud.js';
import { toast, openSheet, askSheet, closeAllSheets } from './ui.js';
import { buildDemo } from './demo.js';
import { settleChallenges } from './insights.js';
import { renderHome } from './views/home.js';
import { renderExtrato } from './views/extrato.js';
import { renderCards } from './views/cards.js';
import { renderPlans } from './views/plans.js';
import { renderYou } from './views/you.js';
import { renderLearning } from './views/learning.js';
import { renderAdmin } from './views/admin.js?v=8.19.3';
import { adminMe } from './admin-api.js';
import { adminTrack, trackVisit, trackSignupStart, startPresenceTracking } from './admin-analytics.js?v=11.74.0';
import { renderCalendar } from './views/calendar.js';
import { renderForecast } from './views/forecast.js';
import { renderAssistant } from './views/assistant.js?v=11.84.0';
import { renderFamily, openCoupleQuickAdd } from './views/family.js';
import { renderLoans } from './views/loans.js?v=11.42.6';
import { renderRecovery } from './views/recovery.js';
import { openQuickAdd, openTxForm } from './views/forms.js';
import { startOnboarding } from './views/onboarding.js';
import { celebrateChallenge } from './views/stories.js';
import { ctx, setHooks } from './nav.js';
import { initPlatform, openInstallGuide, scheduleInstallOffer } from './platform.js';
import { openSmartCapture, shouldOfferEveningCapture, markEveningCaptureShown } from './quickcapture.js?v=11.47.0';
import { syncDigest } from './push.js';
import { refreshPlan,canUseFeature,onPlanChange,getPlanLimits } from './plans.js';
import {reconcileFreeCardGrace} from './card-retention.js';
import {financeProfileBar} from './views/finance-profiles.js';
import { companyPageTutor } from './views/company-education.js';
import { profilePageTutor } from './views/life-education.js';
import { track, trackOnce } from './analytics.js';
import { maybeActivateReferral } from './referral.js';
import { readSplitFromHash, renderSplitPublic } from './views/split.js';
import { markRetentionMilestones, maybeOfferMonthlyReport, markSmartReturn, maybeOfferSmartReturn } from './retention.js';
import { initErrorTracking } from './telemetry.js';
import { bindPublicTools } from './public-tools.js';
initErrorTracking();

const ROUTES = {
  inicio: { title: 'Início', render: renderHome },
  extrato: { title: 'Movimentações', render: renderExtrato },
  cartoes: { title: 'Cartões', render: renderCards },
  calendario: { title: 'Calendário', render: renderCalendar },
  previsao: { title: 'Previsão', render: renderForecast },
  assistente: { title: 'Bivvo IA', render: renderAssistant },
  familia: { title: 'Família', render: renderFamily },
  emprestimos: { title: 'Bivvo Capital', render: renderLoans },
  jornada: { title: 'Minha Jornada', render: renderRecovery },
  planos: { title: 'Planejamento', render: renderPlans },
  voce: { title: 'Você', render: renderYou },
  aprender: { title: 'Órbita de aprendizado', render: renderLearning },
  admin: { title: 'Administração', render: renderAdmin }
};

const TAB_NAV = {
  personal: () => [
    { key: 'inicio', route: 'inicio', label: 'Início', iconClass: 'ico ico-home' },
    { key: 'extrato', route: 'extrato', label: 'Movimentos', iconClass: 'ico ico-list' },
    store.loansEnabled()
      ? { key: 'emprestimos', route: 'emprestimos', label: 'Capital', emoji: '◈' }
      : { key: 'calendario', route: 'calendario', label: 'Calendário', emoji: '📅' },
    { key: 'cartoes', route: 'cartoes', label: 'Cartões', iconClass: 'ico ico-card' },
    { key: 'planos', route: 'planos', label: 'Planejamento', iconClass: 'ico ico-plan' }
  ],
  couple: () => [
    { key: 'resumo', route: 'familia', params: { couple: '1' }, label: 'Casal', emoji: '💑' },
    { key: 'gastos', route: 'familia', params: { couple: '1', tab: 'gastos' }, label: 'Gastos', emoji: '🏠' },
    { key: 'divisao', route: 'familia', params: { couple: '1', tab: 'divisao' }, label: 'Divisão', emoji: '⚖️' },
    { key: 'agenda', route: 'familia', params: { couple: '1', tab: 'agenda' }, label: 'Agenda', emoji: '📅' },
    { key: 'voce', route: 'voce', params: { finance: 'couple' }, label: 'Você', iconClass: 'ico ico-me' }
  ],
  company: () => [
    { key: 'inicio', route: 'inicio', label: 'Empresa', emoji: '🏢' },
    { key: 'extrato', route: 'extrato', label: 'Caixa', emoji: '↕' },
    { key: 'calendario', route: 'calendario', label: 'Agenda', emoji: '📅' },
    { key: 'cartoes', route: 'cartoes', label: 'Cartões', iconClass: 'ico ico-card' },
    { key: 'planos', route: 'planos', label: 'Gestão', emoji: '📊' }
  ]
};
let booted = false;
let startupCaptureShown = false;
let startupCaptureTimer = null;
let splitView = false;
trackVisit();
startPresenceTracking();
window.__bivvoStoreOnboarded = () => !!store.getState().profile.onboarded;

/* ---------------- roteamento ---------------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const name = ROUTES[path] ? path : 'inicio';
  const params = Object.fromEntries(new URLSearchParams(query));
  return { name, params };
}
function go(route, params = {}) {
  const q = new URLSearchParams(params).toString();
  const target = '#/' + route + (q ? '?' + q : '');
  const nav = () => { if (location.hash === target) render(true); else location.hash = target; };
  if (document.querySelector('.sheet-wrap')) { closeAllSheets(); setTimeout(nav, 120); } else nav();
}
window.addEventListener('hashchange', () => { if (splitView) return; closeAllSheets(); render(true); });

const view = () => $('#view');
let lastRoute = null;
let lastFinanceMode = 'personal';
function render(routeChanged = false) {
  if (!booted) return;
  const { name, params } = parseHash();
  if(name==='emprestimos'&&!store.loansEnabled()){go('inicio');return;}
  ctx.route = name; ctx.params = params;
  const el = view();
  const keepScroll = !routeChanged && lastRoute === name ? window.scrollY : 0;
  const r = ROUTES[name];
  clear(el);
  el.dataset.route = name;
  const addButton = document.querySelector('.fab-add');

  const coupleContext = name === 'familia' && params.couple === '1';
  const financeMode = coupleContext ? 'couple' : (['voce','aprender'].includes(name) && (params.finance === 'couple' || lastFinanceMode === 'couple') ? 'couple' : store.activeFinanceProfile());
  if(addButton)addButton.hidden=['voce','aprender'].includes(name)||(name==='inicio'&&financeMode==='personal');
  document.body.dataset.financeProfile = financeMode;
  el.dataset.financeProfile = financeMode;
  const profileContext = financeProfileBar();
  if (profileContext && !['voce','aprender'].includes(name)) el.append(profileContext);
  try { r.render(el, ctx); }
  catch (e) { console.error(e); el.append(h('div.empty', h('b', 'Esta tela encontrou um erro.'), h('p', 'Seus dados estão seguros. Recarregue a página para tentar de novo.'))); }
  if(!['voce','aprender'].includes(name)&&financeMode==='company'){const tutor=companyPageTutor(name);if(tutor){if(profileContext)profileContext.after(tutor);else el.prepend(tutor);}}
  else if(!['inicio','voce','aprender'].includes(name)&&(financeMode==='personal'||financeMode==='couple')){const tutor=profilePageTutor(financeMode,name,params);if(tutor){if(profileContext)profileContext.after(tutor);else el.prepend(tutor);}}
  const companyTitles={inicio:'Empresa',extrato:'Fluxo de caixa',cartoes:'Cartões empresariais',calendario:'Agenda financeira',previsao:'Previsão de caixa',planos:'Gestão da empresa',voce:'Você'};
  const coupleTitles={resumo:'Casal',gastos:'Gastos do casal',divisao:'Divisão do casal',agenda:'Agenda do casal'};
  const coupleTab = ['gastos','divisao','agenda'].includes(params.tab) ? params.tab : 'resumo';
  const routeTitle = coupleContext ? (coupleTitles[coupleTab]||'Casal') : (financeMode==='company'?(companyTitles[name]||r.title):r.title);
  $('#tbTitle').textContent = routeTitle;
  document.title = routeTitle + (financeMode === 'company' ? ' · Empresa' : financeMode === 'couple' ? ' · Casal' : '') + ' · Bivvo';
  lastFinanceMode = financeMode;
  syncNav();
  $$('[data-route]').forEach(b => { const on = b.dataset.route === name || (!!b.closest('.tabbar') && b.dataset.route==='planos' && (name==='previsao'||(name==='calendario'&&store.loansEnabled()))); b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (routeChanged) { window.scrollTo(0, 0); el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
  else if (keepScroll) window.scrollTo(0, keepScroll);
  lastRoute = name;
  if (!ctx.demo) adminTrack('page_view', name).catch(() => {});
  if (name === 'inicio' && params.shared === '1') {
    history.replaceState(history.state, '', '#/inicio'); ctx.params = {}; startupCaptureShown = true;
    caches.open('bivvo-share').then(async c => { const r = await c.match('./__shared-receipt'); await c.delete('./__shared-receipt'); if (!r || Number(r.headers.get('X-Bivvo-Expires') || 0) < Date.now()) return; track('share_target_used'); const { startScan } = await import('./quickcapture.js'); startScan(await r.blob()); }).catch(() => {});
  }
  if (name === 'inicio' && params.simular === '1') { history.replaceState(history.state, '', '#/inicio'); ctx.params = {}; startupCaptureShown = true; import('./views/simulator.js').then(m => setTimeout(() => m.openSimulator(), 200)); }
  if (name === 'inicio' && params.capture === '1') { history.replaceState(history.state, '', '#/inicio'); ctx.params = {}; startupCaptureShown = true; setTimeout(() => openSmartCapture(), 200); }
}
const rerender = debounce(() => render(false), 16);

function syncNav() {
  const financeMode=document.body.dataset.financeProfile||store.activeFinanceProfile();
  const company=financeMode==='company';
  const couple=financeMode==='couple';
  const loans = store.loansEnabled()&&!company&&!couple;
  document.body.classList.toggle('mod-loans', loans);
  $$('.rail [data-route="emprestimos"]').forEach(b => { b.hidden = !loans; });

  const labels=company
    ?{inicio:'Empresa',extrato:'Caixa',cartoes:'Cartões',calendario:'Agenda',planos:'Gestão',voce:'Você'}
    :couple
      ?{inicio:'Pessoal',extrato:'Movimentações',cartoes:'Cartões',calendario:'Calendário',planos:'Planejamento',voce:'Você'}
      :{inicio:'Início',extrato:'Movimentações',cartoes:'Cartões',calendario:'Calendário',planos:'Planejamento',voce:'Você'};
  for(const [route,label] of Object.entries(labels)){
    $$('.rail [data-route="'+route+'"]').forEach(b=>{const text=[...b.childNodes].find(n=>n.nodeType===3&&n.nodeValue.trim());if(text)text.nodeValue='\n      '+label+'\n    ';});
  }
  const add=$('.rail-add'); if(add)add.textContent=company?'Adicionar na empresa':couple?'Adicionar no casal':'Adicionar';

  const tabbar=$('.tabbar');
  if(tabbar){
    tabbar.dataset.profileNav=financeMode;
    const items=(TAB_NAV[financeMode]||TAB_NAV.personal)();
    const coupleTab=['gastos','divisao','agenda'].includes(ctx.params?.tab)?ctx.params.tab:'resumo';
    $$('.tabbar [data-tab-slot]').forEach((b,i)=>{
      const item=items[i];
      if(!item){b.hidden=true;delete b.__bivvoNavTarget;return;}
      b.hidden=false;b.__bivvoNavTarget=item;
      const icon=b.querySelector('.tab-icon'),label=b.querySelector('.tab-label');
      if(label)label.textContent=item.label;
      if(icon){
        icon.className='tab-icon '+(item.iconClass||'tab-emoji');
        icon.textContent=item.emoji||'';
      }
      let on=false;
      if(financeMode==='couple'){
        on=item.key==='voce' ? ctx.route==='voce' : (ctx.route==='familia'&&coupleTab===item.key);
      }else{
        on=ctx.route===item.route || (item.route==='planos'&&ctx.route==='previsao');
        if(item.route==='planos'&&ctx.route==='calendario'&&loans)on=true;
      }
      b.classList.toggle('on',on);
      if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
      b.setAttribute('aria-label',item.label);
    });
  }
}
const pushDigestSoon = debounce(() => { syncDigest(); }, 5000);

store.onChange(({ reason }) => {
  if (!booted) return;
  if (reason !== 'load' && reason !== 'settle') {
    const fresh = store.commit(s => settleChallenges(s), { reason: 'settle', silent: true });
    if (fresh?.length) setTimeout(() => celebrateChallenge(fresh[0]), 400);
  }
  rerender();
  if (!ctx.demo) { pushDigestSoon(); referralSoon(); }
});
const referralSoon = debounce(() => { maybeActivateReferral(); }, 8000);

onPlanChange(() => {
  if (!booted || ctx.demo) return;
  // Em plano pago, limpa imediatamente qualquer tolerância antiga. No Grátis,
  // a exclusão é reconciliada no perfil pessoal (Empresa é um ambiente separado).
  if (getPlanLimits().cards !== 1 || store.activeFinanceProfile() === 'personal') {
    const r = reconcileFreeCardGrace({ silent: true });
    if (r?.deleted) toast(`${r.deleted} cartão${r.deleted===1?'':'ões'} excedente${r.deleted===1?'':'s'} removido${r.deleted===1?'':'s'} após os 15 dias. As compras continuam no extrato.`);
  }
});

/* ---------------- shell ---------------- */
function bindShell() {
  $$('[data-route]').forEach(b => b.addEventListener('click', () => go(b.dataset.route)));
  $$('.tabbar [data-tab-slot]').forEach(b => b.addEventListener('click', () => { const t=b.__bivvoNavTarget; if(t)go(t.route,t.params||{}); }));
  $$('[data-action="add"]').forEach(b => b.addEventListener('click', () => {
    if((document.body.dataset.financeProfile||'personal')==='couple')openCoupleQuickAdd();
    else openQuickAdd();
  }));
  $('#demoSignup')?.addEventListener('click', () => leaveDemo(true));
  cloud.onSyncStatus(st => {
    const d = $('#syncDot'); if (!d) return;
    d.dataset.state = st;
    d.title = { saving: 'Salvando…', pending: 'Alterações pendentes', saved: 'Tudo salvo na nuvem', error: 'Não foi possível salvar. Tentaremos de novo.', offline: 'Sem internet. Salvaremos quando voltar.', idle: '' }[st] || '';
    d.setAttribute('aria-label', d.title);
    const status=$('#syncStatus');
    if(status){status.textContent=!navigator.onLine?'Sem conexão · dados locais disponíveis':ctx.demo?'Demonstração · dados locais':{saving:'Sincronizando…',pending:'Salvo no aparelho · sincronização pendente',saved:'Salvo na nuvem',error:'Salvo no aparelho · não foi possível sincronizar',offline:'Sem conexão · salvo no aparelho',idle:ctx.demo?'Demonstração · dados locais':''}[st]||'';status.dataset.state=st;}
  });
  const syncOnOpen = async () => {
    if (!booted || ctx.demo || !cloud.currentUser()) return;
    const r = await cloud.syncNow();
    if (r?.changed) toast('Dados sincronizados com a nuvem.');
  };
  window.addEventListener('online',()=>{const status=$('#syncStatus');if(status){status.textContent=ctx.demo?'Demonstração · dados locais':cloud.currentUser()?'Conexão restabelecida · sincronizando…':'';status.dataset.state='pending';}syncOnOpen();});
  window.addEventListener('offline',()=>{const status=$('#syncStatus');if(status){status.textContent='Sem conexão · dados locais disponíveis';status.dataset.state='offline';}});
  window.addEventListener('pageshow', () => { syncOnOpen(); });
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') { cloud.flush().catch(() => {}); if (!ctx.demo) syncDigest(); }
    else { await syncOnOpen(); }
  });
  window.addEventListener('pagehide', () => { cloud.flush().catch(() => {}); });
  window.addEventListener('bivvo:remote-reset', () => toast('Os dados foram zerados em outro aparelho.'));
  document.addEventListener('keydown', e => {
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !/input|textarea|select/i.test(document.activeElement?.tagName || '') && !document.body.classList.contains('sheet-open') && booted) { e.preventDefault(); openQuickAdd(); }
  });
}

function setAdminNavVisible(visible) {
  const desktop = $('#adminNav');
  const mobile = $('#adminNavMobile');
  const tabbar = document.querySelector('.tabbar');
  if (desktop) desktop.hidden = !visible;
  if (mobile) mobile.hidden = !visible;
  if (tabbar) tabbar.classList.toggle('admin-enabled', visible);
}

function showAuth({ direct = false } = {}) {
  booted = false;
  setAdminNavVisible(false);
  document.body.classList.remove('booting', 'in-app', 'demo');
  $('#app').hidden = true; $('#landing').hidden = direct; $('#auth').hidden = !direct;
  closeAllSheets();
}
async function showApp({ demo = false } = {}) {
  $('#landing').hidden = true;
  ctx.demo = demo;
  document.body.classList.toggle('demo', demo);
  document.body.classList.remove('booting');
  document.body.classList.add('in-app');
  $('#auth').hidden = true; $('#app').hidden = false;
  $('#demoBar').hidden = !demo;
  setAdminNavVisible(false);
  booted = true;
  if (!location.hash) history.replaceState(history.state, '', '#/inicio');
  store.commit(s => settleChallenges(s), { reason: 'settle', silent: true });
  render(true);
  if (!demo) {
    refreshPlan().then(()=>{if(store.activeFinanceProfile()==='company'&&!canUseFeature('company'))store.switchFinanceProfile('personal');const r=reconcileFreeCardGrace({silent:true});if(r?.deleted)toast(`${r.deleted} cartão${r.deleted===1?'':'ões'} excedente${r.deleted===1?'':'s'} removido${r.deleted===1?'':'s'} após os 15 dias. As compras continuam no extrato.`);rerender();}).catch(() => {});
    trackOnce('app_open', 'day');
    maybeOfferSmartReturn();
    markSmartReturn();
    markRetentionMilestones(cloud.currentUser());
    setTimeout(() => maybeOfferMonthlyReport(), 1200);
    adminMe()
      .then(() => setAdminNavVisible(true))
      .catch(() => setAdminNavVisible(false));
  }
  clearTimeout(startupCaptureTimer);
  if (!startupCaptureShown && shouldOfferEveningCapture({ demo })) {
    startupCaptureShown = true;
    startupCaptureTimer = setTimeout(() => {
      if (!booted || document.querySelector('.sheet-wrap') || !shouldOfferEveningCapture({ demo: ctx.demo })) return;
      markEveningCaptureShown();
      openSmartCapture({ startup: true, onDisable: () => { store.commit(s => { s.profile.eveningCapture = false; }); toast('Pronto. Você pode religar em Você → Avisos e lembretes.'); } });
    }, 900);
  }
  if (ctx.params.add === 'expense') setTimeout(() => openTxForm({ mode: 'expense' }), 300);
  if (!demo && !store.getState().profile.onboarded && !store.getState().profile.onboardingDeferred) setTimeout(() => startOnboarding({ onDemo: enterDemo }), 300);
  if (!demo) {
    scheduleInstallOffer({ isNewUser: sessionStorage.getItem('bivvo_just_signed_up') === '1' });
    // Se a pessoa veio de um CTA de plano na home, abre a grade de planos assim que
    // qualquer onboarding/modal anterior terminar. O plano selecionado fica destacado.
    let pending=''; try { pending=sessionStorage.getItem('bivvo_pending_plan')||''; } catch {}
    if(pending && pending!=='free'){
      const showPendingPlan=async()=>{
        if(!booted||ctx.demo)return;
        if(document.querySelector('.sheet-wrap')){setTimeout(showPendingPlan,900);return;}
        try { sessionStorage.removeItem('bivvo_pending_plan'); } catch {}
        const {openProScreen}=await import('./views/pro.js');
        openProScreen({source:pending});
      };
      setTimeout(showPendingPlan,1100);
    } else if(pending==='free') { try { sessionStorage.removeItem('bivvo_pending_plan'); } catch {} }
  }
}

/* ---------------- demo ---------------- */
function enterDemo() {
  closeAllSheets();
  store.load(buildDemo(), { demo: true });
  showApp({ demo: true });
  toast('Você está na demonstração. Nada aqui é salvo.');
}
async function leaveDemo(toSignup) {
  store.load(store.emptyState(), { demo: true });
  ctx.demo = false;
  if (cloud.currentUser()) { await bootUser(cloud.currentUser()); return; }
  showAuth({ direct: true });
  if (toSignup) setAuthMode('signup');
}

/* ---------------- sessão real ---------------- */
async function bootUser(user) {
  document.body.classList.add('booting');
  const cache = store.readSessionCache(user.id);
  if (cache) { store.load(cache, { userId: user.id }); showApp(); }
  try {
    const remote = await cloud.loadRemote();
    store.load(remote || store.emptyState(), { userId: user.id });
    if (!remote) { try { sessionStorage.setItem('bivvo_just_signed_up','1'); } catch {} await cloud.push({ force: true }).catch(() => {}); trackOnce('signup'); adminTrack('signup_completed', 'signup').catch(() => {}); }
    if (!cache) showApp(); else render(false);
  } catch (e) {
    console.error(e);
    if (!cache) { store.load(store.emptyState(), { userId: user.id }); showApp(); }
    toast('Não foi possível carregar da nuvem agora. Suas próximas alterações serão salvas quando a conexão voltar.', { tone: 'warn' });
  }
  cloud.securityLog('login');
}

/* ---------------- tela de entrada ---------------- */
let authMode = 'login';
function setAuthMode(mode) {
  authMode = mode;
  if (mode === 'signup') trackSignupStart();
  const f = $('#authForm');
  f.dataset.mode = mode;
  $$('.auth-tab').forEach(t => t.classList.toggle('on', t.dataset.mode === mode));
  $('#authSubmit').textContent = mode === 'signup' ? 'Criar minha conta' : mode === 'forgot' ? 'Enviar link de recuperação' : 'Entrar';
  $('#authPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
  $('#authPassword').required = mode !== 'forgot';
  $('#authConfirm').required = mode === 'signup';
  $('#authName').required = false;
  $('#authPhone').required = false;
  authMsg('');
}
function authMsg(text, tone = 'err') { const m = $('#authMsg'); m.textContent = text; m.dataset.tone = text ? tone : ''; }
const askMfa = () => askSheet({ title: 'Verificação em duas etapas', message: 'Digite o código de 6 dígitos do seu aplicativo autenticador.', label: 'Código', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: '000000', pattern: /^\d{6}$/, confirmLabel: 'Verificar' });

function initLandingExperiment(){
  // Uma mensagem de educação prática; a variante identifica a nova experiência.
  const variant='orbit-v1';
  document.documentElement.dataset.abLandingHero=variant;
  adminTrack('ab_exposure','landing',{content:'landing_hero:'+variant}).catch(()=>{});
  return variant;
}
function bindAuth() {
  const landingVariant=initLandingExperiment();
  $('#landingDemo')?.addEventListener('click', () => { adminTrack('landing_demo_clicked', 'landing').catch(() => {}); enterDemo(); });
  $('#landingOrbitDemo')?.addEventListener('click',async()=>{
    adminTrack('landing_demo_clicked','landing',{content:'orbit'}).catch(()=>{});enterDemo();
    const {chooseLearningGoal}=await import('./learning.js');let intent='expenses';try{intent=sessionStorage.getItem('bivvo_learning_intent_v1')||'expenses';}catch{}
    if(['expenses','cards','debt','reserve'].includes(intent))chooseLearningGoal(intent,'personal');go('aprender');
  });
  $('#landingLogin')?.addEventListener('click', () => showAuth({ direct: true }));
  const startFree = () => { adminTrack('ab_conversion','landing',{content:'landing_hero:'+landingVariant}).catch(() => {}); adminTrack('landing_signup_clicked', 'landing').catch(() => {}); showAuth({ direct: true }); setAuthMode('signup'); };
  $('#landingStart')?.addEventListener('click', startFree);
  $('#landingStartHero')?.addEventListener('click', startFree);
  $('#landingStartBottom')?.addEventListener('click', startFree);
  $$('.landing-nav-link[data-scroll]').forEach(btn => btn.addEventListener('click', () => {
    const target=document.getElementById(btn.dataset.scroll);const details=target?.closest('details');if(details)details.open=true;target?.scrollIntoView({ behavior:'smooth', block:'start' });
  }));
  $$('[data-plan-cta]').forEach(btn => btn.addEventListener('click', () => {
    const plan=btn.dataset.planCta||'free';
    try { sessionStorage.setItem('bivvo_pending_plan',plan); } catch {}
    track('plan_selected',{plan,source:'landing',interval:'monthly'});
    adminTrack('landing_plan_clicked','landing',{content:plan}).catch(()=>{});
    startFree();
  }));
  $('#landingHow')?.addEventListener('click', () => { adminTrack('landing_how_clicked', 'landing').catch(() => {}); $('#landingLearning')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $$('.auth-tab').forEach(t => t.addEventListener('click', () => setAuthMode(t.dataset.mode)));
  $('#authForgot').addEventListener('click', () => setAuthMode('forgot'));
  $('#authDemo').addEventListener('click', enterDemo);
  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#authEmail').value.trim();
    const pass = $('#authPassword').value;
    const conf = $('#authConfirm').value;
    const name = $('#authName').value.trim();
    const phone = $('#authPhone').value.trim();
    const btn = $('#authSubmit');

    if (!email) return authMsg('Informe seu e-mail.');
    if (authMode === 'signup' && phone && phone.replace(/\D/g, '').length < 10) return authMsg('Informe um telefone/WhatsApp válido.');
    if (authMode !== 'forgot' && pass.length < 10) return authMsg('A senha precisa ter pelo menos 10 caracteres.');
    if (authMode === 'signup' && pass !== conf) return authMsg('As senhas não são iguais.');

    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Aguarde…'; authMsg('');
    try {
      if (authMode === 'forgot') { await cloud.sendRecovery(email); authMsg('Se existir uma conta com esse e-mail, você vai receber um link para criar uma nova senha.', 'ok'); }
      else if (authMode === 'signup') {
        const data = await cloud.signUp(email, pass, name, phone);

        // TikTok Pixel: registra Lead somente após um cadastro realmente aceito pelo Supabase.
        // Não envia e-mail, telefone, nome, external_id nem dados financeiros.
        // Em projetos com confirmação de e-mail, tentativas com e-mail já existente podem
        // retornar um usuário sem identities; por isso esse caso não conta como conversão.
        const isNewRegistration = !!data?.user && (!Array.isArray(data.user.identities) || data.user.identities.length > 0);
        if(isNewRegistration){try{window.bivvoGoogleAds?.registration(data.user.id);}catch{/* Medição nunca impede o cadastro. */}}
        if (isNewRegistration && window.bivvoPrivacy?.marketingAllowed()) {
          // Um único event_id é compartilhado entre Pixel e Events API para deduplicação.
          // O user_id serve apenas para o servidor confirmar que o cadastro acabou de existir;
          // ele NÃO é enviado ao TikTok.
          const eventId = 'bivvo_lead_' + (crypto.randomUUID?.() || (Date.now() + '_' + Math.random().toString(36).slice(2)));
          if (window.ttq?.track) {
            try { window.ttq.track('Lead', {}, { event_id: eventId }); } catch {}
          }
          try {
            const qs = new URLSearchParams(location.search);
            const ttclid = qs.get('ttclid') || '';
            if (data.session?.access_token) fetch('/api/tiktok-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization:'Bearer ' + data.session.access_token },
              body: JSON.stringify({ user_id: data.user.id, event_id: eventId, url: location.origin + location.pathname, ttclid, consent:true }),
              keepalive: true
            }).catch(() => {});
          } catch {}
        }

        if (data.session) await cloud.openCurrentSession();
        else authMsg('Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.', 'ok');
      } else {
        await cloud.signIn(email, pass, askMfa);
        await cloud.openCurrentSession();
      }
    } catch (err) { authMsg(cloud.friendlyAuthError(err)); }
    finally { btn.disabled = false; btn.textContent = label; }
  });
}

function recoveryFlow() {
  const pass = h('input.input', { type: 'password', autocomplete: 'new-password', minLength: 10, placeholder: 'Mínimo 10 caracteres' });
  const pass2 = h('input.input', { type: 'password', autocomplete: 'new-password', minLength: 10, placeholder: 'Repita a senha' });
  const msg = h('p.form-msg');
  const sheet = openSheet({
    title: 'Criar nova senha',
    content: [h('label.field', h('span', 'Nova senha'), pass), h('label.field', h('span', 'Confirmar senha'), pass2), msg],
    footer: [h('button.btn.primary', { type: 'button', onclick: async () => {
      if (pass.value.length < 10) { msg.textContent = 'Use pelo menos 10 caracteres.'; return; }
      if (pass.value !== pass2.value) { msg.textContent = 'As senhas não são iguais.'; return; }
      try { await cloud.setNewPassword(pass.value); sheet.close(); toast('Senha atualizada.'); await cloud.openCurrentSession(); }
      catch (e) { msg.textContent = cloud.friendlyAuthError(e); }
    } }, 'Salvar nova senha')]
  });
}

/* ---------------- início ---------------- */
function captureReferral() {
  try {
    const ref = new URLSearchParams(location.search).get('ref');
    if (ref && /^[a-f0-9]{8}$/.test(ref)) { localStorage.setItem('bivvo_ref', ref); const cleaned=new URL(location.href);cleaned.searchParams.delete('ref');history.replaceState(null, '', cleaned.pathname+cleaned.search+cleaned.hash); setAuthMode('signup'); }
  } catch { /* ignore */ }
}

setHooks({ go, enterDemo, leaveDemo, render });

function purgeLegacyStorage() {
  try {
    for (const k of Object.keys(localStorage)) if (/^(mf_|bivvo_demo|bivvo_welcome|bivvo_v7|v724)/i.test(k)) localStorage.removeItem(k);
    for (const k of Object.keys(sessionStorage)) if (/^mf_/.test(k)) sessionStorage.removeItem(k);
  } catch { /* modo privado */ }
}


async function registerServiceWorker() {
  // No app Android empacotado com Capacitor o Service Worker da PWA não é necessário.
  // Evita cache duplicado e falhas de instalação dentro da WebView nativa.
  if (window.Capacitor?.isNativePlatform?.()) return;
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    // Força a conferência do sw.js depois de um deploy; evita PWA preso em versão antiga.
    reg.update().catch(() => {});
  } catch { /* app continua funcionando sem PWA */ }
}

async function start() {
  purgeLegacyStorage(); initPlatform();
  if ('caches' in window) caches.open('bivvo-share').then(async c => { const r=await c.match('./__shared-receipt'); if(r && Number(r.headers.get('X-Bivvo-Expires') || 0)<Date.now()) await c.delete('./__shared-receipt'); }).catch(()=>{});
  $('#appVersion') && ($('#appVersion').textContent = 'v' + VERSION);
  bindShell(); bindAuth(); bindPublicTools(); setAuthMode('login'); captureReferral();
  if (new URLSearchParams(location.search).get('signup') === '1') { showAuth({ direct: true }); setAuthMode('signup'); }
  const split = readSplitFromHash();
  if (split) {
    splitView = true;
    document.body.classList.remove('booting'); document.body.classList.add('split-mode');
    const el = $('#splitPage'); el.hidden = false; $('#landing').hidden = true;
    const leave = () => { splitView = false; el.hidden = true; document.body.classList.remove('split-mode'); history.replaceState(null, '', location.pathname); };
    renderSplitPublic(el, split, {
      onTry: () => { leave(); enterDemo(); },
      onOpen: () => { leave(); location.reload(); }
    });
    registerServiceWorker();
    return;
  }
  if (new URLSearchParams(location.search).get('demo') === '1') { enterDemo(); }
  try {
    await cloud.initAuth({
      onSignedIn: user => { if (ctx.demo) { ctx.demo = false; } bootUser(user); },
      onSignedOut: () => { if (!ctx.demo) { store.load(store.emptyState(), { demo: true }); showAuth({direct:new URLSearchParams(location.search).get('signup')==='1'}); } },
      onRecovery: recoveryFlow
    });
  } catch (e) {
    if (!ctx.demo) showAuth({direct:new URLSearchParams(location.search).get('signup')==='1'});
    authMsg(cloud.friendlyAuthError(e));
  }
  registerServiceWorker();
}
start();
