import React from 'react';
import { Input } from '@/components/ui/input';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';

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
    <EntityMentionTextarea
      value={value || ''}
      onChange={onChange}
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

export default function DeityFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Identity" />
      <Field label="Domains"><TextInput value={get('domains')} onChange={(v) => set('domains', v)} placeholder="e.g. Life, Death, War, Knowledge" /></Field>
      <Field label="Alignment"><TextInput value={get('alignment')} onChange={(v) => set('alignment', v)} placeholder="e.g. Lawful Good, Chaotic Neutral" /></Field>
      <Field label="Holy Symbol"><TextInput value={get('holy_symbol')} onChange={(v) => set('holy_symbol', v)} placeholder="Describe the holy symbol..." /></Field>
      <Field label="Worshipper Alignment"><TextInput value={get('worshipper_alignment')} onChange={(v) => set('worshipper_alignment', v)} placeholder="Who tends to follow this deity?" /></Field>

      <SectionDivider label="Faith" />
      <div className="md:col-span-2"><Field label="Tenets & Commandments"><TextArea value={get('tenets')} onChange={(v) => set('tenets', v)} placeholder="What does this deity demand of their followers?" /></Field></div>
      <div className="md:col-span-2"><Field label="Clergy & Church Structure"><TextArea value={get('clergy')} onChange={(v) => set('clergy', v)} placeholder="How is the church organized? Titles, hierarchy?" /></Field></div>
      <div className="md:col-span-2"><Field label="Temples & Sacred Sites"><TextArea value={get('temples')} onChange={(v) => set('temples', v)} placeholder="Where do worshippers gather? Sacred places?" /></Field></div>

      <SectionDivider label="Lore" />
      <div className="md:col-span-2"><Field label="Myths & Legends"><TextArea value={get('myths')} onChange={(v) => set('myths', v)} placeholder="Stories told about this deity..." /></Field></div>
    </div>
  );
}