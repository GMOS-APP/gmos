// delete-account — Right to erasure / "right to be forgotten" (GDPR Art. 17,
// CCPA, LGPD). Permanently and irreversibly deletes the authenticated user's
// content across every table, their profile row, and their Supabase Auth
// identity. Requires an explicit confirmation in the body as defence in depth.
// Best-effort cancels a Stripe subscription if one is on file and a Stripe key
// is configured.
import { createClient } from 'npm:@supabase/supabase-js@2';

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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Child/content tables deleted before campaigns; all are keyed by created_by.
const DELETE_ORDER = [
  'world_entities', 'sessions', 'relationships', 'campaign_maps',
  'quick_notes', 'random_tables', 'entity_types', 'campaigns',
];

Deno.serve(async (req) => {
  const CORS_HEADERS = cors(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return Response.json({ error: 'Confirmation required' }, { status: 400, headers: CORS_HEADERS });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Best-effort: cancel a Stripe subscription so billing stops on erasure.
    let stripe_cancelled = false;
    if (STRIPE_SECRET_KEY) {
      const { data: profile } = await admin
        .from('user_profiles').select('stripe_subscription_id').eq('id', user.id).maybeSingle();
      const subId = profile?.stripe_subscription_id;
      if (subId) {
        try {
          const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
          });
          stripe_cancelled = res.ok;
        } catch (_) { /* non-fatal: erasure proceeds regardless */ }
      }
    }

    // Delete all content this user owns.
    const deleted: Record<string, number> = {};
    for (const table of DELETE_ORDER) {
      const { data, error } = await admin.from(table).delete().eq('created_by', user.id).select('id');
      if (error) throw new Error(`Failed deleting ${table}: ${error.message}`);
      deleted[table] = data?.length ?? 0;
    }

    // Delete the profile row.
    await admin.from('user_profiles').delete().eq('id', user.id);

    // Finally, delete the auth identity itself.
    const { error: delUserError } = await admin.auth.admin.deleteUser(user.id);
    if (delUserError) throw new Error(`Failed deleting auth user: ${delUserError.message}`);

    return Response.json({ ok: true, deleted, stripe_cancelled }, { headers: CORS_HEADERS });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: CORS_HEADERS });
  }
});
