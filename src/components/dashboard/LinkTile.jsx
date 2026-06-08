import React, { useEffect, useState } from 'react';
import { ExternalLink, Pencil, Check } from 'lucide-react';

// A customizable bookmark tile — keep a handy link (your VTT, a rules doc, a
// playlist) one click away. Stored per campaign on this device.
const KEY = (cid) => `gmos_dash_link_${cid}`;

export default function LinkTile({ campaignId }) {
  const [data, setData] = useState({ label: '', url: '' });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(campaignId));
      if (raw) setData(JSON.parse(raw));
      else setEditing(true);
    } catch { setEditing(true); }
  }, [campaignId]);

  const persist = (next) => {
    setData(next);
    try { localStorage.setItem(KEY(campaignId), JSON.stringify(next)); } catch { /* ignore */ }
  };

  const href = data.url && /^https?:\/\//i.test(data.url) ? data.url : (data.url ? `https://${data.url}` : '');

  if (editing) {
    return (
      <div className="h-full flex flex-col gap-2 justify-center">
        <input
          value={data.label}
          onChange={(e) => setData((d) => ({ ...d, label: e.target.value }))}
          placeholder="Label (e.g. Owlbear Rodeo)"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
        />
        <input
          value={data.url}
          onChange={(e) => setData((d) => ({ ...d, url: e.target.value }))}
          placeholder="https://…"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
        />
        <button
          onClick={() => { persist(data); setEditing(false); }}
          className="self-end inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold"
        >
          <Check className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center group relative">
      <button
        onClick={() => setEditing(true)}
        className="absolute top-0 right-0 p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100"
        title="Edit link" aria-label="Edit link"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <a
        href={href || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-100 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
      >
        <ExternalLink className="w-4 h-4 text-amber-500" />
        {data.label || 'Open link'}
      </a>
    </div>
  );
}
