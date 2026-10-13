/* Roda a cada hora (ver netlify.toml). Para cada pessoa com avisos ligados, quando
   chega o horário escolhido no fuso dela, manda no máximo um aviso por dia. */
const { sendPush, vapidFromEnv } = require('../lib/webpush.js');
const { rest, adminKey } = require('../lib/supabase-admin.js');
const { buildMessage } = require('../lib/messages.js');
const { planOf } = require('../lib/plans.js');

exports.handler = async () => {
  const vapid = vapidFromEnv();
  if (!vapid || !adminKey()) { console.warn('push-cron: VAPID ou SUPABASE_SECRET_KEY ausentes'); return { statusCode: 200, body: 'not configured' }; }
  const now = Date.now();
  const prefs = await rest('push_prefs?enabled=eq.true&select=user_id,hour,tz_offset_min,show_values,digest,last_capture_date,last_sent_on&limit=5000');
  let sent = 0, users = 0;
  for (const p of prefs || []) {
    const local = new Date(now + (Number(p.tz_offset_min) || -180) * 60000);
    const localDate = local.toISOString().slice(0, 10), localHour = local.getUTCHours();
    if (localHour !== (p.hour ?? 20) || p.last_sent_on === localDate) continue;
    const plan = await planOf(rest, p.user_id);
    const msg = buildMessage(p, localDate, plan !== 'free');
    await rest(`push_prefs?user_id=eq.${encodeURIComponent(p.user_id)}`, { method: 'PATCH', body: { last_sent_on: localDate }, prefer: 'return=minimal' });
    if (!msg) continue;
    const subs = await rest(`push_subscriptions?user_id=eq.${encodeURIComponent(p.user_id)}&select=endpoint,p256dh,auth`);
    users++;
    for (const s of subs || []) {
      try {
        const r = await sendPush(s, msg, vapid, { urgency: msg.urgency || 'normal' });
        if (r.ok) sent++;
        else if (r.gone) await rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE' });
        else console.warn('push-cron status', r.status);
      } catch (e) { console.error('push-cron', e.message); }
    }
  }
  console.log(`push-cron: ${users} pessoa(s), ${sent} aviso(s)`);
  return { statusCode: 200, body: 'ok' };
};
