# Bivvo 11.65 — Início restaurado + capital operacional

- Início pessoal voltou ao painel completo; a Órbita agora aparece como card compacto e clicável.
- Saldo geral e saldo de capital podem ser transferidos nos dois sentidos sem contar como renda/despesa.
- Novos empréstimos normais e parcelados validam capital disponível e descontam somente do capital.
- Principal recebido recompõe o capital; juros continuam no saldo geral.
- Empréstimos antigos não são reclassificados retroativamente: somente novos contratos usam `capitalManaged`.
- Histórico de movimentações do capital reúne transferências, liberações e principal recebido.
- Build e suíte automatizada: 63/63 suítes aprovadas.
