# Bivvo 11.42.3 — Pagamentos de empréstimos editáveis

## Objetivo
Permitir corrigir lançamentos da aba Empréstimos sem quebrar a separação entre principal e juros. A versão anterior tornava pagamentos confirmados imutáveis; nesta versão o histórico volta a ser editável com recálculo do contrato.

## O que mudou
- Pagamentos do histórico do empréstimo agora têm **Editar** e **Excluir**.
- O editor permite corrigir separadamente:
  - juros recebidos;
  - principal recebido;
  - data;
  - forma de recebimento.
- Um pagamento pode ser transformado em **somente juros** deixando o principal em R$ 0,00.
- Novo atalho **Receber só juros** nos contratos com juros pendentes.
- Ao editar ou excluir pagamento, o Bivvo recalcula principal restante, juros pendentes e status do contrato usando o livro-razão de ciclos/pagamentos.
- Lançamentos gerados no extrato por pagamentos de empréstimo não são editados isoladamente: o botão abre o editor do pagamento correspondente para evitar dessincronização.
- É possível excluir um contrato que já tenha pagamentos, com confirmação forte `EXCLUIR`; pagamentos, lançamentos e ciclos ligados ao contrato são removidos juntos.
- Contratos já movimentados continuam protegendo os termos estruturais (principal/taxa/periodicidade) no formulário de contrato; a correção financeira é feita no histórico de pagamentos.
- Pagamentos antigos normalizados deixam de receber flags `locked/immutable`.
- Novo módulo puro `js/loan-ledger.js` para reconstrução segura de saldo de principal/juros e compatibilidade com dados legados.

## Compatibilidade com pagamentos antigos
Quando um empréstimo legado não possui um ciclo inicial no livro-razão, a primeira correção cria um ciclo sintético a partir dos valores já existentes antes de recalcular. Isso evita simplesmente zerar obrigações antigas ao editar um pagamento.

## Versão e cache
- Versão pública: `11.42.3`
- `app.css?v=11.42.3`
- `js/main.js?v=11.42.3`
- Service Worker: `bivvo-v11-42-3-loan-editable-payments`

## Testes executados
### Funcionais / regressão automatizada
- 12 arquivos de testes Node executados sem falhas.
- 100 asserções/testes reportados como aprovados.
- Teste específico de empréstimos: 9/9.
- Teste de versão/cache/Supabase: 8/8.
- Regressões de finanças, crescimento/distribuição, SEO Intelligence, recuperação e conversão continuaram passando.

### Sintaxe
- 116 arquivos `.js`/`.mjs` verificados com `node --check`.
- 0 erros de sintaxe.

### SEO estático
- 55 URLs no sitemap.
- 55 titles únicos.
- 55 canonicals únicos.
- 55 descriptions únicas.
- 0 erros no teste estático existente.

### Smoke HTTP local
Respostas HTTP 200 verificadas para:
- `/`
- `/index.html`
- `/js/views/loans.js`
- `/js/loan-ledger.js`
- `/js/views/forms.js`
- `/app.css`
- `/sw.js`

### Segurança defensiva
Nos arquivos alterados:
- nenhum padrão de `SUPABASE_SECRET_KEY`, `service_role`, chave privada, token GitHub ou chave de pagamento encontrado;
- nenhum uso novo de `eval`, `new Function`, `document.write`, `innerHTML =` ou `insertAdjacentHTML`;
- valores financeiros continuam tratados como números, sem serem colocados em URLs;
- lançamentos de principal/juros não podem ser corrigidos isoladamente pelo extrato, reduzindo risco de inconsistência financeira.

### Performance estática
Tamanho aproximado dos arquivos mais relevantes:
- `js/views/loans.js`: 31,8 KB bruto / 8,4 KB gzip;
- `js/loan-ledger.js`: 3,7 KB bruto / 1,1 KB gzip;
- não foi adicionada biblioteca externa.

## NÃO TESTADO
- Fluxo completo em produção após deploy no Netlify.
- Edição/exclusão sincronizada entre dois dispositivos reais ao mesmo tempo.
- iPhone/Android físicos.
- Interação manual de todos os sheets/modais em navegador real.
- Core Web Vitals reais.
- Conflitos de sincronização Supabase durante edição simultânea do mesmo pagamento.

## Teste manual recomendado após deploy
1. Criar ou abrir um empréstimo.
2. Registrar um pagamento comum (juros + principal).
3. Abrir Histórico → Editar.
4. Alterar o principal e os juros e salvar.
5. Confirmar que Principal atual e Juros pendentes foram recalculados.
6. Editar novamente e deixar Principal = R$ 0,00 para transformar em pagamento somente de juros.
7. Excluir esse pagamento e confirmar que os saldos retornam corretamente.
8. Abrir o lançamento correspondente pela aba Lançamentos e confirmar que ele abre o editor do pagamento do empréstimo.
9. Testar o novo botão **Receber só juros**.
