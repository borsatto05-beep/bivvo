# Bivvo — Fase 0 Changelog

## Adicionado
- Gerenciamento e cancelamento de renovação da assinatura dentro do Bivvo.
- Function segura `billing-cancel`.
- KPIs DAU, WAU, MAU, retenção observável, cancelamentos e saúde do funil de pagamento no Admin.
- Eventos server-side de início/cancelamento de assinatura e aprovação/falha de pagamento.

## Alterado
- Família aparece como “Em breve” e novas vendas são bloqueadas também no servidor.
- MRR/assinantes no Admin passam a evitar duplicidade por usuário e a considerar pagamento aprovado.
- Cancelamento preserva acesso já pago até o vencimento registrado no entitlement.
- Barras do Admin não dependem mais de `style` inline.

## Segurança
- Nenhuma chave nova no frontend.
- Nenhuma alteração de RLS.
- CSP não recebeu `unsafe-inline`.
- Cancelamento exige JWT válido e rate limit.

## Não alterado
Motores financeiros, scanner Gemini, quick capture, câmera, voz, investimentos, metas, reserva, Stories/Wrapped, split, referral, push e fluxo de aprovação do Mercado Pago.
