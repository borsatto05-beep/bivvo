# Bivvo 8.20.4 — TikTok CompleteRegistration

- Mantém o TikTok Pixel base da 8.20.3.
- Dispara `ttq.track('CompleteRegistration')` somente após o Supabase aceitar a criação da conta.
- Não envia e-mail, telefone, nome, external_id ou dados financeiros ao TikTok.
- Evita contabilizar como conversão a resposta ofuscada de tentativa de cadastro com e-mail já existente quando o Supabase retorna `identities` vazio.
- Atualiza o cache-busting de `js/main.js` para `11.20.4`.
