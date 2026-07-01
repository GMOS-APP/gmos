// export-account — Right to access / data portability (GDPR Art. 15/20, CCPA,
// LGPD). Returns EVERYTHING tied to the authenticated user: their account
// identity, profile, and all content across every table. Service role is used
// only after the caller's JWT is verified, and only for that user's own rows.
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

// Every table that stores user content, keyed by created_by.
const OWNED_TABLES = [
  'campaigns', 'world_entities', 'sessions', 'relationships',
  'campaign_maps', 'quick_notes', 'random_tables', 'entity_types',
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

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const data: Record<string, unknown> = {};
    for (const table of OWNED_TABLES) {
      const { data: rows } = await admin.from(table).select('*').eq('created_by', user.id);
      data[table] = rows || [];
    }
    const { data: profile } = await admin
      .from('user_profiles').select('*').eq('id', user.id).maybeSingle();

    // The identity stored in Supabase Auth (email / name / providers).
    const account = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      providers: user.app_metadata?.providers ?? (user.app_metadata?.provider ? [user.app_metadata.provider] : []),
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };

    return Response.json({
      export_kind: 'gm-os-account',
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      account,
      user_profile: profile ?? null,
      data,
    }, { headers: CORS_HEADERS });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: CORS_HEADERS });
  }
});
