const { rest, userFromJwt, rateLimit, adminKey } = require('../lib/supabase-admin.js');
const { mp, syncSubscription } = require('../lib/billing.js');

exports.handler = async event => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  const out = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  if (event.httpMethod !== 'POST') return out(405, { error: 'Método não permitido.' });
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !adminKey()) return out(503, { error: 'Cobrança não configurada.' });

  const jwt = String(event.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const user = await userFromJwt(jwt);
  if (!user?.id) return out(401, { error: 'Sessão inválida.' });
  if (!(await rateLimit('billing-cancel:' + user.id, 3, 600))) return out(429, { error: 'Muitas tentativas. Aguarde alguns minutos.' });

  try {
    const rows = await rest(`billing_subscriptions?user_id=eq.${user.id}&status=eq.authorized&order=created_at.desc&limit=1&select=mp_subscription_id,plan,status,next_payment_date`);
    const row = rows?.[0];
    if (!row?.mp_subscription_id) return out(404, { error: 'Nenhuma assinatura ativa encontrada.' });

    await mp('/preapproval/' + encodeURIComponent(row.mp_subscription_id), { method: 'PUT', body: { status: 'cancelled' } });
    const synced = await syncSubscription(row.mp_subscription_id);

    return out(200, {
      ok: true,
      plan: row.plan,
      status: synced.status,
      accessUntil: synced.accessUntil || row.next_payment_date || null,
      message: 'Renovação cancelada. Seu acesso já pago é preservado até o fim do período vigente.'
    });
  } catch (e) {
    console.error('billing-cancel', e.message);
    return out(502, { error: 'Não foi possível cancelar a assinatura agora. Tente novamente.' });
  }
};
