# Bivvo Premium — Fase 2

## Objetivo
Converter valor já existente em benefícios pagos claros, sem retirar funções que já eram gratuitas e sem alterar a arquitetura principal.

## Implementado
- Paywalls contextuais para previsão de 30 dias (Plus), 90 dias (Pro), análise avançada do Posso comprar? (Pro) e visão de parcelas de 12 meses (Plus).
- Previsão mantém 7 dias grátis; Plus amplia para 30 dias; Pro amplia para 90 dias.
- Posso comprar? mantém o veredito atual para todos e acrescenta bloco de análise Pro.
- Cartões mantêm o limite seguro existente e acrescentam visão premium de comprometimento futuro.
- Página Premium reescrita com benefícios concretos.
- Teste Pro de 7 dias sem cartão e sem cobrança automática. Uma utilização por conta, validada no servidor pelo entitlement `trial_pro`.
- Plano anual: Plus R$ 99/ano e Pro R$ 199/ano. Família continua indisponível enquanto não existir espaço familiar.
- Alertas inteligentes por push para assinantes: risco de saldo negativo e cartão com >=80% de comprometimento, usando apenas o resumo calculado no aparelho.
- Analytics preservado; `trial_started` é registrado no servidor.

## Segurança
- Nenhuma chave foi movida para o frontend.
- RLS não foi desativada.
- CSP não recebeu `unsafe-inline`.
- Teste Pro é concedido pelo servidor autenticado e tem rate limit.
- Família continua bloqueado no backend.

## Banco / ambiente
- Nenhum SQL novo.
- Nenhuma variável de ambiente nova.

## Arquivos principais alterados
- js/plans.js
- js/billing.js
- js/views/pro.js
- js/views/forecast.js
- js/views/simulator.js
- js/views/cards.js
- js/push.js
- netlify/functions/billing-create.js
- netlify/functions/push-cron.js
- netlify/lib/messages.js
- netlify.toml
- app.css

## Arquivo novo
- netlify/functions/trial-start.js

## Testes de produção recomendados
1. Grátis: previsão 7 dias abre; 30/90 dias mostram paywall contextual.
2. Plus: previsão 30 dias e visão ampliada do cartão abrem.
3. Pro: previsão 90 dias e análise Pro do simulador abrem.
4. Conta nunca testada: teste Pro libera 7 dias sem abrir Mercado Pago.
5. Mesma conta: segunda tentativa de trial é recusada.
6. Checkout mensal Plus/Pro continua abrindo Mercado Pago.
7. Checkout anual Plus/Pro abre com R$ 99/R$ 199 e ciclo de 12 meses.
8. Família não permite checkout.
9. Push premium: validar em conta paga com risco previsto/cartão >=80%.
10. Scanner, câmera, microfone, login, Admin e cancelamento continuam funcionando.
