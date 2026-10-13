/* Envia um aviso de teste para os aparelhos da própria conta. */
const { sendPush, vapidFromEnv } = require('../lib/webpush.js');
const { rest, userFromJwt, rateLimit, adminKey } = require('../lib/supabase-admin.js');

exports.handler = async event => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  const out = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  if (event.httpMethod !== 'POST') return out(405, { error: 'Método não permitido.' });
  const vapid = vapidFromEnv();
  if (!vapid) return out(503, { error: 'Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no Netlify.' });
  if (!adminKey()) return out(503, { error: 'Configure SUPABASE_SECRET_KEY no Netlify.' });
  const jwt = String(event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '').trim();
  const user = await userFromJwt(jwt);
  if (!user) return out(401, { error: 'Sessão inválida. Entre de novo.' });
  if (!(await rateLimit('push-test:' + user.id, 5, 600))) return out(429, { error: 'Muitos testes seguidos. Tente daqui a alguns minutos.' });
  const subs = await rest(`push_subscriptions?user_id=eq.${encodeURIComponent(user.id)}&select=endpoint,p256dh,auth`);
  if (!subs?.length) return out(404, { error: 'Nenhum aparelho com avisos ativos nesta conta.' });
  let sent = 0;
  for (const s of subs) {
    try {
      const r = await sendPush(s, { title: '✨ Bivvo em segundo plano', body: 'Tudo certo. Vou avisar só quando houver algo útil para o seu dinheiro.', url: './#/inicio', tag: 'bivvo-test', badge: 1 }, vapid, { ttl: 600 });
      if (r.ok) sent++;
      else if (r.gone) await rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE' });
    } catch (e) { console.error('push-test', e.message); }
  }
  return sent ? out(200, { ok: true, sent }) : out(502, { error: 'O serviço de avisos do aparelho recusou o envio. Desative e ative de novo.' });
};
