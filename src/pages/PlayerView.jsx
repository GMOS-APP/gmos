import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Campaign, WorldEntity, Session } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, MapPin, Shield, Package, Waypoints, Scroll, BookOpen, Church, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_META = {
  npc:            { label: 'NPCs',       icon: Users,     accent: 'text-violet-400', bg: 'bg-violet-500/10' },
  location:       { label: 'Locations',  icon: MapPin,    accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  faction:        { label: 'Factions',   icon: Shield,    accent: 'text-red-400',    bg: 'bg-red-500/10' },
  item:           { label: 'Items',      icon: Package,   accent: 'text-amber-400',  bg: 'bg-amber-500/10' },
  thread:         { label: 'Threads',    icon: Waypoints, accent: 'text-blue-400',   bg: 'bg-blue-500/10' },
  event:          { label: 'Events',     icon: Scroll,    accent: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  lore:           { label: 'Lore',       icon: BookOpen,  accent: 'text-lime-400',   bg: 'bg-lime-500/10' },
  deity:          { label: 'Deities',    icon: Church,    accent: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

const VISIBILITY_LABELS = {
  players_know:    { label: 'Known',    icon: Eye,    color: 'dark:text-emerald-400 text-emerald-600' },
  players_suspect: { label: 'Rumored',  icon: EyeOff, color: 'dark:text-amber-400 text-amber-600' },
};

export default function PlayerView() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('campaign_id');
  const [activeType, setActiveType] = useState('all');

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    select: d => d?.[0],
    enabled: !!campaignId,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 200),
    enabled: !!campaignId,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => Session.filter({ campaign_id: campaignId }, '-session_number', 5),
    enabled: !!campaignId,
  });

  // Only show player-visible entities (not creatures, encounters, player_characters, shops)
  const visible = entities.filter(e =>
    (e.visibility === 'players_know' || e.visibility === 'players_suspect') &&
    TYPE_META[e.entity_type]
  );

  const types = [...new Set(visible.map(e => e.entity_type))];
  const filtered = activeType === 'all' ? visible : visible.filter(e => e.entity_type === activeType);

  const lastDebriefed = sessions.find(s => s.status === 'debriefed' || s.status === 'completed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-4 h-4 dark:text-amber-400 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-widest dark:text-zinc-500 text-gray-400">Player View</span>
        </div>
        <h1 className="text-3xl font-bold dark:text-zinc-100 text-gray-900">{campaign?.name || 'Campaign'}</h1>
        {campaign?.setting && (
          <p className="text-sm dark:text-zinc-500 text-gray-500 mt-1">{campaign.setting}</p>
        )}
      </div>

      {/* Last session recap */}
      {lastDebriefed?.previous_session_recap && (
        <div className="mb-8 rounded-xl border dark:border-amber-500/20 border-amber-200 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider dark:text-amber-500 text-amber-600 mb-2">Previously…</p>
          <p className="text-sm dark:text-zinc-300 text-gray-700 leading-relaxed italic">{lastDebriefed.previous_session_recap}</p>
        </div>
      )}

      {/* Type filter */}
      {types.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setActiveType('all')}
            className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors',
              activeType === 'all'
                ? 'bg-amber-500 text-zinc-950'
                : 'dark:bg-zinc-800 dark:text-zinc-400 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-700'
            )}
          >
            All ({visible.length})
          </button>
          {types.map(type => {
            const meta = TYPE_META[type];
            if (!meta) return null;
            const count = visible.filter(e => e.entity_type === type).length;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  activeType === type
                    ? 'bg-amber-500 text-zinc-950'
                    : 'dark:bg-zinc-800 dark:text-zinc-400 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:hover:bg-zinc-700'
                )}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Entity grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Eye className="w-12 h-12 dark:text-zinc-700 text-gray-300 mx-auto mb-4" />
          <p className="dark:text-zinc-400 text-gray-600 font-medium mb-1">Nothing revealed yet</p>
          <p className="text-sm dark:text-zinc-600 text-gray-400">Entities become visible here when their visibility is set to "Players Know" or "Players Suspect".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(entity => {
            const meta = TYPE_META[entity.entity_type] || {};
            const Icon = meta.icon || Eye;
            const vis  = VISIBILITY_LABELS[entity.visibility];
            const VisIcon = vis?.icon;

            return (
              <Link
                key={entity.id}
                to={createPageUrl('EntityDetail') + `?id=${entity.id}&campaign_id=${campaignId}`}
                className="group flex gap-3 p-3 rounded-xl border dark:border-zinc-800 dark:bg-zinc-900/40 bg-white border-gray-200 hover:border-amber-500/40 transition-colors"
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', meta.bg)}>
                  <Icon className={cn('w-4 h-4', meta.accent)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold dark:text-zinc-200 text-gray-800 truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                      {entity.name}
                    </p>
                    {vis && VisIcon && (
                      <span className={cn('flex items-center gap-0.5 text-[10px] font-medium flex-shrink-0', vis.color)}>
                        <VisIcon className="w-2.5 h-2.5" />
                        {vis.label}
                      </span>
                    )}
                  </div>
                  {entity.summary && (
                    <p className="text-xs dark:text-zinc-500 text-gray-500 line-clamp-2 leading-snug">{entity.summary}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Session count footer */}
      <div className="mt-12 pt-6 border-t dark:border-zinc-800 border-gray-200 text-center">
        <p className="text-xs dark:text-zinc-600 text-gray-400">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} played · {visible.length} revealed {visible.length !== 1 ? 'entries' : 'entry'}
        </p>
      </div>
    </div>
  );
}
