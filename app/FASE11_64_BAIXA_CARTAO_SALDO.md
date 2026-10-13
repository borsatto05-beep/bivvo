# Bivvo 11.64 — baixa real de pagamento do cartão

- Corrige o fluxo de pagamento de fatura que podia não ficar vinculado à própria fatura.
- Cada pagamento agora vira um lançamento próprio `card_payment`, com cartão, mês da fatura, data, valor e alocações.
- Pagamento total ou parcial reduz o saldo em caixa na data do pagamento.
- A fatura mostra valor pago, valor em aberto e histórico de pagamentos.
- O limite do cartão é liberado exatamente pelo valor pago.
- As compras permanecem no histórico e não são contadas duas vezes como saída de caixa.
- Pagamento parcial dá baixa apenas no valor pago; quitação zera a fatura.
- Pagamentos podem ser estornados com reversão de saldo, fatura e limite.
- Compatibilidade preservada para faturas antigas que já estavam marcadas como pagas antes da 11.64.
