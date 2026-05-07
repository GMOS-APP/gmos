import React, { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';

export default function PrivateScratchpad({ campaignId }) {
  const storageKey = `dm_scratchpad_${campaignId}`;
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) setText(stored);
  }, [storageKey]);

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(storageKey, text);
      setSaved(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [text, storageKey]);

  const handleChange = (e) => {
    setSaved(false);
    setText(e.target.value);
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">DM Scratchpad</h3>
        </div>
        <span className={`text-[10px] transition-colors ${saved ? 'text-zinc-400 dark:text-zinc-700' : 'text-amber-600'}`}>
          {saved ? '● Saved' : '● Saving…'}
        </span>
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder={"DM eyes only…\n\nThe butler did it.\nThe dragon is actually a gold dragon.\nParty suspects the wrong person."}
        className="flex-1 w-full bg-transparent text-xs text-zinc-800 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 resize-none focus:outline-none leading-relaxed min-h-[140px] font-mono"
      />
    </div>
  );
}