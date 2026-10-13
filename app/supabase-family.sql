-- Bivvo Fase 4 — Espaço Família. Execute uma vez no SQL Editor do Supabase.
create extension if not exists pgcrypto;
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 1 and 50), owner_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now()
);
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null check(role in ('owner','editor','viewer')), display_name text, joined_at timestamptz not null default now(), unique(user_id), unique(family_id,user_id)
);
create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id) on delete cascade, created_by uuid not null references auth.users(id) on delete cascade, code text not null unique, role text not null default 'viewer' check(role in ('editor','viewer')), expires_at timestamptz not null, accepted_at timestamptz, accepted_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.family_transactions (
  id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, source_id text not null, date date not null, description text not null, category text not null, type text not null check(type in ('income','expense')), value numeric(14,2) not null check(value>=0), created_at timestamptz not null default now(), unique(family_id,user_id,source_id)
);
create index if not exists family_members_family_idx on public.family_members(family_id);
create index if not exists family_invites_code_idx on public.family_invites(code);
create index if not exists family_tx_family_date_idx on public.family_transactions(family_id,date desc);
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;
alter table public.family_transactions enable row level security;
-- A Fase 4 acessa estas tabelas somente pelas Netlify Functions com service role.
-- RLS fica sem políticas públicas para impedir leitura direta pelo navegador.
