# Fase 11.53 — pagamento do Bivvo Capital entra no saldo

- Pagamentos recebidos no Bivvo Capital agora movimentam o saldo pelo valor integral efetivamente recebido.
- A devolução do principal aumenta o caixa, mas continua fora de "renda" e "lucro" para não inflar indicadores.
- Juros recebidos continuam sendo renda real.
- Editar ou excluir um pagamento recalcula o saldo automaticamente pelos lançamentos vinculados ao pagamento.
- O fluxo mantém `loanPaymentId` para evitar dupla contabilização.
