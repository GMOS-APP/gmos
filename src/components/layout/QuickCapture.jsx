import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, X } from 'lucide-react';
import { ENTITY_CREATE_TYPES } from '@/lib/entityCreateTypes';

export default function QuickCapture({ campaignId, open, onOpenChange }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();

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

  if (!campaignId) return null;

  function handleSelect(type) {
    onOpenChange(false);
    navigate(createPageUrl('EntityDetail') + `?new=true&type=${type}&campaign_id=${campaignId}`);
  }

  return (
    <>
      {open && (
        <div
          ref={cardRef}
          className="fixed bottom-20 right-5 z-50 w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Create…</span>
            <button
              onClick={() => onOpenChange(false)}
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
        onClick={() => onOpenChange(!open)}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 shadow-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
        title="Create entity (⌥N)"
      >
        <Plus className="w-5 h-5 text-zinc-950" />
      </button>
    </>
  );
}
