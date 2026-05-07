import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowLeft, ExternalLink } from 'lucide-react';

function formatSpeed(speed) {
  if (!speed || typeof speed !== 'object') return '';
  return Object.entries(speed)
    .map(([k, v]) => (k === 'walk' ? `${v} ft.` : `${k} ${v} ft.`))
    .join(', ');
}

function formatAbilityScores(m) {
  return `${m.strength} / ${m.dexterity} / ${m.constitution} / ${m.intelligence} / ${m.wisdom} / ${m.charisma}`;
}

function formatActions(actions) {
  if (!actions?.length) return '';
  return actions.map(a => `**${a.name}**\n${a.desc}`).join('\n\n');
}

function mapMonsterToEntity(m) {
  const summary = [m.size, m.type, m.subtype ? `(${m.subtype})` : '', m.alignment]
    .filter(Boolean).join(' ');

  const tags = [
    m.type?.toLowerCase(),
    m.size?.toLowerCase(),
    m.challenge_rating ? `CR ${m.challenge_rating}` : null,
  ].filter(Boolean);

  const traits = [
    ...(m.special_abilities || []).map(a => `**${a.name}**\n${a.desc}`),
  ].join('\n\n');

  const actions = [
    formatActions(m.actions),
    m.bonus_actions?.length ? `**Bonus Actions**\n${formatActions(m.bonus_actions)}` : '',
    m.reactions?.length ? `**Reactions**\n${formatActions(m.reactions)}` : '',
  ].filter(Boolean).join('\n\n');

  const legendaryText = [
    m.legendary_desc || '',
    ...(m.legendary_actions || []).map(a => `**${a.name}**\n${a.desc}`),
  ].filter(Boolean).join('\n\n');

  const ac = [m.armor_class, m.armor_desc ? `(${m.armor_desc})` : ''].filter(Boolean).join(' ');
  const hp = [m.hit_points, m.hit_dice ? `(${m.hit_dice})` : ''].filter(Boolean).join(' ');

  return {
    name: m.name,
    entity_type: 'creature',
    summary,
    description: m.desc || '',
    tags,
    image_url: m.img_main || '',
    extra_data: {
      creature_type: [m.type, m.subtype].filter(Boolean).join(', '),
      cr: m.challenge_rating,
      size: m.size,
      alignment: m.alignment,
      ac,
      hp,
      speed: formatSpeed(m.speed),
      ability_scores: formatAbilityScores(m),
      senses: m.senses || '',
      languages: m.languages || '',
      damage_resistances: m.damage_resistances || '',
      damage_immunities: m.damage_immunities || '',
      damage_vulnerabilities: m.damage_vulnerabilities || '',
      condition_immunities: m.condition_immunities || '',
      traits,
      actions,
      tactics: legendaryText,
      source: m.document__title || '',
    },
  };
}

export default function Open5eImport({ onImport, onCancel }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(
        `https://api.open5e.com/v1/monsters/?name__icontains=${encodeURIComponent(query.trim())}&limit=30&ordering=name`
      );
      if (!res.ok) throw new Error('Open5e API error');
      const json = await res.json();
      setResults(json.results || []);
    } catch {
      setError('Failed to reach Open5e. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 mb-1">Import from Open5e</h2>
      <p className="text-sm dark:text-zinc-500 text-zinc-600 mb-1">
        Search the Open5e SRD database and import a monster's stat block directly.
      </p>
      <a
        href="https://open5e.com"
        target="_blank"
        rel="noreferrer"
        className="text-xs dark:text-zinc-600 text-zinc-500 hover:text-amber-500 inline-flex items-center gap-1 mb-6"
      >
        <ExternalLink className="w-3 h-3" /> open5e.com
      </a>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search monsters (e.g. goblin, dragon, zombie)…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200"
        />
        <Button onClick={search} disabled={loading || !query.trim()} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold flex-shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm dark:text-zinc-500 text-zinc-600 text-center py-8">No monsters found for "{query}"</p>
      )}

      {results.length > 0 && (
        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          {results.map(m => (
            <button
              key={m.slug}
              onClick={() => onImport(mapMonsterToEntity(m))}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/40 bg-zinc-50 dark:hover:border-amber-500/40 hover:border-amber-400/60 dark:hover:bg-amber-500/5 hover:bg-amber-50 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold dark:text-zinc-200 text-zinc-900 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{m.name}</p>
                <p className="text-xs dark:text-zinc-500 text-zinc-500 truncate">
                  {[m.size, m.type, m.subtype ? `(${m.subtype})` : null].filter(Boolean).join(' ')}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <span className="text-xs dark:text-zinc-400 text-zinc-600 font-mono">CR {m.challenge_rating}</span>
                <span className="text-[10px] dark:text-zinc-600 text-zinc-400 max-w-[100px] truncate">{m.document__title}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
