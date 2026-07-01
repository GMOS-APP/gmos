import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

Deno.serve(async (req) => {
  const corsHeaders = cors(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get('token');

    // Also accept token from request body
    if (!token) {
      try {
        const body = await req.json();
        token = body?.token;
      } catch {
        // no body
      }
    }

    if (!token) {
      return Response.json({ error: 'token is required' }, { status: 400, headers: corsHeaders });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Built-in player-facing entity types (never creatures/encounters/PCs/shops).
    const BUILTIN_PLAYER_TYPES = ['npc', 'location', 'faction', 'item', 'thread', 'event', 'lore', 'deity'];

    // Find campaign by share token where sharing is enabled. created_by is used
    // server-side to resolve the owner's custom types; it is never returned.
    const { data: campaigns, error: campError } = await admin
      .from('campaigns')
      .select('id, name, setting, created_by')
      .eq('player_share_token', token)
      .eq('is_shared', true)
      .limit(1);

    if (campError || !campaigns || campaigns.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    const campaign = campaigns[0];

    // The owner's player-visible custom entity types. The public page can't read
    // entity_types under RLS, so we resolve them here and return display metadata.
    const { data: customTypes } = await admin
      .from('entity_types')
      .select('key, label, label_singular, icon, color')
      .eq('created_by', campaign.created_by)
      .eq('player_visible', true);

    const customKeys = (customTypes || []).map((t) => t.key);
    const PLAYER_TYPES = [...BUILTIN_PLAYER_TYPES, ...customKeys];

    // Player-visible entities — safe fields only (no description/extra_data/secrets).
    const { data: entities } = await admin
      .from('world_entities')
      .select('id, entity_type, name, summary, image_url, visibility')
      .eq('campaign_id', campaign.id)
      .in('visibility', ['players_know', 'players_suspect'])
      .in('entity_type', PLAYER_TYPES)
      .order('updated_date', { ascending: false });

    // 5 most recent sessions — only the player-facing recap, no prep/secrets/GM notes.
    const { data: sessions } = await admin
      .from('sessions')
      .select('status, previous_session_recap')
      .eq('campaign_id', campaign.id)
      .order('session_number', { ascending: false })
      .limit(5);

    return Response.json(
      {
        campaign: { id: campaign.id, name: campaign.name, setting: campaign.setting },
        entities: entities || [],
        sessions: sessions || [],
        entityTypes: customTypes || [],
      },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
