// stripe-webhook — server-to-server endpoint Stripe calls to keep
// user_profiles.plan in sync. Deploy with verify_jwt=false (no Supabase JWT).
// NO CORS gating: Stripe sends no Origin header and browsers never call this.
// The body MUST be read raw and signature-verified before it is trusted.
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^17';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

// Defaults to the sandbox Prices; override via secrets for live mode.
const PRICE_MONTHLY = Deno.env.get('STRIPE_PRICE_MONTHLY') || 'price_1TjUjMGuBN0ONk5zc5QSf2DL';
const PRICE_YEARLY = Deno.env.get('STRIPE_PRICE_YEARLY') || 'price_1TjqScGuBN0ONk5zZdZnU0Im';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const toISO = (unixSeconds?: number | null) =>
  unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;

// current_period_end lives on the subscription in older API versions but moved
// to the line items in newer ones — read whichever is present.
// deno-lint-ignore no-explicit-any
const periodEnd = (sub: any) =>
  toISO(sub?.current_period_end ?? sub?.items?.data?.[0]?.current_period_end);

// Map an active subscription price back to our tier name.
function tierFromPriceId(priceId?: string | null): 'monthly' | 'yearly' | null {
  if (priceId && priceId === PRICE_MONTHLY) return 'monthly';
  if (priceId && priceId === PRICE_YEARLY) return 'yearly';
  return null;
}

// Resolve our Supabase user id from event metadata, else by stripe_customer_id.
// deno-lint-ignore no-explicit-any
async function resolveUserId(obj: any): Promise<string | null> {
  const fromMeta = obj?.metadata?.supabase_user_id || obj?.client_reference_id;
  if (fromMeta) return fromMeta;
  const customerId = typeof obj?.customer === 'string' ? obj.customer : obj?.customer?.id;
  if (customerId) {
    const { data } = await admin
      .from('user_profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
    return data?.id ?? null;
  }
  return null;
}

// deno-lint-ignore no-explicit-any
async function updateProfile(userId: string, fields: Record<string, any>) {
  await admin.from('user_profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  if (!sig) return new Response('Missing signature', { status: 400 });

  // deno-lint-ignore no-explicit-any
  let event: any;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET, undefined, cryptoProvider);
  } catch (err) {
    return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
  }

  // Idempotency: insert the event id; if it already exists, we've handled it.
  const { error: dupeErr } = await admin
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });
  if (dupeErr) {
    // Unique-violation = already processed → ack so Stripe stops retrying.
    if ((dupeErr as { code?: string }).code === '23505') return new Response('ok', { status: 200 });
    return new Response(`DB error: ${dupeErr.message}`, { status: 500 });
  }

  try {
    const obj = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = await resolveUserId(obj);
        if (!userId) break;
        if (obj.mode === 'payment') {
          // Lifetime — one-time payment, no subscription, never expires.
          await updateProfile(userId, { plan: 'lifetime', plan_expires_at: null });
        } else if (obj.mode === 'subscription' && obj.subscription) {
          const sub = await stripe.subscriptions.retrieve(obj.subscription as string);
          const tier = tierFromPriceId(sub.items.data[0]?.price?.id) || obj.metadata?.tier || 'monthly';
          await updateProfile(userId, {
            plan: tier,
            plan_expires_at: periodEnd(sub),
            stripe_subscription_id: sub.id,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const userId = await resolveUserId(obj);
        if (!userId) break;
        const status = obj.status;
        if (['canceled', 'unpaid', 'incomplete_expired'].includes(status)) {
          await updateProfile(userId, { plan: 'free', plan_expires_at: null, stripe_subscription_id: null });
        } else {
          const tier = tierFromPriceId(obj.items?.data?.[0]?.price?.id) || 'monthly';
          await updateProfile(userId, {
            plan: tier,
            plan_expires_at: periodEnd(obj),
            stripe_subscription_id: obj.id,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const userId = await resolveUserId(obj);
        if (!userId) break;
        await updateProfile(userId, { plan: 'free', plan_expires_at: null, stripe_subscription_id: null });
        break;
      }

      case 'invoice.paid': {
        // Renewal — refresh expiry (and tier, in case of a monthly↔yearly switch).
        if (!obj.subscription) break;
        const userId = await resolveUserId(obj);
        if (!userId) break;
        const sub = await stripe.subscriptions.retrieve(obj.subscription as string);
        const tier = tierFromPriceId(sub.items.data[0]?.price?.id) || 'monthly';
        await updateProfile(userId, {
          plan: tier,
          plan_expires_at: periodEnd(sub),
          stripe_subscription_id: sub.id,
        });
        break;
      }

      case 'invoice.payment_failed':
        // Intentionally no downgrade — let Stripe dunning retry; the eventual
        // customer.subscription.deleted/updated handles the downgrade.
        break;

      default:
        break;
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    // Handling failed after we claimed the event id — release it so Stripe's
    // retry reprocesses instead of being deduped away.
    await admin.from('stripe_events').delete().eq('id', event.id);
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }
});
