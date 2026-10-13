# Bivvo 11.42.4 — correção de console, CSP e módulo de empréstimos

- Reescrito `loanDetail()` em `js/views/loans.js` para remover a expressão gigante da linha que aparecia no erro do navegador.
- Removidos `?.` e `??` de `loans.js` para máxima compatibilidade do parser e diagnóstico mais previsível.
- `main.js` agora importa `loans.js?v=11.42.4`, forçando URL nova do módulo e evitando reutilização de módulo antigo em cache.
- Versão visual e cache do PWA atualizados para 11.42.4.
- CSP permanece estrita: nenhum `unsafe-inline` foi adicionado. Foram acrescentados apenas os hashes exatos indicados pelo Chrome para o conteúdo inline criado pelo pixel/iframe de terceiro (`about:srcdoc`).
- Funcionalidade de editar/excluir pagamentos e receber apenas juros foi preservada.

## Testes executados

- `node --check`: 105 arquivos JS/MJS, 0 falhas.
- 14 arquivos de teste executados, 0 arquivos com falha.
- Teste específico 11.42.4: 12/12 passou.
- Regressão financeira: 42/42 passou.
- Empréstimos: 9/9 passou.
- Crescimento/distribuição, SEO Intelligence, recovery/copiloto e versão/cache: passaram nos testes automatizados existentes.
- Smoke HTTP local: `/`, `/index.html`, `main.js?v=11.42.4`, `loans.js?v=11.42.4` e `/sw.js` retornaram HTTP 200.
- Varredura defensiva nos arquivos alterados: nenhum padrão crítico de segredo/chave privada encontrado.

## NÃO TESTADO

- Console real após deploy no Netlify.
- Execução real do TikTok Pixel/`about:srcdoc` em produção depois dos novos hashes CSP.
- PWA já instalado em iPhone/Android físico.
- Sincronização real de empréstimos entre dois dispositivos.

## Observação sobre CSP

A correção **não** adiciona `unsafe-inline`. Foram autorizados somente os hashes exatos informados pelo navegador para os dois conteúdos inline bloqueados no `about:srcdoc`, mantendo `script-src-attr 'none'` e `style-src-attr 'none'`.
