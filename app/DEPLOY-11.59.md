# Deploy Bivvo 11.59

1. Faça o deploy do conteúdo desta versão no Netlify.
2. Não é necessário executar SQL novo no Supabase.
3. Após o deploy, feche e reabra o PWA para receber o cache `11.59.0`.
4. Entre no perfil Empresa/Empreendedor e confira a nova trilha didática e os botões `? Entenda`.
5. Para validar um negócio sem dados, use um perfil Empresa vazio: o onboarding deve começar pelo roteiro da primeira semana.

## Validação realizada

- `npm test`: 51 suítes, 0 falhas.
- `npm run test:seo`: 55 URLs, 0 erros.
- `npm run build`: concluído.
- `npm run test:browser`: indisponível neste ambiente (`Cannot find module 'playwright'`).
