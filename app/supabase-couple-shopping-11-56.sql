-- Bivvo 11.56 — Lista de compras compartilhada do Casal. Execute uma vez no SQL Editor do Supabase.
create extension if not exists pgcrypto;
create table if not exists public.family_shopping_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit text not null default 'un',
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  purchased boolean not null default false,
  actual_total numeric(14,2) check (actual_total is null or actual_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists family_shopping_family_state_idx on public.family_shopping_items(family_id,purchased,created_at desc);
alter table public.family_shopping_items enable row level security;
-- A lista é acessada somente pela Netlify Function /api/family usando service role.
