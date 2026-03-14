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

const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ThreadFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Status" />
      <Field label="Urgency">
        <Select value={get('urgency')} onValueChange={(v) => set('urgency', v)}>
          <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-700 text-sm h-9 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300"><SelectValue placeholder="Select urgency" /></SelectTrigger>
          <SelectContent className="bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
            {URGENCIES.map((u) => <SelectItem key={u} value={u} className="text-zinc-300 text-xs">{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Session Introduced"><TextInput value={get('session_introduced')} onChange={(v) => set('session_introduced', v)} placeholder="e.g. Session 3" /></Field>

      <SectionDivider label="Details" />
      <div className="md:col-span-2"><Field label="Current Situation & Stakes"><TextArea value={get('situation')} onChange={(v) => set('situation', v)} placeholder="What is happening right now? What's at stake?" /></Field></div>
      <div className="md:col-span-2"><Field label="Key NPCs Involved"><TextArea value={get('key_npcs')} onChange={(v) => set('key_npcs', v)} placeholder="Who are the main players in this thread?" /></Field></div>
      <div className="md:col-span-2"><Field label="Potential Outcomes"><TextArea value={get('outcomes')} onChange={(v) => set('outcomes', v)} placeholder="Success / failure outcomes and branching paths..." /></Field></div>
      <div className="md:col-span-2"><Field label="Clues & Breadcrumbs"><TextArea value={get('clues')} onChange={(v) => set('clues', v)} placeholder="How can players learn about or advance this thread?" /></Field></div>
    </div>
  );
}