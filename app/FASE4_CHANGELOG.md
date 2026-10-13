# Bivvo 10.7.0 — Fase 4 · Espaço Família

## Entregue
- Espaço Família para até 4 membros.
- Criação do espaço exclusiva do plano Bivvo Família.
- Convites por link/código com validade de 7 dias.
- Papéis: Responsável, Pode editar e Somente leitura.
- Gestão de membros e permissões pelo responsável.
- Privacidade por padrão: nenhum lançamento pessoal é compartilhado automaticamente.
- Seletor para publicar/remover lançamentos no espaço familiar.
- Resumo de entradas, gastos e saldo compartilhados.
- Bloqueio de alterações se o plano Família do responsável ficar inativo, preservando os dados.
- Endpoint autenticado `/api/family`, rate limit e validação no servidor.
- Tabelas familiares isoladas do `finance_data` pessoal.

## Configuração obrigatória antes de publicar
Execute `supabase-family.sql` uma única vez no SQL Editor do mesmo projeto Supabase usado pelo Bivvo. Depois publique o ZIP normalmente no Netlify.

## Privacidade
O extrato pessoal continua no payload individual. `family_transactions` recebe apenas os lançamentos que o próprio usuário selecionar para compartilhar e apenas um resumo necessário (data, descrição, categoria, tipo e valor).
