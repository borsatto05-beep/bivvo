/* Bivvo 8.15 — eventos das páginas públicas (Aprenda, calculadoras e páginas SEO) para o Growth Center.
   Privacidade: envia só tipo de página, slug, categoria, origem/UTM e o destino do clique.
   Nunca envia valores digitados, resultados de cálculo, saldo, renda, dívidas ou dados pessoais.
   Usa os mesmos identificadores anônimos do app (bivvo_visitor_id / bivvo_session_id / primeira origem),
   para que o cadastro feito depois no app seja atribuído à visita orgânica. Falhas são ignoradas. */
(function () {
  'use strict';
  var ENDPOINT = '/api/analytics/event';
  var uuid = function () {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) { /* segue */ }
    return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  };
  var id = function (key, store) {
    try { var v = store.getItem(key); if (!v) { v = uuid(); store.setItem(key, v); } return v; } catch (e) { return uuid(); }
  };
  var visitor = id('bivvo_visitor_id', window.localStorage);
  var session = id('bivvo_session_id', window.sessionStorage);
  var qs = new URLSearchParams(location.search);
  /* 8.19.2: um convite pode cair primeiro na calculadora pública. Guardamos apenas o código
     anônimo de indicação para que o cadastro feito depois continue atribuído ao convite. */
  try {
    var inviteRef = qs.get('ref') || '';
    if (/^[a-f0-9]{8}$/.test(inviteRef)) localStorage.setItem('bivvo_ref', inviteRef);
  } catch (e) { /* ignore */ }
  var host = function (u) { try { return new URL(u).hostname.replace(/^www\./, '').slice(0, 80); } catch (e) { return ''; } };
  /* Mesma regra do app (js/admin-analytics.js): a primeira origem do visitante é guardada uma vez. */
  var first = (function () {
    var key = 'bivvo_first_touch_v1';
    try {
      var old = JSON.parse(localStorage.getItem(key) || 'null'); if (old) return old;
      var ref = host(document.referrer); if (ref === location.hostname.replace(/^www\./, '')) ref = '';
      var v = { source: qs.get('utm_source') || (ref || 'direct'), medium: qs.get('utm_medium') || (ref ? 'referral' : ''), campaign: qs.get('utm_campaign') || '',
        content: qs.get('utm_content') || '', term: qs.get('utm_term') || '', landing: location.pathname.slice(0, 80), referrer: ref };
      if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia)\./.test(ref) && !qs.get('utm_medium')) v.medium = 'organic';
      localStorage.setItem(key, JSON.stringify(v)); return v;
    } catch (e) { return { source: 'direct', medium: '', campaign: '', content: '', term: '', landing: '', referrer: '' }; }
  })();
  var screenBucket = function () { var w = innerWidth; return w < 480 ? 'xs' : w < 768 ? 'sm' : w < 1024 ? 'md' : w < 1440 ? 'lg' : 'xl'; };
  var b = document.body ? document.body.dataset : {};
  var type = b.seoType || 'pagina', slug = b.seoSlug || location.pathname.replace(/^\/|\/$/g, '').split('/').pop() || 'inicio', cat = b.seoCat || '';
  var route = ('seo/' + type + '/' + slug).slice(0, 80);
  var safe = function (v) { return String(v || '').replace(/[^a-zA-Z0-9_.:\/-]/g, '').slice(0, 80); };

  function track(event, extra) {
    extra = extra || {};
    var payload = { visitor_id: visitor, session_id: session, event: event, route: safe(extra.route || route),
      source: first.source, medium: first.medium, campaign: first.campaign, content: safe(extra.content || ''), term: first.term,
      landing: first.landing, referrer: first.referrer, language: (navigator.language || '').slice(0, 16), screen: screenBucket(),
      error_type: safe(extra.kind || type).slice(0, 40), error_message: '', app_version: '11.18.0' };
    try {
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(function () {});
    } catch (e) { /* métrica nunca quebra a página */ }
  }
  window.bivvoSeo = { track: track };

  /* Visualização: uma por página por sessão (evita inflar com recarregamentos). */
  try {
    var seenKey = 'bivvo_seo_seen:' + location.pathname;
    if (!sessionStorage.getItem(seenKey)) {
      sessionStorage.setItem(seenKey, '1');
      track('seo_page_viewed', { content: cat });
      if (type === 'artigo') track('seo_article_viewed', { content: cat });
    }
  } catch (e) { track('seo_page_viewed', { content: cat }); }

  /* Cliques: pelo atributo data-seo ou, nas páginas antigas, pelo destino do link. */
  var TOOL_PATHS = /^\/(calculadoras\/[a-z-]+|quanto-posso-gastar-hoje|organizar-cartao-de-credito)\/?$/;
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    var url; try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    var kind = a.getAttribute('data-seo'), target = a.getAttribute('data-seo-target') || '';
    if (!kind) {
      if (url.searchParams.get('signup') === '1') kind = 'signup';
      else if (TOOL_PATHS.test(url.pathname) && url.pathname !== location.pathname) kind = 'tool';
      else if (/^\/aprenda\/[a-z-]+\/[a-z0-9-]+\/$/.test(url.pathname)) kind = 'related';
      target = target || url.pathname.replace(/^\/|\/$/g, '').split('/').pop();
    }
    if (kind === 'signup') track('seo_signup_clicked', { content: 'signup:' + (target || 'link') });
    else if (kind === 'tool') track('seo_tool_clicked', { content: 'tool:' + target });
    else if (kind === 'related') track('seo_related_article_clicked', { content: 'rel:' + target });
  }, true);
})();
