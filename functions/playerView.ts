import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_ORIGINS = ['https://gmos.app', 'https://gm-os.app', 'https://gamemasteros.com', 'https://trisdenc.github.io'];
const isAllowedOrigin = (o: string | null): o is string =>
  !!o && (ALLOWED_ORIGINS.includes(o) ||
    /^http:\/\/localhost:\d+$/.test(o) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(o));
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Vary': 'Origin',
});

type FieldDef = { key: string; label: string; spec?: boolean };

// ── Player-safe field whitelists ─────────────────────────────────────────────
// Everything below is an explicit ALLOWLIST: only these extra_data keys are
// ever composed into the player payload. GM-only material (secrets, motives,
// clue trails, prep notes, descriptions written for the GM) is never sent.

// Built-in D&D types (keys/labels mirror the client's PRESENTATION config,
// minus GM-facing fields).
const BUILTIN_SAFE: Record<string, FieldDef[]> = {
  npc: [
    { key: 'race', label: 'Race', spec: true },
    { key: 'class', label: 'Class', spec: true },
    { key: 'gender', label: 'Gender', spec: true },
    { key: 'appearance', label: 'Appearance' },
    { key: 'traits', label: 'Traits' },
  ],
  location: [
    { key: 'location_type', label: 'Type', spec: true },
    { key: 'region', label: 'Region', spec: true },
    { key: 'atmosphere', label: 'Atmosphere' },
    { key: 'notable_features', label: 'Notable Features' },
    { key: 'inhabitants', label: 'Inhabitants' },
  ],
  faction: [
    { key: 'faction_type', label: 'Type', spec: true },
    { key: 'base', label: 'Base of Operations', spec: true },
    { key: 'structure', label: 'Structure & Leadership' },
    { key: 'joining', label: 'Joining' },
  ],
  item: [
    { key: 'item_type', label: 'Type', spec: true },
    { key: 'rarity', label: 'Rarity', spec: true },
    { key: 'value', label: 'Value', spec: true },
    { key: 'properties', label: 'Properties' },
    { key: 'appearance', label: 'Physical Description' },
  ],
  deity: [
    { key: 'domains', label: 'Domains', spec: true },
    { key: 'alignment', label: 'Alignment', spec: true },
    { key: 'holy_symbol', label: 'Holy Symbol', spec: true },
    { key: 'tenets', label: 'Tenets' },
    { key: 'clergy', label: 'Clergy & Church' },
    { key: 'temples', label: 'Temples & Sacred Sites' },
    { key: 'myths', label: 'Myths & Legends' },
  ],
  event: [
    { key: 'trigger', label: 'When', spec: true },
    { key: 'scale', label: 'Scale', spec: true },
    { key: 'description', label: 'What Happened' },
    { key: 'participants', label: 'Key Participants' },
  ],
  lore: [
    { key: 'category', label: 'Category', spec: true },
    { key: 'era', label: 'Era', spec: true },
    { key: 'common_knowledge', label: 'Common Knowledge' },
  ],
  thread: [
    { key: 'situation', label: 'Situation' },
    { key: 'key_npcs', label: 'Key Figures' },
  ],
};

// Player-visible types from the game-system packs (subset of
// src/lib/systemPacks.js — keep in sync when pack playerVisible/gmOnly flags
// change; key = campaigns.system). `fields` lists only NON-GM fields.
const PACK_PLAYER_TYPES: Record<string, Array<{ key: string; label: string; label_singular: string; icon: string; color: string; fields: FieldDef[] }>> = {
  coc: [
    { key: 'coc_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet', fields: [
      { key: 'role', label: 'Role', spec: true }, { key: 'occupation', label: 'Occupation', spec: true },
      { key: 'description', label: 'Description' },
    ] },
    { key: 'coc_tome', label: 'Tomes & Artifacts', label_singular: 'Tome / Artifact', icon: 'BookOpen', color: 'orange', fields: [
      { key: 'kind', label: 'Type', spec: true }, { key: 'language', label: 'Language', spec: true },
      { key: 'sanity_cost', label: 'Sanity Cost', spec: true }, { key: 'mythos_rating', label: 'Mythos Rating', spec: true },
      { key: 'description', label: 'Description' },
    ] },
    { key: 'coc_location', label: 'Locations', label_singular: 'Location', icon: 'MapPin', color: 'emerald', fields: [
      { key: 'kind', label: 'Type', spec: true }, { key: 'description', label: 'Description' },
      { key: 'atmosphere', label: 'Atmosphere' },
    ] },
  ],
  blades: [
    { key: 'blades_faction', label: 'Factions', label_singular: 'Faction', icon: 'Crown', color: 'purple', fields: [
      { key: 'tier', label: 'Tier', spec: true }, { key: 'hold', label: 'Hold', spec: true },
      { key: 'status', label: 'Status w/ Crew', spec: true }, { key: 'turf', label: 'Turf' },
      { key: 'notables', label: 'Notable Members' },
    ] },
    { key: 'blades_district', label: 'Districts', label_singular: 'District', icon: 'MapPin', color: 'emerald', fields: [
      { key: 'security', label: 'Security', spec: true }, { key: 'wealth', label: 'Wealth', spec: true },
      { key: 'description', label: 'Description' }, { key: 'factions_present', label: 'Factions Present' },
      { key: 'notable_locations', label: 'Notable Locations' },
    ] },
    { key: 'blades_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet', fields: [
      { key: 'role', label: 'Role', spec: true }, { key: 'faction', label: 'Faction', spec: true },
      { key: 'disposition', label: 'Disposition', spec: true }, { key: 'description', label: 'Description' },
    ] },
  ],
  vtm: [
    { key: 'vtm_mortal', label: 'Mortals & Ghouls', label_singular: 'Mortal / Ghoul', icon: 'User', color: 'green', fields: [
      { key: 'kind', label: 'Type', spec: true }, { key: 'relationship', label: 'Relationship', spec: true },
      { key: 'description', label: 'Description' },
    ] },
    { key: 'vtm_domain', label: 'Domains', label_singular: 'Domain', icon: 'MapPin', color: 'emerald', fields: [
      { key: 'chasse', label: 'Chasse', spec: true }, { key: 'lien', label: 'Lien', spec: true },
      { key: 'portillon', label: 'Portillon', spec: true }, { key: 'description', label: 'Description' },
      { key: 'notable', label: 'Notable' },
    ] },
    { key: 'vtm_faction', label: 'Sects & Factions', label_singular: 'Sect / Faction', icon: 'Crown', color: 'purple', fields: [
      { key: 'allegiance', label: 'Allegiance', spec: true }, { key: 'goals', label: 'Goals' },
      { key: 'notable_members', label: 'Notable Members' },
    ] },
    { key: 'vtm_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet', fields: [
      { key: 'kind', label: 'Type', spec: true }, { key: 'disposition', label: 'Disposition', spec: true },
      { key: 'description', label: 'Description' },
    ] },
  ],
  daggerheart: [
    { key: 'dh_environment', label: 'Environments', label_singular: 'Environment', icon: 'Mountain', color: 'emerald', fields: [
      { key: 'env_type', label: 'Type', spec: true }, { key: 'difficulty', label: 'Difficulty', spec: true },
      { key: 'description', label: 'Description' }, { key: 'features', label: 'Features' },
    ] },
    { key: 'dh_faction', label: 'Factions', label_singular: 'Faction', icon: 'Shield', color: 'rose', fields: [
      { key: 'description', label: 'Description' }, { key: 'goals', label: 'Goals' },
      { key: 'notable', label: 'Notable Members' },
    ] },
    { key: 'dh_npc', label: 'NPCs', label_singular: 'NPC', icon: 'Users', color: 'violet', fields: [
      { key: 'role', label: 'Role', spec: true }, { key: 'disposition', label: 'Disposition', spec: true },
      { key: 'description', label: 'Description' },
    ] },
  ],
};

// The party: each system's own character type, always shown to players (it's
// their characters), with a couple of identity fields.
const PARTY_TYPES: Record<string, { type: string; metaKeys: string[] }> = {
  dnd5e: { type: 'player_character', metaKeys: ['race', 'class'] },
  pf2e: { type: 'player_character', metaKeys: ['race', 'class'] },
  custom: { type: 'player_character', metaKeys: ['race', 'class'] },
  coc: { type: 'coc_investigator', metaKeys: ['occupation'] },
  blades: { type: 'blades_scoundrel', metaKeys: ['playbook', 'heritage'] },
  vtm: { type: 'vtm_vampire', metaKeys: ['clan', 'predator_type'] },
  daggerheart: { type: 'dh_hero', metaKeys: ['class', 'ancestry'] },
};

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

// Compose display-ready, player-safe details from extra_data + an allowlist.
const composeDetails = (extra: Record<string, unknown> | null, defs: FieldDef[] | undefined) => {
  if (!extra || !defs?.length) return null;
  const specs: Array<{ label: string; value: string }> = [];
  const sections: Array<{ label: string; value: string }> = [];
  for (const d of defs) {
    const v = str(extra[d.key]);
    if (!v) continue;
    (d.spec ? specs : sections).push({ label: d.label, value: v });
  }
  return specs.length || sections.length ? { specs, sections } : null;
};

Deno.serve(async (req) => {
  const corsHeaders = cors(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get('token');

    if (!token) {
      try {
        const body = await req.json();
        token = body?.token;
      } catch { /* no body */ }
    }

    if (!token) {
      return Response.json({ error: 'token is required' }, { status: 400, headers: corsHeaders });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Built-in player-facing entity types (never creatures/encounters/shops).
    const BUILTIN_PLAYER_TYPES = ['npc', 'location', 'faction', 'item', 'thread', 'event', 'lore', 'deity'];

    // Find campaign by share token where sharing is enabled. created_by is used
    // server-side to resolve the owner's custom types; it is never returned.
    const { data: campaigns, error: campError } = await admin
      .from('campaigns')
      .select('id, name, setting, system, player_notice, created_by')
      .eq('player_share_token', token)
      .eq('is_shared', true)
      .limit(1);

    if (campError || !campaigns || campaigns.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    const campaign = campaigns[0];

    // The owner's player-visible custom entity types (fields included so we can
    // compose the non-GM ones server-side).
    const { data: customTypes } = await admin
      .from('entity_types')
      .select('key, label, label_singular, icon, color, fields')
      .eq('created_by', campaign.created_by)
      .eq('player_visible', true);

    const packTypes = PACK_PLAYER_TYPES[campaign.system] || [];
    const customDefs = (customTypes || []).map((t) => ({
      key: t.key, label: t.label, label_singular: t.label_singular, icon: t.icon, color: t.color,
      fields: (Array.isArray(t.fields) ? t.fields : [])
        .filter((f: Record<string, unknown>) => !f.gmOnly)
        .map((f: Record<string, unknown>) => ({ key: f.key, label: f.label, spec: f.placement === 'spec' })),
    }));
    const extraTypeDefs = [...packTypes, ...customDefs];
    const PLAYER_TYPES = [...BUILTIN_PLAYER_TYPES, ...extraTypeDefs.map((t) => t.key)];

    // Allowlist lookup for composing details.
    const fieldDefs: Record<string, FieldDef[]> = { ...BUILTIN_SAFE };
    for (const t of extraTypeDefs) fieldDefs[t.key] = t.fields;

    // Player-visible entities. extra_data is read server-side ONLY to compose
    // the allowlisted details — it is never returned raw.
    const { data: entities } = await admin
      .from('world_entities')
      .select('id, entity_type, name, summary, image_url, visibility, extra_data')
      .eq('campaign_id', campaign.id)
      .in('visibility', ['players_know', 'players_suspect'])
      .in('entity_type', PLAYER_TYPES)
      .order('updated_date', { ascending: false });

    const safeEntities = (entities || []).map((e) => ({
      id: e.id, entity_type: e.entity_type, name: e.name, summary: e.summary,
      image_url: e.image_url, visibility: e.visibility,
      details: composeDetails(e.extra_data, fieldDefs[e.entity_type]),
    }));

    // The party roster — the system's character type, always player-visible.
    const partyCfg = PARTY_TYPES[campaign.system] || PARTY_TYPES.dnd5e;
    const { data: pcs } = await admin
      .from('world_entities')
      .select('id, name, summary, image_url, extra_data')
      .eq('campaign_id', campaign.id)
      .eq('entity_type', partyCfg.type)
      .order('name');
    const party = (pcs || []).map((p) => ({
      id: p.id, name: p.name, summary: p.summary, image_url: p.image_url,
      meta: partyCfg.metaKeys.map((k) => str(p.extra_data?.[k])).filter(Boolean).join(' · '),
    }));

    // Sessions: next planned one + the recap journal (player-facing recaps only).
    const { data: sessions } = await admin
      .from('sessions')
      .select('session_number, title, date, status, previous_session_recap')
      .eq('campaign_id', campaign.id)
      .order('session_number', { ascending: false })
      .limit(50);

    return Response.json(
      {
        campaign: {
          id: campaign.id, name: campaign.name, setting: campaign.setting,
          player_notice: str(campaign.player_notice) || null,
        },
        entities: safeEntities,
        party,
        sessions: sessions || [],
        entityTypes: extraTypeDefs.map(({ fields: _f, ...t }) => t),
      },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: corsHeaders });
  }
});
