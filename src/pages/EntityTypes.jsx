import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EntityType } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Trash2, ArrowLeft, ChevronUp, ChevronDown, Lock, Save, Loader2, Shapes,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  ICON_OPTIONS, ICON_OPTION_NAMES, COLOR_PRESETS, COLOR_PRESET_KEYS, resolveIcon, BUILTIN_TYPE_KEYS,
} from '@/lib/entityTypes';

const FIELD_KINDS = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'chips', label: 'Tags / list' },
  { value: 'number', label: 'Number' },
];

const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

function blankType() {
  return {
    key: '', label: '', label_singular: '', icon: 'Shapes', color: 'slate',
    group_label: 'Custom', player_visible: false, fields: [],
  };
}

function blankField() {
  return { key: '', label: '', kind: 'text', options: [], placement: 'section', gmOnly: false };
}

// ── Type editor ──────────────────────────────────────────────────────────────
function TypeEditor({ initial, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isNew = !initial.id;
  const [form, setForm] = useState({ ...blankType(), ...initial, fields: (initial.fields || []).map((f) => ({ ...blankField(), ...f })) });
  const [iconOpen, setIconOpen] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const setField = (i, patch) => setForm((f) => {
    const fields = f.fields.slice();
    fields[i] = { ...fields[i], ...patch };
    return { ...f, fields };
  });
  const addField = () => setForm((f) => ({ ...f, fields: [...f.fields, blankField()] }));
  const removeField = (i) => setForm((f) => ({ ...f, fields: f.fields.filter((_, idx) => idx !== i) }));
  const moveField = (i, dir) => setForm((f) => {
    const j = i + dir;
    if (j < 0 || j >= f.fields.length) return f;
    const fields = f.fields.slice();
    [fields[i], fields[j]] = [fields[j], fields[i]];
    return { ...f, fields };
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (isNew ? EntityType.create(payload) : EntityType.update(initial.id, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-types'] });
      toast({ title: 'Saved', description: `“${form.label}” saved.` });
      onClose();
    },
    onError: (err) => toast({
      title: 'Could not save',
      description: /duplicate|unique/i.test(err?.message || '') ? 'A type with that key already exists.' : (err?.message || 'Try again.'),
      variant: 'destructive',
    }),
  });

  const handleSave = () => {
    const label = form.label.trim();
    if (!label) return toast({ title: 'Name required', description: 'Give the type a plural name.', variant: 'destructive' });
    const key = isNew ? slugify(form.label_singular || form.label) : form.key;
    if (!key) return toast({ title: 'Invalid name', description: 'Use letters or numbers in the name.', variant: 'destructive' });
    if (isNew && BUILTIN_TYPE_KEYS.includes(key)) {
      return toast({ title: 'Name in use', description: `“${key}” is a built-in type. Pick another name.`, variant: 'destructive' });
    }
    // Normalize fields: derive unique keys from labels, drop empties.
    const usedKeys = new Set();
    const fields = form.fields
      .filter((f) => f.label.trim())
      .map((f) => {
        let fk = slugify(f.label) || 'field';
        let n = 1;
        while (usedKeys.has(fk)) fk = `${slugify(f.label)}_${++n}`;
        usedKeys.add(fk);
        return {
          key: fk,
          label: f.label.trim(),
          kind: f.kind,
          placement: f.placement,
          gmOnly: !!f.gmOnly,
          ...(f.kind === 'select' ? { options: (Array.isArray(f.options) ? f.options : String(f.options).split(',')).map((o) => o.trim()).filter(Boolean) } : {}),
        };
      });
    saveMutation.mutate({
      key,
      label,
      label_singular: form.label_singular.trim() || label,
      icon: form.icon,
      color: form.color,
      group_label: form.group_label.trim() || 'Custom',
      player_visible: !!form.player_visible,
      fields,
    });
  };

  const PreviewIcon = resolveIcon(form.icon);
  const preset = COLOR_PRESETS[form.color] || COLOR_PRESETS.slate;

  return (
    <div className="space-y-6">
      <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
        <ArrowLeft className="w-4 h-4" /> All types
      </button>

      {/* Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name (plural)</label>
          <Input value={form.label} onChange={(e) => set({ label: e.target.value })} placeholder="e.g. Starships" className="dark:bg-zinc-950 dark:border-zinc-800" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name (singular)</label>
          <Input value={form.label_singular} onChange={(e) => set({ label_singular: e.target.value })} placeholder="e.g. Starship" className="dark:bg-zinc-950 dark:border-zinc-800" />
        </div>
      </div>

      {/* Icon + color + preview */}
      <div className="flex flex-wrap items-start gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Icon</label>
          <button
            type="button"
            onClick={() => setIconOpen((o) => !o)}
            className="w-10 h-10 rounded-lg border border-zinc-300 dark:border-zinc-800 flex items-center justify-center hover:border-zinc-400 dark:hover:border-zinc-700"
          >
            <PreviewIcon className={cn('w-5 h-5', preset.text)} />
          </button>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Color</label>
          <div className="flex flex-wrap gap-1.5 max-w-xs">
            {COLOR_PRESET_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ color: c })}
                aria-label={c}
                className={cn('w-6 h-6 rounded-full', COLOR_PRESETS[c].dot, form.color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-zinc-400' : '')}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block">Preview</label>
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', preset.tag)}>
            <PreviewIcon className="w-3.5 h-3.5" />
            {form.label || 'Untitled'}
          </span>
        </div>
      </div>

      {iconOpen && (
        <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 max-h-48 overflow-y-auto">
          {ICON_OPTION_NAMES.map((name) => {
            const Ic = ICON_OPTIONS[name];
            return (
              <button
                key={name}
                type="button"
                onClick={() => { set({ icon: name }); setIconOpen(false); }}
                className={cn('aspect-square rounded-md flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800', form.icon === name && 'bg-amber-500/15 text-amber-600 dark:text-amber-400')}
              >
                <Ic className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Options row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Sidebar group</label>
          <Input value={form.group_label} onChange={(e) => set({ group_label: e.target.value })} placeholder="Custom" className="dark:bg-zinc-950 dark:border-zinc-800" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800/50 px-3 py-2 md:mt-6">
          <div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Visible to players</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">Show non-GM fields on the player share link</p>
          </div>
          <Switch checked={form.player_visible} onCheckedChange={(v) => set({ player_visible: v })} />
        </div>
      </div>

      {/* Fields builder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">Fields</h3>
          <Button size="sm" variant="outline" onClick={addField} className="dark:border-zinc-700">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add field
          </Button>
        </div>
        {form.fields.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-600">No custom fields yet. Entities of this type will use Summary, Description, and Tags.</p>
        )}
        <div className="space-y-2">
          {form.fields.map((f, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input value={f.label} onChange={(e) => setField(i, { label: e.target.value })} placeholder="Field label (e.g. Crew)" className="flex-1 h-8 text-sm dark:bg-zinc-950 dark:border-zinc-800" />
                <div className="flex items-center">
                  <button type="button" onClick={() => moveField(i, -1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30" disabled={i === 0}><ChevronUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => moveField(i, 1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30" disabled={i === form.fields.length - 1}><ChevronDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => removeField(i)} className="p-1 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={f.kind} onValueChange={(v) => setField(i, { kind: v })}>
                  <SelectTrigger className="w-32 h-8 text-xs dark:bg-zinc-950 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent>{FIELD_KINDS.map((k) => <SelectItem key={k.value} value={k.value} className="text-xs">{k.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={f.placement} onValueChange={(v) => setField(i, { placement: v })}>
                  <SelectTrigger className="w-36 h-8 text-xs dark:bg-zinc-950 dark:border-zinc-800"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spec" className="text-xs">Header chip</SelectItem>
                    <SelectItem value="section" className="text-xs">Prose section</SelectItem>
                  </SelectContent>
                </Select>
                <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Switch checked={f.gmOnly} onCheckedChange={(v) => setField(i, { gmOnly: v })} />
                  <Lock className="w-3 h-3" /> GM only
                </label>
              </div>
              {f.kind === 'select' && (
                <Input
                  value={Array.isArray(f.options) ? f.options.join(', ') : (f.options || '')}
                  onChange={(e) => setField(i, { options: e.target.value.split(',').map((o) => o.trimStart()) })}
                  placeholder="Dropdown options, comma-separated"
                  className="h-8 text-sm dark:bg-zinc-950 dark:border-zinc-800"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} className="text-zinc-600 dark:text-zinc-400">Cancel</Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          {isNew ? 'Create type' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EntityTypes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null); // null | typeRow | blank

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['entity-types'],
    queryFn: () => EntityType.list('sort_order'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => EntityType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-types'] });
      toast({ title: 'Deleted', description: 'Custom type removed.' });
    },
    onError: () => toast({ title: 'Error', description: 'Could not delete.', variant: 'destructive' }),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Entity Types</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
          Define your own entity types with custom fields. They&rsquo;re available across all your campaigns — enable them per campaign in its settings.
        </p>
      </div>

      {editing ? (
        <TypeEditor initial={editing} onClose={() => setEditing(null)} />
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setEditing(blankType())} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold">
              <Plus className="w-4 h-4 mr-1.5" /> New type
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
          ) : types.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
              <Shapes className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500 dark:text-zinc-500">No custom types yet.</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Create one to model anything your system needs — starships, clues, contracts…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {types.map((t) => {
                const preset = COLOR_PRESETS[t.color] || COLOR_PRESETS.slate;
                const Icon = resolveIcon(t.icon);
                const fieldCount = Array.isArray(t.fields) ? t.fields.length : 0;
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 px-4 py-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', preset.bg)}>
                      <Icon className={cn('w-4.5 h-4.5', preset.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t.label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {fieldCount} field{fieldCount === 1 ? '' : 's'}
                        {t.player_visible && ' · player-visible'}
                        {t.group_label && t.group_label !== 'Custom' && ` · ${t.group_label}`}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t)} className="text-zinc-600 dark:text-zinc-400">Edit</Button>
                    <button
                      onClick={() => { if (window.confirm(`Delete “${t.label}”? Existing entities of this type are kept but will show as a generic type.`)) deleteMutation.mutate(t.id); }}
                      className="p-1.5 text-zinc-400 hover:text-red-500"
                      aria-label="Delete type"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
