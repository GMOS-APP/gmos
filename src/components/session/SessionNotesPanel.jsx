import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuickNote } from '@/api/entities';
import { Pencil, Trash2, Search, X } from 'lucide-react';
import QuickNoteInput from '@/components/session/QuickNoteInput';
import NPCSearchModal from '@/components/session/NPCSearchModal';
import AutoLinkerSuggestions from '@/components/session/AutoLinkerSuggestions';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
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

function TagChip({ tag, active, onClick, small }) {
  const s = TAG_STYLES[tag] || TAG_STYLES.Important;
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border font-medium transition-colors',
        small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        active
          ? `${s.bg} ${s.text} ${s.border}`
          : 'dark:border-zinc-700 border-zinc-200 dark:text-zinc-500 text-zinc-400 hover:dark:border-zinc-500 hover:border-zinc-300'
      )}
    >
      {tag}
    </button>
  );
}

function TagSelector({ selected, onToggle, small }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ALL_TAGS.map(tag => (
        <TagChip
          key={tag}
          tag={tag}
          active={selected.includes(tag)}
          onClick={() => onToggle(tag)}
          small={small}
        />
      ))}
    </div>
  );
}

function NoteCard({ note, entities, campaignId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editTags, setEditTags] = useState(note.tags || []);

  const tags = note.tags || [];
  const isFirst = false; // handled by parent

  const handleSave = () => {
    onUpdate(note.id, { content: editContent, tags: editTags });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setEditTags(note.tags || []);
    setEditing(false);
  };

  const toggleEditTag = (tag) => {
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="group relative rounded-lg border transition-colors dark:border-zinc-800/50 border-zinc-200 dark:bg-zinc-900/30 bg-white">
      {!editing ? (
        <div className="p-2.5">
          {/* Tags row */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {tags.map(tag => (
                <span
                  key={tag}
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                    TAG_STYLES[tag]?.bg, TAG_STYLES[tag]?.text, TAG_STYLES[tag]?.border
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <EntityMentionRenderer
            text={note.content}
            entities={entities}
            campaignId={campaignId}
            className="text-xs dark:text-zinc-300 text-zinc-800 whitespace-pre-wrap leading-relaxed"
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] dark:text-zinc-600 text-zinc-400 font-mono">
              {new Date(note.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditContent(note.content); setEditTags(note.tags || []); setEditing(true); }}
                className="w-5 h-5 flex items-center justify-center dark:text-zinc-600 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors"
                title="Edit note"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="w-5 h-5 flex items-center justify-center dark:text-zinc-600 text-zinc-400 hover:dark:text-red-400 hover:text-red-400 transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 space-y-2">
          <EntityMentionTextarea
            value={editContent}
            onChange={setEditContent}
            campaignId={campaignId}
            rows={3}
            className="text-xs dark:bg-zinc-800 dark:border-zinc-700"
            autoFocus
          />
          <TagSelector selected={editTags} onToggle={toggleEditTag} small />
          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              className="text-xs text-amber-500 hover:text-amber-400 font-medium px-1"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-xs dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 px-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionNotesPanel({ session, entities, campaignId, sessionId, compact }) {
  const queryClient = useQueryClient();
  const [npcSearchOpen, setNpcSearchOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilters, setActiveTagFilters] = useState([]);
  const [pendingTags, setPendingTags] = useState([]);
  const { data: notes = [] } = useQuery({
    queryKey: ['quick-notes', campaignId, sessionId],
    queryFn: () => QuickNote.filter(
      { campaign_id: campaignId, session_id: sessionId },
      '-created_date',
      200
    ),
    enabled: !!campaignId && !!sessionId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quick-notes', campaignId, sessionId] });

  const addMutation = useMutation({
    mutationFn: (content) => QuickNote.create({
      campaign_id: campaignId,
      session_id: sessionId,
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

  const handleAddNote = (content) => {
    addMutation.mutate(content);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const togglePendingTag = (tag) => {
    setPendingTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleFilterTag = (tag) => {
    setActiveTagFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Filtering
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = activeTagFilters.length === 0 ||
      (note.tags || []).some(t => activeTagFilters.includes(t));
    return matchesSearch && matchesTags;
  });

  const hasActiveFilters = searchQuery !== '' || activeTagFilters.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">

      {/* Panel header */}
      <div className={cn('px-3 border-b dark:border-zinc-800 border-zinc-200 flex-shrink-0', compact ? 'py-2' : 'py-2.5')}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest dark:text-zinc-400 text-zinc-500">
            Session Notes
          </span>
          <div className="flex items-center gap-2">
            {notes.length > 0 && (
              <span className="text-[10px] bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 rounded-full px-1.5 py-0.5">
                {notes.length}
              </span>
            )}
            {justSaved && (
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400">✓ saved</span>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchQuery(''); setActiveTagFilters([]); }}
                className="text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-0.5"
              >
                <X className="w-2.5 h-2.5" /> clear
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 dark:text-zinc-600 text-zinc-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full pl-6 pr-2 py-1 text-[11px] rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-700 dark:border-zinc-700 border-zinc-200 border outline-none focus:dark:border-zinc-600 focus:border-zinc-300 transition-colors"
          />
        </div>

        {/* Tag filter chips */}
        <div className="flex flex-wrap gap-1">
          {ALL_TAGS.map(tag => (
            <TagChip
              key={tag}
              tag={tag}
              active={activeTagFilters.includes(tag)}
              onClick={() => toggleFilterTag(tag)}
              small
            />
          ))}
        </div>
      </div>

      {/* Note input area */}
      <div className="px-3 py-2 border-b dark:border-zinc-800/60 border-zinc-200/60 flex-shrink-0 space-y-2">
        <QuickNoteInput
          onSubmit={handleAddNote}
          isSubmitting={addMutation.isPending}
          campaignId={campaignId}
          placeholder="What's happening… (⌘+Enter)"
        />
        {/* Tag selector for next note */}
        <div className="flex flex-wrap gap-1">
          {ALL_TAGS.map(tag => (
            <TagChip
              key={tag}
              tag={tag}
              active={pendingTags.includes(tag)}
              onClick={() => togglePendingTag(tag)}
              small
            />
          ))}
        </div>
      </div>

      {/* NPC search */}
      <div className="px-3 py-2 border-b dark:border-zinc-800/40 border-zinc-200/40 flex-shrink-0">
        <NPCSearchModal campaignId={campaignId} isOpen={npcSearchOpen} onOpenChange={setNpcSearchOpen} />
        <button
          onClick={() => setNpcSearchOpen(true)}
          className="w-full py-1.5 rounded-lg text-[11px] border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          Search NPC
        </button>
      </div>

      {/* Auto-linker */}
      {notes.length > 0 && (
        <div className="px-3 py-2 border-b dark:border-zinc-800/40 border-zinc-200/40 flex-shrink-0">
          <AutoLinkerSuggestions
            notes={notes.map(n => n.content).join('\n')}
            entities={entities}
            session={session}
          />
        </div>
      )}

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-2 min-h-0">
        {filteredNotes.length === 0 && !hasActiveFilters && (
          <p className="text-[11px] dark:text-zinc-600 text-zinc-400 text-center py-8 leading-relaxed">
            Notes you capture appear here,<br />saved to this session automatically.
          </p>
        )}
        {filteredNotes.length === 0 && hasActiveFilters && (
          <p className="text-[11px] dark:text-zinc-600 text-zinc-400 text-center py-6">
            No notes match the current filters.
          </p>
        )}
        {filteredNotes.map((note, i) => (
          <div
            key={note.id}
            className={i === 0 && !hasActiveFilters ? 'rounded-lg border border-amber-400/30 dark:border-amber-500/20 dark:bg-amber-500/5 bg-amber-50/60' : ''}
          >
            <NoteCard
              note={note}
              entities={entities}
              campaignId={campaignId}
              onUpdate={(id, payload) => updateMutation.mutate({ id, payload })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </div>
        ))}
      </div>

    </div>
  );
}
