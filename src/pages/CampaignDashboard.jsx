import React, { useState } from 'react';
import { usePageParams } from '@/lib/usePageParams';
import { CampaignProvider } from '@/lib/CampaignContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Campaign, WorldEntity, Session } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Waypoints, Plus, ArrowRight, CalendarDays, Activity, Share2, Copy, Check, Settings,
  BookOpen, Map, Sparkles, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ENTITY_TYPE_META } from '@/lib/entityColors';
import PassiveStatsHub from '@/components/dashboard/PassiveStatsHub';
import PartyInventory from '@/components/dashboard/PartyInventory';
import PrivateScratchpad from '@/components/dashboard/PrivateScratchpad';
import StandaloneTimer from '@/components/dashboard/StandaloneTimer';
import WeatherGenerator from '@/components/dashboard/WeatherGenerator';
import SessionCalendar from '@/components/dashboard/SessionCalendar';

// Derived from the single source so colors/icons/labels can't drift.
const ENTITY_TYPES = ['npc', 'location', 'faction', 'thread', 'item', 'player_character', 'creature', 'event', 'lore', 'deity', 'encounter', 'shop']
  .map((type) => {
    const m = ENTITY_TYPE_META[type];
    return { type, label: m.label, icon: m.Icon, accent: m.text, bg: m.bg };
  });

const STATUS_COLORS = {
  planned: 'dark:text-zinc-400 dark:bg-zinc-800 text-zinc-600 bg-zinc-200',
  in_progress: 'dark:text-emerald-400 dark:bg-emerald-500/10 text-emerald-700 bg-emerald-100',
  completed: 'dark:text-blue-400 dark:bg-blue-500/10 text-blue-700 bg-blue-100',
  debriefed: 'dark:text-zinc-500 dark:bg-zinc-800 text-zinc-600 bg-zinc-200',
};

// Reads the campaign like a published adventure: Background & Setting as prose,
// the Hook as an accented call-to-adventure callout.
function CampaignBrief({ campaign }) {
  const [open, setOpen] = useState(true);
  const sections = [
    { key: 'background', label: 'Background', Icon: BookOpen },
    { key: 'setting', label: 'Setting', Icon: Map },
  ].filter((s) => campaign?.[s.key]?.trim());
  const hook = campaign?.hook?.trim();
  if (sections.length === 0 && !hook) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-500">Campaign Brief</span>
        <ChevronDown className={cn('w-4 h-4 text-zinc-400 dark:text-zinc-600 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {sections.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-1.5 mb-1">
                <s.Icon className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">{s.label}</h3>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{campaign[s.key]}</p>
            </div>
          ))}
          {hook && (
            <div className="rounded-lg border-l-2 border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/[0.07] pl-3.5 pr-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">The Hook</h3>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed italic whitespace-pre-wrap">{hook}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function CampaignDashboard() {
  const params = usePageParams();
  const campaignId = params.get('id');
  const queryClient = useQueryClient();
  const [togglingShare, setTogglingShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (d) => d?.[0],
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 200),
    enabled: !!campaignId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => Session.filter({ campaign_id: campaignId }, '-session_number', 20),
    enabled: !!campaignId,
  });

  const playerCharacters = entities.filter((e) => e.entity_type === 'player_character');

  // Counts per entity type
  const countByType = {};
  for (const e of entities) {
    countByType[e.entity_type] = (countByType[e.entity_type] || 0) + 1;
  }

  // Active threads
  const activeThreads = entities.filter((e) => e.entity_type === 'thread' && e.status === 'active');

  // Upcoming / next session
  const upcomingSession = sessions.find((s) => s.status === 'planned');
  const lastSession = sessions.find((s) => s.status === 'completed' || s.status === 'debriefed');
  const inProgressSession = sessions.find((s) => s.status === 'in_progress');
  const currentSession = inProgressSession || upcomingSession;

  // Always navigate to a concrete session by id — relying on
  // current_session_number alone can miss (it advances past existing sessions
  // after a debrief), which left the session page blank.
  const sessionTarget = inProgressSession || upcomingSession || lastSession || sessions[0];
  const sessionHref = sessionTarget
    ? createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${sessionTarget.id}`
    : createPageUrl('SessionBrowser') + `?campaign_id=${campaignId}`;

  async function toggleSharing() {
    if (!campaign || togglingShare) return;
    setTogglingShare(true);
    try {
      await Campaign.update(campaignId, { is_shared: !campaign.is_shared });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    } finally {
      setTogglingShare(false);
    }
  }

  function copyShareUrl() {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}player-view/public?token=${campaign?.player_share_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <CampaignProvider campaign={campaign}>
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{campaign?.name || 'Campaign'}</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1.5">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {entities.length} world entit{entities.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link to={createPageUrl('CampaignSettings') + `?campaign_id=${campaignId}`}>
            <Button size="sm" variant="outline" className="dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border-zinc-300 text-zinc-600">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <Link to={sessionHref}>
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
          "rounded-xl border p-4 flex flex-wrap items-center gap-4",
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
          <Link to={createPageUrl('SessionPage') + `?id=${campaignId}&session_id=${currentSession.id}`}>
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

      {/* ── Campaign Brief ──────────────────────────────────────────── */}
      <CampaignBrief campaign={campaign} />

      {/* ── Passive Stats Hub ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest">Party Stats</h2>
          <Link
            to={createPageUrl('EntityBrowser') + `?campaign_id=${campaignId}&type=player_character`}
            className="text-xs text-zinc-600 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Manage PCs →
          </Link>
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
                <p className="text-center py-4 text-zinc-500 dark:text-zinc-600 text-xs">No active threads</p>
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
              <Link to={sessionHref} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700 border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-xs">
                  <CalendarDays className="w-3.5 h-3.5 mr-2 text-amber-400" />
                  Go to Session
                </Button>
              </Link>
              <Link to={createPageUrl('RelationshipMap') + `?campaign_id=${campaignId}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700 border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-xs">
                  <Activity className="w-3.5 h-3.5 mr-2 text-blue-400" />
                  View Relationship Map
                </Button>
              </Link>
              <Link to={createPageUrl('EntityDetail') + `?campaign_id=${campaignId}&new=true`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700 border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                  Add World Entity
                </Button>
              </Link>
            </div>
          </div>

          {/* Share with Players */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest mb-3">Share with Players</h2>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Player View</span>
                </div>
                <button
                  onClick={toggleSharing}
                  disabled={togglingShare}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                    campaign?.is_shared ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
                  )}
                >
                  <span className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                    campaign?.is_shared ? 'translate-x-4' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
              {campaign?.is_shared && campaign?.player_share_token && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500">Share this link with your players:</p>
                  <div className="flex gap-1.5">
                    <div className="flex-1 min-w-0 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1">
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate font-mono">
                        {`${window.location.origin}${import.meta.env.BASE_URL}player-view/public?token=${campaign.player_share_token}`}
                      </p>
                    </div>
                    <button
                      onClick={copyShareUrl}
                      className="flex-shrink-0 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Copy link"
                    >
                      {copied
                        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                        : <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      }
                    </button>
                  </div>
                </div>
              )}
              {!campaign?.is_shared && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-600">Toggle on to generate a shareable link for your players.</p>
              )}
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
                  <Link to={createPageUrl('SessionBrowser') + `?campaign_id=${campaignId}`}>
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
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-600 mt-0.5">
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
        <div style={{ minHeight: '220px' }}>
          <PrivateScratchpad campaignId={campaignId} />
        </div>
        <div style={{ minHeight: '220px' }}>
          <WeatherGenerator />
        </div>
      </div>

    </div>
    </CampaignProvider>
  );
}