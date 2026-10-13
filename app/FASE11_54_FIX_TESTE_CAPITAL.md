# Bivvo 11.54 — correção do modo de homologação do Bivvo Capital

- Corrige a troca para Bivvo Capital no modo de teste do proprietário.
- O override de homologação não depende mais de o banco já aceitar `capital` no CHECK da tabela `entitlements`.
- Planos especializados usam um entitlement compatível no banco e o plano simulado é identificado pela `source` apenas para a conta autorizada.
- O app e as funções continuam aplicando exatamente as permissões do plano escolhido.
- Assinaturas reais e usuários comuns não são alterados.
