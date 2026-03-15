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
import { Minimize2, Clock } from 'lucide-react';

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
    <span className="font-mono text-sm font-bold text-zinc-200">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

export default function GMScreen({ session, notes, entities, campaignId, onAddNote, isAddingNote, onMinimize }) {
  const [npcSearchOpen, setNpcSearchOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
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
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        <button
          onClick={onMinimize}
          title="Minimize GM Screen"
          className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

        <span className="text-sm font-semibold text-zinc-200 truncate flex-1">
          {session?.title || `Session #${session?.session_number}`}
          {session?.session_number && (
            <span className="ml-2 text-xs text-zinc-500 font-normal">#{session.session_number}</span>
          )}
        </span>

        <div className="flex items-center gap-1.5 text-zinc-500">
          <Clock className="w-3 h-3" />
          <InlineTimer session={session} />
        </div>

        <span className="w-px h-4 bg-zinc-800 flex-shrink-0" />

        <Button
          onClick={endSession}
          size="sm"
          variant="outline"
          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-7 flex-shrink-0"
        >
          End Session →
        </Button>
      </div>

      {/* ── 3-column body ──────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Session Notes ──────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">

          {/* Panel header */}
          <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Session Notes
            </span>
            <div className="flex items-center gap-2">
              {notes.length > 0 && (
                <span className="text-[10px] bg-zinc-800 text-zinc-500 rounded-full px-1.5 py-0.5">
                  {notes.length}
                </span>
              )}
              {justSaved && (
                <span className="text-[10px] text-emerald-400">✓ saved to session</span>
              )}
            </div>
          </div>

          {/* Note input */}
          <div className="p-3 border-b border-zinc-800/60 flex-shrink-0">
            <QuickNoteInput
              onSubmit={handleAddNote}
              isSubmitting={isAddingNote}
              placeholder="What's happening… (⌘+Enter)"
            />
          </div>

          {/* Quick tools */}
          <div className="px-3 py-2 border-b border-zinc-800/40 flex-shrink-0">
            <NPCSearchModal campaignId={campaignId} isOpen={npcSearchOpen} onOpenChange={setNpcSearchOpen} />
            <button
              onClick={() => setNpcSearchOpen(true)}
              className="w-full py-1.5 rounded-lg text-[11px] border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
            >
              Search NPC
            </button>
          </div>

          {/* AI linker suggestions */}
          {notes.length > 0 && (
            <div className="px-3 py-2 border-b border-zinc-800/40 flex-shrink-0">
              <AutoLinkerSuggestions
                notes={notes.map((n) => n.content).join('\n')}
                entities={entities}
                session={session}
              />
            </div>
          )}

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-2 min-h-0">
            {notes.length === 0 ? (
              <p className="text-[11px] text-zinc-600 text-center py-8 leading-relaxed">
                Notes you capture appear here,<br />saved to this session automatically.
              </p>
            ) : (
              notes.map((note, i) => (
                <div
                  key={note.id}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    i === 0
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : 'border-zinc-800/50 bg-zinc-900/30'
                  }`}
                >
                  <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                    {new Date(note.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER: Prep Reference ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Tabs defaultValue="prep" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 border-b border-zinc-800 flex-shrink-0">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="prep" className="text-xs">Prep Reference</TabsTrigger>
                <TabsTrigger value="entities" className="text-xs">
                  Linked Entities
                  {session?.linked_entities?.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-zinc-800 text-zinc-400 rounded-full px-1.5 py-0.5">
                      {session.linked_entities.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="prep" className="flex-1 m-0 overflow-y-auto">
              <SessionNotesDisplay session={session} entities={entities} />
            </TabsContent>
            <TabsContent value="entities" className="flex-1 m-0 overflow-y-auto">
              <EntityLinker session={session} campaignId={campaignId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: Tools ─────────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-l border-zinc-800 flex flex-col overflow-y-auto">
          <div className="px-3 py-2 border-b border-zinc-800 flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Tools</span>
          </div>

          <div className="p-3 space-y-3">
            <DiceRoller />

            <div className="space-y-2">
              <RandomNPCGenerator campaignId={campaignId} />
              <QuickDialogueGenerator />
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <ResourceTracker session={session} entities={entities} campaignId={campaignId} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
