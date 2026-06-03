import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, RotateCcw, Swords, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getEntityColors } from '@/lib/entityColors';
import EntityQuickViewModal from '@/components/common/EntityQuickViewModal';

const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Poisoned', 'Prone',
  'Restrained', 'Stunned', 'Unconscious',
];

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function ConditionPicker({ onAdd, existing }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const available = CONDITIONS.filter(c => !existing.includes(c));
  if (available.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-[10px] px-1.5 py-0.5 rounded border border-dashed dark:border-zinc-700 border-zinc-300 dark:text-zinc-500 text-zinc-400 hover:dark:border-zinc-500 hover:border-zinc-400 transition-colors"
      >
        +cond
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 w-40 rounded-lg border dark:border-zinc-700 border-zinc-200 dark:bg-zinc-900 bg-white shadow-xl py-1 max-h-52 overflow-y-auto">
          {available.map(c => (
            <button
              key={c}
              onClick={() => { onAdd(c); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 hover:dark:bg-zinc-800 hover:bg-zinc-50 transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CombatantRow({ combatant, isActive, onUpdate, onRemove, campaignId, entities }) {
  const [editingInit, setEditingInit] = useState(false);
  const [initVal, setInitVal] = useState(String(combatant.initiative));
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);

  const entity = entities.find(e => e.id === combatant.entityId) || null;
  const colors = getEntityColors(combatant.entityType);

  const handleHp = (delta) => {
    if (!combatant.hp) return;
    onUpdate({ ...combatant, hp: { ...combatant.hp, current: clamp(combatant.hp.current + delta, 0, combatant.hp.max) } });
  };

  const handleHpInput = (val) => {
    if (!combatant.hp) return;
    const n = parseInt(val);
    if (!isNaN(n)) onUpdate({ ...combatant, hp: { ...combatant.hp, current: clamp(n, 0, combatant.hp.max) } });
  };

  const commitInit = () => {
    const n = parseInt(initVal);
    if (!isNaN(n)) onUpdate({ ...combatant, initiative: n });
    setEditingInit(false);
  };

  const removeCondition = (c) => {
    onUpdate({ ...combatant, conditions: combatant.conditions.filter(x => x !== c) });
  };

  const addCondition = (c) => {
    onUpdate({ ...combatant, conditions: [...combatant.conditions, c] });
  };

  const hpPct = combatant.hp ? (combatant.hp.current / combatant.hp.max) * 100 : 100;
  const hpColor = hpPct > 50 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className={cn(
      'group relative rounded-lg border transition-all',
      isActive
        ? 'border-amber-400/60 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5'
        : 'dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/30 bg-white'
    )}>
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-amber-500" />}

      <div className="flex items-center gap-2 px-2.5 py-2">
        {/* Initiative badge */}
        {editingInit ? (
          <input
            autoFocus
            value={initVal}
            onChange={e => setInitVal(e.target.value)}
            onBlur={commitInit}
            onKeyDown={e => { if (e.key === 'Enter') commitInit(); if (e.key === 'Escape') setEditingInit(false); }}
            className="w-9 text-center text-xs font-mono font-bold rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-200 text-zinc-800 border-none outline-none p-0.5"
          />
        ) : (
          <button
            onClick={() => { setInitVal(String(combatant.initiative)); setEditingInit(true); }}
            title="Click to edit initiative"
            className={cn(
              'w-9 h-7 rounded text-xs font-mono font-bold flex-shrink-0 transition-colors',
              isActive
                ? 'bg-amber-500 text-zinc-950'
                : 'dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600 hover:dark:bg-zinc-700 hover:bg-zinc-200'
            )}
          >
            {combatant.initiative}
          </button>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          {combatant.entityId ? (
            <button
              className={cn('text-xs font-semibold truncate block text-left w-full', isActive ? 'dark:text-amber-300 text-amber-700' : 'dark:text-zinc-200 text-zinc-800')}
              onClick={(e) => { setAnchorRect(e.currentTarget.getBoundingClientRect()); setQuickViewOpen(true); }}
            >
              {combatant.name}
            </button>
          ) : (
            <span className={cn('text-xs font-semibold truncate block', isActive ? 'dark:text-amber-300 text-amber-700' : 'dark:text-zinc-200 text-zinc-800')}>
              {combatant.name}
            </span>
          )}
          {combatant.entityType && (
            <span className={cn('text-[10px]', colors.text)}>{combatant.entityType.replace(/_/g, ' ')}</span>
          )}
        </div>

        {/* HP or PC label */}
        {combatant.isPC ? (
          <span className="text-[10px] dark:text-zinc-500 text-zinc-400 flex-shrink-0">PC</span>
        ) : combatant.hp ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => handleHp(-1)} disabled={combatant.hp.current <= 0}
              className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center dark:text-zinc-400 text-zinc-500 hover:dark:bg-red-500/20 hover:bg-red-50 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 transition-colors">
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input
              value={combatant.hp.current}
              onChange={e => handleHpInput(e.target.value)}
              className="w-8 text-center text-xs font-mono font-semibold dark:bg-zinc-800 bg-zinc-100 rounded border-none outline-none dark:text-zinc-200 text-zinc-800 py-0.5"
            />
            <span className="text-[10px] dark:text-zinc-600 text-zinc-400">/{combatant.hp.max}</span>
            <button onClick={() => handleHp(1)} disabled={combatant.hp.current >= combatant.hp.max}
              className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center dark:text-zinc-400 text-zinc-500 hover:dark:bg-emerald-500/20 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:text-emerald-400 disabled:opacity-30 transition-colors">
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : null}

        {/* Remove */}
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 dark:text-zinc-600 text-zinc-300 hover:dark:text-red-400 hover:text-red-400 transition-all flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* HP bar */}
      {combatant.hp && combatant.hp.max > 0 && (
        <div className="mx-2.5 mb-1.5 h-1 rounded-full dark:bg-zinc-800 bg-zinc-100 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', hpColor)} style={{ width: `${hpPct}%` }} />
        </div>
      )}

      {/* Conditions */}
      {(combatant.conditions.length > 0 || true) && (
        <div className="flex flex-wrap gap-1 px-2.5 pb-2">
          {combatant.conditions.map(c => (
            <span key={c} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
              {c}
              <button onClick={() => removeCondition(c)} className="hover:text-red-300 ml-0.5"><X className="w-2 h-2" /></button>
            </span>
          ))}
          <ConditionPicker onAdd={addCondition} existing={combatant.conditions} />
        </div>
      )}

      {quickViewOpen && entity && (
        <EntityQuickViewModal
          entity={entity}
          campaignId={campaignId}
          open={quickViewOpen}
          onOpenChange={setQuickViewOpen}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}

function AddCombatantForm({ entities, onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [initiative, setInitiative] = useState('');
  const [hp, setHp] = useState('');
  const [query, setQuery] = useState('');
  const [showEntitySearch, setShowEntitySearch] = useState(false);

  const filtered = query.trim().length > 0
    ? entities.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const selectEntity = (entity) => {
    setName(entity.name);
    setHp(entity.extra_data?.max_hit_points ? String(entity.extra_data.max_hit_points) : '');
    setQuery('');
    setShowEntitySearch(false);
  };

  const submit = () => {
    if (!name.trim()) return;
    const init = parseInt(initiative) || 0;
    const maxHp = parseInt(hp) || 0;
    const selectedEntity = entities.find(e => e.name === name);
    onAdd({
      id: uid(),
      name: name.trim(),
      entityId: selectedEntity?.id || null,
      entityType: selectedEntity?.entity_type || null,
      initiative: init,
      hp: maxHp > 0 ? { current: maxHp, max: maxHp } : null,
      isPC: selectedEntity?.entity_type === 'player_character',
      conditions: [],
    });
    setName(''); setInitiative(''); setHp(''); setQuery('');
  };

  return (
    <div className="p-2.5 space-y-2 rounded-lg border dark:border-zinc-700 border-zinc-200 dark:bg-zinc-900/50 bg-zinc-50">
      {/* Entity search */}
      <div className="relative">
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowEntitySearch(true); }}
          onFocus={() => setShowEntitySearch(true)}
          placeholder="Search entities…"
          className="h-7 text-xs dark:bg-zinc-800 dark:border-zinc-700"
        />
        {showEntitySearch && filtered.length > 0 && (
          <div className="absolute top-8 left-0 right-0 z-50 rounded-lg border dark:border-zinc-700 border-zinc-200 dark:bg-zinc-900 bg-white shadow-xl py-1 max-h-40 overflow-y-auto">
            {filtered.map(e => {
              const c = getEntityColors(e.entity_type);
              return (
                <button
                  key={e.id}
                  onMouseDown={() => selectEntity(e)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs dark:text-zinc-300 text-zinc-700 hover:dark:bg-zinc-800 hover:bg-zinc-50 transition-colors"
                >
                  <span className={cn('text-[10px] font-medium', c.text)}>{e.entity_type.replace(/_/g, ' ')}</span>
                  <span className="truncate">{e.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual fields */}
      <div className="flex gap-1.5">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          className="flex-1 h-7 text-xs dark:bg-zinc-800 dark:border-zinc-700"
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <Input
          value={initiative}
          onChange={e => setInitiative(e.target.value)}
          placeholder="Init"
          type="number"
          className="w-14 h-7 text-xs dark:bg-zinc-800 dark:border-zinc-700"
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <Input
          value={hp}
          onChange={e => setHp(e.target.value)}
          placeholder="HP"
          type="number"
          className="w-14 h-7 text-xs dark:bg-zinc-800 dark:border-zinc-700"
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" onClick={submit} disabled={!name.trim()}
          className="flex-1 h-7 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950">
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}
          className="h-7 text-xs dark:text-zinc-500 text-zinc-400">
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function CombatTracker({ entities, campaignId }) {
  // Persist combat per-campaign so an in-progress fight survives the GM Screen
  // being minimized/reopened (a full remount) instead of being wiped.
  const STORAGE_KEY = campaignId ? `gmos_combat_${campaignId}` : null;
  const initial = (() => {
    try { return STORAGE_KEY ? JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') : null; } catch { return null; }
  })();
  const [round, setRound] = useState(initial?.round ?? 1);
  const [currentIndex, setCurrentIndex] = useState(initial?.currentIndex ?? 0);
  const [combatants, setCombatants] = useState(initial?.combatants ?? []);
  const [adding, setAdding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!STORAGE_KEY) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ round, currentIndex, combatants })); } catch { /* ignore */ }
  }, [round, currentIndex, combatants, STORAGE_KEY]);

  // Sort combatants by initiative descending
  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const updateCombatant = (updated) => {
    setCombatants(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const removeCombatant = (id) => {
    setCombatants(prev => {
      const next = prev.filter(c => c.id !== id);
      // Adjust currentIndex if needed
      const sortedNext = [...next].sort((a, b) => b.initiative - a.initiative);
      if (currentIndex >= sortedNext.length && sortedNext.length > 0) {
        setCurrentIndex(sortedNext.length - 1);
      }
      return next;
    });
  };

  const addCombatant = (c) => {
    setCombatants(prev => [...prev, c]);
    setAdding(false);
  };

  const nextTurn = () => {
    if (sorted.length === 0) return;
    const next = currentIndex + 1;
    if (next >= sorted.length) {
      setCurrentIndex(0);
      setRound(r => r + 1);
    } else {
      setCurrentIndex(next);
    }
  };

  const prevTurn = () => {
    if (sorted.length === 0) return;
    const prev = currentIndex - 1;
    if (prev < 0) {
      setCurrentIndex(sorted.length - 1);
      setRound(r => Math.max(1, r - 1));
    } else {
      setCurrentIndex(prev);
    }
  };

  const reset = () => {
    setCombatants([]);
    setCurrentIndex(0);
    setRound(1);
    setConfirmReset(false);
    setAdding(false);
  };

  if (combatants.length === 0 && !adding) {
    return (
      <div className="p-3 flex flex-col items-center justify-center min-h-[160px] gap-3">
        <div className="w-10 h-10 rounded-full dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center">
          <Swords className="w-5 h-5 dark:text-zinc-600 text-zinc-400" />
        </div>
        <p className="text-xs dark:text-zinc-500 text-zinc-400 text-center">
          No combatants yet.<br />Start tracking initiative.
        </p>
        <Button size="sm" onClick={() => setAdding(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 h-7 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Combatant
        </Button>
      </div>
    );
  }

  const activeCombatantId = sorted[currentIndex]?.id;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Combatant list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
        {sorted.map((c) => (
          <CombatantRow
            key={c.id}
            combatant={c}
            isActive={c.id === activeCombatantId}
            onUpdate={updateCombatant}
            onRemove={() => removeCombatant(c.id)}
            campaignId={campaignId}
            entities={entities}
          />
        ))}

        {adding && (
          <AddCombatantForm
            entities={entities}
            onAdd={addCombatant}
            onCancel={() => setAdding(false)}
          />
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-1.5 rounded-lg border border-dashed dark:border-zinc-700 border-zinc-300 text-xs dark:text-zinc-600 text-zinc-400 hover:dark:text-amber-400 hover:text-amber-500 hover:dark:border-amber-500/40 hover:border-amber-400/40 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add combatant
          </button>
        )}
      </div>

      {/* Sticky turn controls footer */}
      {sorted.length > 0 && (
        <div className="flex-shrink-0 border-t dark:border-zinc-800 border-zinc-200 p-2.5">
          <div className="flex items-center gap-2">
            <button onClick={prevTurn}
              className="w-7 h-7 rounded dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center dark:text-zinc-400 text-zinc-500 hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 text-center">
              <span className="text-xs font-semibold dark:text-zinc-300 text-zinc-700">Round {round}</span>
              {sorted[currentIndex] && (
                <p className="text-[10px] dark:text-zinc-500 text-zinc-400 truncate">{sorted[currentIndex].name}</p>
              )}
            </div>

            <button onClick={nextTurn}
              className="w-7 h-7 rounded dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center dark:text-zinc-400 text-zinc-500 hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {confirmReset ? (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] dark:text-zinc-500 text-zinc-400 flex-1">Reset all?</span>
              <button onClick={reset} className="text-[10px] text-red-500 hover:text-red-400 font-medium px-1.5">Yes</button>
              <button onClick={() => setConfirmReset(false)} className="text-[10px] dark:text-zinc-500 text-zinc-400 px-1.5">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)}
              className="w-full mt-1.5 text-[10px] dark:text-zinc-600 text-zinc-400 hover:dark:text-red-400 hover:text-red-400 flex items-center justify-center gap-1 transition-colors">
              <RotateCcw className="w-2.5 h-2.5" /> Reset combat
            </button>
          )}
        </div>
      )}
    </div>
  );
}
