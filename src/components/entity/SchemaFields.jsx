import React from 'react';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import EntityMentionTextarea from '@/components/common/EntityMentionTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Generic edit form for custom (user-defined) entity types. Renders controls
// from a type's `fields` schema, writing into entity.extra_data — the same
// get/set-on-extra_data pattern the built-in *Fields.jsx components use.
// Field def: { key, label, kind, options?, placement, gmOnly? }.

const inputCls = 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-600';

function FieldLabel({ label, gmOnly }) {
  return (
    <label className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
      {label}
      {gmOnly && (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-500/90 normal-case tracking-normal">
          <Lock className="w-2.5 h-2.5" /> GM
        </span>
      )}
    </label>
  );
}

export default function SchemaFields({ fields = [], extraData, onChange }) {
  const get = (key) => extraData?.[key] ?? '';
  const set = (key, val) => onChange({ ...(extraData || {}), [key]: val });

  if (!fields.length) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        This type has no custom fields. Use Summary, Description, and Tags — or add fields in Entity Types settings.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => {
        const wide = f.kind === 'textarea';
        return (
          <div key={f.key} className={wide ? 'md:col-span-2' : ''}>
            <FieldLabel label={f.label} gmOnly={f.gmOnly} />
            {f.kind === 'textarea' ? (
              <EntityMentionTextarea
                value={get(f.key) || ''}
                onChange={(v) => set(f.key, v)}
                placeholder={f.placeholder || ''}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            ) : f.kind === 'select' ? (
              <Select value={get(f.key)} onValueChange={(v) => set(f.key, v)}>
                <SelectTrigger className="bg-zinc-100 border-zinc-300 text-zinc-700 text-sm h-9 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent className="bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                  {(f.options || []).filter(Boolean).map((o) => (
                    <SelectItem key={o} value={o} className="text-zinc-300 text-xs">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : f.kind === 'boolean' ? (
              <div className="flex items-center gap-2 h-9">
                <Switch checked={get(f.key) === 'Yes'} onCheckedChange={(v) => set(f.key, v ? 'Yes' : '')} />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{get(f.key) === 'Yes' ? 'Yes' : 'No'}</span>
              </div>
            ) : (
              <Input
                type={f.kind === 'number' ? 'number' : f.kind === 'url' ? 'url' : 'text'}
                value={get(f.key)}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.kind === 'chips' ? 'Comma-separated…' : (f.placeholder || (f.kind === 'url' ? 'https://…' : ''))}
                className={inputCls}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
