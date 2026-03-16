import React, { useState } from 'react';
import { Dices, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = {
  encounters: 'bg-red-500/10 text-red-400 border-red-500/20',
  names:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  loot:       'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  plot_hooks: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  events:     'bg-green-500/10 text-green-400 border-green-500/20',
  custom:     'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const CATEGORY_LABELS = {
  encounters: 'Encounters',
  names:      'Names',
  loot:       'Loot',
  plot_hooks: 'Plot Hooks',
  events:     'Events',
  custom:     'Custom',
};

export default function RandomTableCard({ table, onEdit, onDelete }) {
  const [lastRoll, setLastRoll] = useState(null);
  const [rolling, setRolling] = useState(false);

  const handleRoll = () => {
    if (!table.entries?.length) return;
    setRolling(true);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * table.entries.length);
      setLastRoll(table.entries[idx]);
      setRolling(false);
    }, 150);
  };

  return (
    <div className="rounded-xl border dark:border-zinc-800 dark:bg-zinc-900/40 bg-white border-zinc-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold dark:text-zinc-100 text-zinc-900 truncate">{table.name}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', CATEGORY_COLORS[table.category] || CATEGORY_COLORS.custom)}>
              {CATEGORY_LABELS[table.category] || table.category}
            </span>
          </div>
          {table.description && (
            <p className="text-sm dark:text-zinc-500 text-zinc-500 line-clamp-2">{table.description}</p>
          )}
          <p className="text-xs dark:text-zinc-600 text-zinc-400 mt-1">{table.entries?.length ?? 0} entries</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(table)}
            className="p-1.5 rounded-md dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(table.id)}
            className="p-1.5 rounded-md dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {lastRoll && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <p className="text-xs text-amber-500/70 font-medium mb-0.5">Result</p>
          <p className="text-sm font-medium text-amber-400">{lastRoll.result}</p>
        </div>
      )}

      <Button
        onClick={handleRoll}
        disabled={!table.entries?.length || rolling}
        variant="outline"
        className="w-full dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 border-zinc-300"
      >
        <Dices className="w-4 h-4 mr-2" />
        {rolling ? 'Rolling…' : lastRoll ? 'Roll Again' : 'Roll'}
      </Button>
    </div>
  );
}
