# Bivvo 11.26.0 — Bloco C: Comportamento

Implementado sobre a 11.25.0, preservando Blocos A/B e o fluxo de exclusão de conta.

- Detector de vazamentos: pequenos gastos (até R$ 30) só ganham destaque quando há volume e peso relevante no mês; linguagem não julgadora.
- Assinaturas/recorrências: reutiliza `subscriptionSummary()` e acrescenta detecção conservadora no histórico (>=3 meses distintos e valores com variação máxima de 15%). Recorrência provável não é automaticamente convertida em assinatura.
- Bola de neve: timeline de 6 meses construída somente com parcelas futuras cadastradas e ainda não pagas.
- “E se eu parar de parcelar hoje?”: simulação somente leitura usando os compromissos existentes; não altera lançamentos.
- Sem nova chave persistente e sem migração de dados.
- Versão/cache PWA atualizados para 11.26.0.
