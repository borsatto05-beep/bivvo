# Bivvo 11.78 — Origem por usuário na Administração

## Objetivo
Mostrar na área **Administração > Usuários online** a origem individual de aquisição de cada usuário.

## Canais reconhecidos
- Google
- Facebook
- TikTok
- YouTube
- Instagram
- Direto
- Outros/domínios conhecidos
- Desconhecido quando não existe sinal confiável

## Como a origem é determinada
1. O backend procura primeiro o evento `signup_completed` autenticado do usuário.
2. Usa `utm_source`/`source` e `referrer` gravados no evento de analytics.
3. Para cadastros antigos sem evento de cadastro disponível, usa o primeiro evento autenticado com sinal de origem como fallback.
4. Não inventa origem: sem sinal suficiente, exibe `Direto` ou `Desconhecido`.

## Interface
Cada card de usuário passou a mostrar o campo **ORIGEM** junto de último uso, tempo médio por sessão, aba mais usada e localização atual no app.
A busca também aceita o nome da origem, por exemplo `TikTok` ou `Google`.

## Arquivos alterados
- `netlify/functions/admin.js`
- `js/views/admin.js`

## Arquivo criado
- `tests/admin-user-origin-1178.test.mjs`

## Privacidade
A implementação usa somente metadados de aquisição/uso já coletados pelo analytics do Bivvo. Não consulta saldo, renda, compras, dívidas ou outros dados financeiros pessoais.
