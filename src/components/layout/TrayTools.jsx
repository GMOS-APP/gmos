import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dices, Timer, Wand2, ListChecks, X, Wrench, ChevronLeft } from 'lucide-react';
import DiceRoller from '@/components/session/DiceRoller';
import StandaloneTimer from '@/components/dashboard/StandaloneTimer';
import NameGenerator from '@/components/tools/NameGenerator';
import QuickTableRoll from '@/components/tools/QuickTableRoll';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { cn } from '@/lib/utils';

// Quick GM tools. On desktop they're system-tray icons that open a floating
// window; on mobile a single "Tools" icon opens a bottom sheet.
const TOOLS = [
  { id: 'dice', label: 'Dice', Icon: Dices, width: 'w-72', render: () => <DiceRoller /> },
  { id: 'timer', label: 'Countdown', Icon: Timer, width: 'w-64', render: () => <div className="h-52"><StandaloneTimer /></div> },
  { id: 'names', label: 'Names', Icon: Wand2, width: 'w-64', render: (cid) => <NameGenerator campaignId={cid} /> },
  { id: 'tables', label: 'Tables', Icon: ListChecks, width: 'w-64', render: (cid) => <QuickTableRoll campaignId={cid} /> },
];

export default function TrayTools({ campaignId }) {
  const wide = useMediaQuery('(min-width: 768px)');
  const [active, setActive] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const tool = TOOLS.find((t) => t.id === active);

  // Escape closes the desktop window.
  useEffect(() => {
    if (!active || !wide) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, wide]);

  return (
    <>
      {/* Desktop: one icon per tool */}
      {TOOLS.map(({ id, label, Icon }) => (
        <span key={id} className="relative hidden md:flex group/tt">
          <button
            data-tray-tool={id}
            onClick={() => setActive((cur) => (cur === id ? null : id))}
            aria-label={label}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
              active === id
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
          <span className="pointer-events-none absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 dark:bg-zinc-700 text-white text-[10px] font-medium px-1.5 py-0.5 opacity-0 group-hover/tt:opacity-100 transition-opacity z-[60] shadow-lg">
            {label}
          </span>
        </span>
      ))}

      {/* Mobile: a single Tools launcher */}
      <button
        onClick={() => { setActive(null); setMobileOpen(true); }}
        aria-label="Tools"
        className="md:hidden h-10 w-10 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <Wrench className="w-4 h-4" />
      </button>

      {/* Desktop floating window */}
      {wide && tool && createPortal(
        <ToolWindow tool={tool} campaignId={campaignId} onClose={() => setActive(null)} />,
        document.body
      )}

      {/* Mobile bottom sheet */}
      {!wide && (
        <Drawer open={mobileOpen} onOpenChange={(o) => { setMobileOpen(o); if (!o) setActive(null); }}>
          <DrawerContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="px-4 pb-8 pt-2 max-h-[80vh] overflow-y-auto">
              {!tool ? (
                <>
                  <DrawerTitle className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 px-1">Tools</DrawerTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {TOOLS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActive(id)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
                      >
                        <Icon className="w-6 h-6 text-amber-500" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setActive(null)} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                      <ChevronLeft className="w-4 h-4" /> Tools
                    </button>
                    <DrawerTitle className="ml-auto text-sm font-semibold text-zinc-700 dark:text-zinc-300">{tool.label}</DrawerTitle>
                  </div>
                  <div>{tool.render(campaignId)}</div>
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

function ToolWindow({ tool, campaignId, onClose }) {
  useEffect(() => {
    const onDown = (e) => {
      if (e.target.closest('[data-tool-window]') || e.target.closest('[data-tray-tool]')) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  return (
    <div data-tool-window className={cn('hidden md:block fixed top-12 sm:top-11 right-2 z-50', tool.width)}>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{tool.label}</span>
          <button onClick={onClose} aria-label="Close"
            className="ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-2">{tool.render(campaignId)}</div>
      </div>
    </div>
  );
}
