// Centralized entity type → color mapping.
// Import getEntityColors or ENTITY_TYPE_COLORS instead of defining local typeColors objects.
//
// .text    — dark-mode icon/text color (text-{color}-400)
// .dot     — dark-mode dot/fill color  (bg-{color}-400)
// .badge   — full light+dark badge/chip classes (text + bg + border)

export const ENTITY_TYPE_COLORS = {
  npc: {
    text: 'text-violet-400',
    dot: 'bg-violet-400',
    badge: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20',
  },
  creature: {
    text: 'text-red-400',
    dot: 'bg-red-400',
    badge: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  },
  location: {
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    badge: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  },
  faction: {
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    badge: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
  },
  player_character: {
    text: 'text-cyan-400',
    dot: 'bg-cyan-400',
    badge: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
  },
  item: {
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    badge: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  },
  event: {
    text: 'text-pink-400',
    dot: 'bg-pink-400',
    badge: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20',
  },
  lore: {
    text: 'text-orange-400',
    dot: 'bg-orange-400',
    badge: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  },
  deity: {
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
    badge: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20',
  },
  encounter: {
    text: 'text-fuchsia-400',
    dot: 'bg-fuchsia-400',
    badge: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20',
  },
  shop: {
    text: 'text-teal-400',
    dot: 'bg-teal-400',
    badge: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
  },
  thread: {
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    badge: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  },
};

export const getEntityColors = (type) =>
  ENTITY_TYPE_COLORS[type] ?? ENTITY_TYPE_COLORS.npc;
