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

export default function EventFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Overview" />
      <Field label="When / Trigger"><TextInput value={get('trigger')} onChange={(v) => set('trigger', v)} placeholder="When does this happen? What sets it off?" /></Field>
      <Field label="Scale"><TextInput value={get('scale')} onChange={(v) => set('scale', v)} placeholder="e.g. Local, Regional, World-Shaking" /></Field>

      <SectionDivider label="Details" />
      <div className="md:col-span-2"><Field label="Key Participants"><TextArea value={get('participants')} onChange={(v) => set('participants', v)} placeholder="Who is involved? NPCs, factions, monsters?" /></Field></div>
      <div className="md:col-span-2"><Field label="What Happens"><TextArea value={get('description')} onChange={(v) => set('description', v)} placeholder="Describe the event in detail..." /></Field></div>

      <SectionDivider label="Consequences" />
      <div className="md:col-span-2"><Field label="Aftermath & Consequences"><TextArea value={get('consequences')} onChange={(v) => set('consequences', v)} placeholder="How does the world change? What are the ripple effects?" /></Field></div>
      <div className="md:col-span-2"><Field label="Player Agency"><TextArea value={get('player_agency')} onChange={(v) => set('player_agency', v)} placeholder="How can players influence or interact with this event?" /></Field></div>
    </div>
  );
}