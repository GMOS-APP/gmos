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

export default function ShopFields({ extraData, onChange }) {
  const get = (key) => extraData?.[key] || '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionDivider label="Identity" />
      <Field label="Shop Type"><TextInput value={get('shop_type')} onChange={(v) => set('shop_type', v)} placeholder="e.g. Blacksmith, Alchemist, General Store" /></Field>
      <Field label="Price Modifier"><TextInput value={get('price_modifier')} onChange={(v) => set('price_modifier', v)} placeholder="e.g. Standard, 10% markup, Haggling welcome" /></Field>
      <Field label="Shopkeeper Name"><TextInput value={get('shopkeeper')} onChange={(v) => set('shopkeeper', v)} placeholder="Who runs it?" /></Field>
      <Field label="Business Hours"><TextInput value={get('hours')} onChange={(v) => set('hours', v)} placeholder="e.g. Dawn to dusk, never on market day" /></Field>

      <SectionDivider label="Shopkeeper" />
      <div className="md:col-span-2"><Field label="Shopkeeper Personality"><TextArea value={get('personality')} onChange={(v) => set('personality', v)} placeholder="Demeanor, quirks, what they want from customers..." /></Field></div>

      <SectionDivider label="Inventory" />
      <div className="md:col-span-2"><Field label="Standard Inventory"><TextArea value={get('inventory')} onChange={(v) => set('inventory', v)} placeholder="Common items always in stock with prices..." rows={4} /></Field></div>
      <div className="md:col-span-2"><Field label="Special / Rare Items"><TextArea value={get('special_items')} onChange={(v) => set('special_items', v)} placeholder="Unique items, limited stock, or items that appear rarely..." /></Field></div>

      <SectionDivider label="Story" />
      <div className="md:col-span-2"><Field label="Rumors & Quest Hooks"><TextArea value={get('rumors')} onChange={(v) => set('rumors', v)} placeholder="What gossip does the shopkeeper know?" /></Field></div>
    </div>
  );
}