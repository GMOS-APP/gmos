import React, { useRef } from 'react';
import { useWindowManager } from '@/lib/WindowManager';
import Window from './Window';
import { LayoutGrid } from 'lucide-react';

// Subtle dotted "desktop" backdrop, light/dark aware.
const WALLPAPER = {
  backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};

export default function Desktop({ dashboardUrl }) {
  const wm = useWindowManager();
  const ref = useRef(null);
  const visible = wm.windows.filter((w) => !w.minimized);
  const hasWindows = wm.windows.length > 0;

  return (
    <div ref={ref} className="relative flex-1 min-h-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      <div className="absolute inset-0 text-zinc-300 dark:text-zinc-800/70 pointer-events-none" style={WALLPAPER} />

      {visible.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <LayoutGrid className="w-8 h-8 text-zinc-400 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500 mb-1">
            {hasWindows ? 'All windows minimized' : 'No windows open'}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-4">
            {hasWindows ? 'Pick a window from the taskbar below.' : 'Open something from the dock to get started.'}
          </p>
          {!hasWindows && (
            <button onClick={() => wm.openWindow(dashboardUrl)}
              className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium">
              Open Dashboard
            </button>
          )}
        </div>
      )}

      {visible.map((w) => (
        <Window key={w.id} win={w} containerRef={ref} />
      ))}
    </div>
  );
}
