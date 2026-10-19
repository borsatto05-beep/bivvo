-- Execute no SQL Editor. Transacional e repetível; não concede acesso.
BEGIN;
ALTER TABLE public.billing_subscriptions DROP CONSTRAINT IF EXISTS billing_subscriptions_plan_check;
ALTER TABLE public.billing_subscriptions ADD CONSTRAINT billing_subscriptions_plan_check
 CHECK (plan IN ('plus','pro','couple','capital','entrepreneur','family'));
ALTER TABLE public.entitlements DROP CONSTRAINT IF EXISTS entitlements_plan_check;
ALTER TABLE public.entitlements ADD CONSTRAINT entitlements_plan_check
 CHECK (plan IN ('plus','pro','couple','capital','entrepreneur','family'));
COMMIT;
