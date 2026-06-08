import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePageParams } from '@/lib/usePageParams';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BattleMap as BattleMapEntity, WorldEntity, UploadFile, Campaign } from '@/api/entities';
import { Plus, Upload, Grid3x3, Lock, Unlock, Eye, Trash2, Users, Loader2, Swords, Link2, Check, Share2 } from 'lucide-react';
import TokenLayer from '@/components/map/TokenLayer';
import { useBattleMapChannel } from '@/lib/useBattleMapChannel';
import { getEntityColors } from '@/lib/entityColors';

const TYPE_HEX = { player_character: '#22d3ee', npc: '#a78bfa', creature: '#f87171' };
const KIND_OF = { player_character: 'pc', npc: 'npc', creature: 'monster' };
const newId = () => `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export default function BattleMap() {
  const params = usePageParams();
  const campaignId = params.get('campaign_id') || params.get('id');
  const qc = useQueryClient();

  const [mapId, setMapId] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  const draggingRef = useRef(null);
  const lastCols = useRef(12); // remembered grid size for the on/off toggle

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (d) => d?.[0],
  });
  const shareUrl = campaign?.player_share_token
    ? `${window.location.origin}${import.meta.env.BASE_URL}player-view/public?token=${campaign.player_share_token}`
    : null;
  const copyLink = async () => {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard blocked */ }
  };
  const enableShare = async () => {
    await Campaign.update(campaignId, { is_shared: true });
    qc.invalidateQueries({ queryKey: ['campaign', campaignId] });
  };

  const { data: maps = [] } = useQuery({
    queryKey: ['battle-maps', campaignId],
    queryFn: () => BattleMapEntity.filter({ campaign_id: campaignId }, '-updated_date'),
    enabled: !!campaignId,
  });
  const { data: entities = [] } = useQuery({
    queryKey: ['battle-entities', campaignId],
    queryFn: () => WorldEntity.filter({ campaign_id: campaignId }, 'name', 300),
    enabled: !!campaignId && showAdd,
  });

  const map = useMemo(() => maps.find((m) => m.id === mapId) || null, [maps, mapId]);

  // Default to the active map (or the most recent) once maps load.
  useEffect(() => {
    if (!mapId && maps.length) setMapId((maps.find((m) => m.active) || maps[0]).id);
  }, [maps, mapId]);

  // Sync working tokens from the selected map (resets on structural refetches).
  useEffect(() => { setTokens(map?.tokens || []); }, [mapId, map?.updated_date]); // eslint-disable-line

  const channel = useBattleMapChannel(mapId, (msg) => {
    if (msg.type === 'move') {
      setTokens((prev) => prev.map((t) => (t.id === msg.tokenId ? { ...t, x: msg.x, y: msg.y } : t)));
    } else if (msg.type === 'db') {
      if (!Array.isArray(msg.tokens)) return;
      setTokens((prev) => {
        const id = draggingRef.current;
        if (!id) return msg.tokens;
        const cur = prev.find((t) => t.id === id);
        return msg.tokens.map((t) => (t.id === id && cur ? { ...t, x: cur.x, y: cur.y } : t));
      });
    } else if (msg.type === 'sync') {
      qc.invalidateQueries({ queryKey: ['battle-maps', campaignId] });
    }
  });

  const persistTokens = (next) => { if (mapId) BattleMapEntity.update(mapId, { tokens: next }).catch(() => {}); };
  const patchMap = async (patch) => {
    if (!mapId) return;
    await BattleMapEntity.update(mapId, patch);
    qc.invalidateQueries({ queryKey: ['battle-maps', campaignId] });
    channel.sendSync();
  };

  // ── Token movement ─────────────────────────────────────────────────────────
  const onMoveLive = (id, x, y) => {
    draggingRef.current = id;
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
    channel.sendMove(id, x, y);
  };
  const onMoveEnd = (id, x, y) => {
    draggingRef.current = null;
    const next = tokensRef.current.map((t) => (t.id === id ? { ...t, x, y } : t));
    setTokens(next);
    channel.sendMove(id, x, y);
    persistTokens(next);
  };

  const addToken = (tok) => {
    const next = [...tokensRef.current, tok];
    setTokens(next);
    persistTokens(next);
    channel.sendSync();
  };
  const addEntityToken = (e) => addToken({
    id: newId(), label: e.name, x: 50, y: 50,
    color: TYPE_HEX[e.entity_type] || '#f59e0b',
    image_url: e.image_url || null, kind: KIND_OF[e.entity_type] || 'npc',
  });
  const addBlank = () => addToken({ id: newId(), label: 'Token', x: 50, y: 50, color: '#f59e0b', image_url: null, kind: 'object' });
  const importParty = () => {
    const pcs = entities.filter((e) => e.entity_type === 'player_character');
    if (!pcs.length) return;
    const next = [...tokensRef.current, ...pcs.map((e, i) => ({
      id: newId(), label: e.name, x: 20 + (i % 5) * 12, y: 80,
      color: TYPE_HEX.player_character, image_url: e.image_url || null, kind: 'pc',
    }))];
    setTokens(next); persistTokens(next); channel.sendSync();
  };
  const removeToken = (id) => {
    const next = tokensRef.current.filter((t) => t.id !== id);
    setTokens(next); setSelectedToken(null); persistTokens(next); channel.sendSync();
  };

  // ── Map management ──────────────────────────────────────────────────────────
  const createMap = async () => {
    const created = await BattleMapEntity.create({ campaign_id: campaignId, name: 'Battle Map', tokens: [] });
    qc.invalidateQueries({ queryKey: ['battle-maps', campaignId] });
    setMapId(created.id);
  };
  const onUpload = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !mapId) return;
    setUploading(true);
    try { const { file_url } = await UploadFile({ file }); await patchMap({ image_url: file_url }); }
    catch (err) { alert(err?.message || 'Upload failed'); } finally { setUploading(false); }
  };
  const setActive = async () => {
    await Promise.all(maps.filter((m) => m.active && m.id !== mapId).map((m) => BattleMapEntity.update(m.id, { active: false })));
    await patchMap({ active: true });
  };

  if (!campaignId) return <div className="p-6 text-sm text-zinc-500">No campaign.</div>;

  return (
    <div className="min-h-full p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-5 h-5 text-amber-500" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Battle Map</h1>
        <span className="text-xs text-zinc-500 hidden sm:inline">live shared board</span>
      </div>

      {/* Map selector */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={mapId || ''}
          onChange={(e) => setMapId(e.target.value)}
          className="text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2 py-1.5"
        >
          {maps.length === 0 && <option value="">No maps yet</option>}
          {maps.map((m) => <option key={m.id} value={m.id}>{m.name}{m.active ? ' • live' : ''}</option>)}
        </select>
        <button onClick={createMap} className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Plus className="w-4 h-4" /> New map
        </button>
      </div>

      {map ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Background
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />

            <button
              onClick={() => patchMap({ grid_cols: map.grid_cols > 0 ? 0 : (lastCols.current || 12) })}
              className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border ${map.grid_cols > 0 ? 'border-amber-500/50 text-amber-600 dark:text-amber-400' : 'border-zinc-300 dark:border-zinc-700'} hover:bg-zinc-100 dark:hover:bg-zinc-800`}>
              <Grid3x3 className="w-4 h-4" /> Grid {map.grid_cols > 0 ? 'on' : 'off'}
            </button>
            {map.grid_cols > 0 && (
              <input type="number" min={2} max={40} value={map.grid_cols}
                title="Grid columns"
                onChange={(e) => { const n = Math.max(2, Math.min(40, parseInt(e.target.value, 10) || 12)); lastCols.current = n; patchMap({ grid_cols: n }); }}
                className="w-14 text-center text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1 py-1.5" />
            )}

            <button onClick={() => patchMap({ locked: !map.locked })}
              className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border ${map.locked ? 'border-amber-500/50 text-amber-600 dark:text-amber-400' : 'border-zinc-300 dark:border-zinc-700'} hover:bg-zinc-100 dark:hover:bg-zinc-800`}>
              {map.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />} {map.locked ? 'Locked' : 'Lock board'}
            </button>

            <button onClick={setActive} disabled={map.active}
              className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md ${map.active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'} disabled:cursor-default`}>
              <Eye className="w-4 h-4" /> {map.active ? 'Live to players' : 'Show to players'}
            </button>

            {campaign && (campaign.is_shared && shareUrl ? (
              <button onClick={copyLink}
                className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />} {copied ? 'Copied!' : 'Copy player link'}
              </button>
            ) : (
              <button onClick={enableShare}
                className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Share2 className="w-4 h-4" /> Share with players
              </button>
            ))}
          </div>

          {/* Token palette */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button onClick={addBlank} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Plus className="w-3.5 h-3.5" /> Token</button>
            <button onClick={importParty} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Users className="w-3.5 h-3.5" /> Import party</button>
            <button onClick={() => setShowAdd((v) => !v)} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"><Plus className="w-3.5 h-3.5" /> From entity</button>
            {selectedToken && (
              <button onClick={() => removeToken(selectedToken)} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /> Remove token</button>
            )}
          </div>

          {showAdd && (
            <div className="mb-3 max-h-40 overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 p-2 flex flex-wrap gap-1.5">
              {entities.filter((e) => ['player_character', 'npc', 'creature'].includes(e.entity_type)).map((e) => {
                const c = getEntityColors(e.entity_type);
                return (
                  <button key={e.id} onClick={() => addEntityToken(e)}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} /> {e.name}
                  </button>
                );
              })}
              {entities.length === 0 && <span className="text-xs text-zinc-500 px-1">No PCs/NPCs/creatures yet.</span>}
            </div>
          )}

          {/* The board */}
          <TokenLayer
            imageUrl={map.image_url}
            gridCols={map.grid_cols || 0}
            tokens={tokens}
            canMove
            selectedId={selectedToken}
            onSelect={setSelectedToken}
            onMoveLive={onMoveLive}
            onMoveEnd={onMoveEnd}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Drag tokens to move them. {map.active ? 'Players viewing the share link see this board live.' : 'Click “Show to players” to make it the live board.'}
          </p>
        </>
      ) : (
        <div className="text-center py-16 text-sm text-zinc-500">
          <p className="mb-3">No battle maps yet.</p>
          <button onClick={createMap} className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium">Create your first map</button>
        </div>
      )}
    </div>
  );
}
