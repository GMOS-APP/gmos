// party-inventory — token-authenticated party inventory for the public player
// share link. Anyone with a campaign's share token may list/add/update/delete
// inventory items and update party currency, scoped strictly to that campaign.
// (The GM manages the same data directly through RLS in GM-OS.)
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : null);
const qty = (v: unknown) => Math.max(0, Math.min(99999, parseInt(String(v), 10) || 0));
const coin = (v: unknown) => Math.max(0, Math.min(9999999, parseInt(String(v), 10) || 0));
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token;
    if (!token) return json({ error: 'token is required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: camps } = await admin
      .from('campaigns').select('id, party_currency')
      .eq('player_share_token', token).eq('is_shared', true).limit(1);
    if (!camps || camps.length === 0) return json({ error: 'Not found' }, 404);
    const campaign = camps[0];
    const action = body?.action || 'list';

    if (action === 'list') {
      const [{ data: items }, { data: notes }] = await Promise.all([
        admin.from('party_inventory')
          .select('id, name, quantity, carried_by, notes, equipped, created_date')
          .eq('campaign_id', campaign.id).order('created_date', { ascending: true }),
        admin.from('player_notes')
          .select('id, content, author, created_date')
          .eq('campaign_id', campaign.id).order('created_date', { ascending: false }),
      ]);
      return json({ items: items || [], currency: campaign.party_currency || {}, notes: notes || [] });
    }

    if (action === 'note-add') {
      const n = body.note || {};
      const content = str(n.content, 2000)?.trim();
      if (!content) return json({ error: 'content is required' }, 400);
      const { data, error } = await admin.from('player_notes').insert({
        campaign_id: campaign.id, content, author: str(n.author, 60),
      }).select('id, content, author, created_date').single();
      if (error) return json({ error: error.message }, 400);
      return json({ note: data });
    }

    if (action === 'note-delete') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('player_notes').delete().eq('id', body.id).eq('campaign_id', campaign.id);
      return json({ ok: true });
    }

    if (action === 'add') {
      const it = body.item || {};
      const name = str(it.name, 120)?.trim();
      if (!name) return json({ error: 'name is required' }, 400);
      const { data, error } = await admin.from('party_inventory').insert({
        campaign_id: campaign.id,
        name,
        quantity: it.quantity == null ? 1 : qty(it.quantity),
        carried_by: str(it.carried_by, 80),
        notes: str(it.notes, 500),
        equipped: !!it.equipped,
      }).select('id, name, quantity, carried_by, notes, equipped, created_date').single();
      if (error) return json({ error: error.message }, 400);
      return json({ item: data });
    }

    if (action === 'update') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      const patch = body.patch || {};
      const upd: Record<string, unknown> = { updated_date: new Date().toISOString() };
      if ('name' in patch) upd.name = str(patch.name, 120)?.trim() || 'Item';
      if ('quantity' in patch) upd.quantity = qty(patch.quantity);
      if ('carried_by' in patch) upd.carried_by = str(patch.carried_by, 80);
      if ('notes' in patch) upd.notes = str(patch.notes, 500);
      if ('equipped' in patch) upd.equipped = !!patch.equipped;
      const { data, error } = await admin
        .from('party_inventory').update(upd)
        .eq('id', body.id).eq('campaign_id', campaign.id)
        .select('id, name, quantity, carried_by, notes, equipped, created_date').single();
      if (error) return json({ error: error.message }, 400);
      return json({ item: data });
    }

    if (action === 'delete') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('party_inventory').delete().eq('id', body.id).eq('campaign_id', campaign.id);
      return json({ ok: true });
    }

    if (action === 'currency') {
      const cur = body.currency || {};
      const clean: Record<string, number> = {};
      for (const k of ['pp', 'gp', 'sp', 'cp']) clean[k] = coin(cur[k]);
      await admin.from('campaigns').update({ party_currency: clean }).eq('id', campaign.id);
      return json({ currency: clean });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
