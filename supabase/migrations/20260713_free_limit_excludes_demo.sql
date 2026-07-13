-- Free-tier gate: the bundled demo campaign no longer counts toward the
-- 1-campaign free limit, and seeding a demo is always allowed. A free user gets
-- the demo to explore PLUS one real campaign of their own. Applied to prod
-- 2026-07-13 via MCP; captured here to keep the repo in sync. The client mirror
-- lives in src/pages/CampaignList.jsx (realCampaignCount excludes is_demo).
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
  -- Demo campaigns are always allowed and never counted.
  if coalesce(new.is_demo, false) then
    return new;
  end if;
  select plan into v_plan from public.user_profiles where id = v_owner;
  if v_plan is null then
    v_plan := 'free';
  end if;
  if v_plan <> 'free' then
    return new;
  end if;
  select count(*) into v_count
    from public.campaigns
    where created_by = v_owner and coalesce(is_demo, false) = false;
  if v_count >= 1 then
    raise exception 'Free plan is limited to 1 campaign. Upgrade to create more.'
      using errcode = 'P0001', hint = 'CAMPAIGN_LIMIT_REACHED';
  end if;
  return new;
end;
$$;
