import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Swords } from 'lucide-react';
import TokenLayer from './TokenLayer';
import ZoomPan from './ZoomPan';
import { useBattleMapChannel } from '@/lib/useBattleMapChannel';
import AlphaBadge from '@/components/common/AlphaBadge';
import { cn } from '@/lib/utils';

// Player-facing battle map for the public share link. Loads the active map via
// the token-gated `battle-map` edge function, shows live token movement over a
// Realtime broadcast channel, and lets players drag tokens (unless locked),
// persisting drops through the same function. Fog of war renders opaque and
// hides fogged tokens; players can ping (double-click) and see the turn order.
export default function PlayerBattleMap({ token, onHasMap }) {
  const [map, setMap] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [pings, setPings] = useState([]);
  const tokensRef = useRef([]);
  tokensRef.current = tokens;
  const draggingRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await supabase.functions.invoke('battle-map', { body: { token, action: 'get' } });
      if (data && !data.error) { setMap(data.map || null); setTokens(data.map?.tokens || []); onHasMap?.(!!data.map); }
    } catch { /* non-fatal */ }
  };
  useEffect(() => { if (token) load(); }, [token]); // eslint-disable-line

  const addPing = (p) => {
    setPings((prev) => [...prev, p]);
    setTimeout(() => setPings((prev) => prev.filter((x) => x.id !== p.id)), 2200);
  };

  const channel = useBattleMapChannel(map?.id, (msg) => {
    if (msg.type === 'move') {
      setTokens((p) => p.map((t) => (t.id === msg.tokenId ? { ...t, x: msg.x, y: msg.y } : t)));
    } else if (msg.type === 'ping') {
      addPing(msg);
    } else if (msg.type === 'db') {
      if (Array.isArray(msg.tokens)) {
        setTokens((prev) => {
          const id = draggingRef.current;
          if (!id) return msg.tokens;
          const cur = prev.find((t) => t.id === id);
          return msg.tokens.map((t) => (t.id === id && cur ? { ...t, x: cur.x, y: cur.y } : t));
        });
      }
      setMap((m) => (m ? {
        ...m, locked: msg.locked, grid_cols: msg.grid_cols, image_url: msg.image_url,
        fog: msg.fog !== undefined ? msg.fog : m.fog,
        turn: msg.turn !== undefined ? msg.turn : m.turn,
      } : m));
    } else if (msg.type === 'sync') {
      load();
    }
  });

  if (!map) return null;

  const turn = map.turn || null;
  const activeTokenId = turn?.order?.[turn.active] || null;

  const onMoveLive = (id, x, y) => { draggingRef.current = id; setTokens((p) => p.map((t) => (t.id === id ? { ...t, x, y } : t))); channel.sendMove(id, x, y); };
  const onMoveEnd = (id, x, y) => {
    draggingRef.current = null;
    const next = tokensRef.current.map((t) => (t.id === id ? { ...t, x, y } : t));
    setTokens(next);
    channel.sendMove(id, x, y);
    supabase.functions.invoke('battle-map', { body: { token, action: 'move', mapId: map.id, tokenId: id, x, y } }).catch(() => {});
  };
  const onPing = (x, y) => {
    const p = { id: `p_${Date.now().toString(36)}`, x, y, color: '#22d3ee' };
    addPing(p);
    channel.sendPing(x, y, p.color);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-amber-400" />
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Battle Map <AlphaBadge />{map.locked && <span className="text-zinc-600 normal-case tracking-normal">· locked by GM</span>}
        </h2>
      </div>

      {/* Turn order (read-only) */}
      {turn?.order?.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 flex-shrink-0">Round {turn.round || 1}</span>
          {turn.order.map((id, i) => {
            const t = tokens.find((x) => x.id === id);
            if (!t) return null;
            const isUp = i === turn.active;
            return (
              <span key={id} className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs whitespace-nowrap border',
                isUp ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold' : 'border-zinc-800 text-zinc-500')}>
                <span className="w-2 h-2 rounded-full" style={{ background: t.color || '#f59e0b' }} />
                {t.label || 'Token'}
              </span>
            );
          })}
        </div>
      )}

      <ZoomPan className="border border-zinc-800 bg-black">
        <TokenLayer
          imageUrl={map.image_url}
          gridCols={map.grid_cols || 0}
          tokens={tokens}
          canMove={!map.locked}
          locked={map.locked}
          onMoveLive={onMoveLive}
          onMoveEnd={onMoveEnd}
          fog={map.fog}
          fogMode="player"
          pings={pings}
          onPing={onPing}
          activeTokenId={activeTokenId}
        />
      </ZoomPan>
      <p className="mt-2 text-[11px] text-zinc-600">
        Scroll / pinch to zoom · drag the map to pan · double-click to ping{!map.locked && ' · drag tokens to move them — everyone sees it live'}.
      </p>
    </div>
  );
}
