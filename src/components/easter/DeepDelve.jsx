import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Heart, Coins, ChevronsDown, Zap, Sword, Sparkles, FlaskConical, ScrollText, DoorOpen } from 'lucide-react';
import {
  newGame, move, combatMelee, combatSpell, combatItem, combatFlee,
  W, H, VIEW_RADIUS, MAX_LEVEL, SPELL_COST, scoreOf,
} from '@/lib/deepDelve';

const MONSTER_COLOR = {
  r: 'text-red-400', k: 'text-red-400', g: 'text-orange-400', O: 'text-fuchsia-400', W: 'text-fuchsia-300',
};
const ITEM = {
  gold: { ch: '$', cls: 'text-yellow-400' },
  potion: { ch: '!', cls: 'text-emerald-400' },
  scroll: { ch: '?', cls: 'text-sky-400' },
  sign: { ch: '?', cls: 'text-sky-400' },
};

const MOVES = {
  ArrowUp: [0, -1], KeyW: [0, -1], KeyK: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1], KeyJ: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0], KeyH: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0], KeyL: [1, 0],
};

export default function DeepDelve({ onClose, initialState }) {
  const [state, setState] = useState(() => initialState || newGame());
  const stateRef = useRef(state);
  stateRef.current = state;
  const wonRef = useRef(false);

  const restart = useCallback(() => { wonRef.current = false; setState(newGame(stateRef.current)); }, []);

  // Combat actions (also used by number-key shortcuts).
  const act = {
    melee: () => setState((s) => combatMelee(s)),
    spell: () => setState((s) => combatSpell(s)),
    potion: () => setState((s) => combatItem(s, 'potion')),
    scroll: () => setState((s) => combatItem(s, 'scroll')),
    flee: () => setState((s) => combatFlee(s)),
  };

  // Capture keys while open so input never leaks to app hotkeys / scrolling.
  useEffect(() => {
    const onKey = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      const s = stateRef.current;
      if (s.status !== 'playing') { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); restart(); } return; }
      if (s.mode === 'combat') {
        const map = { Digit1: 'melee', Digit2: 'spell', Digit3: 'potion', Digit4: 'scroll', Digit5: 'flee', KeyF: 'flee' };
        const a = map[e.code];
        if (a) { e.preventDefault(); act[a](); }
        return;
      }
      const m = MOVES[e.code];
      if (m) { e.preventDefault(); setState((cur) => move(cur, m[0], m[1])); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, restart]);

  useEffect(() => {
    if (state.status === 'won' && !wonRef.current) {
      wonRef.current = true;
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
    }
  }, [state.status]);

  const { player: p } = state;
  const foe = state.mode === 'combat' ? state.monsters.find((m) => m.id === state.combatId) : null;

  // Compose the visible grid (map + items + monsters + player), gated by sight.
  const rows = [];
  for (let y = 0; y < H; y++) {
    const cells = [];
    for (let x = 0; x < W; x++) {
      if (!state.seen[y][x]) { cells.push({ ch: ' ', cls: '' }); continue; }
      const dim = Math.hypot(x - p.x, y - p.y) > VIEW_RADIUS;
      let cell = null;
      if (x === p.x && y === p.y) cell = { ch: '@', cls: 'text-amber-500 font-bold' };
      if (!cell) { const mon = state.monsters.find((m) => m.x === x && m.y === y); if (mon && !dim) cell = { ch: mon.glyph, cls: MONSTER_COLOR[mon.glyph] || 'text-red-400' }; }
      if (!cell) { const it = state.items.find((i) => i.x === x && i.y === y); if (it && !dim) cell = { ch: ITEM[it.kind].ch, cls: ITEM[it.kind].cls }; }
      if (!cell) {
        const t = state.map[y][x];
        if (t === '#') cell = { ch: '#', cls: 'text-zinc-600' };
        else if (t === '>') cell = { ch: '>', cls: 'text-cyan-400' };
        else if (t === '*') cell = { ch: '*', cls: 'text-yellow-300 font-bold' };
        else cell = { ch: '·', cls: 'text-zinc-700' };
      }
      if (dim) cell = { ...cell, cls: 'text-zinc-800' };
      cells.push(cell);
    }
    rows.push(cells);
  }

  const hpPct = Math.max(0, Math.round((p.hp / p.maxHp) * 100));

  const ActionBtn = ({ onClick, disabled, icon: Icon, label, hint, sub }) => (
    <button onClick={onClick} disabled={disabled}
      className="flex-1 min-w-[84px] flex flex-col items-center gap-0.5 px-2 py-2 rounded-md border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-amber-500/50 disabled:opacity-35 disabled:hover:bg-zinc-900 disabled:hover:border-zinc-700 transition-colors">
      <Icon className="w-4 h-4 text-amber-500" />
      <span className="text-xs font-medium text-zinc-200">{label}</span>
      <span className="text-[10px] text-zinc-500 font-mono">{sub || hint}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-zinc-800 bg-zinc-900">
          <span className="text-amber-500 font-bold tracking-widest text-xs">DEEP&nbsp;DELVE</span>
          <span className="text-[10px] text-zinc-500 font-mono">an original crawl</span>
          <button onClick={onClose} title="Close (Esc)" aria-label="Close"
            className="ml-auto w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status line */}
        <div className="flex items-center gap-3 sm:gap-4 px-4 py-2 text-xs font-mono border-b border-zinc-800 bg-zinc-900/50 flex-wrap">
          <span className="flex items-center gap-1.5 text-red-400"><Heart className="w-3.5 h-3.5" /> {Math.max(0, p.hp)}/{p.maxHp}</span>
          <span className="hidden sm:block w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><span className="block h-full bg-red-500 transition-all" style={{ width: `${hpPct}%` }} /></span>
          <span className="flex items-center gap-1.5 text-sky-400"><Zap className="w-3.5 h-3.5" /> {p.mp}/{p.maxMp}</span>
          <span className="flex items-center gap-1.5 text-yellow-400"><Coins className="w-3.5 h-3.5" /> {p.gold}g</span>
          <span className="flex items-center gap-1.5 text-emerald-400"><FlaskConical className="w-3.5 h-3.5" /> {p.inv.potion}</span>
          <span className="flex items-center gap-1.5 text-sky-300"><ScrollText className="w-3.5 h-3.5" /> {p.inv.scroll}</span>
          <span className="flex items-center gap-1.5 text-cyan-400"><ChevronsDown className="w-3.5 h-3.5" /> {state.level}/{MAX_LEVEL}</span>
          <span className="ml-auto text-zinc-500">best {state.best?.score || 0}</span>
        </div>

        {/* Dungeon */}
        <div className="relative bg-black px-3 py-3 overflow-x-auto">
          <div className="inline-block font-mono leading-none text-[15px] sm:text-[17px] select-none" style={{ letterSpacing: '0.06em' }}>
            {rows.map((cells, y) => (
              <div key={y} className="whitespace-pre">{cells.map((c, x) => (<span key={x} className={c.cls}>{c.ch}</span>))}</div>
            ))}
          </div>

          {/* Combat panel */}
          {state.mode === 'combat' && foe && state.status === 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-4">
              <div className="w-full max-w-md rounded-lg border border-amber-500/40 bg-zinc-950 p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-lg font-bold ${MONSTER_COLOR[foe.glyph] || 'text-red-400'}`}>{foe.glyph}</span>
                  <span className="text-sm font-semibold text-zinc-100 capitalize">{foe.name}</span>
                  <span className="ml-auto text-[11px] font-mono text-zinc-400">{Math.max(0, foe.hp)}/{foe.maxHp} HP</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden mb-4">
                  <span className="block h-full bg-red-500 transition-all" style={{ width: `${Math.max(0, Math.round((foe.hp / foe.maxHp) * 100))}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionBtn onClick={act.melee} icon={Sword} label="Melee" sub="1" />
                  <ActionBtn onClick={act.spell} icon={Sparkles} label="Spell" disabled={p.mp < SPELL_COST} sub={`2 · ${SPELL_COST}mp`} />
                  <ActionBtn onClick={act.potion} icon={FlaskConical} label="Potion" disabled={p.inv.potion < 1} sub={`3 · ×${p.inv.potion}`} />
                  <ActionBtn onClick={act.scroll} icon={ScrollText} label="Scroll" disabled={p.inv.scroll < 1} sub={`4 · ×${p.inv.scroll}`} />
                  <ActionBtn onClick={act.flee} icon={DoorOpen} label="Flee" sub="5" />
                </div>
              </div>
            </div>
          )}

          {/* End-of-run overlay */}
          {state.status !== 'playing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-center px-6">
              <p className={state.status === 'won' ? 'text-2xl font-bold text-yellow-300' : 'text-2xl font-bold text-red-400'}>
                {state.status === 'won' ? 'The Deep Hoard is yours!' : 'You fell in the dark.'}
              </p>
              <p className="text-sm text-zinc-400 mt-1 font-mono">depth {state.level} · {p.gold} gold · score {scoreOf(state)}</p>
              <button onClick={restart} className="mt-4 px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium">Delve again (Enter)</button>
              <button onClick={onClose} className="mt-2 text-xs text-zinc-500 hover:text-zinc-300">Leave</button>
            </div>
          )}
        </div>

        {/* Log + controls */}
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
          <div className="h-12 overflow-hidden text-[11px] font-mono text-zinc-400 leading-snug">
            {state.log.slice(-3).map((line, i) => (<div key={i} className={i === 2 ? 'text-zinc-200' : ''}>{line}</div>))}
          </div>
          <p className="mt-1 text-[10px] text-zinc-600 font-mono">
            {state.mode === 'combat'
              ? '1 melee · 2 spell · 3 potion · 4 scroll · 5 flee'
              : 'move: arrows / WASD / hjkl · bump foes to fight · > descends · Esc to leave'}
          </p>
        </div>
      </div>
    </div>
  );
}
