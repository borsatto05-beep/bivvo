/* Bivvo 10.4 — avisos de verdade (Web Push).
   O celular recebe o aviso mesmo com o app fechado. Para isso o servidor precisa saber,
   de forma resumida, o que avisar: o "resumo de avisos" abaixo é calculado aqui e guardado
   na sua conta (tabela push_prefs, protegida por RLS). Valores só vão no aviso se você ativar. */
import { today, addDays } from './util.js';
import * as store from './store.js';
import * as F from './finance.js';
import * as cloud from './cloud.js';
import { loggedToday } from './quickcapture.js';
import { track } from './analytics.js';
import { recoverySnapshot } from './recovery.js';

const FLAG = 'bivvo_push';
const flagOn = () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } };
const setFlag = on => { try { on ? localStorage.setItem(FLAG, '1') : localStorage.removeItem(FLAG); } catch { /* ignore */ } };
const b64uToBytes = s => { const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
const bytesToB64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function pushSupport() {
  const native = !!window.Capacitor?.isNativePlatform?.();
  const ok = !native && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /android/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  return { ok, iOS, android, standalone, needsInstall: iOS && !standalone };
}
export const pushActive = () => flagOn() && 'Notification' in window && Notification.permission === 'granted';

async function registration() {
  if (window.Capacitor?.isNativePlatform?.()) throw new Error('Avisos nativos serão configurados na versão Android.');
  if (!('serviceWorker' in navigator)) throw new Error('Este navegador não aceita avisos.');
  let reg = await navigator.serviceWorker.getRegistration();
  if (!reg) reg = await navigator.serviceWorker.register('./sw.js');
  return Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('O app ainda está carregando. Tente de novo em alguns segundos.')), 8000))]);
}
async function publicKey() {
  const r = await fetch('/api/push-key', { cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.publicKey) throw new Error(j.error || 'Os avisos ainda não foram configurados no servidor.');
  return j.publicKey;
}

/* Liga os avisos neste aparelho. prefs: { hour, showValues } */
export async function enablePush(prefs) {
  const u = cloud.currentUser();
  if (!u) throw new Error('Entre na sua conta para ativar os avisos.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Os avisos não foram autorizados. Você pode liberar nas configurações do navegador.');
  const reg = await registration();
  const key = await publicKey();
  let sub = await reg.pushManager.getSubscription();
  if (sub && sub.options?.applicationServerKey && bytesToB64u(sub.options.applicationServerKey) !== key) { await sub.unsubscribe(); sub = null; }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(key) });
  const json = sub.toJSON();
  const c = await cloud.sb();
  const { error: e1 } = await c.from('push_subscriptions').upsert({ endpoint: json.endpoint, user_id: u.id, p256dh: json.keys.p256dh, auth: json.keys.auth, ua: navigator.userAgent.slice(0, 200) }, { onConflict: 'endpoint' });
  if (e1) throw new Error('Não foi possível registrar este aparelho. Rode o arquivo supabase-push.sql no Supabase.');
  setFlag(true);
  await savePrefs({ enabled: true, ...prefs }, true);
  track('push_enabled');
}
export async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { const c = await cloud.sb(); await c.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); }
  } finally { setFlag(false); }
}
export async function readPrefs() {
  const u = cloud.currentUser(); if (!u) return null;
  const c = await cloud.sb();
  const { data } = await c.from('push_prefs').select('enabled,hour,show_values').eq('user_id', u.id).maybeSingle();
  return data || null;
}
let lastDigest = '';
export async function savePrefs({ enabled, hour, showValues } = {}, withDigest = false) {
  const u = cloud.currentUser(); if (!u) return;
  const row = { user_id: u.id, tz_offset_min: -new Date().getTimezoneOffset(), updated_at: new Date().toISOString() };
  if (enabled != null) row.enabled = !!enabled;
  if (hour != null) row.hour = Math.max(0, Math.min(23, Number(hour) || 20));
  if (showValues != null) row.show_values = !!showValues;
  if (withDigest) Object.assign(row, digestRow());
  const c = await cloud.sb();
  const { error } = await c.from('push_prefs').upsert(row, { onConflict: 'user_id' });
  if (error) throw new Error('Não foi possível salvar as preferências de aviso.');
  if (withDigest) lastDigest = JSON.stringify(row.digest) + row.last_capture_date;
}

/* ---------- resumo usado pelo servidor ---------- */
function digestRow() {
  const s = store.getState(), t0 = today(), horizon = addDays(t0, 2);
  const sp = F.spendable(s);
  const fc30 = F.dailyForecast(30, s);
  let recovery = null;
  try { recovery = recoverySnapshot(s); } catch { /* versão antiga/estado incompleto: mantém digest clássico */ }
  const highCard = s.cards.map(c => ({ name:c.name, usage:F.cardStatus(c,s).usage })).sort((a,b)=>b.usage-a.usage)[0];
  const events = [];
  for (const c of s.cards) {
    const st = F.cardStatus(c, s);
    if (st.open.closeDate >= t0 && st.open.closeDate <= horizon && st.open.total > 0) events.push({ kind:'card_close', date: st.open.closeDate, text: `Fatura do ${c.name} fecha`, value: st.open.total, url:'./#/cartoes' });
    for (const inv of st.invoices) if (inv.unpaid > 0 && inv.dueDate >= t0 && inv.dueDate <= horizon) events.push({ kind:'card_due', date: inv.dueDate, text: `Fatura do ${c.name} vence`, value: inv.unpaid, url:'./#/cartoes' });
  }
  for (const t of s.transactions) if (t.type === 'expense' && t.method !== 'Crédito' && t.status !== 'Pago' && t.date >= t0 && t.date <= horizon) events.push({ kind:'bill_due', date: t.date, text: `${t.desc.replace(/\s*\(\d+\/\d+\)$/, '').slice(0, 40)} vence`, value: t.value, url:'./#/calendario' });
  events.sort((a, b) => a.date.localeCompare(b.date));
  const stage = recovery?.stage?.id || null;
  const priority = recovery?.priority || null;
  return {
    digest: {
      date: t0,
      perDay: sp.tone === 'neg' ? 0 : Math.round(sp.perDay),
      free: Math.round(recovery?.money?.free ?? sp.free ?? 0),
      protected: Math.round(recovery?.money?.protected ?? sp.commitments ?? 0),
      days: Math.max(1, Number(recovery?.money?.days ?? sp.days ?? 1)),
      tone: sp.tone,
      stage,
      stageLabel: recovery?.stage?.label || null,
      priorityId: priority?.id || null,
      priorityTitle: priority?.title || null,
      priorityDetail: priority?.detail || null,
      events: events.slice(0, 4).map(e => ({ ...e, value: Math.round(e.value) })),
      riskDate: fc30.risk?.date || null,
      highCardPct: highCard?.usage >= .8 ? Math.round(highCard.usage*100) : null
    },
    last_capture_date: loggedToday(s) ? t0 : null
  };
}
/* Chamado depois de cada alteração (com atraso). Só envia se algo mudou. */
export async function syncDigest() {
  if (!flagOn() || !cloud.currentUser() || store.isDemo()) return;
  const row = digestRow(), sig = JSON.stringify(row.digest) + row.last_capture_date;
  if (sig === lastDigest) return;
  try {
    const c = await cloud.sb();
    const { error } = await c.from('push_prefs').update({ ...row, tz_offset_min: -new Date().getTimezoneOffset(), updated_at: new Date().toISOString() }).eq('user_id', cloud.currentUser().id);
    if (!error) lastDigest = sig;
  } catch { /* tenta de novo na próxima alteração */ }
}
export async function sendTest() {
  const token = await cloud.accessToken();
  const r = await fetch('/api/push-test', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível enviar o teste.');
  return j;
}
