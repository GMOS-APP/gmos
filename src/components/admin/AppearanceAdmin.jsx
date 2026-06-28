import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Check, Palette } from 'lucide-react';
import { callAdmin, CARD } from '@/lib/adminApi';
import { Setting } from '@/api/entities';
import { applyAccent, clearAccent, setAccentCached, DEFAULT_ACCENT } from '@/lib/theme';
import { cn } from '@/lib/utils';

const ACCENT_PRESETS = [
  { name: 'Signal', hex: DEFAULT_ACCENT },
  { name: 'Ember', hex: '#e11d48' },
  { name: 'Gold', hex: '#d4a017' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Ocean', hex: '#2563eb' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Magenta', hex: '#db2777' },
  { name: 'Slate', hex: '#64748b' },
];

// Brand accent color, applied to every user across the app. Previews live while
// editing; if the admin navigates away without saving, the saved value is
// restored on unmount.
export default function AppearanceAdmin() {
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [savedAccent, setSavedAccent] = useState(null);
  const [accentBusy, setAccentBusy] = useState(false);

  useEffect(() => {
    Setting.filter({ id: 'global' }).then((rows) => {
      const cur = rows?.[0]?.accent || null;
      setSavedAccent(cur);
      setAccent(cur || DEFAULT_ACCENT);
    }).catch(() => {});
  }, []);

  // Restore the persisted accent if the admin leaves with an unsaved preview.
  const savedRef = useRef(null);
  useEffect(() => { savedRef.current = savedAccent; }, [savedAccent]);
  useEffect(() => () => {
    if (savedRef.current) applyAccent(savedRef.current); else clearAccent();
  }, []);

  const previewAccent = (hex) => { setAccent(hex); applyAccent(hex); };
  const saveAccent = async () => {
    setAccentBusy(true);
    try {
      await callAdmin({ action: 'set-accent', accent });
      setAccentCached(accent);
      setSavedAccent(accent);
    } catch (e) { alert(e.message || 'Could not save color'); }
    finally { setAccentBusy(false); }
  };
  const resetAccent = async () => {
    setAccentBusy(true);
    try {
      await callAdmin({ action: 'set-accent', accent: null });
      clearAccent();
      setAccentCached(null);
      setSavedAccent(null);
      setAccent(DEFAULT_ACCENT);
    } catch (e) { alert(e.message || 'Could not reset color'); }
    finally { setAccentBusy(false); }
  };
  const accentDirty = (savedAccent || DEFAULT_ACCENT).toLowerCase() !== accent.toLowerCase();

  return (
    <section>
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
        <Palette className="w-3.5 h-3.5 text-amber-500" /> Appearance
      </h2>
      <div className={cn(CARD, 'p-4')}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Brand accent color, applied to every user across the app.</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="relative w-14 h-14 rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden cursor-pointer shrink-0" style={{ background: accent }} title="Pick a custom color">
            <input type="color" value={accent} onChange={(e) => previewAccent(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200 uppercase">{accent}</span>
            <span className="text-[11px] text-zinc-500">
              {savedAccent ? 'Custom accent saved' : 'Using default signal-orange'}
              {accentDirty && <span className="text-amber-600 dark:text-amber-400"> · unsaved preview</span>}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {ACCENT_PRESETS.map((p) => (
              <button key={p.hex} onClick={() => previewAccent(p.hex)} title={p.name}
                className={cn('w-7 h-7 rounded-md border transition', accent.toLowerCase() === p.hex.toLowerCase() ? 'border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-100 dark:ring-zinc-100/30' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500')}
                style={{ background: p.hex }} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500 text-zinc-950 font-medium">Primary button</span>
          <span className="text-xs px-2.5 py-1 rounded-md border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">Accent tag</span>
          <span className="text-amber-500 text-sm font-semibold">Accent text</span>
          <span className="w-5 h-5 rounded-full bg-amber-500 inline-block" />
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={resetAccent} disabled={accentBusy || (!savedAccent && !accentDirty)}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-40">Reset to default</button>
          {accentDirty && <button onClick={() => previewAccent(savedAccent || DEFAULT_ACCENT)} disabled={accentBusy}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-40">Discard</button>}
          <button onClick={saveAccent} disabled={accentBusy || !accentDirty}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-sm font-medium">
            {accentBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save color
          </button>
        </div>
      </div>
    </section>
  );
}
