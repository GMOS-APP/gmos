import React, { useEffect, useState } from 'react';
import { ScrollText, Pencil, Trash2 } from 'lucide-react';
import { callAdmin, INPUT, CARD, ROW } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const emptyDraft = { version: '', date: '', entriesText: '', published: true };

const parseEntries = (text) => (text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const m = l.match(/^(new|improved|fixed):\s*(.*)$/i);
  return m ? { type: m[1].toLowerCase(), text: m[2] } : { type: 'new', text: l };
});
const entriesToText = (entries) => (entries || []).map((e) => `${e.type}: ${e.text}`).join('\n');

// Changelog releases: add/edit/publish/delete versioned change sets.
export default function ChangelogAdmin() {
  const [changelog, setChangelog] = useState([]);
  const [clDraft, setClDraft] = useState(emptyDraft);

  useEffect(() => {
    callAdmin({ action: 'changelog-list' }).then((c) => setChangelog(c.changelog || [])).catch(() => {});
  }, []);

  const saveCl = async () => {
    if (!clDraft.version.trim()) return;
    const { entry } = await callAdmin({ action: 'changelog-save', entry: {
      id: clDraft.id, version: clDraft.version.trim(), date: clDraft.date,
      entries: parseEntries(clDraft.entriesText), published: clDraft.published,
    } });
    setChangelog((prev) => (prev.some((x) => x.id === entry.id)
      ? prev.map((x) => (x.id === entry.id ? entry : x))
      : [entry, ...prev]).sort((a, b) => (b.version || '').localeCompare(a.version || '')));
    setClDraft(emptyDraft);
  };
  const togglePubCl = async (c) => {
    const published = !c.published;
    setChangelog((prev) => prev.map((x) => (x.id === c.id ? { ...x, published } : x)));
    await callAdmin({ action: 'changelog-save', entry: { ...c, entries: c.entries, published } });
  };
  const delCl = async (c) => {
    setChangelog((prev) => prev.filter((x) => x.id !== c.id));
    await callAdmin({ action: 'changelog-delete', id: c.id });
  };

  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
        <ScrollText className="w-3.5 h-3.5 text-amber-500" /> Changelog
      </h2>
      <div className={cn(CARD, 'p-3 space-y-2 mb-3')}>
        <div className="flex gap-2">
          <input value={clDraft.version} onChange={(e) => setClDraft({ ...clDraft, version: e.target.value })}
            placeholder="Version (e.g. 2026-06-04)" className={cn('flex-1 text-sm px-2.5 py-1.5 font-mono', INPUT)} />
          <input value={clDraft.date} onChange={(e) => setClDraft({ ...clDraft, date: e.target.value })}
            placeholder="Date label (Jun 4, 2026)" className={cn('flex-1 text-sm px-2.5 py-1.5', INPUT)} />
        </div>
        <textarea value={clDraft.entriesText} onChange={(e) => setClDraft({ ...clDraft, entriesText: e.target.value })}
          placeholder={'One change per line. Prefix with new: / improved: / fixed:\nnew: Added a thing\nfixed: Squashed a bug'}
          rows={4} className={cn('w-full text-sm px-2.5 py-1.5 resize-none font-mono', INPUT)} />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={clDraft.published} onChange={(e) => setClDraft({ ...clDraft, published: e.target.checked })} /> Published
          </label>
          {clDraft.id && <button onClick={() => setClDraft(emptyDraft)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>}
          <button onClick={saveCl} disabled={!clDraft.version.trim()}
            className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
            {clDraft.id ? 'Update' : 'Add release'}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {changelog.map((c) => (
          <div key={c.id} className={cn('flex items-center gap-2 px-3 py-2', ROW)}>
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{c.version}</span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 truncate flex-1">{(c.entries || []).length} change{(c.entries || []).length !== 1 ? 's' : ''}{c.date ? ` · ${c.date}` : ''}</span>
            <span className={cn('text-[10px] font-medium', c.published ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')}>{c.published ? 'Published' : 'Draft'}</span>
            <button onClick={() => togglePubCl(c)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">{c.published ? 'Unpublish' : 'Publish'}</button>
            <button onClick={() => setClDraft({ id: c.id, version: c.version, date: c.date || '', entriesText: entriesToText(c.entries), published: c.published })} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => delCl(c)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
