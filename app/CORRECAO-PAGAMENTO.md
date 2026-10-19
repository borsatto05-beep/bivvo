# Correção de abertura do pagamento

Base: codex/bivvo-11-85-visual. A main contém apenas o ZIP histórico 11.41.

A mensagem da imagem vem do catch de billing-create: pode representar erro no Mercado Pago ou ao registrar a assinatura no Supabase. A causa de produção ainda precisa ser confirmada nos logs da Netlify. Não há acesso a esses logs nem credencial Mercado Pago neste ambiente.

O servidor retorna códigos BILLING_PROVIDER_FAILED, BILLING_STORAGE_FAILED e BILLING_SCHEMA_OUTDATED, usa mp_subscription_id como chave do upsert e tenta cancelar a assinatura pendente quando a persistência falha. Falhas do cancelamento são registradas para reconciliação. O checkout só é devolvido depois da persistência. Planos herdados de Object são rejeitados.

Se os logs mostrarem 23514/billing_subscriptions_plan_check, execute supabase-billing-planos-fix.sql no SQL Editor do Supabase. O script atualiza as restrições dos planos nas duas tabelas de cobrança e acesso, sem alterar assinaturas ou conceder planos. Publicar o site não executa SQL automaticamente.

Publique app/ na Netlify, usando npm run build e saída dist, com MERCADOPAGO_ACCESS_TOKEN e SUPABASE_SECRET_KEY configuradas no servidor. Valide Capital com conta de teste e consulte os logs se houver falha.

Os testes locais simulam serviços externos. Nenhuma cobrança real foi criada e nenhuma alteração de produção foi executada.
