import React from 'react';
import { cn } from '@/lib/utils';

// Small "ALPHA" tag for features that are still early/experimental. A distinct
// violet (vs. BetaBadge's amber) signals "even earlier than beta".
export default function AlphaBadge({ className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 align-middle',
        'text-[10px] font-bold uppercase tracking-wider leading-none',
        'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30',
        className,
      )}
    >
      Alpha
    </span>
  );
}
