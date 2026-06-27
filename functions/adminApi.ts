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
      const plus = (plans || []).filter((p) => p.plan && p.plan !== 'free').length;
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
      if (!userId || !['free', 'plus', 'monthly', 'yearly', 'lifetime'].includes(plan)) {
        return json({ error: 'Invalid plan' }, 400);
      }
      // Lifetime never expires; free has no expiry either.
      const planExpires = (plan === 'lifetime' || plan === 'free') ? null : (expires || null);
      await admin.from('user_profiles').update({
        plan, plan_expires_at: planExpires, updated_at: new Date().toISOString(),
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

    if (action === 'feedback-list') {
      const { data } = await admin.from('feedback').select('*').order('created_date', { ascending: false }).limit(500);
      return json({ feedback: data || [] });
    }

    if (action === 'feedback-status') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('feedback').update({ status: body.status === 'resolved' ? 'resolved' : 'open' }).eq('id', body.id);
      return json({ ok: true });
    }

    if (action === 'feedback-delete') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('feedback').delete().eq('id', body.id);
      return json({ ok: true });
    }

    if (action === 'newsletter-list') {
      const { data } = await admin.from('newsletter_subscribers')
        .select('id, email, source, created_at').order('created_at', { ascending: false }).limit(5000);
      return json({ subscribers: data || [] });
    }

    if (action === 'newsletter-delete') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('newsletter_subscribers').delete().eq('id', body.id);
      return json({ ok: true });
    }

    if (action === 'announcement-list') {
      const { data } = await admin.from('announcements').select('*').order('created_date', { ascending: false }).limit(200);
      return json({ announcements: data || [] });
    }

    if (action === 'announcement-save') {
      const a = body.announcement || {};
      const title = (a.title || '').trim();
      if (!title) return json({ error: 'title is required' }, 400);
      const row = {
        title: title.slice(0, 200),
        body: (a.body || '').slice(0, 2000) || null,
        level: ['info', 'warning', 'success'].includes(a.level) ? a.level : 'info',
        published: !!a.published,
      };
      if (a.id) {
        const { data, error } = await admin.from('announcements')
          .update({ ...row, updated_date: new Date().toISOString() }).eq('id', a.id).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ announcement: data });
      }
      const { data, error } = await admin.from('announcements').insert({ ...row, created_by: me.id }).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ announcement: data });
    }

    if (action === 'announcement-delete') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('announcements').delete().eq('id', body.id);
      return json({ ok: true });
    }

    if (action === 'changelog-list') {
      const { data } = await admin.from('changelog').select('*').order('version', { ascending: false }).limit(200);
      return json({ changelog: data || [] });
    }

    if (action === 'changelog-save') {
      const c = body.entry || {};
      const version = (c.version || '').trim();
      if (!version) return json({ error: 'version is required' }, 400);
      const entries = Array.isArray(c.entries)
        ? c.entries.filter((e) => e && e.text).map((e) => ({
            type: ['new', 'improved', 'fixed'].includes(e.type) ? e.type : 'new',
            text: String(e.text).slice(0, 500),
          }))
        : [];
      const row = { version: version.slice(0, 40), date: (c.date || '').slice(0, 60) || null, entries, published: c.published !== false };
      if (c.id) {
        const { data, error } = await admin.from('changelog')
          .update({ ...row, updated_date: new Date().toISOString() }).eq('id', c.id).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ entry: data });
      }
      const { data, error } = await admin.from('changelog').insert({ ...row, created_by: me.id }).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ entry: data });
    }

    if (action === 'changelog-delete') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('changelog').delete().eq('id', body.id);
      return json({ ok: true });
    }

    if (action === 'set-accent') {
      const accent = body.accent;
      if (accent !== null && !/^#[0-9a-fA-F]{6}$/.test(String(accent || ''))) {
        return json({ error: 'Invalid color' }, 400);
      }
      await admin.from('app_settings').upsert({ id: 'global', accent: accent || null, updated_at: new Date().toISOString() });
      return json({ ok: true, accent: accent || null });
    }

    if (action === 'blog-list') {
      const { data } = await admin.from('blog_posts').select('*')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }).limit(200);
      return json({ posts: data || [] });
    }

    if (action === 'blog-save') {
      const p = body.post || {};
      const title = (p.title || '').trim();
      if (!title) return json({ error: 'title is required' }, 400);
      const slug = ((p.slug || title).toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).slice(0, 80);
      if (!slug) return json({ error: 'invalid slug' }, 400);
      const row = {
        slug,
        title: title.slice(0, 200),
        excerpt: (p.excerpt || '').slice(0, 500) || null,
        body: p.body || null,
        cover_image: (p.cover_image || '').slice(0, 500) || null,
        category: (p.category || 'GM Tips').slice(0, 60),
        author: (p.author || 'GM/OS').slice(0, 80),
        published: !!p.published,
        published_at: p.published ? (p.published_at || new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
      };
      if (p.id) {
        const { data, error } = await admin.from('blog_posts').update(row).eq('id', p.id).select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ post: data });
      }
      const { data, error } = await admin.from('blog_posts').insert({ ...row, created_by: me.id }).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ post: data });
    }

    if (action === 'blog-delete') {
      if (!body.id) return json({ error: 'id is required' }, 400);
      await admin.from('blog_posts').delete().eq('id', body.id);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ error: (e as Error).message }, 500);
  }
});
