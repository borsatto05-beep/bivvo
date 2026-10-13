# Bivvo 8.20.8 — TikTok Lead limpo

- O evento de cadastro continua disparando somente após cadastro confirmado.
- O payload do evento `Lead` agora é enviado sem parâmetros de conteúdo, `value` ou `currency`: `ttq.track('Lead')`.
- Motivo: o TikTok estava normalizando os parâmetros de conteúdo do Lead e exibindo `value: 0`/`currency: BRL`, gerando alerta de valor inválido.
- Nenhum dado financeiro, e-mail ou telefone é enviado neste evento.
