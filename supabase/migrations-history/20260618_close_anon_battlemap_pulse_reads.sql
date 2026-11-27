-- Close the last token-less anon reads found in the audit. battle_maps and
-- campaign_pulse were readable by anyone holding only a campaign UUID (anon
-- SELECT gated on is_campaign_shared, not the share token). Players now reach
-- this data exclusively through the token-gated edge functions + Realtime
-- broadcast; nothing reads these tables with just the UUID anymore.
-- (Applied to prod via MCP; recorded here.)

-- 1. Move the player-view live-reveal signal from an anon table read
--    (postgres_changes on campaign_pulse) to a Realtime *broadcast*. The payload
--    carries no secrets; the player view still re-fetches reveals through the
--    token-gated player-view edge function.
create or replace function public.bump_campaign_pulse()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare cid uuid := coalesce(new.campaign_id, old.campaign_id);
begin
  if cid is not null and exists (select 1 from campaigns where id = cid) then
    insert into campaign_pulse(campaign_id, updated_at) values (cid, now())
    on conflict (campaign_id) do update set updated_at = now();
    -- Public broadcast channel "pulse:<campaign_id>"; secrets-free signal only.
    perform realtime.send(
      jsonb_build_object('at', now()),
      'bump',
      'pulse:' || cid::text,
      false
    );
  end if;
  return null;
end
$function$;

-- 2. Drop the token-less anon SELECT policies.
drop policy if exists "battle_maps_public_read" on public.battle_maps;
drop policy if exists "campaign_pulse_public_read" on public.campaign_pulse;

-- 3. is_campaign_shared() was referenced ONLY by those two policies. Remove the
--    anon-callable share oracle now that nothing uses it.
revoke execute on function public.is_campaign_shared(uuid) from anon, public;
