import React from 'react';
import { cn } from '@/lib/utils';

// Small "BETA" tag shown next to the GM/OS wordmark while the product is in beta.
export default function BetaBadge({ className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 align-middle',
        'text-[10px] font-bold uppercase tracking-wider leading-none',
        'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
        className,
      )}
    >
      Beta
    </span>
  );
}
