import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Fetch all campaign data in parallel
    const [campaigns, worldEntities, sessions, relationships, campaignMaps, quickNotes] = await Promise.all([
      base44.asServiceRole.entities.Campaign.filter({ id: campaign_id }),
      base44.asServiceRole.entities.WorldEntity.filter({ campaign_id }),
      base44.asServiceRole.entities.Session.filter({ campaign_id }),
      base44.asServiceRole.entities.Relationship.filter({ campaign_id }),
      base44.asServiceRole.entities.CampaignMap.filter({ campaign_id }),
      base44.asServiceRole.entities.QuickNote.filter({ campaign_id }),
    ]);

    const campaign = campaigns?.[0];
    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const exportData = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      campaign,
      world_entities: worldEntities || [],
      sessions: sessions || [],
      relationships: relationships || [],
      campaign_maps: campaignMaps || [],
      quick_notes: quickNotes || [],
    };

    return Response.json(exportData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});