# Bivvo 11.42.2 — Versão, cache e singleton Supabase

## Problema reproduzido na base 11.42.1

A interface não mostrava a versão nova porque `js/util.js` ainda exportava `VERSION = '11.29.1'`. Além disso, `index.html` e o shell do Service Worker continuavam usando query string `v=11.29.1`, enquanto o cache do Service Worker ainda tinha o identificador da fase 11.31.1.

O aviso `Multiple GoTrueClient instances detected` também tinha uma causa real no frontend: chamadas concorrentes a `sb()` podiam atravessar o mesmo `await loadSdk()` antes de `client` ser preenchido e criar mais de um cliente Supabase no mesmo contexto.

## Correções

- versão visível atualizada para `11.42.2`;
- `app.css` e `js/main.js` com cache-bust `v=11.42.2`;
- Service Worker com novo cache `bivvo-v11-42-2-version-auth-singleton`;
- shell offline atualizado para os assets 11.42.2;
- registro do Service Worker usa `updateViaCache: 'none'` e solicita `reg.update()` após abrir o app;
- `cloud.sb()` agora usa uma Promise singleton durante a criação do cliente, evitando corrida e múltiplos `GoTrueClient`.

## CSP / about:srcdoc

Os dois bloqueios vermelhos mostrados no print apontam para `about:srcdoc`, não para um arquivo do Bivvo. A base do projeto não contém uso de `srcdoc`. A CSP não foi afrouxada com `unsafe-inline`, porque isso reduziria a proteção contra XSS do aplicativo. O bloqueio pode vir de conteúdo criado por terceiro no contexto da página (por exemplo, pixel/extensão). Deve ser reavaliado em produção depois deste deploy antes de alterar a política.

## Testes executados

- teste específico `tests/version-auth-11422.test.mjs`: 8/8;
- teste comportamental em Node com 3 chamadas concorrentes de `sb()`: somente 1 `createClient`, e as 3 chamadas retornaram a mesma instância;
- `node --check` em todos os JS/MJS do projeto;
- testes automatizados existentes executados novamente;
- integridade do ZIP validada.

## NÃO TESTADO

- atualização do Service Worker em um PWA já instalado em iPhone/Android físico;
- desaparecimento do aviso CSP `about:srcdoc` no navegador do usuário;
- console real do Netlify após publicação;
- sessão Supabase real em duas abas/dispositivos de produção.
