# Bivvo 11.50 — 1 cartão no Grátis + troca privada de planos

- Bivvo Grátis permite criar no máximo 1 cartão de crédito. Cartões já existentes não são apagados em downgrade; apenas novos cartões ficam bloqueados acima do limite.
- Landing page e tabela comparativa atualizadas para mostrar 1 cartão no Grátis.
- Criado modo privado de homologação de planos na aba Você.
- A conta autorizada é validada no servidor por JWT do Supabase + SHA-256 do e-mail; o e-mail não fica exposto em texto puro no código.
- O seletor permite testar Grátis, Plus, Capital, Pro, Casal, Empreendedor e Família sem checkout ou cobrança.
- A permissão de teste usa uma única entitlement com source `owner_test_plan`, atualizada a cada troca. Escolher Grátis expira somente essa entitlement de teste e não mexe em assinaturas reais.
- A simulação é um override: enquanto ativa, ela prevalece sobre trials, indicações e assinaturas reais apenas para fins de recursos do app. A opção “Usar plano real da conta” encerra a simulação sem tocar na assinatura.
