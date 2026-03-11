import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ChevronUp, ChevronDown, SkipForward, RotateCcw, Swords, Shield, User, Minus, Dice5, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const TYPE_COLORS = {
  player_character: 'border-blue-500/50 bg-blue-500/5',
  npc: 'border-amber-500/50 bg-amber-500/5',
  creature: 'border-red-500/50 bg-red-500/5',
};
const TYPE_BADGE = {
  player_character: 'border-blue-500/40 text-blue-400',
  npc: 'border-amber-500/40 text-amber-400',
  creature: 'border-red-500/40 text-red-400',
};
const TYPE_ICON = {
  player_character: <User className="w-3.5 h-3.5" />,
  npc: <Shield className="w-3.5 h-3.5" />,
  creature: <Swords className="w-3.5 h-3.5" />,
};
const TYPE_LABEL = {
  player_character: 'PC',
  npc: 'NPC',
  creature: 'Creature',
};

// Parse DEX modifier from extra_data ability_scores string like "14 / 12 / 10 / 8 / 13 / 9" (STR/DEX/CON/INT/WIS/CHA)
function getDexMod(entity) {
  const scores = entity?.extra_data?.ability_scores;
  if (scores) {
    const parts = String(scores).split(/[\/,\s]+/).map(Number).filter((n) => !isNaN(n));
    if (parts.length >= 2) {
      const dex = parts[1];
      return Math.floor((dex - 10) / 2);
    }
  }
  // Fallback: try parsing from description text
  const desc = entity?.description || '';
  const match = desc.match(/DEX\s+(\d+)/i) || desc.match(/Dexterity[:\s]+(\d+)/i);
  if (match) {
    return Math.floor((parseInt(match[1]) - 10) / 2);
  }
  return 0;
}

function getMaxHp(entity) {
  const hp = entity?.extra_data?.hp;
  if (hp) {
    const match = String(hp).match(/^(\d+)/);
    if (match) return parseInt(match[1]);
  }
  return 10;
}

function getAc(entity) {
  const ac = entity?.extra_data?.ac;
  if (ac) {
    const match = String(ac).match(/^(\d+)/);
    if (match) return parseInt(match[1]);
  }
  return 10;
}

function rollD20(mod) {
  return Math.floor(Math.random() * 20) + 1 + mod;
}

// ── HP Control ──────────────────────────────────────────────────────────
function HpControl({ current, max, onChange }) {
  const [delta, setDelta] = useState('');
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const barColor = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500';

  const apply = (sign) => {
    const val = parseInt(delta, 10);
    if (!isNaN(val) && val > 0) {
      onChange(Math.max(0, Math.min(max, current + sign * val)));
      setDelta('');
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <button onClick={() => apply(-1)} className="w-6 h-6 rounded flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Deal damage">
          <Minus className="w-3 h-3" />
        </button>
        <Input
          value={delta}
          onChange={(e) => setDelta(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => { if (e.key === 'Enter') apply(-1); }}
          placeholder="0"
          className="w-12 h-6 text-center text-xs bg-zinc-900 border-zinc-700 text-zinc-200 px-1"
        />
        <button onClick={() => apply(1)} className="w-6 h-6 rounded flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors" title="Heal">
          <Plus className="w-3 h-3" />
        </button>
        <span className="text-xs text-zinc-300 tabular-nums ml-1">
          <span className="font-bold">{current}</span>
          <span className="text-zinc-600">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden w-full">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Condition Picker ──────────────────────────────────────────────────────────
const CONDITIONS = ['Blinded', 'Charmed', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

function ConditionPicker({ conditions, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-[10px] text-zinc-600 hover:text-zinc-400 border border-zinc-800 hover:border-zinc-700 rounded px-1.5 py-0.5 transition-colors">
        + condition
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-2 grid grid-cols-2 gap-1 w-52 shadow-xl">
          {CONDITIONS.map((c) => {
            const active = conditions.includes(c);
            return (
              <button key={c} onClick={() => onChange(active ? conditions.filter((x) => x !== c) : [...conditions, c])}
                className={`text-[10px] px-2 py-1 rounded text-left transition-colors ${active ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                {c}
              </button>
            );
          })}
          <button onClick={() => setOpen(false)} className="col-span-2 text-[10px] text-zinc-600 hover:text-zinc-400 mt-1 pt-1 border-t border-zinc-800">Close</button>
        </div>
      )}
    </div>
  );
}

// ── Entity Picker Panel ──────────────────────────────────────────────────────────
function EntityPicker({ campaignEntities, alreadyAdded, onPick, onManual, onClose }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('player_character');

  const filtered = campaignEntities.filter(
    (e) => e.entity_type === tab && e.name.toLowerCase().includes(search.toLowerCase()) && !alreadyAdded.has(e.id)
  );

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-3 space-y-2">
      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1">
        {['player_character', 'npc', 'creature'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`text-xs py-1 rounded border transition-colors ${tab === t ? `${TYPE_COLORS[t]} ${TYPE_BADGE[t]}` : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}>
            {TYPE_LABEL[t]}s
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entities..." className="pl-6 h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" />
      </div>

      {/* Entity list */}
      <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-3">No {TYPE_LABEL[tab]}s found in this campaign.</p>
        ) : (
          filtered.map((entity) => {
            const dexMod = getDexMod(entity);
            const hp = getMaxHp(entity);
            const ac = getAc(entity);
            return (
              <button key={entity.id} onClick={() => onPick(entity)}
                className="w-full flex items-center justify-between p-2 rounded text-left hover:bg-zinc-800/60 group transition-colors">
                <div>
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-amber-300">{entity.name}</span>
                  {entity.summary && <p className="text-[10px] text-zinc-600 truncate max-w-[200px]">{entity.summary}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-zinc-600">HP {hp}</span>
                  <span className="text-[10px] text-zinc-600">AC {ac}</span>
                  <span className="text-[10px] text-zinc-500">DEX {dexMod >= 0 ? '+' : ''}{dexMod}</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100">Add</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
        <button onClick={onManual} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">+ Add manually</button>
        <span className="text-zinc-800 text-[10px]">·</span>
        <button onClick={onClose} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ── Manual Add Form ──────────────────────────────────────────────────────────
function ManualForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('creature');
  const [initiative, setInitiative] = useState('');
  const [maxHp, setMaxHp] = useState('');
  const [ac, setAc] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      initiative: parseInt(initiative, 10) || 0,
      maxHp: parseInt(maxHp, 10) || 10,
      currentHp: parseInt(maxHp, 10) || 10,
      ac: parseInt(ac, 10) || 10,
      conditions: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 rounded-lg border border-zinc-700 bg-zinc-900/60 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400 font-semibold">Manual Entry</span>
        <button type="button" onClick={onCancel} className="text-zinc-600 hover:text-zinc-400"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {['player_character', 'npc', 'creature'].map((key) => (
          <button key={key} type="button" onClick={() => setType(key)}
            className={`text-xs py-1 rounded border transition-colors ${type === key ? `${TYPE_COLORS[key]} ${TYPE_BADGE[key]}` : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}>
            {TYPE_LABEL[key]}
          </button>
        ))}
      </div>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-8 text-sm bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600" autoFocus />
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-0.5">Initiative</label>
          <Input value={initiative} onChange={(e) => setInitiative(e.target.value)} placeholder="15" className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-0.5">Max HP</label>
          <Input value={maxHp} onChange={(e) => setMaxHp(e.target.value)} placeholder="30" className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200" />
        </div>
        <div>
          <label className="text-[10px] text-zinc-600 uppercase tracking-wider block mb-0.5">AC</label>
          <Input value={ac} onChange={(e) => setAc(e.target.value)} placeholder="13" className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 h-7 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold" disabled={!name.trim()}>Add</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-zinc-500" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function InitiativeTracker({ campaignId }) {
  const [combatants, setCombatants] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [addMode, setAddMode] = useState(null); // null | 'picker' | 'manual'
  const [combatStarted, setCombatStarted] = useState(false);
  const [lastRolls, setLastRolls] = useState({}); // id -> {roll, mod}

  const { data: campaignEntities = [] } = useQuery({
    queryKey: ['entities-initiative', campaignId],
    queryFn: () => base44.entities.WorldEntity.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
    staleTime: 60000,
    select: (data) => data.filter((e) => ['player_character', 'npc', 'creature'].includes(e.entity_type)),
  });

  const alreadyAdded = new Set(combatants.map((c) => c.entityId).filter(Boolean));
  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const addFromEntity = (entity) => {
    const dexMod = getDexMod(entity);
    const roll = rollD20(dexMod);
    const maxHp = getMaxHp(entity);
    const ac = getAc(entity);
    const id = crypto.randomUUID();
    setCombatants((prev) => [...prev, {
      id, entityId: entity.id,
      name: entity.name,
      type: entity.entity_type,
      initiative: roll,
      maxHp, currentHp: maxHp, ac,
      conditions: [],
    }]);
    setLastRolls((prev) => ({ ...prev, [id]: { roll: roll - dexMod, mod: dexMod } }));
    setAddMode(null);
  };

  const addManual = (c) => {
    setCombatants((prev) => [...prev, c]);
    setAddMode(null);
  };

  const removeCombatant = (id) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
    setCurrentTurn((t) => Math.max(0, t > 0 ? t - 1 : 0));
  };

  const updateCombatant = useCallback((id, patch) => {
    setCombatants((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const rerollInitiative = (combatant) => {
    const entity = campaignEntities.find((e) => e.id === combatant.entityId);
    const dexMod = entity ? getDexMod(entity) : 0;
    const roll = rollD20(dexMod);
    updateCombatant(combatant.id, { initiative: roll });
    setLastRolls((prev) => ({ ...prev, [combatant.id]: { roll: roll - dexMod, mod: dexMod } }));
  };

  const startCombat = () => { setCombatStarted(true); setCurrentTurn(0); setRound(1); };

  const nextTurn = () => {
    setCurrentTurn((t) => {
      const next = t + 1;
      if (next >= sorted.length) { setRound((r) => r + 1); return 0; }
      return next;
    });
  };

  const resetCombat = () => {
    setCombatStarted(false); setCurrentTurn(0); setRound(1);
    setCombatants((prev) => prev.map((c) => ({ ...c, currentHp: c.maxHp, conditions: [] })));
  };

  const clearAll = () => { setCombatants([]); setCombatStarted(false); setCurrentTurn(0); setRound(1); setLastRolls({}); };

  const activeCombatant = combatStarted ? sorted[currentTurn] : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {combatStarted && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Round</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">{round}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!combatStarted && combatants.length > 0 && (
            <Button size="sm" onClick={startCombat} className="h-7 text-xs bg-red-600 hover:bg-red-500 text-white">
              <Swords className="w-3.5 h-3.5 mr-1" /> Start Combat
            </Button>
          )}
          {combatStarted && (
            <>
              <Button size="sm" onClick={nextTurn} className="h-7 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
                <SkipForward className="w-3.5 h-3.5 mr-1" /> Next Turn
              </Button>
              <Button size="sm" variant="ghost" onClick={resetCombat} className="h-7 text-xs text-zinc-500 hover:text-zinc-300">
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </>
          )}
          {combatants.length > 0 && !combatStarted && (
            <button onClick={clearAll} className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">Clear all</button>
          )}
        </div>
      </div>

      {/* Combatant List */}
      {sorted.length === 0 ? (
        <div className="text-center py-6 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-lg">
          No combatants yet. Add entities from your campaign below.
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((c, idx) => {
            const isActive = combatStarted && idx === currentTurn;
            const isDead = c.currentHp === 0;
            const rollInfo = lastRolls[c.id];
            return (
              <div key={c.id} className={`rounded-lg border p-3 transition-all ${
                isActive ? `${TYPE_COLORS[c.type]} ring-1 ring-amber-400/40 shadow-lg shadow-amber-500/5`
                  : isDead ? 'border-zinc-800 bg-zinc-900/20 opacity-50'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}>
                <div className="flex items-start gap-3">
                  {/* Initiative */}
                  <div className="flex flex-col items-center min-w-[36px]">
                    <span className={`text-lg font-bold tabular-nums leading-none ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}>
                      {c.initiative}
                    </span>
                    {rollInfo && (
                      <span className="text-[9px] text-zinc-700 leading-none mt-0.5" title={`Rolled ${rollInfo.roll} + ${rollInfo.mod} DEX`}>
                        d20{rollInfo.mod >= 0 ? '+' : ''}{rollInfo.mod}
                      </span>
                    )}
                    {!combatStarted && (
                      <div className="flex flex-col mt-0.5">
                        <button onClick={() => updateCombatant(c.id, { initiative: c.initiative + 1 })} className="text-zinc-700 hover:text-zinc-400"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => updateCombatant(c.id, { initiative: Math.max(0, c.initiative - 1) })} className="text-zinc-700 hover:text-zinc-400"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />}
                      <span className={`font-semibold text-sm truncate ${isDead ? 'line-through text-zinc-600' : 'text-zinc-100'}`}>{c.name}</span>
                      <Badge variant="outline" className={`text-[10px] flex items-center gap-1 flex-shrink-0 ${TYPE_BADGE[c.type]}`}>
                        {TYPE_ICON[c.type]} {TYPE_LABEL[c.type]}
                      </Badge>
                      <span className="text-[10px] text-zinc-600 flex-shrink-0">AC {c.ac}</span>
                      {c.entityId && !combatStarted && (
                        <button onClick={() => rerollInitiative(c)} className="text-[10px] text-zinc-700 hover:text-amber-400 transition-colors flex items-center gap-0.5" title="Reroll initiative">
                          <Dice5 className="w-2.5 h-2.5" /> reroll
                        </button>
                      )}
                    </div>
                    <HpControl current={c.currentHp} max={c.maxHp} onChange={(val) => updateCombatant(c.id, { currentHp: val })} />
                    {c.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.conditions.map((cond) => (
                          <button key={cond} onClick={() => updateCombatant(c.id, { conditions: c.conditions.filter((x) => x !== cond) })}
                            className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 rounded px-1.5 py-0.5 hover:bg-red-500/20 transition-colors" title="Click to remove">
                            {cond} ×
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-1.5">
                      <ConditionPicker conditions={c.conditions} onChange={(conds) => updateCombatant(c.id, { conditions: conds })} />
                    </div>
                  </div>

                  {/* Remove */}
                  <button onClick={() => removeCombatant(c.id)} className="text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add panel */}
      {addMode === 'picker' && (
        <EntityPicker
          campaignEntities={campaignEntities}
          alreadyAdded={alreadyAdded}
          onPick={addFromEntity}
          onManual={() => setAddMode('manual')}
          onClose={() => setAddMode(null)}
        />
      )}
      {addMode === 'manual' && (
        <ManualForm onAdd={addManual} onCancel={() => setAddMode(null)} />
      )}
      {addMode === null && (
        <button onClick={() => setAddMode(campaignId ? 'picker' : 'manual')}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-colors text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Combatant
        </button>
      )}

      {/* Active turn callout */}
      {activeCombatant && (
        <div className={`rounded-lg border p-2.5 ${TYPE_COLORS[activeCombatant.type]} text-center`}>
          <span className="text-xs text-zinc-500">Current turn: </span>
          <span className={`font-bold text-sm ${activeCombatant.type === 'player_character' ? 'text-blue-300' : activeCombatant.type === 'npc' ? 'text-amber-300' : 'text-red-300'}`}>
            {activeCombatant.name}
          </span>
          {activeCombatant.currentHp === 0 && <span className="ml-2 text-xs text-red-500">(Down!)</span>}
        </div>
      )}
    </div>
  );
}