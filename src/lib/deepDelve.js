// Deep Delve — a tiny original ASCII dungeon crawler engine (no React).
// State-mutating helpers return a NEW state object so React can re-render.
// Every level is freshly procedurally generated (Math.random), so no two runs —
// or even two floors — are alike. Original work; no content from existing games.

export const W = 40;
export const H = 18;
export const MAX_LEVEL = 5;
export const VIEW_RADIUS = 4.6;
export const SPELL_COST = 3;

const rnd = (n) => Math.floor(Math.random() * n);
const randint = (a, b) => a + rnd(b - a + 1);
const pick = (arr) => arr[rnd(arr.length)];

// Monster archetypes; which can appear deepens with the level.
const MONSTERS = [
  { glyph: 'r', name: 'cave rat', hp: 4, atk: 2, minLevel: 1, gold: [0, 2] },
  { glyph: 'k', name: 'kobold', hp: 7, atk: 3, minLevel: 1, gold: [1, 5] },
  { glyph: 'g', name: 'goblin', hp: 11, atk: 4, minLevel: 2, gold: [3, 8] },
  { glyph: 'O', name: 'ogre', hp: 18, atk: 6, minLevel: 3, gold: [6, 14] },
  { glyph: 'W', name: 'wraith', hp: 24, atk: 8, minLevel: 4, gold: [10, 20] },
];

const grid = (fill) => Array.from({ length: H }, () => Array.from({ length: W }, () => fill));

function carveRoom(map, r) {
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) map[y][x] = '.';
}
function carveH(map, x1, x2, y) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) if (map[y][x] === '#') map[y][x] = '.';
}
function carveV(map, y1, y2, x) {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) if (map[y][x] === '#') map[y][x] = '.';
}
const overlaps = (a, b) =>
  a.x - 1 < b.x + b.w && a.x + a.w + 1 > b.x && a.y - 1 < b.y + b.h && a.y + a.h + 1 > b.y;
const isFloor = (map, x, y) => x > 0 && y > 0 && x < W && y < H && map[y][x] !== '#';

// Build one dungeon level. Random room count, sizes, placement, and corridor
// orientation each call → unique layout every time.
export function makeLevel(level) {
  const map = grid('#');
  const rooms = [];
  const target = randint(6, 9);
  for (let i = 0; i < 100 && rooms.length < target; i++) {
    const w = randint(4, 9);
    const h = randint(3, 6);
    const x = randint(1, W - w - 2);
    const y = randint(1, H - h - 2);
    const room = { x, y, w, h };
    if (rooms.some((r) => overlaps(room, r))) continue;
    rooms.push(room);
  }
  rooms.forEach((r) => carveRoom(map, r));
  const centers = rooms.map((r) => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) }));
  for (let i = 1; i < centers.length; i++) {
    const a = centers[i - 1];
    const b = centers[i];
    if (rnd(2)) { carveH(map, a.x, b.x, a.y); carveV(map, a.y, b.y, b.x); }
    else { carveV(map, a.y, b.y, a.x); carveH(map, a.x, b.x, b.y); }
  }

  const player = centers[0];
  const exit = centers[centers.length - 1];
  map[exit.y][exit.x] = level >= MAX_LEVEL ? '*' : '>';

  const monsters = [];
  const items = [];
  const occupied = (x, y) =>
    (x === player.x && y === player.y) || (x === exit.x && y === exit.y) ||
    monsters.some((m) => m.x === x && m.y === y) || items.some((it) => it.x === x && it.y === y);
  const spotIn = (r) => {
    for (let t = 0; t < 20; t++) {
      const x = randint(r.x, r.x + r.w - 1);
      const y = randint(r.y, r.y + r.h - 1);
      if (isFloor(map, x, y) && !occupied(x, y)) return { x, y };
    }
    return null;
  };
  const pool = MONSTERS.filter((m) => m.minLevel <= level);
  const monsterCount = 3 + level;
  for (let i = 0; i < monsterCount; i++) {
    const r = rooms[randint(1, rooms.length - 1)] || rooms[0];
    const s = spotIn(r);
    if (!s) continue;
    const t = pick(pool);
    const hp = t.hp + randint(0, level);
    monsters.push({ id: `${level}-${i}`, x: s.x, y: s.y, hp, maxHp: hp, atk: t.atk, glyph: t.glyph, name: t.name, gold: t.gold });
  }
  const itemCount = 2 + rnd(3);
  for (let i = 0; i < itemCount; i++) {
    const r = rooms[randint(1, rooms.length - 1)] || rooms[0];
    const s = spotIn(r);
    if (!s) continue;
    const roll = rnd(10);
    if (roll < 2) items.push({ x: s.x, y: s.y, kind: 'potion' });
    else if (roll < 3) items.push({ x: s.x, y: s.y, kind: 'scroll' });
    else items.push({ x: s.x, y: s.y, kind: 'gold', amount: randint(2, 6 + level * 2) });
  }
  if (level === 2) { const s = spotIn(pick(rooms)); if (s) items.push({ x: s.x, y: s.y, kind: 'sign' }); }

  return { map, rooms, playerStart: player, exit, monsters, items };
}

export function newGame(prev) {
  const lvl = makeLevel(1);
  const state = {
    level: 1,
    mode: 'explore', // 'explore' | 'combat'
    combatId: null,
    steps: 0,
    map: lvl.map,
    rooms: lvl.rooms,
    monsters: lvl.monsters,
    items: lvl.items,
    seen: grid(false),
    player: { x: lvl.playerStart.x, y: lvl.playerStart.y, hp: 24, maxHp: 24, mp: 6, maxMp: 6, atk: 6, gold: 0, inv: { potion: 1, scroll: 0 } },
    log: ['You descend into the dark. (arrows / WASD to move, Esc to leave)'],
    status: 'playing',
    best: prev?.best || loadBest(),
  };
  return computeVisible(state);
}

function nextLevel(state) {
  const lvl = makeLevel(state.level + 1);
  const ns = {
    ...state,
    level: state.level + 1,
    mode: 'explore',
    combatId: null,
    map: lvl.map,
    rooms: lvl.rooms,
    monsters: lvl.monsters,
    items: lvl.items,
    seen: grid(false),
    player: { ...state.player, x: lvl.playerStart.x, y: lvl.playerStart.y, mp: state.player.maxMp },
    log: [...state.log, `You climb down to depth ${state.level + 1}. Your mana renews.`].slice(-40),
  };
  return computeVisible(ns);
}

function computeVisible(state) {
  const seen = state.seen.map((row) => row.slice());
  const { x: px, y: py } = state.player;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - px, y - py) <= VIEW_RADIUS) seen[y][x] = true;
  return { ...state, seen };
}

const log = (state, ...msgs) => [...state.log, ...msgs].slice(-40);

function monstersAct(state) {
  const p = state.player;
  const monsters = state.monsters.map((m) => ({ ...m }));
  let hp = p.hp;
  const msgs = [];
  for (const m of monsters) {
    const dist = Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y));
    if (dist <= 1) { const dmg = randint(1, m.atk); hp -= dmg; msgs.push(`The ${m.name} hits you for ${dmg}.`); continue; }
    if (dist > 7) continue;
    const step = (a, b) => (a < b ? 1 : a > b ? -1 : 0);
    const tries = [
      { x: m.x + step(m.x, p.x), y: m.y + step(m.y, p.y) },
      { x: m.x + step(m.x, p.x), y: m.y },
      { x: m.x, y: m.y + step(m.y, p.y) },
    ];
    for (const t of tries) {
      if (!isFloor(state.map, t.x, t.y)) continue;
      if (t.x === p.x && t.y === p.y) break;
      if (monsters.some((o) => o !== m && o.x === t.x && o.y === t.y)) continue;
      m.x = t.x; m.y = t.y; break;
    }
  }
  let next = { ...state, monsters, player: { ...p, hp }, log: msgs.length ? log(state, ...msgs) : state.log };
  if (hp <= 0) { next = { ...next, status: 'dead' }; next = { ...next, log: log(next, 'You fall. The dark keeps you.') }; next.best = saveBest(next); }
  return next;
}

// ---- Exploration ----------------------------------------------------------

// Move the player by (dx,dy). Bumping a monster opens combat instead of moving.
export function move(state, dx, dy) {
  if (state.status !== 'playing' || state.mode !== 'explore') return state;
  const p = state.player;
  const nx = p.x + dx;
  const ny = p.y + dy;
  if (!isFloor(state.map, nx, ny)) return state;

  const mon = state.monsters.find((m) => m.x === nx && m.y === ny);
  if (mon) {
    return { ...state, mode: 'combat', combatId: mon.id, log: log(state, `A ${mon.name} bars your way! Choose your action.`) };
  }

  let player = { ...p, x: nx, y: ny };
  let { items } = state;
  let logs = state.log;

  const ii = items.findIndex((it) => it.x === nx && it.y === ny);
  if (ii >= 0) {
    const it = items[ii];
    items = items.filter((_, i) => i !== ii);
    if (it.kind === 'gold') { player = { ...player, gold: player.gold + it.amount }; logs = log({ ...state, log: logs }, `You grab ${it.amount} gold.`); }
    else if (it.kind === 'potion') { player = { ...player, inv: { ...player.inv, potion: player.inv.potion + 1 } }; logs = log({ ...state, log: logs }, 'You pocket a healing potion.'); }
    else if (it.kind === 'scroll') { player = { ...player, inv: { ...player.inv, scroll: player.inv.scroll + 1 } }; logs = log({ ...state, log: logs }, 'You pocket a scroll of fire.'); }
    else if (it.kind === 'sign') { logs = log({ ...state, log: logs }, 'An engraving reads: "A wanderer was here, and left only this."'); }
  }

  // Mana trickles back as you explore.
  const steps = state.steps + 1;
  if (steps % 4 === 0 && player.mp < player.maxMp) player = { ...player, mp: player.mp + 1 };

  const tile = state.map[ny][nx];
  let s = { ...state, player, items, steps, log: logs };

  if (tile === '*') { s = { ...s, status: 'won', log: log(s, 'The Deep Hoard is yours! You win.') }; s.best = saveBest(s); return s; }
  if (tile === '>') return nextLevel(s);
  return computeVisible(monstersAct(s));
}

// ---- Combat ---------------------------------------------------------------

const curFoe = (state) => state.monsters.find((m) => m.id === state.combatId);

// Apply damage to the foe; resolve its retaliation or its death + combat end.
function playerHit(state, dmg, actionMsg) {
  const monsters = state.monsters.map((m) => ({ ...m }));
  const m = monsters.find((x) => x.id === state.combatId);
  if (!m) return { ...state, mode: 'explore', combatId: null };
  m.hp -= dmg;
  if (m.hp <= 0) {
    const loot = m.gold ? randint(m.gold[0], m.gold[1]) : 0;
    const remaining = monsters.filter((x) => x.id !== m.id);
    return {
      ...state, monsters: remaining, mode: 'explore', combatId: null,
      player: { ...state.player, gold: state.player.gold + loot },
      log: log(state, actionMsg, `The ${m.name} falls${loot ? ` (+${loot}g)` : ''}.`),
    };
  }
  return foeRetaliate({ ...state, monsters }, [actionMsg]);
}

// The foe strikes back (used after an attack or a non-offensive item).
function foeRetaliate(state, msgs) {
  const m = curFoe(state);
  if (!m) return { ...state, mode: 'explore', combatId: null, log: log(state, ...msgs) };
  const dmg = randint(1, m.atk);
  const hp = state.player.hp - dmg;
  let ns = { ...state, player: { ...state.player, hp }, log: log(state, ...msgs, `The ${m.name} strikes back for ${dmg}.`) };
  if (hp <= 0) { ns = { ...ns, status: 'dead', mode: 'explore', combatId: null, log: log(ns, 'You fall. The dark keeps you.') }; ns.best = saveBest(ns); }
  return ns;
}

export function combatMelee(state) {
  if (state.mode !== 'combat') return state;
  const dmg = randint(2, state.player.atk);
  return playerHit(state, dmg, `You strike with your blade for ${dmg}.`);
}

export function combatSpell(state) {
  if (state.mode !== 'combat') return state;
  if (state.player.mp < SPELL_COST) return { ...state, log: log(state, `Not enough mana (need ${SPELL_COST}).`) };
  const dmg = randint(state.player.atk, state.player.atk * 2) + 2;
  const s = { ...state, player: { ...state.player, mp: state.player.mp - SPELL_COST } };
  return playerHit(s, dmg, `You hurl an arcane bolt for ${dmg}!`);
}

export function combatItem(state, kind) {
  if (state.mode !== 'combat') return state;
  const inv = { ...state.player.inv };
  if (!inv[kind]) return { ...state, log: log(state, `You have no ${kind === 'potion' ? 'potions' : 'scrolls'}.`) };
  inv[kind] -= 1;
  if (kind === 'potion') {
    const heal = randint(8, 14);
    const player = { ...state.player, inv, hp: Math.min(state.player.maxHp, state.player.hp + heal) };
    return foeRetaliate({ ...state, player }, [`You quaff a potion (+${heal} HP).`]);
  }
  // scroll of fire — offensive
  const dmg = randint(8, 16);
  return playerHit({ ...state, player: { ...state.player, inv } }, dmg, `You read a scroll of fire for ${dmg}!`);
}

export function combatFlee(state) {
  if (state.mode !== 'combat') return state;
  if (Math.random() < 0.6) return { ...state, mode: 'explore', combatId: null, log: log(state, 'You slip back into the shadows.') };
  return foeRetaliate(state, ['You fail to escape!']);
}

// ---- Scoring / persistence ------------------------------------------------

export const scoreOf = (state) => state.player.gold + (state.level - 1) * 100 + (state.status === 'won' ? 500 : 0);

const BEST_KEY = 'gmos_delve_best';
export function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || { score: 0, depth: 0, gold: 0, won: false }; }
  catch { return { score: 0, depth: 0, gold: 0, won: false }; }
}
function saveBest(state) {
  const cur = loadBest();
  const score = scoreOf(state);
  if (score <= cur.score) return cur;
  const best = { score, depth: state.level, gold: state.player.gold, won: state.status === 'won' };
  try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch { /* ignore */ }
  return best;
}
