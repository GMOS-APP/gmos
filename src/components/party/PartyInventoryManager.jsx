import React, { useState } from 'react';
import { Plus, Trash2, Coins, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const COINS = [
  { key: 'pp', label: 'PP', color: 'text-zinc-500 dark:text-zinc-400' },
  { key: 'gp', label: 'GP', color: 'text-amber-600 dark:text-amber-400' },
  { key: 'sp', label: 'SP', color: 'text-zinc-500 dark:text-zinc-400' },
  { key: 'cp', label: 'CP', color: 'text-orange-700 dark:text-orange-400' },
];

const inputCls = 'bg-transparent border border-transparent rounded-md px-2 py-1 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-colors';

function CoinInput({ value, onCommit, color }) {
  return (
    <input
      type="number" min="0" inputMode="numeric"
      defaultValue={value ?? 0}
      onBlur={(e) => onCommit(Math.max(0, parseInt(e.target.value, 10) || 0))}
      className={cn('w-16 text-center font-mono font-semibold bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-1.5 py-1 text-sm focus:outline-none focus:border-amber-500/50', color)}
    />
  );
}

function ItemRow({ item, onUpdate, onDelete }) {
  const commit = (field, value) => {
    const cur = item[field] ?? '';
    if (String(value) !== String(cur)) onUpdate(item.id, { [field]: value });
  };
  return (
    <div className="group flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-zinc-400 dark:text-zinc-600">×</span>
        <input
          type="number" min="0" inputMode="numeric"
          defaultValue={item.quantity ?? 1}
          onBlur={(e) => commit('quantity', Math.max(0, parseInt(e.target.value, 10) || 0))}
          className={cn(inputCls, 'w-12 text-center font-mono')}
        />
      </div>
      <input defaultValue={item.name} onBlur={(e) => commit('name', e.target.value)} placeholder="Item"
        className={cn(inputCls, 'flex-1 min-w-[7rem] font-medium')} />
      <input defaultValue={item.carried_by || ''} onBlur={(e) => commit('carried_by', e.target.value)} placeholder="Carried by…"
        className={cn(inputCls, 'w-32 text-zinc-600 dark:text-zinc-400')} />
      <input defaultValue={item.notes || ''} onBlur={(e) => commit('notes', e.target.value)} placeholder="Notes…"
        className={cn(inputCls, 'flex-1 min-w-[7rem] text-zinc-500 dark:text-zinc-500 text-xs')} />
      <button onClick={() => onDelete(item.id)} title="Remove"
        className="w-7 h-7 flex items-center justify-center rounded text-zinc-400 dark:text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function PartyInventoryManager({ items = [], currency = {}, onAdd, onUpdate, onDelete, onCurrency }) {
  const [draft, setDraft] = useState({ name: '', quantity: 1, carried_by: '', notes: '' });

  const add = () => {
    if (!draft.name.trim()) return;
    onAdd({ ...draft, name: draft.name.trim(), quantity: Math.max(0, parseInt(draft.quantity, 10) || 1) });
    setDraft({ name: '', quantity: 1, carried_by: '', notes: '' });
  };

  return (
    <div className="space-y-5">
      {/* Currency */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">Party Currency</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {COINS.map((c) => (
            <label key={c.key} className="flex items-center gap-1.5">
              <span className={cn('text-xs font-bold w-6', c.color)}>{c.label}</span>
              <CoinInput value={currency[c.key]} color={c.color} onCommit={(v) => onCurrency({ ...currency, [c.key]: v })} />
            </label>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
          <Package className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">Items</span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{items.length}</span>
        </div>

        <div className="divide-y divide-zinc-50 dark:divide-zinc-800/40 p-1">
          {items.length === 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-6">No items yet — add the party’s gear below.</p>
          )}
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>

        {/* Add row */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
          <input
            value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add an item…"
            className="flex-1 min-w-[8rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
          />
          <input
            type="number" min="0" inputMode="numeric" value={draft.quantity}
            onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            className="w-14 text-center font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500/50"
          />
          <input
            value={draft.carried_by} onChange={(e) => setDraft({ ...draft, carried_by: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Carried by"
            className="w-28 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
          />
          <button onClick={add} disabled={!draft.name.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
