import React, { useState, useEffect } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { MOD_LABEL } from '@/lib/useHotkeys';
import { cn } from '@/lib/utils';

// System "modes" GM/OS can be in, driven by campaign.active_mode.
const MODES = {
  prep: { label: 'PREP', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  session: { label: 'RUN', dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-600 dark:text-emerald-400' },
  debrief: { label: 'DEBRIEF', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400' },
};

// Persistent OS-style status bar pinned to the bottom of the app shell.
// Surfaces real system state: current mode, live activity, and the clock.
export default function StatusBar({ campaign }) {
  const fetching = useIsFetching();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const mode = MODES[campaign?.active_mode] || MODES.prep;
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3 h-7 px-3 border-t border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 text-[11px] font-mono text-zinc-500 dark:text-zinc-500 flex-shrink-0 select-none">
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="text-amber-500">◈</span>
        <span className="truncate text-zinc-600 dark:text-zinc-400">{campaign?.name || 'GM/OS'}</span>
      </span>

      <span className={cn('flex items-center gap-1.5', mode.text)}>
        <span className={cn('w-1.5 h-1.5 rounded-full', mode.dot)} />
        {mode.label}
      </span>

      <span className="ml-auto flex items-center gap-3">
        {fetching > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-zinc-400 dark:text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            syncing
          </span>
        )}
        <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600">{MOD_LABEL}K</span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">{time}</span>
      </span>
    </div>
  );
}
