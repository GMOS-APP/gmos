import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
      className="bg-zinc-900/60 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
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

const DIFFICULTIES = ['Trivial', 'Easy', 'Medium', 'Hard', 'Deadly'];

export default function EncounterFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Overview" />
      <Field label="Difficulty">
        <Select value={get('difficulty')} onValueChange={(v) => set('difficulty', v)}>
          <SelectTrigger className="bg-zinc-900/60 border-zinc-800 text-zinc-300 text-sm h-9"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="text-zinc-300 text-xs">{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="XP Budget"><TextInput value={get('xp')} onChange={(v) => set('xp', v)} placeholder="e.g. 1,800 XP" /></Field>

      <SectionDivider label="Setup" />
      <div className="md:col-span-2"><Field label="Enemy Composition"><TextArea value={get('enemies')} onChange={(v) => set('enemies', v)} placeholder="What enemies? How many? Variants?" /></Field></div>
      <div className="md:col-span-2"><Field label="Terrain & Environment"><TextArea value={get('terrain')} onChange={(v) => set('terrain', v)} placeholder="Where does this take place? Environmental hazards, features?" /></Field></div>
      <div className="md:col-span-2"><Field label="Enemy Tactics"><TextArea value={get('tactics')} onChange={(v) => set('tactics', v)} placeholder="How do enemies fight? Morale? Retreat conditions?" /></Field></div>

      <SectionDivider label="Presentation" />
      <div className="md:col-span-2"><Field label="Read-Aloud Description"><TextArea value={get('read_aloud')} onChange={(v) => set('read_aloud', v)} placeholder="The text you read to players when the encounter begins..." /></Field></div>
      <div className="md:col-span-2"><Field label="Treasure & Rewards"><TextArea value={get('treasure')} onChange={(v) => set('treasure', v)} placeholder="Loot, magic items, information rewards..." /></Field></div>
    </div>
  );
}