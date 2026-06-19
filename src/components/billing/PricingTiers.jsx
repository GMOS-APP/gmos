import React from 'react';
import { Check, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PAID_TIERS, FREE_TIER, PLUS_BENEFITS, BETA_PRICING_NOTE } from '@/lib/plans';

/**
 * Pricing cards. By default monthly / yearly / lifetime; pass showFree to
 * prepend the Free column (used on the marketing landing page).
 * @param {{ onSelect?: (tierId: string) => void, currentPlan?: string,
 *           loadingTier?: string|null, ctaLabel?: string, showFree?: boolean }} props
 */
export default function PricingTiers({ onSelect, currentPlan, loadingTier, ctaLabel = 'Choose', showFree = false }) {
  const tiers = showFree ? [FREE_TIER, ...PAID_TIERS] : PAID_TIERS;
  return (
    <div className="space-y-5">
      {/* Founding-member / beta lock-in banner */}
      <div className="mx-auto max-w-2xl flex items-center justify-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5">
        <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
          <span className="font-semibold">Founding-member beta pricing.</span> {BETA_PRICING_NOTE}
        </p>
      </div>

      <div className={cn('grid grid-cols-1 gap-4', showFree ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3')}>
      {tiers.map((tier) => {
        const isCurrent = currentPlan === tier.id;
        const isLoading = loadingTier === tier.id;
        return (
          <div
            key={tier.id}
            className={cn(
              'relative flex flex-col rounded-xl border p-5 bg-white dark:bg-zinc-900/50',
              tier.highlight
                ? 'border-amber-500/60 dark:border-amber-500/50 shadow-[0_0_0_1px_theme(colors.amber.500/0.4)]'
                : 'border-zinc-200 dark:border-zinc-800',
            )}
          >
            {tier.badge && (
              <span className="absolute -top-2.5 left-5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-zinc-950">
                {tier.badge}
              </span>
            )}
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{tier.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{tier.price}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">{tier.cadence}</span>
            </div>
            {tier.regularPrice && (
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-600">
                <span className="line-through">{tier.regularPrice}{tier.id === 'lifetime' ? '' : tier.cadence}</span> after beta
              </p>
            )}
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500 min-h-[2rem]">{tier.blurb}</p>
            <Button
              onClick={() => onSelect?.(tier.id)}
              disabled={isCurrent || isLoading || !onSelect}
              className={cn(
                'mt-4 w-full font-semibold',
                tier.highlight
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900',
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isCurrent ? 'Current plan' : ctaLabel}
            </Button>
          </div>
        );
      })}
      <ul className="col-span-full mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {PLUS_BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> {b}
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
