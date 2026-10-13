const { rest, adminKey } = require('../lib/supabase-admin.js');
const { syncSubscription } = require('../lib/billing.js');
exports.handler = async () => {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !adminKey()) return { statusCode: 503, body: 'not configured' };
  try {
    const rows = await rest('billing_subscriptions?select=mp_subscription_id&order=last_sync_at.asc.nullsfirst&limit=100');
    let ok = 0;
    for (const row of (rows || [])) { try { await syncSubscription(row.mp_subscription_id); ok++; } catch (e) { console.error('billing-cron item', e.message); } }
    return { statusCode: 200, body: JSON.stringify({ ok }) };
  } catch (e) { console.error('billing-cron', e.message); return { statusCode: 500, body: 'error' }; }
};
