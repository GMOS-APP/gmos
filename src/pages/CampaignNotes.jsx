import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuickNote, Session, WorldEntity } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Trash2, StickyNote, X, ArrowRight } from 'lucide-react';
import EntityMentionRenderer from '@/components/common/EntityMentionRenderer';
import { cn } from '@/lib/utils';

const TAG_STYLES = {
  Combat:    { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'    },
  Clue:      { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20'  },
  NPC:       { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  Item:      { bg: 'bg-teal-500/10',   text: 'text-teal-400',   border: 'border-teal-500/20'   },
  Plot:      { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  Important: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
};
const ALL_TAGS = Object.keys(TAG_STYLES);

function TagChip({ tag, active, onClick }) {
  const s = TAG_STYLES[tag];
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-[11px] px-2 py-0.5 rounded-full border font-medium transition-all',
        active
          ? `${s.bg} ${s.text} ${s.border}`
          : 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-700 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'
      )}
    >
      {tag}
    </button>
  );
}

function NoteCard({ note, entities, campaignId, onDelete }) {
  const tags = note.tags || [];
  return (
    <div className="group flex items-start gap-3 py-3 px-1">
      <div className="flex-1 min-w-0">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tags.map(tag => {
              const s = TAG_STYLES[tag];
              if (!s) return null;
              return (
                <span
                  key={tag}
                  className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', s.bg, s.text, s.border)}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}
        <EntityMentionRenderer
          text={note.content}
          entities={entities}
          campaignId={campaignId}
          className="text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed"
        />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
          {new Date(note.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button
          onClick={() => onDelete(note.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function CampaignNotes() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id') || params.get('id');
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [activeTagFilters, setActiveTagFilters] = useState(new Set());

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['quick-notes', campaignId],
    queryFn: () => QuickNote.filter({ campaign_id: campaignId }, '-created_date', 500),
    enabled: !!campaignId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => Session.filter({ campaign_id: campaignId }, '-session_number', 100),
    enabled: !!campaignId,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 200),
    enabled: !!campaignId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => QuickNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quick-notes', campaignId] }),
  });

  // Tag counts across all notes (unfiltered)
  const tagCounts = ALL_TAGS.reduce((acc, tag) => {
    acc[tag] = notes.filter(n => n.tags?.includes(tag)).length;
    return acc;
  }, {});

  // Filtered notes
  const filteredNotes = notes.filter(note => {
    const matchesQuery = query.trim() === '' || note.content.toLowerCase().includes(query.toLowerCase());
    const matchesTag = activeTagFilters.size === 0 || note.tags?.some(t => activeTagFilters.has(t));
    return matchesQuery && matchesTag;
  });

  // Group filtered notes by session_id
  const notesBySession = filteredNotes.reduce((acc, note) => {
    const sid = note.session_id || '__unlinked__';
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(note);
    return acc;
  }, {});

  // Build session groups sorted by session_number descending
  const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s]));

  // Sessions that have notes (after filter), sorted newest first
  const sessionGroups = Object.entries(notesBySession)
    .map(([sid, groupNotes]) => ({
      sessionId: sid,
      session: sessionMap[sid] || null,
      notes: groupNotes,
    }))
    .sort((a, b) => {
      const na = a.session?.session_number ?? 0;
      const nb = b.session?.session_number ?? 0;
      return nb - na;
    });

  const toggleTag = (tag) => {
    setActiveTagFilters(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const sessionsWithNotes = new Set(notes.map(n => n.session_id)).size;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Campaign Notes</h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-500 tabular-nums">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
          {sessionsWithNotes > 0
            ? `Captured across ${sessionsWithNotes} session${sessionsWithNotes !== 1 ? 's' : ''}`
            : 'No notes captured yet'}
        </p>
      </div>

      {/* Search + tag filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across all notes…"
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TAGS.map(tag => (
            <TagChip
              key={tag}
              tag={tag}
              active={activeTagFilters.has(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
          {activeTagFilters.size > 0 && (
            <button
              onClick={() => setActiveTagFilters(new Set())}
              className="text-[11px] px-2 py-0.5 rounded-full text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Tag stats */}
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          {ALL_TAGS.filter(tag => tagCounts[tag] > 0).map(tag => {
            const s = TAG_STYLES[tag];
            return (
              <span
                key={tag}
                className={cn('text-[11px] px-2.5 py-1 rounded-full border font-medium', s.bg, s.text, s.border)}
              >
                {tag} · {tagCounts[tag]}
              </span>
            );
          })}
        </div>
      )}

      {/* Content */}
      {notesLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <StickyNote className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-500">No notes captured yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Start taking notes during your next session.</p>
        </div>
      ) : sessionGroups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">No notes match your filters.</p>
          <button
            onClick={() => { setQuery(''); setActiveTagFilters(new Set()); }}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline mt-2 block mx-auto"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sessionGroups.map(({ sessionId, session, notes: groupNotes }) => (
            <div key={sessionId}>
              {/* Session group header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex-shrink-0">
                    {session ? `Session ${session.session_number}` : 'Unlinked'}
                  </span>
                  {session?.title && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                        {session.title}
                      </span>
                    </>
                  )}
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-600 flex-shrink-0 ml-1">
                    {groupNotes.length} note{groupNotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {session && (
                  <Link
                    to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${session.id}`}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-600 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex-shrink-0"
                  >
                    Open <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Notes for this session */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                {groupNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    entities={entities}
                    campaignId={campaignId}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
