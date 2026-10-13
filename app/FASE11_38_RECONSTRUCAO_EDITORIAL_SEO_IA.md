# Bivvo 11.38 — Reconstrução Editorial SEO + IA

## Objetivo
Elevar todas as páginas públicas indexáveis do sitemap de páginas SEO simples para experiências editoriais mais úteis, visuais e orientadas à ação.

## Implementado
- Camada editorial compartilhada em 50 páginas públicas (todas as URLs do sitemap exceto a home do app).
- Bloco “Entenda em 1 minuto” adaptado ao tema da URL.
- Infográficos originais Bivvo por cluster: controle, aperto, planilha/gastos, salário, cartão e reserva/economia.
- Sequência prática em 3 passos, CTA contextual para diagnóstico e transparência editorial.
- Vídeo educativo oficial do Banco Central do Brasil em páginas de conteúdo/guia, com click-to-load e youtube-nocookie para reduzir custo/perda de performance antes da interação.
- Calculadoras, diagnóstico e páginas institucionais não recebem vídeo externo para evitar distração e custo desnecessário.
- Barra de progresso de leitura.
- Imagens com loading=lazy, dimensões declaradas e SVG local leve.
- CSS/JS compartilhados para evitar duplicar código pesado em cada página.
- Atualização de dateModified existente para 2026-10-06.

## Princípios
- Conteúdo útil antes do CTA.
- Sem depoimentos, estatísticas ou promessas inventadas.
- Exemplos apresentados como exemplos.
- Fontes/regras oficiais devem aparecer nas páginas em que o cálculo depende delas.
- Visual próprio é priorizado sobre foto de banco de imagem sem valor informativo.

## Testes executados
- Sitemap: 51 URLs encontradas.
- Camada editorial: 50/50 páginas públicas não-home enriquecidas.
- Vídeo educativo: 35 páginas de conteúdo, carregado somente após clique.
- SEO estático: title, description e exatamente 1 H1 verificados nas URLs do sitemap.
- JSON-LD: parse validado estaticamente.
- JavaScript: `node --check` em todos os arquivos JS do projeto.
- Segurança defensiva: varredura de padrões comuns de segredo na camada alterada; nenhum segredo encontrado.
- Performance estática: CSS editorial ~5 KB, JS <2 KB, SVGs locais leves; lazy loading aplicado.

## NÃO TESTADO
- Renderização visual no deploy real do Netlify.
- iPhone/Android físicos.
- Core Web Vitals reais (LCP/INP/CLS) em campo.
- Reprodução do YouTube em todos os navegadores/dispositivos.
- Indexação/ranking/citações por Google, Bing, ChatGPT ou Copilot.
- Conversão real após publicação.

## Próximo passo após deploy
Validar visualmente amostra de páginas por cluster, executar inspeção de URL, reenviar sitemap/IndexNow e acompanhar Search Console/Bing por consultas, impressões, CTR, citações de IA e conversões.
