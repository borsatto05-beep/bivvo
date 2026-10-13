# Deploy — Bivvo 11.57

1. Não é necessário executar SQL novo no Supabase.
2. Publique a pasta `dist/` ou faça deploy do pacote completo no Netlify conforme o fluxo atual.
3. Após o deploy, atualize/reabra o PWA para receber o cache `11.57.0`.
4. Teste principalmente:
   - Empresa → clique em cada gráfico e no botão ↗;
   - Casal → resumo, gastos e divisão → gráficos e pop-ups;
   - mobile → abertura/fechamento dos bottom sheets;
   - desktop → modal central e navegação por teclado.
