import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const BOOT_SEQUENCES = [
  // Sequence 1: Campaign & World Systems
  [
    { text: 'GM/OS v2.6.1 — Game Master Operating System', delay: 0 },
    { text: 'Copyright (c) The Realm. All rights reserved.', delay: 150 },
    { text: '', delay: 250 },
    { text: 'Initializing core systems...', delay: 400 },
    { text: '  ✓  Campaign registry', delay: 580 },
    { text: '  ✓  World state engine', delay: 740 },
    { text: '  ✓  NPC consciousness layer', delay: 900 },
    { text: '  ✓  Lore index', delay: 1060 },
    { text: '  ✓  Dice entropy seed', delay: 1220 },
    { text: '', delay: 1360 },
    { text: 'Loading encounter matrices...', delay: 1500 },
    { text: '  ✓  Initiative tracker', delay: 1660 },
    { text: '  ✓  Creature behavior trees', delay: 1820 },
    { text: '  ✓  Spell slot daemon', delay: 1980 },
    { text: '', delay: 2100 },
    { text: 'Authenticating Game Master...', delay: 2280 },
    { text: '  ✓  Identity verified', delay: 2600 },
    { text: '  ✓  Realm access granted', delay: 2800 },
    { text: '', delay: 2950 },
    { text: 'All systems nominal.', delay: 3100 },
    { text: '', delay: 3250 },
    { text: 'Welcome back, Master of Games.', delay: 3400, highlight: true },
  ],
  // Sequence 2: Magic & Arcane Systems
  [
    { text: 'GM/OS v2.6.1 — Game Master Operating System', delay: 0 },
    { text: 'Copyright (c) The Realm. All rights reserved.', delay: 150 },
    { text: '', delay: 250 },
    { text: 'Binding planar anchors...', delay: 400 },
    { text: '  ✓  Summon gate protocol', delay: 580 },
    { text: '  ✓  Magic circle matrices', delay: 740 },
    { text: '  ✓  Familiar liaison link', delay: 900 },
    { text: '  ✓  Spell component cache', delay: 1060 },
    { text: '  ✓  Transmutation codex', delay: 1220 },
    { text: '', delay: 1360 },
    { text: 'Charging mana pools...', delay: 1500 },
    { text: '  ✓  Eldritch energy stabilized', delay: 1660 },
    { text: '  ✓  Ley line synchronization', delay: 1820 },
    { text: '  ✓  Arcane resonance tuned', delay: 1980 },
    { text: '', delay: 2100 },
    { text: 'Verifying spellcaster credentials...', delay: 2280 },
    { text: '  ✓  Oath confirmed', delay: 2600 },
    { text: '  ✓  Power unlocked', delay: 2800 },
    { text: '', delay: 2950 },
    { text: 'The Weave awaits.', delay: 3100 },
    { text: '', delay: 3250 },
    { text: 'Welcome back, Keeper of Magic.', delay: 3400, highlight: true },
  ],
  // Sequence 3: Ancient Tavern Chronicle
  [
    { text: 'GM/OS v2.6.1 — Game Master Operating System', delay: 0 },
    { text: 'Copyright (c) The Realm. All rights reserved.', delay: 150 },
    { text: '', delay: 250 },
    { text: 'Unfurling adventure records...', delay: 400 },
    { text: '  ✓  Quest ledger recovered', delay: 580 },
    { text: '  ✓  Hero chronicles indexed', delay: 740 },
    { text: '  ✓  Monster accounts tallied', delay: 900 },
    { text: '  ✓  Treasure manifests catalogued', delay: 1060 },
    { text: '  ✓  Prophecy texts decoded', delay: 1220 },
    { text: '', delay: 1360 },
    { text: 'Loading legendary conflicts...', delay: 1500 },
    { text: '  ✓  Dragon encounters logged', delay: 1660 },
    { text: '  ✓  Battle tactics reviewed', delay: 1820 },
    { text: '  ✓  Victory scrolls inscribed', delay: 1980 },
    { text: '', delay: 2100 },
    { text: 'Authenticating storyteller...', delay: 2280 },
    { text: '  ✓  Voice recognized', delay: 2600 },
    { text: '  ✓  Stories ready to be told', delay: 2800 },
    { text: '', delay: 2950 },
    { text: 'All tales are ready.', delay: 3100 },
    { text: '', delay: 3250 },
    { text: 'Welcome back, Weaver of Legends.', delay: 3400, highlight: true },
  ],
  // Sequence 4: Combat & Tactics
  [
    { text: 'GM/OS v2.6.1 — Game Master Operating System', delay: 0 },
    { text: 'Copyright (c) The Realm. All rights reserved.', delay: 150 },
    { text: '', delay: 250 },
    { text: 'Loading tactical systems...', delay: 400 },
    { text: '  ✓  Battlefield mapper', delay: 580 },
    { text: '  ✓  Weapon loadouts', delay: 740 },
    { text: '  ✓  Armor registry', delay: 900 },
    { text: '  ✓  Combat algorithms', delay: 1060 },
    { text: '  ✓  Ability trees', delay: 1220 },
    { text: '', delay: 1360 },
    { text: 'Deploying squad modules...', delay: 1500 },
    { text: '  ✓  Squad coordination active', delay: 1660 },
    { text: '  ✓  Loot distribution ready', delay: 1820 },
    { text: '  ✓  Advancement protocols loaded', delay: 1980 },
    { text: '', delay: 2100 },
    { text: 'Validating commander status...', delay: 2280 },
    { text: '  ✓  Authority confirmed', delay: 2600 },
    { text: '  ✓  Battlefield access granted', delay: 2800 },
    { text: '', delay: 2950 },
    { text: 'Ready for engagement.', delay: 3100 },
    { text: '', delay: 3250 },
    { text: 'Welcome back, Commander.', delay: 3400, highlight: true },
  ],
];

const BUTTON_TEXTS = [
  'Enter the Realm',
  'Begin the Adventure',
  'Begin Your Quest',
  'Unroll Your Scroll',
  'Commence Campaign',
  'Cross the Threshold',
  'Step Into Legend',
  'Awaken the Story',
  'Open the Grimoire',
  'Draw Your Blade',
];

function getRandomSequence() {
  return BOOT_SEQUENCES[Math.floor(Math.random() * BOOT_SEQUENCES.length)];
}

function getRandomButtonText() {
  return BUTTON_TEXTS[Math.floor(Math.random() * BUTTON_TEXTS.length)];
}

export default function BootSequence({ userName, onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [done, setDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const bottomRef = useRef(null);
  const [buttonText] = useState(getRandomButtonText());
  const [bootSequence] = useState(getRandomSequence());

  const personalizedLines = bootSequence.map((line) => {
    if (line.highlight && userName) {
      return { ...line, text: `Welcome back, ${userName.split(' ')[0]}.` };
    }
    return line;
  });

  useEffect(() => {
    const timers = personalizedLines.map((line, i) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
        if (i === personalizedLines.length - 1) {
          setTimeout(() => setDone(true), 700);
        }
      }, line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLines]);

  const handleEnter = () => {
    setFadeOut(true);
    setTimeout(onComplete, 500);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="w-full max-w-xl px-6">

        {/* Logo / title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center">
              <span className="text-zinc-950 font-black text-sm">D</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">GM<span className="text-amber-500">/OS</span></span>
          </div>
          <p className="text-xs text-zinc-600 tracking-widest uppercase">System Boot</p>
        </div>

        {/* Terminal card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="ml-3 text-xs text-zinc-600 font-mono tracking-widest">gm/os — boot.log</span>
          </div>

          {/* Log lines */}
          <div className="p-5 min-h-56 max-h-80 overflow-y-auto font-mono text-sm space-y-0.5">
            {visibleLines.map((line, i) => (
              <div key={i} className={
                line.highlight
                  ? 'text-amber-400 font-semibold mt-1'
                  : line.text.startsWith('  ✓')
                  ? 'text-zinc-400'
                  : line.text === ''
                  ? 'h-2.5'
                  : 'text-zinc-500'
              }>
                {line.text.startsWith('  ✓') ? (
                  <>
                    <span className="text-amber-500 mr-2">✓</span>
                    <span>{line.text.replace('  ✓  ', '')}</span>
                  </>
                ) : (
                  line.text || '\u00A0'
                )}
              </div>
            ))}

            {/* Blinking cursor while running */}
            {!done && (
              <span className="inline-block w-1.5 h-4 bg-amber-500/70 animate-pulse rounded-sm" />
            )}
            <div ref={bottomRef} />
          </div>

          {/* CTA */}
          {done && (
           <div className="px-5 pb-5">
             <button
               onClick={handleEnter}
               className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold tracking-wide transition-colors"
             >
               {buttonText}
             </button>
           </div>
          )}
        </div>
      </div>
    </div>
  );
}