# Bivvo — Auditoria específica da Fase 0

## Objetivo
Corrigir a base comercial e de medição antes da Fase 1, sem reescrever a arquitetura e sem tocar nos motores financeiros.

## Arquivos alterados
- `netlify/lib/billing.js` — sincronização preserva período já pago após cancelamento e registra eventos de ciclo de assinatura.
- `netlify/functions/billing-create.js` — novas vendas do Família ficam temporariamente indisponíveis.
- `netlify/functions/billing-webhook.js` — registra pagamento aprovado/falho de forma idempotente em métricas de produto.
- `netlify/functions/admin.js` — métricas DAU/WAU/MAU, retenção disponível, cancelamentos e eventos comerciais; MRR evita duplicidade por usuário e exige evidência de pagamento aprovado.
- `js/billing.js` — cliente para consultar/cancelar assinatura.
- `js/views/pro.js` — gerenciamento/cancelamento e Família “Em breve”.
- `js/views/admin.js` — novos KPIs e remoção do style inline das barras.
- `js/analytics.js` — lista de eventos alinhada ao funil.
- `app.css` — barra do Admin compatível com CSP sem style inline.
- `netlify.toml` — rota `/api/billing/cancel`.

## Arquivo novo
- `netlify/functions/billing-cancel.js` — cancelamento autenticado, rate-limited e feito no servidor.

## SQL necessário
Nenhum SQL novo para esta Fase 0. Foram reaproveitadas `billing_subscriptions`, `billing_payments`, `product_events`, `analytics_events`, `system_events` e `entitlements` já existentes.

## Mercado Pago
- Nova ação de cancelamento usa `PUT /preapproval/{id}` no servidor.
- O Access Token continua exclusivamente no ambiente Netlify.
- Cancelar impede nova renovação; o Bivvo preserva um entitlement já pago em vez de expirá-lo antecipadamente.
- O fluxo de criação/aprovação que já funcionava não foi refeito.

## Supabase
- Nenhuma tabela, RLS ou política foi removida/afrouxada.
- Eventos comerciais são gravados pelo service role em `product_events` sem valores financeiros pessoais.
- A leitura do status da própria assinatura continua protegida pela RLS já existente.

## Netlify
- Nova Function: `billing-cancel`.
- Nova rota: `/api/billing/cancel`.
- Nenhuma variável de ambiente nova.

## Analytics corrigido
- `checkout_started` passa a ser aceito também nas métricas de produto.
- Servidor registra `subscription_started` quando o status muda para autorizado.
- Servidor registra `subscription_canceled` quando muda para cancelado.
- Webhook registra `payment_approved` e `payment_failed` sem duplicar o mesmo estado da mesma cobrança.
- Admin passa a exibir DAU, WAU, MAU, retenção D7/D30 quando há coorte observável, canceladas em 30 dias e pagamentos aprovados/falhos em 30 dias.

## Família
- Novas assinaturas Família foram pausadas no frontend e no servidor.
- Assinaturas Família já existentes não são apagadas nem alteradas.
- O plano volta à venda apenas quando membros, espaço compartilhado e privacidade estiverem implementados.

## Partes que NÃO foram tocadas
- Livre para gastar hoje e `finance.js`.
- Posso comprar? e simulador.
- Scanner Gemini e cotas do scanner.
- Quick Capture, câmera e microfone.
- Projeções financeiras atuais.
- Insights, conquistas e desafios.
- Metas e reserva de emergência.
- Wrapped/Stories.
- Split/divisão de conta.
- Indicações.
- Dados financeiros do usuário e formato de `finance_data.payload`.
- Login/cadastro/MFA.
- Push.
- RLS/CSP não foram enfraquecidas.

## Riscos e mitigação
- Mercado Pago pode devolver estados diferentes conforme o ciclo da assinatura: a reconciliação horária continua ativa.
- Retenção depende da janela de eventos disponível; quando não existe coorte suficiente o Admin mostra “—”.
- Cancelamento precisa de teste real/controlado no Mercado Pago antes de ser considerado validado em produção.
- Família fica sem novas vendas até a implementação real, evitando promessa de funcionalidade inexistente.

## Teste recomendado
1. Login normal e abertura do app.
2. Scanner de comprovante.
3. Abrir Planos e confirmar Família como “Em breve”.
4. Em conta paga, abrir Gerenciar assinatura e conferir status/data.
5. Testar cancelamento apenas em assinatura de teste/controlada.
6. Confirmar no Mercado Pago que a renovação ficou cancelada.
7. Confirmar no Supabase `billing_subscriptions.status` e `product_events`.
8. Abrir Admin e conferir novos KPIs.
9. Testar mobile e desktop.
10. Conferir Console e logs Netlify sem erros novos.
