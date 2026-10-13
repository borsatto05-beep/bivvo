# Bivvo Admin — instalação

## 1. Criar as tabelas administrativas
1. Abra o Supabase do Bivvo.
2. Clique em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo `supabase-admin.sql` deste projeto, copie tudo e cole no SQL Editor.
5. Clique em **Run**.

## 2. Criar seu primeiro Super Admin
1. No Supabase, abra **Authentication > Users**.
2. Localize sua conta administrativa e copie o **User UID/UUID**. Use o UUID, não o e-mail.
3. Volte ao **SQL Editor > New query**.
4. Execute, substituindo apenas o UUID:

```sql
insert into public.admin_roles(user_id, role)
values ('COLE-SEU-UUID-AQUI', 'super_admin')
on conflict (user_id) do update set role='super_admin';
```

5. Saia e entre novamente no Bivvo. O item **Administração** aparecerá no menu do computador.

## 3. Netlify
Não é necessária nova chave secreta. O Admin usa as variáveis que o projeto já utiliza no servidor, especialmente `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`). Não coloque essas chaves no frontend.

Faça o deploy a partir da pasta `bivvo_work`:

```powershell
netlify.cmd deploy --prod
```

## 4. O que começa a contar a partir da instalação
`analytics_events` começa a registrar visitas/eventos depois deste deploy. O painel não inventa histórico anterior. Cadastros já existentes podem ser lidos do Supabase Auth; assinaturas existentes vêm de `billing_subscriptions`.

A tabela `billing_payments` começa a receber cobranças recorrentes processadas pelo webhook atualizado. Receita administrativa é baseada nesses pagamentos registrados, não apenas em assinatura `authorized`.

## 5. Teste de segurança
- Conta comum: item Administração não aparece; chamada `/api/admin?action=dashboard` deve retornar 403.
- Sem login: deve retornar 401.
- Super Admin: Administração abre e carrega métricas.

## 6. Teste do Mercado Pago
Não altere manualmente status de assinatura. Faça um pagamento normal e confirme que:
1. o dinheiro entra no Mercado Pago;
2. o plano é ativado;
3. o webhook continua 200;
4. depois do webhook, o pagamento aparece nas métricas administrativas.
