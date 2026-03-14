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

const LOCATION_TYPES = ['City', 'Town', 'Village', 'Dungeon', 'Wilderness', 'Building', 'Ruins', 'Landmark', 'Region', 'Plane'];

export default function LocationFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Classification" />
      <Field label="Location Type">
        <Select value={get('location_type')} onValueChange={(v) => set('location_type', v)}>
          <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-700 text-sm h-9 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent className="bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-800">
            {LOCATION_TYPES.map((t) => <SelectItem key={t} value={t} className="text-zinc-300 text-xs">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Region / Area"><TextInput value={get('region')} onChange={(v) => set('region', v)} placeholder="e.g. The Sword Coast, Underdark" /></Field>

      <SectionDivider label="Description" />
      <div className="md:col-span-2"><Field label="Atmosphere & Sensory Details"><TextArea value={get('atmosphere')} onChange={(v) => set('atmosphere', v)} placeholder="What does it look, sound, smell like? What's the mood?" /></Field></div>
      <div className="md:col-span-2"><Field label="Notable Features & POIs"><TextArea value={get('notable_features')} onChange={(v) => set('notable_features', v)} placeholder="Key landmarks, districts, rooms, or points of interest..." /></Field></div>
      <div className="md:col-span-2"><Field label="Inhabitants"><TextArea value={get('inhabitants')} onChange={(v) => set('inhabitants', v)} placeholder="Who lives or lurks here? Factions present?" /></Field></div>

      <SectionDivider label="Story" />
      <div className="md:col-span-2"><Field label="Secrets & Hidden Elements"><TextArea value={get('secrets')} onChange={(v) => set('secrets', v)} placeholder="What hidden things can players discover here?" /></Field></div>
      <div className="md:col-span-2"><Field label="Adventure Hooks"><TextArea value={get('hooks')} onChange={(v) => set('hooks', v)} placeholder="Why would adventurers come here?" /></Field></div>
    </div>
  );
}