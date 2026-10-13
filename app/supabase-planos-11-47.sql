-- BIVVO 11.47 — novos planos: Casal, Capital e Empreendedor.
-- Execute no Supabase SQL Editor ANTES de publicar a versão 11.47.
-- Esta migração mantém Plus, Pro e Família e amplia os valores aceitos.

DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname, conrelid::regclass AS tbl
    FROM pg_constraint
    WHERE contype='c'
      AND conrelid IN ('public.entitlements'::regclass,'public.billing_subscriptions'::regclass,'public.billing_payments'::regclass)
      AND pg_get_constraintdef(oid) ILIKE '%plan%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', c.tbl, c.conname);
  END LOOP;
END $$;

ALTER TABLE public.entitlements
  ADD CONSTRAINT entitlements_plan_check
  CHECK (plan IN ('plus','pro','couple','capital','entrepreneur','family'));

ALTER TABLE public.billing_subscriptions
  ADD CONSTRAINT billing_subscriptions_plan_check
  CHECK (plan IN ('plus','pro','couple','capital','entrepreneur','family'));

ALTER TABLE public.billing_payments
  ADD CONSTRAINT billing_payments_plan_check
  CHECK (plan IS NULL OR plan IN ('plus','pro','couple','capital','entrepreneur','family'));

-- Convite do Casal: somente Bivvo Casal ou Família habilitam o espaço a dois.
create or replace function public.bivvo_accept_couple_invite(p_user uuid,p_code text,p_name text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_inv public.family_invites%rowtype; v_family public.families%rowtype;
begin
 select * into v_inv from public.family_invites where code=p_code and accepted_at is null and expires_at>now() for update;
 if not found then raise exception 'Convite inválido ou expirado'; end if;
 select * into v_family from public.families where id=v_inv.family_id for update;
 if v_family.name not like 'Casal · %' then raise exception 'Este convite não é de casal'; end if;
 if not exists(select 1 from public.entitlements where user_id=v_family.owner_id and plan in ('couple','family') and starts_at<=now() and expires_at>now()) then raise exception 'Plano Casal ou Família inativo'; end if;
 if exists(select 1 from public.family_members where user_id=p_user) then raise exception 'Você já participa de um espaço'; end if;
 if (select count(*) from public.family_members where family_id=v_family.id)>=2 then raise exception 'Este espaço já tem duas pessoas'; end if;
 insert into public.family_members(family_id,user_id,role,display_name) values(v_family.id,p_user,case when v_inv.role='editor' then 'editor' else 'viewer' end,left(p_name,50));
 update public.family_invites set accepted_at=now(),accepted_by=p_user where id=v_inv.id;
end $$;
revoke all on function public.bivvo_accept_couple_invite(uuid,text,text) from public,anon,authenticated;
grant execute on function public.bivvo_accept_couple_invite(uuid,text,text) to service_role;

-- Autoridade no servidor por módulo.
create or replace function public.bivvo_guard_paid_finance_profiles()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_old jsonb; v_new jsonb; k text; old_tx jsonb; new_tx jsonb;
        can_loans boolean; can_company boolean;
begin
 if auth.uid() is null then return new; end if;
 can_loans := exists(select 1 from public.entitlements where user_id=auth.uid() and plan in ('capital','family') and starts_at<=now() and expires_at>now());
 can_company := exists(select 1 from public.entitlements where user_id=auth.uid() and plan in ('entrepreneur','family') and starts_at<=now() and expires_at>now());
 v_old=case when tg_op='UPDATE' then coalesce(old.payload::jsonb,'{}'::jsonb) else '{}'::jsonb end;
 v_new=coalesce(new.payload::jsonb,'{}'::jsonb);
 if not can_loans then
   for k in select unnest(array['loans','loanPayments','loanCycles']) loop
    if coalesce(v_old->k,'[]'::jsonb)<>coalesce(v_new->k,'[]'::jsonb) then raise exception 'Bivvo Capital ou Família necessário para alterar empréstimos'; end if;
   end loop;
   select coalesce(jsonb_agg(t order by t->>'id'),'[]'::jsonb) into old_tx from jsonb_array_elements(coalesce(v_old->'transactions','[]'::jsonb)) t where t ? 'loanId' or t ? 'loanPaymentId' or t->>'isLoan'='true' or t->>'cat'='Juros / Empréstimo';
   select coalesce(jsonb_agg(t order by t->>'id'),'[]'::jsonb) into new_tx from jsonb_array_elements(coalesce(v_new->'transactions','[]'::jsonb)) t where t ? 'loanId' or t ? 'loanPaymentId' or t->>'isLoan'='true' or t->>'cat'='Juros / Empréstimo';
   if old_tx<>new_tx then raise exception 'Bivvo Capital ou Família necessário para alterar empréstimos'; end if;
 end if;
 if not can_company and coalesce(v_old->'financialProfiles'->'company','{}'::jsonb)<>coalesce(v_new->'financialProfiles'->'company','{}'::jsonb) then raise exception 'Bivvo Empreendedor ou Família necessário para alterar o perfil Empresa'; end if;
 return new;
end $$;
drop trigger if exists bivvo_paid_finance_profiles on public.finance_data;
create trigger bivvo_paid_finance_profiles before insert or update on public.finance_data for each row execute function public.bivvo_guard_paid_finance_profiles();
