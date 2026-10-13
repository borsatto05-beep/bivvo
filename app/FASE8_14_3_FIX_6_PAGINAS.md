# Bivvo 8.14.3 — correção das 6 páginas públicas

- Corrigidos aliases públicos que estavam retornando 404.
- URLs antigas/amigáveis agora redirecionam 301 para as rotas canônicas.
- Removido JavaScript funcional inline das páginas "Quanto posso gastar hoje" e "Organizar cartão".
- Criado `seo-interactive.js`, compatível com a CSP do Bivvo (`script-src-attr 'none'` / sem inline funcional).
- Mantidas as calculadoras em `seo-tools.js`.
- Parâmetros UTM continuam funcionando porque o redirecionamento preserva query string.
- Sem SQL novo.
