/* Bivvo — acesso administrativo ao Supabase pelas Netlify Functions (chave secreta só no servidor). */
const SUPABASE_URL = 'https://gqfirbhzjuzspermyvfy.supabase.co';
const PUBLIC_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_AGD0F361Dci_rgnplWctlg_cD_9vUoz';
const adminKey = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
function adminHeaders(extra = {}) {
  const key = adminKey();
  const h = { apikey: key, 'Cache-Control': 'no-store', ...extra };
  if (String(key).startsWith('eyJ')) h.Authorization = 'Bearer ' + key;
  return h;
}
async function rest(path, { method = 'GET', body, prefer } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: adminHeaders({ 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) }), body: body ? JSON.stringify(body) : undefined, signal:AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]}: ${r.status} ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
/* Valida o token do usuário com o próprio Supabase Auth antes de confiar nele. */
async function userFromJwt(jwt) {
  if (!jwt) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PUBLIC_KEY, Authorization: 'Bearer ' + jwt, 'Cache-Control': 'no-store' }, signal:AbortSignal.timeout(12000) });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u?.id ? u : null;
}
async function rateLimit(key, limit, windowSeconds) {
  try { return await rest('rpc/bivvo_rate_limit', { method: 'POST', body: { p_key: key, p_limit: limit, p_window_seconds: windowSeconds } }) === true; }
  catch { return false; }
}
module.exports = { rest, userFromJwt, rateLimit, adminKey };
