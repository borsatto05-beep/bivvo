# Bivvo 11.41 — Motor de Medição e Crescimento Orgânico

## Objetivo
Transformar a camada pública/SEO em um funil mensurável: página pública → engajamento → ferramenta → CTA → cadastro → ativação → trial → checkout → pagamento, sem enviar valores financeiros digitados nas ferramentas.

## Implementado
- `js/public-acquisition.js` atualizado e carregado nas 50 páginas públicas do sitemap (a home mantém o analytics nativo do app).
- Novos sinais técnicos: `seo_engaged` (25/50/75/90% e 30s), `seo_tool_started`, `seo_tool_completed`, `seo_tool_downloaded`, `seo_video_played`.
- Preservados `seo_page_viewed`, `seo_article_viewed`, `seo_signup_clicked` e `seo_related_article_clicked`.
- Ferramentas embutidas são medidas sem transmitir renda, gastos, salário, descontos ou resultado calculado.
- Endpoint de analytics passou a aceitar os novos eventos, mantendo allowlist e rate limit.
- SEO Intelligence reconhece ferramentas embutidas como abertura/conclusão no funil.
- Painel Administração > SEO Intelligence ganhou tabela de páginas do Google Search Console com cliques, impressões, CTR, posição e leitura operacional (oportunidade de subir / melhorar CTR / acompanhar / pouco sinal).
- Mantida a integração opcional e somente leitura com Search Console. Nenhum número de busca é inventado quando a integração não está configurada.

## Privacidade
O rastreamento novo envia somente evento, rota, origem/UTM, identificadores técnicos e rótulos controlados. O script público não lê `.value`, `FormData` ou conteúdo dos inputs para analytics.

## Testes executados
- `node --check`: 89 arquivos JS/MJS, 0 falhas.
- `tests/seo-intelligence.test.js`: 14 passaram, 0 falharam.
- Sitemap: 51 URLs.
- Rastreamento 11.41: 50/50 páginas públicas (home usa analytics nativo).
- Auditoria estática das 51 URLs: title, description, canonical, exatamente 1 H1, JSON-LD parseável quando presente e assets locais existentes: 0 erros.
- Varredura defensiva dos arquivos alterados para padrões comuns de chaves privadas/segredos: nenhum achado.
- Verificação estática de privacidade do novo tracking: sem leitura de valores dos inputs.

## NÃO TESTADO
- Eventos chegando ao Supabase/Netlify em produção após deploy.
- Credenciais/API do Google Search Console no ambiente Netlify.
- Dados reais de impressões, CTR e posição após o Google processar tráfego.
- Bing Webmaster Tools por API (não foi adicionada integração não verificada).
- Fluxo autenticado completo em produção e atribuição até pagamento real.
- Lighthouse/Core Web Vitals reais.
- Celulares físicos.

## Uso recomendado
Depois do deploy, acumular sinal e usar Administração > SEO Intelligence para priorizar: páginas com impressões e posição 5–20; páginas bem posicionadas com CTR baixo; páginas com tráfego e poucos cliques em CTA; e ferramentas com boa conclusão mas baixa passagem para cadastro.
