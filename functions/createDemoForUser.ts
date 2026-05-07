// Village of Whitesparrow content adapted from Sly Flourish's Lazy GM's Resource Document
// (https://slyflourish.com/lazy_gm_resource_document.html), originally from Sly Flourish's
// Fantastic Adventures. Released under Creative Commons Attribution 4.0 International License.
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

  const { data: existing } = await supabase.from('campaigns').select('id').eq('is_demo', true);
  if (existing && existing.length > 0) {
    const ids = existing.map((r: { id: string }) => r.id);
    await supabase.from('world_entities').delete().in('campaign_id', ids);
    await supabase.from('sessions').delete().in('campaign_id', ids);
    await supabase.from('relationships').delete().in('campaign_id', ids);
    await supabase.from('quick_notes').delete().in('campaign_id', ids);
    await supabase.from('campaign_maps').delete().in('campaign_id', ids);
    await supabase.from('random_tables').delete().in('campaign_id', ids);
    await supabase.from('campaigns').delete().in('id', ids);
  }

  const userId = user.id;
  const now = new Date().toISOString();
  const stamp = (obj: Record<string, unknown>) => ({ ...obj, created_by: userId, created_date: now, updated_date: now });

  const { data: campaignRows, error: campaignErr } = await supabase
    .from('campaigns')
    .insert([stamp({
      name: "The Village of Whitesparrow",
      description: "A starter village nestled between mountains and swampland, serving as a home base for adventures in the surrounding valley. The village of five hundred souls is dominated by a titanic stone hand rising from the earth — a mystery no one has solved in generations — and overseen by a young lord, a seasoned sheriff, and an innkeeper with a rumored past.",
      setting: "The valley of Whitesparrow — a modest trade route settlement between eastern and western mountain ranges, with swampland and forest to the south. Population ~500. Two landmarks define the village at a glance: the old keep on the hill above and the enormous six-fingered stone hand rising from the village center.",
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
    // NPCs
    { campaign_id: cid, name: 'Sheriff Ruth Willowmane', entity_type: 'npc',
      summary: 'The true protector and unofficial leader of Whitesparrow. Thirty-five years of combined military and law enforcement experience. Tolerates adventurers as necessary evils.',
      description: "Ruth Willowmane has served the people of Whitesparrow for twenty years, after fifteen years as a soldier before that. She has a good heart and loves the people of the village, who always look to her when trouble arises. She typically has little patience for adventurers, seeing them as disruptive influences — and fearing the trouble they bring. But she understands that some threats require special skills, and she will work with those who prove themselves.",
      extra_data: {
        race: 'Human', class: 'Fighter (Veteran)', gender: 'Female', age: 'Middle-aged', alignment: 'Lawful Good',
        appearance: "Broad-shouldered and weathered, with close-cropped grey-streaked hair. Wears the sheriff's badge prominently and is always armed.",
        traits: "Direct to the point of bluntness. Keeps a mental list of every adventurer who has caused property damage in the village. Secretly proud when capable people get results.",
        motives: "Keep the village safe. Keep the peace. Keep adventurers from burning anything down.",
        sample_dialogue: '"You can help or you can leave. I don\'t have time for a third option. Which is it?"',
        resources: 'Eight full-time guards. Can conscript twelve additional guards when needed.',
        quests: "Will hire proven adventurers for threats her guards can't handle — strange activity near the cyclopean palm, monster sightings in the hills, or anything involving the keep's lower levels.",
      }
    },
    { campaign_id: cid, name: 'Lord Marlin Whitesparrow', entity_type: 'npc',
      summary: "Young lord of the village and surrounding lands. Inherited the keep at thirty. Well-respected but impatient with day-to-day governance.",
      description: "Lord Marlin Whitesparrow resides in the old castle above the village — an inheritance passed through his family for generations. Despite his young age, he is well-respected, though he has little patience for daily drudgery. He has adopted his young nephew Pennin as ward after the boy's parents died. If both Marlin and Pennin die without heirs, Sheriff Willowmane becomes elected leader of the village.",
      extra_data: {
        race: 'Human', class: 'Noble', gender: 'Male', age: 'Early 30s', alignment: 'Neutral Good',
        appearance: "Young for a lord, with dark hair and the sparrow sigil on his signet ring. Well-dressed but not ostentatious. Often found looking out from the keep's upper walls.",
        traits: "Decisive on large matters, easily bored by small ones. Genuinely cares about the village's future. Fond of his ward Pennin.",
        motives: "Protect the Whitesparrow name and lands. Find purpose beyond administering crop yields and trade disputes.",
        sample_dialogue: '"The keep\'s lower levels haven\'t been properly explored in my father\'s time, or his father\'s. I\'ve had reports. If you\'re willing to investigate, I\'m willing to pay."',
        rumors: "Some think Sheriff Willowmane would prefer to run the village herself. She'd deny it.",
        quests: "May hire adventurers to explore the keep's lower subbasements, deal with threats above the sheriff's guards' competence, or investigate the strange sounds coming from below.",
      }
    },
    { campaign_id: cid, name: 'Amanda Jess', entity_type: 'npc',
      summary: "Owner of both the Summerspring Inn and the Evershady Tavern. The dominant entrepreneur of Whitesparrow — and possibly a retired spy.",
      description: "Amanda Jess built the Evershady Tavern forty years ago and has since expanded to include the Summerspring Inn. She has three sons — Kinzlow, Balaham, and Wess — who work both establishments. Amanda has a gift for asking exactly the right questions to learn what she wants to know. Some whisper she was once a spy for a powerful organization before retiring to Whitesparrow.",
      extra_data: {
        race: 'Human', class: 'Rogue (retired)', gender: 'Female', age: 'Older (60s)', alignment: 'True Neutral',
        appearance: "Sharp-eyed and warm-smiled, with silver hair neatly pinned. Looks like everyone's favorite innkeeper. That's deliberate.",
        traits: "Always knows what question to ask. Never volunteers information without purpose. Protects Philcock Deadcleft for reasons she won't explain.",
        motives: "Run profitable businesses. Stay well-informed. Keep the village stable enough to profit from.",
        sample_dialogue: '"You\'ve been in Whitesparrow three days and you\'ve already visited the palm twice and asked Gavun about the hills to the south. What exactly are you looking for?"',
        rumors: "Several merchants claim Amanda knew things about them before they'd introduced themselves. She always laughs this off.",
        quests: "Occasionally gives work to discreet people — retrieving something she's owed, tracking where a specific traveler went, or learning the source of a rumor.",
      }
    },
    { campaign_id: cid, name: 'Gavun Grayhorn', entity_type: 'npc',
      summary: "Former adventurer turned outfitter. The last survivor of his party — killed his dragon, retired, and has been trying to recover his companions' remains ever since.",
      description: "Gavun once traveled far and wide but fortune always eluded him. When one adventure left him the only survivor, he took bloody revenge on the black dragon responsible — feeding it a dead yak concealing six pots of alchemist's fire — then retired. He runs Grayhorn Outfitters with his wife Arianne. The dragon's lair still holds his companions' remains and equipment, now occupied by new monsters he has never had the courage to face alone.",
      extra_data: {
        race: 'Human', class: 'Fighter (retired adventurer)', gender: 'Male', age: 'Middle-aged', alignment: 'Neutral Good',
        appearance: "A big man gone slightly soft, with a grey-streaked beard and hands that still move like a fighter's. The horns of a black dragon hang above his shop door.",
        traits: "Self-deprecating about his adventuring career but deeply competent when pressed. Knows the surrounding wilderness better than anyone alive. Loves his wife.",
        motives: "Run a good shop. Help travelers survive. Eventually recover his companions' remains from the dragon's lair.",
        sample_dialogue: '"Those horns? Found \'em in the woods. Attached to an... herbivore." (He says this every time. He expects no one to believe it.)',
        rumors: "The dragon's lair is about a day's travel into the hills. Gavun knows exactly where it is. He has never been back.",
        quests: "Will quietly hire adventurers to recover the remains and gear of his former companions from the old dragon's lair. Warns them something new has moved in.",
      }
    },
    { campaign_id: cid, name: 'Elovyn Sorrowsong', entity_type: 'npc',
      summary: "Elf priest of the Temple of Light, exiled to a century-long pilgrimage. Resents her banishment; loves the village she landed in. Fiercely guards her status as Whitesparrow's only elf in authority.",
      description: "Elovyn found herself out of political favor in her homeland and was sent on a one-hundred-year pilgrimage. Though she resents it, she has come to deeply care for the village's people. She greatly enjoys the authority that comes with being Whitesparrow's only elf in a position of power — and is initially distrustful of any other elves who visit, afraid they will undermine her mystique.",
      extra_data: {
        race: 'Elf', class: 'Cleric (Light domain)', gender: 'Female', age: 'Ancient (appears 40s)', alignment: 'Neutral Good',
        appearance: "Tall and silver-haired, with the unhurried movements of someone who measures time in centuries. Wears her order's robes with local embroidery added over the decades.",
        traits: "Speaks of her homeland with studied neutrality. Knows far more about the temple's history than she admits. Deeply suspicious of other elves.",
        motives: "Serve the village. Guard the temple's secrets. Wait out her pilgrimage without losing herself.",
        sample_dialogue: '"The orb has been here longer than the temple. It will be here after both of us are dust. Do not touch it."',
        rumors: "Four years ago, a thief touched the orb and vanished entirely. Elovyn has a theory about where they went but won't share it easily.",
        quests: "May ask adventurers to investigate the collapsed catacombs beneath the temple, or to retrieve an item from her homeland she cannot seek herself.",
      }
    },
    { campaign_id: cid, name: 'Philcock Deadcleft', entity_type: 'npc',
      summary: "Manager of the Summerspring Inn and Amanda Jess's protected spy. Small, malodorous, always eavesdropping. Amanda's reasons for keeping him are unknown.",
      description: "Philcock Deadcleft is a small, ugly rumormonger who spies on the inn's patrons and reports to Amanda Jess. He wears clothes of noble cut but in poor condition and always smells terrible. For reasons no one understands, Amanda has always protected and defended him despite his obvious flaws.",
      extra_data: {
        race: 'Human', class: 'Spy (Rogue)', gender: 'Male', age: 'Indeterminate', alignment: 'True Neutral',
        appearance: "Small, pinched face, ill-fitting noble clothes in poor condition. The smell arrives before he does.",
        traits: "Knows every secret whispered in the inn. Will not volunteer information but can be bribed. Scrambles away from confrontation.",
        motives: "Stay employed. Stay protected. Collect information. Avoid anything dangerous.",
        sample_dialogue: '"I didn\'t hear anything. I never hear anything. You should ask someone else." (He heard everything.)',
        rumors: "Some think Deadcleft has leverage over Amanda. Others think Amanda uses him as a cutout she can discard if needed.",
        quests: "Information source if players can get him alone with security or coin. Knows the business of every guest who has stayed in the inn for the past twenty years.",
      }
    },

    // Locations
    { campaign_id: cid, name: 'The Cyclopean Palm', entity_type: 'location',
      summary: "A titanic six-fingered hand of smooth black stone rising forty feet from the village center. Age unknown. Origin unknown. Purpose unknown. Excavators keep having nightmares.",
      description: "A great hand carved of smooth black stone rises in the center of the village, its palm facing the sky and its thumb and five fingers splayed out. Deep clefts confirm it is attached to a forearm descending far beneath the ground. Its stone is impervious to damage and resembles no local rock. Previous excavation crews abandoned their work when they began experiencing nightmares of strange buzzing sounds.",
      extra_data: {
        location_type: 'Landmark / Mystery', region: 'Village center, Whitesparrow',
        atmosphere: "The shadow of the palm falls across the tavern and market square. Up close the stone is unnervingly smooth and cool regardless of weather.",
        notable_features: "Old rope ladders descending ~100 ft into excavation clefts around the wrist. A rumored hollow staircase inside the wrist itself. Stone impervious to all damage.",
        inhabitants: 'No permanent inhabitants. Locals give the base a wide berth after dark.',
        secrets: "A persistent rumor: the wrist is hollow, with a carved staircase inside leading to a chamber said to be the boundary between two worlds. Most dismiss this. The consistent nightmares of excavation crews suggest otherwise.",
        hooks: "Investigating the palm is a session hook in itself. What is the arm attached to? Who built it? What do the nightmares mean? What — if anything — is in the hollow wrist?",
      }
    },
    { campaign_id: cid, name: 'The Evershady Tavern', entity_type: 'location',
      summary: "Built under the cyclopean palm's perpetual shadow. Circular bar around the stone wrist. The spiced lamb stew is famous for miles — some think the palm's proximity is part of the recipe.",
      description: "Underneath the great palm rests the building and outdoor eatery that is the Evershady Tavern. A half-circle bar has been built around the wrist of the upthrust hand, and numerous tables rest beneath the shade of the palm. Ropes and nets filled with foodstuffs hang from the hand's splayed fingers. Built by Amanda Jess forty years ago.",
      extra_data: {
        location_type: 'Tavern', region: 'Village center, under the Cyclopean Palm',
        atmosphere: "Perpetual comfortable shade. The smell of spiced lamb stew. Regulars who've been coming for decades sit beside travelers who arrived today.",
        notable_features: "The circular bar around the palm's wrist. Vast cellars below (dug out by failed excavations — found nothing but bankruptcy and madness). The secret spiced lamb stew recipe.",
        inhabitants: "Amanda's sons Kinzlow, Balaham, and Wess run day-to-day operations. Amanda visits daily.",
        secrets: "The cellars extend further than the building's footprint. Some old digging tools are still down there. The stew recipe may genuinely be influenced by the palm — no one has proved it isn't.",
        hooks: "Primary hub for local rumors. The cellar excavations may connect to deeper tunnels. Any significant event in Whitesparrow ends with news reaching the Evershady.",
      }
    },
    { campaign_id: cid, name: 'The Summerspring Inn', entity_type: 'location',
      summary: "A tilting two-story inn on hot springs that are slowly rotting it from below. Rumored caverns underneath hold gems, relics, and horrors.",
      description: "The inn sits slightly askew, supported at its corners by heavy beams. The hot springs on which it sits are also the cause of its slow demise — the continual humidity has rotted much of the wood, and maintenance is a constant endeavor. The lower rooms have private stone hot baths, fed by the slightly sulfuric springs. Some springs have gone dry, leaving caverns below that have never been fully explored.",
      extra_data: {
        location_type: 'Inn', region: 'Whitesparrow village',
        atmosphere: "The faint smell of sulfur under candles and woodsmoke. Constant creaking when the wind blows. Running water always audible from below.",
        notable_features: "Private hot spring baths in lower rooms. Unexplored cavern network below (accessible through collapsed floor in back storeroom). Perpetual structural maintenance.",
        inhabitants: "Managed by Philcock Deadcleft. Owned by Amanda Jess. Her sons work here as needed.",
        secrets: "The dry spring caverns may connect to the same network as the Cyclopean Palm's excavation tunnels. Deadcleft knows about a passage he's never told Amanda about.",
        hooks: "Adventure hooks: explore the caverns, discover what dried the springs, find the rumored gemstone deposits — or whatever the rumored horrors are.",
      }
    },
    { campaign_id: cid, name: 'Grayhorn Outfitters', entity_type: 'location',
      summary: "Shop and stables run by retired adventurer Gavun Grayhorn. Black dragon horns above the door. Full adventuring gear. The owner knows the surrounding wilderness better than anyone.",
      description: "A cluttered mess of a shop holding all forms of tack and equipment, including adventuring and exploration gear. A pair of huge black horns protrudes from above the heavy wooden door — which Gavun claims he found attached to 'some unknown herbivore.' One side features stables with twelve stalls. Gavun runs the shop with his wife Arianne.",
      extra_data: {
        location_type: 'Shop / Stables', region: 'Whitesparrow village',
        atmosphere: "Organized chaos — if Gavun needs something, he can find it in thirty seconds.",
        notable_features: "The black dragon horns above the door. Twelve-stall stable. A back room with personally annotated maps of the surrounding region.",
        inhabitants: 'Gavun Grayhorn and his wife Arianne.',
        price_modifier: 'Standard. 10% discount for people Gavun likes, which is most people.',
        inventory: "Standard adventuring gear. Arms and armor (reluctantly). Annotated regional maps (free, but he'll quiz you about where you're going). Trail rations, rope, climbing gear, lanterns, oil.",
        secrets: "The dragon horns are from the black dragon that killed Gavun's companions. His annotated maps include the lair's location, marked only with an unlabeled 'x'.",
        hooks: "Best source of regional knowledge in the village. Gavun will quietly inquire if adventurers are looking for work — specifically, recovering his companions' remains from the dragon's lair.",
      }
    },
    { campaign_id: cid, name: 'The Temple of Light', entity_type: 'location',
      summary: "An ancient open-air elven temple with a mysterious floating orb at its center. The last person who touched the orb disappeared without trace. Unexplored catacombs below.",
      description: "Once an elven site, abandoned when the elves left and now tended by Elovyn Sorrowsong. The central nave is open to the sky, with five ancient statues of elves with arms raised. A scintillating orb hovers in midair at the center. Stone pews ring a warm-water fountain beneath the orb. A collapsed storeroom floor leads into catacombs last explored centuries ago.",
      extra_data: {
        location_type: 'Temple / Dungeon entrance', region: 'Whitesparrow village',
        atmosphere: "Serene and slightly unsettling. The orb's light shifts color continuously. The fountain water is warm.",
        notable_features: "The floating scintillating orb (do not touch). Five ancient elf statues with arms raised. The central warm fountain. Collapsed storeroom floor to the catacombs below.",
        inhabitants: "Elovyn Sorrowsong. Her residence is the small decorated house adjacent to the temple.",
        secrets: "Four years ago, a thief touched the orb and vanished entirely — no trace, no body. Elovyn has a theory about where they went. The catacombs below connect to something older than the temple.",
        hooks: "The orb is an unsolved mystery. The catacombs are an unexplored dungeon. Elovyn may ask adventurers to investigate the collapse — or to find where the thief went.",
      }
    },
    { campaign_id: cid, name: 'Whitesparrow Keep', entity_type: 'location',
      summary: "The oldest non-temple structure in the village. Three stories above ground, numerous subbasements descending into the rocky hill. The lower levels haven't been fully explored in generations.",
      description: "A switchback cobblestone road leads up to the courtyard of Whitesparrow Keep, which stands atop a rocky hill above the village. A still pool at the center holds a granite sparrow statue, and dozens of birds drink and splash from it. The keep stands three stories tall with square turrets. Numerous subbasements descend into the rocky hill below — most haven't been explored for hundreds of years.",
      extra_data: {
        location_type: 'Castle / Dungeon entrance', region: 'Hill above Whitesparrow',
        atmosphere: "The panoramic view of the valley from the top floor is genuinely beautiful. The lower you go, the colder and darker it gets.",
        notable_features: "The courtyard pool and sparrow statue with its resident bird colony. Three stories of occupied keep. Unknown number of subbasement levels descending into bedrock.",
        inhabitants: "Lord Marlin Whitesparrow. His ward Pennin. A staff of roughly a dozen.",
        secrets: "The lowest subbasement levels have not been catalogued. Something has moved there recently — Lord Marlin has heard sounds and has not gone to investigate.",
        hooks: "Lord Marlin will hire reliable people to map and clear the keep's lower levels. He suspects whatever is down there is connected to the valley's deeper history.",
      }
    },

    // Item
    { campaign_id: cid, name: 'The Floating Orb', entity_type: 'item',
      summary: "A scintillating sphere hovering in the Temple of Light's nave. Origin unknown. The last person who touched it vanished without a trace four years ago.",
      description: "The orb has been present in the temple for as long as anyone can remember. It glows with shifting colors and hovers at roughly chest height in the open-air nave. Four years ago, a thief touched it with her fingertips and disappeared. No trace was ever found. Elovyn refuses to discuss it in detail.",
      extra_data: {
        item_type: 'Artifact (Unknown)', rarity: 'Unique', attunement: 'Unknown — possibly lethal',
        value: 'Incalculable. Impossible to safely transport.',
        properties: "Hovering, self-illuminating, shifts through all visible colors. Cannot be extinguished. Impervious to damage. Touching it causes teleportation to an unknown destination — or possibly annihilation.",
        history: "Predates the temple itself. The elves built the temple around it, not the other way around. No record of its origin exists in Elovyn's archive.",
        appearance: "A perfect sphere, roughly the size of a grapefruit, hovering at chest height. The light it casts makes everything nearby look slightly unreal.",
        hooks: "Where did the thief go? What is the orb's origin? Is there a way to safely interact with it? Elovyn knows more than she says.",
      }
    },

    // Faction
    { campaign_id: cid, name: "Sheriff's Guard", entity_type: 'faction',
      summary: "Whitesparrow's law enforcement, loyal to Sheriff Willowmane. Eight full-time guards plus twelve conscripts available in emergencies.",
      description: "The Sheriff's Guard keeps order in the village and patrols surrounding roads. They are competent against bandits and minor monsters but not equipped for the deeper threats that occasionally emerge from the hills, the keep's subbasements, or the cyclopean palm's excavations.",
      extra_data: {
        faction_type: 'Law Enforcement', base: "The sheriff's office adjacent to the village square.",
        goals: 'Maintain order. Protect the village. Keep the peace without escalation.',
        structure: 'Sheriff Willowmane commands. Eight full-time guards on patrol rotations. Twelve conscripts with 24 hours notice.',
        resources: 'Standard arms and armor. Legal authority in the village and surrounding lands. The goodwill of most villagers.',
        relationships: "Reports nominally to Lord Marlin but operates independently. Respectful professional relationship with Elovyn. Cautious working relationship with Amanda Jess.",
        joining: 'Open to qualified candidates. Ruth interviews everyone personally. She has a long memory for both loyalty and failure.',
      }
    },

    // Threads
    { campaign_id: cid, name: 'The Mystery of the Cyclopean Hand', entity_type: 'thread',
      summary: "The six-fingered stone hand at the village center is older than the village — possibly the region. No one knows what it is, what it's attached to, or why excavators keep having nightmares.",
      description: "The arm descends at least a hundred feet below the village. The stone is impervious to damage and unlike any local rock. Previous excavation crews abandoned work reporting nightmares of buzzing sounds. A persistent rumor holds that the wrist is hollow, containing a carved staircase that descends to a chamber described as the boundary between two worlds.",
      extra_data: {
        urgency: 'Low (long-standing mystery)', session_introduced: 'Session 1',
        situation: "The hand has stood here longer than the village. No serious investigation has succeeded — all ended in bankruptcy, madness, or abandonment. The nightmares are consistent across all excavation accounts: a deep buzzing sound, something watching, and the sensation of tremendous weight above.",
        key_npcs: "Sheriff Willowmane — has the old excavation reports locked up. Elovyn Sorrowsong — knows the elves who built the temple also knew about the hand; won't discuss it without trust. Amanda Jess — has purchased three 'fake maps' showing the hollow wrist location; she does not think they're all fake.",
        outcomes: "If the wrist staircase is real and found: a chamber described as 'the boundary between two worlds' awaits. If players investigate without finding it: they earn local reputation as serious people and Elovyn becomes more forthcoming. If word gets out they're investigating: outside parties who have been quietly watching Whitesparrow take notice.",
        clues: "1. The excavation clefts around the wrist have rope ladders descending to the wrist level — where a thin seam in the stone suggests a door or panel. 2. Nightmares only affect people digging near the wrist, not at the finger-base. 3. Elovyn's private notes (findable but not shared) reference the hand in the same breath as the orb. 4. Amanda keeps a false-bottomed drawer with three purchased maps, all showing slightly different locations for the 'hollow wrist entrance.'",
      }
    },
    { campaign_id: cid, name: "Gavun's Dragon Lair", entity_type: 'thread',
      summary: "A black dragon's lair a day's travel into the hills holds the remains of Gavun's murdered companions — and now also holds whatever moved in after the dragon died.",
      description: "Gavun killed the black dragon that slaughtered his companions by feeding it a dead yak stuffed with alchemist's fire. He retired immediately after and has never returned. His companions' remains and gear are still in the lair, now occupied by new monsters he cannot face alone and has never been able to hire reliable help to deal with.",
      extra_data: {
        urgency: 'Medium (personal, not time-sensitive)', session_introduced: 'Session 1',
        situation: "The lair is about a day's travel south and east into the foothills. Gavun has the precise location in his annotated maps. He will share it with adventurers he hires specifically for this task. Something else lives there now — he has heard reports from travelers but doesn't know what it is.",
        key_npcs: "Gavun Grayhorn — primary quest giver. Offers his best gear at cost plus 100gp for recovery of his companions' remains and personal effects. Lord Marlin — aware the old lair exists; may have his own reasons to want it cleared.",
        outcomes: "Success: Gavun is quietly, permanently grateful. Gives players his annotated regional maps and 20% off for life. Has a small private memorial for his companions he'll tell players about — but only after. The lair may contain something of broader significance. Failure: Gavun accepts it professionally and never mentions it again.",
        clues: "1. The black dragon horns above Gavun's door are obviously not from an herbivore — any player with Nature training knows immediately. 2. His wife Arianne will quietly tell players (when Gavun isn't listening) that he goes silent every anniversary of the day his friends died. 3. One map on the wall of Grayhorn Outfitters has a location marked only with a small unlabeled 'x'.",
      }
    },
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
    campaign_id: cid, session_number: 1, title: "Arrivals in Whitesparrow",
    date: new Date().toISOString().split('T')[0], status: 'planned',
    previous_session_recap: "The players are new to Whitesparrow. They have no shared history with the village yet — they are travelers, wanderers, or people who have heard the valley settlement is a good place to resupply and ask questions. The only context they need: they have just arrived.",
    strong_start: "The players arrive at the Evershady Tavern at dusk — the best place in Whitesparrow to get food, drink, and information. The enormous stone hand rises above the building, its shadow falling across their table. Before the players have finished their first drink, at least one of the following happens: Philcock Deadcleft creeps past to eavesdrop on the next table, Amanda Jess sits down uninvited and starts asking questions she has no right to know the answers to, or the sheriff walks in looking for someone who is definitely not the players — and gives them a long, measuring look on her way past.",
    npc_ids: [byName['Sheriff Ruth Willowmane'], byName['Amanda Jess'], byName['Philcock Deadcleft']],
    planned_locations: [byName['The Evershady Tavern'], byName['The Summerspring Inn'], byName['Grayhorn Outfitters']],
    planned_events: [],
    thread_ids: [byName['The Mystery of the Cyclopean Hand'], byName["Gavun's Dragon Lair"]],
    npc_notes: "- RUTH: Not in the tavern to meet adventurers. She's working. She'll warm up only if players demonstrate they're capable and not going to break anything.\n- AMANDA: Warm and perceptive. She already knows more about the players than they've told her. Drops a hook: 'You look like the sort of people who find things. Gavun mentioned he was looking for that sort of person.'\n- PHILCOCK: Avoid eye contact, smell bad, scurry away if addressed directly. Knows everything. Will share if alone and bribed.",
    location_notes: "- EVERSHADY TAVERN: The hub. Introduce the palm overhead — it's impossible to ignore. The tavern is built around its wrist. Knock something off a shelf with it if players look unimpressed.\n- SUMMERSPRING INN: Where players likely stay. The hot baths are a genuine selling point. The creaking is unsettling. The smell of sulfur is subtle but present.\n- GRAYHORN OUTFITTERS: Gavun is chatty if asked about the region. He does not bring up the dragon lair himself on first meeting — wait for a second visit or a direct question about the horns.",
    rumors: "- From a tavern regular: 'The excavators who tried to dig out the palm's wrist back in the spring — three of them won't sleep in a room with a window anymore. Won't say why.'\n- From Philcock (if bribed): 'Lady Jess bought three maps last month. Maps to the same place, three different sellers. She put them all in that drawer of hers. I've seen her look at them when she thinks no one's watching.'\n- From Gavun (after some time): 'There's an old lair in the hills. Dragon's dead — I know because I killed it. But something moved in. If you were the type to go look, I might be able to make it worth your while.'",
    monster_notes: "No combat this session unless players go looking for it. The threats in Whitesparrow are slow-burn mysteries, not immediate encounters. If players go poking around the cyclopean palm's excavation clefts at night, they may hear something — a distant buzzing, felt as much as heard. Nothing attacks. But something is aware of them.",
    treasure_notes: "- SESSION 1 REWARDS: Information, contacts, and seeds. No loot unless players specifically seek it.\n- Gavun's offer: Best gear at cost + 100gp for recovering companions' remains from the dragon lair.\n- Lord Marlin's standing offer (if players visit the keep): fair coin for mapping the lower subbasements.",
    session_goals: [
      { text: 'Arrive in Whitesparrow and establish a base at the Summerspring Inn', completed: false },
      { text: 'Meet the key NPCs and learn the shape of the village', completed: false },
      { text: 'Hear about at least one active hook (the dragon lair or the cyclopean palm)', completed: false },
      { text: '(Optional) Visit the Temple of Light and encounter the orb', completed: false },
      { text: '(Optional) Secure a job from Sheriff Willowmane, Lord Marlin, or Gavun', completed: false },
    ],
    event_notes: "PACING NOTES:\n- No hard time pressure this session. Let players breathe and explore.\n- The palm is always visible. Reference it at least once per scene — a shadow, a cold draft from the excavation clefts, a local glancing up at it.\n- The orb at the temple can be visited any time. Elovyn will give players a tour. She will be very calm about the orb and that calmness will be more unsettling than anything she says.\n- End the session with at least one clear hook the players chose to pursue. They should feel like Whitesparrow has more going on than it looks.",
    thread_notes: "THREADS TO PLANT:\n1. THE CYCLOPEAN HAND — Lead with the visual (it's literally the first thing they see). Plant the rumors about nightmares and the hollow wrist. Don't explain anything. Let mystery accumulate.\n2. GAVUN'S LAIR — This is the more actionable hook for early sessions. Gavun is a warm, believable NPC with a clear, emotionally grounded request. Let players like him before he asks for anything.\n3. AMANDA'S PAST — Never state it directly. Let players notice that she knows too much. Drop one thing she couldn't reasonably know. See if they ask.",
  })]);

  await supabase.from('relationships').insert([
    stamp({ campaign_id: cid, source_entity_id: byName['Sheriff Ruth Willowmane'], target_entity_id: byName["Sheriff's Guard"], source_name: 'Sheriff Ruth Willowmane', target_name: "Sheriff's Guard", relationship_type: 'leads', description: "Ruth has commanded the Guard for twenty years. They are deeply loyal and follow her lead without question.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Sheriff Ruth Willowmane'], target_entity_id: byName['Lord Marlin Whitesparrow'], source_name: 'Sheriff Ruth Willowmane', target_name: 'Lord Marlin Whitesparrow', relationship_type: 'allied_with', description: "Ruth nominally reports to Lord Marlin but operates with significant independence. They respect each other. If both he and Pennin die, she becomes elected leader.", status: 'active', strength: 7 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Amanda Jess'], target_entity_id: byName['The Evershady Tavern'], source_name: 'Amanda Jess', target_name: 'The Evershady Tavern', relationship_type: 'owns', description: "Amanda built the Evershady forty years ago. It is her primary business and intelligence-gathering hub.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Amanda Jess'], target_entity_id: byName['The Summerspring Inn'], source_name: 'Amanda Jess', target_name: 'The Summerspring Inn', relationship_type: 'owns', description: "Amanda owns the inn and delegates its management entirely to Philcock Deadcleft, who reports everything he hears.", status: 'active', strength: 9 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Philcock Deadcleft'], target_entity_id: byName['Amanda Jess'], source_name: 'Philcock Deadcleft', target_name: 'Amanda Jess', relationship_type: 'employed_by', description: "Philcock manages the inn and spies on guests for Amanda. She protects him fiercely for reasons no one understands.", status: 'active', strength: 9 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Philcock Deadcleft'], target_entity_id: byName['The Summerspring Inn'], source_name: 'Philcock Deadcleft', target_name: 'The Summerspring Inn', relationship_type: 'located_in', description: "Deadcleft lives at and manages the inn. He has a back room that is entirely his own.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Gavun Grayhorn'], target_entity_id: byName['Grayhorn Outfitters'], source_name: 'Gavun Grayhorn', target_name: 'Grayhorn Outfitters', relationship_type: 'owns', description: "Gavun opened the shop after retiring from adventuring. He and Arianne run it together.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Gavun Grayhorn'], target_entity_id: byName["Gavun's Dragon Lair"], source_name: 'Gavun Grayhorn', target_name: "Gavun's Dragon Lair", relationship_type: 'knows', description: "Gavun killed the dragon that lives — lived — there. His companions' remains are still inside. He knows the exact location and has never returned.", status: 'active', strength: 8 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Elovyn Sorrowsong'], target_entity_id: byName['The Temple of Light'], source_name: 'Elovyn Sorrowsong', target_name: 'The Temple of Light', relationship_type: 'leads', description: "Elovyn is the temple's sole priest. She has tended it for decades and knows its history better than any living person.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Floating Orb'], target_entity_id: byName['The Temple of Light'], source_name: 'The Floating Orb', target_name: 'The Temple of Light', relationship_type: 'located_in', description: "The orb predates the temple — the elves built the temple around it. It has not moved in recorded history.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Lord Marlin Whitesparrow'], target_entity_id: byName['Whitesparrow Keep'], source_name: 'Lord Marlin Whitesparrow', target_name: 'Whitesparrow Keep', relationship_type: 'located_in', description: "Lord Marlin resides in the keep with his ward Pennin and a small household staff.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Cyclopean Palm'], target_entity_id: byName['The Mystery of the Cyclopean Hand'], source_name: 'The Cyclopean Palm', target_name: 'The Mystery of the Cyclopean Hand', relationship_type: 'allied_with', description: "The palm is the physical center of the mystery. Every clue about it originates here.", status: 'active', strength: 10 }),
    stamp({ campaign_id: cid, source_entity_id: byName['The Evershady Tavern'], target_entity_id: byName['The Cyclopean Palm'], source_name: 'The Evershady Tavern', target_name: 'The Cyclopean Palm', relationship_type: 'located_in', description: "The tavern was built under and around the palm's wrist. The circular bar wraps around the stone arm.", status: 'active', strength: 9 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Amanda Jess'], target_entity_id: byName['The Mystery of the Cyclopean Hand'], source_name: 'Amanda Jess', target_name: 'The Mystery of the Cyclopean Hand', relationship_type: 'knows', description: "Amanda has purchased three maps purporting to show the hollow wrist entrance. She keeps them in a false-bottomed drawer and has never shown them to anyone.", status: 'active', strength: 6 }),
    stamp({ campaign_id: cid, source_entity_id: byName['Elovyn Sorrowsong'], target_entity_id: byName['The Mystery of the Cyclopean Hand'], source_name: 'Elovyn Sorrowsong', target_name: 'The Mystery of the Cyclopean Hand', relationship_type: 'knows', description: "Elovyn's private notes reference the palm and the orb together. She knows more than she admits and will not share without significant trust.", status: 'active', strength: 7 }),
  ]);

  await supabase.from('random_tables').insert([
    stamp({ campaign_id: cid, name: 'Whitesparrow Rumors', description: 'Roll when players ask around the tavern, or drop one at the start of any session.', category: 'npcs',
      entries: [
        { result: "The excavators who tried to dig out the palm's wrist last spring won't sleep with a window open anymore. Three of them left the village entirely." },
        { result: "Amanda Jess bought three maps last month — all supposedly showing the same location inside the cyclopean hand. She put them all in the same drawer." },
        { result: "There's a staircase inside the stone wrist. Everyone says it's a myth. Nobody who says that has climbed down into the excavation clefts at night." },
        { result: "The thief who touched the orb in the temple didn't die. Elovyn's face when someone says that — it's not grief. It's something else." },
        { result: "Gavun Grayhorn was a famous adventurer once. Something happened to his party out in the hills. He doesn't talk about it but his wife does, if you ask right." },
        { result: "Lord Marlin's been hearing sounds from the lower keep for a month. He's not sleeping well. He won't tell the sheriff." },
        { result: "Philcock Deadcleft smells like sulfur lately, not just the usual. Someone saw him come up from the inn's cellar with mud on his boots." },
        { result: "The hot springs under the inn have been going cold one by one for three years. Something is drinking them from below." },
        { result: "The sparrows at the keep's courtyard pool have been acting strange — flying in patterns, landing in formation. Lord Marlin says he hasn't noticed. He has." },
        { result: "There's an old story that the hand isn't a hand. It's a marker. Something underneath it is trying to get out. Something above it is trying to get back in." },
      ] }),
    stamp({ campaign_id: cid, name: 'Cyclopean Palm Complications', description: 'Roll when players investigate the palm or its excavation clefts, especially after dark.', category: 'encounters',
      entries: [
        { result: 'The stone is warm where you touch it. Not sun-warmed — it has been cold for hours. Something else is generating heat from inside.' },
        { result: 'A faint buzzing, felt more in the chest than heard. It stops the moment you go still. It starts again when you move.' },
        { result: "An old rope ladder descends into the cleft. Someone has tied a new knot in it recently. The knot style isn't local." },
        { result: "At the bottom of the excavation cleft, the stone is scored with deep parallel gouges — from the outside, pushing in. Something was trying to get through." },
        { result: "You find a camp at the base of the cleft: bedroll, lantern (cold), a half-eaten meal. The food is fresh. No one is here. No one came back up." },
        { result: "The thin seam in the stone at the wrist level is warm to the touch. Pressing on it produces a low resonant tone that travels up through the stone into the hand above." },
        { result: "A dream, vivid and sudden, even if you're not asleep: darkness, a tremendous buzzing, and the sensation of something vast turning its attention toward you." },
        { result: "The excavation cleft is deeper than the old records say. Someone has been digging here recently — within the last week, by the look of the disturbed earth." },
      ] }),
  ]);

  return Response.json({ success: true, campaign_id: cid }, { headers: corsHeaders });
});
