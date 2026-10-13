# Bivvo 8.20 — Growth Autopilot + Resumo do Fundador

Versão do app: **11.20.0**

## Entregue
- Nova aba **Resumo do Fundador** no Growth Center.
- Pulso das últimas 24 horas: visitantes, cadastros, primeiro R$/dia, checkouts e pagantes.
- Comparação do período atual (7/30/90 dias) com o período anterior equivalente.
- Melhor origem e melhor campanha UTM por sinal de cadastro/pagamento.
- **Growth Autopilot** com prioridade automática e até 5 próximas ações.
- Regras para gargalo de onboarding, visitante→cadastro, D1, checkout, campanha sem cadastro, canal com tração, viral sem visita atribuída e baixa frequência.
- Mantida a regra de privacidade: sem saldo, renda, compras ou valores financeiros pessoais no Growth Center.

## Deploy
No diretório do projeto:

```bash
netlify deploy --prod
```

Depois atualize o navegador com Ctrl+F5.

## Teste rápido
1. Administração → Growth Center.
2. Abra **Resumo do Fundador**.
3. Confira a prioridade do Autopilot, últimas 24h e comparação do período.
4. Troque 7/30/90 dias e confirme que o resumo recalcula.
