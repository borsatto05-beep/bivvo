# SECURITY REPORT — Bivvo 11.31

## Escopo
Alterações de Web Push, digest financeiro, service worker e mensagens.

## Resultado
- Nenhuma chave VAPID privada adicionada ao frontend.
- Assinaturas continuam vinculadas ao user_id e protegidas pelas políticas RLS existentes.
- Deep links recebidos pelo Service Worker aceitam somente caminhos relativos iniciados por `./`.
- Texto de notificação é limitado antes da exibição.
- Valores financeiros continuam opt-in por `show_values`; modo discreto não expõe valor na tela bloqueada.
- Push de teste continua autenticado e com rate limit.
- Pentest dinâmico contra produção/APNs: NÃO TESTADO neste ambiente.

Nenhuma vulnerabilidade crítica nova foi identificada nos testes estáticos executados.
