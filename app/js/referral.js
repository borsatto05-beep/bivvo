/* Bivvo 10.5 — ativação de indicação. Quem decide a recompensa é o servidor; aqui só avisamos
   "esta conta talvez já esteja ativa". Tentativas são raras e param quando o servidor diz que acabou. */
import * as cloud from './cloud.js';
import * as store from './store.js';
import { track } from './analytics.js';
import { refreshPlan } from './plans.js';
import { toast } from './ui.js';

const KEY = 'bivvo_ref_done';
let busy = false, lastTry = 0;
export async function maybeActivateReferral() {
  const u = cloud.currentUser();
  if (!u || store.isDemo() || busy || Date.now() - lastTry < 10 * 60000) return;
  if (!/^[a-f0-9]{8}$/.test(String(u.user_metadata?.referred_by || ''))) return;
  try { if (localStorage.getItem(KEY) === u.id) return; } catch { /* ignore */ }
  const txs = store.getState().transactions.filter(t => t.kind !== 'opening' && !t.fixedId && !t.recurringKey);
  if (txs.length < 3 || new Set(txs.map(t => t.date)).size < 2) return;
  busy = true; lastTry = Date.now();
  try {
    await cloud.flush();
    const r = await fetch('/api/referral-activate', { method: 'POST', headers: { Authorization: 'Bearer ' + await cloud.accessToken() } });
    const j = await r.json().catch(() => ({}));
    if (j.final) { try { localStorage.setItem(KEY, u.id); } catch { /* ignore */ } }
    if (j.ok && j.granted) { track('referral_activated'); await refreshPlan(); toast('Você ganhou 7 dias de Bivvo Pro. Aproveite!'); }
  } catch { /* tenta de novo mais tarde */ }
  finally { busy = false; }
}
