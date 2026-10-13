/* Indicação: só recompensa quando a pessoa indicada realmente usou o Bivvo.
   Condições: e-mail confirmado, conta com até 60 dias, 3+ lançamentos próprios em 2+ dias diferentes,
   quem indicou existe e não é a mesma pessoa, uma indicação por conta, no máximo 4 recompensas por ano. */
const { rest, userFromJwt, rateLimit, adminKey } = require('../lib/supabase-admin.js');
const DAY = 86400000;
const addEntitlement = (userId, plan, source, days) => rest('entitlements?on_conflict=user_id,source', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: { user_id: userId, plan, source, expires_at: new Date(Date.now() + days * DAY).toISOString() } });

exports.handler = async event => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  const out = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  if (event.httpMethod !== 'POST') return out(405, { error: 'Método não permitido.' });
  if (!adminKey()) return out(503, { code: 'not_configured' });
  const jwt = String(event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '').trim();
  const user = await userFromJwt(jwt);
  if (!user) return out(401, { error: 'Sessão inválida.' });
  if (!(await rateLimit('ref:' + user.id, 5, 3600))) return out(429, { error: 'Tente mais tarde.' });

  const code = String(user.user_metadata?.referred_by || '');
  if (!/^[a-f0-9]{8}$/.test(code)) return out(200, { ok: false, reason: 'no_referral', final: true });
  if (!user.email_confirmed_at) return out(200, { ok: false, reason: 'email_unconfirmed' });
  if (Date.now() - new Date(user.created_at).getTime() > 60 * DAY) return out(200, { ok: false, reason: 'too_old', final: true });

  try {
    const existing = await rest(`referrals?referred_user=eq.${user.id}&select=id`);
    if (existing?.length) return out(200, { ok: true, already: true, final: true });
    const referrer = await rest('rpc/bivvo_referrer_by_code', { method: 'POST', body: { p_code: code } });
    if (!referrer || referrer === user.id) return out(200, { ok: false, reason: 'invalid_referrer', final: true });

    /* ativação conferida no servidor, a partir dos dados salvos da própria conta */
    const rows = await rest(`finance_data?user_id=eq.${user.id}&select=payload`);
    const txs = (rows?.[0]?.payload?.transactions || []).filter(t => t && t.kind !== 'opening' && !t.fixedId && !t.recurringKey && !t.demoSeed);
    const days = new Set(txs.map(t => String(t.date || '')).filter(Boolean)).size;
    if (txs.length < 3 || days < 2) return out(200, { ok: false, reason: 'not_active_yet' });

    await rest('referrals', { method: 'POST', prefer: 'return=minimal', body: { referrer, referred_user: user.id, status: 'activated', activated_at: new Date().toISOString() } });
    await addEntitlement(user.id, 'pro', 'referral_welcome', 7);

    const yearAgo = new Date(Date.now() - 365 * DAY).toISOString();
    const act = await rest(`referrals?referrer=eq.${referrer}&status=eq.activated&activated_at=gt.${encodeURIComponent(yearAgo)}&select=id`);
    const n = act?.length || 0;
    if (n > 0 && n % 3 === 0) {
      const k = n / 3;
      if (k <= 4) await addEntitlement(referrer, 'pro', `referral_reward_${new Date().getFullYear()}_${k}`, 30);
      await rest(`referrals?referred_user=eq.${user.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { reward_status: k <= 4 ? 'granted' : 'capped' } });
    }
    return out(200, { ok: true, granted: 'pro_7_days', final: true });
  } catch (e) {
    console.error('referral', e.message);
    return out(503, { ok: false, reason: 'server' });
  }
};
