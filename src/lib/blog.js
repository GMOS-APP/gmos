// Shared helpers for the public blog (index + post pages + cards).

export const BLOG_SITE = 'https://gmos.app';

/** Human-friendly date, e.g. "June 26, 2026". */
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

/** Estimated read time in whole minutes from a markdown/plain body (~200 wpm). */
export function readingMinutes(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "5 min read" label; returns '' for empty bodies. */
export const readingLabel = (text) => {
  const w = (text || '').trim();
  return w ? `${readingMinutes(w)} min read` : '';
};

// Per-category accent. Uses the untouched categorical palettes (not the brand
// amber/zinc ramps), so each category reads as its own colour. Unknown
// categories hash deterministically into the same palette.
const ACCENTS = {
  sky: { text: 'text-sky-600 dark:text-sky-400', chip: 'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10', from: 'from-sky-500/25', to: 'to-sky-500/5' },
  violet: { text: 'text-violet-600 dark:text-violet-400', chip: 'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10', from: 'from-violet-500/25', to: 'to-violet-500/5' },
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', chip: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10', from: 'from-emerald-500/25', to: 'to-emerald-500/5' },
  rose: { text: 'text-rose-600 dark:text-rose-400', chip: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10', from: 'from-rose-500/25', to: 'to-rose-500/5' },
  cyan: { text: 'text-cyan-600 dark:text-cyan-400', chip: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10', from: 'from-cyan-500/25', to: 'to-cyan-500/5' },
  fuchsia: { text: 'text-fuchsia-600 dark:text-fuchsia-400', chip: 'border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10', from: 'from-fuchsia-500/25', to: 'to-fuchsia-500/5' },
};
const ACCENT_KEYS = Object.keys(ACCENTS);

// Stable, hand-picked accents for the known series; everything else hashes in.
const FIXED = {
  'Feature Spotlight': 'sky',
  'Running the Game': 'violet',
  'The First Three Sessions': 'emerald',
  'GM Tips': 'cyan',
  'Behind the Screen': 'rose',
};

export function categoryAccent(category) {
  if (!category) return ACCENTS.sky;
  if (FIXED[category]) return ACCENTS[FIXED[category]];
  let h = 0;
  for (let i = 0; i < category.length; i += 1) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return ACCENTS[ACCENT_KEYS[h % ACCENT_KEYS.length]];
}
