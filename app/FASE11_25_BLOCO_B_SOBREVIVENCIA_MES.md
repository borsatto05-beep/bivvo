# Bivvo 11.25.0 — Bloco B: Sobrevivência do mês

Implementado sobre a 11.24.0, preservando o Bloco A e o fluxo de exclusão de conta.

## Entregas
- Plano até a próxima entrada: data/referência, dias e limite diário recalculado a partir de `finance.spendable()`.
- Dinheiro protegido: separação visual de contas, faturas, meta de segurança e dinheiro realmente livre, sem criar saldo paralelo.
- Prevenção de saldo negativo: usa `finance.dailyForecast(45)` para localizar a primeira quebra projetada, mostrar déficit de referência, eventos conhecidos do dia e aviso quando há componente estimado.

## Arquitetura
- Novo `survivalPlan()` em `js/copilot.js`.
- UI integrada em `js/views/copilot.js`.
- Sem nova chave de armazenamento e sem migração de dados.
- Nenhuma alteração em `confirmSheet()`, `deleteAccount()` ou `netlify/functions/account-delete.js`.

## Cache/PWA
- Versão 11.25.0.
- Service Worker `bivvo-v11-25-0-block-b`.
