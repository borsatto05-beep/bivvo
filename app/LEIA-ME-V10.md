# Bivvo v10.5.0

Reescrita completa do frontend. Banco, RLS, MFA e Netlify Functions mantidos.

## Estrutura
- `index.html` — casca do app, sem scripts nem estilos inline
- `app.css` — sistema visual único (substitui `app.css` + `v7-premium.css` da v9)
- `js/util.js` — formatação, datas no fuso local, DOM seguro (`textContent` sempre)
- `js/store.js` — estado único, migração automática da v9, recorrências, compras no cartão
- `js/finance.js` — saldo, faturas, "livre para gastar hoje", projeções, sequências
- `js/insights.js` — insights a partir dos dados reais, conquistas e desafios
- `js/cloud.js` — Supabase Auth, MFA, sincronização com controle de versão, zerar dados
- `js/demo.js` — demonstração gerada em memória (nunca salva)
- `js/views/*` — telas: início, extrato, cartões, planos, você, formulários, onboarding, stories
- `fonts/bricolage.woff2` — Bricolage Grotesque (SIL Open Font License 1.1)

## Deploy
Suba o conteúdo do ZIP no Netlify como antes. Não é preciso rodar SQL novo.
Primeiro acesso após o deploy migra os dados de cada usuário automaticamente.

## Novidades da 10.4
- `js/quickparse.js` — interpretador da captura rápida (puro, sem DOM)
- `js/push.js` + `netlify/functions/push-*.js` + `netlify/lib/` — avisos (Web Push)
- `js/views/split.js` — dividir conta por link
- `supabase-push.sql` — rode uma vez para ativar os avisos (o resto do app funciona sem ele)
- `ferramentas/chaves-push.html` — gera as chaves VAPID no seu navegador
- Veja `AVISOS-SETUP.md`

## Novidades da 10.5 (Fundação Pro)
- `js/plans.js` — planos, limites e permissões (único lugar)
- `js/analytics.js` — métricas sem dados financeiros
- `js/simulate.js` + `js/views/simulator.js` — "Posso comprar?"
- `js/voice.js`, `js/scan.js`, `js/views/scanconfirm.js` — falar e ler comprovante
- `js/views/pro.js` — tela Pro e paywall · `js/referral.js` — indicação
- `netlify/functions/scan-receipt.js`, `referral-activate.js` · `supabase-monetizacao.sql`
- Veja `MONETIZACAO.md`
