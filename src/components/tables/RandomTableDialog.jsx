import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RandomTable } from '@/api/entities';
import { useCampaign } from '@/lib/CampaignContext';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  { value: 'encounters', label: 'Encounters' },
  { value: 'names',      label: 'Names' },
  { value: 'loot',       label: 'Loot' },
  { value: 'plot_hooks', label: 'Plot Hooks' },
  { value: 'events',     label: 'Events' },
  { value: 'custom',     label: 'Custom' },
];

const EMPTY_FORM = { name: '', description: '', category: 'custom', entries: [] };

export default function RandomTableDialog({ open, onClose, campaignId, campaign, table }) {
  const queryClient = useQueryClient();
  const { system } = useCampaign();
  const [form, setForm] = useState(EMPTY_FORM);
  const [entryInput, setEntryInput] = useState('');
  const entryListRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(table
        ? { name: table.name, description: table.description || '', category: table.category, entries: (table.entries || []).map(e => ({ id: crypto.randomUUID(), result: e.result ?? e })) }
        : EMPTY_FORM
      );
      setEntryInput('');
    }
  }, [open, table]);

  const saveMutation = useMutation({
    mutationFn: (data) => table
      ? RandomTable.update(table.id, data)
      : RandomTable.create({ ...data, campaign_id: campaignId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['random_tables', campaignId] });
      onClose();
    },
  });

  const addEntry = () => {
    const val = entryInput.trim();
    if (!val) return;
    setForm(f => ({ ...f, entries: [...f.entries, { id: crypto.randomUUID(), result: val }] }));
    setEntryInput('');
    setTimeout(() => entryListRef.current?.scrollTo(0, entryListRef.current.scrollHeight), 50);
  };

  const removeEntry = (i) => {
    setForm(f => ({ ...f, entries: f.entries.filter((_, idx) => idx !== i) }));
  };

  const updateEntry = (i, val) => {
    setForm(f => {
      const entries = [...f.entries];
      entries[i] = { result: val };
      return { ...f, entries };
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    saveMutation.mutate({ name: form.name, description: form.description, category: form.category, entries: form.entries });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle>{table ? 'Edit Table' : 'New Table'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Table name"
            className="dark:bg-zinc-800 dark:border-zinc-700"
          />

          <div className="flex gap-2">
            <Select value={form.category} onValueChange={val => setForm(f => ({ ...f, category: val }))}>
              <SelectTrigger className="dark:bg-zinc-800 dark:border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Optional description"
            rows={2}
            className="dark:bg-zinc-800 dark:border-zinc-700 resize-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500">
              Entries ({form.entries.length})
            </span>
          </div>

          <div ref={entryListRef} className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {form.entries.length === 0 && (
              <p className="text-sm dark:text-zinc-600 text-zinc-400 text-center py-4">No entries yet — add some below.</p>
            )}
            {form.entries.map((e, i) => (
              <div key={e.id} className="flex gap-2 items-center">
                <Input
                  value={e.result}
                  onChange={ev => updateEntry(i, ev.target.value)}
                  className="text-sm dark:bg-zinc-800 dark:border-zinc-700 h-8"
                />
                <button
                  onClick={() => removeEntry(i)}
                  className="flex-shrink-0 p-1 rounded dark:text-zinc-500 dark:hover:text-red-400 text-zinc-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={entryInput}
              onChange={e => setEntryInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEntry()}
              placeholder="New entry… (press Enter)"
              className="text-sm dark:bg-zinc-800 dark:border-zinc-700"
            />
            <Button variant="outline" size="icon" onClick={addEntry} className="flex-shrink-0 dark:border-zinc-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-zinc-800 border-zinc-200">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !form.name.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
          >
            Save Table
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
