import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, X } from 'lucide-react';
import { QuickNote } from '@/api/entities';
import QuickNoteInput from '@/components/session/QuickNoteInput';
import { ENTITY_CREATE_TYPES } from '@/lib/entityCreateTypes';
import { useWindowManager, paramsOf } from '@/lib/WindowManager';

export default function QuickCapture({ campaignId, open, onOpenChange }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const wm = useWindowManager();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const go = (href) => { if (wm) wm.openWindow(href); else navigate(href); };

  // Link the note to the focused session window when one is open; otherwise
  // it's a campaign-wide note.
  const focused = wm?.windows.find((w) => w.id === wm.focusedId);
  const sessionId = focused ? paramsOf(focused.url).get('session_id') : null;

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    function handleClick(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) onOpenChange(false);
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onOpenChange]);

  const addNote = useMutation({
    mutationFn: (content) => QuickNote.create({
      campaign_id: campaignId,
      session_id: sessionId || null,
      content,
      tags: [],
      pinned: false,
      processed: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-notes'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (!campaignId) return null;

  function handleSelect(type) {
    onOpenChange(false);
    go(createPageUrl('EntityDetail') + `?new=true&type=${type}&campaign_id=${campaignId}`);
  }

  return (
    <>
      {open && (
        <div
          ref={cardRef}
          className="fixed bottom-20 right-5 z-50 w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Quick capture</span>
            <button
              onClick={() => onOpenChange(false)}
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick note → saves to Campaign Notes */}
          <QuickNoteInput
            onSubmit={(content) => addNote.mutate(content)}
            isSubmitting={addNote.isPending}
            campaignId={campaignId}
            placeholder={sessionId ? "Note this session… (⌘+Enter)" : "Jot a note… (⌘+Enter)"}
          />
          <div className="flex items-center justify-between mt-1 min-h-[16px]">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
              {sessionId ? 'Saves to this session’s notes' : 'Saves to Campaign Notes'}
            </span>
            {saved && (
              <button
                onClick={() => { onOpenChange(false); go(createPageUrl('CampaignNotes') + `?campaign_id=${campaignId}`); }}
                className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                ✓ Saved — view
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 my-3">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">or create an entity</span>
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ENTITY_CREATE_TYPES.map(({ type, label, Icon }) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg dark:hover:bg-zinc-800 hover:bg-zinc-100 transition-colors group"
              >
                <Icon className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors" />
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 text-center leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        data-tour="quick-capture"
        onClick={() => onOpenChange(!open)}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
        title="Quick capture (⌥N)"
      >
        <Plus className="w-5 h-5 text-zinc-950" />
      </button>
    </>
  );
}
