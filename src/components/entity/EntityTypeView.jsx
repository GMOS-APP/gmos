import React from 'react';
import {
  Wind, MapPin, Users, EyeOff, Anchor,
  Target, Network, Coins, Swords, DoorOpen,
  Sparkles, Eye, ScrollText, Package, Gem, MessageCircle,
  AlertCircle, Search, GitBranch,
  Scroll, Church, Landmark, BookOpen,
  Zap, Waves, Hand, Lock, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEntityColors } from '@/lib/entityColors';
import EntityMentionRenderer from '@/components/common/EntityMentionRenderer';

// Categorical palettes (intentional, not the TE override) ---------------------
const RARITY_COLORS = {
  Common:      'text-zinc-500 dark:text-zinc-400',
  Uncommon:    'text-green-600 dark:text-green-400',
  Rare:        'text-blue-600 dark:text-blue-400',
  'Very Rare': 'text-purple-600 dark:text-purple-400',
  Legendary:   'text-amber-600 dark:text-amber-400',
  Artifact:    'text-red-600 dark:text-red-400',
};
const URGENCY_COLORS = {
  Low:      'text-zinc-500 dark:text-zinc-400',
  Medium:   'text-sky-600 dark:text-sky-400',
  High:     'text-amber-600 dark:text-amber-400',
  Critical: 'text-red-600 dark:text-red-400',
};
const rarityTone = (v) => RARITY_COLORS[v] || 'text-zinc-700 dark:text-zinc-200';
const urgencyTone = (v) => URGENCY_COLORS[v] || 'text-zinc-700 dark:text-zinc-200';

// Per-type presentation: a `specs` strip of identifying fields, and themed
// prose `sections`. Keys map to entity.extra_data. This is the single place
// that decides how each entity type "reads" — not a generic key/value dump.
const PRESENTATION = {
  location: {
    specs: [
      { key: 'location_type', label: 'Type' },
      { key: 'region', label: 'Region' },
    ],
    sections: [
      { key: 'atmosphere', label: 'Atmosphere', Icon: Wind },
      { key: 'notable_features', label: 'Notable Features', Icon: MapPin },
      { key: 'inhabitants', label: 'Inhabitants', Icon: Users },
      { key: 'secrets', label: 'Secrets', Icon: EyeOff, gmOnly: true },
      { key: 'hooks', label: 'Adventure Hooks', Icon: Anchor },
    ],
  },
  faction: {
    specs: [
      { key: 'faction_type', label: 'Type' },
      { key: 'base', label: 'Base of Operations' },
    ],
    sections: [
      { key: 'goals', label: 'Goals & Agenda', Icon: Target },
      { key: 'structure', label: 'Structure & Leadership', Icon: Network },
      { key: 'resources', label: 'Resources & Power', Icon: Coins },
      { key: 'relationships', label: 'Allies & Enemies', Icon: Swords },
      { key: 'joining', label: 'Joining', Icon: DoorOpen },
    ],
  },
  item: {
    specs: [
      { key: 'item_type', label: 'Type' },
      { key: 'rarity', label: 'Rarity', tone: rarityTone },
      { key: 'attunement', label: 'Attunement' },
      { key: 'value', label: 'Value' },
      { key: 'holder', label: 'Held By' },
    ],
    sections: [
      { key: 'properties', label: 'Properties & Mechanics', Icon: Sparkles },
      { key: 'appearance', label: 'Physical Description', Icon: Eye },
      { key: 'history', label: 'History & Lore', Icon: ScrollText },
    ],
  },
  shop: {
    specs: [
      { key: 'shop_type', label: 'Type' },
      { key: 'shopkeeper', label: 'Shopkeeper' },
      { key: 'hours', label: 'Hours' },
      { key: 'price_modifier', label: 'Prices' },
    ],
    sections: [
      { key: 'personality', label: 'Shopkeeper', Icon: User },
      { key: 'inventory', label: 'Standard Inventory', Icon: Package },
      { key: 'special_items', label: 'Special & Rare', Icon: Gem },
      { key: 'rumors', label: 'Rumors & Hooks', Icon: MessageCircle },
    ],
  },
  thread: {
    specs: [
      { key: 'urgency', label: 'Urgency', tone: urgencyTone },
      { key: 'session_introduced', label: 'Introduced' },
    ],
    sections: [
      { key: 'situation', label: 'Situation & Stakes', Icon: AlertCircle },
      { key: 'key_npcs', label: 'Key NPCs', Icon: Users },
      { key: 'clues', label: 'Clues & Breadcrumbs', Icon: Search },
      { key: 'outcomes', label: 'Potential Outcomes', Icon: GitBranch },
    ],
  },
  deity: {
    specs: [
      { key: 'domains', label: 'Domains', chips: true },
      { key: 'alignment', label: 'Alignment' },
      { key: 'holy_symbol', label: 'Holy Symbol' },
      { key: 'worshipper_alignment', label: 'Worshippers' },
    ],
    sections: [
      { key: 'tenets', label: 'Tenets & Commandments', Icon: Scroll },
      { key: 'clergy', label: 'Clergy & Church', Icon: Church },
      { key: 'temples', label: 'Temples & Sacred Sites', Icon: Landmark },
      { key: 'myths', label: 'Myths & Legends', Icon: BookOpen },
    ],
  },
  event: {
    specs: [
      { key: 'trigger', label: 'When / Trigger' },
      { key: 'scale', label: 'Scale' },
    ],
    sections: [
      { key: 'description', label: 'What Happens', Icon: Zap },
      { key: 'participants', label: 'Key Participants', Icon: Users },
      { key: 'consequences', label: 'Aftermath & Consequences', Icon: Waves },
      { key: 'player_agency', label: 'Player Agency', Icon: Hand },
    ],
  },
  lore: {
    specs: [
      { key: 'category', label: 'Category' },
      { key: 'era', label: 'Era' },
    ],
    sections: [
      { key: 'common_knowledge', label: 'Common Knowledge', Icon: BookOpen },
      { key: 'secret_info', label: 'Secret Information', Icon: Lock, gmOnly: true },
      { key: 'discovery', label: 'How to Discover', Icon: Search },
      { key: 'mechanics', label: 'Mechanical Benefits', Icon: Sparkles },
    ],
  },
};

const humanize = (v) =>
  String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function SpecBand({ specs, extra, accent, TypeIcon }) {
  const present = specs.filter((s) => {
    const v = extra?.[s.key];
    return v !== null && v !== undefined && String(v).trim() !== '';
  });
  if (present.length === 0) return null;

  return (
    <div className="flex items-stretch gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3">
      {TypeIcon && (
        <div className="flex items-center pr-3 border-r border-zinc-200 dark:border-zinc-800">
          <TypeIcon className={cn('w-5 h-5', accent)} />
        </div>
      )}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 min-w-0">
        {present.map((s) => {
          const raw = extra[s.key];
          const value = s.humanize ? humanize(raw) : String(raw);
          return (
            <div key={s.key} className="min-w-0">
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 font-semibold mb-1">
                {s.label}
              </span>
              {s.chips ? (
                <div className="flex flex-wrap gap-1">
                  {value.split(',').map((part, i) => part.trim() && (
                    <span key={i} className={cn('inline-block text-xs px-1.5 py-0.5 rounded-md border', 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800', accent)}>
                      {part.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={cn('block text-sm font-medium', s.tone ? s.tone(raw) : 'text-zinc-800 dark:text-zinc-200')}>
                  {value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProseSection({ section, value, accent, campaignEntities, campaignId }) {
  const { label, Icon, gmOnly } = section;
  return (
    <section className={cn(gmOnly && 'border-l-2 border-amber-500/40 pl-4 -ml-4')}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={cn('w-3.5 h-3.5', gmOnly ? 'text-amber-500' : accent)} />}
        <h3 className="text-xs uppercase tracking-widest font-semibold text-zinc-500 dark:text-zinc-500">
          {label}
        </h3>
        {gmOnly && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500/90 bg-amber-500/10 border border-amber-500/30 rounded px-1 py-0.5">
            <Lock className="w-2.5 h-2.5" /> GM only
          </span>
        )}
      </div>
      <div className="text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
        <EntityMentionRenderer text={value} entities={campaignEntities} campaignId={campaignId} />
      </div>
    </section>
  );
}

/**
 * Type-tailored read-only presentation for non-stat-block entities
 * (location, faction, item, shop, thread, deity, event, lore, note).
 * Replaces the old generic humanized key/value grid.
 */
// Synthesize a PRESENTATION-shaped config from a custom type's field schema.
function configFromFields(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return null;
  return {
    specs: fields
      .filter((f) => f.placement === 'spec')
      .map((f) => ({ key: f.key, label: f.label, chips: f.kind === 'chips' })),
    sections: fields
      .filter((f) => f.placement !== 'spec')
      .map((f) => ({ key: f.key, label: f.label, gmOnly: !!f.gmOnly })),
  };
}

export default function EntityTypeView({ entityType, extraData, campaignEntities = [], campaignId, fields }) {
  // Custom types render from their schema; built-ins from the static PRESENTATION.
  const config = fields ? configFromFields(fields) : PRESENTATION[entityType];
  const extra = extraData || {};
  const meta = getEntityColors(entityType);
  const accent = meta.text;

  // Unknown type → graceful generic fallback (keeps prior behavior).
  if (!config) {
    const fields = Object.entries(extra).filter(([, v]) =>
      v !== null && v !== undefined && v !== '' && typeof v !== 'object');
    if (fields.length === 0) return null;
    return (
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {fields.map(([k, v]) => (
          <div key={k}>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wide block mb-0.5">{humanize(k)}</span>
            <span className="text-sm text-zinc-800 dark:text-zinc-300">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  const sections = config.sections.filter((s) => {
    const v = extra[s.key];
    return v !== null && v !== undefined && String(v).trim() !== '';
  });
  const hasBand = config.specs.some((s) => {
    const v = extra[s.key];
    return v !== null && v !== undefined && String(v).trim() !== '';
  });

  if (!hasBand && sections.length === 0) return null;

  return (
    <div className="space-y-7">
      <SpecBand specs={config.specs} extra={extra} accent={accent} TypeIcon={meta.Icon} />
      {sections.map((s) => (
        <ProseSection
          key={s.key}
          section={s}
          value={extra[s.key]}
          accent={accent}
          campaignEntities={campaignEntities}
          campaignId={campaignId}
        />
      ))}
    </div>
  );
}
