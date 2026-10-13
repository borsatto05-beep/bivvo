# Bivvo 11.69 — histórico anterior no orçamento

- Migração automática do histórico salvo antes desta versão para que compras já existentes também apareçam no consumo do orçamento.
- Formas antigas como `Cartão de crédito` e `Credito` são normalizadas para `Crédito` quando o registro é uma despesa de cartão.
- Campos legados de importações (`data`, `descricao/description`, `categoria/category`, `valor/amount`, `cardName`) são aproveitados sem duplicar lançamentos.
- Parcelamentos antigos que existiam apenas em `installments` têm as parcelas ausentes reconstruídas de forma idempotente; cada parcela continua consumindo o orçamento do mês correspondente.
- Pagamentos de fatura continuam fora do consumo do orçamento para não contar a mesma compra duas vezes.
