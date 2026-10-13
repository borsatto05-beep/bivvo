# Google Search Console — passo a passo para o Bivvo

Site atual: `https://maisbivvo.netlify.app`
Sitemap: `https://maisbivvo.netlify.app/sitemap.xml` (40 URLs na Fase 8.15)

Tudo aqui depende da sua conta Google e precisa ser feito por você. Nada no projeto automatiza essas ações.

Expectativa realista: páginas novas costumam levar de alguns dias a algumas semanas para aparecer, e o Google decide sozinho o que indexa e em que posição. SEO não garante posição; o objetivo é dar ao Google tudo de que ele precisa para avaliar bem o conteúdo.

---

## 1. Adicionar o site

1. Acesse https://search.google.com/search-console e entre com a conta Google que vai cuidar do Bivvo.
2. Clique em **Adicionar propriedade**.
3. Escolha **Prefixo do URL** e digite exatamente `https://maisbivvo.netlify.app/`.

Por que "Prefixo do URL" e não "Domínio": a opção Domínio exige criar um registro no DNS, e o DNS de `netlify.app` pertence à Netlify. Quando o Bivvo tiver domínio próprio, use a opção **Domínio** para ele (veja a seção 10).

## 2. Verificar a propriedade

Escolha **um** dos métodos abaixo. O recomendado é o arquivo HTML, porque não mexe no `index.html` do app.

**Opção A — arquivo HTML (recomendado)**
1. Na tela de verificação, baixe o arquivo (algo como `google1234abcd.html`).
2. Coloque o arquivo na **raiz do projeto**, ao lado do `index.html`.
3. Faça o deploy.
4. Abra `https://maisbivvo.netlify.app/google1234abcd.html` no navegador para confirmar que ele abre.
5. Volte ao Search Console e clique em **Verificar**.
6. **Nunca apague esse arquivo**, nem em deploys futuros. Sem ele, a propriedade perde a verificação.

**Opção B — tag HTML**
1. Copie a tag `<meta name="google-site-verification" content="...">`.
2. Cole dentro do `<head>` do `index.html`, junto das outras tags `<meta>`.
3. Deploy e clique em **Verificar**.

A tag `<meta>` não é script, então não esbarra na CSP do Bivvo.

## 3. Enviar o sitemap

1. No menu lateral, abra **Sitemaps** (em Indexação).
2. Em "Adicionar um novo sitemap", digite `sitemap.xml` e clique em **Enviar**.
3. Depois de algumas horas ou dias, o status deve aparecer como **Sucesso**, com cerca de 40 URLs descobertos.

Sempre que novos guias forem criados, o sitemap é regenerado pelo script `_seo/build_aprenda.py`. Não é preciso reenviar o sitemap: o Google relê o arquivo periodicamente.

## 4. Usar a inspeção de URL

1. Cole uma URL completa na barra de pesquisa do topo do Search Console, por exemplo:
   `https://maisbivvo.netlify.app/aprenda/orcamento/quanto-posso-gastar-por-dia/`
2. O resultado mostra se a URL **está no Google** ou **não está no Google** e por quê.
3. Clique em **Testar URL publicado** para ver como o Google acessa a página agora.
4. Em **Ver página testada**, confira a captura de tela e a aba **Mais informações** (recursos não carregados e mensagens do console).

O que conferir em cada página nova:
- "URL canônico declarado pelo usuário" igual à própria página.
- "Indexação permitida? Sim".
- Na seção **Aprimoramentos**, os dados estruturados de Breadcrumb aparecem válidos.

## 5. Solicitar indexação

1. Depois de inspecionar uma URL, clique em **Solicitar indexação**.
2. Existe um limite diário de pedidos. Use com as páginas mais importantes primeiro:
   1. `/aprenda/`
   2. `/aprenda/orcamento/quanto-posso-gastar-por-dia/`
   3. `/aprenda/orcamento/como-organizar-o-salario/`
   4. `/aprenda/reserva-de-emergencia/quanto-ter-de-reserva-de-emergencia/`
   5. `/aprenda/cartao-de-credito/como-funciona-o-fechamento-da-fatura/`
   6. `/aprenda/dividas/como-sair-das-dividas/`
   7. As 7 páginas de categoria
3. Não peça a mesma URL várias vezes: isso não acelera nada. As demais páginas serão encontradas pelo sitemap e pelos links internos.

## 6. Analisar consultas

Menu **Desempenho → Resultados da pesquisa**.

1. Ative as quatro métricas no topo: **Cliques**, **Impressões**, **CTR médio** e **Posição média**.
2. Escolha o período, por exemplo **Últimos 3 meses**. Nas primeiras semanas os números serão pequenos.
3. Use as abas:
   - **Consultas:** o que as pessoas digitaram quando o Bivvo apareceu.
   - **Páginas:** quais URLs apareceram.
   - **Dispositivos:** celular × computador.
4. Para ver só a Central, clique em **+ Novo → Página → URLs que contêm** e digite `/aprenda/`.
5. Para ver as consultas de um guia específico, clique na URL na aba Páginas e depois volte para a aba Consultas.

Cruze com o Growth Center: os eventos `seo_page_viewed`, `seo_tool_clicked` e `seo_signup_clicked` mostram o que acontece **depois** do clique no Google. A primeira origem dessas visitas aparece como `google.com` com meio `organic`.

## 7. Identificar páginas perto do Top 10

São as páginas com mais potencial de crescimento rápido.

1. Em Desempenho, aba **Consultas**, deixe a métrica **Posição média** ativa para ela aparecer na tabela.
2. Clique no ícone de filtro da tabela e filtre **Posição maior que 8**. Depois ordene por **Impressões**.
3. Anote as consultas com posição média entre **8 e 20** e com bastantes impressões.
4. Para cada uma, abra a página que aparece para essa consulta e avalie:
   - A página responde exatamente o que a pessoa buscou, logo no começo? Se não, ajuste a "Resposta rápida".
   - Falta uma seção sobre essa variação da pergunta? Acrescente uma seção curta e útil.
   - Outros guias relacionados apontam para essa página com um texto de link claro?
5. Faça uma mudança por vez e espere de 2 a 4 semanas antes de avaliar o efeito.

Não transforme a página em repetição da palavra-chave. A melhora vem de responder melhor, não de repetir mais.

## 8. Acompanhar o CTR

CTR é a porcentagem de pessoas que clicaram depois de ver o Bivvo no Google.

1. Em Desempenho, aba **Páginas**, ative **CTR médio** e **Posição média**.
2. Procure páginas com **muitas impressões, posição razoável (até ~10) e CTR baixo** em comparação com as outras páginas em posição parecida.
3. Para essas páginas, revise o `seo_title` e a `desc` do artigo em `_seo/conteudo_a.py` ou `_seo/conteudo_b.py`:
   - O título promete exatamente o que a página entrega?
   - A descrição diz o que a pessoa vai conseguir fazer?
4. Rode `python3 _seo/build_aprenda.py`, faça o deploy e anote a data da mudança.
5. Compare o CTR do mês anterior com o mês seguinte usando **Comparar** no seletor de datas.

O Google pode reescrever títulos e descrições exibidos. Se isso acontecer com frequência, normalmente o título não corresponde bem ao conteúdo.

## 9. Encontrar oportunidades de conteúdo

1. **Perguntas sem página própria:** em Consultas, filtre **Consulta → contém** `como`, `quanto`, `qual` e `posso`. Perguntas com impressões que nenhum guia responde diretamente são candidatas a novos guias.
2. **Página errada para a consulta:** se uma consulta aparece para uma página que não é a melhor resposta, crie ou melhore a página certa e ligue as duas com um link interno.
3. **Canibalização:** clique em uma consulta e abra a aba Páginas. Se duas páginas do Bivvo aparecem alternando para a mesma consulta, elas estão competindo. Um caso já conhecido: `/quanto-posso-gastar/` e `/quanto-posso-gastar-hoje/` têm conteúdo praticamente igual (veja o FASE8_15_CHANGELOG.md).
4. **Ferramentas:** consultas com "calculadora", "simulador" ou "calcular" indicam onde uma nova ferramenta pública faria sentido.

Regra combinada para a próxima fase: expandir só depois de os guias atuais mostrarem impressões e cliques. Nada de gerar centenas de páginas automaticamente.

## 10. Quando migrar para domínio próprio

1. Adicione o novo domínio como propriedade **Domínio** (verificação por registro TXT no DNS).
2. No projeto, troque `SITE` em `_seo/build_aprenda.py`, rode o script e atualize canonicals das páginas antigas, `robots.txt` e o `index.html`.
3. Configure redirecionamento **301** de todas as URLs antigas para as novas, mantendo o mesmo caminho.
4. Na propriedade antiga, use **Configurações → Mudança de endereço**.
5. Envie o novo sitemap na nova propriedade e mantenha as duas propriedades por alguns meses.

Não troque o canonical para um domínio que ainda não está publicado.

## Rotina sugerida

| Quando | O que olhar |
|---|---|
| 1ª semana | Sitemap com "Sucesso", inspeção das páginas principais, pedidos de indexação |
| Todo mês | Impressões e cliques de `/aprenda/`, páginas na posição 8–20, CTR baixo |
| A cada 3 meses | Novas perguntas sem página, canibalização, guias para atualizar |

## Conectar ao Growth Center (Fase 8.16 — opcional)

Sem esta etapa, a aba **SEO Intelligence** mostra apenas o aviso "Conecte o Google Search Console…". O Bivvo nunca estima impressões, posição, CTR ou consultas.

1. No Google Cloud, crie um projeto e ative a **Google Search Console API**.
2. Crie uma **conta de serviço** e gere uma chave JSON.
3. No Search Console, abra a propriedade do Bivvo → Configurações → Usuários e permissões → adicione o e-mail da conta de serviço com permissão **Restrita** (leitura).
4. No Netlify → Site configuration → Environment variables, crie:
   - `GSC_SITE_URL` = `https://maisbivvo.netlify.app/` (exatamente como a propriedade aparece; para propriedade de domínio use `sc-domain:seudominio.com.br`)
   - `GSC_CLIENT_EMAIL` = `client_email` do JSON
   - `GSC_PRIVATE_KEY` = `private_key` do JSON (pode colar com os `\n`)
5. Faça um novo deploy. A aba passa a mostrar cliques, impressões, CTR, posição média e as principais consultas (dados do Google têm ~2 dias de atraso).

A chave fica só no servidor (Netlify Function `admin`), que já exige login de administrador.
