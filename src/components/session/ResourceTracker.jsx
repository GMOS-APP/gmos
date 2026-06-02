import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from '@/api/entities';
import { Plus, Minus, X, ChevronDown, ChevronRight, Heart, Zap, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Initialize resource state for a character from their entity data
function initCharacter(pc) {
  const maxHp = pc.extra_data?.max_hit_points || 10;
  return {
    name: pc.name,
    hp: { current: maxHp, max: maxHp },
    counters: [],
  };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function HpBar({ current, max }) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const color = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="h-1.5 rounded-full dark:bg-zinc-800 bg-zinc-200 overflow-hidden mt-1">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Counter({ counter, onChange, onRemove }) {
  const used = counter.used ?? 0;
  const max  = counter.max  ?? 1;
  const remaining = max - used;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs dark:text-zinc-400 text-zinc-600 flex-1 truncate">{counter.name}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange({ ...counter, used: clamp(used + 1, 0, max) })}
          disabled={used >= max}
          className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 flex items-center justify-center hover:dark:bg-zinc-700 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>
        <span className={cn('text-xs font-mono w-8 text-center font-semibold',
          remaining === 0 ? 'dark:text-red-400 text-red-500' : 'dark:text-zinc-200 text-zinc-800'
        )}>
          {remaining}/{max}
        </span>
        <button
          onClick={() => onChange({ ...counter, used: clamp(used - 1, 0, max) })}
          disabled={used <= 0}
          className="w-5 h-5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 flex items-center justify-center hover:dark:bg-zinc-700 hover:bg-zinc-200 disabled:opacity-30 transition-colors"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
        <button onClick={onRemove} className="w-5 h-5 flex items-center justify-center dark:text-zinc-700 text-zinc-300 hover:dark:text-red-400 hover:text-red-400 transition-colors ml-1">
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

function CharacterPanel({ char, entity, onChange }) {
  const [expanded, setExpanded] = useState(true);
  const [addingCounter, setAddingCounter] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState('');

  const handleHpChange = (delta) => {
    onChange({ ...char, hp: { ...char.hp, current: clamp(char.hp.current + delta, 0, char.hp.max) } });
  };

  const handleMaxHpChange = (val) => {
    const max = parseInt(val) || 1;
    onChange({ ...char, hp: { current: clamp(char.hp.current, 0, max), max } });
  };

  const updateCounter = (i, updated) => {
    const counters = [...(char.counters || [])];
    counters[i] = updated;
    onChange({ ...char, counters });
  };

  const removeCounter = (i) => {
    onChange({ ...char, counters: (char.counters || []).filter((_, idx) => idx !== i) });
  };

  const addCounter = () => {
    if (!newName.trim()) return;
    const max = parseInt(newMax) || 1;
    onChange({ ...char, counters: [...(char.counters || []), { name: newName.trim(), used: 0, max }] });
    setNewName(''); setNewMax(''); setAddingCounter(false);
  };

  const hpPct = char.hp.max > 0 ? char.hp.current / char.hp.max : 0;

  return (
    <div className="rounded-lg border dark:border-zinc-800 dark:bg-zinc-900/40 bg-white border-zinc-200 shadow-sm dark:shadow-none overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:dark:bg-zinc-800/40 hover:bg-zinc-50 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />}
        <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-800 flex-1 text-left truncate">{char.name}</span>
        <div className="flex items-center gap-1.5">
          <Heart className={cn('w-3.5 h-3.5', hpPct > 0.5 ? 'text-emerald-400' : hpPct > 0.25 ? 'text-amber-400' : 'text-red-400')} />
          <span className={cn('text-xs font-mono font-semibold', hpPct <= 0 ? 'dark:text-red-400 text-red-500' : 'dark:text-zinc-300 text-zinc-700')}>
            {char.hp.current}/{char.hp.max}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t dark:border-zinc-800 border-zinc-100 pt-3">
          {/* HP Controls */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
              <span className="text-xs dark:text-zinc-500 text-zinc-500 flex-1">Hit Points</span>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                <button onClick={() => handleHpChange(-1)} disabled={char.hp.current <= 0}
                  className="w-6 h-6 rounded dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center dark:text-zinc-400 text-zinc-500 hover:dark:bg-red-500/20 hover:bg-red-50 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <Input
                  value={char.hp.current}
                  onChange={e => onChange({ ...char, hp: { ...char.hp, current: clamp(parseInt(e.target.value) || 0, 0, char.hp.max) } })}
                  className="w-10 h-6 text-center text-xs p-0 dark:bg-zinc-800 dark:border-zinc-700 font-mono"
                />
                <span className="text-xs dark:text-zinc-600 text-zinc-400">/</span>
                <Input
                  value={char.hp.max}
                  onChange={e => handleMaxHpChange(e.target.value)}
                  className="w-10 h-6 text-center text-xs p-0 dark:bg-zinc-800 dark:border-zinc-700 font-mono dark:text-zinc-500 text-zinc-400"
                />
                <button onClick={() => handleHpChange(1)} disabled={char.hp.current >= char.hp.max}
                  className="w-6 h-6 rounded dark:bg-zinc-800 bg-zinc-100 flex items-center justify-center dark:text-zinc-400 text-zinc-500 hover:dark:bg-emerald-500/20 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:text-emerald-400 disabled:opacity-30 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            <HpBar current={char.hp.current} max={char.hp.max} />
          </div>

          {/* Passive Skills */}
          {(entity?.extra_data?.passive_perception || entity?.extra_data?.passive_investigation || entity?.extra_data?.passive_insight) && (
            <div className="pt-2 border-t dark:border-zinc-800 border-zinc-100">
              <div className="flex items-center gap-1 mb-1.5">
                <Eye className="w-3 h-3 dark:text-zinc-500 text-zinc-400" />
                <span className="text-xs dark:text-zinc-500 text-zinc-500">Passives</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {entity.extra_data.passive_perception && (
                  <span>
                    <span className="dark:text-zinc-600 text-zinc-400">Perception </span>
                    <span className="dark:text-zinc-200 text-zinc-900 font-bold">{entity.extra_data.passive_perception}</span>
                  </span>
                )}
                {entity.extra_data.passive_investigation && (
                  <span>
                    <span className="dark:text-zinc-600 text-zinc-400">Investigation </span>
                    <span className="dark:text-zinc-200 text-zinc-900 font-bold">{entity.extra_data.passive_investigation}</span>
                  </span>
                )}
                {entity.extra_data.passive_insight && (
                  <span>
                    <span className="dark:text-zinc-600 text-zinc-400">Insight </span>
                    <span className="dark:text-zinc-200 text-zinc-900 font-bold">{entity.extra_data.passive_insight}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Counters */}
          {(char.counters || []).length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 dark:text-zinc-500 text-zinc-400" />
                <span className="text-xs dark:text-zinc-500 text-zinc-500">Resources</span>
              </div>
              {(char.counters || []).map((counter, i) => (
                <Counter key={i} counter={counter} onChange={u => updateCounter(i, u)} onRemove={() => removeCounter(i)} />
              ))}
            </div>
          )}

          {/* Add counter */}
          {addingCounter ? (
            <div className="flex gap-1.5 items-center">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Name"
                className="flex-1 h-7 text-xs dark:bg-zinc-800 dark:border-zinc-700"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && addCounter()}
              />
              <Input
                value={newMax}
                onChange={e => setNewMax(e.target.value)}
                placeholder="Max"
                type="number"
                min={1}
                className="w-14 h-7 text-xs dark:bg-zinc-800 dark:border-zinc-700"
                onKeyDown={e => e.key === 'Enter' && addCounter()}
              />
              <button onClick={addCounter} className="text-xs text-amber-500 hover:text-amber-400 font-medium px-1">Add</button>
              <button onClick={() => { setAddingCounter(false); setNewName(''); setNewMax(''); }} className="text-xs dark:text-zinc-500 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-1">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCounter(true)}
              className="flex items-center gap-1 text-xs dark:text-zinc-600 text-zinc-400 hover:dark:text-amber-400 hover:text-amber-500 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add counter (slots, rages, ki…)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResourceTracker({ session, entities }) {
  const queryClient = useQueryClient();
  const playerCharacters = entities.filter(e => e.entity_type === 'player_character');

  // Build initial state from session.resources or PC defaults
  const buildInitial = useCallback(() => {
    const saved = session?.resources || {};
    return playerCharacters.reduce((acc, pc) => {
      acc[pc.id] = saved[pc.id] || initCharacter(pc);
      return acc;
    }, {});
  }, [session?.id, playerCharacters.length]);

  const [state, setState] = useState(buildInitial);
  const saveTimer = useRef(null);

  // Re-initialize when session changes
  useEffect(() => {
    setState(buildInitial());
  }, [session?.id]);

  const saveMutation = useMutation({
    mutationFn: (resources) => Session.update(session.id, { resources }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session'] }),
  });

  const handleChange = (charId, updated) => {
    const next = { ...state, [charId]: updated };
    setState(next);
    // Debounced save
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (session?.id) saveMutation.mutate(next);
    }, 800);
  };

  const handleShortRest = () => {
    setState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...next[id], hp: { ...next[id].hp, current: next[id].hp.max } };
      });
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (session?.id) saveMutation.mutate(next);
      }, 800);
      return next;
    });
  };

  const handleLongRest = () => {
    setState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = {
          ...next[id],
          hp: { ...next[id].hp, current: next[id].hp.max },
          counters: (next[id].counters || []).map(c => ({ ...c, used: 0 })),
        };
      });
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (session?.id) saveMutation.mutate(next);
      }, 800);
      return next;
    });
  };

  if (playerCharacters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs dark:text-zinc-600 text-zinc-400">No player characters in this campaign yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">Party Resources</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={handleShortRest}
            className="h-6 text-[10px] px-2 dark:border-zinc-700 dark:text-zinc-400">
            Short Rest
          </Button>
          <Button size="sm" variant="outline" onClick={handleLongRest}
            className="h-6 text-[10px] px-2 dark:border-zinc-700 dark:text-zinc-400">
            Long Rest
          </Button>
        </div>
      </div>

      {playerCharacters.map(pc => (
        <CharacterPanel
          key={pc.id}
          charId={pc.id}
          char={state[pc.id] || initCharacter(pc)}
          entity={pc}
          onChange={updated => handleChange(pc.id, updated)}
        />
      ))}
    </div>
  );
}
