# BIVVO — FASE 8.15 · Central Aprenda + motor SEO

Versão: 11.15.0 · Data: 04/10/2026 · **SQL: não é necessário.**
Deploy: por Git ou Netlify CLI (há alteração em Netlify Function: `analytics-event.js`). Arrastar e soltar não atualiza funções.

## Resumo
- Nova área pública `/aprenda/` ("Aprenda com o Bivvo"): hub com busca, 7 categorias e 20 guias.
- Cada guia: breadcrumb, H1 único, resposta rápida, seções, exemplo com valores fictícios, erros comuns, FAQ visível, ferramentas relacionadas, guias relacionados e CTA "Organize isso automaticamente com o Bivvo / Começar grátis" no fim.
- Linkagem: Início → Aprenda → Categorias → Guias → Calculadoras → Cadastro. Calculadoras e páginas SEO antigas agora apontam para os guias. Nenhuma página nova é órfã (cada guia recebe pelo menos 6 links internos).
- Eventos do Growth Center para o funil orgânico, sem dados financeiros.
- Correções de problemas existentes encontrados durante a auditoria (seção própria abaixo).

## Novas URLs (28)
- https://maisbivvo.netlify.app/aprenda/ (hub)
- https://maisbivvo.netlify.app/aprenda/organizacao-financeira/ (categoria: Organização financeira)
  - https://maisbivvo.netlify.app/aprenda/organizacao-financeira/como-organizar-a-vida-financeira/
  - https://maisbivvo.netlify.app/aprenda/organizacao-financeira/como-fazer-controle-financeiro-pessoal/
  - https://maisbivvo.netlify.app/aprenda/organizacao-financeira/planilha-ou-aplicativo-de-controle-financeiro/
  - https://maisbivvo.netlify.app/aprenda/organizacao-financeira/melhor-forma-de-controlar-gastos/
- https://maisbivvo.netlify.app/aprenda/orcamento/ (categoria: Orçamento)
  - https://maisbivvo.netlify.app/aprenda/orcamento/como-organizar-o-salario/
  - https://maisbivvo.netlify.app/aprenda/orcamento/como-dividir-o-salario/
  - https://maisbivvo.netlify.app/aprenda/orcamento/como-fazer-orcamento-mensal/
  - https://maisbivvo.netlify.app/aprenda/orcamento/quanto-posso-gastar-por-mes/
  - https://maisbivvo.netlify.app/aprenda/orcamento/quanto-posso-gastar-por-dia/
- https://maisbivvo.netlify.app/aprenda/cartao-de-credito/ (categoria: Cartão de crédito)
  - https://maisbivvo.netlify.app/aprenda/cartao-de-credito/como-organizar-o-cartao-de-credito/
  - https://maisbivvo.netlify.app/aprenda/cartao-de-credito/como-funciona-o-fechamento-da-fatura/
  - https://maisbivvo.netlify.app/aprenda/cartao-de-credito/como-controlar-compras-parceladas/
- https://maisbivvo.netlify.app/aprenda/economia/ (categoria: Economia)
  - https://maisbivvo.netlify.app/aprenda/economia/como-controlar-gastos-mensais/
  - https://maisbivvo.netlify.app/aprenda/economia/como-economizar-dinheiro-ganhando-pouco/
- https://maisbivvo.netlify.app/aprenda/dividas/ (categoria: Dívidas)
  - https://maisbivvo.netlify.app/aprenda/dividas/como-sair-das-dividas/
  - https://maisbivvo.netlify.app/aprenda/dividas/como-organizar-dividas/
- https://maisbivvo.netlify.app/aprenda/reserva-de-emergencia/ (categoria: Reserva de emergência)
  - https://maisbivvo.netlify.app/aprenda/reserva-de-emergencia/como-montar-reserva-de-emergencia/
  - https://maisbivvo.netlify.app/aprenda/reserva-de-emergencia/quanto-ter-de-reserva-de-emergencia/
- https://maisbivvo.netlify.app/aprenda/planejamento-financeiro/ (categoria: Planejamento financeiro)
  - https://maisbivvo.netlify.app/aprenda/planejamento-financeiro/quanto-guardar-do-salario-por-mes/
  - https://maisbivvo.netlify.app/aprenda/planejamento-financeiro/como-fazer-planejamento-financeiro-pessoal/

## Arquivos criados
- `aprenda/index.html`, 7 × `aprenda/<categoria>/index.html`, 20 × `aprenda/<categoria>/<guia>/index.html`
- `aprenda/aprenda.css` — estilos da Central (mobile-first, fonte local, sem estilos inline)
- `aprenda/aprenda.js` — busca local nos guias (o termo buscado não é enviado a lugar nenhum)
- `seo-track.js` — eventos das páginas públicas (Aprenda, calculadoras e páginas SEO)
- `_seo/build_aprenda.py` — gerador das páginas e do sitemap (domínio em uma única constante `SITE`)
- `_seo/conteudo_a.py`, `_seo/conteudo_b.py` — texto dos 20 guias
- `GOOGLE_SEARCH_CONSOLE_SETUP.md`, `FASE8_15_CHANGELOG.md`

## Arquivos modificados
| Arquivo | Alteração |
|---|---|
| `index.html` | Links para a Central na seção de ferramentas e no final da landing; `?v=11.15.0` |
| `js/util.js` | `VERSION = '11.15.0'` (era 11.13.0, diferente dos assets 11.14.x) |
| `sw.js` | Correção do cache do app shell (ver problemas); versão do cache `bivvo-v11-15-0-fase8-15` |
| `netlify/functions/analytics-event.js` | 5 eventos `seo_*` adicionados à lista permitida |
| `netlify.toml` | `X-Robots-Tag: noindex, nofollow` para `/ferramentas/*` e `/_seo/*` |
| `robots.txt` | Reescrito: libera o conteúdo público, bloqueia `/api/` e `/.netlify/`, referência ao sitemap |
| `sitemap.xml` | 40 URLs (12 existentes + hub + 7 categorias + 20 guias), `lastmod` 2026-10-04 |
| `seo-tools.js` | Eventos das calculadoras passam pelo `seo-track.js`; clique de cadastro corrigido |
| `seo-tools.css` | Classe `.hero.solo` (substitui estilo inline bloqueado) |
| `calculadoras/*/index.html` (4) | `style` inline removido, robots e Twitter Card, `seo-track.js`, links para guias relacionados e para a Central |
| 7 páginas SEO existentes | `seo-track.js`, links para 2 guias relacionados e para a Central, Twitter Card onde faltava, `?v=11.15.0` |

Nada foi alterado em Supabase, autenticação, Mercado Pago, Bivvo IA, Admin, Família, cobrança ou cálculos financeiros do app.

## Eventos analytics (Growth Center)
| Evento | Quando | Dados enviados |
|---|---|---|
| `seo_page_viewed` | Abrir hub, categoria, guia, calculadora ou página SEO (1× por página por sessão) | tipo da página, slug, categoria |
| `seo_article_viewed` | Abrir um guia | slug, categoria |
| `seo_tool_clicked` | Clicar numa ferramenta | página de origem, `tool:<id>` |
| `seo_signup_clicked` | Clicar em "Começar grátis" | página de origem, `signup:<posição>` |
| `seo_related_article_clicked` | Clicar num guia relacionado | página de origem, `rel:<slug>` |

Mapeamento nas colunas existentes de `analytics_events` (sem alteração de banco):
- `route = seo/<tipo>/<slug>`, `content` = categoria ou destino do clique, `error_type` = tipo da página (mesmo uso que as calculadoras já faziam; o Admin só conta erros do evento `client_error`).
- `source`/`medium`/`campaign`/`term`/`landing`/`referrer` = primeira origem do visitante, a mesma chave usada pelo app (`bivvo_first_touch_v1`). Visitas vindas de buscadores ficam com `medium = organic`.
- Identificadores anônimos `bivvo_visitor_id` / `bivvo_session_id` (os mesmos do app), para atribuir o cadastro à visita orgânica.

**Nunca enviados:** valores digitados, resultados de cálculo, saldo, renda, dívidas, fatura, descrições ou dados pessoais.

## SEO técnico
- Todas as 28 páginas: `<title>`, meta description (≤ 160 caracteres), canonical no domínio atual, `robots index,follow`, Open Graph, Twitter Card, H1 único e hierarquia H1 → H2 → H3.
- Dados estruturados: `Article` + `BreadcrumbList` nos guias; `CollectionPage` + `BreadcrumbList` no hub e nas categorias.
- Autor dos guias: organização "Equipe Bivvo". Sem autores, avaliações, certificações, prêmios ou números de usuários inventados.
- **FAQPage não foi usado de propósito.** Desde 2023 o Google exibe esse resultado enriquecido só para sites governamentais e de saúde. As perguntas frequentes continuam visíveis na página.
- Desempenho: sem bibliotecas, sem imagens pesadas (só o ícone já existente, com largura e altura definidas), fonte local com `font-display: swap`, CSS de ~15 KB e JS de ~2 KB na Central. A busca fica oculta sem JavaScript e a lista completa continua visível.

## Problemas existentes encontrados
1. **Eventos das calculadoras nunca eram gravados.** `seo-tools.js` enviava `event_name` (o servidor lê `event`) e não enviava `visitor_id`/`session_id`; o servidor descartava tudo sem erro. **Corrigido.**
2. **Clique em "Calcular" contava como clique de cadastro.** O botão de calcular também tem a classe `.seo-cta`, então `public_tool_signup_clicked` disparava em todo cálculo. **Corrigido** (só conta o link de cadastro).
3. **A calculadora de `/quanto-posso-gastar/` não funcionava em produção:** o script era inline e a CSP bloqueia. **Corrigido** usando o `seo-interactive.js` já existente (mesma lógica da 8.14.3).
4. **As 4 calculadoras tinham `style` inline** bloqueado pela CSP (`style-src-attr 'none'`). **Corrigido** com classe CSS.
5. **Service worker gravava qualquer página pública como se fosse o app.** Ao navegar para um artigo ou calculadora, a resposta era salva no cache como `./index.html`; com o PWA offline, o app abriria essa página. **Correção mínima:** só `/` e `/index.html` atualizam o app shell; páginas públicas ficam em cache pela própria URL. A troca de versão do cache limpa caches já afetados.
6. **Versão inconsistente** (`util.js` 11.13.0 × assets 11.14.x). **Unificada em 11.15.0.**
7. **`lastmod` do sitemap no futuro** (2026-10-05). Ajustado para 2026-10-04.
8. **Não alterado, aguardando decisão:** `/quanto-posso-gastar/` e `/quanto-posso-gastar-hoje/` têm o mesmo título, a mesma descrição e o mesmo conteúdo, e competem entre si no Google. Recomendação: redirecionamento 301 de `/quanto-posso-gastar/` para `/quanto-posso-gastar-hoje/` e retirada da primeira do sitemap.

## Validações executadas
**Estáticas (script de validação sobre o pacote inteiro):**
- 41 páginas HTML, 1.782 links internos verificados, nenhum 404 dentro do pacote.
- 39 blocos JSON-LD válidos; canonical correto e um único H1 em todas as páginas públicas.
- Nenhum script inline executável e nenhum atributo `style`/`on*` nas páginas públicas.
- Sitemap: 40 URLs, todas existentes, sem login, Admin, API ou ferramentas internas; todas as páginas públicas estão no sitemap.
- `robots.txt` com referência ao sitemap; caminhos de CSS (inclusive `url()` da fonte) e JS conferidos.
- Todo guia recebe pelo menos 6 links internos de outras páginas.
- Sintaxe JS (`node --check`) de `seo-track.js`, `aprenda.js`, `seo-tools.js`, `sw.js` e `analytics-event.js`; `netlify.toml` válido.

**No navegador (Chromium) com a CSP de produção do `netlify.toml`:**
- Larguras 320, 375, 390, 430, 540, 600, 640, 768, 1024 e 1280 px: sem rolagem horizontal, sem botão cortado, sem violação de CSP.
- Busca da Central: filtra por palavra, ignora acentos ("cartao" encontra "cartão"), mostra aviso quando não há resultado e aceita `/aprenda/?q=`.
- Todas as calculadoras calculam com a CSP ativa (incluindo `/quanto-posso-gastar/`, que antes falhava).
- Funil simulado vindo do Google: artigo → guia relacionado → calculadora → cadastro. Eventos recebidos na ordem certa, com `source = google.com` e `medium = organic`, sem nenhum valor financeiro.
- App: landing abre com os links da Central e a versão 11.15.0, sem violação de CSP.

**Não foi possível testar aqui:** login real, cadastro, Supabase, Mercado Pago e Bivvo IA. O ambiente de teste não acessa a internet externa, e o projeto original apresenta exatamente o mesmo comportamento nesse ambiente. Esses fluxos não foram alterados; teste-os no deploy de pré-visualização da Netlify antes de publicar.

## Para criar ou editar guias
1. Edite `_seo/conteudo_a.py` ou `_seo/conteudo_b.py` (links internos: `[[slug|texto]]`, ferramentas: `[[tool:id|texto]]`).
2. Rode `python3 _seo/build_aprenda.py` na raiz do projeto. O script recusa links para guias ou ferramentas inexistentes.
3. Faça o deploy. O sitemap é atualizado junto.
