// create-checkout — starts a Stripe Checkout Session for a paid tier.
// Verifies the caller's JWT, then (service role) gets-or-creates their Stripe
// customer and persists stripe_customer_id. Monthly/yearly = subscription mode,
// lifetime = one-time payment mode.
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^17';

const ALLOWED_ORIGINS = ['https://trisdenc.github.io'];
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
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://trisdenc.github.io/GM-OS';

// Price IDs aren't secret, so they default to the (sandbox) Prices created for
// GM/OS; set the STRIPE_PRICE_* secrets to override (e.g. with live-mode IDs).
const PRICE_BY_TIER: Record<string, string | undefined> = {
  monthly: Deno.env.get('STRIPE_PRICE_MONTHLY') || 'price_1TjUjMGuBN0ONk5zc5QSf2DL',
  yearly: Deno.env.get('STRIPE_PRICE_YEARLY') || 'price_1TjUjNGuBN0ONk5zyhRnk4a7',
  lifetime: Deno.env.get('STRIPE_PRICE_LIFETIME') || 'price_1TjUjOGuBN0ONk5zbkrDfsB8',
};

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  const CORS_HEADERS = cors(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const { tier } = await req.json();
    if (!['monthly', 'yearly', 'lifetime'].includes(tier)) {
      return Response.json({ error: 'Invalid tier' }, { status: 400, headers: CORS_HEADERS });
    }
    const priceId = PRICE_BY_TIER[tier];
    if (!priceId) {
      return Response.json({ error: 'Price not configured for tier' }, { status: 500, headers: CORS_HEADERS });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get-or-create the Stripe customer (service role bypasses the no-UPDATE RLS).
    const { data: profile } = await admin
      .from('user_profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.from('user_profiles')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    const mode = tier === 'lifetime' ? 'payment' : 'subscription';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, tier },
      ...(mode === 'subscription'
        ? { subscription_data: { metadata: { supabase_user_id: user.id, tier } } }
        : {}),
      allow_promotion_codes: true,
      success_url: `${APP_URL}/AccountSettings?checkout=success`,
      cancel_url: `${APP_URL}/Upgrade?checkout=cancel`,
    });

    return Response.json({ url: session.url }, { headers: CORS_HEADERS });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: CORS_HEADERS });
  }
});
