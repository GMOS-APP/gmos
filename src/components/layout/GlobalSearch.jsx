import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WorldEntity, Session } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Search, X, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEntityColors } from '@/lib/entityColors';
import EntityAvatar from '@/components/entity/EntityAvatar';

export default function GlobalSearch({ campaignId }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const { data: entities = [] } = useQuery({
    queryKey: ['global-search-entities', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 500),
    enabled: !!campaignId,
    staleTime: 30000,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['global-search-sessions', campaignId],
    queryFn: () => Session.filter({ campaign_id: campaignId }, '-session_number', 100),
    enabled: !!campaignId,
    staleTime: 30000,
  });

  const q = query.trim().toLowerCase();

  const results = q.length < 1 ? [] : [
    ...entities
      .filter((e) =>
        e.name?.toLowerCase().includes(q) ||
        e.summary?.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 8)
      .map((e) => ({
        id: e.id,
        label: e.name,
        sub: e.summary || e.entity_type,
        kind: 'entity',
        type: e.entity_type,
        image_url: e.image_url || null,
        href: createPageUrl('EntityDetail') + `?id=${e.id}&campaign_id=${campaignId}`,
      })),
    ...sessions
      .filter((s) =>
        (s.title || `Session ${s.session_number}`).toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((s) => ({
        id: s.id,
        label: s.title || `Session #${s.session_number}`,
        sub: s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : `Session #${s.session_number}`,
        kind: 'session',
        type: 'session',
        href: createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${s.id}`,
      })),
  ];

  // Reset selection when results change
  useEffect(() => { setSelected(0); }, [query]);

  // Global keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const go = useCallback((href) => {
    navigate(href);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }, [navigate]);

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); if (results[selected]) go(results[selected].href); }
  };

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selected];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <div className="relative flex-1 max-w-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search… ⌘K"
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
        />
        {query && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && query.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-500">No results for "{query}"</p>
          ) : (
            <ul ref={listRef} className="max-h-72 overflow-y-auto py-1">
              {results.map((r, i) => {
                const isSession = r.type === 'session';
                const color = isSession ? 'text-zinc-500' : getEntityColors(r.type).text;
                return (
                  <li key={r.id}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(r.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                        i === selected
                          ? "bg-amber-50 dark:bg-amber-500/10"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      )}
                    >
                      {isSession
                        ? <CalendarDays className={cn("w-3.5 h-3.5 flex-shrink-0", color)} />
                        : <EntityAvatar entity={{ entity_type: r.type, image_url: r.image_url, name: r.label }} size="sm" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{r.label}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate capitalize">{r.sub}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-600 capitalize flex-shrink-0">
                        {r.type === 'session' ? 'session' : r.type?.replace('_', ' ')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}