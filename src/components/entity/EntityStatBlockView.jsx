import React, { useState } from 'react';
import { Shield, Heart, Zap, Skull, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EntityMentionRenderer from '@/components/common/EntityMentionRenderer';

// ── Dice roller ───────────────────────────────────────────────────────────────
function DiceButton({ notation, label }) {
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    const m = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!m) return;
    setRolling(true);
    const mod = m[3] ? parseInt(m[3]) : 0;
    let total = mod;
    for (let i = 0; i < parseInt(m[1]); i++) {
      total += Math.floor(Math.random() * parseInt(m[2])) + 1;
    }
    setTimeout(() => {
      setResult(total);
      setRolling(false);
      setTimeout(() => setResult(null), 2500);
    }, 200);
  };

  return (
    <button
      onClick={roll}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono transition-all ml-1 ${
        rolling
          ? 'bg-amber-500/20 text-amber-300'
          : result !== null
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'dark:bg-zinc-800/60 dark:text-zinc-500 dark:hover:text-amber-400 bg-gray-200 text-gray-600 hover:text-amber-600'
      }`}
    >
      {result !== null ? <span className="font-bold">{result}</span> : <span>{label ?? notation}</span>}
    </button>
  );
}

// ── Ability score cell ────────────────────────────────────────────────────────
function AbilityScore({ name, score }) {
  const mod = Math.floor((score - 10) / 2);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg dark:bg-zinc-900/60 dark:border dark:border-zinc-800 bg-gray-100 border border-gray-300">
      <span className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-gray-500 font-semibold">{name}</span>
      <span className="text-base font-bold dark:text-zinc-200 text-gray-900">{score}</span>
      <DiceButton notation={`1d20${modStr}`} label={modStr} />
    </div>
  );
}

// ── Ability scores grid — handles string ("19/10/16/7/12/8") or object ─────────
const ABILITY_ABBR = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ABILITY_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

function AbilityScoresGrid({ scores }) {
  if (!scores) return null;

  let parsed = null;
  if (typeof scores === 'object') {
    // PC format: { strength: 16, dexterity: 14, … }
    const vals = ABILITY_NAMES.map((n) => parseInt(scores[n]) || 10);
    if (vals.some((v) => v !== 10)) {
      parsed = Object.fromEntries(ABILITY_ABBR.map((k, i) => [k, vals[i]]));
    }
  } else if (typeof scores === 'string') {
    // Creature format: "19 / 10 / 16 / 7 / 12 / 8"
    const nums = scores.split(/[\s/,]+/).map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 30);
    if (nums.length >= 6) {
      parsed = Object.fromEntries(ABILITY_ABBR.map((k, i) => [k, nums[i]]));
    }
  }

  if (!parsed) return null;

  return (
    <div className="pt-3 border-t dark:border-zinc-800 border-gray-200">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {Object.entries(parsed).map(([k, v]) => (
          <AbilityScore key={k} name={k} score={v} />
        ))}
      </div>
    </div>
  );
}

// ── Combat stats row (AC / HP / Speed) ───────────────────────────────────────
function parseHP(str) {
  if (!str) return null;
  const m = str.match(/(\d+)\s*\(([^)]+)\)/);
  if (m) return { value: m[1], dice: m[2].replace(/\s/g, '') };
  const n = str.match(/(\d+)/);
  return n ? { value: n[1], dice: null } : null;
}

function CombatStats({ ac, hp, speed }) {
  const hpParsed = parseHP(String(hp || ''));
  const hasAny = ac || hpParsed || speed;
  if (!hasAny) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {ac && (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 flex-shrink-0">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">AC</p>
            <p className="text-xl font-bold dark:text-zinc-100 text-gray-900">{ac}</p>
          </div>
        </div>
      )}
      {hpParsed && (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 flex-shrink-0">
            <Heart className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">HP</p>
            <p className="text-xl font-bold dark:text-zinc-100 text-gray-900 flex items-center flex-wrap gap-1">
              {hpParsed.value}
              {hpParsed.dice && <DiceButton notation={hpParsed.dice} label={`(${hpParsed.dice})`} />}
            </p>
          </div>
        </div>
      )}
      {speed && (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-green-500/10 flex-shrink-0">
            <Zap className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">Speed</p>
            <p className="text-sm dark:text-zinc-300 text-gray-900 leading-tight">{speed}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Narrative section (with entity mention support) ───────────────────────────
function NarrativeSection({ title, text, entities, campaignId }) {
  if (!text) return null;
  return (
    <div className="pt-4 border-t dark:border-zinc-800 border-gray-200">
      <p className="text-[11px] uppercase tracking-widest dark:text-zinc-500 text-gray-400 font-semibold mb-2">{title}</p>
      <div className="text-sm dark:text-zinc-300 text-gray-700 leading-relaxed">
        <EntityMentionRenderer text={text} entities={entities} campaignId={campaignId} />
      </div>
    </div>
  );
}

// ── Info grid (2-col, short label-value pairs) ────────────────────────────────
function InfoGrid({ fields }) {
  const visible = fields.filter(([_, v]) => v != null && v !== '' && v !== 0);
  if (!visible.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {visible.map(([label, value]) => (
        <div key={label}>
          <span className="text-[11px] dark:text-zinc-600 text-gray-500 uppercase tracking-wide block mb-0.5">{label}</span>
          <span className="text-sm dark:text-zinc-200 text-gray-900 font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat block card wrapper ───────────────────────────────────────────────────
function StatCard({ children }) {
  return (
    <div className="rounded-xl border-2 dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 border-amber-600/30 bg-gradient-to-br from-white to-gray-50 p-5 space-y-5">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NPC view
// ─────────────────────────────────────────────────────────────────────────────
function NPCView({ form, system, campaignEntities }) {
  const d = form.extra_data || {};
  const hasIdentity = d.race || d.class || d.gender || d.alignment;
  const hasCombat = d.ac || d.hp || d.speed;

  return (
    <StatCard>
      {/* Identity */}
      {hasIdentity && (
        <div className={hasCombat || d.ability_scores ? 'border-b-2 dark:border-amber-500/20 border-amber-600/20 pb-4' : ''}>
          <InfoGrid fields={[
            ['Race', d.race],
            ['Class / Role', d.class],
            ['Gender', d.gender],
            ['Alignment', d.alignment],
          ]} />
        </div>
      )}

      {/* Combat stats */}
      {hasCombat && <CombatStats ac={d.ac} hp={d.hp} speed={d.speed} />}

      {/* Ability scores */}
      {system?.hasAbilityScores && d.ability_scores && (
        <AbilityScoresGrid scores={d.ability_scores} />
      )}

      {/* CR */}
      {system?.hasXpCrSystem && d.cr && (
        <div className="flex items-center gap-2">
          <Skull className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs dark:text-zinc-500 text-gray-500 font-semibold">Challenge</span>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">CR {d.cr}</Badge>
        </div>
      )}

      {/* Narrative */}
      <NarrativeSection title="Appearance" text={d.appearance} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Personality Traits" text={d.traits} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Motives & Goals" text={d.motives} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Sample Dialogue" text={d.sample_dialogue} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Rumors" text={d.rumors} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Quest Hooks" text={d.quests} entities={campaignEntities} campaignId={form.campaign_id} />
    </StatCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Creature view
// ─────────────────────────────────────────────────────────────────────────────
function CreatureView({ form, system, campaignEntities }) {
  const d = form.extra_data || {};

  return (
    <StatCard>
      {/* Type line */}
      {(d.size || d.creature_type) && (
        <div className="border-b-2 dark:border-amber-500/20 border-amber-600/20 pb-2">
          <p className="text-sm dark:text-zinc-400 text-gray-500 italic">
            {[d.size, d.creature_type].filter(Boolean).join(' ')}
          </p>
        </div>
      )}

      {/* Combat stats */}
      <CombatStats ac={d.ac} hp={d.hp} speed={d.speed} />

      {/* Ability scores */}
      {system?.hasAbilityScores && d.ability_scores && (
        <AbilityScoresGrid scores={d.ability_scores} />
      )}

      {/* CR */}
      {system?.hasXpCrSystem && d.cr && (
        <div className="flex items-center gap-2">
          <Skull className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs dark:text-zinc-500 text-gray-500 font-semibold">Challenge</span>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">CR {d.cr}</Badge>
        </div>
      )}

      {/* Narrative */}
      <NarrativeSection title="Traits & Special Abilities" text={d.traits} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Actions" text={d.actions} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Tactics & Behavior" text={d.tactics} entities={campaignEntities} campaignId={form.campaign_id} />
    </StatCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player Character view
// ─────────────────────────────────────────────────────────────────────────────
function PCView({ form, system, campaignEntities }) {
  const d = form.extra_data || {};
  const fields = system?.characterFields || { species: 'Race', role: 'Class', background: 'Background' };
  const abilities = d.ability_scores || {};

  // Sub-heading line: Race · Class · Level 5
  const subline = [
    d.race,
    d.class,
    d.level ? `Level ${d.level}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <StatCard>
      {/* Identity header */}
      <div className="border-b-2 dark:border-amber-500/20 border-amber-600/20 pb-4">
        {subline && (
          <p className="text-sm dark:text-zinc-400 text-gray-500 italic mb-3">{subline}</p>
        )}
        <InfoGrid fields={[
          ['Player', d.player_name],
          [fields.background, d.background],
          ['Gender', d.gender],
          ['Languages', d.languages],
        ]} />
        {d.dndbeyond_id && system?.hasDndBeyondImport && (
          <a
            href={`https://www.dndbeyond.com/characters/${d.dndbeyond_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors mt-3"
          >
            <ExternalLink className="w-3 h-3" />
            View on D&D Beyond
          </a>
        )}
      </div>

      {/* Combat stats */}
      <CombatStats
        ac={d.armor_class ? String(d.armor_class) : null}
        hp={d.max_hit_points ? String(d.max_hit_points) : null}
        speed={d.walking_speed ? `${d.walking_speed} ft` : null}
      />

      {/* Ability scores */}
      {system?.hasAbilityScores && <AbilityScoresGrid scores={abilities} />}

      {/* Passive skills */}
      {system?.hasAbilityScores && (d.passive_perception || d.passive_investigation || d.passive_insight) && (
        <div className="pt-3 border-t dark:border-zinc-800 border-gray-200">
          <p className="text-[11px] uppercase tracking-widest dark:text-zinc-500 text-gray-400 font-semibold mb-2">
            Passive Skills
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            {d.passive_perception && (
              <span>
                <span className="dark:text-zinc-500 text-gray-500">Perception </span>
                <span className="dark:text-zinc-200 text-gray-900 font-bold">{d.passive_perception}</span>
              </span>
            )}
            {d.passive_investigation && (
              <span>
                <span className="dark:text-zinc-500 text-gray-500">Investigation </span>
                <span className="dark:text-zinc-200 text-gray-900 font-bold">{d.passive_investigation}</span>
              </span>
            )}
            {d.passive_insight && (
              <span>
                <span className="dark:text-zinc-500 text-gray-500">Insight </span>
                <span className="dark:text-zinc-200 text-gray-900 font-bold">{d.passive_insight}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Personality */}
      <NarrativeSection title="Personality Traits" text={d.personality_traits} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Ideals" text={d.ideals} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Bonds" text={d.bonds} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Flaws" text={d.flaws} entities={campaignEntities} campaignId={form.campaign_id} />

      {/* Campaign notes */}
      <NarrativeSection title="Character Arc & Goals" text={d.arc} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Personal Quest Hooks" text={d.hooks} entities={campaignEntities} campaignId={form.campaign_id} />
      <NarrativeSection title="Relationships with Party" text={d.relationships} entities={campaignEntities} campaignId={form.campaign_id} />
    </StatCard>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────
export default function EntityStatBlockView({ form, system, campaignEntities }) {
  switch (form.entity_type) {
    case 'npc':              return <NPCView form={form} system={system} campaignEntities={campaignEntities} />;
    case 'creature':         return <CreatureView form={form} system={system} campaignEntities={campaignEntities} />;
    case 'player_character': return <PCView form={form} system={system} campaignEntities={campaignEntities} />;
    default:                 return null;
  }
}
