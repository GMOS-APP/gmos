export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { characterId } = req.body;
  if (!characterId) return res.status(400).json({ error: 'characterId is required' });

  try {
    const url = `https://character-service.dndbeyond.com/character/v5/character/${characterId}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; GMOS/1.0)',
      },
    });

    if (response.status === 401 || response.status === 403) {
      return res.status(403).json({
        error: 'Character is private. Set your character\'s privacy to "Public" on D&D Beyond and try again.',
      });
    }
    if (!response.ok) {
      return res.status(400).json({
        error: `D&D Beyond returned an error (status: ${response.status}). Verify the Character ID is correct.`,
      });
    }

    const json = await response.json();
    const char = json.data;
    if (!char) return res.status(404).json({ error: 'No character data found.' });

    const abilityNames = { 1: 'strength', 2: 'dexterity', 3: 'constitution', 4: 'intelligence', 5: 'wisdom', 6: 'charisma' };
    const abilityScores = {};
    (char.stats || []).forEach((stat) => {
      if (abilityNames[stat.id]) abilityScores[abilityNames[stat.id]] = stat.value || 10;
    });

    const getMod = (score) => Math.floor(((score || 10) - 10) / 2);
    const totalLevel = (char.classes || []).reduce((sum, c) => sum + (c.level || 0), 0) || 1;
    const classString = (char.classes || []).map((c) => `${c.definition?.name || 'Unknown'} ${c.level}`).join(' / ');
    const firstClassName = char.classes?.[0]?.definition?.name || '';

    const allModifiers = [
      ...(char.modifiers?.race || []),
      ...(char.modifiers?.background || []),
      ...(char.modifiers?.class || []),
      ...(char.modifiers?.feat || []),
      ...(char.modifiers?.item || []),
    ];
    const languages = allModifiers
      .filter((m) => m.type === 'language')
      .map((m) => m.friendlySubtypeName || m.subType || '')
      .filter(Boolean)
      .join(', ');

    const dexMod = getMod(abilityScores.dexterity);
    let armorClass = char.overrideArmorClass || null;
    if (!armorClass) {
      const equippedArmor = (char.inventory || []).find(
        (item) => item.equipped && item.definition?.filterType === 'Armor' && item.definition?.armorTypeId !== 4
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
      const shield = (char.inventory || []).find(
        (item) => item.equipped && item.definition?.filterType === 'Armor' && item.definition?.armorTypeId === 4
      );
      if (shield) armorClass += shield.definition?.armorClass || 2;
    }

    const walkSpeed = char.race?.weightSpeeds?.normal?.walk || char.race?.speed?.walk || char.race?.speed || 30;
    const wisMod = getMod(abilityScores.wisdom);
    const intMod = getMod(abilityScores.intelligence);
    const backgroundName = char.background?.definition?.name || '';
    const stripHtml = (html) => (html ? html.replace(/<[^>]*>/g, '').trim() : '');

    const keyFacts = [
      `Level ${totalLevel} ${char.race?.fullName || ''} ${firstClassName}`.trim(),
      `Max HP: ${char.baseHitPoints || 0}`,
      `AC: ${armorClass}`,
      `Speed: ${walkSpeed}ft`,
      `Passive Perception: ${10 + wisMod}`,
      backgroundName ? `Background: ${backgroundName}` : null,
      languages ? `Languages: ${languages}` : null,
    ].filter(Boolean);

    return res.status(200).json({
      data: {
        character: {
          name: char.name || 'Unknown Character',
          entity_type: 'player_character',
          image_url: char.decorations?.avatarUrl || '',
          summary: `Level ${totalLevel} ${char.race?.fullName || ''} ${classString}`.trim(),
          status: 'active',
          visibility: 'players_know',
          npc_data: { race: char.race?.fullName || '', gender: char.gender || '', class: classString },
          key_facts: keyFacts,
          extra_data: {
            race: char.race?.fullName || '',
            class: classString,
            level: totalLevel,
            gender: char.gender || '',
            background: backgroundName,
            dndbeyond_id: String(char.id || ''),
            ability_scores: abilityScores,
            max_hit_points: char.baseHitPoints || 0,
            armor_class: armorClass,
            walking_speed: walkSpeed,
            passive_perception: 10 + wisMod,
            passive_investigation: 10 + intMod,
            passive_insight: 10 + wisMod,
            languages,
            personality_traits: stripHtml(char.traits?.personalityTraits || ''),
            ideals: stripHtml(char.traits?.ideals || ''),
            bonds: stripHtml(char.traits?.bonds || ''),
            flaws: stripHtml(char.traits?.flaws || ''),
          },
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
