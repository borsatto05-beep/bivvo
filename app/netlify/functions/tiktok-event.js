const { rest, adminKey, userFromJwt, rateLimit } = require('../lib/supabase-admin.js');

const PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'DB2G8IBC77U534NEFRR0';
const ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  },
  body: JSON.stringify(body)
});

function clientIp(headers = {}) {
  return String(
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    headers['x-forwarded-for'] || ''
  ).split(',')[0].trim();
}

function cookieValue(cookieHeader, name) {
  const parts = String(cookieHeader || '').split(';');
  for (const part of parts) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

async function verifyFreshSupabaseUser(userId) {
  const key = adminKey();
  if (!key || !userId) return null;
  const url = `https://gqfirbhzjuzspermyvfy.supabase.co/auth/v1/admin/users/${encodeURIComponent(userId)}`;
  const headers = { apikey: key, 'Cache-Control': 'no-store' };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  const r = await fetch(url, { headers });
  if (!r.ok) return null;
  const user = await r.json().catch(() => null);
  if (!user?.id || user.id !== userId) return null;
  const created = Date.parse(user.created_at || '');
  if (!Number.isFinite(created) || Math.abs(Date.now() - created) > 30 * 60 * 1000) return null;
  return user;
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido.' });
  const token = process.env.TIKTOK_EVENTS_API_TOKEN || '';
  if (!token) return json(503, { error: 'TikTok Events API ainda não configurada.' });
  if (!adminKey()) return json(503, { error: 'Servidor ainda não configurado.' });

  if ((event.body || '').length>64000) return json(413,{error:'Pedido grande demais.'});
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'JSON inválido.' }); }

  if (body.consent !== true) return json(403,{error:'Medição não autorizada.'});
  const jwt=String(event.headers?.authorization || event.headers?.Authorization || '').replace(/^Bearer\s+/i,'').trim();
  const actor=await userFromJwt(jwt);
  if (!actor || actor.id !== body.user_id) return json(401,{error:'Sessão inválida.'});
  if (!(await rateLimit('tiktok:'+actor.id,5,60))) return json(429,{error:'Aguarde para tentar novamente.'});
  const userId = String(body.user_id || '').trim();
  const eventId = String(body.event_id || '').trim();
  const pageUrl = String(body.url || '').trim();
  const ttclid = String(body.ttclid || '').trim();

  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json(400, { error: 'Usuário inválido.' });
  if (!/^[A-Za-z0-9._:-]{12,160}$/.test(eventId)) return json(400, { error: 'event_id inválido.' });
  if (!/^https:\/\/maisbivvo\.netlify\.app(?:\/|$)/i.test(pageUrl)) return json(400, { error: 'URL inválida.' });

  const user = await verifyFreshSupabaseUser(userId);
  if (!user) return json(403, { error: 'Cadastro não confirmado pelo servidor.' });

  // Evita múltiplos Leads de servidor para o mesmo cadastro.
  const prior = await rest(`product_events?user_id=eq.${encodeURIComponent(userId)}&event=eq.tiktok_lead_server_sent&select=id&limit=1`).catch(() => []);
  if (prior?.length) return json(200, { ok: true, duplicate: true });

  const userData = {};
  const ip = clientIp(event.headers || {});
  const ua = String(event.headers?.['user-agent'] || '').slice(0, 500);
  const ttp = cookieValue(event.headers?.cookie, '_ttp');
  if (ip) userData.ip = ip;
  if (ua) userData.user_agent = ua;
  if (ttclid) userData.ttclid = ttclid.slice(0, 500);
  if (ttp) userData.ttp = ttp.slice(0, 500);

  const payload = {
    event_source: 'web',
    event_source_id: PIXEL_ID,
    data: [{
      event: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      user: userData,
      page: { url: new URL(pageUrl).origin + new URL(pageUrl).pathname }
    }]
  };
  if (process.env.TIKTOK_TEST_EVENT_CODE) payload.test_event_code = process.env.TIKTOK_TEST_EVENT_CODE;

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': token },
      body: JSON.stringify(payload)
    });
    const response = await r.json().catch(() => ({}));
    if (!r.ok || response?.code !== 0) {
      console.error('tiktok-event', r.status, response?.code, response?.message);
      return json(502, { error: 'TikTok Events API recusou o evento.', code: response?.code ?? null });
    }

    await rest('product_events', {
      method: 'POST',
      body: { user_id: userId, event: 'tiktok_lead_server_sent', props: { event_id: eventId } },
      prefer: 'return=minimal'
    }).catch(() => {});

    return json(200, { ok: true });
  } catch (e) {
    console.error('tiktok-event', e.message);
    return json(502, { error: 'Não foi possível enviar o evento agora.' });
  }
};
