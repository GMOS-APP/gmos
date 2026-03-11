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
       className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500"
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
       className="dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600 bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500 resize-none"
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

export default function LoreFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Classification" />
      <Field label="Lore Category"><TextInput value={get('category')} onChange={(v) => set('category', v)} placeholder="e.g. History, Religion, Magic, Geography" /></Field>
      <Field label="Era / Time Period"><TextInput value={get('era')} onChange={(v) => set('era', v)} placeholder="e.g. Age of Dragons, Third Era" /></Field>

      <SectionDivider label="Knowledge" />
      <div className="md:col-span-2"><Field label="Common Knowledge (Players Know)"><TextArea value={get('common_knowledge')} onChange={(v) => set('common_knowledge', v)} placeholder="What's publicly known or easily discovered?" /></Field></div>
      <div className="md:col-span-2"><Field label="Secret Information (DM Only)"><TextArea value={get('secret_info')} onChange={(v) => set('secret_info', v)} placeholder="Hidden truths, contradictions, deeper layers..." /></Field></div>

      <SectionDivider label="Discovery" />
      <div className="md:col-span-2"><Field label="How to Discover"><TextArea value={get('discovery')} onChange={(v) => set('discovery', v)} placeholder="Skill checks, locations, NPCs that can reveal this lore..." /></Field></div>
      <div className="md:col-span-2"><Field label="Mechanical Benefits"><TextArea value={get('mechanics')} onChange={(v) => set('mechanics', v)} placeholder="Advantage on checks? Unlocks abilities? Grants access?" /></Field></div>
    </div>
  );
}