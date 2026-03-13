import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SessionTimer from '@/components/session/SessionTimer';
import QuickNoteInput from '@/components/session/QuickNoteInput';
import NPCSearchModal from '@/components/session/NPCSearchModal';
import RandomNPCGenerator from '@/components/session/RandomNPCGenerator';
import QuickDialogueGenerator from '@/components/session/QuickDialogueGenerator';
import DiceRoller from '@/components/session/DiceRoller';
import AutoLinkerSuggestions from '@/components/session/AutoLinkerSuggestions';
import SessionNotesDisplay from '@/components/session/SessionNotesDisplay';
import EntityLinker from '@/components/session/EntityLinker';
import ResourceTracker from '@/components/session/ResourceTracker';

export default function RunTab({ session, notes, entities, campaignId, onAddNote, isAddingNote }) {
  const [npcSearchOpen, setNpcSearchOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {session && (
        <div className="mb-3 flex-shrink-0">
          <SessionTimer session={session} />
        </div>
      )}
      <Tabs defaultValue="quick" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-zinc-100 border border-zinc-200 mb-3 flex-shrink-0">
          <TabsTrigger value="quick" className="text-xs">Quick Notes</TabsTrigger>
          <TabsTrigger value="detailed" className="text-xs">Prep Notes</TabsTrigger>
          <TabsTrigger value="entities" className="text-xs">
            Entities
            {session?.linked_entities?.length > 0 && (
              <span className="ml-1.5 text-[10px] dark:bg-zinc-700 dark:text-zinc-400 bg-zinc-200 text-zinc-600 rounded-full px-1.5 py-0.5">
                {session.linked_entities.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
        </TabsList>

        {/* Quick Notes */}
        <TabsContent value="quick" className="m-0">
          <div className="max-h-[60vh] overflow-y-auto space-y-3">
            <div className="sticky top-0 dark:bg-zinc-950 dark:border-b dark:border-zinc-800/40 bg-white border-b border-zinc-200 z-10 p-4 pb-3">
              <QuickNoteInput
                onSubmit={onAddNote}
                isSubmitting={isAddingNote}
                placeholder="Capture what's happening... press Enter to save"
              />
            </div>
            <div className="px-4 space-y-3">
              <NPCSearchModal campaignId={campaignId} isOpen={npcSearchOpen} onOpenChange={setNpcSearchOpen} />
              <Button
                onClick={() => setNpcSearchOpen(true)}
                size="sm"
                variant="outline"
                className="w-full text-xs dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-zinc-300 text-zinc-700 hover:text-zinc-900"
              >
                Search NPC
              </Button>
              <RandomNPCGenerator campaignId={campaignId} />
              <QuickDialogueGenerator />
              <DiceRoller />
            </div>
            {notes.length > 0 && (
              <div className="px-4">
                <AutoLinkerSuggestions
                  notes={notes.map((n) => n.content).join('\n')}
                  entities={entities}
                  session={session}
                />
              </div>
            )}
            <div className="px-4 pb-4 space-y-2">
              {notes.length === 0 ? (
                <p className="text-sm dark:text-zinc-600 text-zinc-500 py-8 text-center">Start capturing moments as they happen.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg dark:bg-zinc-900/40 dark:border dark:border-zinc-800/40 bg-zinc-50 border border-zinc-200">
                    <p className="text-sm dark:text-zinc-300 text-zinc-900 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <p className="text-[10px] dark:text-zinc-600 text-zinc-500 mt-1.5 font-mono">
                      {new Date(note.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Prep Notes */}
        <TabsContent value="detailed" className="flex-1 m-0 overflow-y-auto">
          {session && <SessionNotesDisplay session={session} entities={entities} />}
        </TabsContent>

        {/* Linked Entities */}
        <TabsContent value="entities" className="flex-1 m-0 overflow-y-auto">
          {session && <EntityLinker session={session} campaignId={campaignId} />}
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="flex-1 m-0 overflow-y-auto">
          <div className="p-4">
            <ResourceTracker session={session} entities={entities} campaignId={campaignId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}