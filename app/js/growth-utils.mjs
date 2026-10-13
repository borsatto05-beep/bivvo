/* Bivvo 11.42 — funções puras de distribuição/atribuição.
   Não recebe nem serializa valores financeiros pessoais. */
const SHARE_SOURCES = new Set(['whatsapp','native_share','copy_link','tool_result','result_card']);
const EMBED_TOOLS = new Set(['comprometimento','parcelas','reserva']);

export function safeSlug(value='') {
  return String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,80);
}

export function buildShareUrl(rawUrl, source='copy_link', content='page', allowedOrigin='https://maisbivvo.netlify.app') {
  const u = new URL(rawUrl, 'https://maisbivvo.netlify.app/');
  if (u.origin !== new URL(allowedOrigin).origin || !['http:','https:'].includes(u.protocol)) throw new Error('Origem de compartilhamento inválida');
  u.search='';u.hash='';
  u.searchParams.set('utm_source', SHARE_SOURCES.has(source) ? source : 'copy_link');
  u.searchParams.set('utm_medium', 'share');
  u.searchParams.set('utm_campaign', 'organic_share');
  u.searchParams.set('utm_content', safeSlug(content || 'page'));
  // Nunca colocamos resultado, renda, dívida, saldo ou qualquer valor do usuário na URL.
  ['salary','income','debt','balance','amount','value','result','renda','divida','saldo','valor'].forEach(k => u.searchParams.delete(k));
  return u.toString();
}

export function safeEmbedTool(value='') {
  const v = safeSlug(value);
  return EMBED_TOOLS.has(v) ? v : 'comprometimento';
}

export function buildEmbedUrl(tool='comprometimento') {
  const t = safeEmbedTool(tool);
  return `https://maisbivvo.netlify.app/ferramentas/embed/?tool=${encodeURIComponent(t)}`;
}

export function classifyReferral(rawUrl, referrer='') {
  const u = new URL(rawUrl, 'https://maisbivvo.netlify.app/');
  const utmSource = safeSlug(u.searchParams.get('utm_source') || '');
  const utmMedium = safeSlug(u.searchParams.get('utm_medium') || '');
  if (SHARE_SOURCES.has(utmSource) || utmMedium === 'share') return { channel: 'share', source: utmSource || 'share' };
  if (utmSource === 'embed' || utmMedium === 'embed') return { channel: 'embed', source: 'embed' };
  if (utmMedium === 'organic') return { channel: 'organic', source: utmSource || 'search' };
  if (utmSource && utmSource !== 'seo') return { channel: 'campaign', source: utmSource };
  let host = '';
  try { host = new URL(referrer).hostname.replace(/^www\./,'').toLowerCase(); } catch {}
  if (!host || host === u.hostname.replace(/^www\./,'')) return { channel: 'direct', source: 'direct' };
  if (/(^|\.)google\./.test(host)) return { channel: 'organic', source: 'google' };
  if (/(^|\.)bing\.com$/.test(host)) return { channel: 'organic', source: 'bing' };
  if (/chatgpt\.com$|openai\.com$/.test(host)) return { channel: 'ai', source: 'chatgpt' };
  if (/copilot\.microsoft\.com$/.test(host)) return { channel: 'ai', source: 'copilot' };
  if (/youtube\.com$|youtu\.be$/.test(host)) return { channel: 'social', source: 'youtube' };
  if (/instagram\.com$/.test(host)) return { channel: 'social', source: 'instagram' };
  if (/facebook\.com$|fb\.com$/.test(host)) return { channel: 'social', source: 'facebook' };
  return { channel: 'external', source: host.slice(0,60) };
}

export function budgetStatusFromPercent(value) {
  const p = Number(value);
  if (!Number.isFinite(p)) return 'resultado pronto';
  if (p <= 50) return 'margem mais folgada';
  if (p <= 70) return 'margem de atenção';
  if (p <= 90) return 'margem apertada';
  return 'prioridade no essencial';
}
