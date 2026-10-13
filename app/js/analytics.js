/* Bivvo 10.5 — métricas de produto com privacidade.
   - Só eventos de uma lista fechada; propriedades só de uma lista fechada e só texto curto/número pequeno.
   - Nunca envia valores em reais, descrições, categorias, nomes ou cartões.
   - Só para quem está logado (nunca na demonstração). Falhas são ignoradas: métrica nunca trava o app. */
import * as cloud from './cloud.js';
import * as store from './store.js';

const EVENTS = new Set([
  'app_open', 'signup', 'onboarding_done', 'first_tx', 'spendable_seen',
  'quick_capture_used', 'voice_used', 'scan_used', 'scan_failed', 'share_target_used',
  'simulation_used', 'simulation_confirmed', 'conversion_opportunity_shown', 'conversion_opportunity_clicked', 'paywall_viewed', 'paywall_closed', 'plans_viewed', 'plan_selected', 'pro_screen_viewed', 'pro_interest',
  'trial_started', 'premium_feature_used', 'checkout_started', 'checkout_created', 'checkout_returned', 'subscription_started', 'subscription_activated', 'subscription_canceled', 'payment_approved', 'payment_failed',
  'pwa_install_offer_shown', 'pwa_install_clicked', 'pwa_install_dismissed', 'pwa_install_prompt_accepted', 'pwa_install_prompt_dismissed', 'pwa_installed', 'pwa_ios_instructions_shown',
  'retention_returned', 'retention_nudge_shown', 'retention_nudge_clicked', 'referral_sent', 'referral_activated', 'referral_center_viewed', 'referral_link_copied', 'monthly_report_opened', 'retention_d30', 'retention_d90', 'subscription_paused', 'subscription_reactivated', 'cancel_offer_viewed', 'cancel_flow_started', 'cancel_reason_selected', 'cancel_retained_pause', 'cancellation_completed', 'split_created', 'story_created', 'story_downloaded', 'story_share_attempt', 'story_shared', 'story_share_canceled', 'spendable_card_opened', 'spendable_card_shared', 'spendable_card_share_canceled', 'spendable_card_downloaded', 'wrapped_opened', 'push_enabled', 'assistant_used'
]);
const PROPS = new Set(['source', 'feature', 'channel', 'plan', 'result', 'parts', 'step', 'tone', 'reason', 'placement', 'trigger', 'route', 'interval', 'platform', 'install_method', 'is_new_user']);
const clean = props => {
  const out = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (!PROPS.has(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 60) out[k] = v;           /* contagens pequenas (ex.: parcelas), nunca dinheiro */
    else if (typeof v === 'string' && /^[a-z0-9_-]{1,24}$/.test(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
  }
  return out;
};
let queue = [], timer = null;
export function track(event, props) {
  if (!EVENTS.has(event) || store.isDemo() || !cloud.currentUser()) return;
  queue.push({ event, props: clean(props), created_at: new Date().toISOString() });
  clearTimeout(timer); timer = setTimeout(flush, 3000);
}
/* Eventos "uma vez por dia" ou "uma vez na vida" sem guardar nada sensível. */
export function trackOnce(event, scope = 'life', props) {
  const key = `bivvo_ev_${event}_${scope === 'day' ? new Date().toISOString().slice(0, 10) : 'life'}`;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { /* ignore */ }
  track(event, props);
}
export async function flush() {
  if (!queue.length) return;
  const u = cloud.currentUser(); if (!u) { queue = []; return; }
  const batch = queue.splice(0, 30).map(e => ({ ...e, user_id: u.id }));
  try { const c = await cloud.sb(); await c.from('product_events').insert(batch); } catch { /* descarta: métricas não são críticas */ }
}
window.addEventListener('pagehide', () => { flush(); });
