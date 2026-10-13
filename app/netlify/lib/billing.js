const { rest } = require('./supabase-admin.js');

async function productEvent(userId, event, props = {}) {
  if (!userId) return;
  await rest('product_events', { method: 'POST', body: { user_id: userId, event, props }, prefer: 'return=minimal' }).catch(e => console.error('billing product event', e.message));
}

const MP_API = 'https://api.mercadopago.com';

const PLANS = {
  plus: { name: 'Bivvo Plus', amount: 19.90, annual: 199.00 },
  capital: { name: 'Bivvo Capital', amount: 24.90, annual: 249.00 },
  pro: { name: 'Bivvo Pro', amount: 29.90, annual: 299.00 },
  couple: { name: 'Bivvo Casal', amount: 29.90, annual: 299.00 },
  entrepreneur: { name: 'Bivvo Empreendedor', amount: 34.90, annual: 349.00 },
  family: { name: 'Bivvo Família', amount: 49.99, annual: 499.00 }
};

const token = () => process.env.MERCADOPAGO_ACCESS_TOKEN || '';

async function mp(path, { method = 'GET', body } = {}) {
  if (!token()) throw new Error('MERCADOPAGO_ACCESS_TOKEN ausente');

  const r = await fetch(MP_API + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + token(),
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.timeout(12000),
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await r.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!r.ok) {
    throw new Error(
      `Mercado Pago ${r.status}: ${String(data?.message || text).slice(0, 180)}`
    );
  }

  return data;
}

const sourceOf = id =>
  ('mercadopago:' + String(id)).slice(0, 64);

const isoPlusDays = (iso, days) => {
  const d = iso ? new Date(iso) : new Date();

  if (!Number.isFinite(d.getTime())) {
    return new Date(
      Date.now() + days * 86400000
    ).toISOString();
  }

  d.setUTCDate(d.getUTCDate() + days);

  return d.toISOString();
};

/*
 * Procura as cobranças reais da assinatura.
 *
 * IMPORTANTE:
 * assinatura "authorized" NÃO significa pagamento recebido.
 * O plano só pode ser liberado quando a cobrança mais recente
 * possuir payment.status === "approved".
 */
async function latestInvoice(mpId) {
  const data = await mp(
    '/authorized_payments/search?preapproval_id=' +
    encodeURIComponent(mpId)
  );

  const invoices = Array.isArray(data?.results)
    ? data.results
    : [];

  if (!invoices.length) return null;

  invoices.sort((a, b) => {
    const da = new Date(
      a.debit_date ||
      a.last_modified ||
      a.date_created ||
      0
    ).getTime();

    const db = new Date(
      b.debit_date ||
      b.last_modified ||
      b.date_created ||
      0
    ).getTime();

    return db - da;
  });

  return invoices[0];
}

async function expireEntitlement(userId, source) {
  await rest(
    `entitlements?user_id=eq.${userId}&source=eq.${encodeURIComponent(source)}`,
    {
      method: 'PATCH',
      body: {
        expires_at: new Date().toISOString()
      },
      prefer: 'return=minimal'
    }
  );
}

async function syncSubscription(mpId) {
  /*
   * Primeiro consulta a assinatura diretamente no Mercado Pago.
   */
  const sub = await mp(
    '/preapproval/' + encodeURIComponent(mpId)
  );

  const rows = await rest(
    `billing_subscriptions?mp_subscription_id=eq.${encodeURIComponent(mpId)}&select=id,user_id,plan,mp_subscription_id,status,next_payment_date`
  );

  const row = rows?.[0];

  if (!row) {
    return {
      ignored: true,
      status: sub.status
    };
  }

  const status = String(
    sub.status || 'unknown'
  );

  const next =
    sub.next_payment_date ||
    sub.auto_recurring?.start_date ||
    null;

  /*
   * Agora consulta as FATURAS da assinatura.
   * É aqui que descobrimos se houve dinheiro realmente cobrado.
   */
  let invoice = null;

  try {
    invoice = await latestInvoice(mpId);
  } catch (e) {
    console.error(
      'billing invoice lookup',
      e.message
    );
    throw new Error('Cobranças indisponíveis; acesso pago preservado.');
  }

  const paymentStatus = String(
    invoice?.payment?.status || ''
  ).toLowerCase();

  const paymentApproved =
    paymentStatus === 'approved';
  if (!invoice || !paymentStatus) throw new Error('Cobrança inconclusiva; aguarde reconciliação.');

  /*
   * Atualiza o estado da assinatura no Supabase.
   */
  await rest(
    `billing_subscriptions?id=eq.${row.id}`,
    {
      method: 'PATCH',
      body: {
        status,
        next_payment_date: next,
        last_sync_at: new Date().toISOString()
      },
      prefer: 'return=minimal'
    }
  );

  const source = sourceOf(mpId);
  const previousStatus = String(row.status || 'unknown');
  let accessUntil = null;

  /*
   * REGRA PRINCIPAL:
   *
   * Só libera plano quando:
   *
   * 1. assinatura está authorized
   * 2. existe cobrança real
   * 3. pagamento dessa cobrança está approved
   */
  if (
    status === 'authorized' &&
    paymentApproved
  ) {
    const expires = isoPlusDays(
      next || invoice.debit_date || invoice.date_created,
      3
    );

    if (!next && !invoice.debit_date && !invoice.date_created) throw new Error('Período pago desconhecido.');
    const paidExpires = next ? expires : isoPlusDays(invoice.debit_date || invoice.date_created, 33);
    await rest('entitlements?on_conflict=user_id,source', {
      method:'POST', body:{user_id:row.user_id, plan:row.plan, source,
        starts_at:invoice.debit_date || invoice.date_created || new Date().toISOString(), expires_at:paidExpires},
      prefer:'resolution=merge-duplicates,return=minimal'
    });

    console.log(
      'billing access granted',
      {
        subscription: mpId,
        plan: row.plan,
        paymentStatus
      }
    );
  } else if ((status === 'cancelled' || status === 'paused') && paymentApproved) {
    /* Cancelar ou pausar impede nova cobrança por enquanto, mas não apaga um período já pago. */
    const existing = await rest(
      `entitlements?user_id=eq.${row.user_id}&source=eq.${encodeURIComponent(source)}&select=id,expires_at`
    );
    accessUntil = existing?.[0]?.expires_at || row.next_payment_date || next || null;
    if (!existing?.[0] && accessUntil && new Date(accessUntil).getTime() > Date.now()) {
      await rest('entitlements', { method: 'POST', body: { user_id: row.user_id, plan: row.plan, source, starts_at: new Date().toISOString(), expires_at: accessUntil }, prefer: 'return=minimal' });
    }
    console.log('billing renewal stopped; paid access preserved', { subscription: mpId, plan: row.plan, status, accessUntil });
  } else if (['pending','in_process','authorized','rejected','cancelled'].includes(paymentStatus)) {
    // A pending renewal cannot erase a period already paid.
    return {status, plan:row.plan, paymentStatus, paymentApproved:false, pending:true};
  } else {
    await expireEntitlement(row.user_id, source);
    console.log('billing access not granted', { subscription: mpId, subscriptionStatus: status, paymentStatus: paymentStatus || 'no_payment' });
  }

  if (previousStatus !== status) {
    if (status === 'authorized') await productEvent(row.user_id, 'subscription_started', { plan: row.plan });
    if (status === 'cancelled') await productEvent(row.user_id, 'subscription_canceled', { plan: row.plan });
    if (status === 'paused') await productEvent(row.user_id, 'subscription_paused', { plan: row.plan });
    if (status === 'authorized' && previousStatus === 'paused') await productEvent(row.user_id, 'subscription_reactivated', { plan: row.plan });
  }

  return {
    status,
    plan: row.plan,
    nextPaymentDate: next,
    accessUntil,
    paymentStatus: paymentStatus || 'no_payment',
    paymentApproved
  };
}

module.exports = {
  PLANS,
  mp,
  syncSubscription
};