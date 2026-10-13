# Bivvo 11.36 — Motor de Aquisição Orgânica

## Objetivo
Transformar o SEO público em um funil mensurável: descoberta → conteúdo/ferramenta → CTA → cadastro.

## Implementado
- Rastreamento orgânico em todas as páginas públicas das famílias SEO/Aprenda/calculadoras usando os eventos já aceitos pelo backend: `seo_page_viewed`, `seo_article_viewed`, `seo_signup_clicked` e `seo_related_article_clicked`.
- Preservação de UTM/first touch/last touch pelo módulo de analytics já existente.
- Nova ferramenta pública `/diagnostico-financeiro/`, sem cadastro, com cálculo local no navegador e CTA para cadastro.
- Página `/sobre-bivvo/` para propósito, público e limites das promessas.
- Página `/metodologia-bivvo/` explicando a jornada Descontrole → Sobrevivência → Controle → Estabilidade → Crescimento e os limites educativos.
- Links de confiança (Sobre, Metodologia e Diagnóstico) adicionados aos rodapés públicos.
- Sitemap atualizado com as três novas URLs.
- Cache-busting de CSS público atualizado para `11.36.0`.

## O que depende de conta externa
- Google Search Console: verificar indexação, consultas, posições, CTR e enviar/acompanhar sitemap após deploy.
- Bing Webmaster Tools: verificar site, sitemap e IndexNow.
- Backlinks/menções externas: dependem de distribuição e parceiros, não de código.

## Privacidade
O diagnóstico informa explicitamente que os valores financeiros preenchidos são calculados localmente. O analytics registra somente evento/rota/atribuição; os valores do formulário não são enviados.

## Critério de crescimento
Priorizar páginas que aparecerem nas posições 4–20 e melhorar intenção, CTR, conteúdo e links internos com base nas consultas reais do Search Console.
