# Bivvo 11.72.2 — correção de erros de console

Correções aplicadas:

- Mantido o hotfix de sintaxe de `js/views/loans.js` que impedia o app de abrir.
- Service Worker: o precache deixou de incluir todas as páginas públicas/SEO e passou a guardar apenas o shell real do app, módulos JS, fontes e assets críticos. Isso evita `Incomplete release` causado por um asset opcional falhar durante a instalação.
- Google Ads: o runtime externo deixou de carregar em toda abertura do app. Agora é carregado de forma lazy somente quando existe uma conversão real de cadastro a enviar, reduzindo erros CSP e requisições DoubleClick desnecessárias.
- CSP: adicionados os endpoints DoubleClick efetivamente usados pelo Google Ads em `script-src`, `img-src`, `connect-src` e `frame-src`, sem liberar `unsafe-inline`.
- Build regenerado com release hash novo.

Validação:

- `npm test`: 71 suítes, 0 falhas.
- `npm run test:seo`: 0 erros.
- `js/views/loans.js`: sintaxe validada como ES module.
- `dist/js/views/loans.js`: sintaxe validada como ES module.
- Service Worker novo: 108 assets críticos no precache (antes 202).
