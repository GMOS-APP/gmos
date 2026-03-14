import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QuickNote } from '@/api/entities';
import { Pencil, X, Check, Trash2 } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function QuickCapture({ campaignId }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: recentNotes = [] } = useQuery({
    queryKey: ['quick-notes', campaignId],
    queryFn: () => QuickNote.filter({ campaign_id: campaignId }, '-created_date', 10),
    enabled: open && !!campaignId,
  });

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  if (!campaignId) return null;

  async function handleSave() {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await QuickNote.create({ campaign_id: campaignId, content: content.trim() });
      queryClient.invalidateQueries({ queryKey: ['quick-notes', campaignId] });
      setContent('');
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1200);
    } catch (e) {
      console.error('QuickCapture save failed:', e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await QuickNote.delete(id);
    queryClient.invalidateQueries({ queryKey: ['quick-notes', campaignId] });
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setContent('');
    }
  }

  return (
    <>
      {/* Floating card */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Quick Note</span>
            <button
              onClick={() => { setOpen(false); setContent(''); }}
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {saved ? (
            <div className="flex items-center justify-center gap-1.5 py-4 text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Saved!</span>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Capture a quick note…"
                rows={4}
                className="w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <button
                onClick={handleSave}
                disabled={!content.trim() || saving}
                className="self-end px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-semibold transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
                <span className="ml-1.5 opacity-50 text-[10px]">⌘↵</span>
              </button>
              {recentNotes.length > 0 && (
                <div className="mt-1 border-t border-zinc-200 dark:border-zinc-700 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Recent</p>
                  <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {recentNotes.map(note => (
                      <li key={note.id} className="flex items-start gap-1.5 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-snug">{note.content}</p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{timeAgo(note.created_date)}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all shrink-0 mt-0.5"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 shadow-lg flex items-center justify-center transition-colors"
        title="Quick note (capture)"
      >
        <Pencil className="w-4.5 h-4.5 text-zinc-950" />
      </button>
    </>
  );
}
