import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { MOD_LABEL, ALT_LABEL } from '@/lib/useHotkeys';
import { useHotkeysEnabled, setHotkeysEnabled } from '@/lib/useHotkeysEnabled';

function Keys({ combo }) {
  return (
    <span className="flex items-center gap-1">
      {combo.map((k, i) => (
        <kbd
          key={i}
          className="px-1.5 py-0.5 min-w-[1.5rem] text-center rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

const SHORTCUTS = [
  { combo: [MOD_LABEL, 'K'], desc: 'Open command palette — search, create, or jump to a page' },
  { combo: [ALT_LABEL, 'N'], desc: 'Open the quick-create menu' },
  { combo: ['?'], desc: 'Show this shortcuts help' },
  { combo: ['Esc'], desc: 'Close the palette, menu, or this dialog' },
];

export default function ShortcutsHelp({ open, onOpenChange }) {
  const enabled = useHotkeysEnabled();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Speed up common actions from anywhere in the app.</DialogDescription>
        </DialogHeader>
        <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {SHORTCUTS.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{s.desc}</span>
              <Keys combo={s.combo} />
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between gap-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Enable shortcuts</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">Also toggleable in Campaign Settings → Preferences.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setHotkeysEnabled} aria-label="Enable keyboard shortcuts" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
