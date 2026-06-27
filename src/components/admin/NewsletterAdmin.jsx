import React, { useEffect, useState } from 'react';
import { Mail, Download, Trash2, Loader2 } from 'lucide-react';
import { callAdmin, CARD, ROW } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

// Newsletter subscribers: view the captured list, export to CSV, remove entries.
// Reads via the admin-api (service role) since the table is insert-only for the
// public client.
export default function NewsletterAdmin() {
  const [subs, setSubs] = useState(null);

  useEffect(() => {
    callAdmin({ action: 'newsletter-list' }).then((r) => setSubs(r.subscribers || [])).catch(() => setSubs([]));
  }, []);

  const exportCsv = () => {
    const rows = [['email', 'source', 'subscribed_at'], ...(subs || []).map((s) => [s.email, s.source || '', s.created_at || ''])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const del = async (s) => {
    if (!window.confirm(`Remove ${s.email} from the list?`)) return;
    setSubs((prev) => prev.filter((x) => x.id !== s.id));
    await callAdmin({ action: 'newsletter-delete', id: s.id });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          <Mail className="w-3.5 h-3.5 text-amber-500" /> Newsletter
          {subs !== null && <span className="text-zinc-400 dark:text-zinc-600 normal-case tracking-normal font-normal">({subs.length})</span>}
        </h2>
        <button
          onClick={exportCsv}
          disabled={!subs || subs.length === 0}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {subs === null ? (
        <div className={cn(CARD, 'flex justify-center py-6')}><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
      ) : subs.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-3">No subscribers yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {subs.map((s) => (
            <div key={s.id} className={cn('flex items-center gap-3 px-3 py-2', ROW)}>
              <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">{s.email}</span>
              {s.source && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-500 shrink-0">{s.source}</span>}
              <span className="text-[11px] text-zinc-400 dark:text-zinc-600 shrink-0 tabular-nums">{fmtDate(s.created_at)}</span>
              <button onClick={() => del(s)} title="Remove" className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
