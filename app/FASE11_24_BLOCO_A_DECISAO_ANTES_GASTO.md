# Bivvo 11.24.0 — Bloco A: decisão antes do gasto

- Reutiliza `finance.spendable()` como fonte única de dinheiro realmente livre.
- Posso comprar? 2.0 agora apresenta 4 vereditos: Pode comprar, Melhor esperar, Compra arriscada e Não recomendado agora.
- Mostra impacto mensal e total futuro comprometido em compras parceladas.
- Procura uma janela futura observável em que os compromissos já cadastrados do cartão diminuem; não inventa datas.
- Freio de impulso opcional, com espera de 24h sem bloquear o registro da compra.
- Lista local/sincronizada em `profile.purchaseConsiderations`; desistências são métrica comportamental e não alteram saldo/patrimônio.
- Nenhuma alteração em `confirmSheet()` ou `deleteAccount()`.
- Cache/PWA atualizado para 11.24.0.
