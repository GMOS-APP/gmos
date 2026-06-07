import React, { useState, useEffect } from 'react';
import { useIsFetching, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Search } from 'lucide-react';
import { Session } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { useWindowManager, titleOf } from '@/lib/WindowManager';
import TrayAudioPlayer from '@/components/layout/TrayAudioPlayer';
import TrayNotifications from '@/components/layout/TrayNotifications';
import TrayTools from '@/components/layout/TrayTools';
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
export default function Taskbar({ campaign, startActive, onStart, onSearch }) {
  const fetching = useIsFetching();
  const navigate = useNavigate();
  const wm = useWindowManager();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Shares the command palette's cache (same queryKey), so no extra fetch.
  const { data: sessions = [] } = useQuery({
    queryKey: ['global-search-sessions', campaign?.id],
    queryFn: () => Session.filter({ campaign_id: campaign?.id }, '-session_number', 100),
    enabled: !!campaign?.id,
    staleTime: 30000,
  });

  const mode = MODES[campaign?.active_mode] || MODES.prep;
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Open windows through the manager when present; fall back to routing.
  const open = (url) => { if (wm) wm.openWindow(url); else navigate(url); };

  // Jump to the live session (or the latest one) when the mode badge is clicked.
  const goToSession = () => {
    if (!campaign?.id) return;
    const target = sessions.find((s) => s.status === 'in_progress') || sessions[0];
    if (target) {
      open(createPageUrl('SessionPage') + `?id=${campaign.id}&session_id=${target.id}`);
    } else {
      open(createPageUrl('SessionBrowser') + `?campaign_id=${campaign.id}`);
    }
  };

  return (
    <header className="flex items-center gap-2 h-12 sm:h-10 px-2 border-b border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-950 flex-shrink-0 z-30 select-none">
      <button
        data-start-button
        data-tour="start"
        onClick={onStart}
        aria-label="Toggle menu"
        title="Toggle menu"
        className={cn(
          'flex items-center gap-1.5 h-10 sm:h-7 px-2.5 rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
          startActive
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
        )}
      >
        <LayoutGrid className="w-4 h-4 text-amber-500" />
        <span>GM<span className="text-amber-500">/OS</span></span>
      </button>

      <button
        data-tour="mode"
        onClick={goToSession}
        title="Go to session"
        className={cn(
          'flex items-center gap-1.5 h-9 sm:h-7 px-2 sm:px-1.5 rounded-md font-mono text-[11px] flex-shrink-0 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
          mode.text
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', mode.dot)} />
        {mode.label}
      </button>

      <WindowStrip wm={wm} />

      {/* System tray */}
      <div data-tour="tray" className="ml-auto flex items-center gap-0.5 pl-1 pr-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <button
          data-tour="search"
          onClick={onSearch}
          title={`Search (${MOD_LABEL}K)`}
          aria-label="Search"
          className="h-10 w-10 sm:h-7 sm:w-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        >
          <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
        <TrayTools campaignId={campaign?.id} />
        <span className="hidden md:block w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
        <TrayAudioPlayer />
        <TrayNotifications />
        {fetching > 0 && (
          <span className="hidden sm:flex items-center gap-1 px-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            sync
          </span>
        )}
        <ThemeToggle className="h-10 w-10 sm:h-7 sm:w-7 flex items-center justify-center" />
        <span className="hidden sm:inline px-2 font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">{time}</span>
      </div>
    </header>
  );
}

// Window buttons living in the top bar: one per open window. Click to
// focus/restore, click the active one to minimize, × to close.
function WindowStrip({ wm }) {
  if (!wm || !wm.windows.length) return <div className="flex-1 min-w-0" />;
  return (
    <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto pl-1" style={{ scrollbarWidth: 'none' }}>
      {wm.windows.map((w) => {
        const active = wm.focusedId === w.id && !w.minimized;
        return (
          <button
            key={w.id}
            onClick={() => (active ? wm.minimizeWindow(w.id) : wm.focusWindow(w.id))}
            title={titleOf(w.url)}
            className={cn(
              'group flex items-center gap-1.5 h-9 sm:h-7 px-2 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors max-w-[160px] flex-shrink-0',
              active
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : w.minimized
                  ? 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', active ? 'bg-amber-500' : 'bg-zinc-400 dark:bg-zinc-600')} />
            <span className="truncate">{titleOf(w.url)}</span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); wm.closeWindow(w.id); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 ml-0.5 leading-none"
            >×</span>
          </button>
        );
      })}
    </div>
  );
}
