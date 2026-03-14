import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Users, MapPin, Shield, Package, Waypoints, Scroll, BookOpen, Church, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_META = {
  npc:      { label: 'NPCs',      icon: Users,     accent: 'text-violet-400', bg: 'bg-violet-500/10' },
  location: { label: 'Locations', icon: MapPin,     accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  faction:  { label: 'Factions',  icon: Shield,    accent: 'text-red-400',    bg: 'bg-red-500/10' },
  item:     { label: 'Items',     icon: Package,   accent: 'text-amber-400',  bg: 'bg-amber-500/10' },
  thread:   { label: 'Threads',   icon: Waypoints, accent: 'text-blue-400',   bg: 'bg-blue-500/10' },
  event:    { label: 'Events',    icon: Scroll,    accent: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  lore:     { label: 'Lore',      icon: BookOpen,  accent: 'text-lime-400',   bg: 'bg-lime-500/10' },
  deity:    { label: 'Deities',   icon: Church,    accent: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

const VISIBILITY_LABELS = {
  players_know:    { label: 'Known',   icon: Eye,    color: 'text-emerald-600 dark:text-emerald-400' },
  players_suspect: { label: 'Rumored', icon: EyeOff, color: 'text-amber-600 dark:text-amber-400' },
};

export default function PublicPlayerView() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [entities, setEntities] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    if (!token) {
      setError('No share token provided.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('player-view', {
          body: { token },
        });
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        setCampaign(data.campaign);
        setEntities(data.entities || []);
        setSessions(data.sessions || []);
      } catch (e) {
        setError(e.message || 'This campaign is not shared or the link is invalid.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const visible = entities.filter(e => TYPE_META[e.entity_type]);
  const types = [...new Set(visible.map(e => e.entity_type))];
  const filtered = activeType === 'all' ? visible : visible.filter(e => e.entity_type === activeType);
  const lastDebriefed = sessions.find(s => s.status === 'debriefed' || s.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-300 font-medium mb-1">Campaign not found</p>
          <p className="text-sm text-zinc-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Player View</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100">{campaign?.name || 'Campaign'}</h1>
          {campaign?.setting && (
            <p className="text-sm text-zinc-500 mt-1">{campaign.setting}</p>
          )}
        </div>

        {/* Last session recap */}
        {lastDebriefed?.previous_session_recap && (
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">Previously…</p>
            <p className="text-sm text-zinc-300 leading-relaxed italic">{lastDebriefed.previous_session_recap}</p>
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
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
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
            <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium mb-1">Nothing revealed yet</p>
            <p className="text-sm text-zinc-600">Entities become visible here when marked as "Players Know" or "Players Suspect".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(entity => {
              const meta = TYPE_META[entity.entity_type] || {};
              const Icon = meta.icon || Eye;
              const vis = VISIBILITY_LABELS[entity.visibility];
              const VisIcon = vis?.icon;
              return (
                <div
                  key={entity.id}
                  className="flex gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/40"
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', meta.bg)}>
                    <Icon className={cn('w-4 h-4', meta.accent)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{entity.name}</p>
                      {vis && VisIcon && (
                        <span className={cn('flex items-center gap-0.5 text-[10px] font-medium flex-shrink-0', vis.color)}>
                          <VisIcon className="w-2.5 h-2.5" />
                          {vis.label}
                        </span>
                      )}
                    </div>
                    {entity.summary && (
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-snug">{entity.summary}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} played · {visible.length} revealed {visible.length !== 1 ? 'entries' : 'entry'}
          </p>
        </div>
      </div>
    </div>
  );
}
