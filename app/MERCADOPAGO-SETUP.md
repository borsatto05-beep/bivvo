# Bivvo + Mercado Pago — configuração

Planos mensais configurados:
- Plus: R$ 9,90
- Pro: R$ 19,90
- Família: R$ 39,99 (até 4 membros; o compartilhamento/convites familiares é uma etapa separada da cobrança)

## Antes do deploy
1. Rode novamente `supabase-monetizacao.sql` no Supabase. Ele é idempotente e agora também cria `billing_subscriptions`.
2. No Netlify, mantenha `MERCADOPAGO_ACCESS_TOKEN` como segredo. Durante os testes, use o token de teste; antes de vender de verdade, troque pelo token de produção.
3. `SUPABASE_SECRET_KEY` precisa continuar configurada.
4. Faça deploy por Git ou Netlify CLI para publicar também as Functions e o `billing-cron` agendado.

## Como funciona
- O app chama `/api/billing/create` autenticado.
- O servidor escolhe o preço; o navegador nunca informa o valor a cobrar.
- O servidor cria uma assinatura pendente no Mercado Pago e redireciona ao checkout oficial.
- Ao voltar, o usuário pode tocar em “Já paguei · atualizar assinatura”.
- `billing-cron` também reconcilia as assinaturas automaticamente a cada hora e libera/revoga o entitlement conforme o status retornado pela API autenticada do Mercado Pago.
- Existe `/api/billing/webhook` como receptor adicional, mas a reconciliação horária evita depender apenas de notificações.

## Produção
Antes de aceitar dinheiro real, troque `MERCADOPAGO_ACCESS_TOKEN` pelo Access Token de produção e faça novo deploy. Faça uma compra real de baixo valor/conta controlada e confira a ativação do plano e o cancelamento.

## Segurança
- Nunca coloque Access Token no frontend.
- O preço é definido somente no servidor.
- Nenhum dado de cartão passa pelo Bivvo; o checkout é do Mercado Pago.
