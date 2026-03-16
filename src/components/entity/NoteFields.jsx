import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NoteFields({ extraData, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs dark:text-zinc-500 text-zinc-600 uppercase tracking-widest font-semibold mb-2 block">Category</label>
        <Select
          value={extraData?.category || 'general'}
          onValueChange={(v) => onChange({ ...extraData, category: v })}
        >
          <SelectTrigger className="w-48 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 bg-white border-zinc-300 text-zinc-900 text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800 bg-white border-zinc-300">
            <SelectItem value="general" className="dark:text-zinc-300 text-zinc-900 text-xs">General</SelectItem>
            <SelectItem value="plot_hook" className="dark:text-zinc-300 text-zinc-900 text-xs">Plot Hook</SelectItem>
            <SelectItem value="reminder" className="dark:text-zinc-300 text-zinc-900 text-xs">Reminder</SelectItem>
            <SelectItem value="player_action" className="dark:text-zinc-300 text-zinc-900 text-xs">Player Action</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
