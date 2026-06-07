import React, { useState } from 'react';
import { usePageParams } from '@/lib/usePageParams';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuickNote, Session, WorldEntity } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Trash2, StickyNote, X, ArrowRight, Pin, Pencil, Check, RotateCcw } from 'lucide-react';
import EntityMentionRenderer from '@/components/common/EntityMentionRenderer';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import QuickNoteInput from '@/components/session/QuickNoteInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
const UNLINKED = '__unlinked__';

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

function NoteTags({ tags }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mb-1.5">
      {tags.map(tag => {
        const s = TAG_STYLES[tag];
        if (!s) return null;
        return (
          <span key={tag} className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', s.bg, s.text, s.border)}>
            {tag}
          </span>
        );
      })}
    </div>
  );
}

function NoteCard({ note, entities, campaignId, sessionLabel, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editTags, setEditTags] = useState(note.tags || []);
  const done = !!note.processed;

  const save = () => {
    if (!editContent.trim()) return;
    onUpdate(note.id, { content: editContent.trim(), tags: editTags });
    setEditing(false);
  };
  const toggleEditTag = (tag) =>
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  if (editing) {
    return (
      <div className="break-inside-avoid mb-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 bg-white dark:bg-zinc-900/40">
        <EntityMentionTextarea
          value={editContent}
          onChange={setEditContent}
          campaignId={campaignId}
          rows={3}
          autoFocus
          className="text-sm dark:bg-zinc-800 dark:border-zinc-700 bg-zinc-50 border-zinc-200"
        />
        <div className="flex flex-wrap gap-1">
          {ALL_TAGS.map(tag => (
            <TagChip key={tag} tag={tag} active={editTags.includes(tag)} onClick={() => toggleEditTag(tag)} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium">Save</button>
          <button onClick={() => { setEditContent(note.content); setEditTags(note.tags || []); setEditing(false); }} className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('group break-inside-avoid mb-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700', done && 'opacity-60')}>
      <NoteTags tags={note.tags} />
      <EntityMentionRenderer
        text={note.content}
        entities={entities}
        campaignId={campaignId}
        className={cn('text-sm leading-relaxed whitespace-pre-wrap', done ? 'text-zinc-500 dark:text-zinc-500 line-through decoration-zinc-400/50' : 'text-zinc-800 dark:text-zinc-300')}
      />
      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5 min-w-0 text-[10px] text-zinc-400 dark:text-zinc-600">
          <span className="font-mono truncate">
            {new Date(note.created_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
          {sessionLabel && <span className="truncate">· {sessionLabel}</span>}
          {done && <span className="text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0">· done</span>}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button onClick={() => onUpdate(note.id, { pinned: !note.pinned })} title={note.pinned ? 'Unpin' : 'Pin'}
            className={cn('w-6 h-6 flex items-center justify-center rounded transition-colors', note.pinned ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-600 hover:text-amber-500')}>
            <Pin className={cn('w-3.5 h-3.5', note.pinned && 'fill-current')} />
          </button>
          <button onClick={() => onUpdate(note.id, { processed: !done })} title={done ? 'Mark as not done' : 'Mark as done'}
            className={cn('w-6 h-6 flex items-center justify-center rounded transition-colors', done ? 'text-emerald-500' : 'text-zinc-400 dark:text-zinc-600 hover:text-emerald-500')}>
            {done ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setEditing(true)} title="Edit"
            className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(note.id)} title="Delete"
            className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Masonry-style two-column flow (Notion/OneNote-ish); single column on mobile.
function NoteColumns({ children }) {
  return <div className="columns-1 sm:columns-2 gap-3">{children}</div>;
}

export default function CampaignNotes() {
  const params = usePageParams();
  const campaignId = params.get('campaign_id') || params.get('id');
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [activeTagFilters, setActiveTagFilters] = useState(new Set());
  const [showDone, setShowDone] = useState(true);
  const [pendingTags, setPendingTags] = useState([]);
  const [pendingSession, setPendingSession] = useState(UNLINKED);

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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quick-notes'] });

  const addMutation = useMutation({
    mutationFn: (content) => QuickNote.create({
      campaign_id: campaignId,
      session_id: pendingSession === UNLINKED ? null : pendingSession,
      content,
      tags: pendingTags,
      pinned: false,
      processed: false,
    }),
    onSuccess: () => { invalidate(); setPendingTags([]); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => QuickNote.update(id, payload),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => QuickNote.delete(id),
    onSuccess: invalidate,
  });

  const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s]));
  const sessionLabel = (s) => s ? (s.title ? `Session ${s.session_number} · ${s.title}` : `Session ${s.session_number}`) : null;

  const tagCounts = ALL_TAGS.reduce((acc, tag) => {
    acc[tag] = notes.filter(n => n.tags?.includes(tag)).length;
    return acc;
  }, {});

  const matchesFilters = (note) => {
    const matchesQuery = query.trim() === '' || note.content.toLowerCase().includes(query.toLowerCase());
    const matchesTag = activeTagFilters.size === 0 || note.tags?.some(t => activeTagFilters.has(t));
    const matchesDone = showDone || !note.processed;
    return matchesQuery && matchesTag && matchesDone;
  };
  const filtered = notes.filter(matchesFilters);

  const pinned = filtered.filter(n => n.pinned);
  const rest = filtered.filter(n => !n.pinned);

  // Group the non-pinned notes: campaign-level (unlinked) first, then sessions desc.
  const grouped = rest.reduce((acc, note) => {
    const sid = note.session_id || UNLINKED;
    (acc[sid] = acc[sid] || []).push(note);
    return acc;
  }, {});
  const sessionGroups = Object.entries(grouped)
    .map(([sid, groupNotes]) => ({ sessionId: sid, session: sessionMap[sid] || null, notes: groupNotes }))
    .sort((a, b) => {
      if (a.sessionId === UNLINKED) return -1; // campaign notes first
      if (b.sessionId === UNLINKED) return 1;
      return (b.session?.session_number ?? 0) - (a.session?.session_number ?? 0);
    });

  const toggleTag = (tag) => setActiveTagFilters(prev => {
    const next = new Set(prev);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    return next;
  });

  const pinnedCount = notes.filter(n => n.pinned).length;
  const openCount = notes.filter(n => !n.processed).length;
  const hasActiveFilters = query.trim() !== '' || activeTagFilters.size > 0 || !showDone;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Campaign Notes</h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-500 tabular-nums">
            {openCount} open{pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ''}
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
          Jot ideas, reminders, and reveals — link them to a session or keep them campaign-wide.
        </p>
      </div>

      {/* Composer */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3 mb-6">
        <QuickNoteInput
          onSubmit={(content) => addMutation.mutate(content)}
          isSubmitting={addMutation.isPending}
          campaignId={campaignId}
          placeholder="Write a note… type @ to link an entity, ⌘+Enter to save"
        />
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex flex-wrap gap-1 flex-1">
            {ALL_TAGS.map(tag => (
              <TagChip key={tag} tag={tag} active={pendingTags.includes(tag)}
                onClick={() => setPendingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} />
            ))}
          </div>
          <Select value={pendingSession} onValueChange={setPendingSession}>
            <SelectTrigger className="h-7 w-auto min-w-[9rem] text-xs bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <SelectItem value={UNLINKED} className="text-xs">Campaign note</SelectItem>
              {sessions.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.title ? `S${s.session_number} · ${s.title}` : `Session ${s.session_number}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search + filters */}
      {notes.length > 0 && (
        <div className="space-y-2 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search across all notes…"
              className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {ALL_TAGS.map(tag => (
              <TagChip key={tag} tag={tag} active={activeTagFilters.has(tag)} onClick={() => toggleTag(tag)} />
            ))}
            <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <button
              onClick={() => setShowDone(v => !v)}
              className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium transition-all',
                showDone ? 'bg-transparent text-zinc-500 border-zinc-300 dark:border-zinc-700 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'
                         : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')}
            >
              {showDone ? 'Hide done' : 'Done hidden'}
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => { setQuery(''); setActiveTagFilters(new Set()); setShowDone(true); }}
                className="text-[11px] px-2 py-0.5 rounded-full text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {notesLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <StickyNote className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-500">No notes yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Write your first note above — anything from a stray idea to a hidden reveal.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">No notes match your filters.</p>
          <button onClick={() => { setQuery(''); setActiveTagFilters(new Set()); setShowDone(true); }} className="text-xs text-amber-600 dark:text-amber-400 hover:underline mt-2 block mx-auto">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned band */}
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">Pinned</span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{pinned.length}</span>
              </div>
              <NoteColumns>
                {pinned.map(note => (
                  <NoteCard key={note.id} note={note} entities={entities} campaignId={campaignId}
                    sessionLabel={note.session_id ? sessionLabel(sessionMap[note.session_id]) : null}
                    onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
                    onDelete={(id) => deleteMutation.mutate(id)} />
                ))}
              </NoteColumns>
            </div>
          )}

          {/* Grouped notes */}
          {sessionGroups.map(({ sessionId, session, notes: groupNotes }) => (
            <div key={sessionId}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex-shrink-0">
                    {sessionId === UNLINKED ? 'Campaign' : `Session ${session?.session_number ?? '?'}`}
                  </span>
                  {session?.title && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{session.title}</span>
                    </>
                  )}
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-600 flex-shrink-0 ml-1">
                    {groupNotes.length} note{groupNotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {session && (
                  <Link to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${session.id}`}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-600 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex-shrink-0">
                    Open <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
              <NoteColumns>
                {groupNotes.map(note => (
                  <NoteCard key={note.id} note={note} entities={entities} campaignId={campaignId}
                    onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
                    onDelete={(id) => deleteMutation.mutate(id)} />
                ))}
              </NoteColumns>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
