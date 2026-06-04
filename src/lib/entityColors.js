import {
  Users, Swords, MapPin, Shield, Waypoints, Package, Sparkles,
  Scroll, BookOpen, Church, Flame, ShoppingBag, StickyNote,
} from 'lucide-react';

// Single source of truth for entity-type presentation (color + icon + label).
// Import getEntityColors / ENTITY_TYPE_META — never re-define a local type map,
// or the views drift out of sync (which they did before this was centralized).
//
// Per type:
//   label  — plural display label (category headers, dashboard tiles)
//   Icon   — lucide icon component
//   text   — icon/accent text color   (text-{c}-400)
//   dot    — dot/fill color            (bg-{c}-400)
//   bg     — soft icon-container bg    (bg-{c}-500/10)
//   tag    — solid badge: bg+text+border (bg-{c}-500/15 …)
//   badge  — full light+dark chip classes
// Class strings are written out literally so Tailwind doesn't purge them.

export const ENTITY_TYPE_META = {
  npc: {
    label: 'NPCs', Icon: Users,
    text: 'text-violet-400', dot: 'bg-violet-400', bg: 'bg-violet-500/10',
    tag: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    badge: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20',
  },
  creature: {
    label: 'Creatures', Icon: Swords,
    text: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10',
    tag: 'bg-red-500/15 text-red-400 border-red-500/30',
    badge: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  },
  location: {
    label: 'Locations', Icon: MapPin,
    text: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10',
    tag: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    badge: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  },
  faction: {
    label: 'Factions', Icon: Shield,
    text: 'text-rose-400', dot: 'bg-rose-400', bg: 'bg-rose-500/10',
    tag: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    badge: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
  },
  player_character: {
    label: 'PCs', Icon: Sparkles,
    text: 'text-cyan-400', dot: 'bg-cyan-400', bg: 'bg-cyan-500/10',
    tag: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    badge: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
  },
  item: {
    label: 'Items', Icon: Package,
    text: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-500/10',
    tag: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    badge: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  },
  event: {
    label: 'Events', Icon: Scroll,
    text: 'text-pink-400', dot: 'bg-pink-400', bg: 'bg-pink-500/10',
    tag: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    badge: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20',
  },
  lore: {
    label: 'Lore', Icon: BookOpen,
    text: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-500/10',
    tag: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    badge: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  },
  deity: {
    label: 'Deities', Icon: Church,
    text: 'text-yellow-400', dot: 'bg-yellow-400', bg: 'bg-yellow-500/10',
    tag: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    badge: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20',
  },
  encounter: {
    label: 'Encounters', Icon: Flame,
    text: 'text-fuchsia-400', dot: 'bg-fuchsia-400', bg: 'bg-fuchsia-500/10',
    tag: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
    badge: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20',
  },
  shop: {
    label: 'Shops', Icon: ShoppingBag,
    text: 'text-teal-400', dot: 'bg-teal-400', bg: 'bg-teal-500/10',
    tag: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    badge: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20',
  },
  thread: {
    label: 'Threads', Icon: Waypoints,
    text: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-500/10',
    tag: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    badge: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  },
  note: {
    label: 'Notes', Icon: StickyNote,
    text: 'text-zinc-400', dot: 'bg-zinc-400', bg: 'bg-zinc-500/10',
    tag: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    badge: 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-500/20',
  },
};

// Back-compat alias (older imports use ENTITY_TYPE_COLORS).
export const ENTITY_TYPE_COLORS = ENTITY_TYPE_META;

export const getEntityColors = (type) => ENTITY_TYPE_META[type] ?? ENTITY_TYPE_META.npc;
