import React, { useState } from 'react';
import { MessageSquare, Trash2, Plus } from 'lucide-react';

// Shared, collaborative party notebook. The party keeps track of clues,
// decisions, and reminders together. Backend-agnostic via onAdd/onDelete.
export default function PartyNotes({ notes = [], onAdd, onDelete }) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState(() => {
    try { return localStorage.getItem('gmos_party_note_author') || ''; } catch { return ''; }
  });

  const add = () => {
    if (!content.trim()) return;
    const who = author.trim();
    try { if (who) localStorage.setItem('gmos_party_note_author', who); } catch { /* ignore */ }
    onAdd({ content: content.trim(), author: who || null });
    setContent('');
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">Party Notes</span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{notes.length}</span>
      </div>

      <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-5">No notes yet — jot down what the party learns.</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="group rounded-lg border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/40 p-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 truncate">{n.author || 'Anonymous'}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                {new Date(n.created_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
              <button onClick={() => onDelete(n.id)} title="Delete"
                className="ml-auto w-5 h-5 flex items-center justify-center rounded text-zinc-400 dark:text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{n.content}</p>
          </div>
        ))}
      </div>

      <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); add(); } }}
          placeholder="Add a note…"
          rows={2}
          className="w-full text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 px-2.5 py-1.5 resize-none focus:outline-none focus:border-amber-500/50"
        />
        <div className="flex items-center gap-2">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="w-32 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 px-2 py-1.5 focus:outline-none focus:border-amber-500/50"
          />
          <button onClick={add} disabled={!content.trim()}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add note
          </button>
        </div>
      </div>
    </div>
  );
}
