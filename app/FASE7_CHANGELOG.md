# Bivvo 11.0.0 — Fase 7 · Pronto para o mercado

## Auditoria e hardening
- Corrigida inconsistência de cache: app 10.9.0 carregava assets 10.8.1/10.5.0.
- Service Worker atualizado para cache `bivvo-v11-0-0-fase7`, com network-first para HTML/JS/CSS.
- Feature flags simples adicionadas em `js/features.js`.
- Telemetria técnica resiliente adicionada: `window.onerror` e `unhandledrejection`, com sanitização, deduplicação de 60 s e sem dados financeiros.

## Ativação e onboarding
- Eventos de onboarding adicionados à telemetria first-party.
- Checklist discreto de primeiros passos na Home; desaparece após 3/4 marcos.
- Analytics de ativação permanece sem valores financeiros.

## Importação
- CSV, OFX, XLS/XLSX existentes preservados.
- Prévia explícita antes da confirmação de importação.
- Duplicados continuam sendo ignorados antes da gravação.
- Categorização local e regras pessoais existentes preservadas.
- Eventos import_started/completed/failed adicionados sem conteúdo do extrato.

## Banco
- Execute `supabase-fase7.sql` uma vez. Apenas acrescenta campos técnicos opcionais à tabela de analytics.

## Segurança
- Nenhum `unsafe-inline` foi adicionado a script-src.
- Nenhum segundo cliente Supabase foi criado.
- Nenhum salário, saldo, descrição, estabelecimento, fatura ou valor financeiro é enviado ao Growth Analytics.
