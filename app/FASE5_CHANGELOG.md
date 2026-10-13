# Bivvo 10.8.0 — Fase 5 · Retenção e crescimento

## Entregue
- Novas conquistas: Reserva criada, Primeiros R$ 1.000 e 6 meses no orçamento.
- Relatório mensal contextual no dia 1, abrindo a retrospectiva do mês encerrado.
- Marcos de retenção D30 e D90 registrados sem valores financeiros.
- Indicação existente preservada: convidado recebe 7 dias Pro e, a cada 3 ativações válidas, o indicador recebe 30 dias Pro.
- Cancelamento honesto: uma única alternativa de pausa; sem insistência e com cancelamento direto em seguida.
- Pausa e reativação de assinatura via Mercado Pago, com autenticação e rate limit.
- Plano Família liberado no checkout após a entrega do Espaço Família na Fase 4.
- Eventos de produto para relatório mensal, D30, D90, pausa, reativação e funil de cancelamento.

## Banco de dados
Nenhuma migração SQL nova é obrigatória para a Fase 5. Ela reutiliza product_events, billing_subscriptions, referrals e entitlements já criados nas fases anteriores.

## Configuração
Mantenha as variáveis do Mercado Pago e Supabase já usadas pela Fase 4. Os novos endpoints são /api/billing/pause e /api/billing/reactivate.
