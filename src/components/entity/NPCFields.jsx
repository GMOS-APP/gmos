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

const ALIGNMENTS = ['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','True Neutral','Chaotic Neutral','Lawful Evil','Neutral Evil','Chaotic Evil'];

export default function NPCFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Identity" />
      <Field label="Race"><TextInput value={get('race')} onChange={(v) => set('race', v)} placeholder="e.g. Human, Elf, Tiefling" /></Field>
      <Field label="Class / Role"><TextInput value={get('class')} onChange={(v) => set('class', v)} placeholder="e.g. Merchant, Wizard, Guard" /></Field>
      <Field label="Gender"><TextInput value={get('gender')} onChange={(v) => set('gender', v)} placeholder="e.g. Male, Female, Non-binary" /></Field>
      <Field label="Alignment">
        <Select value={get('alignment')} onValueChange={(v) => set('alignment', v)}>
          <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-700 text-sm h-9 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300"><SelectValue placeholder="Select alignment" /></SelectTrigger>
          <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            {ALIGNMENTS.map((a) => <SelectItem key={a} value={a} className="text-zinc-300 text-xs">{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <SectionDivider label="Description" />
      <div className="md:col-span-2"><Field label="Appearance"><TextArea value={get('appearance')} onChange={(v) => set('appearance', v)} placeholder="Physical description, notable features..." /></Field></div>
      <div className="md:col-span-2"><Field label="Personality Traits"><TextArea value={get('traits')} onChange={(v) => set('traits', v)} placeholder="Personality, ideals, bonds, flaws..." /></Field></div>
      <div className="md:col-span-2"><Field label="Motives & Goals"><TextArea value={get('motives')} onChange={(v) => set('motives', v)} placeholder="What does this NPC want? What drives them?" /></Field></div>

      <SectionDivider label="Story" />
      <div className="md:col-span-2"><Field label="Sample Dialogue"><TextArea value={get('sample_dialogue')} onChange={(v) => set('sample_dialogue', v)} placeholder='"A line or two in their voice..."' /></Field></div>
      <div className="md:col-span-2"><Field label="Rumors"><TextArea value={get('rumors')} onChange={(v) => set('rumors', v)} placeholder="What do people say about this NPC?" /></Field></div>
      <div className="md:col-span-2"><Field label="Quest Hooks"><TextArea value={get('quests')} onChange={(v) => set('quests', v)} placeholder="Adventure hooks tied to this NPC..." /></Field></div>
    </div>
  );
}