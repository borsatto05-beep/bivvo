# Bivvo 8.20.6 — TikTok Pixel + CSP

- Move o bootstrap do TikTok Pixel do HTML inline para `js/tiktok-pixel.js`.
- Mantém `script-src-attr 'none'` e não adiciona `unsafe-inline`.
- Autoriza apenas o host do script oficial do Pixel em `script-src`.
- Autoriza endpoints HTTPS do TikTok em `connect-src` para o envio dos eventos.
- Mantém o evento `Lead` já ligado ao sucesso do cadastro.
- Não adiciona `ttq.identify`, e-mail, telefone ou dados financeiros.
