import React, { useState, useEffect } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { LayoutGrid, Search } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { MOD_LABEL } from '@/lib/useHotkeys';
import { cn } from '@/lib/utils';

// System "modes" GM/OS can be in, driven by campaign.active_mode.
const MODES = {
  prep: { label: 'PREP', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  session: { label: 'RUN', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600 dark:text-emerald-400' },
  debrief: { label: 'DEBRIEF', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
};

// Full-width OS taskbar: Start button, system state, breadcrumbs, and a
// clustered system tray (search, live activity, theme, clock).
export default function Taskbar({ campaign, currentPageName, startActive, onStart, onSearch }) {
  const fetching = useIsFetching();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const mode = MODES[campaign?.active_mode] || MODES.prep;
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="flex items-center gap-2 h-10 px-2 border-b border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-950 flex-shrink-0 z-30 select-none">
      <button
        data-start-button
        onClick={onStart}
        aria-label="Start menu"
        className={cn(
          'flex items-center gap-1.5 h-7 px-2.5 rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
          startActive
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
        )}
      >
        <LayoutGrid className="w-4 h-4 text-amber-500" />
        <span>GM<span className="text-amber-500">/OS</span></span>
      </button>

      <span className={cn('flex items-center gap-1.5 font-mono text-[11px] flex-shrink-0', mode.text)}>
        <span className={cn('w-1.5 h-1.5 rounded-full', mode.dot)} />
        {mode.label}
      </span>

      <div className="hidden md:flex flex-1 min-w-0 items-center pl-1">
        <Breadcrumbs currentPageName={currentPageName} campaign={campaign} />
      </div>

      {/* System tray */}
      <div className="ml-auto flex items-center gap-0.5 pl-1 pr-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <button
          onClick={onSearch}
          title={`Search (${MOD_LABEL}K)`}
          aria-label="Search"
          className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        {fetching > 0 && (
          <span className="hidden sm:flex items-center gap-1 px-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            sync
          </span>
        )}
        <ThemeToggle />
        <span className="px-2 font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">{time}</span>
      </div>
    </header>
  );
}
