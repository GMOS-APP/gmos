import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const GIVEN = ['Aldric', 'Bryn', 'Cael', 'Dara', 'Eris', 'Fenn', 'Gwen', 'Hale', 'Isolde', 'Joren', 'Kira', 'Loras', 'Mira', 'Nox', 'Orin', 'Petra', 'Quill', 'Rowan', 'Sera', 'Talia', 'Ulric', 'Vesper', 'Wren', 'Yara', 'Zephyr', 'Bram', 'Cordelia', 'Doran', 'Elowen', 'Garrick', 'Halric', 'Ingrid', 'Lysa', 'Mabon', 'Niamh', 'Osric', 'Perrin', 'Roesia', 'Soren', 'Thea'];
const SURNAME = ['Ashdown', 'Blackmoor', 'Coldwater', 'Dunmore', 'Emberfell', 'Frostbeck', 'Greywind', 'Hollow', 'Ironwood', 'Larkspur', 'Mournevale', 'Nighthill', 'Oakhart', 'Pellisar', 'Ravenscar', 'Stormrook', 'Thornbury', 'Underbough', 'Vexley', 'Westmere', 'Cinderholt', 'Duskbloom', 'Marsh', 'Tallow', 'Quint'];
const PLACE_PRE = ['Black', 'Grey', 'Raven', 'Iron', 'Storm', 'Ember', 'Frost', 'Thorn', 'Salt', 'Mist', 'Oak', 'Wolf', 'Red', 'Old', 'Dun', 'Bright', 'Crow', 'Stone', 'Holl', 'Fox'];
const PLACE_SUF = ['moor', 'hollow', 'reach', 'fell', 'crest', 'mere', 'ford', 'gate', 'watch', 'haven', 'barrow', 'march', 'hill', 'vale', 'wick', 'shade', 'cross', 'bridge', 'deep', 'run'];
const TAV_ADJ = ['Drowned', 'Gilded', 'Crooked', 'Laughing', 'Salty', 'Silver', 'Broken', 'Hungry', 'Weeping', 'Rusty', 'Prancing', 'Sleeping', 'Black', 'Brazen', 'Wandering', 'Cracked', 'Velvet', 'Howling'];
const TAV_NOUN = ['Rat', 'Lily', 'Crown', 'Dragon', 'Tankard', 'Stag', 'Mermaid', 'Lantern', 'Anchor', 'Boar', 'Raven', 'Spindle', 'Goblin', 'Hart', 'Kettle', 'Wyrm', 'Maiden', 'Hound'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const TABS = [
  { id: 'npc', label: 'NPC', gen: () => `${pick(GIVEN)} ${pick(SURNAME)}` },
  { id: 'place', label: 'Place', gen: () => `${pick(PLACE_PRE)}${pick(PLACE_SUF)}` },
  { id: 'tavern', label: 'Tavern', gen: () => `The ${pick(TAV_ADJ)} ${pick(TAV_NOUN)}` },
];

export default function NameGenerator() {
  const [tab, setTab] = useState('npc');
  const [names, setNames] = useState([]);
  const [copied, setCopied] = useState(null);

  const roll = useCallback((id = tab) => {
    const gen = TABS.find((t) => t.id === id).gen;
    const out = new Set();
    let guard = 0;
    while (out.size < 6 && guard++ < 50) out.add(gen());
    setNames([...out]);
  }, [tab]);

  useEffect(() => { roll(tab); }, [tab, roll]);

  const copy = (name) => {
    navigator.clipboard?.writeText(name);
    setCopied(name);
    setTimeout(() => setCopied((c) => (c === name ? null : c)), 1200);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'text-xs py-1 rounded-md border transition-colors',
              tab === t.id
                ? 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-0.5">
        {names.map((name) => (
          <button
            key={name}
            onClick={() => copy(name)}
            title="Click to copy"
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 group"
          >
            <span className="truncate">{name}</span>
            {copied === name
              ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              : <Copy className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 flex-shrink-0" />}
          </button>
        ))}
      </div>

      <button
        onClick={() => roll()}
        className="flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Generate more
      </button>
    </div>
  );
}
