// GM/OS supports multiple game systems. The system config is the single source
// of truth so stat blocks, SRD / D&D Beyond import, ability scores, and field
// labels stay system-aware. A campaign's `system` column selects which config
// applies; getSystem(campaign) resolves it (defaulting to 5e for legacy rows).
//
// D&D 5e keeps every mechanic; `custom` is fully system-agnostic — no ability
// scores, no CR/XP, no SRD import — so a sci-fi / homebrew game isn't forced
// into 5e assumptions. Adding another preset is just another entry here.
export const SYSTEMS = {
  dnd5e: {
    id: 'dnd5e',
    label: 'D&D 5e',
    shortLabel: 'D&D 5e',
    tagline: 'Stat blocks, CR, SRD import',
    promptName: 'Dungeons & Dragons 5th Edition',
    hasAbilityScores: true,
    hasXpCrSystem: true,
    hasSrdImport: true,
    hasDndBeyondImport: true,
    hasSrdConditions: true,
    locationTypes: ['City', 'Town', 'Village', 'Dungeon', 'Wilderness', 'Building', 'Ruins', 'Landmark', 'Region', 'Plane'],
    characterFields: { species: 'Race', role: 'Class', background: 'Background' },
    // Entity types seeded as "enabled" for new campaigns of this system.
    defaultEntityTypes: ['npc', 'creature', 'location', 'faction', 'player_character', 'item', 'event', 'lore', 'deity', 'encounter', 'shop', 'thread'],
  },
  // Pathfinder 2e is d20/6-abilities like 5e, so it reuses the built-in D&D
  // types (no pack) — only the character-field labels and flags differ.
  pf2e: {
    id: 'pf2e',
    label: 'Pathfinder 2e',
    shortLabel: 'PF2e',
    tagline: 'd20 fantasy · ability scores',
    promptName: 'Pathfinder Second Edition',
    hasAbilityScores: true,
    hasXpCrSystem: true,
    hasSrdImport: false,
    hasDndBeyondImport: false,
    hasSrdConditions: false,
    locationTypes: ['City', 'Town', 'Village', 'Dungeon', 'Wilderness', 'Building', 'Ruins', 'Landmark', 'Region', 'Plane'],
    characterFields: { species: 'Ancestry', role: 'Class', background: 'Background' },
    defaultEntityTypes: ['npc', 'creature', 'location', 'faction', 'player_character', 'item', 'event', 'lore', 'deity', 'encounter', 'shop', 'thread'],
  },
  // The remaining systems are fully schema-driven via SYSTEM_PACKS (systemPacks.js).
  coc: {
    id: 'coc', label: 'Call of Cthulhu 7e', shortLabel: 'CoC',
    tagline: 'Cosmic horror · investigation · Sanity',
    promptName: 'Call of Cthulhu 7th Edition',
    hasAbilityScores: false, hasXpCrSystem: false, hasSrdImport: false,
    hasDndBeyondImport: false, hasSrdConditions: false,
    locationTypes: ['City', 'Town', 'Building', 'Wilderness', 'Institution', 'Other'],
    characterFields: { species: 'Nationality', role: 'Occupation', background: 'Backstory' },
    packId: 'coc',
  },
  blades: {
    id: 'blades', label: 'Blades in the Dark', shortLabel: 'Blades',
    tagline: 'Industrial-fantasy heist crews',
    promptName: 'Blades in the Dark',
    hasAbilityScores: false, hasXpCrSystem: false, hasSrdImport: false,
    hasDndBeyondImport: false, hasSrdConditions: false,
    locationTypes: ['District', 'Building', 'Landmark', 'Other'],
    characterFields: { species: 'Heritage', role: 'Playbook', background: 'Background' },
    packId: 'blades',
  },
  vtm: {
    id: 'vtm', label: 'Vampire: The Masquerade V5', shortLabel: 'Vampire',
    tagline: 'Gothic-punk · clans · Hunger',
    promptName: 'Vampire: The Masquerade 5th Edition',
    hasAbilityScores: false, hasXpCrSystem: false, hasSrdImport: false,
    hasDndBeyondImport: false, hasSrdConditions: false,
    locationTypes: ['Domain', 'Elysium', 'Haven', 'Landmark', 'Other'],
    characterFields: { species: 'Clan', role: 'Predator Type', background: 'Background' },
    packId: 'vtm',
  },
  daggerheart: {
    id: 'daggerheart', label: 'Daggerheart', shortLabel: 'Daggerheart',
    tagline: 'Cinematic fantasy · Hope & Fear',
    promptName: 'Daggerheart',
    hasAbilityScores: false, hasXpCrSystem: false, hasSrdImport: false,
    hasDndBeyondImport: false, hasSrdConditions: false,
    locationTypes: ['Settlement', 'Wilderness', 'Landmark', 'Region', 'Other'],
    characterFields: { species: 'Ancestry', role: 'Class', background: 'Community' },
    packId: 'daggerheart',
  },
  custom: {
    id: 'custom',
    label: 'Custom / Other',
    shortLabel: 'Custom',
    tagline: 'System-agnostic · your own types',
    promptName: 'a custom tabletop RPG system',
    hasAbilityScores: false,
    hasXpCrSystem: false,
    hasSrdImport: false,
    hasDndBeyondImport: false,
    hasSrdConditions: false,
    locationTypes: ['Settlement', 'Structure', 'Wilderness', 'Landmark', 'Region', 'Other'],
    characterFields: { species: 'Species', role: 'Role', background: 'Background' },
    // Lean, system-neutral starter set; users add their own types on top.
    defaultEntityTypes: ['npc', 'player_character', 'location', 'faction', 'item', 'event', 'lore', 'thread'],
  },
};

export const DEFAULT_SYSTEM_ID = 'dnd5e';

// Resolve the system config for a campaign. Falls back to 5e for legacy
// campaigns (no `system`) or any unrecognized id.
export function getSystem(campaign) {
  const id = typeof campaign === 'string' ? campaign : campaign?.system;
  return SYSTEMS[id] || SYSTEMS[DEFAULT_SYSTEM_ID];
}
