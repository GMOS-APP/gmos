import React, { useState } from 'react';
import { Zap, Shield, Heart, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Parse "97 (13d10 + 26)" → { value: "97", dice: "13d10+26" }
function parseHP(str) {
  if (!str) return null;
  const m = str.match(/(\d+)\s*\(([^)]+)\)/);
  if (m) return { value: m[1], dice: m[2].replace(/\s/g, '') };
  const n = str.match(/(\d+)/);
  return n ? { value: n[1], dice: null } : null;
}

// Parse "19 / 10 / 16 / 7 / 12 / 8" → { STR:19, DEX:10, … }
function parseAbilityScores(str) {
  if (!str) return null;
  const nums = str.split(/[\s/,]+/).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 30);
  if (nums.length < 6) return null;
  return Object.fromEntries(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((k, i) => [k, nums[i]]));
}

const DiceButton = ({ notation, label }) => {
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
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono transition-all ml-1',
        rolling
          ? 'bg-amber-500/20 text-amber-300'
          : result !== null
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'dark:bg-zinc-800/60 dark:text-zinc-500 dark:hover:text-amber-400 bg-gray-200 text-gray-600 hover:text-amber-600'
      )}
    >
      {result !== null ? <span className="font-bold">{result}</span> : <span>{label ?? notation}</span>}
    </button>
  );
};

const AbilityScore = ({ name, score }) => {
  const mod = Math.floor((score - 10) / 2);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg dark:bg-zinc-900/60 dark:border dark:border-zinc-800 bg-gray-100 border border-gray-300">
      <span className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-gray-500 font-semibold">{name}</span>
      <span className="text-base font-bold dark:text-zinc-200 text-gray-900">{score}</span>
      <DiceButton notation={`1d20${modStr}`} label={modStr} />
    </div>
  );
};

function StatSection({ title, text }) {
  if (!text) return null;
  return (
    <div className="pt-3 border-t dark:border-zinc-800 border-gray-200">
      <p className="text-[10px] uppercase tracking-widest dark:text-zinc-500 text-gray-400 font-semibold mb-1.5">{title}</p>
      <p className="text-sm dark:text-zinc-300 text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

// ── Structured stat block (from extra_data) ──────────────────────────────────
function StructuredStatBlock({ extraData, system }) {
  const hp = parseHP(extraData.hp);
  const abilities = system?.hasAbilityScores ? parseAbilityScores(extraData.ability_scores) : null;
  const showCR = system?.hasXpCrSystem && extraData.cr;
  const hasCombatStats = extraData.ac || extraData.hp || extraData.speed;

  return (
    <div className="rounded-xl border-2 dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 border-amber-600/30 bg-gradient-to-br from-white to-gray-50 p-5 space-y-4">
      {(extraData.size || extraData.creature_type) && (
        <div className="border-b-2 dark:border-amber-500/20 border-amber-600/20 pb-2">
          <p className="text-xs dark:text-zinc-400 text-gray-500 italic">
            {[extraData.size, extraData.creature_type].filter(Boolean).join(' ')}
          </p>
        </div>
      )}

      {hasCombatStats && (
        <div className="grid grid-cols-3 gap-3">
          {extraData.ac && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 flex-shrink-0">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">AC</p>
                <p className="text-base font-bold dark:text-zinc-100 text-gray-900">{extraData.ac}</p>
              </div>
            </div>
          )}
          {hp && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/10 flex-shrink-0">
                <Heart className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">HP</p>
                <p className="text-base font-bold dark:text-zinc-100 text-gray-900 flex items-center flex-wrap gap-1">
                  {hp.value}
                  {hp.dice && <DiceButton notation={hp.dice} label={`(${hp.dice})`} />}
                </p>
              </div>
            </div>
          )}
          {extraData.speed && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-500/10 flex-shrink-0">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">Speed</p>
                <p className="text-sm dark:text-zinc-300 text-gray-900 leading-tight">{extraData.speed}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {abilities && (
        <div className="pt-2 border-t dark:border-zinc-800 border-gray-200">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {Object.entries(abilities).map(([k, v]) => (
              <AbilityScore key={k} name={k} score={v} />
            ))}
          </div>
        </div>
      )}

      {showCR && (
        <div className="flex items-center gap-2">
          <Skull className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs dark:text-zinc-500 text-gray-500 font-semibold">Challenge</span>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">CR {extraData.cr}</Badge>
        </div>
      )}

      <StatSection title="Traits" text={extraData.traits} />
      <StatSection title="Actions" text={extraData.actions} />
      <StatSection title="Tactics" text={extraData.tactics} />
    </div>
  );
}

// ── Parsed stat block (from description text — legacy / AI-generated) ─────────
function ParsedStatBlock({ description }) {
  const parseStatBlock = (text) => {
    if (!text) return null;
    const data = {};

    const sizeMatch =
      text.match(/\*\*?(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([\w\s]+?),?\s*(\w+\s?\w*)\*\*?/i) ||
      text.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([\w\s]+?),?\s*(\w+\s?\w*)/i);
    if (sizeMatch) { data.size = sizeMatch[1]; data.type = sizeMatch[2].trim(); data.alignment = sizeMatch[3]; }

    const acMatch = text.match(/(?:\*\*)?(?:Armor Class|AC)(?:\*\*)?[:\s*]+(\d+)(?:\s*\(([^)]+)\))?/i);
    if (acMatch) { data.ac = acMatch[1]; data.acType = acMatch[2]; }

    const hpMatch = text.match(/(?:\*\*)?(?:Hit Points|HP)(?:\*\*)?[:\s*]+(\d+)(?:\s*\(([^)]+)\))?/i);
    if (hpMatch) { data.hp = hpMatch[1]; data.hpDice = hpMatch[2]; }

    const speedMatch = text.match(/(?:\*\*)?Speed(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (speedMatch) data.speed = speedMatch[1].trim().replace(/\*\*/g, '');

    const abilityMatch = text.match(
      /(?:STR|Strength)[\s:*]+(\d+)[\s\S]*?(?:DEX|Dexterity)[\s:*]+(\d+)[\s\S]*?(?:CON|Constitution)[\s:*]+(\d+)[\s\S]*?(?:INT|Intelligence)[\s:*]+(\d+)[\s\S]*?(?:WIS|Wisdom)[\s:*]+(\d+)[\s\S]*?(?:CHA|Charisma)[\s:*]+(\d+)/i
    );
    if (abilityMatch) {
      data.abilities = {
        STR: parseInt(abilityMatch[1]), DEX: parseInt(abilityMatch[2]),
        CON: parseInt(abilityMatch[3]), INT: parseInt(abilityMatch[4]),
        WIS: parseInt(abilityMatch[5]), CHA: parseInt(abilityMatch[6]),
      };
    }

    const crMatch = text.match(/(?:\*\*)?(?:Challenge Rating|Challenge|CR)(?:\*\*)?[:\s*]+([\d/]+)/i);
    if (crMatch) data.cr = crMatch[1];

    const savesMatch = text.match(/(?:\*\*)?(?:Saving Throws|Saves)(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (savesMatch) data.saves = savesMatch[1].trim().replace(/\*\*/g, '');

    const skillsMatch = text.match(/(?:\*\*)?Skills(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (skillsMatch) data.skills = skillsMatch[1].trim().replace(/\*\*/g, '');

    const sensesMatch = text.match(/(?:\*\*)?Senses(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (sensesMatch) data.senses = sensesMatch[1].trim().replace(/\*\*/g, '');

    const langMatch = text.match(/(?:\*\*)?Languages(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (langMatch) data.languages = langMatch[1].trim().replace(/\*\*/g, '');

    return (data.ac || data.hp || data.abilities) ? data : null;
  };

  const stats = parseStatBlock(description);
  if (!stats) return null;

  return (
    <div className="rounded-xl border-2 dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 border-amber-600/30 bg-gradient-to-br from-white to-gray-50 p-5 space-y-4">
      {stats.size && stats.type && (
        <div className="border-b-2 dark:border-amber-500/20 border-amber-600/20 pb-2">
          <p className="text-xs dark:text-zinc-400 text-gray-500 italic">
            {stats.size} {stats.type}{stats.alignment && `, ${stats.alignment}`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {stats.ac && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10"><Shield className="w-4 h-4 text-blue-400" /></div>
            <div>
              <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">AC</p>
              <p className="text-base font-bold dark:text-zinc-100 text-gray-900">
                {stats.ac}
                {stats.acType && <span className="text-xs dark:text-zinc-500 text-gray-500 ml-1">({stats.acType})</span>}
              </p>
            </div>
          </div>
        )}
        {stats.hp && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10"><Heart className="w-4 h-4 text-red-400" /></div>
            <div>
              <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">HP</p>
              <p className="text-base font-bold dark:text-zinc-100 text-gray-900 flex items-center gap-1">
                {stats.hp}
                {stats.hpDice && <DiceButton notation={stats.hpDice} label={`(${stats.hpDice})`} />}
              </p>
            </div>
          </div>
        )}
        {stats.speed && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-green-500/10"><Zap className="w-4 h-4 text-green-400" /></div>
            <div>
              <p className="text-[10px] dark:text-zinc-500 text-gray-500 uppercase tracking-wider font-semibold">Speed</p>
              <p className="text-sm dark:text-zinc-300 text-gray-900">{stats.speed}</p>
            </div>
          </div>
        )}
      </div>

      {stats.abilities && (
        <div className="pt-2 border-t dark:border-zinc-800 border-gray-200">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {Object.entries(stats.abilities).map(([k, v]) => (
              <AbilityScore key={k} name={k} score={v} />
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t dark:border-zinc-800 border-gray-200 space-y-1.5 text-sm">
        {stats.saves && (
          <div className="flex gap-2">
            <span className="dark:text-zinc-500 text-gray-500 font-semibold min-w-[120px]">Saving Throws</span>
            <span className="dark:text-zinc-300 text-gray-700">{stats.saves}</span>
          </div>
        )}
        {stats.skills && (
          <div className="flex gap-2">
            <span className="dark:text-zinc-500 text-gray-500 font-semibold min-w-[120px]">Skills</span>
            <span className="dark:text-zinc-300 text-gray-700">{stats.skills}</span>
          </div>
        )}
        {stats.senses && (
          <div className="flex gap-2">
            <span className="dark:text-zinc-500 text-gray-500 font-semibold min-w-[120px]">Senses</span>
            <span className="dark:text-zinc-300 text-gray-700">{stats.senses}</span>
          </div>
        )}
        {stats.languages && (
          <div className="flex gap-2">
            <span className="dark:text-zinc-500 text-gray-500 font-semibold min-w-[120px]">Languages</span>
            <span className="dark:text-zinc-300 text-gray-700">{stats.languages}</span>
          </div>
        )}
        {stats.cr && (
          <div className="flex items-center gap-2 pt-1">
            <Skull className="w-3.5 h-3.5 text-amber-400" />
            <span className="dark:text-zinc-500 text-gray-500 font-semibold">Challenge</span>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">CR {stats.cr}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────
export default function StatBlock({ extraData, system, description }) {
  const hasStructured = extraData && (
    extraData.ac || extraData.hp || extraData.speed ||
    extraData.creature_type || extraData.traits || extraData.actions
  );

  if (hasStructured) {
    return <StructuredStatBlock extraData={extraData} system={system} />;
  }

  if (description) {
    return <ParsedStatBlock description={description} />;
  }

  return null;
}
