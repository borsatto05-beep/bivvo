import * as cloud from './cloud.js';
import { adminTrack } from './admin-analytics.js';

async function authHeaders() {
  const c = await cloud.sb();
  const { data } = await c.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Entre na sua conta para assinar.');
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
}
export async function startSubscription(plan, interval = 'monthly') {
  adminTrack('checkout_started', 'plan_' + plan + '_' + interval).catch(() => {});
  const r = await fetch('/api/billing/create', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ plan, interval }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível abrir o pagamento.');
  adminTrack('checkout_created', 'plan_' + plan + '_' + interval).catch(() => {});
  if (!/^https:\/\//i.test(j.checkoutUrl || '')) throw new Error('Link de pagamento inválido.');
  location.href = j.checkoutUrl;
}
export async function syncBilling() {
  const r = await fetch('/api/billing/sync', { method: 'POST', headers: await authHeaders() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível atualizar sua assinatura.');
  return j;
}

export async function cancelSubscription() {
  const r = await fetch('/api/billing/cancel', { method: 'POST', headers: await authHeaders() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível cancelar a assinatura.');
  return j;
}

export async function pauseSubscription() {
  const r = await fetch('/api/billing/pause', { method: 'POST', headers: await authHeaders() });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Não foi possível pausar a assinatura.'); return j;
}
export async function reactivateSubscription() {
  const r = await fetch('/api/billing/reactivate', { method: 'POST', headers: await authHeaders() });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Não foi possível reativar a assinatura.'); return j;
}

export async function currentSubscription() {
  const c = await cloud.sb();
  const u = cloud.currentUser();
  if (!u) return null;
  const { data, error } = await c.from('billing_subscriptions')
    .select('plan,status,next_payment_date,created_at')
    .eq('user_id', u.id).order('created_at', { ascending: false }).limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export async function startProTrial() {
  const r = await fetch('/api/trial/start', { method: 'POST', headers: await authHeaders() });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível iniciar o teste.');
  return j;
}
