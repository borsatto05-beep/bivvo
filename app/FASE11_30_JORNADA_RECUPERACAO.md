# BIVVO 11.30 — Jornada de Recuperação

## Implementado
- RecoveryEngine agregando motores A–F sem criar saldo paralelo.
- Estágios automáticos: Sobrevivência, Recuperação, Controle, Estabilidade e Crescimento.
- Dinheiro Livre de Verdade reutilizando `finance.spendable()`.
- Mínimo essencial estimado do mês.
- Motor de prioridade de recuperação.
- Home adaptativa com missão principal do dia.
- Check-in diário não punitivo.
- Modo Crise simplificado.
- Minha Jornada com Bivvo Score e próximo foco.
- Layout responsivo mobile-first.

## Arquivos novos
- `js/recovery.js`
- `js/views/recovery.js`

## Arquivos alterados
- `js/views/home.js`
- `js/main.js`
- `app.css`

## Correção durante testes
A primeira regra de estágio considerava qualquer fatura pendente como recuperação. Foi corrigida para exigir pendência vencida ou sinais fortes do Detector de Descontrole.
