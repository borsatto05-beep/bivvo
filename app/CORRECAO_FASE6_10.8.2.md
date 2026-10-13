# Bivvo 10.8.2 — correção de console

- Supabase frontend agora usa singleton global para impedir múltiplos GoTrueClient no mesmo contexto.
- CSP permite somente atributos de estilo inline necessários às variáveis CSS dinâmicas dos gráficos (`--p`, `--w`, `--h`).
- CSP continua bloqueando scripts inline (`script-src-attr 'none'` e sem `unsafe-inline` em `script-src`).
- Cache-bust de `main.js` e `app.css` atualizado para 10.8.2.
- Nenhum `srcdoc` existe no código do Bivvo; bloqueios de script reportados como `about:srcdoc` não foram liberados.
