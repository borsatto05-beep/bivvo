# Bivvo Admin — changelog

## Adicionado
- Role administrativa server-side (`admin_roles`) com Super Admin e base para Support/Finance/Analytics.
- Endpoint `/api/admin` protegido por JWT + role no servidor.
- Dashboard Admin com usuários, assinantes, planos, MRR, ARR, receita registrada, visitantes, conversão e abandono de checkout.
- Gráficos de visitantes e receita dos últimos 30 dias.
- Ranking de eventos e planos.
- Página Clientes com busca, filtro, paginação lógica e exportação CSV auditada.
- Saúde do Sistema baseada em telemetria registrada.
- Analytics leve e separado dos dados financeiros pessoais.
- UTMs básicas (source/medium/campaign), dispositivo, navegador e sistema operacional.
- `billing_payments` para separar pagamento aprovado de mera autorização da assinatura.
- Auditoria de exportação administrativa.
- Layout responsivo para desktop e celular.

## Privacidade
O Admin não lê `finance_data` e não exibe saldo, salário, transações, compras, investimentos, orçamento ou comprovantes dos clientes.

## Mercado Pago
O fluxo de ativação já corrigido foi preservado. A telemetria de pagamento é registrada depois da consulta autenticada da cobrança/assinatura e não substitui a regra de concessão do plano.
