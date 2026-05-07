import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Session, Campaign } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DiceRoller from '@/components/session/DiceRoller';
import SessionNotesPanel from '@/components/session/SessionNotesPanel';
import ResourceTracker from '@/components/session/ResourceTracker';
import SessionNotesDisplay from '@/components/session/SessionNotesDisplay';
import EntityLinker from '@/components/session/EntityLinker';
import CombatTracker from '@/components/session/CombatTracker';
import EntityQuickViewModal from '@/components/common/EntityQuickViewModal';
import { Minimize2, Clock, StickyNote, Scroll, Swords, Heart, Search, Users, MapPin, Shield, Waypoints, Package, Sparkles, BookOpen, Church, Flame, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEntityColors } from '@/lib/entityColors';

const TYPE_ICONS = {
  npc: Users, creature: Swords, location: MapPin, faction: Shield,
  thread: Waypoints, item: Package, player_character: Sparkles,
  event: Scroll, lore: BookOpen, deity: Church, encounter: Flame, shop: ShoppingBag,
};

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
    <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-200">
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

// World entity search panel — search all campaign entities, click to quick-view
function WorldSearch({ entities, campaignId }) {
  const [query, setQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);

  const filtered = query.trim().length > 0
    ? entities.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 30)
    : entities.slice(0, 30);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b dark:border-zinc-800 border-zinc-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400 pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search all entities…"
            className="pl-7 h-8 text-xs dark:bg-zinc-800 dark:border-zinc-700"
          />
        </div>
        {query === '' && (
          <p className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-1.5">
            Click any entity to see its details inline.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y dark:divide-zinc-800/50 divide-zinc-100 min-h-0">
        {filtered.length === 0 ? (
          <p className="text-xs dark:text-zinc-600 text-zinc-400 text-center py-8">No entities found.</p>
        ) : (
          filtered.map(entity => {
            const colors = getEntityColors(entity.entity_type);
            const Icon = TYPE_ICONS[entity.entity_type] || Scroll;
            return (
              <button
                key={entity.id}
                onClick={(e) => {
                  setAnchorRect(e.currentTarget.getBoundingClientRect());
                  setSelectedEntity(entity);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:dark:bg-zinc-800/40 hover:bg-zinc-50 transition-colors"
              >
                <div className={cn('p-1.5 rounded-md border flex-shrink-0', colors.badge)}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium dark:text-zinc-200 text-zinc-800 truncate">{entity.name}</p>
                  <p className={cn('text-[10px]', colors.text)}>{entity.entity_type.replace(/_/g, ' ')}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedEntity && (
        <EntityQuickViewModal
          entity={selectedEntity}
          campaignId={campaignId}
          open={!!selectedEntity}
          onOpenChange={(o) => { if (!o) setSelectedEntity(null); }}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}

// Right panel content — Combat / Tools / Party tabs
function RightPanelContent({ session, entities, campaignId }) {
  return (
    <Tabs defaultValue="combat" className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-2 pb-0 flex-shrink-0 border-b dark:border-zinc-800 border-zinc-200">
        <TabsList className="w-full dark:bg-zinc-900 bg-zinc-100 dark:border dark:border-zinc-800 border border-zinc-200 h-8">
          <TabsTrigger value="combat" className="flex-1 text-[11px] gap-1 dark:data-[state=active]:bg-zinc-800 data-[state=active]:bg-white h-6">
            <Swords className="w-3 h-3" /> Combat
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex-1 text-[11px] dark:data-[state=active]:bg-zinc-800 data-[state=active]:bg-white h-6">
            🎲 Tools
          </TabsTrigger>
          <TabsTrigger value="party" className="flex-1 text-[11px] gap-1 dark:data-[state=active]:bg-zinc-800 data-[state=active]:bg-white h-6">
            <Heart className="w-3 h-3" /> Party
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="combat" className="flex-1 m-0 overflow-hidden min-h-0">
        <CombatTracker entities={entities} campaignId={campaignId} />
      </TabsContent>

      <TabsContent value="tools" className="flex-1 m-0 overflow-y-auto">
        <div className="p-3 space-y-3">
          <DiceRoller />
        </div>
      </TabsContent>

      <TabsContent value="party" className="flex-1 m-0 overflow-y-auto">
        <div className="p-3">
          <ResourceTracker session={session} entities={entities} campaignId={campaignId} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function GMScreen({ session, entities, campaignId, onMinimize }) {
  // Mobile panel: 'notes' | 'reference' | 'tools'
  const [mobilePanel, setMobilePanel] = useState('notes');
  const queryClient = useQueryClient();

  const endSession = async () => {
    await Session.update(session.id, { status: 'completed', end_time: new Date().toISOString() });
    await Campaign.update(campaignId, { active_mode: 'debrief' });
    queryClient.invalidateQueries();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0">
        <button
          onClick={onMinimize}
          title="Minimize GM Screen"
          className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors flex-shrink-0"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>

        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate flex-1 min-w-0">
          {session?.title || `Session #${session?.session_number}`}
          {session?.session_number && (
            <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500 font-normal hidden sm:inline">
              #{session.session_number}
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0">
          <Clock className="w-3 h-3 hidden sm:block" />
          <InlineTimer session={session} />
        </div>

        <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 hidden sm:block" />

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
        <div className={cn(
          'flex-col overflow-hidden',
          'md:flex md:w-56 md:flex-shrink-0 md:border-r md:border-zinc-200 md:dark:border-zinc-800',
          'lg:w-64',
          mobilePanel === 'notes' ? 'flex w-full' : 'hidden md:flex',
        )}>
          <SessionNotesPanel
            session={session}
            entities={entities}
            campaignId={campaignId}
            sessionId={session?.id}
            compact
          />
        </div>

        {/* CENTER: Prep Reference ─────────────────────────────────── */}
        <div className={cn(
          'flex-col overflow-hidden min-w-0',
          'md:flex md:flex-1',
          mobilePanel === 'reference' ? 'flex w-full' : 'hidden md:flex',
        )}>
          <Tabs defaultValue="prep" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <TabsList className="bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                <TabsTrigger value="prep" className="text-xs">Prep</TabsTrigger>
                <TabsTrigger value="entities" className="text-xs">
                  Entities
                  {session?.linked_entities?.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-full px-1.5 py-0.5">
                      {session.linked_entities.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="world" className="text-xs">
                  <Search className="w-3 h-3 mr-1" />
                  World
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
            <TabsContent value="world" className="flex-1 m-0 overflow-hidden min-h-0">
              <WorldSearch entities={entities} campaignId={campaignId} />
            </TabsContent>
            {/* Tools tab content — tablet only */}
            <TabsContent value="tools" className="flex-1 m-0 overflow-hidden min-h-0 lg:hidden">
              <RightPanelContent session={session} entities={entities} campaignId={campaignId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT: Combat / Tools / Party ──────────────────────────────
            Mobile: full-width when active
            Tablet (md): hidden — tools live in center tabs instead
            Desktop (lg+): always visible fixed-width column           */}
        <div className={cn(
          'flex-col overflow-hidden',
          'md:hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:border-l lg:border-zinc-200 lg:dark:border-zinc-800',
          mobilePanel === 'tools' ? 'flex w-full' : 'hidden',
        )}>
          <RightPanelContent session={session} entities={entities} campaignId={campaignId} />
        </div>

      </div>

      {/* ── Mobile bottom nav (hidden on md+) ──────────────────────── */}
      <div className="flex md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0">
        {[
          { id: 'notes',     Icon: StickyNote, label: 'Notes' },
          { id: 'reference', Icon: Scroll,     label: 'Prep' },
          { id: 'tools',     Icon: Swords,     label: 'Combat' },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setMobilePanel(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
              mobilePanel === id
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
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
