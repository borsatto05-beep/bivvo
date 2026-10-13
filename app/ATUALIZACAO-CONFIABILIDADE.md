# Bivvo 11.62 — confiabilidade

Este pacote inclui o layout entregue anteriormente e três correções.

1. Produtos da empresa entram na mesclagem por registro, incluindo exclusões e alterações concorrentes.
2. A escola usa os campos reais do resumo financeiro, diferenciando valores pagos, recebidos e agendados. O casal recebe todas as movimentações, consultadas em páginas de 100 por cursor data/id. Totais e gráficos usam o histórico completo; a lista aparece em blocos de 50 com Ver mais. Falha em qualquer página devolve erro, nunca totais parciais.
3. Casal e Família consultam alterações a cada 60 segundos enquanto a tela estiver aberta e visível. Também consultam ao voltar para a tela e recuperar conexão, com intervalo mínimo de 15 segundos entre consultas. Formulários abertos e campos em edição suspendem a atualização. Respostas antigas são descartadas ao trocar de conta. Falhas preservam os dados anteriores e exibem o estado de atualização.

Consultas e alterações têm limites separados no servidor: 240 leituras/hora por conta e 60 alterações/hora por conta. As permissões existentes permanecem aplicadas. Não há migração de banco neste pacote. Não foi alterado o banco de produção.

## Validação

58 conjuntos de testes de Node passaram. Regressões cobrem produtos concorrentes, exclusão, exemplos financeiros reais, histórico com 235 registros, falha de página, autenticação, frequência e isolamento das consultas.

Teste de navegador com duas sessões e servidor simulado: registrar gasto, parceiro receber atualização em 60 segundos, manter rascunho, preservar dados na falha e recuperar conexão, lista incremental e aula financeira com gasto real. Esses testes não substituem a conferência de duas contas reais após publicar no Netlify.

## Publicação

Use o projeto completo no processo de publicação Netlify existente: npm run build, pasta pública dist e funções netlify/functions. Publicar somente a pasta dist não entrega as mudanças do servidor. Não foi feita publicação automática.

Para repetir o teste de navegador: npm ci; npx playwright install chromium; npm run build; BIVVO_TEST_PORT=8774 python scripts/serve.py; em outro terminal, node tests/reliability-browser.cjs. CHROMIUM_PATH pode indicar um Chromium já instalado.

## Limite conhecido

A consulta financeira completa prioriza a correção dos totais, incluindo registros antigos. Espaços com históricos muito grandes devem evoluir para agregações de banco e paginação da API, para evitar retransferir todo o histórico em cada atualização.
