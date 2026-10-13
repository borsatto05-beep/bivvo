# Bivvo 11.63 — pagamento antecipado do cartão

- Fatura aberta agora pode ser paga antes do fechamento.
- Faturas futuras formadas por parcelas também podem ser antecipadas quando selecionadas.
- O pagamento usa a data atual (`paidAt`), sai do saldo imediatamente e libera o limite correspondente.
- Se novas compras entrarem depois na mesma fatura aberta, ela volta a apresentar saldo pendente.
- Compras e parcelas permanecem no histórico; apenas recebem status pago e a marca interna `invoicePaidEarly`.
