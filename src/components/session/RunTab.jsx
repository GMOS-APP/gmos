import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useMediaQuery } from '@/lib/useMediaQuery';
import SessionTimer from '@/components/session/SessionTimer';
import DiceRoller from '@/components/session/DiceRoller';
import SessionNotesDisplay from '@/components/session/SessionNotesDisplay';
import SessionNotesPanel from '@/components/session/SessionNotesPanel';
import EntityLinker from '@/components/session/EntityLinker';
import ResourceTracker from '@/components/session/ResourceTracker';

// Small window-chrome title bar to reinforce the "OS workspace" feel.
function PanelChrome({ title }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b dark:border-zinc-800 border-zinc-200 bg-zinc-50 dark:bg-zinc-950/40 flex-shrink-0">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
      </span>
      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</span>
    </div>
  );
}

export default function RunTab({ session, entities, campaignId }) {
  const wide = useMediaQuery('(min-width: 768px)');

  const entityCount = session?.linked_entities?.length || 0;

  // The secondary tools, shared by the desktop workspace's right pane and the
  // mobile tab strip.
  const secondaryTabs = (includeNotes) => (
    <Tabs defaultValue={includeNotes ? 'notes' : 'tools'} className="flex-1 flex flex-col overflow-hidden">
      <TabsList className="dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-zinc-100 border border-zinc-200 m-2 flex-shrink-0">
        {includeNotes && <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>}
        <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
        <TabsTrigger value="detailed" className="text-xs">Prep</TabsTrigger>
        <TabsTrigger value="entities" className="text-xs">
          Entities
          {entityCount > 0 && (
            <span className="ml-1.5 text-[10px] dark:bg-zinc-700 dark:text-zinc-400 bg-zinc-200 text-zinc-600 rounded-full px-1.5 py-0.5">
              {entityCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
      </TabsList>

      {includeNotes && (
        <TabsContent value="notes" className="flex-1 m-0 overflow-hidden min-h-0">
          <SessionNotesPanel session={session} entities={entities} campaignId={campaignId} sessionId={session?.id} />
        </TabsContent>
      )}
      <TabsContent value="tools" className="flex-1 m-0 overflow-y-auto">
        <div className="p-3 space-y-3"><DiceRoller /></div>
      </TabsContent>
      <TabsContent value="detailed" className="flex-1 m-0 overflow-y-auto">
        {session && <SessionNotesDisplay session={session} entities={entities} campaignId={campaignId} />}
      </TabsContent>
      <TabsContent value="entities" className="flex-1 m-0 overflow-y-auto">
        {session && <EntityLinker session={session} campaignId={campaignId} />}
      </TabsContent>
      <TabsContent value="resources" className="flex-1 m-0 overflow-y-auto">
        <div className="p-3"><ResourceTracker session={session} entities={entities} campaignId={campaignId} /></div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {session && (
        <div className="mb-3 flex-shrink-0">
          <SessionTimer session={session} />
        </div>
      )}

      {wide ? (
        // Desktop: Notes always visible alongside a resizable secondary pane.
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 rounded-xl border dark:border-zinc-800 border-zinc-200 overflow-hidden"
        >
          <ResizablePanel defaultSize={58} minSize={32} className="flex flex-col min-w-0">
            <PanelChrome title="session_notes" />
            <div className="flex-1 overflow-hidden min-h-0">
              <SessionNotesPanel session={session} entities={entities} campaignId={campaignId} sessionId={session?.id} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={42} minSize={24} className="flex flex-col min-w-0">
            {secondaryTabs(false)}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        // Mobile: single-pane tabs (Notes included).
        secondaryTabs(true)
      )}
    </div>
  );
}
