import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const strip = ({ id, created_date, updated_date, created_by, ...rest }) => rest;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const {
    campaign,
    world_entities = [],
    sessions = [],
    relationships = [],
    campaign_maps = [],
    quick_notes = [],
  } = req.body;

  if (!campaign) return res.status(400).json({ error: 'Invalid backup: missing campaign data' });

  try {
    // 1. Create new campaign
    const { data: newCampaign, error: ce } = await supabase
      .from('campaigns')
      .insert({ ...strip(campaign), created_by: user.id })
      .select()
      .single();
    if (ce) throw ce;
    const newCampaignId = newCampaign.id;

    // 2. Create world entities and build old-id → new-id map
    const entityIdMap = {};
    await Promise.all(
      world_entities.map(async (e) => {
        const { data: newEntity, error } = await supabase
          .from('world_entities')
          .insert({ ...strip(e), campaign_id: newCampaignId, created_by: user.id })
          .select()
          .single();
        if (error) throw error;
        entityIdMap[e.id] = newEntity.id;
      })
    );

    // 3. Create sessions, remapping linked entity references
    await Promise.all(
      sessions.map(async (s) => {
        const linked = (s.linked_entities || []).map((le) => ({
          ...le,
          entity_id: entityIdMap[le.entity_id] || le.entity_id,
        }));
        const { error } = await supabase
          .from('sessions')
          .insert({ ...strip(s), campaign_id: newCampaignId, linked_entities: linked, created_by: user.id });
        if (error) throw error;
      })
    );

    // 4. Create relationships, remapping entity IDs
    await Promise.all(
      relationships.map(async (r) => {
        const { error } = await supabase.from('relationships').insert({
          ...strip(r),
          campaign_id: newCampaignId,
          source_entity_id: entityIdMap[r.source_entity_id] || r.source_entity_id,
          target_entity_id: entityIdMap[r.target_entity_id] || r.target_entity_id,
          created_by: user.id,
        });
        if (error) throw error;
      })
    );

    // 5. Create campaign maps, remapping pin entity IDs
    await Promise.all(
      campaign_maps.map(async (m) => {
        const pins = (m.pins || []).map((pin) => ({
          ...pin,
          entity_id: entityIdMap[pin.entity_id] || pin.entity_id,
        }));
        const { error } = await supabase
          .from('campaign_maps')
          .insert({ ...strip(m), campaign_id: newCampaignId, pins, created_by: user.id });
        if (error) throw error;
      })
    );

    // 6. Create quick notes, remapping extracted entity IDs
    await Promise.all(
      quick_notes.map(async (n) => {
        const extracted = (n.extracted_entities || []).map((eid) => entityIdMap[eid] || eid);
        const { error } = await supabase
          .from('quick_notes')
          .insert({ ...strip(n), campaign_id: newCampaignId, extracted_entities: extracted, created_by: user.id });
        if (error) throw error;
      })
    );

    return res.status(200).json({
      success: true,
      campaign_id: newCampaignId,
      campaign_name: newCampaign.name,
      stats: {
        world_entities: world_entities.length,
        sessions: sessions.length,
        relationships: relationships.length,
        campaign_maps: campaign_maps.length,
        quick_notes: quick_notes.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
