const { rest, userFromJwt, adminKey } = require('../lib/supabase-admin.js');
const { syncSubscription } = require('../lib/billing.js');
exports.handler = async event => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const out = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  if (event.httpMethod !== 'POST') return out(405, { error: 'Método não permitido.' });
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !adminKey()) return out(503, { error: 'Cobrança não configurada.' });
  const jwt = String(event.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const user = await userFromJwt(jwt); if (!user) return out(401, { error: 'Sessão inválida.' });
  try {
    const rows = await rest(`billing_subscriptions?user_id=eq.${user.id}&order=created_at.desc&limit=5&select=mp_subscription_id,plan,status`);
    const results = [];
    for (const row of (rows || [])) results.push(await syncSubscription(row.mp_subscription_id));
    return out(200, { ok: true, subscriptions: results });
  } catch (e) { console.error('billing-sync', e.message); return out(502, { error: 'Não consegui atualizar a assinatura agora.' }); }
};
