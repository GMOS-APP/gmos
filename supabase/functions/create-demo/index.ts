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

  const { data: existing } = await supabase.from('campaigns').select('id').eq('is_demo', true).limit(1);
  if (existing && existing.length > 0) {
    return Response.json({ message: 'demo_already_exists' }, { headers: corsHeaders });
  }

  const userId = user.id;
  const now = new Date().toISOString();
  const stamp = (obj: Record<string, unknown>) => ({ ...obj, created_by: userId, created_date: now, updated_date: now });

  const { data: campaignRows, error: campaignErr } = await supabase
    .from('campaigns')
    .insert([stamp({
      name: "The Warden's Last Night",
      description: "A one-shot adventure. The city has until midnight. The players have one chance to stop the binding from collapsing — if they can find the Seal, reach the Shrine, and perform a rite no one living has ever witnessed.",
      setting: 'The river city of Verath — a prosperous trade city built on an ancient bargain most citizens have forgotten.',
      current_session_number: 1,
      system: 'dnd5e',
      is_demo: true,
    })])
    .select();

  if (campaignErr || !campaignRows?.length) {
    return Response.json({ error: 'campaign_insert_failed', detail: campaignErr?.message }, { status: 500, headers: corsHeaders });
  }

  const cid = campaignRows[0].id;

  const entityRows = [
    { campaign_id: cid, name: 'Mira Ashcroft', entity_type: 'npc',
      summary: 'The last living Keeper — an elderly archivist who knows the Binding Rite but cannot perform it herself. The players are her only option.',
      description: 'Mira has spent fifty years maintaining records no one reads about a ritual no one believes in. Tonight, that changes. She is not calm. She is not patient. But she is precise, and precision is all she has left.',
      extra_data: { race: 'Human', class: 'Scholar (retired)', gender: 'Female', age: 'Late 70s', alignment: 'Lawful Neutral',
        appearance: 'Bone-thin, silver-haired, perpetually ink-stained fingers. Moves faster than anyone expects. Always carries a satchel of scrolls strapped diagonally across her chest.',
        traits: 'Corrects everyone — including herself. Speaks in lists. Cannot resist annotating things, even in emergencies.',
        motives: "Complete the Binding Rite before midnight. Prove the Keeper's Order was not a delusion. Die knowing the city is safe.",
        sample_dialogue: '"I need you to listen carefully, because I will not repeat myself and there is no time. One: the Seal is in the tower. Two: the tower has been raided. Three: if we do not have the Seal at the Shrine by midnight, Verath ceases to exist as you know it. Do you have questions? Do not have questions."',
        rumors: "Some in the Scholar's Quarter say Mira lost her mind years ago and her Order never existed. The city records, however, are missing exactly one page — the founding compact. Mira has the original.",
        quests: "Retrieve the Warden's Seal from the occupied tower. Deliver it to the Hollow Shrine via the Undercroft. Perform the Binding Rite using her cipher before the midnight toll." } },
    { campaign_id: cid, name: 'Dorin Vask', entity_type: 'npc',
      summary: "Ironhand Guild captain sent to secure the Warden's Tower and take the Seal. Professional, pragmatic, and open to a better offer — if the players can make one.",
      description: "Dorin has done worse jobs for less money. He does not know what the Seal is or why his employer wants it. He is not cruel. He is simply thorough.",
      extra_data: { race: 'Human', class: 'Soldier / Guild Captain', gender: 'Male', age: 'Mid 40s', alignment: 'True Neutral',
        appearance: 'Broad, scarred jaw, close-cropped grey hair. Wears battered half-plate with the Ironhand sigil — a closed fist — stamped on the left pauldron.',
        traits: 'Counts silently when waiting — you can see his lips move. Respects directness. Will not break a contract but is not above renegotiating one.',
        motives: 'Complete the job. Deliver the Seal. Keep his crew alive and paid.',
        sample_dialogue: '"You want me to walk away from a paid job on the word of an old woman and four strangers. Give me one reason that makes economic sense and we can talk."',
        rumors: "Dorin used to serve as a city guard before the leadership was replaced by people he couldn't work for.",
        quests: "Can be convinced to stand down with DC 15 Persuasion if players explain the stakes, or with 50gp equivalent, or by showing him a Veilborn Shade in person." } },
    { campaign_id: cid, name: 'The Hollow Warden', entity_type: 'npc',
      summary: "The spirit of Verath's first Warden, bound to the Hollow Shrine for three centuries. Fading. Patient. The last witness to the original Compact.",
      description: "The Hollow Warden is not a ghost — it is a record. A consciousness preserved specifically to witness the Binding Rite and confirm its completion. It has watched every rite for three hundred years.",
      extra_data: { race: 'Spirit (formerly Human)', class: 'Warden (ancient)', gender: 'Appears male', age: '300+ years', alignment: 'Lawful Good',
        appearance: 'A faint luminescence in the shape of a tall figure in formal armor. Eyes are solid silver. Leaves no shadow.',
        traits: 'Speaks only in past tense: "The rite was performed. The city stood." Cannot lie. Cannot act in the physical world. Grows dimmer as midnight approaches.',
        motives: 'Witness the Binding Rite. Confirm its completion to the Veilborn. Fade peacefully.',
        sample_dialogue: '"You carried the Seal. The cipher was read. The inscription was traced. I was a witness. The Compact held." (pause) "It was enough. It was always going to be enough."',
        rumors: "The Warden's name was never recorded — only the title. Mira believes this was intentional: the Veilborn Compact required the Warden to give up their name as part of the original agreement.",
        quests: "Cannot help in combat or traversal. At the Shrine, verifies the Seal and guides players through the rite. If completed correctly, speaks the closing words and vanishes permanently." } },
    { campaign_id: cid, name: 'The Ashcroft Archive', entity_type: 'location',
      summary: "Mira's home and library. Floor-to-ceiling shelves, poor lighting, the smell of old paper. Where the adventure begins.",
      description: "The Archive occupies the ground floor of a narrow building in the Scholar's Quarter. Three rooms: the library, the study, and the locked Keeper's vault containing the original Compact and the Cipher.",
      extra_data: { location_type: 'Building', region: "Scholar's Quarter, Verath",
        atmosphere: 'Warm candlelight, the smell of wax and old paper. Shelves packed so tightly that moving between them requires turning sideways.',
        notable_features: "Mira's annotated city map (marks the tower, Undercroft entrance, and Shrine). The Keeper's vault (DC 14 to open). A window facing the tower district.",
        inhabitants: 'Mira Ashcroft. No one else.',
        secrets: "The back room contains the original Veilborn Compact — a document that legally grants the city surface rights. If the Veilborn ever obtained it, they could use it as proof of breach.",
        hooks: 'The Cipher is here. The map is here. The briefing happens here. Mira will not let players leave without both.' } },
    { campaign_id: cid, name: "The Warden's Tower", entity_type: 'location',
      summary: "A stone tower in the Merchant Quarter — home of the Keeper's Order for two centuries, abandoned for thirty years, and currently occupied by Ironhand Guild enforcers.",
      description: "Four stories. Ground floor: Ironhand camp. Second floor: ransacked Keeper records. Third floor: ritual chamber (inscription circle still visible). Fourth floor: locked chest containing the Warden's Seal.",
      extra_data: { location_type: 'Tower', region: 'Merchant Quarter, Verath',
        atmosphere: 'Dust and old wood. Ironhand camp is efficient: no clutter, clear sight lines, one guard at every floor.',
        notable_features: "Ground floor camp (2 Enforcers + Dorin). The ritual chamber (DC 12 Arcana reveals binding magic). The locked chest on the roof (DC 16 Thieves' Tools or Dorin's key).",
        inhabitants: '6 Ironhand Enforcers total. Dorin Vask. One enforcer on the roof at all times.',
        secrets: "The chest is bolted to the floor — the Seal cannot be carried away quickly. The Keeper's Order designed it this way deliberately.",
        hooks: "The Seal is here. Dorin is here. Players can fight in, sneak in, or negotiate with Dorin directly." } },
    { campaign_id: cid, name: 'The Undercroft', entity_type: 'location',
      summary: "Ancient maintenance tunnels beneath Verath connecting the tower district to the Shrine. The fastest route — and the first place the binding starts to fail.",
      description: "The Undercroft was dug at the city's founding to give the Keeper a protected route to the Shrine. Not on any city map. As midnight approaches, Veilborn Shades begin seeping through the walls.",
      extra_data: { location_type: 'Underground Tunnel Network', region: 'Beneath Verath',
        atmosphere: 'Cold stone, ankle-deep water in the lower sections, the city above muffled to a hum. Walls marked with Keeper sigils that faintly glow — dimmer the further along you go.',
        notable_features: 'The Keeper sigils (trail marker, DC 10 Perception). The collapsed section (DC 13 Athletics or DC 12 Perception for bypass). Veilborn emergence cracks (hairline fractures where shadows pool).',
        inhabitants: 'Empty until the binding begins to fail. Then: Veilborn Shades emerging from the cracks.',
        secrets: "The Undercroft is technically Veilborn territory by the Compact terms — granted to the Keeper as right-of-passage only. Once the binding fails, the Shades are returning home, not trespassing.",
        hooks: 'Primary travel route to the Shrine. Contains Veilborn Shade encounters. Sigils serve as a countdown — each dark one means less time remaining.' } },
    { campaign_id: cid, name: 'The Hollow Shrine', entity_type: 'location',
      summary: "The chamber where the Binding Rite must be performed. The founding stone of Verath sits at its center. The Hollow Warden waits here.",
      description: "A circular chamber, thirty feet across, carved from bedrock. The floor is the full Veilborn Compact inscription. Center: a stone plinth with a circular depression exactly the size of the Warden's Seal.",
      extra_data: { location_type: 'Sacred Chamber / Dungeon', region: 'Deepest level of the Undercroft',
        atmosphere: 'Absolute silence. A faint silver light from the inscription — brighter when the Seal is present. Temperature drops noticeably at the entrance.',
        notable_features: 'The Compact inscription (unreadable without the Cipher). The stone plinth (Seal slots in with a click). The Hollow Warden (manifests when Seal is placed). Four anchor stones at cardinal points.',
        inhabitants: 'The Hollow Warden (appears when triggered). 1d4 Veilborn Shades if binding already failing on arrival.',
        secrets: "The Shrine is the physical lock. The founding stone IS the binding. Destroying it would void the Compact permanently — with no recourse. The Guild's unknown employer knows this.",
        hooks: "The final encounter. Place the Seal, read the Cipher, touch all four anchor stones, the Warden confirms. Or the players are too late and Shades are already here in force." } },
    { campaign_id: cid, name: "The Keeper's Order", entity_type: 'faction',
      summary: "An ancient order dedicated to maintaining the Veilborn Compact. Currently has one living member. Tonight is their last possible chance.",
      description: "Never more than five members at once, passing knowledge to a single successor each generation. The last succession failed eight years ago. Mira has been the sole Keeper since.",
      extra_data: { faction_type: 'Ancient Civic Order (nearly extinct)', base: 'The Ashcroft Archive (currently). Formerly: The Warden\'s Tower.',
        goals: 'Maintain the Binding Rite. Preserve the Veilborn Compact. Protect Verath by honoring the agreement — not by fighting.',
        structure: 'Traditionally: Head Keeper + 2-4 Initiates. Currently: Mira Ashcroft, alone.',
        resources: 'The original Veilborn Compact. The Cipher. Three centuries of annotated records. The Undercroft access route.',
        relationships: "No formal allies. City government forgot they existed two generations ago. The Veilborn recognize the Order's authority under the Compact — the only relationship that matters tonight.",
        joining: "Historically: chosen by Head Keeper, trained for years, bonded to the Shrine. Tonight: the players are as close to Keepers as anyone is going to get." } },
    { campaign_id: cid, name: 'The Ironhand Guild', entity_type: 'faction',
      summary: "A professional mercenary organization hired to secure the Warden's Tower and retrieve the Seal. They do not know why.",
      description: "The Ironhand Guild is legitimate, organized, and expensive. They do not ask questions about purpose — only parameters, timeline, and payment. Hired four days ago by an unnamed employer.",
      extra_data: { faction_type: 'Mercenary Organization', base: 'Guild hall in the Trade District. Currently deployed: The Warden\'s Tower.',
        goals: 'Complete the commission. Retrieve the Seal. Deliver to the designated drop point by dawn.',
        structure: 'Guild Director (unknown). Regional captains (Dorin Vask). Crews of 4-8 enforcers per captain.',
        resources: 'Trained soldiers. City connections. A reputation for reliability they protect fiercely.',
        relationships: 'Officially neutral with city government. Unknown employer for this job — unusual even for them.',
        joining: 'Application at any Guild hall. Physical trial, background verification, three-month probationary period.' } },
    { campaign_id: cid, name: 'Ironhand Enforcer', entity_type: 'creature',
      summary: 'A professional Ironhand Guild soldier. Trained, disciplined, and not personally invested in whatever this job turns out to be about.',
      description: 'Ironhand Enforcers are not thugs — they are soldiers who chose private employment. They follow orders, protect each other, and disengage when the risk exceeds the contract.',
      extra_data: { creature_type: 'Humanoid (Human)', cr: '1/2', size: 'Medium', ac: '14 (chain shirt)', hp: '16 (3d8+3)', speed: '30 ft.',
        ability_scores: 'STR 14 (+2), DEX 12 (+1), CON 12 (+1), INT 10 (+0), WIS 11 (+0), CHA 9 (-1)',
        saving_throws: 'STR +4, CON +3', skills: 'Athletics +4, Perception +2',
        traits: 'Pack Discipline: Advantage on attacks when an ally is adjacent to the target. Tactical Withdrawal: Disengages and calls out if reduced to 8 HP or fewer with no officer present.',
        actions: 'Shortsword: +4 to hit, 1d6+2 piercing. Hand Crossbow: +3 to hit, range 30/120 ft., 1d6+1 piercing. Shove (bonus action): DC 13 STR save or target knocked prone.',
        tactics: "Always fight in pairs — one engages, one flanks. Shout to alert others when players enter. Surrender or retreat if their captain is incapacitated.",
        loot: "Each carries 2d6 silver, standard mercenary kit. Dorin's key is on Dorin only." } },
    { campaign_id: cid, name: 'Veilborn Shade', entity_type: 'creature',
      summary: 'A shadow entity seeping through the Undercroft walls as the binding weakens. Not malicious — simply returning to where it belongs.',
      description: "Veilborn Shades are the original inhabitants of the space beneath Verath — displaced and bound. As the Compact erodes, they push through the cracks not from aggression but from pressure.",
      extra_data: { creature_type: 'Shadow Entity (Veilborn)', cr: '2', size: 'Medium', ac: '12', hp: '22 (4d8+4)', speed: '40 ft. (hover, ignores difficult terrain)',
        ability_scores: 'STR 6 (-2), DEX 16 (+3), CON 12 (+1), INT 4 (-3), WIS 10 (+0), CHA 14 (+2)',
        saving_throws: 'DEX +5, CHA +4', skills: 'Stealth +7',
        damage_vulnerabilities: 'Radiant',
        damage_immunities: 'Poison, Psychic',
        damage_resistances: 'Acid, Cold, Fire, Lightning, Thunder; nonmagical B/P/S',
        condition_immunities: 'Exhaustion, Frightened, Grappled, Paralyzed, Poisoned, Prone, Restrained',
        senses: 'Darkvision 120 ft., Passive Perception 10',
        traits: "Shadow Form: Move through any gap 1 inch wide without squeezing; invisible in dim light/darkness until it attacks. Incorporeal: Move through creatures and objects as difficult terrain (5 force damage if ends turn inside object). Binding Weakness: Cannot make attacks on its next turn if a character holding the Warden's Seal stands within 10 ft.",
        actions: "Chilling Touch: +5 to hit, 9 (2d6+2) cold damage. Target's Strength reduced by 1d4 until short rest; reduced to 0 = restrained. Umbral Surge (Recharge 5-6): Each creature within 10 ft. makes DC 13 CON save or is frightened until end of next turn.",
        tactics: "Target isolated characters. Use Shadow Form to attack through walls then retreat. Avoid the Seal bearer. Will attempt to extinguish light sources rather than attack directly if all characters carry radiant light.",
        loot: 'Nothing — dissolve into shadow when destroyed. Leave a Shadow Residue coin (15 gp to arcane dealers, absorbs 1 point of cold damage per day when carried).' } },
    { campaign_id: cid, name: "The Warden's Seal", entity_type: 'item',
      summary: 'An iron disc, roughly eight inches across, inscribed with the binding sigils of the original Compact. The physical key to the Hollow Shrine. The entire adventure turns on this object.',
      description: 'The Seal is heavier than it looks. The sigils are the actual text of the binding terms, compressed into a form the Veilborn can read as a contract. Without it, the rite cannot be performed.',
      extra_data: { item_type: 'Quest Item / Ritual Implement', rarity: 'Unique (Irreplaceable)', attunement: 'None required',
        value: 'No monetary value. Political and magical value: incalculable.',
        properties: "Holder has advantage on saves against Veilborn effects. Veilborn Shades cannot willingly move within 10 ft. of the bearer. When placed in the Shrine plinth, activates the inscription and summons the Hollow Warden. Cannot be destroyed by mundane means.",
        history: "Forged at the founding of Verath by the first Warden, whose name was given up as part of the Compact terms. Reused for every Binding Rite for three hundred years.",
        appearance: "A dark iron disc, eight inches across and half an inch thick. Front: dense script in a flowing angular language. Back: blank except for a single word in common — WITNESS. Warm to the touch even in cold environments." } },
    { campaign_id: cid, name: "Ashcroft's Cipher", entity_type: 'item',
      summary: "Mira's handwritten phonetic guide to the Binding Rite — the only way to correctly pronounce the Compact text during the ritual.",
      description: 'A single piece of vellum, folded three times, covered in Mira\'s handwriting. One side: phonetic transliteration of the rite. Other side: annotations and one note — "If you are reading this and I am not there — do exactly what it says. Do not improvise."',
      extra_data: { item_type: 'Ritual Document / Tool', rarity: 'Unique', attunement: 'None',
        value: "0 gp to anyone who doesn't know what it is. Priceless to anyone who does.",
        properties: 'Using the Cipher requires no skill check — follow the text and the rite completes. Without it: DC 18 Arcana. Failure = restart (costs 1 minute). Failure by 5+ = a Veilborn Shade is immediately summoned into the Shrine.',
        history: "Each Head Keeper maintained their own version. Mira's is the seventh. The previous six are in the Archive, labeled \"DO NOT USE — OUTDATED PRONUNCIATION.\"",
        appearance: 'Pale vellum, soft from decades of handling. Extremely small, extremely precise handwriting. Seventeen margin notes and two crossed-out sections.' } },
    { campaign_id: cid, name: 'The Guild Raid', entity_type: 'event',
      summary: "At dusk, the Ironhand Guild finishes securing the Warden's Tower. This is the window — before they find the chest on the roof.",
      description: "Dorin's crew moved in four hours before the players are briefed. By dusk they will have swept every floor and found the locked chest. They have sent a runner for bolt cutters — returning in two hours.",
      extra_data: { trigger: 'Dusk (approximately 2 hours after the adventure begins)', scale: 'Local',
        participants: 'Dorin Vask and 6 Ironhand Enforcers',
        description: 'If players arrive before the runner returns: 6 Enforcers + Dorin. If after: chest is open and Dorin is about to move. Social encounters become harder (DC +3) once he has the Seal.',
        consequences: "If players delay, the Seal leaves the tower and must be intercepted in the streets — more public and complicated.",
        player_agency: 'The timeline is pressure, not a trap. Players who move quickly have more options. The Seal is still retrievable either way.' } },
    { campaign_id: cid, name: 'The Midnight Toll', entity_type: 'event',
      summary: 'At midnight, the city bells ring and the binding fails. Veilborn Shades begin emerging throughout the Undercroft — and eventually the streets above.',
      description: "The Compact expires at midnight — the 300-year anniversary of its signing. As midnight approaches, Undercroft walls crack and sigils go dark. By 11:30, Shades are emerging.",
      extra_data: { trigger: "Midnight (the session's hard deadline)", scale: 'City-wide',
        participants: 'Veilborn Shades (unlimited). The Hollow Warden (begins to fade at 11:45).',
        description: 'Before 11:30: no Shades in the Undercroft. 11:30-11:59: 1d4 Shades per 10-minute period. After midnight without the rite: Shades emerge in the streets above. Warden fades to incoherence at 12:15 — after that, the rite cannot be performed.',
        consequences: 'Before midnight: full success, binding renews for a century. Between midnight and 12:15: partial success, binding renews but weaker. After 12:15: Compact is void. Bad ending.',
        player_agency: 'Players control their pace. Every scene should feel like it costs something. Mira knows how long each leg takes and will tell players if asked.' } },
    { campaign_id: cid, name: 'The Unwritten', entity_type: 'deity',
      summary: 'The civic deity of Verath — patron of oaths, contracts, and kept promises. Almost entirely forgotten. The Veilborn Compact was made in their name.',
      description: 'The Unwritten was never worshipped with statues or temples — only with signatures and witnesses. The founding Compact invoked their name as guarantor. Most citizens of Verath have never heard of them.',
      extra_data: { domains: 'Oaths, Contracts, Civic Foundation, Memory', alignment: 'Lawful Neutral',
        holy_symbol: 'A blank page with a single ink line at the bottom — the space for a signature that has not yet been filled.',
        worshipper_alignment: 'Lawful. Judges, clerks, diplomats, archivists — people who believe that words have binding weight.',
        tenets: "1. A promise spoken aloud is a contract with the divine. Break it at your peril.\n2. The written word outlasts the speaker. Treat every document as if it will be read in three hundred years.\n3. Witness everything. Refuse nothing that asks to be recorded.",
        clergy: "No formal clergy in centuries. The Keeper's Order functioned as their de facto priesthood, though they never used that framing. The Hollow Warden is the last being to have formally invoked The Unwritten in a sanctioned rite.",
        temples: "None standing. The Hollow Shrine predates the city and was not built for The Unwritten — but the Compact was sealed there, and the deity's name appears in the first inscription. Mira considers this the closest thing to a sacred site that still exists.",
        myths: "The oldest story: The Unwritten brokered the first agreement between humans and the beings who lived in the dark beneath the hills. Neither side trusted the other. The deity demanded both parties give something they could not take back — the humans gave their right to build alone, and the Veilborn gave their right to surface in daylight. The Unwritten has been silent since, waiting to see if either side would hold." } },
    { campaign_id: cid, name: 'Rooftop Standoff', entity_type: 'encounter',
      summary: "The locked chest containing the Warden's Seal sits bolted to the tower roof. One Ironhand Enforcer on guard. Dorin arrives at the start of Round 2 if the alarm has been raised.",
      description: "Four stories up, open air, city lights below. The chest is bolted into the stonework — it takes two rounds to cut the bolt with the right tools or DC 16 Thieves' Tools to pick the lock. The rooftop guard has a clear sightline in all directions and cannot be easily surprised.",
      extra_data: { difficulty: 'Medium',
        xp: '200 XP (1 Enforcer, CR 1/2) — or 0 XP if bypassed via stealth or negotiation before reaching the roof.',
        enemies: "1 Ironhand Enforcer on standard watch rotation. If alarm was raised on lower floors: Dorin Vask arrives at the start of Round 2. Remaining enforcers arrive in 3 rounds.",
        terrain: "Open rooftop, 30×30 ft., parapet walls 3 ft. high. No cover except the chest housing and a small guard box (three-quarters cover). Wind is strong — ranged attacks at disadvantage. A fall from the parapet is 40 ft. (4d6 bludgeoning).",
        tactics: "Enforcer shouts the moment players emerge from the stairwell — every Enforcer below hears it. If Dorin is already present (players delayed and he moved up): he does not attack unless players draw weapons first; he tries to negotiate from a position of strength. Remind players the chest is bolted — they cannot grab it and run.",
        read_aloud: "The rooftop is cold and open. The city spreads below in lamplight and shadow — you can see the Scholar's Quarter from here, and beyond it, the dark shape of the Undercroft entrance. In the center of the roof, bolted to the stonework, is an iron chest the size of a traveling trunk. A single Ironhand Enforcer stands beside it, crossbow on their back, watching the stairwell door you just came through.",
        treasure: "The Warden's Seal (quest item — the entire adventure). Enforcer's standard kit (2d6 silver). Dorin's key to the chest, on his person only — if he's present and stands down or is incapacitated." } },
    { campaign_id: cid, name: 'The Rendered Lantern', entity_type: 'shop',
      summary: "An alchemist's shop and curio dealer in the Scholar's Quarter. One of the few establishments open past nightfall. The owner knows Mira by name.",
      description: "A narrow shopfront lit by three hanging lanterns in the window, each a different color — the source of the name. Geb Mirault has run this shop for twenty-two years and knows everyone within six blocks.",
      extra_data: { shop_type: "Alchemist / Curio Dealer", price_modifier: "10% above standard. Geb knows what things are worth and does not pretend otherwise. Haggling accepted but rarely successful.",
        shopkeeper: 'Geb Mirault — a compact, precise man in his late fifties with ink-stained cuffs and the habit of completing customers\' sentences.',
        hours: "Dusk to the second bell past midnight. 'My customers keep late hours,' he says.",
        personality: "Incurious by policy — he has learned that knowing why someone needs something is bad for business and worse for sleep. Professionally warm. Will not ask what you need it for. Will ask if you have dealt with him before, because repeat customers get a discount.",
        inventory: "Alchemist's fire (50gp). Antitoxin (50gp). Healer's kit (5gp). Tinderbox (1sp). Torches ×10 (1sp). Lamp oil, 1 flask (1sp). Chalk ×10 (2cp). Blank vellum per sheet (3sp). Ink and pen set (2gp). Rope, hempen, 50 ft. (1gp). Manacles (2gp). Acid vial (25gp).",
        special_items: "Radiant oil (15gp) — burns with faint white light; counts as radiant damage for vulnerable creatures; 1 flask = 3 uses as a thrown weapon (1d4 radiant). Cold iron ball bearings (8gp) — treat as magical for incorporeal creatures. Keeper's candle (40gp, 1 in stock) — burns for exactly 1 hour, cannot be extinguished by wind or water; Geb does not know the provenance.",
        rumors: "Geb noticed the Ironhand Guild moving into the tower district four days ago — unusual. 'They asked about sight lines, not provisions. That felt different.' He also knows Mira: 'She came in two nights ago and bought every sheet of blank vellum I had. She looked frightened. I have never seen that before.'" } },
    { campaign_id: cid, name: "The Guild's Unknown Employer", entity_type: 'thread',
      summary: "Someone hired the Ironhand Guild to take the Warden's Seal at the worst possible moment. They knew the Seal existed, knew its location, and knew the Keeper's Order couldn't stop them.",
      description: "The commission was anonymous, paid at the Guild's highest anonymity tier. The Seal drop point is in the Warehouse District — no name, no representative listed. This was not opportunism. Someone planned it.",
      extra_data: { urgency: 'High', session_introduced: 'Session 1',
        situation: "The Ironhand Guild was hired on anonymous commission to secure the Warden's Tower and retrieve the Seal by dawn. The drop point is a warehouse in the Trade District. If Dorin held the Seal long enough to move it, it was left there. Whoever hired the Guild has not yet claimed it — or is waiting.",
        key_npcs: "Dorin Vask — knows the drop point address and commission parameters. Will share if players earned his trust, or if asked after the rite is complete.\nMira Ashcroft — suspects the new Harbor Authority (appointed 6 months ago) has been systematically removing references to the Compact from civic records. Coincidence or preparation?\nThe Hollow Warden — if players asked the right questions during the rite, it said: 'The Compact was read by more than one set of eyes this generation.' It did not say whose.",
        outcomes: "If investigated: the trail leads to a mid-level city official connected to a foreign trade consortium that wants the territory beneath Verath's dockyards — which is, technically, Veilborn land under the Compact terms.\nIf ignored: the next Binding Rite is in one year. There will be another attempt, and next time the employer will not use intermediaries.\nBest outcome: players expose the employer before they can act again, potentially compelling the city to restore the Compact to civic memory.",
        clues: "1. The drop point warehouse is registered to a shell company — tracing it takes one day and a DC 14 Investigation check, leading to a Harbor Authority functionary named Selt.\n2. Dorin's commission listed the exact weight and dimensions of the 'item.' That information is not in any public record — whoever wrote the brief had seen the Seal.\n3. Geb at the Rendered Lantern sold a translation guide to Veilborn script three weeks ago. The buyer paid in foreign coin and gave no name.\n4. The missing page from Verath's founding archive (the Compact summary) was not lost — Mira found the bind cut cleanly, recently, with a sharp blade." } },
    { campaign_id: cid, name: 'The Veilborn Compact', entity_type: 'lore',
      summary: "The founding agreement between Verath and the Veilborn — the shadow entities who inhabited the space beneath the hill before the city was built. Three hundred years old. Expiring tonight.",
      description: "When Verath's founders chose this site, they found the hill already occupied by presences in the dark that made construction impossible. Rather than fight, the first Warden negotiated. The Compact has held for three centuries because both sides honored it.",
      extra_data: { category: 'Founding History / Magical Law', era: '300 years ago — and tonight',
        common_knowledge: 'Essentially none. The Compact was classified as dangerous superstition and the records were sealed. Most citizens have never heard of it.',
        secret_info: "The Compact is real, legally binding by Veilborn law, and the Veilborn have honored every term for 300 years. They have never been the threat — they have been the patient other party. Tonight's crisis is entirely the result of human institutional failure.",
        discovery: 'Mira explains the basics in the briefing. The Cipher contains the full text. Players who read the Shrine inscription with the Cipher understand the full terms.',
        mechanics: "The Compact is a contract, not a spell. The Veilborn are bound by their own honor. Once the binding fails, they are not attacking — they are occupying territory that is legally theirs again. The players are not defeating the Veilborn; they are fulfilling an obligation to them." } },
  ];

  const { data: entities, error: entitiesErr } = await supabase
    .from('world_entities')
    .insert(entityRows.map(e => stamp(e)))
    .select();

  if (entitiesErr || !entities?.length) {
    return Response.json({ error: 'entities_insert_failed', detail: entitiesErr?.message }, { status: 500, headers: corsHeaders });
  }

  const byName: Record<string, string> = Object.fromEntries(entities.map((e: { name: string; id: string }) => [e.name, e.id]));

  await supabase.from('sessions').insert([stamp({
    campaign_id: cid, session_number: 1, title: "The Warden's Last Night",
    date: new Date().toISOString().split('T')[0], status: 'planned',
    previous_session_recap: "This is a one-shot. The players have no shared history yet — they are strangers about to become very familiar with each other under pressure. The only context they need: they are in Verath, it is early evening, and an old woman is about to change their night entirely.",
    strong_start: 'The players are in the Ashcroft Archive. Mira has already locked the front door. She is standing at her desk with a map, two folded scrolls, and the expression of someone who has rehearsed this speech for years and hoped she would never have to give it. "Sit down," she says, without looking up. "Not you — you, stand by the window and watch the tower. The rest of you sit." She begins: "The city of Verath exists because of an agreement. Tonight, that agreement expires. Here is what you are going to do about it."',
    npc_ids: [byName['Mira Ashcroft'], byName['Dorin Vask']],
    planned_locations: [byName['The Ashcroft Archive'], byName["The Warden's Tower"], byName['The Undercroft'], byName['The Hollow Shrine']],
    creature_ids: [byName['Ironhand Enforcer'], byName['Veilborn Shade']],
    planned_events: [byName['The Guild Raid'], byName['The Midnight Toll']],
    thread_ids: [byName['The Veilborn Compact'], byName["The Guild's Unknown Employer"]],
    npc_notes: "- MIRA: Starts frantic, becomes calmer as players demonstrate competence. Immediate goal in every scene: get the players moving faster. Quirk: instructions in numbered lists, corrects people mid-sentence.\n- DORIN: At the tower, his goal is to hold the Seal until delivery. He is a professional, not a fanatic. Quirk: counts silently when waiting (lips move). Stands down if: (a) DC 15 Persuasion + actual stakes explained, OR (b) 50gp equivalent offered, OR (c) shown a Veilborn Shade in person.\n- THE HOLLOW WARDEN: Appears only at the Shrine. Does not speak until the Seal is placed. Then confirms the rite, speaks the closing words, and fades. Quirk: past tense only. Do not break this — it is unsettling and it should be.",
    monster_notes: "- IRONHAND ENFORCERS (6 total): Pairs on each floor. Ground (2 + Dorin). Third floor ritual chamber (1). Roof (1). Not evil — don't play them as villains. If Dorin stands down, they all stand down immediately.\n- VEILBORN SHADES: Begin emerging at 11:30 PM. Use 1-2 at a time — they are terrifying, not a grind. Remind players the Shade avoids the Seal bearer. This is a hint and a tactical tool.",
    location_notes: "- ARCHIVE: Briefing scene. Mira gives Cipher and map. Let players ask questions — she answers precisely.\n- WARDEN'S TOWER: 4 floors, 6 enforcers, 1 captain. Combat, stealth, or negotiation. Chest on roof: DC 16 Thieves' Tools, or Dorin's key, or break lock (automatic but loud).\n- UNDERCROFT: Travel + mounting tension. Use sigil darkness as visual clock. One Shade encounter en route. Collapse: Athletics DC 13 or Perception DC 12 for bypass.\n- HOLLOW SHRINE: Place the Seal, read Cipher aloud, touch four anchor stones in order (Mira's map shows order). Warden appears. 3 rounds of reading, 1 minute total. Someone must protect the reader if Shades present.",
    rumors: "- From Mira: 'Dorin was hired four days ago. Someone knew the Seal would be unguarded. Someone knew the Warden was dead before his body was found.'\n- From a street contact: 'The Ironhand job came through anonymous commission — highest anonymity tier. The Guild doesn't know who hired them.'\n- From Dorin (if players earn his trust): 'My instructions said to hold the tower until dawn, then deliver to a drop point in the Warehouse District. No handoff person named. That's not standard. I noticed.'",
    treasure_notes: "- PHYSICAL: 6x Enforcer kit (2d6 silver each). 3x Shadow Residue fragments from destroyed Shades (15gp each to arcane dealers, absorbs 1 point cold damage/day when carried).\n- NARRATIVE: Mira's gratitude (no money, but she will answer any one question about Verath's history with complete honesty). Dorin's respect (if handled well, he'll reveal the Seal drop point — opening a future thread: who hired the Guild?). The Hollow Warden's final blessing in the Compact language: 'Their names are known to us. The city remembers its guardians.'",
    session_goals: [
      { text: "Retrieve the Warden's Seal from the occupied tower", completed: false },
      { text: 'Navigate the Undercroft to the Hollow Shrine', completed: false },
      { text: 'Perform the Binding Rite before midnight', completed: false },
      { text: '(Optional) Discover who hired the Ironhand Guild', completed: false },
    ],
    event_notes: "TIMELINE GUIDE:\n- Session start: ~8 PM in-game. Players have 4 in-game hours.\n- Archive briefing: 20-30 min game time.\n- Tower (negotiation/stealth/combat): 45-60 min game time.\n- Undercroft transit: 30-40 min + 1 Shade encounter.\n- Shrine ritual: 10-15 min.\n- Buffer: ~30 min. Players who move efficiently feel like heroes; players who delay feel the pressure.\n- Track time openly. Tell players when a bell rings in the distance. Let Mira glance at her pocket watch and say nothing.",
    thread_notes: "THE VEILBORN COMPACT — what players should understand by the end:\n1. The Compact is real. The Veilborn honored it for 300 years without fail.\n2. Tonight's crisis is not the Veilborn's fault — it is the city's institutional failure.\n3. The players did not defeat anything tonight. They fulfilled an obligation.\n4. Open thread: who hired the Guild to take the Seal? Why? What happens next year when the rite must be performed again and there is no Keeper?",
  })]);

  await supabase.from('relationships').insert([
    stamp({ campaign_id: cid, source_entity_id: byName['Mira Ashcroft'], target_entity_id: byName["The Keeper's Order"], source_name: 'Mira Ashcroft', target_name: "The Keeper's Order", relationship_type: 'member_of', description: 'Mira is the last living Keeper — sole member, sole authority, sole repository of three centuries of institutional knowledge.', status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Dorin Vask'], target_entity_id: byName['The Ironhand Guild'], source_name: 'Dorin Vask', target_name: 'The Ironhand Guild', relationship_type: 'employed_by', description: "Dorin is a senior captain. Twelve years with the Guild. This job is unusual but not unprecedented.", status: 'active', strength: 8 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Mira Ashcroft'], target_entity_id: byName['Dorin Vask'], source_name: 'Mira Ashcroft', target_name: 'Dorin Vask', relationship_type: 'rivals', description: 'Dorin has the Seal. Mira needs the Seal. They have never met. Tonight they will.', status: 'active', strength: 7 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Hollow Warden'], target_entity_id: byName['The Hollow Shrine'], source_name: 'The Hollow Warden', target_name: 'The Hollow Shrine', relationship_type: 'located_in', description: 'The Warden is bound to the Shrine and cannot manifest elsewhere. Has been here for 300 years.', status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Hollow Warden'], target_entity_id: byName["The Keeper's Order"], source_name: 'The Hollow Warden', target_name: "The Keeper's Order", relationship_type: 'allied_with', description: "The Warden was the first Keeper. It recognizes every successor. It has witnessed 299 successful rites and has been waiting for Mira to send someone.", status: 'active', strength: 9 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Ironhand Enforcer'], target_entity_id: byName["The Warden's Tower"], source_name: 'Ironhand Enforcer', target_name: "The Warden's Tower", relationship_type: 'located_in', description: 'Six Enforcers and Dorin Vask are occupying the Tower under Guild commission.', status: 'active', strength: 6 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Veilborn Shade'], target_entity_id: byName['The Undercroft'], source_name: 'Veilborn Shade', target_name: 'The Undercroft', relationship_type: 'located_in', description: "Shades emerge through the Undercroft walls as the binding weakens. The Undercroft is technically their territory.", status: 'active', strength: 8 }),
    stamp({ campaign_id: cid, source_entity_id: byName["The Warden's Seal"], target_entity_id: byName["The Warden's Tower"], source_name: "The Warden's Seal", target_name: "The Warden's Tower", relationship_type: 'located_in', description: 'Currently locked in a chest bolted to the tower roof.', status: 'active', strength: 7 }),
    stamp({ campaign_id: cid, source_entity_id: byName["The Keeper's Order"], target_entity_id: byName['The Ironhand Guild'], source_name: "The Keeper's Order", target_name: 'The Ironhand Guild', relationship_type: 'rivals', description: 'The Guild holds the Tower. The Order needs what is in it. They have approximately 4 hours to resolve this.', status: 'active', strength: 8 }),
    stamp({ campaign_id: cid, source_entity_id: byName["The Keeper's Order"], target_entity_id: byName['The Unwritten'], source_name: "The Keeper's Order", target_name: 'The Unwritten', relationship_type: 'allied_with', description: "The Order never called themselves priests, but they maintained the Compact in The Unwritten's name. The Hollow Warden performed every rite as a sacred obligation to the deity.", status: 'active', strength: 9 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Unwritten'], target_entity_id: byName['The Hollow Shrine'], source_name: 'The Unwritten', target_name: 'The Hollow Shrine', relationship_type: 'allied_with', description: "The Shrine predates the city. The Compact was sealed here in The Unwritten's name. Their name appears in the first inscription on the floor.", status: 'active', strength: 8 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Rooftop Standoff'], target_entity_id: byName["The Warden's Tower"], source_name: 'Rooftop Standoff', target_name: "The Warden's Tower", relationship_type: 'located_in', description: "The encounter takes place on the fourth-floor roof. The Seal chest is here. This is the objective of the tower sequence.", status: 'active', strength: 9 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Rendered Lantern'], target_entity_id: byName['The Ashcroft Archive'], source_name: 'The Rendered Lantern', target_name: 'The Ashcroft Archive', relationship_type: 'allied_with', description: "Geb and Mira are neighbors of twenty years. Not friends exactly — she finds him too incurious, he finds her too intense — but they look out for each other in small ways.", status: 'active', strength: 5 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Ironhand Guild'], target_entity_id: byName["The Guild's Unknown Employer"], source_name: 'The Ironhand Guild', target_name: "The Guild's Unknown Employer", relationship_type: 'employed_by', description: "The Guild was hired at the highest anonymity tier. Dorin knows the drop point address and that the item specs were unusually precise. He does not know who he is working for.", status: 'active', strength: 7 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Dorin Vask'], target_entity_id: byName["The Guild's Unknown Employer"], source_name: 'Dorin Vask', target_name: "The Guild's Unknown Employer", relationship_type: 'knows', description: "Dorin is the operational lead on this job and noticed the commission was unusual — anonymous client, precise item specs, no handoff contact. He may become an unwitting source of intelligence if players earn his trust.", status: 'active', strength: 6 }),
  ]);

  await supabase.from('random_tables').insert([
    stamp({ campaign_id: cid, name: 'Undercroft Complications', description: 'Roll when the players hit a slow point in the tunnels, or use to add pressure.', category: 'encounters',
      entries: [
        { result: 'A Keeper sigil on the wall goes dark as you watch. The one ahead flickers.' },
        { result: "The tunnel forks unexpectedly. Mira's map does not show this junction. (DC 11 Perception to find the right path; failure costs 10 minutes.)" },
        { result: 'Water is rising in the lower passage — up to the knee now. The collapsed section ahead is partially submerged.' },
        { result: 'Something is moving in the wall beside you. Tracking alongside. Not attacking. Waiting.' },
        { result: 'A distant bell. You count: ten. Forty minutes to midnight.' },
        { result: "The bearer of the Seal feels it grow warm in their hands. The Shade nearest the group hesitates." },
        { result: 'A crack in the wall exhales cold air and shadow. A Shade begins to push through — slowly, like smoke through a gap.' },
        { result: 'You find a Keeper lantern, still lit. Whoever passed through here recently left in a hurry.' },
        { result: 'The tunnel opens into a small chamber. On the wall: 299 Keeper signatures, one per year. The last line is blank.' },
        { result: 'Silence. Complete silence. Then, from far above: the first bell of midnight. You have less time than you thought.' },
      ] }),
    stamp({ campaign_id: cid, name: 'Ironhand Enforcer Personalities', description: 'Quick personality notes for individual Enforcers — for when players try to talk to them.', category: 'npcs',
      entries: [
        { result: 'Tomas — young, first big commission, clearly nervous. Will not disobey orders but can be distracted.' },
        { result: "Karren — veteran, skeptical of this whole job from the start, mutters about anonymous clients." },
        { result: 'Fen — quiet, efficient, does exactly what he is told and nothing else. Unmovable by persuasion.' },
        { result: 'Brix — chatty, friendly, absolutely will not help the players but genuinely feels bad about it.' },
        { result: "Sura — the runner. Not back yet with the bolt cutters. If encountered in the street: completely unaware of the stakes." },
        { result: "Callum — Dorin's second. Devoted to Dorin personally. Will follow Dorin's lead the instant Dorin makes a decision." },
      ] }),
  ]);

  return Response.json({ success: true, campaign_id: cid }, { headers: corsHeaders });
});
