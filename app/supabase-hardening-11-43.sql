-- BIVVO 11.43: executar após os SQL existentes, antes do novo deploy.
begin;
create or replace function public.bivvo_user_has_verified_mfa(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists(select 1 from auth.mfa_factors where user_id=p_user_id and status='verified');
$$;
revoke all on function public.bivvo_user_has_verified_mfa(uuid) from public, anon, authenticated;
grant execute on function public.bivvo_user_has_verified_mfa(uuid) to service_role;

create table if not exists public.billing_webhook_events (
  event_key text primary key,
  status text not null check(status in ('processing','done','retry')),
  lease uuid not null,
  lease_until timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table public.billing_webhook_events enable row level security;
alter table public.billing_webhook_events force row level security;
revoke all on public.billing_webhook_events from anon, authenticated;
grant all on public.billing_webhook_events to service_role;
create or replace function public.bivvo_claim_webhook(p_key text, p_lease uuid)
returns text language plpgsql security definer set search_path=public as $$
declare claimed text; existing_status text;
begin
  if p_key !~ '^[a-f0-9]{64}$' or p_lease is null then return 'invalid'; end if;
  insert into public.billing_webhook_events(event_key,status,lease,lease_until)
  values(p_key,'processing',p_lease,now()+interval '2 minutes')
  on conflict(event_key) do update set status='processing',lease=p_lease,
    lease_until=now()+interval '2 minutes',updated_at=now()
  where billing_webhook_events.status='retry' or
    (billing_webhook_events.status='processing' and billing_webhook_events.lease_until<=now())
  returning event_key into claimed;
  if claimed is not null then return 'claimed'; end if;
  select status into existing_status from public.billing_webhook_events where event_key=p_key;
  return case when existing_status='done' then 'done' else 'busy' end;
end;
$$;
create or replace function public.bivvo_finish_webhook(p_key text,p_lease uuid,p_success boolean)
returns void language sql security definer set search_path=public as $$
  update public.billing_webhook_events set status=case when p_success then 'done' else 'retry' end,
    updated_at=now(),lease_until=now() where event_key=p_key and lease=p_lease and status='processing';
$$;
revoke all on function public.bivvo_claim_webhook(text,uuid) from public,anon,authenticated;
revoke all on function public.bivvo_finish_webhook(text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.bivvo_claim_webhook(text,uuid) to service_role;
grant execute on function public.bivvo_finish_webhook(text,uuid,boolean) to service_role;
commit;
