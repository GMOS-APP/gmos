import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RandomTable } from '@/api/entities';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuickTableRoll({ campaignId }) {
  const { data: tables = [] } = useQuery({
    queryKey: ['random-tables', campaignId],
    queryFn: () => RandomTable.filter({ campaign_id: campaignId }, 'name'),
    enabled: !!campaignId,
    staleTime: 30000,
  });

  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [spin, setSpin] = useState(false);

  useEffect(() => {
    if (!selectedId && tables.length) setSelectedId(tables[0].id);
  }, [tables, selectedId]);

  const table = tables.find((t) => t.id === selectedId);
  const entries = table?.entries || [];

  const roll = () => {
    if (!entries.length) return;
    setSpin(true);
    setResult(null);
    setTimeout(() => {
      const e = entries[Math.floor(Math.random() * entries.length)];
      setResult(typeof e === 'string' ? e : (e?.result ?? ''));
      setSpin(false);
    }, 220);
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-6">
        <Dices className="w-7 h-7 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
        <p className="text-xs text-zinc-500 dark:text-zinc-500">No random tables yet.</p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">Create one in Random Tables.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selectedId}
        onChange={(e) => { setSelectedId(e.target.value); setResult(null); }}
        className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 px-2 py-1.5 focus:outline-none focus:border-amber-500/50"
      >
        {tables.map((t) => (
          <option key={t.id} value={t.id}>{t.name} ({t.entries?.length ?? 0})</option>
        ))}
      </select>

      <div className="min-h-[3rem] flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-3 py-2 text-center">
        {result != null ? (
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{result}</p>
        ) : (
          <p className="text-xs text-zinc-400 dark:text-zinc-600">{spin ? '…' : 'Roll to reveal'}</p>
        )}
      </div>

      <button
        onClick={roll}
        disabled={!entries.length || spin}
        className="flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium transition-colors"
      >
        <Dices className={cn('w-3.5 h-3.5', spin && 'animate-spin')} /> {result != null ? 'Roll Again' : 'Roll'}
      </button>
    </div>
  );
}
