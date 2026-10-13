# Fase 8.9 — Retenção e cancelamento

- Versão 11.9.0.
- Fluxo de cancelamento pergunta um motivo curto e não financeiro antes da única oferta de pausa.
- Motivos permitidos: preço, pouco uso, recurso ausente, problema técnico, pausa temporária ou outro.
- Mantida a regra de cancelamento sem obstáculos: uma única oferta de pausa e opção clara de continuar cancelando.
- Eventos de retenção: cancel_flow_started, cancel_reason_selected, cancel_retained_pause e cancellation_completed.
- Admin ganhou o bloco Retenção & cancelamento com intenção de saída, pausas, reativações, cancelamentos e distribuição de motivos.
- Nenhum detalhe financeiro pessoal é enviado às métricas.
- Sem SQL novo.
