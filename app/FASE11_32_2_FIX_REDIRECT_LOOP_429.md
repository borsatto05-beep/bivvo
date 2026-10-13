# Fase 11.32.2 — correção de loop/HTTP 429 nas páginas SEO

## Causa corrigida
A 11.32.1 adicionou redirects explícitos das quatro URLs SEO sem barra final para as mesmas URLs com barra final, apesar de as páginas já existirem como diretórios físicos com `index.html`. No Netlify isso é desnecessário e pode competir com a normalização/Pretty URLs da plataforma, gerando cadeia/loop de redirects e excesso de requisições.

## Alteração
- Removidos redirects `/pagina -> /pagina/` das quatro páginas SEO.
- Mantido apenas o alias legado `como-organizar-salario-curto -> como-organizar-salario-que-nao-da/`.
- As quatro páginas continuam físicas (`<slug>/index.html`).

## URLs canônicas
- /como-sair-do-aperto-financeiro/
- /dinheiro-nao-da-para-pagar-tudo/
- /como-sair-das-dividas-ganhando-pouco/
- /como-organizar-salario-que-nao-da/
