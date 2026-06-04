// GM/OS is built for D&D 5e. The system config stays a single source of truth
// so stat blocks, SRD / D&D Beyond import, ability scores, and field labels stay
// 5e-aware — but there is no user-facing system selection. getSystem() always
// resolves to 5e (including for any legacy campaigns saved with another id).
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
  },
};

export const DEFAULT_SYSTEM_ID = 'dnd5e';

export function getSystem() {
  return SYSTEMS.dnd5e;
}
