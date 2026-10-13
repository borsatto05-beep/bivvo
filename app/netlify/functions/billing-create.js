const { rest, userFromJwt, rateLimit, adminKey } = require('../lib/supabase-admin.js');
const { PLANS, mp } = require('../lib/billing.js');

exports.handler = async event => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  };

  const out = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
  });

  if (event.httpMethod !== 'POST') {
    return out(405, { error: 'Método não permitido.' });
  }

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !adminKey()) {
    return out(503, { error: 'Cobrança ainda não configurada no servidor.' });
  }

  const jwt = String(event.headers.authorization || '')
    .replace(/^Bearer\s+/i, '')
    .trim();

  const user = await userFromJwt(jwt);

  if (!user?.id || !user?.email) {
    return out(401, { error: 'Entre na sua conta para assinar.' });
  }

  if (!(await rateLimit('billing-create:' + user.id, 5, 300))) {
    return out(429, { error: 'Muitas tentativas. Aguarde alguns minutos.' });
  }

  let body = {};

  try {
    body = JSON.parse(event.body || '{}');
  } catch {}

  const plan = String(body.plan || '');
  const interval = body.interval === 'annual' ? 'annual' : 'monthly';
  const def = PLANS[plan];

  if (!def) {
    return out(400, { error: 'Plano inválido.' });
  }

  try {
    const base = process.env.URL || 'https://maisbivvo.netlify.app';
    const external = `bivvo:${user.id}:${plan}:${interval}`;
    const annualAmount = Number(def.annual || def.amount * 10);
    const amount = interval === 'annual' ? annualAmount : def.amount;
    const frequency = interval === 'annual' ? 12 : 1;

    const payerEmail =
      process.env.MERCADOPAGO_TEST_PAYER_EMAIL || user.email;

    const sub = await mp('/preapproval', {
      method: 'POST',
      body: {
        reason: def.name,
        external_reference: external,
        payer_email: payerEmail,
        auto_recurring: {
          frequency,
          frequency_type: 'months',
          transaction_amount: amount,
          currency_id: 'BRL'
        },
        back_url: base + '/?billing=return',
        status: 'pending'
      }
    });

    if (!sub?.id || !sub?.init_point) {
      throw new Error('Mercado Pago não devolveu o checkout.');
    }

    await rest('billing_subscriptions', {
      method: 'POST',
      body: {
        user_id: user.id,
        plan,
        mp_subscription_id: String(sub.id),
        status: String(sub.status || 'pending'),
        amount,
        currency: 'BRL',
        next_payment_date: sub.next_payment_date || null
      },
      prefer: 'resolution=merge-duplicates,return=minimal'
    });

    return out(200, {
      ok: true,
      checkoutUrl: sub.init_point,
      subscriptionId: String(sub.id)
    });

  } catch (e) {
    console.error('billing-create', e.message);

    return out(502, {
      error: 'Não consegui abrir o pagamento agora. Tente novamente.',
      detail: process.env.CONTEXT === 'dev' ? e.message : undefined
    });
  }
};