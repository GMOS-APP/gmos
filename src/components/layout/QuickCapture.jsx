import React, { useState, useRef, useEffect } from 'react';
import { QuickNote } from '@/api/entities';
import { Pencil, X, Check } from 'lucide-react';

export default function QuickCapture({ campaignId }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef(null);

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
