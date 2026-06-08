import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Swords } from 'lucide-react';
import TokenLayer from './TokenLayer';
import { useBattleMapChannel } from '@/lib/useBattleMapChannel';

// Player-facing battle map for the public share link. Loads the active map via
// the token-gated `battle-map` edge function, shows live token movement over a
// Realtime broadcast channel, and lets players drag tokens (unless locked),
// persisting drops through the same function.
export default function PlayerBattleMap({ token, onHasMap }) {
  const [map, setMap] = useState(null);
  const [tokens, setTokens] = useState([]);
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

  const channel = useBattleMapChannel(map?.id, (msg) => {
    if (msg.type === 'move') {
      setTokens((p) => p.map((t) => (t.id === msg.tokenId ? { ...t, x: msg.x, y: msg.y } : t)));
    } else if (msg.type === 'db') {
      if (Array.isArray(msg.tokens)) {
        setTokens((prev) => {
          const id = draggingRef.current;
          if (!id) return msg.tokens;
          const cur = prev.find((t) => t.id === id);
          return msg.tokens.map((t) => (t.id === id && cur ? { ...t, x: cur.x, y: cur.y } : t));
        });
      }
      setMap((m) => (m ? { ...m, locked: msg.locked, grid_cols: msg.grid_cols, image_url: msg.image_url } : m));
    } else if (msg.type === 'sync') {
      load();
    }
  });

  if (!map) return null;

  const onMoveLive = (id, x, y) => { draggingRef.current = id; setTokens((p) => p.map((t) => (t.id === id ? { ...t, x, y } : t))); channel.sendMove(id, x, y); };
  const onMoveEnd = (id, x, y) => {
    draggingRef.current = null;
    const next = tokensRef.current.map((t) => (t.id === id ? { ...t, x, y } : t));
    setTokens(next);
    channel.sendMove(id, x, y);
    supabase.functions.invoke('battle-map', { body: { token, action: 'move', mapId: map.id, tokenId: id, x, y } }).catch(() => {});
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-amber-400" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Battle Map {map.locked && <span className="text-zinc-600 normal-case tracking-normal">· locked by GM</span>}
        </h2>
      </div>
      <TokenLayer
        imageUrl={map.image_url}
        gridCols={map.grid_cols || 0}
        tokens={tokens}
        canMove={!map.locked}
        locked={map.locked}
        onMoveLive={onMoveLive}
        onMoveEnd={onMoveEnd}
        className="rounded-lg border border-zinc-800 overflow-hidden"
      />
      {!map.locked && <p className="mt-2 text-[11px] text-zinc-600">Drag tokens to move them — everyone sees it live.</p>}
    </div>
  );
}
