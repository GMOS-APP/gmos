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
      className="bg-zinc-900/60 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none"
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

export default function FactionFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Identity" />
      <Field label="Faction Type"><TextInput value={get('faction_type')} onChange={(v) => set('faction_type', v)} placeholder="e.g. Guild, Cult, Noble House, Military" /></Field>
      <Field label="Base of Operations"><TextInput value={get('base')} onChange={(v) => set('base', v)} placeholder="Where are they headquartered?" /></Field>

      <SectionDivider label="Organization" />
      <div className="md:col-span-2"><Field label="Goals & Agenda"><TextArea value={get('goals')} onChange={(v) => set('goals', v)} placeholder="What does this faction want? What are they working toward?" /></Field></div>
      <div className="md:col-span-2"><Field label="Structure & Leadership"><TextArea value={get('structure')} onChange={(v) => set('structure', v)} placeholder="How are they organized? Who leads them? Rank structure?" /></Field></div>
      <div className="md:col-span-2"><Field label="Resources & Power"><TextArea value={get('resources')} onChange={(v) => set('resources', v)} placeholder="What assets, wealth, and influence do they command?" /></Field></div>

      <SectionDivider label="Story" />
      <div className="md:col-span-2"><Field label="Allies & Enemies"><TextArea value={get('relationships')} onChange={(v) => set('relationships', v)} placeholder="Key alliances and rivalries with other factions..." /></Field></div>
      <div className="md:col-span-2"><Field label="Joining Requirements"><TextArea value={get('joining')} onChange={(v) => set('joining', v)} placeholder="How can PCs join? What ranks are available?" /></Field></div>
    </div>
  );
}