import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, MapPin, Shield, Waypoints, Package, Sparkles, Scroll,
  BookOpen, Plus, ArrowRight, Swords, Church, Flame, ShoppingBag,
  CalendarDays, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PassiveStatsHub from '@/components/dashboard/PassiveStatsHub';
import PartyInventory from '@/components/dashboard/PartyInventory';
import RulesSearch from '@/components/dashboard/RulesSearch';
import PrivateScratchpad from '@/components/dashboard/PrivateScratchpad';
import StandaloneTimer from '@/components/dashboard/StandaloneTimer';
import SessionCalendar from '@/components/dashboard/SessionCalendar';

const ENTITY_TYPES = [
  { type: 'npc', label: 'NPCs', icon: Users, accent: 'text-violet-400', bg: 'bg-violet-500/10' },
  { type: 'location', label: 'Locations', icon: MapPin, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { type: 'faction', label: 'Factions', icon: Shield, accent: 'text-red-400', bg: 'bg-red-500/10' },
  { type: 'thread', label: 'Threads', icon: Waypoints, accent: 'text-blue-400', bg: 'bg-blue-500/10' },
  { type: 'item', label: 'Items', icon: Package, accent: 'text-amber-400', bg: 'bg-amber-500/10' },
  { type: 'player_character', label: 'PCs', icon: Sparkles, accent: 'text-pink-400', bg: 'bg-pink-500/10' },
  { type: 'creature', label: 'Creatures', icon: Swords, accent: 'text-orange-400', bg: 'bg-orange-500/10' },
  { type: 'event', label: 'Events', icon: Scroll, accent: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { type: 'lore', label: 'Lore', icon: BookOpen, accent: 'text-lime-400', bg: 'bg-lime-500/10' },
  { type: 'deity', label: 'Deities', icon: Church, accent: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { type: 'encounter', label: 'Encounters', icon: Flame, accent: 'text-rose-400', bg: 'bg-rose-500/10' },
  { type: 'shop', label: 'Shops', icon: ShoppingBag, accent: 'text-teal-400', bg: 'bg-teal-500/10' },
];

const STATUS_COLORS = {
  planned: 'dark:text-zinc-400 dark:bg-zinc-800 text-zinc-600 bg-zinc-200',
  in_progress: 'dark:text-emerald-400 dark:bg-emerald-500/10 text-emerald-700 bg-emerald-100',
  completed: 'dark:text-blue-400 dark:bg-blue-500/10 text-blue-700 bg-blue-100',
  debriefed: 'dark:text-zinc-500 dark:bg-zinc-800 text-zinc-600 bg-zinc-200',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CampaignDashboard() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('id');

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (d) => d?.[0],
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => base44.entities.WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 200),
    enabled: !!campaignId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => base44.entities.Session.filter({ campaign_id: campaignId }, '-session_number', 20),
    enabled: !!campaignId,
  });

  const playerCharacters = entities.filter((e) => e.entity_type === 'player_character');

  // Counts per entity type
  const countByType = {};
  for (const e of entities) {
    countByType[e.entity_type] = (countByType[e.entity_type] || 0) + 1;
  }

  // Recent activity: last 8 updated entities
  const recentEntities = entities.slice(0, 8);

  // Active threads
  const activeThreads = entities.filter((e) => e.entity_type === 'thread' && e.status === 'active');

  // Upcoming / next session
  const upcomingSession = sessions.find((s) => s.status === 'planned');
  const lastSession = sessions.find((s) => s.status === 'completed' || s.status === 'debriefed');
  const inProgressSession = sessions.find((s) => s.status === 'in_progress');
  const currentSession = inProgressSession || upcomingSession;

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{campaign?.name || 'Campaign'}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {entities.length} world entities · {campaign?.setting || 'No setting defined'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('SessionPage') + `?id=${campaignId}`}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
              <ArrowRight className="w-4 h-4 mr-1.5" />
              {inProgressSession ? 'Continue Session' : 'Go to Session'}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Session Banner ──────────────────────────────────────────── */}
      {currentSession && (
        <div className={cn(
          "rounded-xl border p-4 flex items-center gap-4",
          inProgressSession
            ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/20"
            : "bg-amber-50 dark:bg-amber-500/5 border-amber-300 dark:border-amber-500/20"
        )}>
          <div className={cn(
            "p-2.5 rounded-lg",
            inProgressSession ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-amber-100 dark:bg-amber-500/10"
          )}>
            {inProgressSession
              ? <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              : <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold", inProgressSession ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
              {inProgressSession ? '🎲 Session In Progress' : '📅 Next Session Ready'}
            </p>
            <p className="text-xs text-zinc-700 dark:text-zinc-400 mt-0.5 truncate">
              Session #{currentSession.session_number}{currentSession.title ? ` — ${currentSession.title}` : ''}
              {currentSession.date ? ` · ${new Date(currentSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}` : ''}
            </p>
            {currentSession.strong_start && (
              <p className="text-xs text-zinc-700 dark:text-zinc-500 mt-1 line-clamp-1 italic">"{currentSession.strong_start}"</p>
            )}
          </div>
          <Link to={createPageUrl('SessionPage') + `?id=${campaignId}`}>
            <Button size="sm" variant="outline" className={cn(
              "text-xs",
              inProgressSession
                ? "border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/10"
                : "border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/10"
            )}>
              {inProgressSession ? 'Join Session' : 'View Session'} →
            </Button>
          </Link>
        </div>
      )}

      {/* ── Passive Stats Hub ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Party Stats</h2>
          <a
            href={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}&type=player_character`}
            className="text-xs text-zinc-600 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Manage PCs →
          </a>
        </div>
        <PassiveStatsHub playerCharacters={playerCharacters} campaignId={campaignId} />
      </div>

      {/* ── Two-column body ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Entity breakdown + Recent Activity */}
        <div className="lg:col-span-2 space-y-6">

          {/* Entity Type Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">World Entities</h2>
              <Link
                to={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}`}
                className="text-xs text-zinc-600 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                Browse all →
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ENTITY_TYPES.map(({ type, label, icon: Icon, accent, bg }) => {
                const count = countByType[type] || 0;
                return (
                  <Link
                    key={type}
                    to={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}&type=${type}`}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                  >
                    <div className={cn("p-2 rounded-lg", bg)}>
                      <Icon className={cn("w-4 h-4", accent)} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">{count}</p>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-500 mt-0.5">{label}</p>
                    </div>
                  </Link>
                );
              })}
              {/* Add Entity shortcut */}
              <Link
                to={createPageUrl('EntityDetail') + `?campaign_id=${campaignId}&new=true`}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-all"
              >
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors">Add New</p>
              </Link>
            </div>
          </div>

          {/* Party Inventory */}
          {entities.filter(e => e.entity_type === 'item').length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Party Inventory</h2>
                <Link
                  to={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}&type=item`}
                  className="text-xs text-zinc-600 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  All items →
                </Link>
              </div>
              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-3">
                <PartyInventory items={entities.filter(e => e.entity_type === 'item')} campaignId={campaignId} />
              </div>
            </div>
          )}

        </div>

        {/* RIGHT: Sessions + Threads + Calendar */}
        <div className="space-y-6">

          {/* Session Calendar */}
          <SessionCalendar sessions={sessions} campaignId={campaignId} />

          {/* Active Threads */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Active Threads</h2>
              <Link
                to={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}&type=thread`}
                className="text-xs text-zinc-600 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                All →
              </Link>
            </div>
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-3 space-y-2">
              {activeThreads.length === 0 ? (
                <p className="text-center py-4 text-gray-500 dark:text-zinc-600 text-xs">No active threads</p>
              ) : (
                activeThreads.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    to={createPageUrl('EntityDetail') + `?id=${t.id}&campaign_id=${campaignId}`}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/40 group transition-colors"
                  >
                    <Waypoints className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate font-medium">
                        {t.name}
                      </p>
                      {t.summary && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-600 line-clamp-2 mt-0.5">{t.summary}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link to={createPageUrl('SessionPage') + `?id=${campaignId}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 text-xs">
                  <CalendarDays className="w-3.5 h-3.5 mr-2 text-amber-400" />
                  Go to Session
                </Button>
              </Link>
              <Link to={createPageUrl('RelationshipMap') + `?campaign_id=${campaignId}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 text-xs">
                  <Activity className="w-3.5 h-3.5 mr-2 text-blue-400" />
                  View Relationship Map
                </Button>
              </Link>
              <Link to={createPageUrl('EntityDetail') + `?campaign_id=${campaignId}&new=true`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                  Add World Entity
                </Button>
              </Link>
            </div>
          </div>

          {/* Session History (hidden on smaller screens) */}
          <div className="hidden xl:block">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Sessions</h2>
            </div>
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-xl divide-y divide-zinc-200 dark:divide-zinc-800/50">
              {sessions.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <p className="text-zinc-600 dark:text-zinc-600 text-xs">No sessions yet</p>
                  <Link to={createPageUrl('SessionPage') + `?id=${campaignId}`}>
                    <Button size="sm" variant="outline" className="mt-3 border-zinc-700 text-zinc-400 text-xs h-7">
                      Start First Session
                    </Button>
                  </Link>
                </div>
              ) : (
                sessions.slice(0, 8).map((s) => (
                  <Link key={s.id} to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${s.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-700 dark:text-zinc-500 flex-shrink-0">
                      {s.session_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">{s.title || `Session ${s.session_number}`}</p>
                      {s.date && (
                        <p className="text-[10px] text-gray-600 dark:text-zinc-600 mt-0.5">
                          {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-medium capitalize",
                      STATUS_COLORS[s.status] || 'text-zinc-500 bg-zinc-800'
                    )}>
                      {s.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ── GM Tools Row ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">GM Tools</h2>
        <div style={{ minHeight: '220px' }}>
          <StandaloneTimer />
        </div>
        <div style={{ minHeight: '280px' }}>
          <RulesSearch />
        </div>
        <div style={{ minHeight: '220px' }}>
          <PrivateScratchpad campaignId={campaignId} />
        </div>
      </div>

    </div>
  );
}