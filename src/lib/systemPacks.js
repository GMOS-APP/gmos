// Preloaded entity-type "packs" for non-D&D game systems. PURE DATA (no React /
// no imports) so this file can be shared by the frontend registry and, later,
// the player-view edge function.
//
// Each type mirrors the custom-type schema shape:
//   { key, label, labelSingular, icon, color, group, playerVisible, fields:[
//       { key, label, kind, placement:'spec'|'section', gmOnly?, options?, placeholder? } ] }
// Keys are namespaced per system (coc_*, blades_*, vtm_*, dh_*) so they never
// collide with the D&D built-ins or a user's account custom types.
//
// D&D 5e and Pathfinder 2e do NOT have packs here — they use the built-in 12
// types (PF2e just relabels character fields); see systems.js.
//
// Field lists are grounded in each system's SRD / character sheet.
//
// KEEP IN SYNC: functions/playerView.ts holds a compact copy of the
// player-visible types (PACK_PLAYER_TYPES) for the public share link — update
// it when adding packs or changing a type's playerVisible flag.

const T = (key, label, kind, placement, extra = {}) => ({ key, label, kind, placement, ...extra });

// ── Call of Cthulhu 7e ───────────────────────────────────────────────────────
const CALL_OF_CTHULHU = [
  {
    key: 'coc_investigator', label: 'Investigators', labelSingular: 'Investigator',
    icon: 'User', color: 'green', group: 'Investigators', playerVisible: false,
    fields: [
      T('occupation', 'Occupation', 'text', 'spec'),
      T('age', 'Age', 'number', 'spec'),
      T('residence', 'Residence', 'text', 'spec'),
      T('birthplace', 'Birthplace', 'text', 'spec'),
      T('str', 'STR', 'number', 'spec'), T('con', 'CON', 'number', 'spec'),
      T('siz', 'SIZ', 'number', 'spec'), T('dex', 'DEX', 'number', 'spec'),
      T('app', 'APP', 'number', 'spec'), T('int', 'INT', 'number', 'spec'),
      T('pow', 'POW', 'number', 'spec'), T('edu', 'EDU', 'number', 'spec'),
      T('hp', 'HP', 'number', 'spec', { placeholder: 'Hit Points' }),
      T('sanity', 'Sanity', 'number', 'spec'),
      T('luck', 'Luck', 'number', 'spec'),
      T('mp', 'MP', 'number', 'spec', { placeholder: 'Magic Points' }),
      T('skills', 'Skills', 'textarea', 'section', { placeholder: 'Skill: value — one per line' }),
      T('weapons', 'Combat & Weapons', 'textarea', 'section'),
      T('backstory', 'Backstory', 'textarea', 'section', { placeholder: 'Description, ideology, significant people, treasured possessions' }),
      T('gear', 'Gear & Possessions', 'textarea', 'section'),
      T('wounds', 'Wounds & Madness', 'textarea', 'section', { placeholder: 'Injuries, phobias, manias, conditions' }),
    ],
  },
  {
    key: 'coc_npc', label: 'NPCs', labelSingular: 'NPC',
    icon: 'Users', color: 'violet', group: 'Cast', playerVisible: true,
    fields: [
      T('role', 'Role', 'text', 'spec'),
      T('occupation', 'Occupation', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('motives', 'Motives', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'coc_entity', label: 'Mythos Entities', labelSingular: 'Mythos Entity',
    icon: 'Ghost', color: 'purple', group: 'Mythos', playerVisible: false,
    fields: [
      T('category', 'Category', 'text', 'spec', { placeholder: 'Monster, Deity, Alien…' }),
      T('str', 'STR', 'number', 'spec'), T('con', 'CON', 'number', 'spec'),
      T('siz', 'SIZ', 'number', 'spec'), T('dex', 'DEX', 'number', 'spec'),
      T('int', 'INT', 'number', 'spec'), T('pow', 'POW', 'number', 'spec'),
      T('hp', 'HP', 'number', 'spec'),
      T('sanity_loss', 'Sanity Loss', 'text', 'spec', { placeholder: 'e.g. 1/1D10' }),
      T('attacks', 'Attacks', 'textarea', 'section'),
      T('powers', 'Powers & Abilities', 'textarea', 'section'),
      T('description', 'Description', 'textarea', 'section'),
      T('notes', 'Keeper Notes', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'coc_clue', label: 'Clues', labelSingular: 'Clue',
    icon: 'Eye', color: 'amber', group: 'Investigation', playerVisible: false,
    fields: [
      T('location_found', 'Where Found', 'text', 'spec'),
      T('hidden', 'How to Find', 'text', 'spec', { placeholder: 'Skill / roll to discover' }),
      T('reveals', 'What It Reveals', 'textarea', 'section'),
      T('leads_to', 'Leads To', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'coc_tome', label: 'Tomes & Artifacts', labelSingular: 'Tome / Artifact',
    icon: 'BookOpen', color: 'orange', group: 'Investigation', playerVisible: true,
    fields: [
      T('kind', 'Type', 'text', 'spec'),
      T('language', 'Language', 'text', 'spec'),
      T('sanity_cost', 'Sanity Cost', 'text', 'spec'),
      T('mythos_rating', 'Mythos Rating', 'text', 'spec'),
      T('spells', 'Spells Taught', 'textarea', 'section', { gmOnly: true }),
      T('description', 'Description', 'textarea', 'section'),
    ],
  },
  {
    key: 'coc_location', label: 'Locations', labelSingular: 'Location',
    icon: 'MapPin', color: 'emerald', group: 'Places', playerVisible: true,
    fields: [
      T('kind', 'Type', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('atmosphere', 'Atmosphere', 'textarea', 'section'),
      T('clues_here', 'Clues Here', 'textarea', 'section', { gmOnly: true }),
      T('secrets', 'Secrets', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'coc_scenario', label: 'Scenarios', labelSingular: 'Scenario',
    icon: 'Scroll', color: 'rose', group: 'Story', playerVisible: false,
    fields: [
      T('hook', 'Hook', 'textarea', 'section'),
      T('scenes', 'Scenes', 'textarea', 'section'),
      T('clue_trail', 'Clue Trail', 'textarea', 'section', { gmOnly: true }),
      T('the_horror', 'The Horror', 'textarea', 'section', { gmOnly: true }),
    ],
  },
];

// ── Blades in the Dark ───────────────────────────────────────────────────────
const BLADES = [
  {
    key: 'blades_scoundrel', label: 'Scoundrels', labelSingular: 'Scoundrel',
    icon: 'User', color: 'red', group: 'Crew', playerVisible: false,
    fields: [
      T('playbook', 'Playbook', 'select', 'spec', { options: ['Cutter', 'Hound', 'Leech', 'Lurk', 'Slide', 'Spider', 'Whisper'] }),
      T('heritage', 'Heritage', 'text', 'spec'),
      T('background', 'Background', 'text', 'spec'),
      T('vice', 'Vice', 'text', 'spec'),
      T('look', 'Look', 'text', 'spec'),
      T('stress', 'Stress', 'number', 'spec'),
      T('trauma', 'Trauma', 'text', 'spec'),
      T('coin', 'Coin', 'number', 'spec'),
      T('stash', 'Stash', 'number', 'spec'),
      T('action_ratings', 'Action Ratings', 'textarea', 'section', { placeholder: 'Insight: Hunt/Study/Survey/Tinker · Prowess: Finesse/Prowl/Skirmish/Wreck · Resolve: Attune/Command/Consort/Sway' }),
      T('special_abilities', 'Special Abilities', 'textarea', 'section'),
      T('harm', 'Harm', 'textarea', 'section', { placeholder: 'Level 1–3 harm' }),
      T('contacts', 'Contacts & Relationships', 'textarea', 'section'),
    ],
  },
  {
    key: 'blades_crew', label: 'Crews', labelSingular: 'Crew',
    icon: 'Shield', color: 'rose', group: 'Crew', playerVisible: false,
    fields: [
      T('crew_type', 'Crew Type', 'select', 'spec', { options: ['Assassins', 'Bravos', 'Cult', 'Hawkers', 'Shadows', 'Smugglers'] }),
      T('reputation', 'Reputation', 'text', 'spec'),
      T('tier', 'Tier', 'number', 'spec'),
      T('hold', 'Hold', 'select', 'spec', { options: ['Strong', 'Weak'] }),
      T('heat', 'Heat', 'number', 'spec'),
      T('wanted', 'Wanted Level', 'number', 'spec'),
      T('coin', 'Coin', 'number', 'spec'),
      T('vault', 'Vault', 'number', 'spec'),
      T('hunting_grounds', 'Hunting Grounds', 'text', 'spec'),
      T('claims', 'Claims & Turf', 'textarea', 'section'),
      T('special_abilities', 'Special Abilities', 'textarea', 'section'),
      T('upgrades', 'Upgrades', 'textarea', 'section'),
      T('cohorts', 'Cohorts', 'textarea', 'section'),
    ],
  },
  {
    key: 'blades_faction', label: 'Factions', labelSingular: 'Faction',
    icon: 'Crown', color: 'purple', group: 'The City', playerVisible: true,
    fields: [
      T('tier', 'Tier', 'number', 'spec'),
      T('hold', 'Hold', 'select', 'spec', { options: ['Strong', 'Weak'] }),
      T('status', 'Status w/ Crew', 'text', 'spec', { placeholder: '-3 to +3' }),
      T('turf', 'Turf', 'textarea', 'section'),
      T('notables', 'Notable Members', 'textarea', 'section'),
      T('clocks', 'Clocks & Schemes', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'blades_score', label: 'Scores', labelSingular: 'Score',
    icon: 'Target', color: 'amber', group: 'The Job', playerVisible: false,
    fields: [
      T('target', 'Target', 'text', 'spec'),
      T('plan_type', 'Plan', 'select', 'spec', { options: ['Assault', 'Deception', 'Stealth', 'Occult', 'Social', 'Transport'] }),
      T('payoff', 'Payoff', 'text', 'spec'),
      T('detail', 'Detail', 'textarea', 'section'),
      T('engagement', 'Engagement', 'textarea', 'section'),
      T('complications', 'Complications', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'blades_district', label: 'Districts', labelSingular: 'District',
    icon: 'MapPin', color: 'emerald', group: 'The City', playerVisible: true,
    fields: [
      T('security', 'Security', 'text', 'spec'),
      T('wealth', 'Wealth', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('factions_present', 'Factions Present', 'textarea', 'section'),
      T('notable_locations', 'Notable Locations', 'textarea', 'section'),
    ],
  },
  {
    key: 'blades_npc', label: 'NPCs', labelSingular: 'NPC',
    icon: 'Users', color: 'violet', group: 'The City', playerVisible: true,
    fields: [
      T('role', 'Role', 'text', 'spec'),
      T('faction', 'Faction', 'text', 'spec'),
      T('disposition', 'Disposition', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('secrets', 'Secrets', 'textarea', 'section', { gmOnly: true }),
    ],
  },
];

// ── Vampire: The Masquerade V5 ───────────────────────────────────────────────
const VAMPIRE = [
  {
    key: 'vtm_vampire', label: 'Vampires', labelSingular: 'Vampire',
    icon: 'Ghost', color: 'red', group: 'Kindred', playerVisible: false,
    fields: [
      T('clan', 'Clan', 'text', 'spec'),
      T('generation', 'Generation', 'number', 'spec'),
      T('predator_type', 'Predator Type', 'text', 'spec'),
      T('sire', 'Sire', 'text', 'spec'),
      T('ambition', 'Ambition', 'text', 'spec'),
      T('desire', 'Desire', 'text', 'spec'),
      T('blood_potency', 'Blood Potency', 'number', 'spec'),
      T('hunger', 'Hunger', 'number', 'spec'),
      T('humanity', 'Humanity', 'number', 'spec'),
      T('health', 'Health', 'text', 'spec'),
      T('willpower', 'Willpower', 'text', 'spec'),
      T('attributes', 'Attributes', 'textarea', 'section', { placeholder: 'Physical: Str/Dex/Sta · Social: Cha/Man/Com · Mental: Int/Wits/Res' }),
      T('disciplines', 'Disciplines', 'textarea', 'section'),
      T('touchstones', 'Touchstones & Convictions', 'textarea', 'section'),
      T('haven', 'Haven', 'textarea', 'section'),
      T('background', 'Background', 'textarea', 'section'),
    ],
  },
  {
    key: 'vtm_mortal', label: 'Mortals & Ghouls', labelSingular: 'Mortal / Ghoul',
    icon: 'User', color: 'green', group: 'Kindred', playerVisible: true,
    fields: [
      T('kind', 'Type', 'select', 'spec', { options: ['Mortal', 'Ghoul', 'Thrall'] }),
      T('relationship', 'Relationship', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('notes', 'Notes', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'vtm_coterie', label: 'Coteries', labelSingular: 'Coterie',
    icon: 'Users', color: 'rose', group: 'Kindred', playerVisible: false,
    fields: [
      T('coterie_type', 'Type', 'text', 'spec'),
      T('domain', 'Domain', 'text', 'spec'),
      T('shared_advantages', 'Shared Advantages', 'textarea', 'section'),
      T('members', 'Members', 'textarea', 'section'),
    ],
  },
  {
    key: 'vtm_domain', label: 'Domains', labelSingular: 'Domain',
    icon: 'MapPin', color: 'emerald', group: 'The City', playerVisible: true,
    fields: [
      T('chasse', 'Chasse', 'text', 'spec'),
      T('lien', 'Lien', 'text', 'spec'),
      T('portillon', 'Portillon', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('notable', 'Notable', 'textarea', 'section'),
    ],
  },
  {
    key: 'vtm_faction', label: 'Sects & Factions', labelSingular: 'Sect / Faction',
    icon: 'Crown', color: 'purple', group: 'Night Politics', playerVisible: true,
    fields: [
      T('allegiance', 'Allegiance', 'text', 'spec', { placeholder: 'Camarilla, Anarch, Sabbat…' }),
      T('goals', 'Goals', 'textarea', 'section'),
      T('notable_members', 'Notable Members', 'textarea', 'section'),
      T('agenda', 'Hidden Agenda', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'vtm_npc', label: 'NPCs', labelSingular: 'NPC',
    icon: 'Users', color: 'violet', group: 'Cast', playerVisible: true,
    fields: [
      T('kind', 'Type', 'text', 'spec'),
      T('disposition', 'Disposition', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('secrets', 'Secrets', 'textarea', 'section', { gmOnly: true }),
    ],
  },
];

// ── Daggerheart ──────────────────────────────────────────────────────────────
const DAGGERHEART = [
  {
    key: 'dh_hero', label: 'Heroes', labelSingular: 'Hero',
    icon: 'Sparkles', color: 'amber', group: 'Party', playerVisible: false,
    fields: [
      T('class', 'Class', 'text', 'spec'),
      T('subclass', 'Subclass', 'text', 'spec'),
      T('ancestry', 'Ancestry', 'text', 'spec'),
      T('community', 'Community', 'text', 'spec'),
      T('agility', 'Agility', 'number', 'spec'),
      T('strength', 'Strength', 'number', 'spec'),
      T('finesse', 'Finesse', 'number', 'spec'),
      T('instinct', 'Instinct', 'number', 'spec'),
      T('presence', 'Presence', 'number', 'spec'),
      T('knowledge', 'Knowledge', 'number', 'spec'),
      T('evasion', 'Evasion', 'number', 'spec'),
      T('hope', 'Hope', 'number', 'spec'),
      T('hp', 'HP & Thresholds', 'text', 'spec'),
      T('stress', 'Stress', 'text', 'spec'),
      T('domains', 'Domains', 'text', 'spec', { placeholder: 'The two class domains' }),
      T('domain_cards', 'Domain Cards', 'textarea', 'section'),
      T('experiences', 'Experiences', 'textarea', 'section', { placeholder: 'e.g. "Streetwise +2"' }),
      T('equipment', 'Equipment', 'textarea', 'section'),
      T('background', 'Background', 'textarea', 'section'),
    ],
  },
  {
    key: 'dh_adversary', label: 'Adversaries', labelSingular: 'Adversary',
    icon: 'Skull', color: 'red', group: 'Bestiary', playerVisible: false,
    fields: [
      T('tier', 'Tier', 'number', 'spec'),
      T('adversary_type', 'Type', 'text', 'spec'),
      T('difficulty', 'Difficulty', 'number', 'spec'),
      T('hp', 'HP', 'text', 'spec'),
      T('stress', 'Stress', 'text', 'spec'),
      T('attack', 'Attack', 'text', 'spec'),
      T('features', 'Features', 'textarea', 'section'),
      T('motives', 'Motives & Tactics', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'dh_environment', label: 'Environments', labelSingular: 'Environment',
    icon: 'Mountain', color: 'emerald', group: 'Places', playerVisible: true,
    fields: [
      T('env_type', 'Type', 'text', 'spec'),
      T('difficulty', 'Difficulty', 'number', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('features', 'Features', 'textarea', 'section'),
      T('potential_adversaries', 'Potential Adversaries', 'textarea', 'section', { gmOnly: true }),
    ],
  },
  {
    key: 'dh_faction', label: 'Factions', labelSingular: 'Faction',
    icon: 'Shield', color: 'rose', group: 'Story', playerVisible: true,
    fields: [
      T('description', 'Description', 'textarea', 'section'),
      T('goals', 'Goals', 'textarea', 'section'),
      T('notable', 'Notable Members', 'textarea', 'section'),
    ],
  },
  {
    key: 'dh_npc', label: 'NPCs', labelSingular: 'NPC',
    icon: 'Users', color: 'violet', group: 'Cast', playerVisible: true,
    fields: [
      T('role', 'Role', 'text', 'spec'),
      T('disposition', 'Disposition', 'text', 'spec'),
      T('description', 'Description', 'textarea', 'section'),
      T('secrets', 'Secrets', 'textarea', 'section', { gmOnly: true }),
    ],
  },
];

export const SYSTEM_PACKS = {
  coc: CALL_OF_CTHULHU,
  blades: BLADES,
  vtm: VAMPIRE,
  daggerheart: DAGGERHEART,
};
