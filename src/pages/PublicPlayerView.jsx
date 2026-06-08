import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Eye, EyeOff, Loader2, Backpack, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENTITY_TYPE_META } from '@/lib/entityColors';
import PlayerEntityModal from '@/components/common/PlayerEntityModal';
import PartyInventoryManager from '@/components/party/PartyInventoryManager';
import PartyNotes from '@/components/party/PartyNotes';
import PlayerBattleMap from '@/components/map/PlayerBattleMap';

// Player-facing types, derived from the single source.
const TYPE_META = Object.fromEntries(
  ['npc', 'location', 'faction', 'item', 'thread', 'event', 'lore', 'deity'].map((t) => {
    const m = ENTITY_TYPE_META[t];
    return [t, { label: m.label, icon: m.Icon, accent: m.text, bg: m.bg }];
  })
);

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
  const [selected, setSelected] = useState(null);
  const [inv, setInv] = useState([]);
  const [currency, setCurrency] = useState({});
  const [pnotes, setPnotes] = useState([]);
  const [hasMap, setHasMap] = useState(false);

  // The public share view is dark-only; ensure the `dark` class is set so
  // themed components (the entity modal) render consistently.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
        // Party inventory (best-effort — never blocks the page).
        try {
          const { data: invData } = await supabase.functions.invoke('party-inventory', { body: { token, action: 'list' } });
          if (invData && !invData.error) { setInv(invData.items || []); setCurrency(invData.currency || {}); setPnotes(invData.notes || []); }
        } catch { /* non-fatal */ }
      } catch (e) {
        setError(e.message || 'This campaign is not shared or the link is invalid.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  // Re-pull the player-safe projection (entities + sessions) when the GM changes
  // something — triggered by the campaign's realtime signal below.
  const refreshView = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await supabase.functions.invoke('player-view', { body: { token } });
      if (data && !data.error) { setEntities(data.entities || []); setSessions(data.sessions || []); }
    } catch { /* non-fatal */ }
  }, [token]);

  // Live entity reveals: a DB trigger bumps `campaign_pulse` on any world-entity
  // change; we subscribe to that secrets-free row via postgres_changes and
  // debounce-refetch through the edge function, so reveals appear without a
  // refresh. (No entity data is ever exposed to the anon client directly.)
  useEffect(() => {
    if (!campaign?.id) return undefined;
    let t;
    const ch = supabase.channel(`pulse:${campaign.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_pulse', filter: `campaign_id=eq.${campaign.id}` },
        () => { clearTimeout(t); t = setTimeout(refreshView, 400); })
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [campaign?.id, refreshView]);

  const visible = entities.filter(e => TYPE_META[e.entity_type]);
  const types = [...new Set(visible.map(e => e.entity_type))];
  const filtered = activeType === 'all' ? visible : visible.filter(e => e.entity_type === activeType);
  const lastDebriefed = sessions.find(s => s.status === 'debriefed' || s.status === 'completed');

  // Party inventory mutations via the token-authenticated edge function.
  const invCall = (payload) => supabase.functions.invoke('party-inventory', { body: { token, ...payload } });
  const addItem = async (item) => {
    const { data } = await invCall({ action: 'add', item });
    if (data?.item) setInv(prev => [...prev, data.item]);
  };
  const updItem = (id, patch) => {
    setInv(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
    invCall({ action: 'update', id, patch });
  };
  const delItem = (id) => {
    setInv(prev => prev.filter(i => i.id !== id));
    invCall({ action: 'delete', id });
  };
  const setCur = (c) => {
    setCurrency(c);
    invCall({ action: 'currency', currency: c });
  };
  const addNote = async (note) => {
    const { data } = await invCall({ action: 'note-add', note });
    if (data?.note) setPnotes((prev) => [data.note, ...prev]);
  };
  const delNote = (id) => {
    setPnotes((prev) => prev.filter((n) => n.id !== id));
    invCall({ action: 'note-delete', id });
  };

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

  const frame = 'rounded-xl border border-zinc-800 bg-zinc-900/40 p-4';
  const frameHeading = 'flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header bar (full width) */}
      <div className="border-b border-zinc-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 mb-0.5">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Player View</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">{campaign?.name || 'Campaign'}</h1>
          {campaign?.setting && <p className="text-sm text-zinc-500 mt-0.5">{campaign.setting}</p>}
        </div>
      </div>

      {/* Map on the left, everything else in frames on the right */}
      <div className={cn('max-w-7xl mx-auto p-4 sm:p-6', hasMap && 'lg:grid lg:grid-cols-[1.5fr_1fr] lg:gap-6 lg:items-start')}>
        {/* LEFT — battle map (kept mounted so it can detect when a map goes live) */}
        <div className={cn('mb-6 lg:mb-0 lg:sticky lg:top-4', !hasMap && 'hidden')}>
          <PlayerBattleMap token={token} onHasMap={setHasMap} />
        </div>

        {/* RIGHT — stacked frames */}
        <div className="space-y-6 min-w-0">
          {/* Previously… */}
          {lastDebriefed?.previous_session_recap && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">Previously…</p>
              <p className="text-sm text-zinc-300 leading-relaxed italic">{lastDebriefed.previous_session_recap}</p>
            </div>
          )}

          {/* Revealed entities */}
          <div className={frame}>
            <div className={frameHeading}><Eye className="w-4 h-4 text-amber-400" /> Revealed</div>
            {types.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-3">
                <button onClick={() => setActiveType('all')}
                  className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors', activeType === 'all' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}>
                  All ({visible.length})
                </button>
                {types.map((type) => {
                  const meta = TYPE_META[type];
                  if (!meta) return null;
                  const count = visible.filter((e) => e.entity_type === type).length;
                  return (
                    <button key={type} onClick={() => setActiveType(type)}
                      className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors', activeType === type ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}>
                      {meta.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <Eye className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm font-medium mb-1">Nothing revealed yet</p>
                <p className="text-xs text-zinc-600">Entries appear here when the GM marks them “Players Know” or “Suspect”.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filtered.map((entity) => {
                  const meta = TYPE_META[entity.entity_type] || {};
                  const Icon = meta.icon || Eye;
                  const vis = VISIBILITY_LABELS[entity.visibility];
                  const VisIcon = vis?.icon;
                  return (
                    <button key={entity.id} onClick={() => setSelected(entity)}
                      className="text-left flex gap-3 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:border-amber-500/40 hover:bg-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', meta.bg)}>
                        <Icon className={cn('w-4 h-4', meta.accent)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{entity.name}</p>
                          {vis && VisIcon && (
                            <span className={cn('flex items-center gap-0.5 text-[10px] font-medium flex-shrink-0', vis.color)}>
                              <VisIcon className="w-2.5 h-2.5" /> {vis.label}
                            </span>
                          )}
                        </div>
                        {entity.summary && <p className="text-xs text-zinc-500 line-clamp-2 leading-snug">{entity.summary}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Party Inventory */}
          <div className={frame}>
            <div className={frameHeading}><Backpack className="w-4 h-4 text-amber-400" /> Party Inventory</div>
            <PartyInventoryManager items={inv} currency={currency} onAdd={addItem} onUpdate={updItem} onDelete={delItem} onCurrency={setCur} />
          </div>

          {/* Party Notes */}
          <div className={frame}>
            <div className={frameHeading}><MessageSquare className="w-4 h-4 text-amber-400" /> Party Notes</div>
            <PartyNotes notes={pnotes} onAdd={addNote} onDelete={delNote} />
          </div>

          <div className="pt-2 text-center">
            <p className="text-xs text-zinc-600">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} played · {visible.length} revealed {visible.length !== 1 ? 'entries' : 'entry'}
            </p>
          </div>
        </div>
      </div>

      <PlayerEntityModal
        entity={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onAddToInventory={(e) => addItem({ name: e.name, quantity: 1 })}
      />
    </div>
  );
}
