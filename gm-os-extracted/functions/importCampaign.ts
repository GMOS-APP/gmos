import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaign, world_entities = [], sessions = [], relationships = [], campaign_maps = [], quick_notes = [] } = body;

    if (!campaign) {
      return Response.json({ error: 'Invalid backup file: missing campaign data' }, { status: 400 });
    }

    // Strip built-in read-only fields before creating new records
    const strip = (obj) => {
      const { id, created_date, updated_date, created_by, ...rest } = obj;
      return rest;
    };

    // 1. Create new campaign
    const newCampaign = await base44.entities.Campaign.create(strip(campaign));
    const newCampaignId = newCampaign.id;

    // 2. Create world entities and build old-id -> new-id map
    const entityIdMap = {};
    await Promise.all(
      world_entities.map(async (e) => {
        const newEntity = await base44.entities.WorldEntity.create({
          ...strip(e),
          campaign_id: newCampaignId,
        });
        entityIdMap[e.id] = newEntity.id;
      })
    );

    // 3. Create sessions, remapping linked entity references
    const sessionIdMap = {};
    await Promise.all(
      sessions.map(async (s) => {
        const linked = (s.linked_entities || []).map((le) => ({
          ...le,
          entity_id: entityIdMap[le.entity_id] || le.entity_id,
        }));
        const newSession = await base44.entities.Session.create({
          ...strip(s),
          campaign_id: newCampaignId,
          linked_entities: linked,
        });
        sessionIdMap[s.id] = newSession.id;
      })
    );

    // 4. Create relationships, remapping source/target entity IDs
    await Promise.all(
      relationships.map((r) =>
        base44.entities.Relationship.create({
          ...strip(r),
          campaign_id: newCampaignId,
          source_entity_id: entityIdMap[r.source_entity_id] || r.source_entity_id,
          target_entity_id: entityIdMap[r.target_entity_id] || r.target_entity_id,
        })
      )
    );

    // 5. Create campaign maps, remapping pin entity IDs
    await Promise.all(
      campaign_maps.map((m) => {
        const pins = (m.pins || []).map((pin) => ({
          ...pin,
          entity_id: entityIdMap[pin.entity_id] || pin.entity_id,
        }));
        return base44.entities.CampaignMap.create({
          ...strip(m),
          campaign_id: newCampaignId,
          pins,
        });
      })
    );

    // 6. Create quick notes, remapping extracted entity IDs
    await Promise.all(
      quick_notes.map((n) => {
        const extracted = (n.extracted_entities || []).map((eid) => entityIdMap[eid] || eid);
        return base44.entities.QuickNote.create({
          ...strip(n),
          campaign_id: newCampaignId,
          extracted_entities: extracted,
        });
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
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});