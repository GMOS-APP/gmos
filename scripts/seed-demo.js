/**
 * GM-OS Demo Campaign Seed Script
 *
 * Creates "The Chronicles of Aldenmoor" — a classic fantasy demo campaign
 * with entities, sessions, relationships, and random tables.
 *
 * Usage:
 *   npm run seed:demo
 *
 * Required env vars in .env.local:
 *   VITE_SUPABASE_URL        — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — from Supabase dashboard → Project Settings → API
 *   SEED_USER_EMAIL           — the email of the account to own the demo data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SEED_USER_EMAIL) {
  console.error('Missing required env vars. Add to .env.local:');
  console.error('  VITE_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  SEED_USER_EMAIL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function insert(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`Insert into ${table} failed: ${error.message}`);
  return data;
}

function now() {
  return new Date().toISOString();
}

function stamp(obj, userId) {
  return { ...obj, created_by: userId, created_date: now(), updated_date: now() };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding demo campaign for ${SEED_USER_EMAIL}...\n`);

  // 1. Look up user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) throw userError;
  const user = users.find(u => u.email === SEED_USER_EMAIL);
  if (!user) {
    console.error(`No user found with email: ${SEED_USER_EMAIL}`);
    process.exit(1);
  }
  const userId = user.id;
  console.log(`✓ Found user: ${userId}`);

  // 2. Campaign
  const [campaign] = await insert('campaigns', [stamp({
    name: 'The Chronicles of Aldenmoor',
    description: 'A classic fantasy adventure set in the war-weary kingdom of Aldenmoor, where ancient shadows stir beneath the city streets and nothing is as it seems.',
    setting: 'The Kingdom of Aldenmoor',
    current_session_number: 3,
  }, userId)]);
  const cid = campaign.id;
  console.log(`✓ Campaign: ${campaign.name} (${cid})`);

  // 3. World Entities
  const entityRows = [
    // NPCs
    {
      campaign_id: cid,
      name: 'Captain Garin Ashhold',
      entity_type: 'npc',
      summary: 'The gruff but principled captain of the Aldenmoor City Watch. Loyal to the city above all else.',
      description: 'Garin has served the Watch for twenty years. He lost his left ear in the Battle of Thornwall and wears the scar like a badge. He suspects corruption in the upper ranks but lacks proof — and allies.',
      extraData: {
        race: 'Human',
        class: 'Fighter',
        gender: 'Male',
        alignment: 'Lawful Good',
        appearance: 'Barrel-chested, grey-stubbled, perpetually squinting. Missing left ear. Wears battered plate engraved with the Watch sigil.',
        traits: 'Blunt, honest to a fault, exhausted. Checks his pocket watch constantly.',
        motives: 'Keep the city safe. Expose whoever is bribing the Watch leadership.',
        sample_dialogue: '"I don\'t care who you work for. In this city, the law applies to everyone. Even you."',
        rumors: 'Some say Garin used to run with a thieves\' guild in his youth before going straight.',
        quests: 'Missing evidence from the Watch lockup. Someone on the inside is helping the Shadow Compact.',
      },
    },
    {
      campaign_id: cid,
      name: 'Lyra Moonwhisper',
      entity_type: 'npc',
      summary: 'An elven sage and archivist who has studied Aldenmoor\'s history for over two centuries. Knows secrets most have forgotten.',
      description: 'Lyra runs the Moonwhisper Archive in the Scholar\'s Quarter. She speaks slowly and precisely, choosing each word as if it were irreplaceable. She has outlived three generations of friends and carries that weight quietly.',
      extraData: {
        race: 'Elf',
        class: 'Wizard',
        gender: 'Female',
        alignment: 'Neutral Good',
        appearance: 'Silver-haired, pale gold skin, robes covered in tiny embroidered runes. Always has ink-stained fingers.',
        traits: 'Measured, patient, occasionally cryptic. Dislikes being rushed.',
        motives: 'Preserve knowledge. Prevent the return of the Hollow Court — a dark power she has studied obsessively.',
        sample_dialogue: '"The answer you seek is in the archive. Whether you are ready to hear it is another matter entirely."',
        rumors: 'Lyra was present during the Night of Falling Stars three hundred years ago. Some believe she caused it.',
        quests: 'Recover a stolen tome from the Shadow Compact. Translate the inscription in the Catacombs.',
      },
    },
    {
      campaign_id: cid,
      name: 'Malachai Voss',
      entity_type: 'npc',
      summary: 'A wealthy spice merchant whose legitimate business masks his role as the de facto leader of the Shadow Compact.',
      description: 'Malachai is charming, generous at dinner parties, and utterly ruthless in private. He genuinely loves the city of Aldenmoor — he simply believes it would flourish better under his control. He is not wrong that the current government is corrupt. He is wrong about everything else.',
      extraData: {
        race: 'Human',
        class: 'Rogue',
        gender: 'Male',
        alignment: 'Lawful Evil',
        appearance: 'Lean, elegant, always immaculately dressed in dark burgundy. Grey at the temples. Warm smile that never quite reaches his eyes.',
        traits: 'Charming, patient, never raises his voice. Calls everyone "friend."',
        motives: 'Control the city\'s criminal network. Eventually replace the king\'s appointed governor with himself.',
        sample_dialogue: '"I\'m a businessman, friend. I provide what people want. The law simply hasn\'t caught up with demand."',
        rumors: 'The Mayor has been seen leaving Voss\'s mansion late at night on multiple occasions.',
        quests: 'Linked to the Mayor\'s disappearance. Has a blackmail ledger that could destroy half the nobility.',
      },
    },
    // Locations
    {
      campaign_id: cid,
      name: 'City of Aldenmoor',
      entity_type: 'location',
      summary: 'A walled river city of 40,000 souls, famous for its spice trade and infamous for its politics.',
      description: 'Aldenmoor sits at the confluence of the Ash River and the Torrenfall, controlling trade routes between the northern mountains and the southern coast. The city is divided into distinct quarters: the Merchant Quarter (prosperous, loud), Scholar\'s Quarter (quiet, ink-smelling), the Warrens (poor, labyrinthine), and the Upper City (wealthy, paranoid).',
      extraData: {
        location_type: 'City',
        region: 'Kingdom of Aldenmoor',
        atmosphere: 'Bustling river port. Smell of spices, river mud, and torch smoke. Constant sound of bells marking trade hours.',
        notable_features: 'The Ash Gate. The Grand Market. The River Docks. The Watch Tower.',
        inhabitants: 'Merchants, scholars, dockworkers, thieves, and a Watch stretched too thin.',
        secrets: 'A network of old smuggling tunnels runs beneath the Warrens, dating back to the city\'s founding.',
        hooks: 'A body was found in the Grand Market with a Shadow Compact tattoo burned off. Someone is cleaning house.',
      },
    },
    {
      campaign_id: cid,
      name: 'The Sunken Flagon',
      entity_type: 'location',
      summary: 'A tavern three steps below street level in the Warrens. The best ale in the city, no questions asked.',
      description: 'The Sunken Flagon smells of sawdust and stale beer and is somehow always warm. The owner, a retired adventurer named Dora Kettwick, keeps a crossbow under the bar and a strict no-violence policy enforced with terrifying efficiency.',
      extraData: {
        location_type: 'Building',
        region: 'The Warrens, Aldenmoor',
        atmosphere: 'Low ceilings, smoky lanterns, mismatched chairs. Dice games in the back. Always someone listening.',
        notable_features: 'The back room — available for private conversations, for a price. Dora\'s famous lamb stew.',
        inhabitants: 'Dockworkers, off-duty Watch, Compact informants, adventurers between jobs.',
        secrets: 'The cellar connects to the old smuggling tunnels. Dora knows. She charges for access.',
        hooks: 'A Shadow Compact courier was seen leaving the back room with a sealed letter.',
      },
    },
    {
      campaign_id: cid,
      name: 'The Catacombs',
      entity_type: 'location',
      summary: 'Ancient burial tunnels beneath the city, dating back to Aldenmoor\'s founding three centuries ago. Officially sealed. Unofficially very active.',
      description: 'The Catacombs were sealed by mayoral decree forty years ago after a series of grave robberies. The decree did not stop the Shadow Compact from using the tunnels for meetings, storage, and worse. Strange lights have been seen in the lowest levels.',
      extraData: {
        location_type: 'Dungeon',
        region: 'Beneath Aldenmoor',
        atmosphere: 'Damp stone, the smell of old bones, dripping water. Distant sounds that may be echoes. May not be.',
        notable_features: 'The Hall of Founders (ancient tombs). The Deep Vault (Compact storage). The Inscription Wall (unknown language).',
        inhabitants: 'Skeleton guardians (animated by old magic). Shadow Compact smugglers. Something deeper.',
        secrets: 'The lowest level contains the sealed resting place of the Hollow Court — the dark power Lyra fears.',
        hooks: 'The stolen tome Lyra wants was taken here. The Inscription Wall matches symbols in the stolen book.',
      },
    },
    {
      campaign_id: cid,
      name: 'Ironwatch Keep',
      entity_type: 'location',
      summary: 'The fortified headquarters of the City Watch, perched on a hill above the Upper City.',
      description: 'Ironwatch Keep was built to be impregnable and largely succeeded. The Watch\'s prison occupies the lower levels, the barracks the middle, and Garin\'s office commands a view of the entire city from the top floor. Garin rarely goes home.',
      extraData: {
        location_type: 'Building',
        region: 'Upper City, Aldenmoor',
        atmosphere: 'Cold stone, echoing footsteps, the smell of oil and iron. Orderly. Tense.',
        notable_features: 'Garin\'s cluttered office. The evidence lockup (recently broken into). The bell tower.',
        inhabitants: 'Watch soldiers, prisoners, Garin and his two trusted lieutenants.',
        secrets: 'Three Watch officers are on Voss\'s payroll. Garin suspects one of them.',
        hooks: 'Evidence from a Shadow Compact arrest has gone missing from the lockup. Inside job.',
      },
    },
    // Factions
    {
      campaign_id: cid,
      name: 'The City Watch',
      entity_type: 'faction',
      summary: 'Aldenmoor\'s law enforcement, underfunded and increasingly compromised — but still the line between order and chaos.',
      description: 'The Watch numbers five hundred officers across the city. Garin commands them with integrity, but three of his senior officers take Compact coin. Most Watch members are simply underpaid people trying to do a hard job.',
      extraData: {
        faction_type: 'Military / Law Enforcement',
        base: 'Ironwatch Keep',
        goals: 'Maintain order. Collect taxes. Keep the peace. (The honest ones: root out corruption.)',
        structure: 'Garin at top, three captains below, sergeants, constables.',
        resources: 'City funding (insufficient). Ironwatch Keep. Legal authority.',
        relationships: 'Nominal allies with the Governor\'s office. Rivals with the Shadow Compact.',
        joining: 'Apply at Ironwatch Keep. Pass the physical trial. Accept the oath.',
      },
    },
    {
      campaign_id: cid,
      name: 'The Shadow Compact',
      entity_type: 'faction',
      summary: 'Aldenmoor\'s criminal syndicate, hiding behind legitimate trade. More organized — and more dangerous — than anyone realizes.',
      description: 'The Compact controls smuggling, extortion, and information brokerage across the city. Malachai Voss rebuilt it from a loose gang into a structured organization over fifteen years. Members refer to each other only by their Compact names.',
      extraData: {
        faction_type: 'Criminal Syndicate',
        base: 'Voss Spice House (public). The Catacombs (private).',
        goals: 'Control city commerce. Place Voss in political power. Recover the Hollow Court\'s power for leverage.',
        structure: 'Voss at top. Three underbosses (street, information, corruption). Dozens of agents.',
        resources: 'Bribed officials. Smuggling tunnels. Considerable gold. The evidence they hold over powerful people.',
        relationships: 'Enemies with the Watch (outwardly). Three Watch officers are secretly members.',
        joining: 'By invitation only. Inducted with a ritual tattoo that can be removed — painfully — as punishment.',
      },
    },
    // Creatures
    {
      campaign_id: cid,
      name: 'Skeleton Warrior',
      entity_type: 'creature',
      summary: 'Animated bones of Aldenmoor\'s ancient defenders, still standing guard in the Catacombs centuries after their deaths.',
      description: 'These are not mindless undead — they retain tactical memory from their lives and fight with coordinated discipline. They do not pursue intruders out of the Catacombs.',
      extraData: {
        creature_type: 'Undead',
        cr: '1',
        size: 'Medium',
        ac: '13',
        hp: '13',
        speed: '30 ft.',
        ability_scores: 'STR 10, DEX 14, CON 15, INT 6, WIS 8, CHA 5',
        traits: 'Immune to poison and exhaustion. Darkvision 60 ft. Does not pursue beyond the Catacombs.',
        actions: 'Shortsword +4 to hit, 1d6+2 piercing. Shortbow +4 to hit, 1d6+2 piercing.',
        tactics: 'Fight in coordinated pairs. One holds, one flanks. Retreat to chokepoints when outnumbered.',
      },
    },
    {
      campaign_id: cid,
      name: 'Shadow Drake',
      entity_type: 'creature',
      summary: 'A shadow-touched drake nesting in the Catacombs\' deepest level. Drawn by the Hollow Court\'s sealed power.',
      description: 'The Shadow Drake arrived six months ago — the same time the Compact began using the lower tunnels. It is not their pet. It simply tolerates them because they occasionally bring it food (unwillingly).',
      extraData: {
        creature_type: 'Dragon (Shadow-touched)',
        cr: '4',
        size: 'Large',
        ac: '14',
        hp: '65',
        speed: '40 ft., fly 60 ft.',
        ability_scores: 'STR 16, DEX 12, CON 14, INT 8, WIS 10, CHA 10',
        traits: 'Shadow Stealth: advantage on Stealth in dim light or darkness. Resistant to necrotic damage.',
        actions: 'Bite +5, 2d6+3 piercing. Shadow Breath (recharge 5-6): 30-ft cone, 4d6 necrotic, DC 13 CON save for half.',
        tactics: 'Ambushes from darkness. Targets isolated party members. Retreats to shadows if bloodied.',
      },
    },
    // Items
    {
      campaign_id: cid,
      name: 'Sword of the Aldenmoor Kings',
      entity_type: 'item',
      summary: 'A legendary longsword said to have been carried by Aldenmoor\'s first king. Lost for two centuries. Recently surfaced in a Shadow Compact vault.',
      description: 'The blade is steel-grey with veins of silver that glow faintly in the presence of undead. The pommel is carved with the Aldenmoor crest — a river and a tower. Whoever holds it has a rightful claim to the kingship, by ancient law.',
      extraData: {
        item_type: 'Weapon',
        rarity: 'Legendary',
        attunement: 'Yes (requires attunement by a creature of lawful alignment)',
        value: 'Priceless (politically)',
        properties: '+2 longsword. Radiant damage against undead (extra 2d6). Once per day: Lay on Hands as paladin of level 10.',
        history: 'Carried by King Aldric I at the founding of the city. Disappeared during the Hollow Court war. No one knows how the Compact got it.',
        appearance: 'Silver-veined grey blade. River-and-tower pommel. Faintly warm to the touch.',
      },
    },
    {
      campaign_id: cid,
      name: 'Cloak of Shifting Shadows',
      entity_type: 'item',
      summary: 'A Compact assassin\'s tool — a cloak that drinks light and muffles sound.',
      description: 'The cloak looks like plain black wool until you notice it doesn\'t quite follow the light correctly. It was taken from a dead Compact agent found in the Market.',
      extraData: {
        item_type: 'Wondrous Item',
        rarity: 'Uncommon',
        attunement: 'Yes',
        value: '500 gp',
        properties: 'Advantage on Stealth checks. Once per day: become invisible until you attack or cast a spell (concentration, up to 1 minute).',
        history: 'Standard issue for Compact shadow agents. The Compact wants it back.',
        appearance: 'Plain black wool. Cast no shadows in bright light.',
      },
    },
    // Events
    {
      campaign_id: cid,
      name: 'The Night of Falling Stars',
      entity_type: 'event',
      summary: 'Three hundred years ago, stars fell on Aldenmoor for a single night. The city was rebuilt. What caused it has never been confirmed.',
      description: 'Historical records are inconsistent. Some say it was a meteor shower. Others say the sky cracked open. Lyra was there and refuses to give a straight account. Whatever it was, it coincided with the first sealing of the Hollow Court beneath the Catacombs.',
      extraData: {
        trigger: 'Unknown — possibly the ritual that sealed the Hollow Court',
        scale: 'World-Shaking',
        participants: 'Unknown mages (possibly the Hollow Court). The city\'s founders. Lyra Moonwhisper (then young by elven standards).',
        description: 'For one night, lights fell from the sky into the city. Buildings burned. The river ran backwards for an hour. By dawn, the Catacombs were sealed and half the founders were dead.',
        consequences: 'The founding families were decimated. The Hollow Court was sealed. Lyra began her centuries of research.',
        player_agency: 'Players can research this in Lyra\'s archive. It connects directly to the current crisis.',
      },
    },
    {
      campaign_id: cid,
      name: 'The Mayor\'s Disappearance',
      entity_type: 'event',
      summary: 'Governor Pellin Strath vanished three days ago. The Watch has been told he is "on retreat." No one believes this.',
      description: 'Strath was last seen leaving Voss\'s mansion. His disappearance was covered up for two days before leaking. Garin is quietly furious and investigating without orders to do so.',
      extraData: {
        trigger: 'Strath apparently refused one of Voss\'s demands',
        scale: 'Regional',
        participants: 'Governor Strath. Malachai Voss. At least one Watch officer.',
        description: 'The Governor is either dead, imprisoned in the Catacombs, or has fled. The official story is implausible. The city is beginning to notice.',
        consequences: 'Political vacuum. The Compact is moving quickly to fill it. Garin needs outside help.',
        player_agency: 'Central to the current plot. Garin will ask the players to find the truth.',
      },
    },
    // Lore
    {
      campaign_id: cid,
      name: 'The Hollow Court',
      entity_type: 'lore',
      summary: 'An ancient dark power sealed beneath Aldenmoor three centuries ago. Not dead. Waiting.',
      description: 'The Hollow Court was a cabal of necromancers who sought to replace the living city with an undying one. They were defeated and sealed by a coalition of mages who paid with their lives. The sealing is degrading.',
      extraData: {
        category: 'History',
        era: '300 years ago (and potentially now)',
        common_knowledge: 'Most people have heard the name as a children\'s ghost story. Not taken seriously.',
        secret_info: 'The seal weakens when necrotic magic is used near the Catacombs. The Shadow Compact\'s recent activities have accelerated this.',
        discovery: 'Lyra\'s archive. The Inscription Wall in the Catacombs. The stolen tome.',
        mechanics: 'If the seal breaks: undead rise across the Warrens. The Shadow Drake becomes uncontrollable. Stakes escalate dramatically.',
      },
    },
  ];

  const entities = await insert('world_entities', entityRows.map(e => stamp(e, userId)));
  console.log(`✓ ${entities.length} world entities`);

  // Build a name→id lookup
  const byName = Object.fromEntries(entities.map(e => [e.name, e.id]));

  // 4. Sessions
  const sessions = await insert('sessions', [
    stamp({
      campaign_id: cid,
      session_number: 1,
      title: 'The Broken Wheel',
      date: '2026-01-10',
      status: 'debriefed',
      previous_session_recap: 'Our story begins.',
      strong_start: 'A cart has overturned in the Grand Market, spilling a crate of "spices" that turn out to be stolen Watch evidence. The crowd is gathering. A hooded figure is watching.',
      npc_notes: 'Garin is at the scene, furious and trying to keep order. He clocks the players immediately as capable.',
      location_notes: 'Grand Market — busy, chaotic, dozens of witnesses.',
      rumors: 'Word in the Warrens: someone paid good coin to cause that accident.\nA dockworker claims he saw Shadow Compact tattoos on the cart driver.',
      session_goals: [
        { text: 'Establish the party in Aldenmoor', completed: true },
        { text: 'Introduce Garin and the Watch', completed: true },
        { text: 'Plant seeds of the Compact\'s involvement', completed: true },
      ],
      summary: 'The party arrived in Aldenmoor and stumbled into the cart incident. They helped Garin recover the evidence — mostly — and earned his cautious trust. One crate was taken by a Compact runner before they could stop him.',
      next_session_primer: 'Garin will contact the party with a quiet request: find out who arranged the cart accident. He cannot use official Watch resources — someone inside is feeding information to the Compact.',
    }, userId),
    stamp({
      campaign_id: cid,
      session_number: 2,
      title: 'Shadows in the Market',
      date: '2026-01-24',
      status: 'debriefed',
      previous_session_recap: 'The party helped Captain Garin recover stolen Watch evidence from a staged accident in the Grand Market. One crate of evidence was taken by a Shadow Compact runner. Garin suspects an inside man.',
      strong_start: 'The party receives a folded note slipped under their door: "Sunken Flagon. After midnight. Come alone." It is not signed, but the paper smells faintly of expensive spices.',
      npc_notes: 'Malachai Voss makes his first appearance at the Flagon — relaxed, charming, apparently innocent.\nLyra sends a message through a street urchin inviting the party to her archive.',
      location_notes: 'The Sunken Flagon — ideal for private conversations and ambushes.\nLyra\'s Archive — safe, dusty, full of answers.',
      monster_notes: 'Two Compact enforcers follow the party from the Flagon. They are not subtle.',
      session_goals: [
        { text: 'Meet Malachai Voss', completed: true },
        { text: 'Visit Lyra\'s archive', completed: true },
        { text: 'Deal with Compact surveillance', completed: true },
        { text: 'Learn about the Hollow Court', completed: false },
      ],
      summary: 'Voss met the party and tried to hire them as "independent consultants." They declined. Lyra told them about the Hollow Court and the degrading seal. Two Compact enforcers tailed them home — one was captured and revealed there\'s a meeting in the Catacombs in three days.',
      next_session_primer: 'The Catacombs meeting. The Mayor\'s disappearance breaks publicly tonight. Garin needs the party NOW.',
    }, userId),
    stamp({
      campaign_id: cid,
      session_number: 3,
      title: 'The Mayor\'s Secret',
      date: '2026-02-07',
      status: 'planned',
      previous_session_recap: 'The party refused Voss\'s offer and gathered intelligence on a Compact meeting in the Catacombs. Lyra revealed the Hollow Court\'s seal is weakening. Governor Strath has now publicly disappeared.',
      strong_start: 'Garin hammers on the party\'s door at dawn. His face says everything before he speaks: "Strath is gone. I need you in those Catacombs before that meeting happens. Tonight."',
      npc_notes: '- Garin: desperate, trusting the party completely now. Provides Watch credentials for the Ash Gate.\n- Lyra: will meet them at the Catacomb entrance with a warding scroll.\n- Voss: not present, but his lieutenant Sera Dusk runs the Compact meeting.',
      monster_notes: '- 4× Skeleton Warriors (patrol the upper Catacombs)\n- Shadow Drake (nesting in the deep vault — may be avoided or fought)\n- Compact enforcers at the meeting (6, armed)',
      location_notes: 'The Catacombs: upper level (skeletons, old tombs), middle level (Compact operations), deep vault (Drake, the seal, the Governor).',
      rumors: 'A Compact defector tells the party: Voss doesn\'t know the Drake is down there. His people are terrified of it.\nThe Governor is alive — being held as leverage over someone in the capital.',
      treasure_notes: '- Shadow Compact ledger (political dynamite)\n- Sword of the Aldenmoor Kings (in the deep vault)\n- Cloak of Shifting Shadows (on Sera Dusk)',
      session_goals: [
        { text: 'Enter the Catacombs', completed: false },
        { text: 'Disrupt the Compact meeting', completed: false },
        { text: 'Find Governor Strath', completed: false },
        { text: 'Discover the state of the Hollow Court seal', completed: false },
      ],
    }, userId),
  ]);
  console.log(`✓ ${sessions.length} sessions`);

  // 5. Relationships
  const relRows = [
    {
      campaign_id: cid,
      source_entity_id: byName['Captain Garin Ashhold'],
      target_entity_id: byName['Lyra Moonwhisper'],
      source_name: 'Captain Garin Ashhold',
      target_name: 'Lyra Moonwhisper',
      relationship_type: 'allied_with',
      description: 'Garin and Lyra have worked together quietly for years. She provides historical intelligence; he ensures the archive is never bothered.',
      status: 'active',
      strength: 7,
      session_established: 1,
    },
    {
      campaign_id: cid,
      source_entity_id: byName['Malachai Voss'],
      target_entity_id: byName['The Shadow Compact'],
      source_name: 'Malachai Voss',
      target_name: 'The Shadow Compact',
      relationship_type: 'employed_by',
      description: 'Voss built the modern Compact from scratch and leads it absolutely. "Employed by" is a polite fiction — he is the Compact.',
      status: 'active',
      strength: 10,
      session_established: 1,
    },
    {
      campaign_id: cid,
      source_entity_id: byName['Malachai Voss'],
      target_entity_id: byName['Captain Garin Ashhold'],
      source_name: 'Malachai Voss',
      target_name: 'Captain Garin Ashhold',
      relationship_type: 'enemy_of',
      description: 'Garin is the only Watch officer Voss cannot buy, blackmail, or remove. Voss finds this both infuriating and genuinely impressive.',
      status: 'active',
      strength: 8,
      session_established: 1,
    },
    {
      campaign_id: cid,
      source_entity_id: byName['Skeleton Warrior'],
      target_entity_id: byName['The Catacombs'],
      source_name: 'Skeleton Warrior',
      target_name: 'The Catacombs',
      relationship_type: 'located_in',
      description: 'The Skeleton Warriors have guarded the Catacombs since the founding. They do not distinguish between intruders.',
      status: 'active',
      strength: 9,
    },
    {
      campaign_id: cid,
      source_entity_id: byName['Shadow Drake'],
      target_entity_id: byName['The Catacombs'],
      source_name: 'Shadow Drake',
      target_name: 'The Catacombs',
      relationship_type: 'located_in',
      description: 'The Drake arrived six months ago, drawn by the weakening Hollow Court seal. It has claimed the deep vault.',
      status: 'active',
      strength: 8,
      session_established: 2,
    },
    {
      campaign_id: cid,
      source_entity_id: byName['The Shadow Compact'],
      target_entity_id: byName['The City Watch'],
      source_name: 'The Shadow Compact',
      target_name: 'The City Watch',
      relationship_type: 'rivals',
      description: 'The Compact has three Watch officers on payroll but needs Garin gone to truly control the city.',
      status: 'active',
      strength: 8,
    },
    {
      campaign_id: cid,
      source_entity_id: byName['Lyra Moonwhisper'],
      target_entity_id: byName['The Hollow Court'],
      source_name: 'Lyra Moonwhisper',
      target_name: 'The Hollow Court',
      relationship_type: 'fears',
      description: 'Lyra witnessed the Night of Falling Stars and knows what the Hollow Court nearly achieved. She has spent centuries ensuring it cannot happen again.',
      status: 'active',
      strength: 10,
      session_established: 2,
    },
    {
      campaign_id: cid,
      source_entity_id: byName['Sword of the Aldenmoor Kings'],
      target_entity_id: byName['The Catacombs'],
      source_name: 'Sword of the Aldenmoor Kings',
      target_name: 'The Catacombs',
      relationship_type: 'located_in',
      description: 'The Compact stored the Sword in the deep vault, not knowing its political significance.',
      status: 'active',
      strength: 6,
    },
  ];

  const rels = await insert('relationships', relRows.map(r => stamp(r, userId)));
  console.log(`✓ ${rels.length} relationships`);

  // 6. Random Tables
  const tables = await insert('random_tables', [
    stamp({
      campaign_id: cid,
      name: 'Aldenmoor Street Encounters',
      description: 'Roll when the party lingers in the city streets.',
      category: 'encounters',
      entries: [
        { result: 'A Watch patrol stops to question the party — one officer looks nervous.' },
        { result: 'A pickpocket tries her luck. She\'s a child. Her handler watches from across the street.' },
        { result: 'A merchant argues loudly with a Compact debt collector. Bystanders give them both wide berth.' },
        { result: 'A street preacher declares the Hollow Court has returned. Most ignore him. One person does not.' },
        { result: 'Dockworkers carrying unmarked crates — Shadow Compact sigil barely visible on the wax seals.' },
        { result: 'A city herald posts a notice: Governor Strath is "on retreat." Three people read it and immediately leave.' },
        { result: 'A stray cat drops a rolled-up piece of paper at the party\'s feet. It is a Compact cipher they can\'t read. Yet.' },
        { result: 'Two off-duty Watch guards whisper urgently in an alley. They stop when they notice the party.' },
        { result: 'A beggar offers information about Compact movements — for a price. She seems to genuinely know something.' },
        { result: 'Quiet day. Nothing happens. This is suspicious.' },
      ],
    }, userId),
    stamp({
      campaign_id: cid,
      name: 'Aldenmoor NPC Names',
      description: 'Quick NPC name generator for city residents.',
      category: 'names',
      entries: [
        { result: 'Dara Kettwick' },
        { result: 'Borvin Ashe' },
        { result: 'Seraphine Dusk' },
        { result: 'Colt Maren' },
        { result: 'Ilya Torrent' },
        { result: 'Renn Coldwater' },
        { result: 'Mags Thornbury' },
        { result: 'Feyn Ashlock' },
        { result: 'Oswin Brackle' },
        { result: 'Cass Hallorin' },
        { result: 'Petra Vane' },
        { result: 'Dun Strickler' },
      ],
    }, userId),
  ]);
  console.log(`✓ ${tables.length} random tables`);

  // Done
  console.log(`\n✅ Demo campaign seeded successfully!`);
  console.log(`   Campaign ID: ${cid}`);
  console.log(`   Open your app and look for "The Chronicles of Aldenmoor"\n`);
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
