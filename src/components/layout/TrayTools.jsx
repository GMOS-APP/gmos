import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dices, Timer, Wand2, ListChecks, X } from 'lucide-react';
import DiceRoller from '@/components/session/DiceRoller';
import StandaloneTimer from '@/components/dashboard/StandaloneTimer';
import NameGenerator from '@/components/tools/NameGenerator';
import QuickTableRoll from '@/components/tools/QuickTableRoll';
import { cn } from '@/lib/utils';

// Quick GM tools, launched as system-tray icons. Each renders a self-contained
// component in a floating window that drops down from the tray.
const TOOLS = [
  { id: 'dice', label: 'Dice', Icon: Dices, width: 'w-72', render: () => <DiceRoller /> },
  { id: 'timer', label: 'Countdown', Icon: Timer, width: 'w-64', render: () => <div className="h-52"><StandaloneTimer /></div> },
  { id: 'names', label: 'Names', Icon: Wand2, width: 'w-64', render: (cid) => <NameGenerator campaignId={cid} /> },
  { id: 'tables', label: 'Tables', Icon: ListChecks, width: 'w-64', render: (cid) => <QuickTableRoll campaignId={cid} /> },
];

export default function TrayTools({ campaignId }) {
  const [active, setActive] = useState(null);
  const tool = TOOLS.find((t) => t.id === active);

  // Close on Escape.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <>
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

      {tool && createPortal(
        <ToolWindow tool={tool} campaignId={campaignId} onClose={() => setActive(null)} />,
        document.body
      )}
    </>
  );
}

function ToolWindow({ tool, campaignId, onClose }) {
  // Close when clicking outside the window (but not on a tray tool button).
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
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-2">{tool.render(campaignId)}</div>
      </div>
    </div>
  );
}
