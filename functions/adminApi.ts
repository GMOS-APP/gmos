// admin-api — owner/admin console backend. Every action re-verifies, server
// side, that the caller is an admin (is_admin on user_profiles, which users
// cannot self-set) before using the service role. The frontend gate is UX only.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Returns the authenticated admin's user, or throws a Response to short-circuit.
async function requireAdmin(req: Request, admin: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw json({ error: 'Unauthorized' }, 401);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw json({ error: 'Unauthorized' }, 401);
  const { data: profile } = await admin.from('user_profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) throw json({ error: 'Forbidden' }, 403);
  return user;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  try {
    const me = await requireAdmin(req, admin);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'me';

    if (action === 'me') return json({ is_admin: true, id: me.id, email: me.email });

    if (action === 'stats') {
      const counts = async (table: string) => {
        const { count } = await admin.from(table).select('*', { count: 'exact', head: true });
        return count || 0;
      };
      const [users, campaigns, sessions, entities] = await Promise.all([
        counts('user_profiles'), counts('campaigns'), counts('sessions'), counts('world_entities'),
      ]);
      const { data: plans } = await admin.from('user_profiles').select('plan');
      const plus = (plans || []).filter((p) => p.plan === 'plus').length;
      return json({ stats: { users, campaigns, sessions, entities, plus } });
    }

    if (action === 'users') {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const { data: profiles } = await admin.from('user_profiles').select('id, plan, is_admin, plan_expires_at');
      const { data: camps } = await admin.from('campaigns').select('created_by');
      const profMap = new Map((profiles || []).map((p) => [p.id, p]));
      const campCount = new Map<string, number>();
      (camps || []).forEach((c) => campCount.set(c.created_by, (campCount.get(c.created_by) || 0) + 1));
      const users = (list?.users || []).map((u) => {
        const p = profMap.get(u.id) || {};
        return {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          provider: u.app_metadata?.provider || 'email',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          plan: p.plan || 'free',
          is_admin: !!p.is_admin,
          plan_expires_at: p.plan_expires_at || null,
          campaigns: campCount.get(u.id) || 0,
        };
      }).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      return json({ users });
    }

    if (action === 'set-plan') {
      const { userId, plan, expires } = body;
      if (!userId || !['free', 'plus'].includes(plan)) return json({ error: 'Invalid plan' }, 400);
      await admin.from('user_profiles').update({
        plan, plan_expires_at: expires || null, updated_at: new Date().toISOString(),
      }).eq('id', userId);
      return json({ ok: true });
    }

    if (action === 'delete-user') {
      const { userId, confirm } = body;
      if (!userId || confirm !== true) return json({ error: 'Confirmation required' }, 400);
      if (userId === me.id) return json({ error: 'You cannot delete your own admin account here.' }, 400);
      // Don't allow deleting another admin via this path.
      const { data: target } = await admin.from('user_profiles').select('is_admin').eq('id', userId).maybeSingle();
      if (target?.is_admin) return json({ error: 'Cannot delete an admin account.' }, 400);

      // Delete content, then campaigns (cascades party_inventory/player_notes), then profile + auth.
      for (const table of ['world_entities', 'sessions', 'relationships', 'campaign_maps', 'quick_notes', 'random_tables']) {
        await admin.from(table).delete().eq('created_by', userId);
      }
      await admin.from('campaigns').delete().eq('created_by', userId);
      await admin.from('user_profiles').delete().eq('id', userId);
      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) return json({ error: delErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: (e as Error).message }, 500);
  }
});
