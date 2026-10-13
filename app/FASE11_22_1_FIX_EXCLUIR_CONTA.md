# Bivvo 11.22.1 — correção Excluir conta

- Usa explicitamente a sessão recém-emitida após confirmação da senha ao chamar `/api/account-delete`.
- Mantém sessão AAL2 como prioridade para contas com 2FA.
- Valida existência do token antes da chamada de exclusão.
- Após exclusão bem-sucedida, limpa sessão/cache e redireciona para a entrada do app.
- Melhora diagnóstico de falha no console sem expor credenciais.
- Alinha versão do app e cache PWA em 11.22.1.
- Regressão: 42 testes financeiros + 7 conversão + 14 SEO, 0 falhas.
