import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shapes, Box, Rocket, Ship, Plane, Car, Radio, Cpu, Bot, Satellite,
  Skull, Ghost, Bug, Zap, Flame, Snowflake, Droplet, Leaf, Trees, Mountain,
  Waves, Sun, Moon, Star, Sparkles, Gem, Crown, Key, Lock, Scroll,
  BookOpen, Map, MapPin, Compass, Flag, Shield, Swords, Target, Crosshair, Users,
  User, Heart, Brain, Eye, Wrench, Cog, Coins, Package, FlaskConical, Dna,
  Atom, Globe, Building2, Castle, Tent, Anchor, Feather, Wand2, Dices, Puzzle,
  Music, Church, ShoppingBag, Waypoints,
} from 'lucide-react';
import { EntityType, Campaign } from '@/api/entities';
import { ENTITY_TYPE_META, setCustomTypeRegistry } from './entityColors';
import { getSystem } from './systems';
import { SYSTEM_PACKS } from './systemPacks';

// ── Color presets ───────────────────────────────────────────────────────────
// Fixed palette for custom types. Class strings are written out LITERALLY so
// Tailwind's purge keeps them — a dynamic `bg-${color}-500` would be dropped
// (same gotcha as the TE-theme classes; see CLAUDE.md). Shape mirrors an
// ENTITY_TYPE_META entry so custom types drop straight into getEntityColors().
export const COLOR_PRESETS = {
  slate:   { text: 'text-slate-400',   dot: 'bg-slate-400',   bg: 'bg-slate-500/10',   tag: 'bg-slate-500/15 text-slate-400 border-slate-500/30',     badge: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20' },
  red:     { text: 'text-red-400',     dot: 'bg-red-400',     bg: 'bg-red-500/10',     tag: 'bg-red-500/15 text-red-400 border-red-500/30',           badge: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' },
  orange:  { text: 'text-orange-400',  dot: 'bg-orange-400',  bg: 'bg-orange-500/10',  tag: 'bg-orange-500/15 text-orange-400 border-orange-500/30',   badge: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' },
  amber:   { text: 'text-amber-400',   dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   tag: 'bg-amber-500/15 text-amber-400 border-amber-500/30',     badge: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
  yellow:  { text: 'text-yellow-400',  dot: 'bg-yellow-400',  bg: 'bg-yellow-500/10',  tag: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',   badge: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20' },
  lime:    { text: 'text-lime-400',    dot: 'bg-lime-400',    bg: 'bg-lime-500/10',    tag: 'bg-lime-500/15 text-lime-400 border-lime-500/30',         badge: 'text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-500/10 border-lime-200 dark:border-lime-500/20' },
  green:   { text: 'text-green-400',   dot: 'bg-green-400',   bg: 'bg-green-500/10',   tag: 'bg-green-500/15 text-green-400 border-green-500/30',     badge: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' },
  emerald: { text: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', tag: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', badge: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
  teal:    { text: 'text-teal-400',    dot: 'bg-teal-400',    bg: 'bg-teal-500/10',    tag: 'bg-teal-500/15 text-teal-400 border-teal-500/30',         badge: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20' },
  cyan:    { text: 'text-cyan-400',    dot: 'bg-cyan-400',    bg: 'bg-cyan-500/10',    tag: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',         badge: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20' },
  sky:     { text: 'text-sky-400',     dot: 'bg-sky-400',     bg: 'bg-sky-500/10',     tag: 'bg-sky-500/15 text-sky-400 border-sky-500/30',           badge: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20' },
  blue:    { text: 'text-blue-400',    dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    tag: 'bg-blue-500/15 text-blue-400 border-blue-500/30',         badge: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  indigo:  { text: 'text-indigo-400',  dot: 'bg-indigo-400',  bg: 'bg-indigo-500/10',  tag: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',   badge: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' },
  violet:  { text: 'text-violet-400',  dot: 'bg-violet-400',  bg: 'bg-violet-500/10',  tag: 'bg-violet-500/15 text-violet-400 border-violet-500/30',   badge: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20' },
  purple:  { text: 'text-purple-400',  dot: 'bg-purple-400',  bg: 'bg-purple-500/10',  tag: 'bg-purple-500/15 text-purple-400 border-purple-500/30',   badge: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
  fuchsia: { text: 'text-fuchsia-400', dot: 'bg-fuchsia-400', bg: 'bg-fuchsia-500/10', tag: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30', badge: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/20' },
  pink:    { text: 'text-pink-400',    dot: 'bg-pink-400',    bg: 'bg-pink-500/10',    tag: 'bg-pink-500/15 text-pink-400 border-pink-500/30',         badge: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20' },
  rose:    { text: 'text-rose-400',    dot: 'bg-rose-400',    bg: 'bg-rose-500/10',    tag: 'bg-rose-500/15 text-rose-400 border-rose-500/30',         badge: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' },
};

export const COLOR_PRESET_KEYS = Object.keys(COLOR_PRESETS);

// ── Icon options ─────────────────────────────────────────────────────────────
// Curated lucide set for the custom-type icon picker + resolving a stored name.
export const ICON_OPTIONS = {
  Shapes, Box, Rocket, Ship, Plane, Car, Radio, Cpu, Bot, Satellite,
  Skull, Ghost, Bug, Zap, Flame, Snowflake, Droplet, Leaf, Trees, Mountain,
  Waves, Sun, Moon, Star, Sparkles, Gem, Crown, Key, Lock, Scroll,
  BookOpen, Map, MapPin, Compass, Flag, Shield, Swords, Target, Crosshair, Users,
  User, Heart, Brain, Eye, Wrench, Cog, Coins, Package, FlaskConical, Dna,
  Atom, Globe, Building2, Castle, Tent, Anchor, Feather, Wand2, Dices, Puzzle,
  Music, Church, ShoppingBag, Waypoints,
};

export const ICON_OPTION_NAMES = Object.keys(ICON_OPTIONS);

export const resolveIcon = (name) => ICON_OPTIONS[name] || Shapes;

// ── Built-in types ───────────────────────────────────────────────────────────
// Per-key metadata that isn't in ENTITY_TYPE_META: singular label, sidebar
// group, and player visibility (mirrors functions/playerView.ts PLAYER_TYPES).
const BUILTIN_CONFIG = [
  { key: 'player_character', labelSingular: 'PC',        group: 'Characters', playerVisible: false },
  { key: 'npc',              labelSingular: 'NPC',       group: 'Characters', playerVisible: true },
  { key: 'deity',            labelSingular: 'Deity',     group: 'Characters', playerVisible: true },
  { key: 'location',         labelSingular: 'Location',  group: 'Places',     playerVisible: true },
  { key: 'shop',             labelSingular: 'Shop',      group: 'Places',     playerVisible: false },
  { key: 'thread',           labelSingular: 'Thread',    group: 'Story',      playerVisible: true },
  { key: 'event',            labelSingular: 'Event',     group: 'Story',      playerVisible: true },
  { key: 'faction',          labelSingular: 'Faction',   group: 'Story',      playerVisible: true },
  { key: 'lore',             labelSingular: 'Lore',      group: 'Story',      playerVisible: true },
  { key: 'creature',         labelSingular: 'Creature',  group: 'Combat',     playerVisible: false },
  { key: 'encounter',        labelSingular: 'Encounter', group: 'Combat',     playerVisible: false },
  { key: 'item',             labelSingular: 'Item',      group: 'Combat',     playerVisible: true },
];

export const BUILTIN_TYPES = BUILTIN_CONFIG.map((c) => ({
  ...ENTITY_TYPE_META[c.key],
  key: c.key,
  labelSingular: c.labelSingular,
  group: c.group,
  playerVisible: c.playerVisible,
  builtin: true,      // D&D built-in — has a bespoke edit component / stat block
  source: 'system',   // provided by the campaign's game system (governed by enabled list)
  fields: null,
}));

export const BUILTIN_TYPE_KEYS = BUILTIN_TYPES.map((t) => t.key);

// Build a getEntityColors-compatible meta object from a stored custom-type row.
export function buildCustomMeta(row) {
  return {
    ...(COLOR_PRESETS[row.color] || COLOR_PRESETS.slate),
    key: row.key,
    label: row.label,
    labelSingular: row.label_singular || row.label,
    Icon: resolveIcon(row.icon),
    group: row.group_label || 'Custom',
    playerVisible: !!row.player_visible,
    builtin: false,
    source: 'custom',  // account-defined — available in every campaign unless disabled there
    fields: Array.isArray(row.fields) ? row.fields : [],
  };
}

// Build meta from a code-defined system-pack type (systemPacks.js). Schema-driven
// like custom types, but provided by the game system (governed by enabled list).
export function buildPackMeta(t) {
  return {
    ...(COLOR_PRESETS[t.color] || COLOR_PRESETS.slate),
    key: t.key,
    label: t.label,
    labelSingular: t.labelSingular || t.label,
    Icon: resolveIcon(t.icon),
    group: t.group || 'Entities',
    playerVisible: !!t.playerVisible,
    builtin: false,
    source: 'system',
    fields: Array.isArray(t.fields) ? t.fields : [],
  };
}

// The entity types a system provides out of the box (before per-campaign edits):
// the D&D built-ins for dnd5e/pf2e, or the system's pack otherwise.
export function systemTypeMetas(system) {
  const pack = system?.packId && SYSTEM_PACKS[system.packId];
  return pack ? pack.map(buildPackMeta) : BUILTIN_TYPES;
}

export const systemDefaultTypeKeys = (system) => systemTypeMetas(system).map((t) => t.key);

/**
 * Account custom types + built-ins, filtered to a campaign's enabled set.
 * Every entity-type enumeration in the app should read from this so the system
 * preset and per-campaign toggles apply uniformly.
 *
 * @param {{ enabled_entity_types?: string[] }} [campaign]
 * @returns {{ types, allTypes, byKey, customTypes, playerVisibleTypes, enabledKeys, isLoading }}
 */
export function useEntityTypes(campaign) {
  const { data: customRows = [], isLoading } = useQuery({
    queryKey: ['entity-types'],
    queryFn: () => EntityType.list('sort_order'),
    staleTime: 60_000,
  });

  // Account custom types are available in every campaign (subject to the
  // per-campaign OFF switch applied below).
  const customTypes = useMemo(() => customRows.map(buildCustomMeta), [customRows]);

  // The campaign's game system provides its base type set (D&D built-ins, or a
  // pack). getSystem falls back to 5e for legacy/unknown.
  const systemTypes = useMemo(() => systemTypeMetas(getSystem(campaign)), [campaign?.system]);

  // Publish system + custom meta so synchronous getEntityColors() call sites
  // resolve pack and custom types (built-ins are already in ENTITY_TYPE_META).
  useEffect(() => {
    const map = {};
    for (const t of [...systemTypes, ...customTypes]) map[t.key] = t;
    setCustomTypeRegistry(map);
  }, [systemTypes, customTypes]);

  // The per-campaign list governs which SYSTEM types are shown (explicit list
  // when set, else the system's full set). Account custom types are ALWAYS
  // available — a type you created should never be un-pickable.
  const enabledSystem = Array.isArray(campaign?.enabled_entity_types)
    ? campaign.enabled_entity_types
    : systemTypes.map((t) => t.key);
  // Custom types are ON by default; keys here are switched OFF for this campaign.
  const disabledCustom = Array.isArray(campaign?.disabled_entity_types)
    ? campaign.disabled_entity_types
    : [];

  return useMemo(() => {
    const allTypes = [...systemTypes, ...customTypes];
    const byKey = Object.fromEntries(allTypes.map((t) => [t.key, t]));
    const types = allTypes.filter((t) => (
      t.source === 'custom' ? !disabledCustom.includes(t.key) : enabledSystem.includes(t.key)
    ));
    const playerVisibleTypes = types.filter((t) => t.playerVisible);
    return { types, allTypes, byKey, systemTypes, customTypes, playerVisibleTypes, enabledKeys: enabledSystem, disabledCustom, isLoading };
  }, [systemTypes, customTypes, enabledSystem.join(','), disabledCustom.join(','), isLoading]);
}

/**
 * Same as useEntityTypes but for callers that only have a campaign id. Reuses
 * the ['campaign', id] query the Layout already populates (cache hit — no extra
 * fetch) so the campaign's enabled_entity_types drive the result.
 */
export function useCampaignEntityTypes(campaignId) {
  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (d) => d?.[0],
  });
  return useEntityTypes(campaign);
}
