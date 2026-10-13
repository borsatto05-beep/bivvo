# Deploy Bivvo 11.61

1. Publique este pacote normalmente no Netlify.
2. Confirme que `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`) continua configurada no Netlify.
3. Entre na conta autorizada e reabra o app. O Bivvo cria/confirma automaticamente o entitlement permanente `owner_permanent_capital`.
4. Não é necessário executar SQL novo para esta versão.
