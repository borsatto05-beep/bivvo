# Deploy 11.55

1. Faça o deploy do conteúdo completo no Netlify.
2. Não é necessário executar SQL novo para atualizar de 11.54 para 11.55.
3. A função `/api/quick-capture-usage` reutiliza `usage_counters` e `bivvo_consume_usage` já usados pela monetização atual.
4. Teste com uma conta Grátis: 10 anotações rápidas/mês e 5 scans/mês.
5. Teste Casal e Empreendedor para confirmar que a captura salva no ambiente correto.
