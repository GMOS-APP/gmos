import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Session, WorldEntity } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CalendarDays, Scroll, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  planned:    'dark:bg-zinc-800 dark:text-zinc-400 bg-zinc-100 text-zinc-600',
  in_progress:'dark:bg-emerald-500/10 dark:text-emerald-400 bg-emerald-100 text-emerald-700',
  completed:  'dark:bg-blue-500/10 dark:text-blue-400 bg-blue-100 text-blue-700',
  debriefed:  'dark:bg-zinc-800 dark:text-zinc-500 bg-zinc-100 text-zinc-500',
};

function SessionNode({ session, events, campaignId }) {
  const [expanded, setExpanded] = useState(true);
  const hasEvents = events.length > 0;
  const hasKeyEvents = session.key_events?.length > 0;

  return (
    <div className="relative pl-10">
      {/* Timeline spine */}
      <div className="absolute left-3.5 top-6 bottom-0 w-px dark:bg-zinc-800 bg-zinc-200" />

      {/* Node dot */}
      <div className="absolute left-1.5 top-3 w-4 h-4 rounded-full dark:bg-zinc-700 bg-zinc-300 border-2 dark:border-zinc-600 border-zinc-400 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full dark:bg-amber-400 bg-amber-500" />
      </div>

      <div className="pb-8">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 mb-2 group w-full text-left"
        >
          {(hasKeyEvents || hasEvents)
            ? expanded
              ? <ChevronDown className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400 flex-shrink-0" />
            : <span className="w-3.5" />
          }
          <span className="text-xs dark:text-zinc-500 text-zinc-400 font-mono">Session {session.session_number}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', STATUS_COLORS[session.status] || STATUS_COLORS.planned)}>
            {session.status?.replace('_', ' ')}
          </span>
          {session.date && (
            <span className="text-xs dark:text-zinc-600 text-zinc-400 ml-auto">
              {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </button>

        <Link
          to={createPageUrl('SessionPage') + `?session_id=${session.id}&campaign_id=${campaignId}`}
          className="block mb-2 group"
        >
          <h3 className="font-semibold dark:text-zinc-200 text-zinc-800 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            {session.title || `Session ${session.session_number}`}
          </h3>
        </Link>

        {expanded && (
          <div className="space-y-2 ml-0.5">
            {session.key_events?.map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-sm dark:text-zinc-400 text-zinc-600">
                <span className="mt-1.5 w-1 h-1 rounded-full dark:bg-zinc-600 bg-zinc-400 flex-shrink-0" />
                {event}
              </div>
            ))}

            {hasEvents && (
              <div className="mt-2 space-y-1.5">
                {events.map(event => (
                  <Link
                    key={event.id}
                    to={createPageUrl('EntityDetail') + `?id=${event.id}&campaign_id=${campaignId}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 group hover:border-amber-500/40 transition-colors"
                  >
                    <Scroll className="w-3.5 h-3.5 dark:text-cyan-400 text-cyan-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium dark:text-zinc-300 text-zinc-700 group-hover:text-amber-500 dark:group-hover:text-amber-400 truncate transition-colors">{event.name}</p>
                      {event.summary && <p className="text-xs dark:text-zinc-600 text-zinc-400 truncate">{event.summary}</p>}
                    </div>
                    {event.extra_data?.scale && (
                      <span className="text-xs dark:text-zinc-600 text-zinc-400 flex-shrink-0">{event.extra_data.scale}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampaignTimeline() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id');

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => Session.filter({ campaign_id: campaignId }, 'session_number'),
    enabled: !!campaignId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId, entity_type: 'event' }),
    enabled: !!campaignId,
  });

  // Group events by last_seen_session; unplaced events go into a "pre-campaign" bucket (0)
  const eventsBySession = events.reduce((acc, event) => {
    const key = event.last_seen_session || 0;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const preCampaignEvents = eventsBySession[0] || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900">Campaign Timeline</h1>
          <p className="text-sm dark:text-zinc-500 text-zinc-600 mt-1">Session history and world events</p>
        </div>
      </div>

      {loadingSessions ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="pl-10">
              <div className="h-4 w-48 dark:bg-zinc-800 bg-zinc-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-64 dark:bg-zinc-800/60 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Pre-campaign events */}
          {preCampaignEvents.length > 0 && (
            <div className="relative pl-10 pb-8">
              <div className="absolute left-3.5 top-6 bottom-0 w-px dark:bg-zinc-800 bg-zinc-200" />
              <div className="absolute left-1.5 top-3 w-4 h-4 rounded-full dark:bg-zinc-800 bg-zinc-200 border-2 dark:border-zinc-700 border-zinc-300" />
              <p className="text-xs dark:text-zinc-500 text-zinc-400 font-mono mb-3">Pre-Campaign</p>
              <div className="space-y-1.5">
                {preCampaignEvents.map(event => (
                  <Link
                    key={event.id}
                    to={createPageUrl('EntityDetail') + `?id=${event.id}&campaign_id=${campaignId}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg dark:bg-zinc-900/60 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 group hover:border-amber-500/40 transition-colors"
                  >
                    <Scroll className="w-3.5 h-3.5 dark:text-cyan-400 text-cyan-600 flex-shrink-0" />
                    <p className="text-xs font-medium dark:text-zinc-300 text-zinc-700 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">{event.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && preCampaignEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarDays className="w-12 h-12 dark:text-zinc-700 text-zinc-300 mb-4" />
              <p className="font-medium dark:text-zinc-400 text-zinc-600 mb-1">No sessions yet</p>
              <p className="text-sm dark:text-zinc-600 text-zinc-400">Sessions will appear here as you play.</p>
            </div>
          ) : (
            sessions.map(session => (
              <SessionNode
                key={session.id}
                session={session}
                events={eventsBySession[session.session_number] || []}
                campaignId={campaignId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
