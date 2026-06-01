import React from 'react';
import { Search } from 'lucide-react';
import { MOD_LABEL } from '@/lib/useHotkeys';

// Trigger for the command palette. Live search + commands live in CommandPalette.
export default function GlobalSearch({ onClick }) {
  return (
    <div className="relative flex-1 max-w-sm">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 transition-colors"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs flex-1 text-left">Search…</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          {MOD_LABEL}K
        </kbd>
      </button>
    </div>
  );
}
