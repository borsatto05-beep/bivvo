# Bivvo 8.17 — Motor de Conversão e Receita

## Implementado
- Motor central `js/conversion-engine.js` com regras por recurso, plano recomendado, cooldown de 3 dias para sugestões automáticas e frequency cap de 1 sugestão automática por sessão.
- Paywall continua disponível por ação explícita do usuário, mesmo durante cooldown.
- Eventos de funil adicionados: `conversion_opportunity_shown`, `conversion_opportunity_clicked`, `paywall_closed`, `plans_viewed`, `plan_selected`, `checkout_created`, `checkout_returned`, `subscription_activated`.
- Growth Center ampliado com oportunidades, cliques, paywalls, planos vistos/selecionados, checkout, pagamentos, taxas por etapa, plano e gatilho.
- Preços continuam centralizados em `js/plans.js`: Plus R$ 9,90, Pro R$ 19,90, Família R$ 39,99.
- Checkout existente do Mercado Pago preservado; backend/webhook permanece fonte de verdade para pagamento.
- Nenhum saldo, renda, descrição, conta ou valor financeiro pessoal é enviado na telemetria de conversão.

## Regras
- Situação financeira negativa não dispara oferta.
- Gatilhos são funcionais: tentativa de recurso premium, interesse em Família ou navegação explícita de planos.
- Sugestão automática: no máximo uma por sessão e cooldown de 3 dias após fechamento.
- Ação explícita em recurso premium pode reabrir o paywall.

## Arquivos principais
- Novo: `js/conversion-engine.js`
- Alterados: `js/views/pro.js`, `js/analytics.js`, `js/billing.js`, `js/views/admin.js`, `netlify/functions/admin.js`, `netlify/functions/analytics-event.js`, `index.html`, `app.css`.

## Validação manual
1. Usuário grátis abre recurso premium e vê paywall.
2. Fecha o paywall; sugestão automática equivalente respeita cooldown.
3. Tenta o recurso explicitamente e consegue rever o paywall.
4. Abre Planos e seleciona Plus, Pro e Família.
5. Inicia checkout e confirma que o Mercado Pago abre normalmente.
6. Pagamento só deve ativar após confirmação real do backend/webhook.
7. Growth Center deve mostrar o novo funil sem dados financeiros pessoais.
8. Testar modal, planos e Growth Center no celular.

## Limitações
- Pagamento real, webhook, Supabase e Mercado Pago precisam ser validados no ambiente publicado; testes locais não simulam sucesso externo.
- Métricas começam em zero e só ganham valor após eventos reais da 8.17.
