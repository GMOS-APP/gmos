import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, ArrowLeft, ExternalLink } from 'lucide-react';

// ── Per-endpoint config ───────────────────────────────────────────────────────

const CONFIGS = {
  creature: {
    endpoint: 'monsters',
    label: 'Monster',
    filters: [
      {
        key: 'type',
        param: 'type',
        placeholder: 'All types',
        options: ['Aberration','Beast','Celestial','Construct','Dragon','Elemental',
                  'Fey','Fiend','Giant','Humanoid','Monstrosity','Ooze','Plant','Undead'],
      },
      {
        key: 'cr',
        param: 'cr',
        placeholder: 'Any CR',
        options: [
          { label: 'CR 0',   value: '0' },
          { label: 'CR 1/8', value: '0.125' },
          { label: 'CR 1/4', value: '0.25' },
          { label: 'CR 1/2', value: '0.5' },
          ...Array.from({ length: 30 }, (_, i) => ({ label: `CR ${i + 1}`, value: String(i + 1) })),
        ],
      },
    ],
    mapResult: (m) => {
      const summary = [m.size, m.type, m.subtype ? `(${m.subtype})` : '', m.alignment].filter(Boolean).join(' ');
      const tags = [m.type?.toLowerCase(), m.size?.toLowerCase(), m.challenge_rating ? `CR ${m.challenge_rating}` : null].filter(Boolean);
      const traits = (m.special_abilities || []).map(a => `**${a.name}**\n${a.desc}`).join('\n\n');
      const formatActions = (arr) => (arr || []).map(a => `**${a.name}**\n${a.desc}`).join('\n\n');
      const actions = [
        formatActions(m.actions),
        m.bonus_actions?.length ? `**Bonus Actions**\n${formatActions(m.bonus_actions)}` : '',
        m.reactions?.length ? `**Reactions**\n${formatActions(m.reactions)}` : '',
      ].filter(Boolean).join('\n\n');
      const legendaryText = [m.legendary_desc, ...(m.legendary_actions || []).map(a => `**${a.name}**\n${a.desc}`)].filter(Boolean).join('\n\n');
      const speedStr = m.speed && typeof m.speed === 'object'
        ? Object.entries(m.speed).map(([k, v]) => k === 'walk' ? `${v} ft.` : `${k} ${v} ft.`).join(', ')
        : '';
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
          ac: [m.armor_class, m.armor_desc ? `(${m.armor_desc})` : ''].filter(Boolean).join(' '),
          hp: [m.hit_points, m.hit_dice ? `(${m.hit_dice})` : ''].filter(Boolean).join(' '),
          speed: speedStr,
          ability_scores: `${m.strength} / ${m.dexterity} / ${m.constitution} / ${m.intelligence} / ${m.wisdom} / ${m.charisma}`,
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
    },
    renderMeta: (m) => `${[m.size, m.type].filter(Boolean).join(' ')}`,
    renderSide: (m) => `CR ${m.challenge_rating}`,
  },

  item: {
    endpoint: 'magicitems',
    label: 'Magic Item',
    filters: [
      {
        key: 'type',
        param: 'type__icontains',
        placeholder: 'All types',
        options: ['Armor','Potion','Ring','Rod','Scroll','Staff','Wand','Weapon','Wondrous Item'],
      },
      {
        key: 'rarity',
        param: 'rarity',
        placeholder: 'Any rarity',
        options: [
          { label: 'Common',    value: 'common' },
          { label: 'Uncommon',  value: 'uncommon' },
          { label: 'Rare',      value: 'rare' },
          { label: 'Very Rare', value: 'very rare' },
          { label: 'Legendary', value: 'legendary' },
          { label: 'Artifact',  value: 'artifact' },
        ],
      },
    ],
    mapResult: (m) => ({
      name: m.name,
      entity_type: 'item',
      summary: [m.rarity, m.type, m.requires_attunement ? '(requires attunement)' : ''].filter(Boolean).join(' · '),
      description: m.desc || '',
      tags: [m.type?.toLowerCase(), m.rarity].filter(Boolean),
      image_url: '',
      extra_data: {
        item_type: m.type,
        rarity: m.rarity,
        attunement: m.requires_attunement || '',
        source: m.document__title || '',
      },
    }),
    renderMeta: (m) => m.type || '',
    renderSide: (m) => m.rarity,
  },

  lore: {
    endpoint: 'spells',
    label: 'Spell',
    filters: [
      {
        key: 'level',
        param: 'level_int',
        placeholder: 'Any level',
        options: [
          { label: 'Cantrip (0)', value: '0' },
          ...Array.from({ length: 9 }, (_, i) => ({ label: `Level ${i + 1}`, value: String(i + 1) })),
        ],
      },
      {
        key: 'school',
        param: 'school__icontains',
        placeholder: 'Any school',
        options: ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'],
      },
    ],
    mapResult: (m) => ({
      name: m.name,
      entity_type: 'lore',
      summary: `${m.level_int === 0 ? 'Cantrip' : `Level ${m.level_int}`} · ${m.school} · ${m.casting_time}`,
      description: [m.desc, m.higher_level ? `**At Higher Levels.** ${m.higher_level}` : ''].filter(Boolean).join('\n\n'),
      tags: [m.school?.toLowerCase(), m.level_int === 0 ? 'cantrip' : `level ${m.level_int}`].filter(Boolean),
      image_url: '',
      extra_data: {
        spell_level: m.level,
        school: m.school,
        casting_time: m.casting_time,
        range: m.range,
        components: m.components,
        material: m.material || '',
        duration: m.duration,
        concentration: m.requires_concentration ? 'Yes' : 'No',
        ritual: m.can_be_cast_as_ritual ? 'Yes' : 'No',
        classes: m.dnd_class || '',
        source: m.document__title || '',
      },
    }),
    renderMeta: (m) => `${m.school} · ${m.casting_time}`,
    renderSide: (m) => m.level_int === 0 ? 'Cantrip' : `Level ${m.level_int}`,
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Open5eImport({ entityType, onImport, onCancel }) {
  const config = CONFIGS[entityType] || CONFIGS.creature;
  const [query, setQuery] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [total, setTotal] = useState(0);

  // Reset when entity type changes
  useEffect(() => {
    setQuery('');
    setFilterValues({});
    setResults([]);
    setSearched(false);
    setError('');
  }, [entityType]);

  const buildUrl = useCallback((q, filters) => {
    const params = new URLSearchParams({ limit: '40', ordering: 'name' });
    if (q.trim()) params.set('name__icontains', q.trim());
    config.filters.forEach(f => {
      const val = filters[f.key];
      if (val) params.set(f.param, val);
    });
    return `https://api.open5e.com/v1/${config.endpoint}/?${params}`;
  }, [config]);

  const search = useCallback(async (q = query, filters = filterValues) => {
    if (!q.trim() && !Object.values(filters).some(Boolean)) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(buildUrl(q, filters));
      if (!res.ok) throw new Error('Open5e API error');
      const json = await res.json();
      setResults(json.results || []);
      setTotal(json.count || 0);
    } catch {
      setError('Failed to reach Open5e. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [query, filterValues, buildUrl]);

  const setFilter = (key, val) => {
    const next = { ...filterValues, [key]: val === '_all' ? '' : val };
    setFilterValues(next);
    if (searched) search(query, next);
  };

  const hasInput = query.trim() || Object.values(filterValues).some(Boolean);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h2 className="text-2xl font-bold dark:text-zinc-100 text-zinc-900 mb-1">
        Import {config.label} from Open5e
      </h2>
      <p className="text-sm dark:text-zinc-500 text-zinc-600 mb-1">
        Search the Open5e database and import directly into your campaign.
      </p>
      <a
        href="https://open5e.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs dark:text-zinc-600 text-zinc-500 hover:text-amber-500 inline-flex items-center gap-1 mb-6"
      >
        <ExternalLink className="w-3 h-3" /> open5e.com
      </a>

      {/* Search */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder={`Search ${config.label.toLowerCase()} by name…`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200"
        />
        <Button
          onClick={() => search()}
          disabled={loading || !hasInput}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {config.filters.map(f => (
          <Select key={f.key} value={filterValues[f.key] || '_all'} onValueChange={v => setFilter(f.key, v)}>
            <SelectTrigger className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 text-sm">
              <SelectValue placeholder={f.placeholder} />
            </SelectTrigger>
            <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 max-h-64">
              <SelectItem value="_all">{f.placeholder}</SelectItem>
              {f.options.map(o => {
                const val = typeof o === 'string' ? o : o.value;
                const label = typeof o === 'string' ? o : o.label;
                return <SelectItem key={val} value={val}>{label}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm dark:text-zinc-500 text-zinc-600 text-center py-8">
          No results — try different search terms or filters
        </p>
      )}

      {results.length > 0 && (
        <>
          <p className="text-xs dark:text-zinc-600 text-zinc-500 mb-2">
            {total} result{total !== 1 ? 's' : ''}{total > 40 ? ' — showing first 40' : ''}
          </p>
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {results.map(m => (
              <button
                key={m.slug}
                onClick={() => onImport(config.mapResult(m))}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/40 bg-zinc-50 dark:hover:border-amber-500/40 hover:border-amber-400/60 dark:hover:bg-amber-500/5 hover:bg-amber-50 transition-all text-left group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold dark:text-zinc-200 text-zinc-900 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">{m.name}</p>
                  <p className="text-xs dark:text-zinc-500 text-zinc-500 truncate">{config.renderMeta(m)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  <span className="text-xs dark:text-zinc-400 text-zinc-600 font-mono whitespace-nowrap">{config.renderSide(m)}</span>
                  <span className="text-[10px] dark:text-zinc-600 text-zinc-400 max-w-[90px] truncate">{m.document__title}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
