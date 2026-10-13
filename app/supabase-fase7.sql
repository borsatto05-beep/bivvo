-- BIVVO FASE 7 — hardening e saúde técnica. Seguro para base existente.
alter table public.analytics_events add column if not exists error_type text;
alter table public.analytics_events add column if not exists error_message text;
alter table public.analytics_events add column if not exists app_version text;
create index if not exists analytics_events_client_error_idx on public.analytics_events(event, created_at desc) where event = 'client_error';
-- Nenhum dado financeiro é adicionado à telemetria.
