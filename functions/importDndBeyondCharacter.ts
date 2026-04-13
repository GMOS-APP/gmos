import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    const { characterId } = await req.json();
    if (!characterId) {
      return Response.json({ error: 'characterId is required' }, { status: 400, headers: CORS_HEADERS });
    }

    const url = `https://character-service.dndbeyond.com/character/v5/character/${characterId}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; DnDCampaignManager/1.0)',
      },
    });

    if (response.status === 401 || response.status === 403) {
      return Response.json({
        error: "Character is private. Please set your character's privacy to \"Public\" on D&D Beyond (Character Sheet → Settings → Character Privacy → Public) and try again.",
      }, { status: 403, headers: CORS_HEADERS });
    }

    if (!response.ok) {
      return Response.json({
        error: `D&D Beyond returned an error (status: ${response.status}). Please verify the Character ID is correct.`,
      }, { status: 400, headers: CORS_HEADERS });
    }

    const json = await response.json();
    const char = json.data;

    if (!char) {
      return Response.json({ error: 'No character data found. Please check the Character ID.' }, { status: 404, headers: CORS_HEADERS });
    }

    const abilityNames: Record<number, string> = { 1: 'strength', 2: 'dexterity', 3: 'constitution', 4: 'intelligence', 5: 'wisdom', 6: 'charisma' };
    const abilityScores: Record<string, number> = {};
    (char.stats || []).forEach((stat: { id: number; value: number }) => {
      if (abilityNames[stat.id]) abilityScores[abilityNames[stat.id]] = stat.value || 10;
    });

    const getMod = (score: number) => Math.floor(((score || 10) - 10) / 2);

    const totalLevel = (char.classes || []).reduce((sum: number, c: { level: number }) => sum + (c.level || 0), 0) || 1;
    const classString = (char.classes || []).map((c: { definition?: { name: string }; level: number }) => `${c.definition?.name || 'Unknown'} ${c.level}`).join(' / ');
    const firstClassName = char.classes?.[0]?.definition?.name || '';

    const allModifiers = [
      ...(char.modifiers?.race || []),
      ...(char.modifiers?.background || []),
      ...(char.modifiers?.class || []),
      ...(char.modifiers?.feat || []),
      ...(char.modifiers?.item || []),
    ];
    const languages = allModifiers
      .filter((m: { type: string }) => m.type === 'language')
      .map((m: { friendlySubtypeName?: string; subType?: string }) => m.friendlySubtypeName || m.subType || '')
      .filter(Boolean)
      .join(', ');

    let armorClass = char.overrideArmorClass || null;
    if (!armorClass) {
      const dexMod = getMod(abilityScores.dexterity);
      const equippedArmor = (char.inventory || []).find(
        (item: { equipped: boolean; definition?: { filterType: string; armorTypeId: number } }) =>
          item.equipped && item.definition?.filterType === 'Armor' && item.definition?.armorTypeId !== 4
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
        (item: { equipped: boolean; definition?: { filterType: string; armorTypeId: number; armorClass: number } }) =>
          item.equipped && item.definition?.filterType === 'Armor' && item.definition?.armorTypeId === 4
      );
      if (shield) armorClass += (shield.definition?.armorClass || 2);
    }

    const walkSpeed = char.race?.weightSpeeds?.normal?.walk || char.race?.speed?.walk || char.race?.speed || 30;
    const wisMod = getMod(abilityScores.wisdom);
    const intMod = getMod(abilityScores.intelligence);
    const backgroundName = char.background?.definition?.name || '';
    const stripHtml = (html: string) => html ? html.replace(/<[^>]*>/g, '').trim() : '';

    const keyFacts = [
      `Level ${totalLevel} ${char.race?.fullName || ''} ${firstClassName}`.trim(),
      `Max HP: ${char.baseHitPoints || 0}`,
      `AC: ${armorClass}`,
      `Speed: ${walkSpeed}ft`,
      `Passive Perception: ${10 + wisMod}`,
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
    };

    const maxHp = char.overrideHitPoints ?? char.baseHitPoints ?? 0;
    const removedHp = char.removedHitPoints ?? 0;
    const tempHp = char.temporaryHitPoints ?? 0;
    const liveStats = {
      max_hit_points: maxHp,
      current_hit_points: Math.max(0, maxHp - removedHp),
      temporary_hit_points: tempHp,
      armor_class: armorClass,
      last_synced_at: new Date().toISOString(),
    };

    return Response.json({ character: mappedData, liveStats }, { headers: CORS_HEADERS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
});
