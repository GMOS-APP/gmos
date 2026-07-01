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
  custom: {
    id: 'custom',
    label: 'Custom / Other',
    shortLabel: 'Custom',
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
