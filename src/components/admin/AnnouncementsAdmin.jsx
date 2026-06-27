import React, { useEffect, useState } from 'react';
import { Megaphone, Pencil, Trash2 } from 'lucide-react';
import { callAdmin, INPUT, CARD, ROW } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const emptyDraft = { title: '', body: '', level: 'info', published: false };

// Site-wide announcement banners: create/edit/publish/delete.
export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState([]);
  const [annDraft, setAnnDraft] = useState(emptyDraft);

  useEffect(() => {
    callAdmin({ action: 'announcement-list' }).then((a) => setAnnouncements(a.announcements || [])).catch(() => {});
  }, []);

  const saveAnn = async () => {
    if (!annDraft.title.trim()) return;
    const { announcement } = await callAdmin({ action: 'announcement-save', announcement: annDraft });
    setAnnouncements((prev) => (prev.some((x) => x.id === announcement.id)
      ? prev.map((x) => (x.id === announcement.id ? announcement : x))
      : [announcement, ...prev]));
    setAnnDraft(emptyDraft);
  };
  const togglePub = async (a) => {
    const published = !a.published;
    setAnnouncements((prev) => prev.map((x) => (x.id === a.id ? { ...x, published } : x)));
    await callAdmin({ action: 'announcement-save', announcement: { ...a, published } });
  };
  const delAnn = async (a) => {
    setAnnouncements((prev) => prev.filter((x) => x.id !== a.id));
    await callAdmin({ action: 'announcement-delete', id: a.id });
  };

  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
        <Megaphone className="w-3.5 h-3.5 text-amber-500" /> Announcements
      </h2>
      <div className={cn(CARD, 'p-3 space-y-2 mb-3')}>
        <input value={annDraft.title} onChange={(e) => setAnnDraft({ ...annDraft, title: e.target.value })}
          placeholder="Title" className={cn('w-full text-sm px-2.5 py-1.5', INPUT)} />
        <textarea value={annDraft.body} onChange={(e) => setAnnDraft({ ...annDraft, body: e.target.value })}
          placeholder="Body (optional)" rows={2} className={cn('w-full text-sm px-2.5 py-1.5 resize-none', INPUT)} />
        <div className="flex items-center gap-2">
          <select value={annDraft.level} onChange={(e) => setAnnDraft({ ...annDraft, level: e.target.value })}
            className={cn('text-xs px-1.5 py-1', INPUT)}>
            <option value="info">info</option><option value="warning">warning</option><option value="success">success</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={annDraft.published} onChange={(e) => setAnnDraft({ ...annDraft, published: e.target.checked })} /> Published
          </label>
          {annDraft.id && (
            <button onClick={() => setAnnDraft(emptyDraft)} className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Cancel</button>
          )}
          <button onClick={saveAnn} disabled={!annDraft.title.trim()}
            className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
            {annDraft.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {announcements.length === 0 && <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-3">No announcements yet.</p>}
        {announcements.map((a) => (
          <div key={a.id} className={cn('flex items-center gap-2 px-3 py-2', ROW)}>
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
              a.level === 'warning' ? 'text-red-600 dark:text-red-400 border-red-500/30' : a.level === 'success' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'text-amber-600 dark:text-amber-400 border-amber-500/30')}>{a.level}</span>
            <span className="text-sm text-zinc-800 dark:text-zinc-200 truncate flex-1">{a.title}</span>
            <span className={cn('text-[10px] font-medium', a.published ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')}>{a.published ? 'Published' : 'Draft'}</span>
            <button onClick={() => togglePub(a)} className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200">{a.published ? 'Unpublish' : 'Publish'}</button>
            <button onClick={() => setAnnDraft({ id: a.id, title: a.title, body: a.body || '', level: a.level, published: a.published })} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => delAnn(a)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
