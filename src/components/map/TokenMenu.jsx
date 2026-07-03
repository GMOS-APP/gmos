import React from 'react';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// GM controls for the selected battle-map token: rename, size, color, HP, and
// status conditions. Rendered as a compact bar above the board (popovers get
// awkward on touch + a crowded board). All edits go through onChange(patch)
// which the page persists + syncs.

const SIZES = [
  { key: 's', label: 'S' }, { key: 'm', label: 'M' }, { key: 'l', label: 'L' }, { key: 'h', label: 'H' },
];
const COLORS = ['#22d3ee', '#a78bfa', '#f87171', '#f59e0b', '#34d399', '#f472b6', '#e4e4e7', '#71717a'];
// System-agnostic status markers (emoji render fine at token scale).
const CONDITIONS = [
  { key: '💀', label: 'Dead' }, { key: '💤', label: 'Unconscious' }, { key: '🤢', label: 'Poisoned' },
  { key: '💫', label: 'Stunned' }, { key: '🔻', label: 'Prone' }, { key: '⛓️', label: 'Restrained' },
  { key: '🔥', label: 'Burning' }, { key: '😱', label: 'Frightened' }, { key: '✨', label: 'Blessed' },
  { key: '🎯', label: 'Marked' },
];

export default function TokenMenu({ token, onChange, onRemove, onClose }) {
  if (!token) return null;
  const conditions = Array.isArray(token.conditions) ? token.conditions : [];
  const toggleCondition = (c) =>
    onChange({ conditions: conditions.includes(c) ? conditions.filter((x) => x !== c) : [...conditions, c] });

  const numOrNull = (v) => (v === '' ? null : Math.max(0, parseInt(v, 10) || 0));

  return (
    <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/[0.04] p-2.5 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={token.label || ''}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Token name"
          className="w-36 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2 py-1"
        />

        {/* Size */}
        <div className="flex items-center rounded-md border border-zinc-300 dark:border-zinc-700 overflow-hidden">
          {SIZES.map((s) => (
            <button
              key={s.key}
              onClick={() => onChange({ size: s.key })}
              title={{ s: 'Small', m: 'Medium', l: 'Large', h: 'Huge' }[s.key]}
              className={cn('px-2 py-1 text-xs font-semibold',
                (token.size || 'm') === s.key
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800')}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Color */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              aria-label={`Color ${c}`}
              className={cn('w-5 h-5 rounded-full border border-black/20',
                token.color === c && 'ring-2 ring-offset-1 ring-zinc-500 ring-offset-white dark:ring-offset-zinc-950')}
              style={{ background: c }}
            />
          ))}
        </div>

        {/* HP */}
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <span>HP</span>
          <input
            type="number" min={0} value={token.hp ?? ''}
            onChange={(e) => onChange({ hp: numOrNull(e.target.value) })}
            placeholder="–"
            className="w-14 text-center text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1 py-1"
          />
          <span>/</span>
          <input
            type="number" min={0} value={token.maxHp ?? ''}
            onChange={(e) => onChange({ maxHp: numOrNull(e.target.value) })}
            placeholder="max"
            className="w-14 text-center text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1 py-1"
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={onRemove} title="Remove token"
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
          <button onClick={onClose} title="Done" className="p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conditions */}
      <div className="flex flex-wrap items-center gap-1">
        {CONDITIONS.map((c) => (
          <button
            key={c.key}
            onClick={() => toggleCondition(c.key)}
            title={c.label}
            className={cn('px-1.5 py-0.5 rounded-md text-sm border',
              conditions.includes(c.key)
                ? 'border-amber-500/60 bg-amber-500/15'
                : 'border-transparent opacity-50 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700')}
          >
            {c.key}
          </button>
        ))}
      </div>
    </div>
  );
}
