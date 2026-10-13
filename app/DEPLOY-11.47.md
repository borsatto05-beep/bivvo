# Publicação Bivvo 11.47

1. Abra o Supabase → SQL Editor.
2. Execute `supabase-planos-11-47.sql` uma única vez.
3. Confirme que o SQL terminou sem erros.
4. Publique este projeto no Netlify normalmente. O `netlify.toml` executa `npm run build` e publica `dist`.
5. Depois do deploy, teste cadastro/login e os checkouts de Plus, Pro, Casal, Capital, Empreendedor e Família em um ambiente de pagamento apropriado antes de anunciar os novos planos.

## Importante
A migração precisa vir antes do deploy porque o banco antigo aceita somente os nomes de plano anteriores. Sem ela, Casal, Capital ou Empreendedor podem ser recusados ao gravar assinatura/entitlement.

Bivvo Capital é uma ferramenta de organização de empréstimos particulares. O Bivvo não concede crédito nem intermedeia empréstimos.
