// Deep Delve — a tiny original ASCII dungeon crawler engine (no React).
// All functions are pure-ish: state-mutating helpers return a NEW state object
// so React can re-render. Original work; no maps/text from any existing game.

export const W = 40;
export const H = 18;
export const MAX_LEVEL = 5;
export const VIEW_RADIUS = 4.6;

const rnd = (n) => Math.floor(Math.random() * n);
const randint = (a, b) => a + rnd(b - a + 1);
const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;
const pick = (arr) => arr[rnd(arr.length)];

// Monster archetypes; which can appear deepens with the level.
const MONSTERS = [
  { glyph: 'r', name: 'cave rat', hp: 3, atk: 2, minLevel: 1, gold: [0, 2] },
  { glyph: 'k', name: 'kobold', hp: 6, atk: 3, minLevel: 1, gold: [1, 5] },
  { glyph: 'g', name: 'goblin', hp: 9, atk: 4, minLevel: 2, gold: [3, 8] },
  { glyph: 'O', name: 'ogre', hp: 16, atk: 6, minLevel: 3, gold: [6, 14] },
  { glyph: 'W', name: 'wraith', hp: 22, atk: 8, minLevel: 4, gold: [10, 20] },
];

const grid = (fill) => Array.from({ length: H }, () => Array.from({ length: W }, () => fill));

function carveRoom(map, r) {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) map[y][x] = '.';
  }
}
function carveH(map, x1, x2, y) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) map[y][x] = map[y][x] === '#' ? '.' : map[y][x];
}
function carveV(map, y1, y2, x) {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) map[y][x] = map[y][x] === '#' ? '.' : map[y][x];
}
const overlaps = (a, b) =>
  a.x - 1 < b.x + b.w && a.x + a.w + 1 > b.x && a.y - 1 < b.y + b.h && a.y + a.h + 1 > b.y;

function isFloor(map, x, y) {
  return x > 0 && y > 0 && x < W && y < H && map[y][x] !== '#';
}

// Build one dungeon level. The deepest level holds the treasure '*'; shallower
// levels hold stairs down '>'.
export function makeLevel(level) {
  const map = grid('#');
  const rooms = [];
  const tries = 80;
  for (let i = 0; i < tries && rooms.length < 8; i++) {
    const w = randint(4, 8);
    const h = randint(3, 5);
    const x = randint(1, W - w - 2);
    const y = randint(1, H - h - 2);
    const room = { x, y, w, h };
    if (rooms.some((r) => overlaps(room, r))) continue;
    rooms.push(room);
  }
  rooms.forEach((r) => carveRoom(map, r));
  // Connect room centers in sequence with L-corridors.
  const centers = rooms.map((r) => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) }));
  for (let i = 1; i < centers.length; i++) {
    const a = centers[i - 1];
    const b = centers[i];
    if (rnd(2)) { carveH(map, a.x, b.x, a.y); carveV(map, a.y, b.y, b.x); }
    else { carveV(map, a.y, b.y, a.x); carveH(map, a.x, b.x, b.y); }
  }

  const player = centers[0];
  const exit = centers[centers.length - 1];
  if (level >= MAX_LEVEL) map[exit.y][exit.x] = '*';
  else map[exit.y][exit.x] = '>';

  // Spawn monsters + items in rooms other than the start room.
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
    monsters.push({ x: s.x, y: s.y, hp, maxHp: hp, atk: t.atk, glyph: t.glyph, name: t.name, gold: t.gold });
  }
  const itemCount = 2 + rnd(3);
  for (let i = 0; i < itemCount; i++) {
    const r = rooms[randint(1, rooms.length - 1)] || rooms[0];
    const s = spotIn(r);
    if (!s) continue;
    if (rnd(3) === 0) items.push({ x: s.x, y: s.y, kind: 'potion' });
    else items.push({ x: s.x, y: s.y, kind: 'gold', amount: randint(2, 6 + level * 2) });
  }

  // A small wink at easter-egg lore — an original engraving on one early level.
  if (level === 2) {
    const r = pick(rooms);
    const s = spotIn(r);
    if (s) items.push({ x: s.x, y: s.y, kind: 'sign' });
  }

  return { map, rooms, playerStart: player, exit, monsters, items };
}

export function newGame(prev) {
  const lvl = makeLevel(1);
  const state = {
    level: 1,
    map: lvl.map,
    rooms: lvl.rooms,
    monsters: lvl.monsters,
    items: lvl.items,
    seen: grid(false),
    player: { x: lvl.playerStart.x, y: lvl.playerStart.y, hp: 24, maxHp: 24, atk: 6, gold: 0 },
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
    map: lvl.map,
    rooms: lvl.rooms,
    monsters: lvl.monsters,
    items: lvl.items,
    seen: grid(false),
    player: { ...state.player, x: lvl.playerStart.x, y: lvl.playerStart.y },
    log: [...state.log, `You climb down to depth ${state.level + 1}.`].slice(-40),
  };
  return computeVisible(ns);
}

function computeVisible(state) {
  const seen = state.seen.map((row) => row.slice());
  const { x: px, y: py } = state.player;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - px, y - py);
      if (d <= VIEW_RADIUS) seen[y][x] = true;
    }
  }
  return { ...state, seen, _px: px, _py: py };
}

const log = (state, msg) => [...state.log, msg].slice(-40);

function monstersAct(state) {
  const p = state.player;
  const monsters = state.monsters.map((m) => ({ ...m }));
  let hp = p.hp;
  const msgs = [];
  for (const m of monsters) {
    const dist = Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y));
    if (dist <= 1) {
      const dmg = randint(1, m.atk);
      hp -= dmg;
      msgs.push(`The ${m.name} hits you for ${dmg}.`);
      continue;
    }
    if (dist > 7) continue; // dormant when far
    // Greedy step toward the player, avoiding walls and each other.
    const step = (a, b) => (a < b ? 1 : a > b ? -1 : 0);
    const tryMoves = [
      { x: m.x + step(m.x, p.x), y: m.y + step(m.y, p.y) },
      { x: m.x + step(m.x, p.x), y: m.y },
      { x: m.x, y: m.y + step(m.y, p.y) },
    ];
    for (const t of tryMoves) {
      if (!isFloor(state.map, t.x, t.y)) continue;
      if (t.x === p.x && t.y === p.y) break;
      if (monsters.some((o) => o !== m && o.x === t.x && o.y === t.y)) continue;
      m.x = t.x; m.y = t.y; break;
    }
  }
  let next = { ...state, monsters, player: { ...p, hp }, log: msgs.length ? [...state.log, ...msgs].slice(-40) : state.log };
  if (hp <= 0) {
    next = { ...next, status: 'dead', log: log(next, 'You fall. The dark keeps you.') };
    next.best = saveBest(next);
  }
  return next;
}

// Move the player by (dx,dy). Returns a new state.
export function move(state, dx, dy) {
  if (state.status !== 'playing') return state;
  const p = state.player;
  const nx = p.x + dx;
  const ny = p.y + dy;
  if (!isFloor(state.map, nx, ny)) return state; // wall — free action, no monster turn

  // Bump-attack a monster.
  const mi = state.monsters.findIndex((m) => m.x === nx && m.y === ny);
  if (mi >= 0) {
    const monsters = state.monsters.map((m) => ({ ...m }));
    const m = monsters[mi];
    const dmg = randint(2, p.atk);
    m.hp -= dmg;
    let s = { ...state, monsters, log: log(state, `You strike the ${m.name} for ${dmg}.`) };
    if (m.hp <= 0) {
      const loot = m.gold ? randint(m.gold[0], m.gold[1]) : 0;
      monsters.splice(mi, 1);
      s = { ...s, monsters, player: { ...p, gold: p.gold + loot }, log: log(s, `The ${m.name} dies${loot ? ` (+${loot}g)` : ''}.`) };
    }
    return computeVisible(monstersAct(s));
  }

  // Move onto the tile.
  let player = { ...p, x: nx, y: ny };
  let { items, map } = state;
  let logs = state.log;

  // Pick up items.
  const ii = items.findIndex((it) => it.x === nx && it.y === ny);
  if (ii >= 0) {
    const it = items[ii];
    items = items.filter((_, i) => i !== ii);
    if (it.kind === 'gold') { player = { ...player, gold: player.gold + it.amount }; logs = [...logs, `You grab ${it.amount} gold.`].slice(-40); }
    else if (it.kind === 'potion') { const heal = randint(6, 12); player = { ...player, hp: Math.min(player.maxHp, player.hp + heal) }; logs = [...logs, `You quaff a potion (+${heal} HP).`].slice(-40); }
    else if (it.kind === 'sign') { logs = [...logs, 'An engraving reads: "A wanderer was here, and left only this."'].slice(-40); }
  }

  const tile = map[ny][nx];
  let s = { ...state, player, items, log: logs };

  if (tile === '*') {
    s = { ...s, status: 'won', log: log(s, 'The Deep Hoard is yours! You win.') };
    s.best = saveBest(s);
    return s;
  }
  if (tile === '>') {
    return nextLevel(s);
  }
  return computeVisible(monstersAct(s));
}

// score = how far + how rich.
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
