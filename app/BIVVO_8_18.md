# Bivvo 8.18 — Retenção Inteligente

Objetivo: aumentar retorno e hábito sem transformar o Bivvo em uma central de notificações e sem usar dados financeiros em analytics.

## Entregas
- Growth Center ganhou aba **Retenção**.
- Métricas: ativos 1/7/30 dias, usuários em risco (7–29 dias), adormecidos (30+ dias), retornos, frequência 7d/30d, D7 e D30.
- Evento `retention_returned` identifica retorno depois de ausência usando somente tempo de atividade.
- Estrutura de lembrete inteligente com cooldown semanal e eventos próprios.
- Mantidos os fluxos anteriores de relatório mensal, D30/D90, pausa, reativação e cancelamento.
- Analytics continua sem saldo, renda, compras, categorias, descrições ou valores financeiros.

## Regra de produto
Retenção deve lembrar valor e continuidade. Nunca explorar saldo negativo, dívida ou dificuldade financeira para pressionar o usuário a voltar ou assinar.
