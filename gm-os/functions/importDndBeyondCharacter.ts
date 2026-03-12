import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { characterId } = await req.json();
    if (!characterId) {
      return Response.json({ error: 'characterId is required' }, { status: 400 });
    }

    const url = `https://character-service.dndbeyond.com/character/v5/character/${characterId}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; DnDCampaignManager/1.0)',
      }
    });

    if (response.status === 401 || response.status === 403) {
      return Response.json({
        error: 'Character is private. Please set your character\'s privacy to "Public" on D&D Beyond (Character Sheet → Settings → Character Privacy → Public) and try again.'
      }, { status: 403 });
    }

    if (!response.ok) {
      return Response.json({ error: `D&D Beyond returned an error (status: ${response.status}). Please verify the Character ID is correct.` }, { status: 400 });
    }

    const json = await response.json();
    const char = json.data;

    if (!char) {
      return Response.json({ error: 'No character data found. Please check the Character ID.' }, { status: 404 });
    }

    // Ability score name map (stat id → name)
    const abilityNames = { 1: 'strength', 2: 'dexterity', 3: 'constitution', 4: 'intelligence', 5: 'wisdom', 6: 'charisma' };
    const abilityScores = {};
    (char.stats || []).forEach((stat) => {
      if (abilityNames[stat.id]) {
        abilityScores[abilityNames[stat.id]] = stat.value || 10;
      }
    });

    const getMod = (score) => Math.floor(((score || 10) - 10) / 2);

    // Total level and proficiency bonus
    const totalLevel = (char.classes || []).reduce((sum, c) => sum + (c.level || 0), 0) || 1;
    const profBonus = Math.ceil(totalLevel / 4) + 1;

    // Class string: "Fighter 3 / Rogue 2"
    const classString = (char.classes || []).map(c => `${c.definition?.name || 'Unknown'} ${c.level}`).join(' / ');
    const firstClassName = char.classes?.[0]?.definition?.name || '';

    // Languages from modifiers
    const allModifiers = [
      ...(char.modifiers?.race || []),
      ...(char.modifiers?.background || []),
      ...(char.modifiers?.class || []),
      ...(char.modifiers?.feat || []),
      ...(char.modifiers?.item || []),
    ];
    const languages = allModifiers
      .filter(m => m.type === 'language')
      .map(m => m.friendlySubtypeName || m.subType || '')
      .filter(Boolean)
      .join(', ');

    // Armor Class calculation
    let armorClass = char.overrideArmorClass || null;
    if (!armorClass) {
      const dexMod = getMod(abilityScores.dexterity);
      const equippedArmor = (char.inventory || []).find(
        item => item.equipped && item.definition?.filterType === 'Armor' && item.definition?.armorTypeId !== 4
      );
      if (equippedArmor) {
        const baseAC = equippedArmor.definition?.armorClass || 10;
        const armorTypeId = equippedArmor.definition?.armorTypeId;
        let dexBonus = dexMod;
        if (armorTypeId === 2) dexBonus = Math.min(dexMod, 2);
        if (armorTypeId === 3) dexBonus = 0;
        armorClass = baseAC + dexBonus;
      } else {
        armorClass = 10 + dexMod;
      }
      // Add shield bonus if equipped
      const shield = (char.inventory || []).find(
        item => item.equipped && item.definition?.filterType === 'Armor' && item.definition?.armorTypeId === 4
      );
      if (shield) armorClass += (shield.definition?.armorClass || 2);
    }

    // Walking speed
    const walkSpeed = char.race?.weightSpeeds?.normal?.walk
      || char.race?.speed?.walk
      || char.race?.speed
      || 30;

    // Passive skills (base 10 + ability mod, proficiency not calculated here for simplicity)
    const wisMod = getMod(abilityScores.wisdom);
    const intMod = getMod(abilityScores.intelligence);
    const passivePerception = 10 + wisMod;
    const passiveInvestigation = 10 + intMod;
    const passiveInsight = 10 + wisMod;

    const backgroundName = char.background?.definition?.name || '';

    // Strip HTML tags from text
    const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '').trim() : '';

    // Build key facts
    const keyFacts = [
      `Level ${totalLevel} ${char.race?.fullName || ''} ${firstClassName}`.trim(),
      `Max HP: ${char.baseHitPoints || 0}`,
      `AC: ${armorClass}`,
      `Speed: ${walkSpeed}ft`,
      `Passive Perception: ${passivePerception}`,
      backgroundName ? `Background: ${backgroundName}` : null,
      languages ? `Languages: ${languages}` : null,
    ].filter(Boolean);

    const mappedData = {
      name: char.name || 'Unknown Character',
      entity_type: 'player_character',
      image_url: char.decorations?.avatarUrl || char.decorations?.frameAvatarUrl || char.decorations?.backdropAvatarUrl || '',
      summary: `Level ${totalLevel} ${char.race?.fullName || ''} ${classString}`.trim(),
      status: 'active',
      visibility: 'players_know',
      npc_data: {
        race: char.race?.fullName || '',
        gender: char.gender || '',
        class: classString,
      },
      key_facts: keyFacts,
      extra_data: {
        // Identity
        race: char.race?.fullName || '',
        class: classString,
        level: totalLevel,
        gender: char.gender || '',
        background: backgroundName,
        dndbeyond_id: String(char.id || ''),
        // Combat stats
        ability_scores: abilityScores,
        max_hit_points: char.baseHitPoints || 0,
        armor_class: armorClass,
        walking_speed: walkSpeed,
        // Passive skills
        passive_perception: passivePerception,
        passive_investigation: passiveInvestigation,
        passive_insight: passiveInsight,
        // Languages
        languages: languages,
        // Personality
        personality_traits: stripHtml(char.traits?.personalityTraits || ''),
        ideals: stripHtml(char.traits?.ideals || ''),
        bonds: stripHtml(char.traits?.bonds || ''),
        flaws: stripHtml(char.traits?.flaws || ''),
      },
    };

    return Response.json({ character: mappedData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});