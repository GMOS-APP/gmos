import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Session, Campaign } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import QuickNoteInput from '@/components/session/QuickNoteInput';
import NPCSearchModal from '@/components/session/NPCSearchModal';
import DiceRoller from '@/components/session/DiceRoller';
import ResourceTracker from '@/components/session/ResourceTracker';
import SessionNotesDisplay from '@/components/session/SessionNotesDisplay';
import EntityLinker from '@/components/session/EntityLinker';
import RandomNPCGenerator from '@/components/session/RandomNPCGenerator';
import QuickDialogueGenerator from '@/components/session/QuickDialogueGenerator';
import AutoLinkerSuggestions from '@/components/session/AutoLinkerSuggestions';
import { Minimize2, Clock, StickyNote, Scroll, Wrench } from 'lucide-react';
import EntityMentionRenderer from '@/components/common/EntityMentionRenderer';
import { cn } from '@/lib/utils';

function InlineTimer({ session }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session?.start_time) return;
    const start = new Date(session.start_time).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [session?.start_time]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <span className="font-mono text-sm font-bold text-gray-900 dark:text-zinc-200">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

function ToolsContent({ session, entities, campaignId }) {
  return (
    <div className="p-3 space-y-3">
      <DiceRoller />
      <div className="space-y-2">
        <RandomNPCGenerator campaignId={campaignId} />
        <QuickDialogueGenerator />
      </div>
      <div className="border-t border-gray-200 dark:border-zinc-800 pt-3">
        <ResourceTracker session={session} entities={entities} campaignId={campaignId} />
      </div>
    </div>
  );
}

export default function GMScreen({ session, notes, entities, campaignId, onAddNote, isAddingNote, onMinimize }) {
  const [npcSearchOpen, setNpcSearchOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  // Mobile panel: 'notes' | 'reference' | 'tools'
  const [mobilePanel, setMobilePanel] = useState('notes');
  const queryClient = useQueryClient();

  const handleAddNote = (content) => {
    onAddNote(content);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const endSession = async () => {
    await Session.update(session.id, { status: 'completed', end_time: new Date().toISOString() });
    await Campaign.update(campaignId, { active_mode: 'debrief' });
    queryClient.invalidateQueries();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex-shrink-0">
        <button
          onClick={onMinimize}
          title="Minimize GM Screen"
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-200 truncate flex-1 min-w-0">
          {session?.title || `Session #${session?.session_number}`}
          {session?.session_number && (
            <span className="ml-2 text-xs text-gray-400 dark:text-zinc-500 font-normal hidden sm:inline">
              #{session.session_number}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500 flex-shrink-0">
          <Clock className="w-3 h-3 hidden sm:block" />
          <InlineTimer session={session} />
        </div>

        <span className="w-px h-4 bg-gray-200 dark:bg-zinc-800 flex-shrink-0 hidden sm:block" />

        <Button
          onClick={endSession}
          size="sm"
          variant="outline"
          className="border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10 text-xs h-7 flex-shrink-0"
        >
          <span className="hidden sm:inline">End Session →</span>
          <span className="sm:hidden">End</span>
        </Button>
      </div>

      {/* ── 3-column body ──────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Session Notes ─────────────────────────────────────── */}
        {/* Mobile: full-width when active. md+: fixed-width column always visible */}
        <div className={cn(
          'flex-col overflow-hidden',
          'md:flex md:w-56 md:flex-shrink-0 md:border-r md:border-gray-200 md:dark:border-zinc-800',
          'lg:w-72',
          mobilePanel === 'notes' ? 'flex w-full' : 'hidden md:flex',
        )}>
          {/* Panel label */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              Session Notes
            </span>
            <div className="flex items-center gap-2">
              {notes.length > 0 && (
                <span className="text-[10px] bg-gray-200 text-gray-500 dark:bg-zinc-800 dark:text-zinc-500 rounded-full px-1.5 py-0.5">
                  {notes.length}
                </span>
              )}
              {justSaved && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ saved</span>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-b border-gray-200/60 dark:border-zinc-800/60 flex-shrink-0">
            <QuickNoteInput
              onSubmit={handleAddNote}
              isSubmitting={isAddingNote}
              campaignId={campaignId}
              placeholder="What's happening… (⌘+Enter)"
            />
          </div>

          {/* NPC search */}
          <div className="px-3 py-2 border-b border-gray-200/40 dark:border-zinc-800/40 flex-shrink-0">
            <NPCSearchModal campaignId={campaignId} isOpen={npcSearchOpen} onOpenChange={setNpcSearchOpen} />
            <button
              onClick={() => setNpcSearchOpen(true)}
              className="w-full py-1.5 rounded-lg text-[11px] border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              Search NPC
            </button>
          </div>

          {/* AI suggestions */}
          {notes.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-200/40 dark:border-zinc-800/40 flex-shrink-0">
              <AutoLinkerSuggestions
                notes={notes.map((n) => n.content).join('\n')}
                entities={entities}
                session={session}
              />
            </div>
          )}

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-2.5 min-h-0">
            {notes.length === 0 ? (
              <p className="text-[11px] text-gray-400 dark:text-zinc-600 text-center py-8 leading-relaxed">
                Notes you capture appear here,<br />saved to this session automatically.
              </p>
            ) : (
              notes.map((note, i) => (
                <div
                  key={note.id}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    i === 0
                      ? 'border-amber-400/30 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5'
                      : 'border-gray-200 bg-gray-50 dark:border-zinc-800/50 dark:bg-zinc-900/30'
                  }`}
                >
                  <EntityMentionRenderer text={note.content} entities={entities} campaignId={campaignId} className="text-xs text-gray-800 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed" />
                  <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1 font-mono">
                    {new Date(note.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER: Prep Reference ─────────────────────────────────── */}
        {/* Mobile: full-width when active. md+: flex-1 always visible */}
        <div className={cn(
          'flex-col overflow-hidden min-w-0',
          'md:flex md:flex-1',
          mobilePanel === 'reference' ? 'flex w-full' : 'hidden md:flex',
        )}>
          <Tabs defaultValue="prep" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
              <TabsList className="bg-gray-100 border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
                <TabsTrigger value="prep" className="text-xs">Prep</TabsTrigger>
                <TabsTrigger value="entities" className="text-xs">
                  Entities
                  {session?.linked_entities?.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-full px-1.5 py-0.5">
                      {session.linked_entities.length}
                    </span>
                  )}
                </TabsTrigger>
                {/* Tools tab visible on tablet only (hidden on desktop where right panel shows) */}
                <TabsTrigger value="tools" className="text-xs lg:hidden">Tools</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="prep" className="flex-1 m-0 overflow-y-auto">
              <SessionNotesDisplay session={session} entities={entities} campaignId={campaignId} />
            </TabsContent>
            <TabsContent value="entities" className="flex-1 m-0 overflow-y-auto">
              <EntityLinker session={session} campaignId={campaignId} />
            </TabsContent>
            {/* Tools tab content — tablet only */}
            <TabsContent value="tools" className="flex-1 m-0 overflow-y-auto lg:hidden">
              <ToolsContent session={session} entities={entities} campaignId={campaignId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: Tools ─────────────────────────────────────────────
            Mobile: full-width when active
            Tablet (md): hidden — tools live in center tabs instead
            Desktop (lg+): always visible fixed-width column           */}
        <div className={cn(
          'flex-col overflow-y-auto',
          'md:hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:border-l lg:border-gray-200 lg:dark:border-zinc-800',
          mobilePanel === 'tools' ? 'flex w-full' : 'hidden',
        )}>
          <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Tools</span>
          </div>
          <ToolsContent session={session} entities={entities} campaignId={campaignId} />
        </div>

      </div>

      {/* ── Mobile bottom nav (hidden on md+) ──────────────────────── */}
      <div className="flex md:hidden border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex-shrink-0">
        {[
          { id: 'notes',     Icon: StickyNote, label: 'Notes' },
          { id: 'reference', Icon: Scroll,     label: 'Prep' },
          { id: 'tools',     Icon: Wrench,     label: 'Tools' },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setMobilePanel(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
              mobilePanel === id
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
            )}
          >
            <Icon className={cn('w-4 h-4', mobilePanel === id ? 'text-amber-500' : '')} />
            {label}
          </button>
        ))}
      </div>

    </div>
  );
}
