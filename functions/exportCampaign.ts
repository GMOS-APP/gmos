import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user's JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Use service role to bypass RLS for a full export
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const [
      { data: campaigns },
      { data: worldEntities },
      { data: sessions },
      { data: relationships },
      { data: campaignMaps },
      { data: quickNotes },
      { data: randomTables },
    ] = await Promise.all([
      admin.from('campaigns').select('*').eq('id', campaign_id),
      admin.from('world_entities').select('*').eq('campaign_id', campaign_id),
      admin.from('sessions').select('*').eq('campaign_id', campaign_id),
      admin.from('relationships').select('*').eq('campaign_id', campaign_id),
      admin.from('campaign_maps').select('*').eq('campaign_id', campaign_id),
      admin.from('quick_notes').select('*').eq('campaign_id', campaign_id),
      admin.from('random_tables').select('*').eq('campaign_id', campaign_id),
    ]);

    const campaign = campaigns?.[0];
    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Verify the requesting user owns this campaign
    if (campaign.created_by !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return Response.json({
      export_version: '2.0',
      exported_at: new Date().toISOString(),
      campaign,
      world_entities: worldEntities || [],
      sessions: sessions || [],
      relationships: relationships || [],
      campaign_maps: campaignMaps || [],
      quick_notes: quickNotes || [],
      random_tables: randomTables || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
