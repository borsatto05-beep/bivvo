# Bivvo 11.70 — compra no cartão conta antes de pagar a fatura

- Compra efetivada no cartão consome o orçamento pela data/competência da compra ou parcela.
- O status da fatura (aberta, fechada, vencida ou ainda não paga) não impede o consumo do orçamento.
- O pagamento da fatura continua sendo apenas movimentação de caixa e não gera um segundo consumo no orçamento.
- Foi adicionado teste de regressão específico com compra `Pendente` no cartão e `cardPaidAmount = 0`, garantindo que a categoria e o total consumido sejam atualizados mesmo com a fatura 100% em aberto.
