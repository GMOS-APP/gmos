// battle-map — token-authenticated access to a campaign's shared battle map for
// the public player link. Players (anyone with the share token) can read the
// active map and move tokens; everything is scoped to that campaign. Live
// movement is broadcast over Supabase Realtime; this function persists drops.
// (The GM manages maps/tokens directly through RLS in GM-OS.)
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const pct = (v: unknown) => Math.max(0, Math.min(100, Number(v)));

// What players are allowed to see of a map.
const project = (m: Record<string, unknown>) => ({
  id: m.id, name: m.name, image_url: m.image_url, grid_cols: m.grid_cols,
  locked: m.locked, tokens: m.tokens || [],
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token;
    if (!token) return json({ error: 'token is required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: camps } = await admin
      .from('campaigns').select('id')
      .eq('player_share_token', token).eq('is_shared', true).limit(1);
    if (!camps || camps.length === 0) return json({ error: 'Not found' }, 404);
    const campaignId = camps[0].id;
    const action = body?.action || 'get';

    if (action === 'get') {
      const { data: maps } = await admin
        .from('battle_maps')
        .select('id, name, image_url, grid_cols, locked, tokens')
        .eq('campaign_id', campaignId).eq('active', true)
        .order('updated_date', { ascending: false }).limit(1);
      return json({ map: maps && maps.length ? project(maps[0]) : null });
    }

    if (action === 'move') {
      const { mapId, tokenId } = body;
      if (!mapId || !tokenId) return json({ error: 'mapId and tokenId are required' }, 400);
      const x = pct(body.x);
      const y = pct(body.y);
      const { data: map } = await admin
        .from('battle_maps').select('tokens, locked')
        .eq('id', mapId).eq('campaign_id', campaignId).maybeSingle();
      if (!map) return json({ error: 'Not found' }, 404);
      if (map.locked) return json({ error: 'The board is locked.' }, 403);
      const tokens = (Array.isArray(map.tokens) ? map.tokens : []).map((t: Record<string, unknown>) =>
        t.id === tokenId ? { ...t, x, y } : t);
      const { error } = await admin.from('battle_maps')
        .update({ tokens, updated_date: new Date().toISOString() })
        .eq('id', mapId).eq('campaign_id', campaignId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
