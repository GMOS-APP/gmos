import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SessionTimer from '@/components/session/SessionTimer';
import RandomNPCGenerator from '@/components/session/RandomNPCGenerator';
import QuickDialogueGenerator from '@/components/session/QuickDialogueGenerator';
import DiceRoller from '@/components/session/DiceRoller';
import SessionNotesDisplay from '@/components/session/SessionNotesDisplay';
import SessionNotesPanel from '@/components/session/SessionNotesPanel';
import EntityLinker from '@/components/session/EntityLinker';
import ResourceTracker from '@/components/session/ResourceTracker';

export default function RunTab({ session, entities, campaignId }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {session && (
        <div className="mb-3 flex-shrink-0">
          <SessionTimer session={session} />
        </div>
      )}
      <Tabs defaultValue="notes" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-zinc-100 border border-zinc-200 mb-3 flex-shrink-0">
          <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
          <TabsTrigger value="detailed" className="text-xs">Prep</TabsTrigger>
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

        {/* Notes */}
        <TabsContent value="notes" className="flex-1 m-0 overflow-hidden min-h-0">
          <SessionNotesPanel
            session={session}
            entities={entities}
            campaignId={campaignId}
            sessionId={session?.id}
          />
        </TabsContent>

        {/* Tools */}
        <TabsContent value="tools" className="flex-1 m-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            <DiceRoller />
            <RandomNPCGenerator campaignId={campaignId} />
            <QuickDialogueGenerator entities={entities} />
          </div>
        </TabsContent>

        {/* Prep Notes */}
        <TabsContent value="detailed" className="flex-1 m-0 overflow-y-auto">
          {session && <SessionNotesDisplay session={session} entities={entities} campaignId={campaignId} />}
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