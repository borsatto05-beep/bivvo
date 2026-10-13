# Bivvo 11.7.0 — Fase 8.7 · Motor de Indicação

- Central de indicação em Você > Indique e ganhe Pro.
- Link pessoal com copiar/compartilhar.
- Explicação transparente da regra de ativação: 3 lançamentos próprios em 2 dias diferentes.
- Indicado ativado recebe 7 dias de Pro.
- A cada 3 indicados ativados, quem indicou recebe 30 dias de Pro.
- Progresso real dos últimos 12 meses via endpoint autenticado `referral-status`.
- Limite existente preservado: até 4 recompensas de 30 dias em 12 meses.
- Novos eventos sem dados financeiros: `referral_center_viewed` e `referral_link_copied`.
- Nenhum SQL novo nesta fase; reutiliza a tabela `referrals` e a infraestrutura de monetização existente.
