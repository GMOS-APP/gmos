import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
      className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <Textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 resize-none"
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

export default function CreatureFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Classification" />
      <Field label="Creature Type"><TextInput value={get('creature_type')} onChange={(v) => set('creature_type', v)} placeholder="e.g. Beast, Undead, Dragon" /></Field>
      <Field label="Challenge Rating"><TextInput value={get('cr')} onChange={(v) => set('cr', v)} placeholder="e.g. 5, 1/2, 17" /></Field>
      <Field label="Size"><TextInput value={get('size')} onChange={(v) => set('size', v)} placeholder="e.g. Large, Medium, Tiny" /></Field>

      <SectionDivider label="Combat Stats" />
      <Field label="Armor Class"><TextInput value={get('ac')} onChange={(v) => set('ac', v)} placeholder="e.g. 15 (natural armor)" /></Field>
      <Field label="Hit Points"><TextInput value={get('hp')} onChange={(v) => set('hp', v)} placeholder="e.g. 97 (13d10 + 26)" /></Field>
      <Field label="Speed"><TextInput value={get('speed')} onChange={(v) => set('speed', v)} placeholder="e.g. 30 ft., fly 60 ft." /></Field>
      <div className="md:col-span-2"><Field label="Ability Scores (STR / DEX / CON / INT / WIS / CHA)"><TextInput value={get('ability_scores')} onChange={(v) => set('ability_scores', v)} placeholder="e.g. 19 / 10 / 16 / 7 / 12 / 8" /></Field></div>

      <SectionDivider label="Abilities & Behavior" />
      <div className="md:col-span-2"><Field label="Special Traits / Abilities"><TextArea value={get('traits')} onChange={(v) => set('traits', v)} placeholder="Passive traits and special abilities..." rows={4} /></Field></div>
      <div className="md:col-span-2"><Field label="Actions"><TextArea value={get('actions')} onChange={(v) => set('actions', v)} placeholder="Multiattack, attacks, and special actions..." rows={4} /></Field></div>
      <div className="md:col-span-2"><Field label="Tactics & Behavior"><TextArea value={get('tactics')} onChange={(v) => set('tactics', v)} placeholder="How does this creature fight? What does it fear?" /></Field></div>
    </div>
  );
}