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
    ch.on('broadcast', { event: 'move' }, (p) => cb.current?.({ type: 'move', ...p.payload }));
    ch.on('broadcast', { event: 'sync' }, (p) => cb.current?.({ type: 'sync', ...p.payload }));
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
