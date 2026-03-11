import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { campaign_id } = req.body;
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id is required' });

  try {
    const [
      { data: campaigns },
      { data: worldEntities },
      { data: sessions },
      { data: relationships },
      { data: campaignMaps },
      { data: quickNotes },
    ] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', campaign_id).eq('created_by', user.id),
      supabase.from('world_entities').select('*').eq('campaign_id', campaign_id),
      supabase.from('sessions').select('*').eq('campaign_id', campaign_id),
      supabase.from('relationships').select('*').eq('campaign_id', campaign_id),
      supabase.from('campaign_maps').select('*').eq('campaign_id', campaign_id),
      supabase.from('quick_notes').select('*').eq('campaign_id', campaign_id),
    ]);

    const campaign = campaigns?.[0];
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    return res.status(200).json({
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      campaign,
      world_entities: worldEntities || [],
      sessions: sessions || [],
      relationships: relationships || [],
      campaign_maps: campaignMaps || [],
      quick_notes: quickNotes || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
