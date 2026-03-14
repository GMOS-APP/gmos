import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: 'unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'unauthorized' }, { status: 401, headers: corsHeaders });
  }

  // Idempotency — bail if demo already exists
  const { data: existing } = await supabase
    .from('campaigns')
    .select('id')
    .eq('is_demo', true)
    .limit(1);

  if (existing && existing.length > 0) {
    return Response.json({ message: 'demo_already_exists' }, { headers: corsHeaders });
  }

  const userId = user.id;
  const now = new Date().toISOString();

  function stamp<T extends object>(obj: T): T & { created_by: string; created_date: string; updated_date: string } {
    return { ...obj, created_by: userId, created_date: now, updated_date: now };
  }

  // ── Campaign ────────────────────────────────────────────────────────────────
  const { data: campaignRows, error: campaignErr } = await supabase
    .from('campaigns')
    .insert([stamp({
      name: 'The Chronicles of Aldenmoor',
      description: 'A classic fantasy adventure set in the war-weary kingdom of Aldenmoor, where ancient shadows stir beneath the city streets and nothing is as it seems.',
      setting: 'The Kingdom of Aldenmoor',
      current_session_number: 3,
      system: 'dnd5e',
      is_demo: true,
    })])
    .select();

  if (campaignErr || !campaignRows?.length) {
    return Response.json({ error: 'campaign_insert_failed', detail: campaignErr?.message }, { status: 500, headers: corsHeaders });
  }

  const campaign = campaignRows[0];
  const cid = campaign.id;

  // ── World Entities ───────────────────────────────────────────────────────────
  const entityRows = [
    // NPCs
    { campaign_id: cid, name: 'Captain Garin Ashhold', entity_type: 'npc',
      summary: 'The gruff but principled captain of the Aldenmoor City Watch. Loyal to the city above all else.',
      description: 'Garin has served the Watch for twenty years. He lost his left ear in the Battle of Thornwall and wears the scar like a badge. He suspects corruption in the upper ranks but lacks proof — and allies.',
      extraData: { race: 'Human', class: 'Fighter', gender: 'Male', alignment: 'Lawful Good',
        appearance: 'Barrel-chested, grey-stubbled, perpetually squinting. Missing left ear. Wears battered plate engraved with the Watch sigil.',
        traits: 'Blunt, honest to a fault, exhausted. Checks his pocket watch constantly.',
        motives: 'Keep the city safe. Expose whoever is bribing the Watch leadership.',
        sample_dialogue: '"I don\'t care who you work for. In this city, the law applies to everyone. Even you."',
        rumors: 'Some say Garin used to run with a thieves\' guild in his youth before going straight.',
        quests: 'Missing evidence from the Watch lockup. Someone on the inside is helping the Shadow Compact.' } },
    { campaign_id: cid, name: 'Lyra Moonwhisper', entity_type: 'npc',
      summary: 'An elven sage and archivist who has studied Aldenmoor\'s history for over two centuries. Knows secrets most have forgotten.',
      description: 'Lyra runs the Moonwhisper Archive in the Scholar\'s Quarter. She speaks slowly and precisely, choosing each word as if it were irreplaceable.',
      extraData: { race: 'Elf', class: 'Wizard', gender: 'Female', alignment: 'Neutral Good',
        appearance: 'Silver-haired, pale gold skin, robes covered in tiny embroidered runes. Always has ink-stained fingers.',
        traits: 'Measured, patient, occasionally cryptic. Dislikes being rushed.',
        motives: 'Preserve knowledge. Prevent the return of the Hollow Court.',
        sample_dialogue: '"The answer you seek is in the archive. Whether you are ready to hear it is another matter entirely."',
        rumors: 'Lyra was present during the Night of Falling Stars three hundred years ago. Some believe she caused it.',
        quests: 'Recover a stolen tome from the Shadow Compact. Translate the inscription in the Catacombs.' } },
    { campaign_id: cid, name: 'Malachai Voss', entity_type: 'npc',
      summary: 'A wealthy spice merchant whose legitimate business masks his role as the de facto leader of the Shadow Compact.',
      description: 'Malachai is charming, generous at dinner parties, and utterly ruthless in private.',
      extraData: { race: 'Human', class: 'Rogue', gender: 'Male', alignment: 'Lawful Evil',
        appearance: 'Lean, elegant, always immaculately dressed in dark burgundy. Grey at the temples. Warm smile that never quite reaches his eyes.',
        traits: 'Charming, patient, never raises his voice. Calls everyone "friend."',
        motives: 'Control the city\'s criminal network. Eventually replace the governor with himself.',
        sample_dialogue: '"I\'m a businessman, friend. I provide what people want. The law simply hasn\'t caught up with demand."',
        rumors: 'The Mayor has been seen leaving Voss\'s mansion late at night on multiple occasions.',
        quests: 'Linked to the Mayor\'s disappearance. Has a blackmail ledger that could destroy half the nobility.' } },
    // Locations
    { campaign_id: cid, name: 'City of Aldenmoor', entity_type: 'location',
      summary: 'A walled river city of 40,000 souls, famous for its spice trade and infamous for its politics.',
      description: 'Aldenmoor sits at the confluence of the Ash River and the Torrenfall, controlling trade routes between the northern mountains and the southern coast.',
      extraData: { location_type: 'City', region: 'Kingdom of Aldenmoor',
        atmosphere: 'Bustling river port. Smell of spices, river mud, and torch smoke. Constant sound of bells marking trade hours.',
        notable_features: 'The Ash Gate. The Grand Market. The River Docks. The Watch Tower.',
        inhabitants: 'Merchants, scholars, dockworkers, thieves, and a Watch stretched too thin.',
        secrets: 'A network of old smuggling tunnels runs beneath the Warrens, dating back to the city\'s founding.',
        hooks: 'A body was found in the Grand Market with a Shadow Compact tattoo burned off. Someone is cleaning house.' } },
    { campaign_id: cid, name: 'The Sunken Flagon', entity_type: 'location',
      summary: 'A tavern three steps below street level in the Warrens. The best ale in the city, no questions asked.',
      description: 'The Sunken Flagon smells of sawdust and stale beer and is somehow always warm. The owner keeps a crossbow under the bar and a strict no-violence policy.',
      extraData: { location_type: 'Building', region: 'The Warrens, Aldenmoor',
        atmosphere: 'Low ceilings, smoky lanterns, mismatched chairs. Dice games in the back. Always someone listening.',
        notable_features: 'The back room — available for private conversations, for a price.',
        secrets: 'The cellar connects to the old smuggling tunnels.',
        hooks: 'A Shadow Compact courier was seen leaving the back room with a sealed letter.' } },
    { campaign_id: cid, name: 'The Catacombs', entity_type: 'location',
      summary: 'Ancient burial tunnels beneath the city. Officially sealed. Unofficially very active.',
      description: 'The Catacombs were sealed by mayoral decree forty years ago. The decree did not stop the Shadow Compact from using the tunnels for meetings, storage, and worse.',
      extraData: { location_type: 'Dungeon', region: 'Beneath Aldenmoor',
        atmosphere: 'Damp stone, the smell of old bones, dripping water. Distant sounds that may be echoes.',
        notable_features: 'The Hall of Founders. The Deep Vault (Compact storage). The Inscription Wall.',
        secrets: 'The lowest level contains the sealed resting place of the Hollow Court.',
        hooks: 'The stolen tome Lyra wants was taken here.' } },
    { campaign_id: cid, name: 'Ironwatch Keep', entity_type: 'location',
      summary: 'The fortified headquarters of the City Watch, perched on a hill above the Upper City.',
      description: 'Ironwatch Keep was built to be impregnable and largely succeeded.',
      extraData: { location_type: 'Building', region: 'Upper City, Aldenmoor',
        atmosphere: 'Cold stone, echoing footsteps, the smell of oil and iron. Orderly. Tense.',
        notable_features: 'Garin\'s cluttered office. The evidence lockup (recently broken into). The bell tower.',
        secrets: 'Three Watch officers are on Voss\'s payroll.',
        hooks: 'Evidence from a Shadow Compact arrest has gone missing from the lockup. Inside job.' } },
    // Factions
    { campaign_id: cid, name: 'The City Watch', entity_type: 'faction',
      summary: 'Aldenmoor\'s law enforcement, underfunded and increasingly compromised.',
      description: 'The Watch numbers five hundred officers across the city. Garin commands them with integrity, but three of his senior officers take Compact coin.',
      extraData: { faction_type: 'Military / Law Enforcement', base: 'Ironwatch Keep',
        goals: 'Maintain order. Collect taxes. Keep the peace.',
        resources: 'City funding (insufficient). Ironwatch Keep. Legal authority.' } },
    { campaign_id: cid, name: 'The Shadow Compact', entity_type: 'faction',
      summary: 'Aldenmoor\'s criminal syndicate, hiding behind legitimate trade.',
      description: 'The Compact controls smuggling, extortion, and information brokerage across the city. Malachai Voss rebuilt it from a loose gang into a structured organization.',
      extraData: { faction_type: 'Criminal Syndicate', base: 'Voss Spice House (public). The Catacombs (private).',
        goals: 'Control city commerce. Place Voss in political power.',
        resources: 'Bribed officials. Smuggling tunnels. Considerable gold.' } },
    // Creatures
    { campaign_id: cid, name: 'Skeleton Warrior', entity_type: 'creature',
      summary: 'Animated bones of Aldenmoor\'s ancient defenders, still standing guard in the Catacombs.',
      description: 'These are not mindless undead — they retain tactical memory from their lives and fight with coordinated discipline.',
      extraData: { creature_type: 'Undead', cr: '1', size: 'Medium', ac: '13', hp: '13', speed: '30 ft.',
        ability_scores: 'STR 10, DEX 14, CON 15, INT 6, WIS 8, CHA 5',
        traits: 'Immune to poison and exhaustion. Darkvision 60 ft. Does not pursue beyond the Catacombs.',
        actions: 'Shortsword +4 to hit, 1d6+2 piercing.',
        tactics: 'Fight in coordinated pairs. One holds, one flanks.' } },
    { campaign_id: cid, name: 'Shadow Drake', entity_type: 'creature',
      summary: 'A shadow-touched drake nesting in the Catacombs\' deepest level.',
      description: 'The Shadow Drake arrived six months ago — the same time the Compact began using the lower tunnels.',
      extraData: { creature_type: 'Dragon (Shadow-touched)', cr: '4', size: 'Large', ac: '14', hp: '65', speed: '40 ft., fly 60 ft.',
        ability_scores: 'STR 16, DEX 12, CON 14, INT 8, WIS 10, CHA 10',
        traits: 'Shadow Stealth: advantage on Stealth in dim light. Resistant to necrotic damage.',
        actions: 'Bite +5, 2d6+3. Shadow Breath (recharge 5-6): 30-ft cone, 4d6 necrotic, DC 13 CON save for half.',
        tactics: 'Ambushes from darkness. Retreats to shadows if bloodied.' } },
    // Items
    { campaign_id: cid, name: 'Sword of the Aldenmoor Kings', entity_type: 'item',
      summary: 'A legendary longsword said to have been carried by Aldenmoor\'s first king. Recently surfaced in a Shadow Compact vault.',
      description: 'The blade is steel-grey with veins of silver that glow faintly in the presence of undead.',
      extraData: { item_type: 'Weapon', rarity: 'Legendary', attunement: 'Yes (lawful alignment)',
        properties: '+2 longsword. Extra 2d6 radiant vs undead. Once per day: Lay on Hands (level 10 paladin).',
        appearance: 'Silver-veined grey blade. River-and-tower pommel. Faintly warm to the touch.' } },
    { campaign_id: cid, name: 'Cloak of Shifting Shadows', entity_type: 'item',
      summary: 'A Compact assassin\'s tool — a cloak that drinks light and muffles sound.',
      description: 'The cloak looks like plain black wool until you notice it doesn\'t quite follow the light correctly.',
      extraData: { item_type: 'Wondrous Item', rarity: 'Uncommon', attunement: 'Yes', value: '500 gp',
        properties: 'Advantage on Stealth. Once per day: invisible until you attack (1 minute).' } },
    // Events
    { campaign_id: cid, name: 'The Night of Falling Stars', entity_type: 'event',
      summary: 'Three hundred years ago, stars fell on Aldenmoor for a single night. What caused it has never been confirmed.',
      description: 'Whatever it was, it coincided with the first sealing of the Hollow Court beneath the Catacombs.',
      extraData: { scale: 'World-Shaking', trigger: 'Unknown — possibly the ritual that sealed the Hollow Court',
        consequences: 'The founding families were decimated. The Hollow Court was sealed.',
        player_agency: 'Players can research this in Lyra\'s archive.' } },
    { campaign_id: cid, name: "The Mayor's Disappearance", entity_type: 'event',
      summary: 'Governor Pellin Strath vanished three days ago. The Watch has been told he is "on retreat." No one believes this.',
      description: 'Strath was last seen leaving Voss\'s mansion.',
      extraData: { scale: 'Regional', trigger: 'Strath apparently refused one of Voss\'s demands',
        consequences: 'Political vacuum. The Compact is moving quickly to fill it.',
        player_agency: 'Central to the current plot. Garin will ask the players to find the truth.' } },
    // Lore
    { campaign_id: cid, name: 'The Hollow Court', entity_type: 'lore',
      summary: 'An ancient dark power sealed beneath Aldenmoor three centuries ago. Not dead. Waiting.',
      description: 'The Hollow Court was a cabal of necromancers who sought to replace the living city with an undying one. The sealing is degrading.',
      extraData: { category: 'History', era: '300 years ago (and potentially now)',
        common_knowledge: 'Most people have heard the name as a children\'s ghost story.',
        secret_info: 'The seal weakens when necrotic magic is used near the Catacombs.',
        mechanics: 'If the seal breaks: undead rise across the Warrens. Stakes escalate dramatically.' } },
  ];

  const { data: entities, error: entitiesErr } = await supabase
    .from('world_entities')
    .insert(entityRows.map(e => stamp(e)))
    .select();

  if (entitiesErr || !entities) {
    return Response.json({ error: 'entities_insert_failed', detail: entitiesErr?.message }, { status: 500, headers: corsHeaders });
  }

  const byName: Record<string, string> = Object.fromEntries(entities.map((e: { name: string; id: string }) => [e.name, e.id]));

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const { error: sessionsErr } = await supabase
    .from('sessions')
    .insert([
      stamp({
        campaign_id: cid, session_number: 1, title: 'The Broken Wheel',
        date: '2026-01-10', status: 'debriefed',
        previous_session_recap: 'Our story begins.',
        strong_start: 'A cart has overturned in the Grand Market, spilling a crate of "spices" that turn out to be stolen Watch evidence. The crowd is gathering. A hooded figure is watching.',
        npc_ids: [byName['Captain Garin Ashhold']],
        planned_locations: [byName['City of Aldenmoor']],
        npc_notes: 'Garin is at the scene, furious and trying to keep order. He clocks the players immediately as capable.',
        location_notes: 'Grand Market — busy, chaotic, dozens of witnesses.',
        rumors: 'Word in the Warrens: someone paid good coin to cause that accident.\nA dockworker claims he saw Shadow Compact tattoos on the cart driver.',
        session_goals: [
          { text: 'Establish the party in Aldenmoor', completed: true },
          { text: 'Introduce Garin and the Watch', completed: true },
          { text: 'Plant seeds of the Compact\'s involvement', completed: true },
        ],
        summary: 'The party arrived in Aldenmoor and helped Garin recover stolen evidence — mostly. One crate was taken by a Compact runner before they could stop him.',
        next_session_primer: 'Garin will contact the party with a quiet request: find out who arranged the cart accident.',
      }),
      stamp({
        campaign_id: cid, session_number: 2, title: 'Shadows in the Market',
        date: '2026-01-24', status: 'debriefed',
        previous_session_recap: 'The party helped Captain Garin recover stolen Watch evidence from a staged accident in the Grand Market. One crate of evidence was taken by a Shadow Compact runner. Garin suspects an inside man.',
        strong_start: 'The party receives a folded note slipped under their door: "Sunken Flagon. After midnight. Come alone." It is not signed, but the paper smells faintly of expensive spices.',
        npc_ids: [byName['Malachai Voss'], byName['Lyra Moonwhisper']],
        planned_locations: [byName['The Sunken Flagon']],
        npc_notes: 'Malachai Voss makes his first appearance at the Flagon — relaxed, charming, apparently innocent.\nLyra sends a message through a street urchin inviting the party to her archive.',
        location_notes: 'The Sunken Flagon — ideal for private conversations and ambushes.',
        monster_notes: 'Two Compact enforcers follow the party from the Flagon. They are not subtle.',
        session_goals: [
          { text: 'Meet Malachai Voss', completed: true },
          { text: 'Visit Lyra\'s archive', completed: true },
          { text: 'Deal with Compact surveillance', completed: true },
          { text: 'Learn about the Hollow Court', completed: false },
        ],
        summary: 'Voss tried to hire the party as consultants. They declined. Lyra told them about the Hollow Court. Two Compact enforcers tailed them — one was captured and revealed a meeting in the Catacombs in three days.',
        next_session_primer: 'The Catacombs meeting. The Mayor\'s disappearance breaks publicly tonight. Garin needs the party NOW.',
      }),
      stamp({
        campaign_id: cid, session_number: 3, title: "The Mayor's Secret",
        date: '2026-02-07', status: 'planned',
        previous_session_recap: 'The party refused Voss\'s offer and gathered intelligence on a Compact meeting in the Catacombs. Lyra revealed the Hollow Court\'s seal is weakening. Governor Strath has now publicly disappeared.',
        strong_start: 'Garin hammers on the party\'s door at dawn. His face says everything before he speaks: "Strath is gone. I need you in those Catacombs before that meeting happens. Tonight."',
        npc_ids: [byName['Captain Garin Ashhold'], byName['Lyra Moonwhisper']],
        planned_locations: [byName['The Catacombs']],
        creature_ids: [byName['Skeleton Warrior'], byName['Shadow Drake']],
        planned_events: [byName["The Mayor's Disappearance"]],
        thread_ids: [byName['The Hollow Court']],
        npc_notes: '- Garin: desperate, trusting the party completely now. Provides Watch credentials for the Ash Gate.\n- Lyra: will meet them at the Catacomb entrance with a warding scroll.\n- Voss: not present, but his lieutenant Sera Dusk runs the Compact meeting.',
        monster_notes: '- 4× Skeleton Warriors (patrol the upper Catacombs)\n- Shadow Drake (nesting in the deep vault — may be avoided or fought)\n- Compact enforcers at the meeting (6, armed)',
        location_notes: 'The Catacombs: upper level (skeletons, old tombs), middle level (Compact operations), deep vault (Drake, the seal, the Governor).',
        rumors: "A Compact defector tells the party: Voss doesn't know the Drake is down there. His people are terrified of it.\nThe Governor is alive — being held as leverage over someone in the capital.",
        treasure_notes: '- Shadow Compact ledger (political dynamite)\n- Sword of the Aldenmoor Kings (in the deep vault)\n- Cloak of Shifting Shadows (on Sera Dusk)',
        session_goals: [
          { text: 'Enter the Catacombs', completed: false },
          { text: 'Disrupt the Compact meeting', completed: false },
          { text: 'Find Governor Strath', completed: false },
          { text: 'Discover the state of the Hollow Court seal', completed: false },
        ],
      }),
    ]);

  if (sessionsErr) {
    return Response.json({ error: 'sessions_insert_failed', detail: sessionsErr.message }, { status: 500, headers: corsHeaders });
  }

  // ── Relationships ────────────────────────────────────────────────────────────
  const relRows = [
    { campaign_id: cid, source_entity_id: byName['Captain Garin Ashhold'], target_entity_id: byName['Lyra Moonwhisper'], source_name: 'Captain Garin Ashhold', target_name: 'Lyra Moonwhisper', relationship_type: 'allied_with', description: 'Garin and Lyra have worked together quietly for years.', status: 'active', strength: 7, session_established: 1 },
    { campaign_id: cid, source_entity_id: byName['Malachai Voss'], target_entity_id: byName['The Shadow Compact'], source_name: 'Malachai Voss', target_name: 'The Shadow Compact', relationship_type: 'employed_by', description: 'Voss built the modern Compact from scratch and leads it absolutely.', status: 'active', strength: 10, session_established: 1 },
    { campaign_id: cid, source_entity_id: byName['Malachai Voss'], target_entity_id: byName['Captain Garin Ashhold'], source_name: 'Malachai Voss', target_name: 'Captain Garin Ashhold', relationship_type: 'enemy_of', description: 'Garin is the only Watch officer Voss cannot buy, blackmail, or remove.', status: 'active', strength: 8, session_established: 1 },
    { campaign_id: cid, source_entity_id: byName['Skeleton Warrior'], target_entity_id: byName['The Catacombs'], source_name: 'Skeleton Warrior', target_name: 'The Catacombs', relationship_type: 'located_in', description: 'The Skeleton Warriors have guarded the Catacombs since the founding.', status: 'active', strength: 9 },
    { campaign_id: cid, source_entity_id: byName['Shadow Drake'], target_entity_id: byName['The Catacombs'], source_name: 'Shadow Drake', target_name: 'The Catacombs', relationship_type: 'located_in', description: 'The Drake arrived six months ago, drawn by the weakening Hollow Court seal.', status: 'active', strength: 8, session_established: 2 },
    { campaign_id: cid, source_entity_id: byName['The Shadow Compact'], target_entity_id: byName['The City Watch'], source_name: 'The Shadow Compact', target_name: 'The City Watch', relationship_type: 'rivals', description: 'The Compact has three Watch officers on payroll but needs Garin gone to truly control the city.', status: 'active', strength: 8 },
    { campaign_id: cid, source_entity_id: byName['Lyra Moonwhisper'], target_entity_id: byName['The Hollow Court'], source_name: 'Lyra Moonwhisper', target_name: 'The Hollow Court', relationship_type: 'fears', description: 'Lyra witnessed the Night of Falling Stars and knows what the Hollow Court nearly achieved.', status: 'active', strength: 10, session_established: 2 },
    { campaign_id: cid, source_entity_id: byName['Sword of the Aldenmoor Kings'], target_entity_id: byName['The Catacombs'], source_name: 'Sword of the Aldenmoor Kings', target_name: 'The Catacombs', relationship_type: 'located_in', description: 'The Compact stored the Sword in the deep vault, not knowing its political significance.', status: 'active', strength: 6 },
  ];

  await supabase.from('relationships').insert(relRows.map(r => stamp(r)));

  // ── Random Tables ─────────────────────────────────────────────────────────────
  await supabase.from('random_tables').insert([
    stamp({ campaign_id: cid, name: 'Aldenmoor Street Encounters', description: 'Roll when the party lingers in the city streets.', category: 'encounters',
      entries: [
        { result: 'A Watch patrol stops to question the party — one officer looks nervous.' },
        { result: "A pickpocket tries her luck. She's a child. Her handler watches from across the street." },
        { result: 'A merchant argues loudly with a Compact debt collector. Bystanders give them both wide berth.' },
        { result: 'A street preacher declares the Hollow Court has returned. Most ignore him. One person does not.' },
        { result: 'Dockworkers carrying unmarked crates — Shadow Compact sigil barely visible on the wax seals.' },
        { result: '"Governor Strath is on retreat." Three people read the herald\'s notice and immediately leave.' },
        { result: "A stray cat drops a rolled-up piece of paper at the party's feet. It is a Compact cipher they can't read. Yet." },
        { result: 'Two off-duty Watch guards whisper urgently in an alley. They stop when they notice the party.' },
        { result: 'A beggar offers information about Compact movements — for a price. She seems to genuinely know something.' },
        { result: 'Quiet day. Nothing happens. This is suspicious.' },
      ] }),
    stamp({ campaign_id: cid, name: 'Aldenmoor NPC Names', description: 'Quick NPC name generator for city residents.', category: 'names',
      entries: [
        { result: 'Dara Kettwick' }, { result: 'Borvin Ashe' }, { result: 'Seraphine Dusk' },
        { result: 'Colt Maren' }, { result: 'Ilya Torrent' }, { result: 'Renn Coldwater' },
        { result: 'Mags Thornbury' }, { result: 'Feyn Ashlock' }, { result: 'Oswin Brackle' },
        { result: 'Cass Hallorin' }, { result: 'Petra Vane' }, { result: 'Dun Strickler' },
      ] }),
  ]);

  return Response.json({ success: true, campaign_id: cid }, { headers: corsHeaders });
});
