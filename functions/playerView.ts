import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // CORS headers for browser access
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

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

    // Player-facing entity types only (never creatures/encounters/PCs/shops).
    const PLAYER_TYPES = ['npc', 'location', 'faction', 'item', 'thread', 'event', 'lore', 'deity'];

    // Find campaign by share token where sharing is enabled.
    // Project to only player-safe columns — never the share token, created_by, etc.
    const { data: campaigns, error: campError } = await admin
      .from('campaigns')
      .select('id, name, setting')
      .eq('player_share_token', token)
      .eq('is_shared', true)
      .limit(1);

    if (campError || !campaigns || campaigns.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    const campaign = campaigns[0];

    // Player-visible entities — safe fields only (no description/extra_data/secrets).
    const { data: entities } = await admin
      .from('world_entities')
      .select('id, entity_type, name, summary, visibility')
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
        campaign: { name: campaign.name, setting: campaign.setting },
        entities: entities || [],
        sessions: sessions || [],
      },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
