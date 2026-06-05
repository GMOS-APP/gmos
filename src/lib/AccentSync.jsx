import { useEffect } from 'react';
import { Setting } from '@/api/entities';
import { setAccentCached } from '@/lib/theme';

// Fetches the global brand accent (public read) and applies it app-wide,
// caching it so the next load applies instantly (before paint) via initAccent.
export default function AccentSync() {
  useEffect(() => {
    Setting.filter({ id: 'global' })
      .then((rows) => setAccentCached(rows?.[0]?.accent || null))
      .catch(() => { /* keep cached/default */ });
  }, []);
  return null;
}
