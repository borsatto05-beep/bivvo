/* Bivvo 8.18 — instalação PWA com o menor número possível de passos. */
import { h } from './util.js';
import { openSheet, toast } from './ui.js';
import { track } from './analytics.js';

let installPrompt = null;
let offerTimer = null;
const DISMISSED_KEY = 'bivvo_install_prompt_dismissed_at';
const OFFERED_KEY = 'bivvo_install_prompt_offered_v1';
const INSTALLED_KEY = 'bivvo_pwa_installed_v1';
const SESSION_KEY = 'bivvo_install_prompt_session_v1';
const COOLDOWN = 7 * 86400000;

const safeGet = (k, session=false) => { try { return (session ? sessionStorage : localStorage).getItem(k); } catch { return null; } };
const safeSet = (k, v, session=false) => { try { (session ? sessionStorage : localStorage).setItem(k, String(v)); } catch {} };
export function devicePlatform() {
  const ua = navigator.userAgent || '';
  const iOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /android/i.test(ua);
  return { iOS, android, desktop: !iOS && !android };
}
export function isPwaInstalled() {
  let nativeApp = false;
  try { nativeApp = !!(window.Capacitor?.isNativePlatform?.() || /^(capacitor|ionic):$/i.test(location.protocol)); } catch {}
  return !!(nativeApp || window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true || safeGet(INSTALLED_KEY) === '1');
}
const platformName = () => { const d=devicePlatform(); return d.iOS?'ios':d.android?'android':'desktop'; };
const analytics = (event, placement='post_signup', extra={}) => track(event, { placement, channel: platformName(), ...extra });

export function initPlatform() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    window.dispatchEvent(new Event('bivvo:installable'));
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    safeSet(INSTALLED_KEY, '1');
    analytics('pwa_installed', 'system');
    document.querySelector('.pwa-install-offer')?.closest('.sheet-wrap')?.querySelector('.sheet-close')?.click();
    window.dispatchEvent(new Event('bivvo:pwa-installed'));
    toast('Bivvo instalado ✓');
  });
}

async function runNativeInstall(placement='settings') {
  if (!installPrompt) return false;
  const p = installPrompt;
  installPrompt = null;
  analytics('pwa_install_clicked', placement, { result: 'native' });
  try {
    await p.prompt();
    const choice = await p.userChoice;
    if (choice?.outcome === 'accepted') analytics('pwa_install_prompt_accepted', placement);
    else {
      analytics('pwa_install_prompt_dismissed', placement);
      safeSet(DISMISSED_KEY, Date.now());
      safeSet(SESSION_KEY, '1', true);
    }
    return choice?.outcome === 'accepted';
  } catch {
    return false;
  }
}

function iosGuide(placement='settings') {
  analytics('pwa_install_clicked', placement, { result: 'ios' });
  analytics('pwa_ios_instructions_shown', placement);
  return openSheet({
    title: 'Instale o Bivvo no iPhone',
    content: h('div.install-guide.pwa-ios-guide',
      h('p.muted', 'São só estes passos:'),
      h('div.install-steps', h('span','1'),h('b','Toque em Compartilhar'),h('span','2'),h('b','Adicionar à Tela de Início'),h('span','3'),h('b','Adicionar')))
  });
}

function unsupportedGuide(placement='settings') {
  analytics('pwa_install_clicked', placement, { result: 'manual' });
  return openSheet({ title:'Instalar Bivvo', content:h('div.install-guide', h('p.muted','Seu navegador não liberou a instalação direta agora. Abra o menu do navegador e procure “Instalar app” ou “Adicionar à tela inicial”.')) });
}

/* Chamada manual: se o prompt nativo existe, abre direto — sem tela intermediária. */
export async function openInstallGuide(target='auto', placement='settings') {
  if (isPwaInstalled()) return toast('O Bivvo já está instalado neste aparelho.');
  const d=devicePlatform();
  if (target === 'ios' || (target === 'auto' && d.iOS)) return iosGuide(placement);
  if (installPrompt) return runNativeInstall(placement);
  if (d.iOS) return iosGuide(placement);
  return unsupportedGuide(placement);
}

function eligibleAutomaticOffer() {
  if (isPwaInstalled() || safeGet(SESSION_KEY, true)) return false;
  const dismissed=Number(safeGet(DISMISSED_KEY)||0);
  if (dismissed && Date.now()-dismissed < COOLDOWN) return false;
  return true;
}
function dismissAutomatic() {
  safeSet(DISMISSED_KEY, Date.now()); safeSet(SESSION_KEY, '1', true);
  analytics('pwa_install_dismissed', 'post_signup');
}

export function showInstallOffer({ isNewUser=false }={}) {
  if (!eligibleAutomaticOffer() || document.querySelector('.sheet-wrap')) return false;
  safeSet(OFFERED_KEY, '1'); safeSet(SESSION_KEY, '1', true);
  analytics('pwa_install_offer_shown', isNewUser?'post_signup':'retention_prompt', { result: isNewUser?'new':'existing' });
  const placement=isNewUser?'post_signup':'retention_prompt';
  const d=devicePlatform();
  const content=h('div.pwa-install-offer',
    h('div.install-icon','B'),
    h('h3','Tenha o Bivvo sempre com você'),
    h('p.muted','Instale o Bivvo no celular e acesse suas finanças como um aplicativo.'),
    h('div.pwa-install-benefits', h('span','✓ Acesso mais rápido'), h('span','✓ Abre em tela cheia'), h('span','✓ Bivvo direto na tela inicial')));
  let intentional=false;
  const install=h('button.btn.primary',{type:'button',autofocus:true,onclick:async()=>{
    intentional=true;
    if (d.iOS && !installPrompt) { sheet.close('install'); return iosGuide(placement); }
    if (installPrompt) { sheet.close('install'); return runNativeInstall(placement); }
    sheet.close('install'); return unsupportedGuide(placement);
  }},'Instalar Bivvo');
  const later=h('button.btn.ghost',{type:'button',onclick:()=>{ intentional=true; dismissAutomatic(); sheet.close('later'); }},'Agora não');
  const sheet=openSheet({title:'Instalar Bivvo',content,footer:[later,install],onClose:result=>{ if(!intentional && result!=='install') dismissAutomatic(); }});
  return true;
}

/* Novo usuário: logo após onboarding. Antigo nunca ofertado: atraso maior e sem interromper uma folha aberta. */
export function scheduleInstallOffer({ isNewUser=false }={}) {
  clearTimeout(offerTimer);
  if (!eligibleAutomaticOffer()) return;
  if (!isNewUser && safeGet(OFFERED_KEY)) return; // rollout respeitoso: antigos recebem uma primeira oferta, não repetição automática
  const started=Date.now(), firstDelay=isNewUser?2000:8000;
  const attempt=()=>{
    if (!eligibleAutomaticOffer()) return;
    const onboarded = (()=>{ try { return !!window.__bivvoStoreOnboarded?.(); } catch { return true; } })();
    if (document.querySelector('.sheet-wrap') || (isNewUser && !onboarded)) {
      if (Date.now()-started < 5*60*1000) offerTimer=setTimeout(attempt,1000);
      return;
    }
    showInstallOffer({isNewUser});
  };
  offerTimer=setTimeout(attempt, firstDelay);
}
