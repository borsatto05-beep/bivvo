# BIVVO — FASE 8.16 · SEO Intelligence + correção do motor "Quanto posso gastar"

Versão: **11.16.0** · Data: 05/10/2026 · **SQL: não é necessário.**
Deploy: Git ou `netlify deploy --prod` (há Netlify Function alterada: `admin.js`). Arrastar e soltar não atualiza funções.

## Correções financeiras

### Fatura/conta vencendo no dia do próximo dinheiro ficava de fora (causa confirmada)
- `spendable()` usava `data < dataLimite` para contas e faturas. Com o próximo dinheiro em 10/10, tudo que vence **no dia 10** era ignorado (caso real: Itaú Pai R$ 316,34).
- Nova regra única `dueBy(data, limite)`: `vencimento <= dataLimite` entra; depois disso não. Datas são texto local AAAA-MM-DD, então vale na virada de mês e de ano (testado).
- Contas atrasadas continuam entrando. O que vence até 15 dias depois do próximo dinheiro aparece separado como "Depois do próximo recebimento" e **não** reduz o disponível.

### "Saldo hoje" que não batia com o banco (−R$ 600,71)
- Auditado: o saldo é a soma do que foi registrado como pago até hoje. **Não há dupla contagem de cartão** (compra no cartão não mexe no saldo; o dinheiro sai uma vez, ao pagar a fatura — teste 10).
- Defeito real na fonte: "Informar meu saldo de hoje" **somava** um novo saldo inicial em vez de **definir** o saldo, e o botão sumia quando já existia qualquer entrada paga. Com histórico incompleto, o saldo calculado ficava negativo sem forma de correção.
- Agora "Quanto você tem hoje?" cria um **ajuste** (`kind: 'opening'`, positivo ou negativo) para o saldo bater com o valor informado. O ajuste não conta como renda nem como gasto (`isSpend` exclui ajustes). Acesso permanente em "Entenda o cálculo → Ajustar quanto tenho hoje". O onboarding usa a mesma âncora.
- Nova detecção: pagamento de fatura lançado como gasto (Pix/débito/boleto) enquanto a mesma fatura segue em aberto (valor ±2% e datas próximas). O app aponta e oferece "Considerar a fatura paga"; nunca corrige sozinho.
- Resultado exatamente zero não aparece mais como "−R$ 0,00" (corrigido no motor e no formatador de moeda).

### Fonte única
- `F.spendable()` continua sendo o único cálculo. Ganhou `commitments`, `state` (positive/zero/negative), `after` e `warnings`. Campos usados pelo Bivvo IA foram mantidos.
- `F.spendableExplanation()` agora devolve resumo (3 linhas + total), detalhes (cada conta, fatura e meta) e o bloco "depois". Formato antigo (`lines`) mantido por compatibilidade.

## UX
- Início em 3 estados:
  - Positivo: **"VOCÊ PODE GASTAR · R$ X por dia · até 10 de outubro · Sem comprometer suas contas e sua meta."**
  - Zero: "Você chegou ao limite."
  - Negativo: "⚠️ Até seu próximo dinheiro · Você não deve gastar mais agora · Faltam R$ X para cobrir seus compromissos até 10 de outubro."
  - Em todos: botão "Entenda o cálculo".
- "Como chegamos nesse número" reescrito ("resumo quando olho, detalhes quando toco"): Você tem hoje · Compromissos antes de receber · Meta que ainda quer guardar · **Disponível até receber** · Limite seguro por dia. "Ver cálculo completo" abre Contas, Faturas, Meta e "Depois do próximo recebimento".
- Texto do cartão encurtado: "Compras no cartão entram no cálculo quando a fatura precisa ser paga." + "Saiba mais".
- Correção de um problema anterior: o CSS da Fase 8.13 tinha `\n` literal e o card "Meta R$ 1M" perdia o estilo.

## SEO Intelligence (Growth Center → aba "SEO Intelligence")
- KPIs: visitantes orgânicos, visitas em artigos, quem abriu calculadora a partir de conteúdo, cliques para cadastro, cadastros, ativados, trials, checkouts e pagantes do SEO.
- Taxas: artigo→ferramenta, ferramenta→cadastro, artigo→cadastro, cadastro→ativação, ativação→trial, trial→checkout, checkout→pago, SEO→pagante.
- Ranking de conteúdos ordenado por pagantes, cadastros e ativações (não por visitas); tabela de calculadoras; comparação por categoria.
- Oportunidades geradas só com dados do Bivvo e só a partir de 20 visitantes por página.
- Atribuição: visitante SEO (`seo_page_viewed`) → `signup_completed` do mesmo `visitor_id` ou com primeira entrada (`landing`) numa página pública → `user_id` → ativação, trial (analytics + product_events), checkout e pagamento aprovado. A página de origem é a última página SEO vista antes do cadastro.
- Google Search Console: integração opcional e só leitura (`netlify/lib/search-console.js`). Sem credenciais, mostra "Conecte o Google Search Console…" e nenhum número.
- Mobile: tabelas viram cartões abaixo de 720px; sem rolagem lateral.

## SEO técnico
- `/quanto-posso-gastar/` era cópia de `/quanto-posso-gastar-hoje/` (mesmo título, descrição e conteúdo, cada uma com canonical própria). Unificado:
  - 301 `/quanto-posso-gastar` e `/quanto-posso-gastar/*` → `/quanto-posso-gastar-hoje/`;
  - pasta removida;
  - links internos atualizados em 37 páginas (Aprenda, calculadoras, landing, páginas SEO) e no gerador `_seo/build_aprenda.py`;
  - sitemap sem a URL antiga (39 URLs, nenhuma duplicada ou inexistente).
- `/tests/*` com `X-Robots-Tag: noindex, nofollow`.

## Analytics e privacidade
- Reutiliza os eventos existentes (`seo_*`, `public_tool_*`, `signup_completed`, `activation_completed`, `trial_started`, `checkout_started`) e `billing_payments` aprovados.
- A consulta do painel lê só: visitante, usuário, evento, rota, meio, conteúdo, landing e data. Dos pagamentos, lê só usuário e status, sem valores.
- Nenhum saldo, renda, valor de compra, fatura, estabelecimento ou resultado de calculadora é lido ou enviado.
- Nenhum evento novo e nenhuma alteração de banco.

## Testes
- `node tests/finance-regression.mjs` → **42/42**:
  - casos 1 a 10;
  - contas no limite;
  - virada de mês e de ano;
  - zero sem "−0";
  - dupla contagem de fatura;
  - caso real (Itaú Pai incluída, Nubank fora, disponível = informado − 316,34 − 100, calculado a partir das entradas).
- `node tests/seo-intelligence.test.js` → **14/14**, com eventos sintéticos.
- Navegador (Chromium):
  - Início e explicação em 360, 375, 390 e 430px, sem rolagem lateral;
  - estados positivo, zero e negativo;
  - ajuste de saldo pela tela (saldo = valor informado; gasto do mês inalterado);
  - todas as abas do app;
  - aba SEO Intelligence com dados simulados em 390 e 1280px;
  - nenhum erro de JavaScript.
- Sintaxe de todos os JS (módulos e funções), imports e requires, links internos, sitemap, CSP e redirects conferidos.

## Arquivos
**Novos:**
- `netlify/lib/seo-intelligence.js`
- `netlify/lib/search-console.js`
- `tests/finance-regression.mjs`
- `tests/seo-intelligence.test.js`
- `FASE8_16_CHANGELOG.md`

**Modificados:**
- `js/finance.js`, `js/util.js`, `js/views/home.js`, `js/views/onboarding.js`, `js/views/admin.js`, `js/admin-api.js`
- `netlify/functions/admin.js`, `netlify.toml`, `app.css`, `sw.js`, `seo-track.js`, `sitemap.xml`
- `index.html`, `_seo/build_aprenda.py`, `GOOGLE_SEARCH_CONSOLE_SETUP.md`
- Páginas com link ou versão atualizados: `quanto-posso-gastar-hoje/`, `controle-financeiro-pessoal/`, `app-controle-financeiro/`, `planejamento-financeiro-pessoal/`, `orcamento-domestico/`, `organizar-cartao-de-credito/`, 28 páginas em `aprenda/` e 4 em `calculadoras/`.

**Removido:** `quanto-posso-gastar/index.html`, substituído pelo 301.
