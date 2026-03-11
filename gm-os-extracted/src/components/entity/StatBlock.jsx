import React, { useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Skull, Heart, Zap, Shield, Eye, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const DiceIcon = ({ value }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[Math.min(Math.max(value - 1, 0), 5)] || Dice6;
  return <Icon className="w-4 h-4" />;
};

const DiceRoller = ({ notation, label, modifier = 0 }) => {
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);

  const rollDice = () => {
    setRolling(true);
    
    // Parse dice notation (e.g., "2d8+3")
    const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return;

    const [, numDice, dieSize, modStr] = match;
    const num = parseInt(numDice);
    const size = parseInt(dieSize);
    const mod = modStr ? parseInt(modStr) : modifier;

    let total = mod;
    const rolls = [];
    
    for (let i = 0; i < num; i++) {
      const roll = Math.floor(Math.random() * size) + 1;
      rolls.push(roll);
      total += roll;
    }

    setTimeout(() => {
      setResult({ total, rolls, modifier: mod });
      setRolling(false);
      setTimeout(() => setResult(null), 3000);
    }, 300);
  };

  return (
    <button
      onClick={rollDice}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all",
        rolling ? "bg-amber-500/20 text-amber-300 scale-95" : "dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-amber-400 bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-amber-600"
      )}
    >
      {rolling ? (
        <Zap className="w-3 h-3 animate-spin" />
      ) : result ? (
        <>
          <span className="font-bold text-amber-400">{result.total}</span>
          <span className="text-[10px] dark:text-zinc-500 text-gray-600">
            [{result.rolls.join('+')}
            {result.modifier !== 0 && (result.modifier > 0 ? `+${result.modifier}` : result.modifier)}]
          </span>
        </>
      ) : (
        <>
          <DiceIcon value={parseInt(notation.match(/d(\d+)/)?.[1] || 6)} />
          <span>{label || notation}</span>
        </>
      )}
    </button>
  );
};

const AbilityScore = ({ name, score }) => {
  const modifier = Math.floor((score - 10) / 2);
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg dark:bg-zinc-900/60 dark:border-zinc-800 bg-gray-100 border border-gray-300">
      <span className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-gray-600 font-semibold">{name}</span>
      <span className="text-lg font-bold dark:text-zinc-200 text-gray-900">{score}</span>
      <DiceRoller notation={`1d20${modStr}`} label={modStr} modifier={modifier} />
    </div>
  );
};

export default function StatBlock({ description }) {
  // Parse the description to extract stat block data
  const parseStatBlock = (text) => {
    if (!text) return null;

    const data = {};

    // Extract basic info - more flexible patterns
    const sizeMatch = text.match(/\*\*?(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([\w\s]+?),?\s*(\w+\s?\w*)\*\*?/i) ||
                      text.match(/(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([\w\s]+?),?\s*(\w+\s?\w*)/i);
    if (sizeMatch) {
      data.size = sizeMatch[1];
      data.type = sizeMatch[2].trim();
      data.alignment = sizeMatch[3];
    }

    // Extract AC - multiple patterns
    const acMatch = text.match(/(?:\*\*)?(?:Armor Class|AC)(?:\*\*)?[:\s*]+(\d+)(?:\s*\(([^)]+)\))?/i);
    if (acMatch) {
      data.ac = acMatch[1];
      data.acType = acMatch[2];
    }

    // Extract HP - multiple patterns
    const hpMatch = text.match(/(?:\*\*)?(?:Hit Points|HP)(?:\*\*)?[:\s*]+(\d+)(?:\s*\(([^)]+)\))?/i);
    if (hpMatch) {
      data.hp = hpMatch[1];
      data.hpDice = hpMatch[2];
    }

    // Extract Speed
    const speedMatch = text.match(/(?:\*\*)?(?:Speed)(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (speedMatch) {
      data.speed = speedMatch[1].trim().replace(/\*\*/g, '');
    }

    // Extract ability scores - handle both formats (with modifiers or without)
    const abilityPattern = /(?:STR|Strength)[\s:*]+(\d+)[\s\S]*?(?:DEX|Dexterity)[\s:*]+(\d+)[\s\S]*?(?:CON|Constitution)[\s:*]+(\d+)[\s\S]*?(?:INT|Intelligence)[\s:*]+(\d+)[\s\S]*?(?:WIS|Wisdom)[\s:*]+(\d+)[\s\S]*?(?:CHA|Charisma)[\s:*]+(\d+)/i;
    const abilityMatch = text.match(abilityPattern);
    
    if (abilityMatch) {
      data.abilities = {
        STR: parseInt(abilityMatch[1]),
        DEX: parseInt(abilityMatch[2]),
        CON: parseInt(abilityMatch[3]),
        INT: parseInt(abilityMatch[4]),
        WIS: parseInt(abilityMatch[5]),
        CHA: parseInt(abilityMatch[6]),
      };
    }

    // Extract CR
    const crMatch = text.match(/(?:\*\*)?(?:Challenge Rating|Challenge|CR)(?:\*\*)?[:\s*]+([\d/]+)/i);
    if (crMatch) {
      data.cr = crMatch[1];
    }

    // Extract skills
    const skillsMatch = text.match(/(?:\*\*)?(?:Skills)(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (skillsMatch) {
      data.skills = skillsMatch[1].trim().replace(/\*\*/g, '');
    }

    // Extract senses
    const sensesMatch = text.match(/(?:\*\*)?(?:Senses)(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (sensesMatch) {
      data.senses = sensesMatch[1].trim().replace(/\*\*/g, '');
    }

    // Extract languages
    const langMatch = text.match(/(?:\*\*)?(?:Languages)(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (langMatch) {
      data.languages = langMatch[1].trim().replace(/\*\*/g, '');
    }

    // Extract saving throws
    const savesMatch = text.match(/(?:\*\*)?(?:Saving Throws|Saves)(?:\*\*)?[:\s*]+([^\n*]+)/i);
    if (savesMatch) {
      data.saves = savesMatch[1].trim().replace(/\*\*/g, '');
    }

    // Only return if we found at least some core stats
    return (data.ac || data.hp || data.abilities) ? data : null;
  };

  const stats = parseStatBlock(description);

  if (!stats) return null;

  return (
    <div className="rounded-xl border-2 dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 border-amber-600 bg-gradient-to-br from-white to-gray-50 p-6 space-y-4">
      {/* Header */}
      <div className="dark:border-b-2 dark:border-amber-500/30 border-b-2 border-amber-600 pb-3">
        {stats.size && stats.type && (
          <p className="text-xs dark:text-zinc-400 text-gray-600 italic mb-1">
            {stats.size} {stats.type}{stats.alignment && `, ${stats.alignment}`}
          </p>
        )}
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.ac && (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-wider font-semibold">Armor Class</p>
              <p className="text-lg font-bold dark:text-zinc-100 text-gray-900">
                {stats.ac}
                {stats.acType && <span className="text-xs dark:text-zinc-500 text-gray-600 ml-1">({stats.acType})</span>}
              </p>
            </div>
          </div>
        )}

        {stats.hp && (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Heart className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-wider font-semibold">Hit Points</p>
              <p className="text-lg font-bold dark:text-zinc-100 text-gray-900">
                {stats.hp}
                {stats.hpDice && (
                  <span className="ml-2">
                    <DiceRoller notation={stats.hpDice} />
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {stats.speed && (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Zap className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs dark:text-zinc-500 text-gray-600 uppercase tracking-wider font-semibold">Speed</p>
              <p className="text-sm dark:text-zinc-300 text-gray-900">{stats.speed}</p>
            </div>
          </div>
        )}
      </div>

      {/* Ability Scores */}
      {stats.abilities && (
        <div className="pt-4 dark:border-t dark:border-zinc-800 border-t border-gray-200">
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(stats.abilities).map(([name, score]) => (
              <AbilityScore key={name} name={name} score={score} />
            ))}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="pt-4 dark:border-t dark:border-zinc-800 border-t border-gray-200 space-y-2 text-sm">
        {stats.saves && (
          <div className="flex gap-2">
            <span className="dark:text-zinc-500 text-gray-600 font-semibold min-w-[120px]">Saving Throws</span>
            <span className="dark:text-zinc-300 text-gray-900">{stats.saves}</span>
          </div>
        )}

        {stats.skills && (
          <div className="flex gap-2">
            <span className="dark:text-zinc-500 text-gray-600 font-semibold min-w-[120px]">Skills</span>
            <span className="dark:text-zinc-300 text-gray-900">{stats.skills}</span>
          </div>
        )}

        {stats.senses && (
          <div className="flex gap-2 items-start">
            <Eye className="w-4 h-4 dark:text-zinc-500 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex gap-2">
              <span className="dark:text-zinc-500 text-gray-600 font-semibold">Senses</span>
              <span className="dark:text-zinc-300 text-gray-900">{stats.senses}</span>
            </div>
          </div>
        )}

        {stats.languages && (
          <div className="flex gap-2 items-start">
            <Languages className="w-4 h-4 dark:text-zinc-500 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex gap-2">
              <span className="dark:text-zinc-500 text-gray-600 font-semibold">Languages</span>
              <span className="dark:text-zinc-300 text-gray-900">{stats.languages}</span>
            </div>
          </div>
        )}

        {stats.cr && (
          <div className="flex gap-2 items-center pt-2">
            <Skull className="w-4 h-4 text-amber-400" />
            <span className="dark:text-zinc-500 text-gray-600 font-semibold">Challenge</span>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              CR {stats.cr}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}