import React, { useState } from 'react';
import { Dices, Timer, X } from 'lucide-react';
import DiceRoller from '@/components/session/DiceRoller';
import StandaloneTimer from '@/components/dashboard/StandaloneTimer';
import { cn } from '@/lib/utils';

// Tools launchable from anywhere via the dock. Each renders an existing,
// self-contained component inside a floating "window".
const TOOLS = [
  { id: 'dice', label: 'Dice', Icon: Dices, width: 'w-72', render: () => <DiceRoller /> },
  { id: 'timer', label: 'Timer', Icon: Timer, width: 'w-64', render: () => <div className="h-52"><StandaloneTimer /></div> },
];

export default function ToolDock() {
  const [active, setActive] = useState(null);
  const tool = TOOLS.find((t) => t.id === active);

  return (
    <>
      {tool && (
        <div className={cn('hidden md:block fixed bottom-24 left-1/2 -translate-x-1/2 z-40', tool.width)}>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{tool.label}</span>
              <button
                onClick={() => setActive(null)}
                aria-label="Close"
                className="ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-2">{tool.render()}</div>
          </div>
        </div>
      )}

      <div className="hidden md:flex fixed bottom-9 left-1/2 -translate-x-1/2 z-40 items-center gap-1 px-1.5 py-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur shadow-lg">
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActive((cur) => (cur === id ? null : id))}
            title={label}
            aria-label={label}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
              active === id
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </>
  );
}
