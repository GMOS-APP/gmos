import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const ALLOWED_ORIGINS = ['https://gmos.app', 'https://gm-os.app', 'https://gamemasteros.com', 'https://trisdenc.github.io'];
const isAllowedOrigin = (o: string | null): o is string =>
  !!o && (ALLOWED_ORIGINS.includes(o) ||
    /^http:\/\/localhost:\d+$/.test(o) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(o));
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Vary': 'Origin',
});

// Cap import size to stop a crafted backup from creating unbounded rows.
const MAX_RECORDS = 10000;

const strip = ({ id, created_date, updated_date, created_by, ...rest }: Record<string, unknown>) => rest;

Deno.serve(async (req) => {
  const CORS_HEADERS = cors(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  let createdCampaignId: string | null = null;
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    // Verify the user's JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await req.json();
    const {
      campaign,
      world_entities = [],
      sessions = [],
      relationships = [],
      campaign_maps = [],
      quick_notes = [],
      random_tables = [],
    } = body;

    if (!campaign) {
      return Response.json({ error: 'Invalid backup file: missing campaign data' }, { status: 400, headers: CORS_HEADERS });
    }

    // Reject malformed or oversized payloads before doing any privileged writes.
    const arrays = { world_entities, sessions, relationships, campaign_maps, quick_notes, random_tables };
    for (const [name, arr] of Object.entries(arrays)) {
      if (!Array.isArray(arr)) {
        return Response.json({ error: `Invalid backup file: ${name} must be an array` }, { status: 400, headers: CORS_HEADERS });
      }
    }
    const totalRecords = Object.values(arrays).reduce((sum, arr) => sum + arr.length, 0);
    if (totalRecords > MAX_RECORDS) {
      return Response.json({ error: `Import too large: ${totalRecords} records exceeds the ${MAX_RECORDS} limit` }, { status: 413, headers: CORS_HEADERS });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Create new campaign owned by the importing user
    const { data: newCampaign, error: campErr } = await admin
      .from('campaigns')
      .insert({ ...strip(campaign), created_by: user.id })
      .select()
      .single();
    if (campErr) throw campErr;
    const newCampaignId = newCampaign.id;
    createdCampaignId = newCampaignId;

    // 2. Create world entities, build old-id → new-id map
    const entityIdMap: Record<string, string> = {};
    await Promise.all(
      world_entities.map(async (e: Record<string, unknown>) => {
        const { data: newEntity, error } = await admin
          .from('world_entities')
          .insert({ ...strip(e), campaign_id: newCampaignId, created_by: user.id })
          .select()
          .single();
        if (error) throw error;
        entityIdMap[e.id as string] = newEntity.id;
      })
    );

    // 3. Create sessions, remapping linked entity references
    await Promise.all(
      sessions.map(async (s: Record<string, unknown>) => {
        const linked = ((s.linked_entities as Array<Record<string, unknown>>) || []).map((le) => ({
          ...le,
          entity_id: entityIdMap[le.entity_id as string] || le.entity_id,
        }));
        const { error } = await admin
          .from('sessions')
          .insert({ ...strip(s), campaign_id: newCampaignId, created_by: user.id, linked_entities: linked });
        if (error) throw error;
      })
    );

    // 4. Create relationships, remapping source/target entity IDs
    await Promise.all(
      relationships.map(async (r: Record<string, unknown>) => {
        const { error } = await admin.from('relationships').insert({
          ...strip(r),
          campaign_id: newCampaignId,
          created_by: user.id,
          source_entity_id: entityIdMap[r.source_entity_id as string] || r.source_entity_id,
          target_entity_id: entityIdMap[r.target_entity_id as string] || r.target_entity_id,
        });
        if (error) throw error;
      })
    );

    // 5. Create campaign maps, remapping pin entity IDs
    await Promise.all(
      campaign_maps.map(async (m: Record<string, unknown>) => {
        const pins = ((m.pins as Array<Record<string, unknown>>) || []).map((pin) => ({
          ...pin,
          entity_id: entityIdMap[pin.entity_id as string] || pin.entity_id,
        }));
        const { error } = await admin
          .from('campaign_maps')
          .insert({ ...strip(m), campaign_id: newCampaignId, created_by: user.id, pins });
        if (error) throw error;
      })
    );

    // 6. Create quick notes, remapping extracted entity IDs
    await Promise.all(
      quick_notes.map(async (n: Record<string, unknown>) => {
        const extracted = ((n.extracted_entities as string[]) || []).map((eid) => entityIdMap[eid] || eid);
        const { error } = await admin.from('quick_notes').insert({
          ...strip(n),
          campaign_id: newCampaignId,
          created_by: user.id,
          extracted_entities: extracted,
        });
        if (error) throw error;
      })
    );

    // 7. Create random tables
    await Promise.all(
      random_tables.map(async (t: Record<string, unknown>) => {
        const { error } = await admin
          .from('random_tables')
          .insert({ ...strip(t), campaign_id: newCampaignId, created_by: user.id });
        if (error) throw error;
      })
    );

    return Response.json({
      success: true,
      campaign_id: newCampaignId,
      campaign_name: newCampaign.name,
      stats: {
        world_entities: world_entities.length,
        sessions: sessions.length,
        relationships: relationships.length,
        campaign_maps: campaign_maps.length,
        quick_notes: quick_notes.length,
        random_tables: random_tables.length,
      },
    }, { headers: CORS_HEADERS });
  } catch (error) {
    // Roll back a partial import so a failed import never leaves an orphan campaign.
    if (createdCampaignId) {
      try {
        const cleanup = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        for (const table of ['world_entities', 'sessions', 'relationships', 'campaign_maps', 'quick_notes', 'random_tables']) {
          await cleanup.from(table).delete().eq('campaign_id', createdCampaignId);
        }
        await cleanup.from('campaigns').delete().eq('id', createdCampaignId);
      } catch { /* best-effort cleanup */ }
    }
    // Free-tier campaign limit (from the enforce_free_campaign_limit trigger) →
    // surface a recognizable code so the client can show the upgrade prompt.
    const err = error as { message?: string; hint?: string };
    if (err?.hint === 'CAMPAIGN_LIMIT_REACHED' || /Free plan is limited to 1 campaign/.test(err?.message || '')) {
      return Response.json({ error: 'CAMPAIGN_LIMIT_REACHED' }, { status: 403, headers: CORS_HEADERS });
    }
    return Response.json({ error: err?.message }, { status: 500, headers: CORS_HEADERS });
  }
});
