// Thin wrapper over Vercel Analytics custom events. No-ops safely when not
// running on Vercel (e.g. local dev or GitHub Pages), so call sites stay clean.
import { track as vercelTrack } from '@vercel/analytics';

export function track(event, props) {
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics must never break the app */
  }
}
