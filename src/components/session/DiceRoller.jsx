import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const DICE = [4, 6, 8, 10, 12, 20, 100];
const TUMBLE_MS = 600;   // how long the "spin" lasts
const TUMBLE_TICK = 55;  // how fast the numbers cycle

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export default function DiceRoller() {
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [adv, setAdv] = useState(null); // 'adv' | 'dis' | null
  // While rolling, the result box "tumbles" — cycles random plausible totals
  // slot-machine style — then settles on the real result with a pop.
  const [tumble, setTumble] = useState(null); // { value, label } | null
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const roll = (sides) => {
    if (rolling) return;
    // The real result is decided up front; the tumble is pure theater.
    const rolls = Array.from({ length: count }, () => rollDie(sides));
    let pair = null;
    let finalRoll = rolls[0];
    if (adv && sides === 20 && count === 1) {
      const second = rollDie(20);
      pair = [rolls[0], second];
      finalRoll = adv === 'adv' ? Math.max(rolls[0], second) : Math.min(rolls[0], second);
    }
    const usedRolls = pair ? [finalRoll] : rolls;
    const total = usedRolls.reduce((a, b) => a + b, 0) + modifier;
    const modStr = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : '';
    const advLabel = adv && sides === 20 && count === 1 ? (adv === 'adv' ? ' (adv)' : ' (dis)') : '';
    const label = `${count}d${sides}${modStr}${advLabel}`;
    const entry = { id: Date.now(), label, rolls: usedRolls, pair, total, sides, adv: adv && sides === 20 && count === 1 ? adv : null };

    const min = count + modifier;
    const max = count * sides + modifier;
    setRolling(true);
    const t0 = Date.now();
    const tick = () => {
      if (Date.now() - t0 >= TUMBLE_MS) {
        setTumble(null);
        setResults((prev) => [entry, ...prev.slice(0, 9)]);
        setRolling(false);
        return;
      }
      setTumble({ value: Math.floor(Math.random() * (max - min + 1)) + min, label });
      timers.current.push(setTimeout(tick, TUMBLE_TICK));
    };
    tick();
  };

  const lastResult = results[0];

  return (
    <div className="rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/60 bg-white overflow-hidden">
      <div className="px-3 py-2 border-b dark:border-zinc-800 border-zinc-200 flex items-center justify-between">
        <span className="text-xs font-semibold dark:text-zinc-300 text-zinc-700 uppercase tracking-wider">Dice Roller</span>
        {results.length > 0 && (
          <button onClick={() => setResults([])} className="text-[10px] dark:text-zinc-600 text-zinc-400 hover:text-red-400 transition-colors">
            Clear
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Count + Modifier */}
        <div className="flex items-center gap-2 text-xs">
          <span className="dark:text-zinc-500 text-zinc-500">Qty</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600 flex items-center justify-center font-bold hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors">−</button>
            <span className="w-5 text-center font-bold dark:text-zinc-200 text-zinc-800">{count}</span>
            <button onClick={() => setCount((c) => Math.min(20, c + 1))} className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600 flex items-center justify-center font-bold hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors">+</button>
          </div>
          <span className="dark:text-zinc-500 text-zinc-500 ml-2">Mod</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setModifier((m) => m - 1)} className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600 flex items-center justify-center font-bold hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors">−</button>
            <span className="w-7 text-center font-bold dark:text-zinc-200 text-zinc-800">{modifier >= 0 ? `+${modifier}` : modifier}</span>
            <button onClick={() => setModifier((m) => m + 1)} className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600 flex items-center justify-center font-bold hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors">+</button>
          </div>
        </div>

        {/* Advantage / Disadvantage — only applies to d20 single rolls */}
        <div className="space-y-1">
          <p className="text-[10px] dark:text-zinc-600 text-zinc-400">d20 roll mode</p>
          <div className="flex gap-1.5">
            {[{ key: 'adv', label: 'Adv', color: 'text-green-500 border-green-500/50 bg-green-500/10' }, { key: 'dis', label: 'Dis', color: 'text-red-400 border-red-400/50 bg-red-400/10' }].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setAdv((a) => a === key ? null : key)}
                title={key === 'adv' ? 'Roll 2d20, keep highest' : 'Roll 2d20, keep lowest'}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-[10px] font-semibold border transition-all",
                  adv === key ? color : "dark:border-zinc-700 border-zinc-200 dark:text-zinc-500 text-zinc-400 dark:bg-zinc-800 bg-zinc-50 hover:dark:border-zinc-600 hover:border-zinc-300"
                )}
              >
                {label}
                {adv === key && <span className="ml-1 opacity-60">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Dice buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {DICE.map((d) => (
            <button
              key={d}
              onClick={() => roll(d)}
              disabled={rolling}
              className={cn(
                "py-2 rounded-lg text-xs font-bold transition-all active:scale-95",
                "dark:bg-zinc-800 dark:hover:bg-amber-500/20 dark:border dark:border-zinc-700 dark:hover:border-amber-500/40 dark:text-zinc-300 dark:hover:text-amber-400",
                "bg-zinc-100 hover:bg-amber-50 border border-zinc-200 hover:border-amber-300 text-zinc-700 hover:text-amber-700",
                rolling && "opacity-50 cursor-not-allowed"
              )}
            >
              d{d}
            </button>
          ))}
        </div>

        {/* Latest result (or the in-flight tumble) */}
        {tumble && (
          <div className="rounded-lg px-3 py-2.5 text-center dark:bg-zinc-800/80 dark:border dark:border-zinc-700 bg-zinc-50 border border-zinc-200 animate-dice-shake">
            <div className="text-2xl font-black dark:text-zinc-400 text-zinc-500 blur-[0.5px] tabular-nums">
              {tumble.value}
            </div>
            <div className="text-[10px] dark:text-zinc-600 text-zinc-400 mt-0.5">{tumble.label}…</div>
          </div>
        )}
        {!tumble && lastResult && (
          <div key={lastResult.id} className={cn(
            "rounded-lg px-3 py-2.5 text-center transition-all animate-in fade-in zoom-in-90 duration-300",
            "dark:bg-zinc-800/80 dark:border dark:border-zinc-700 bg-zinc-50 border border-zinc-200"
          )}>
            <div className={cn(
              "text-2xl font-black animate-in zoom-in-50 duration-300",
              lastResult.total === lastResult.sides * count + modifier ? "text-amber-400" :
              lastResult.total === count + modifier ? "text-red-500" : "dark:text-zinc-100 text-zinc-900"
            )}>
              {lastResult.total}
            </div>
            <div className="text-[10px] dark:text-zinc-500 text-zinc-500 mt-0.5">
              {lastResult.label} →{' '}
              {lastResult.pair ? (() => {
                const [a, b] = lastResult.pair;
                const keptIdx = lastResult.adv === 'adv' ? (a >= b ? 0 : 1) : (a <= b ? 0 : 1);
                return lastResult.pair.map((v, i) => (
                  <span key={i} className={cn(
                    i === keptIdx ? (lastResult.adv === 'adv' ? 'text-green-500 font-bold' : 'text-red-400 font-bold') : 'line-through opacity-40'
                  )}>
                    {i === 0 ? '[' : ' '}{v}{i === 1 ? ']' : ','}
                  </span>
                ));
              })() : `[${lastResult.rolls.join(', ')}]`}
              {modifier !== 0 ? ` + (${modifier})` : ''}
            </div>
            {lastResult.sides === 20 && count === 1 && modifier === 0 && (
              <div className="text-[10px] font-semibold mt-0.5">
                {lastResult.total === 20 && <span className="text-amber-400">✦ Natural 20!</span>}
                {lastResult.total === 1 && <span className="text-red-500">✦ Critical Fail!</span>}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {results.length > 1 && (
          <div className="space-y-1">
            {results.slice(1).map((r) => (
              <div key={r.id} className="flex justify-between text-[10px] dark:text-zinc-600 text-zinc-400 px-1">
                <span>{r.label}</span>
                <span className="font-semibold dark:text-zinc-500 text-zinc-500">{r.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}