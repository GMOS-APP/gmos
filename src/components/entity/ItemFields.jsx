import React from 'react';
import { Input } from '@/components/ui/input';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <EntityMentionTextarea
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 resize-none"
    />
  );
}

function SectionDivider({ label }) {
  return (
    <div className="md:col-span-2 flex items-center gap-3 pt-3">
      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];
const ITEM_TYPES = ['Weapon', 'Armor', 'Wondrous Item', 'Ring', 'Rod', 'Staff', 'Wand', 'Potion', 'Scroll', 'Tool', 'Vehicle', 'Treasure'];

export default function ItemFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Classification" />
      <Field label="Item Type">
        <Select value={get('item_type')} onValueChange={(v) => set('item_type', v)}>
          <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-700 text-sm h-9 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            {ITEM_TYPES.map((t) => <SelectItem key={t} value={t} className="text-zinc-300 text-xs">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Rarity">
        <Select value={get('rarity')} onValueChange={(v) => set('rarity', v)}>
          <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-700 text-sm h-9 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300"><SelectValue placeholder="Select rarity" /></SelectTrigger>
          <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            {RARITIES.map((r) => <SelectItem key={r} value={r} className="text-zinc-300 text-xs">{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Requires Attunement"><TextInput value={get('attunement')} onChange={(v) => set('attunement', v)} placeholder="e.g. Yes (by a spellcaster), No" /></Field>
      <Field label="Value / Price"><TextInput value={get('value')} onChange={(v) => set('value', v)} placeholder="e.g. 5,000 gp" /></Field>

      <SectionDivider label="Mechanics" />
      <div className="md:col-span-2"><Field label="Properties & Mechanics"><TextArea value={get('properties')} onChange={(v) => set('properties', v)} placeholder="What does it do? Bonuses, charges, abilities..." rows={4} /></Field></div>

      <SectionDivider label="Ownership" />
      <div className="md:col-span-2"><Field label="Held By"><TextInput value={get('holder')} onChange={(v) => set('holder', v)} placeholder="Which PC currently holds this item?" /></Field></div>

      <SectionDivider label="Lore" />
      <div className="md:col-span-2"><Field label="History & Lore"><TextArea value={get('history')} onChange={(v) => set('history', v)} placeholder="Origin, previous owners, legends surrounding it..." /></Field></div>
      <div className="md:col-span-2"><Field label="Physical Description"><TextArea value={get('appearance')} onChange={(v) => set('appearance', v)} placeholder="What does it look like? Size, materials, markings..." /></Field></div>
    </div>
  );
}