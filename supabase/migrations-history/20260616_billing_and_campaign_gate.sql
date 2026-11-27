-- Billing + free-tier gating schema (applied to prod via Supabase MCP, recorded
-- here for reproducibility). The repo deploys functions individually rather than
-- via the migration runner, so this file is documentation of the live state.
--
-- NOTE: the enforcement TRIGGER at the bottom is intentionally DROPPED in prod
-- until go-live (enabling it before billing exists would block live users).
-- Re-create it as step 1 of launch.

-- 1. Plan tiers: allow the paid tiers; keep 'plus' for back-compat.
alter table public.user_profiles
  drop constraint if exists user_profiles_plan_check;
alter table public.user_profiles
  add constraint user_profiles_plan_check
  check (plan = any (array['free','plus','monthly','yearly','lifetime']));

-- 2. Index for the per-user campaign count in the gate trigger.
create index if not exists campaigns_created_by_idx
  on public.campaigns (created_by);

-- 3. Stripe webhook idempotency log (service-role only; RLS on, no policies).
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  received_at timestamptz default now()
);
alter table public.stripe_events enable row level security;

-- 4. Free-tier campaign limit: free plan = exactly 1 campaign. BEFORE INSERT
--    trigger (not RLS) so it raises a catchable error and also fires on the
--    service-role import path. Keys off NEW.created_by.
create or replace function public.enforce_free_campaign_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_owner uuid := new.created_by;
  v_plan  text;
  v_count integer;
begin
  if v_owner is null then
    return new;
  end if;
  select plan into v_plan from public.user_profiles where id = v_owner;
  if v_plan is null then
    v_plan := 'free';
  end if;
  if v_plan <> 'free' then
    return new;
  end if;
  select count(*) into v_count from public.campaigns where created_by = v_owner;
  if v_count >= 1 then
    raise exception 'Free plan is limited to 1 campaign. Upgrade to create more.'
      using errcode = 'P0001', hint = 'CAMPAIGN_LIMIT_REACHED';
  end if;
  return new;
end;
$$;

-- Enable at go-live (currently dropped in prod):
-- create trigger trg_enforce_free_campaign_limit
--   before insert on public.campaigns
--   for each row execute function public.enforce_free_campaign_limit();
