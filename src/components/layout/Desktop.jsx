import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager } from '@/lib/WindowManager';
import Window from './Window';
import { LayoutGrid, Check } from 'lucide-react';

const STORAGE = 'gmos_wallpaper';

// Each wallpaper is a stack of absolutely-positioned layers, light/dark aware.
const WALLPAPERS = {
  graphite: {
    label: 'Graphite',
    layers: [
      <div key="b" className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950" />,
      <div key="g" className="absolute inset-0" style={{ background: 'radial-gradient(55% 45% at 78% 12%, rgba(255,255,255,0.07), transparent 70%)' }} />,
    ],
  },
  dots: {
    label: 'Dots',
    layers: [
      <div key="b" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900" />,
      <div key="p" className="absolute inset-0 text-zinc-300 dark:text-zinc-800/70" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '22px 22px' }} />,
    ],
  },
  grid: {
    label: 'Grid',
    layers: [
      <div key="b" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900" />,
      <div key="p" className="absolute inset-0 text-zinc-300/70 dark:text-zinc-800/60" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '28px 28px' }} />,
    ],
  },
  signal: {
    label: 'Signal',
    layers: [
      <div key="b" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-950" />,
      <div key="g1" className="absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 72% 18%, rgba(255,77,28,0.18), transparent 70%)' }} />,
      <div key="g2" className="absolute inset-0" style={{ background: 'radial-gradient(55% 55% at 18% 92%, rgba(255,77,28,0.10), transparent 70%)' }} />,
    ],
  },
  void: {
    label: 'Void',
    layers: [<div key="b" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-950" />],
  },
};
const DEFAULT_WALLPAPER = 'graphite';
const WALLPAPER_KEYS = Object.keys(WALLPAPERS);

export default function Desktop({ dashboardUrl }) {
  const wm = useWindowManager();
  const ref = useRef(null);
  const [wallpaper, setWallpaper] = useState(() => {
    try { return localStorage.getItem(STORAGE) || DEFAULT_WALLPAPER; } catch { return DEFAULT_WALLPAPER; }
  });
  const [menu, setMenu] = useState(null); // { x, y } | null

  const visible = wm.windows.filter((w) => !w.minimized);
  const hasWindows = wm.windows.length > 0;
  const wp = WALLPAPERS[wallpaper] || WALLPAPERS[DEFAULT_WALLPAPER];

  const pickWallpaper = (key) => {
    setWallpaper(key);
    try { localStorage.setItem(STORAGE, key); } catch { /* ignore */ }
    setMenu(null);
  };

  // Right-click the empty desktop → wallpaper menu (positioned within bounds).
  const onContextMenu = (e) => {
    if (e.target !== e.currentTarget && !e.target.dataset?.wallpaperLayer) return;
    e.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setMenu({ x: Math.min(x, (rect?.width || 9999) - 180), y: Math.min(y, (rect?.height || 9999) - 220) });
  };

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    const onKey = (e) => { if (e.key === 'Escape') setMenu(null); };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', onKey); };
  }, [menu]);

  return (
    <div ref={ref} onContextMenu={onContextMenu} className="relative flex-1 min-h-0 overflow-hidden">
      {/* Wallpaper layers (transparent to right-click via data attr) */}
      <div data-wallpaper-layer className="absolute inset-0 pointer-events-none">{wp.layers}</div>

      {visible.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <LayoutGrid className="w-8 h-8 text-zinc-400 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500 mb-1">
            {hasWindows ? 'All windows minimized' : 'No windows open'}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mb-4">
            {hasWindows ? 'Pick a window from the taskbar below.' : 'Open something from the dock to get started.'}
          </p>
          {!hasWindows && (
            <button onClick={() => wm.openWindow(dashboardUrl)}
              className="pointer-events-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium">
              Open Dashboard
            </button>
          )}
        </div>
      )}

      {visible.map((w) => (
        <Window key={w.id} win={w} containerRef={ref} />
      ))}

      {/* Wallpaper context menu */}
      {menu && (
        <div
          className="absolute z-[60] w-44 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Wallpaper</p>
          {WALLPAPER_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => pickWallpaper(key)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="w-5 h-5 rounded border border-zinc-300 dark:border-zinc-700 overflow-hidden relative flex-shrink-0">
                <span className="absolute inset-0 scale-[3] origin-top-left">{WALLPAPERS[key].layers}</span>
              </span>
              <span className="flex-1 text-left">{WALLPAPERS[key].label}</span>
              {wallpaper === key && <Check className="w-3.5 h-3.5 text-amber-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
