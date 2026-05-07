import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, ArrowLeft, ExternalLink } from 'lucide-react';

const CREATURE_TYPES = [
  'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon',
  'Elemental', 'Fey', 'Fiend', 'Giant', 'Humanoid',
  'Monstrosity', 'Ooze', 'Plant', 'Undead',
];

const CR_OPTIONS = [
  { label: '0',    value: '0' },
  { label: '1/8',  value: '0.125' },
  { label: '1/4',  value: '0.25' },
  { label: '1/2',  value: '0.5' },
  ...Array.from({ length: 30 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })),
];

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

  const traits = (m.special_abilities || [])
    .map(a => `**${a.name}**\n${a.desc}`).join('\n\n');

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
  const [typeFilter, setTypeFilter] = useState('');
  const [crFilter, setCrFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);

  const search = useCallback(async (q = query, type = typeFilter, cr = crFilter) => {
    if (!q.trim() && !type && !cr) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const params = new URLSearchParams({ limit: '40', ordering: 'name' });
      if (q.trim()) params.set('name__icontains', q.trim());
      if (type) params.set('type', type);
      if (cr) params.set('cr', cr);
      const res = await fetch(`https://api.open5e.com/v1/monsters/?${params}`);
      if (!res.ok) throw new Error('Open5e API error');
      const json = await res.json();
      setResults(json.results || []);
      setTotal(json.count || 0);
    } catch {
      setError('Failed to reach Open5e. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter, crFilter]);

  // Auto-search when filters change if a search has already been run
  useEffect(() => {
    if (searched) search(query, typeFilter, crFilter);
  }, [typeFilter, crFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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
        Search the Open5e database and import a monster's full stat block.
      </p>
      <a
        href="https://open5e.com"
        target="_blank"
        rel="noreferrer"
        className="text-xs dark:text-zinc-600 text-zinc-500 hover:text-amber-500 inline-flex items-center gap-1 mb-6"
      >
        <ExternalLink className="w-3 h-3" /> open5e.com
      </a>

      {/* Search row */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Search by name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200"
        />
        <Button
          onClick={() => search()}
          disabled={loading || (!query.trim() && !typeFilter && !crFilter)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex gap-2 mb-5">
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
            <SelectItem value="_all">All types</SelectItem>
            {CREATURE_TYPES.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={crFilter} onValueChange={v => setCrFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 text-sm">
            <SelectValue placeholder="Any CR" />
          </SelectTrigger>
          <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 max-h-60">
            <SelectItem value="_all">Any CR</SelectItem>
            {CR_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>CR {o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm dark:text-zinc-500 text-zinc-600 text-center py-8">No monsters found — try different filters</p>
      )}

      {results.length > 0 && (
        <>
          <p className="text-xs dark:text-zinc-600 text-zinc-500 mb-2">{total} result{total !== 1 ? 's' : ''}{total > 40 ? ' — showing first 40' : ''}</p>
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
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
        </>
      )}
    </div>
  );
}
