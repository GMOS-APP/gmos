import { useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';

// Joins a per-map Supabase Realtime broadcast channel for live token movement.
// Works for both the GM (authed) and players (anon key) — broadcast doesn't
// touch RLS. `onMessage({type, ...})` fires for moves/syncs from OTHER clients.
// Returns throttled senders. Channel is left on unmount or when mapId changes.
export function useBattleMapChannel(mapId, onMessage) {
  const cb = useRef(onMessage);
  cb.current = onMessage;
  const chan = useRef(null);

  useEffect(() => {
    if (!mapId) return undefined;
    const ch = supabase.channel(`battlemap:${mapId}`, { config: { broadcast: { self: false } } });
    // Broadcast = smooth in-flight motion (best effort).
    ch.on('broadcast', { event: 'move' }, (p) => cb.current?.({ type: 'move', ...p.payload }));
    ch.on('broadcast', { event: 'sync' }, (p) => cb.current?.({ type: 'sync', ...p.payload }));
    // Postgres changes = reliable source of truth: every persisted drop (GM or
    // player) updates the row, so all clients converge even if broadcast misses.
    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_maps', filter: `id=eq.${mapId}` },
      (p) => cb.current?.({ type: 'db', tokens: p.new?.tokens, locked: p.new?.locked, grid_cols: p.new?.grid_cols, image_url: p.new?.image_url }));
    ch.subscribe();
    chan.current = ch;
    return () => { supabase.removeChannel(ch); chan.current = null; };
  }, [mapId]);

  const send = (event, payload) => { chan.current?.send({ type: 'broadcast', event, payload }); };
  return {
    sendMove: (tokenId, x, y) => send('move', { tokenId, x, y }),
    sendSync: () => send('sync', {}),
  };
}
