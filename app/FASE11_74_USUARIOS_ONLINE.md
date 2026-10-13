# Fase 11.74 — Usuários online e atividade

## Objetivo
Tornar a Administração mais útil para uma pessoa leiga, mostrando quem está usando o Bivvo agora e como cada usuário interage com o produto.

## Nova aba: Usuários online
- Quantidade de usuários online agora.
- Nome e e-mail do usuário.
- Último dia e horário de uso.
- Tempo médio por sessão.
- Aba mais usada.
- Aba atual quando o usuário estiver online.
- Última aba visitada quando estiver offline.
- Busca por nome ou e-mail e filtro de online.

## Como o online funciona
O app envia um heartbeat técnico autenticado a cada 60 segundos enquanto estiver visível. A Administração considera online quem teve atividade nos últimos 2 minutos e 30 segundos.

## Privacidade
A telemetria não envia saldo, renda, dívidas, compras, valores de cartão ou outros dados financeiros pessoais. São usados somente usuário autenticado, sessão, rota/tela, dispositivo e horário técnico.

## Compatibilidade
Dados antigos continuam válidos para último acesso e telas abertas. O tempo médio e a aba por tempo ficam mais precisos conforme o usuário utilizar esta versão ou superior.
