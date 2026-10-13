/* Exclusão: confiança somente nas claims do token validado pelo Supabase. */
const { userFromJwt, rest, adminKey } = require('../lib/supabase-admin.js');
const URL = 'https://gqfirbhzjuzspermyvfy.supabase.co';
function recentPassword(claims, now = Date.now() / 1000) {
  return Array.isArray(claims.amr) && claims.amr.some(x => x.method === 'password' &&
    Number.isFinite(x.timestamp) && x.timestamp <= now + 30 && now - x.timestamp <= 300);
}
exports._test = { recentPassword };
exports.handler = async event => {
  const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' };
  const out = (statusCode, body) => ({ statusCode, headers, body:JSON.stringify(body) });
  if (event.httpMethod !== 'POST') return out(405, {error:'Método não permitido.'});
  if (!adminKey()) return out(503, {error:'Servidor ainda não configurado.'});
  const jwt = String(event.headers?.authorization || event.headers?.Authorization || '').replace(/^Bearer\s+/i,'').trim();
  try {
    const user = await userFromJwt(jwt);
    if (!user) return out(401, {error:'Sessão inválida ou expirada.'});
    let claims;
    try { claims = JSON.parse(Buffer.from(jwt.split('.')[1] || '', 'base64url').toString('utf8')); }
    catch { return out(401, {error:'Sessão inválida.'}); }
    if (claims.sub !== user.id || !recentPassword(claims))
      return out(401, {error:'Confirme sua senha novamente para excluir a conta.'});
    // Falha na consulta de MFA bloqueia a operação destrutiva.
    const hasMfa = await rest('rpc/bivvo_user_has_verified_mfa', {method:'POST', body:{p_user_id:user.id}});
    if (typeof hasMfa !== 'boolean') throw new Error('MFA_UNAVAILABLE');
    if (hasMfa && claims.aal !== 'aal2') return out(403, {error:'Confirme o código do autenticador para excluir a conta.'});
    const key = adminKey();
    const h = {apikey:key, 'Cache-Control':'no-store'};
    if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key;
    const r = await fetch(URL + '/auth/v1/admin/users/' + encodeURIComponent(user.id),
      {method:'DELETE', headers:h, signal:AbortSignal.timeout(12000)});
    if (!r.ok) return out(502, {error:'Não foi possível excluir a conta agora. Tente novamente.'});
    return out(200, {ok:true});
  } catch (e) {
    console.error('account-delete', e.message);
    return out(503, {error:'Não foi possível verificar a segurança da conta. Tente novamente em instantes.'});
  }
};
