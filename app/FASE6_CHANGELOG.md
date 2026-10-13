# Bivvo 10.9.0 — Fase 6 · Growth Center

## Entregue
- Administração reconstruída como Growth Center.
- Visão geral com visitantes, online (15 min), cadastros, pagantes, MRR, receita, ticket, DAU/MAU e churn.
- Funil: visita → cadastro iniciado → conta criada → onboarding → uso → checkout → pagamento.
- Aquisição first-party por UTM/origem com visitantes, cadastros, pagantes, conversão e receita atribuída.
- Público técnico agregado: dispositivo, SO, navegador, tamanho de tela e idioma.
- Produto: rotas e eventos mais usados; retenção D7/D30/D90.
- Motor de oportunidades com alertas de gargalo e canal com tração.
- Filtros de 7, 30 e 90 dias.
- Clientes e Saúde do Sistema preservados.

## Privacidade
- Não coleta IP para o painel, não faz fingerprinting invasivo e não tenta inferir CPF, endereço ou identidade oculta.
- Não envia valores, descrições, categorias ou conteúdo financeiro pessoal para analytics.
- Visitantes anônimos recebem apenas ID first-party aleatório e ID de sessão.

## Banco
Execute `supabase-admin.sql` novamente. Os comandos da Fase 6 usam `add column if not exists` e índices idempotentes.

FASE 6.1 HOTFIX
- Corrigido erro de parser em js/views/admin.js que impedia a inicialização do app.
- View Growth Center reformatada e endurecida contra dados ausentes.
- Cache-buster do main.js atualizado para 10.8.1.
