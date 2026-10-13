-- BIVVO 10.4 — Avisos (Web Push). Execute uma vez no Supabase SQL Editor.
-- Cada pessoa só enxerga e altera as próprias linhas (RLS). O envio usa a chave secreta no servidor.

create table if not exists public.push_subscriptions (
  endpoint text primary key check (char_length(endpoint) between 20 and 1000),
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  ua text check (char_length(ua) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

create table if not exists public.push_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  hour smallint not null default 20 check (hour between 0 and 23),
  tz_offset_min integer not null default -180 check (tz_offset_min between -840 and 840),
  show_values boolean not null default false,
  digest jsonb not null default '{}'::jsonb check (pg_column_size(digest) < 8000),
  last_capture_date date,
  last_sent_on date,
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
alter table public.push_prefs enable row level security;
alter table public.push_prefs force row level security;

drop policy if exists "push_subs_select_own" on public.push_subscriptions;
drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
drop policy if exists "push_subs_update_own" on public.push_subscriptions;
drop policy if exists "push_subs_delete_own" on public.push_subscriptions;
create policy "push_subs_select_own" on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "push_subs_insert_own" on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "push_subs_update_own" on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "push_subs_delete_own" on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "push_prefs_select_own" on public.push_prefs;
drop policy if exists "push_prefs_insert_own" on public.push_prefs;
drop policy if exists "push_prefs_update_own" on public.push_prefs;
drop policy if exists "push_prefs_delete_own" on public.push_prefs;
create policy "push_prefs_select_own" on public.push_prefs for select to authenticated using ((select auth.uid()) = user_id);
create policy "push_prefs_insert_own" on public.push_prefs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "push_prefs_update_own" on public.push_prefs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "push_prefs_delete_own" on public.push_prefs for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.push_subscriptions from anon;
revoke all on public.push_prefs from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.push_prefs to authenticated;
