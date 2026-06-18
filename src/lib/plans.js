// Single source of truth for plan/tier presentation and the free-tier limit.
// Entitlement is binary in the app (isPlus = plan !== 'free' in AuthContext);
// these tiers map to the Stripe Prices created in the dashboard.

export const FREE_CAMPAIGN_LIMIT = 1;

// The free entry point — shown as the first pricing column on the landing page.
export const FREE_TIER = {
  id: 'free',
  name: 'Free',
  price: '$0',
  cadence: 'forever',
  blurb: 'One fully-featured campaign. No card required.',
};

// Reassurance shown beneath the pricing grid.
export const RISK_REVERSAL = 'No credit card to start · cancel anytime · export your data whenever.';

// Paid tiers offered at checkout. `id` is passed to the create-checkout function.
export const PAID_TIERS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$3.99',
    cadence: '/mo',
    blurb: 'Billed monthly. Cancel anytime.',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$29.99',
    cadence: '/yr',
    blurb: 'Best value — save 37% vs monthly.',
    badge: 'Save 37%',
    highlight: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$49.99',
    cadence: 'once',
    blurb: 'Pay once, yours forever. Only offered during beta.',
    badge: 'Beta exclusive',
  },
];

// Founding-member framing shown above the pricing grid during beta.
export const BETA_PRICING_NOTE = 'Lock in your rate before it rises at launch — it never goes up while you stay subscribed.';

// Human label for a stored plan value.
export const PLAN_LABELS = {
  free: 'Free',
  plus: 'Plus',
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime: 'Lifetime',
};

// What every paid tier unlocks (the honest pitch: Free is fully featured on one
// campaign; paying lifts the campaign cap and supports development).
export const PLUS_BENEFITS = [
  'Unlimited campaigns',
  'Everything in Free — every feature, no limits',
  'Battle Map, Player View sharing & D&D Beyond import',
  'Full campaign export & backup',
  'Support an independent developer',
];

// True when an error (from a campaign insert or the import function) is the
// free-tier campaign-limit signal raised by the enforce_free_campaign_limit
// trigger, so callers can show the upgrade prompt instead of a generic failure.
export function isCampaignLimitError(error) {
  if (!error) return false;
  if (error.hint === 'CAMPAIGN_LIMIT_REACHED') return true;
  const msg = error.message || error.error || (typeof error === 'string' ? error : '');
  return /CAMPAIGN_LIMIT_REACHED/.test(msg) || /Free plan is limited to 1 campaign/i.test(msg);
}
