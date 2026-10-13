/* Bivvo 11.16 — integração opcional com o Google Search Console (somente leitura).
   Sem credenciais, devolve { connected: false } e o painel mostra o aviso de conexão. Nunca inventa números.
   Variáveis (Netlify → Environment variables):
     GSC_SITE_URL       ex.: https://maisbivvo.netlify.app/  (ou sc-domain:seudominio.com.br)
     GSC_CLIENT_EMAIL   e-mail da conta de serviço do Google Cloud
     GSC_PRIVATE_KEY    chave privada da conta de serviço (com \n literais ou quebras de linha)
   A conta de serviço precisa ser adicionada como usuário (leitura) da propriedade no Search Console. */
const crypto = require('crypto');

const env = () => ({ site: process.env.GSC_SITE_URL || '', email: process.env.GSC_CLIENT_EMAIL || '', key: String(process.env.GSC_PRIVATE_KEY || '').replace(/\\n/g, '\n') });
const isConfigured = () => { const e = env(); return !!(e.site && e.email && e.key.includes('PRIVATE KEY')); };
const b64u = v => Buffer.from(v).toString('base64url');

async function token({ email, key }) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64u(JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }))}`;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }) });
  if (!r.ok) throw new Error('Search Console: autenticação recusada (' + r.status + ')');
  return (await r.json()).access_token;
}
async function query(accessToken, site, body) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Search Console: consulta recusada (' + r.status + ')');
  return (await r.json()).rows || [];
}
/* Retorna totais, páginas e consultas. O modo padrão considera ~2 dias de atraso do Google. */
async function queryRange(start, end, { timeoutMs = 7000 } = {}) {
  if (!isConfigured()) return { connected: false };
  const e = env();
  const work = (async () => {
    const t = await token(e);
    const [totals, pages, queries] = await Promise.all([
      query(t, e.site, { startDate: start, endDate: end }),
      query(t, e.site, { startDate: start, endDate: end, dimensions: ['page'], rowLimit: 25 }),
      query(t, e.site, { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 25 })
    ]);
    const row = x => ({ key: x.keys?.[0] || '', clicks: x.clicks || 0, impressions: x.impressions || 0, ctr: (x.ctr || 0) * 100, position: x.position || 0 });
    const tot = totals[0] || {};
    return { connected: true, start, end, totals: { clicks: tot.clicks || 0, impressions: tot.impressions || 0, ctr: (tot.ctr || 0) * 100, position: tot.position || 0 }, pages: pages.map(row), queries: queries.map(row) };
  })();
  try { return await Promise.race([work, new Promise((_, rej) => setTimeout(() => rej(new Error('Search Console demorou para responder')), timeoutMs))]); }
  catch (err) { return { connected: true, error: err.message }; }
}
async function performance(days = 28, opts = {}) {
  const end = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + 2) * 86400000).toISOString().slice(0, 10);
  return queryRange(start,end,opts);
}
async function performanceRange(start,end,opts={}) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(start||'')) || !/^\d{4}-\d{2}-\d{2}$/.test(String(end||''))) return {connected:isConfigured(),error:'Período inválido'};
  return queryRange(start,end,opts);
}
module.exports = { isConfigured, performance, performanceRange };
