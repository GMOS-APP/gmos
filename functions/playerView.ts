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

    // Player-visible types from the game-system packs (subset of
    // src/lib/systemPacks.js — keep in sync when pack playerVisible flags change;
    // key = campaigns.system). Shaped like entity_types rows so the client can
    // treat pack and custom defs identically.
    const PACK_PLAYER_TYPES: Record<string, Array<{ key: string; label: string; label_singular: string; icon: string; color: string }>> = {
      coc: [
        { key: 'coc_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet' },
        { key: 'coc_tome', label: 'Tomes & Artifacts', label_singular: 'Tome / Artifact', icon: 'BookOpen', color: 'orange' },
        { key: 'coc_location', label: 'Locations', label_singular: 'Location', icon: 'MapPin', color: 'emerald' },
      ],
      blades: [
        { key: 'blades_faction', label: 'Factions', label_singular: 'Faction', icon: 'Crown', color: 'purple' },
        { key: 'blades_district', label: 'Districts', label_singular: 'District', icon: 'MapPin', color: 'emerald' },
        { key: 'blades_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet' },
      ],
      vtm: [
        { key: 'vtm_mortal', label: 'Mortals & Ghouls', label_singular: 'Mortal / Ghoul', icon: 'User', color: 'green' },
        { key: 'vtm_domain', label: 'Domains', label_singular: 'Domain', icon: 'MapPin', color: 'emerald' },
        { key: 'vtm_faction', label: 'Sects & Factions', label_singular: 'Sect / Faction', icon: 'Crown', color: 'purple' },
        { key: 'vtm_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet' },
      ],
      daggerheart: [
        { key: 'dh_environment', label: 'Environments', label_singular: 'Environment', icon: 'Mountain', color: 'emerald' },
        { key: 'dh_faction', label: 'Factions', label_singular: 'Faction', icon: 'Shield', color: 'rose' },
        { key: 'dh_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet' },
      ],
    };

    // Find campaign by share token where sharing is enabled. created_by is used
    // server-side to resolve the owner's custom types; it is never returned.
    const { data: campaigns, error: campError } = await admin
      .from('campaigns')
      .select('id, name, setting, system, created_by')
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

    const packTypes = PACK_PLAYER_TYPES[campaign.system] || [];
    const extraTypeDefs = [...packTypes, ...(customTypes || [])];
    const PLAYER_TYPES = [...BUILTIN_PLAYER_TYPES, ...extraTypeDefs.map((t) => t.key)];

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
        // Pack + custom type defs together — the client renders both the same way.
        entityTypes: extraTypeDefs,
      },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
