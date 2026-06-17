import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PAID_TIERS, PLUS_BENEFITS } from '@/lib/plans';

/**
 * Three pricing cards (monthly / yearly / lifetime).
 * @param {{ onSelect?: (tierId: string) => void, currentPlan?: string,
 *           loadingTier?: string|null, ctaLabel?: string }} props
 */
export default function PricingTiers({ onSelect, currentPlan, loadingTier, ctaLabel = 'Choose' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {PAID_TIERS.map((tier) => {
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
      <ul className="sm:col-span-3 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {PLUS_BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
