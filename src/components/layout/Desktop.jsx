import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager } from '@/lib/WindowManager';
import { UploadFile } from '@/api/entities';
import Window from './Window';
import { LayoutGrid, Check, Upload, Loader2, Link2 } from 'lucide-react';

const STORAGE = 'gmos_wallpaper';
const URL_STORAGE = 'gmos_wallpaper_url';

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
  const fileRef = useRef(null);
  const [wallpaper, setWallpaper] = useState(() => {
    try { return localStorage.getItem(STORAGE) || DEFAULT_WALLPAPER; } catch { return DEFAULT_WALLPAPER; }
  });
  const [customUrl, setCustomUrl] = useState(() => {
    try { return localStorage.getItem(URL_STORAGE) || null; } catch { return null; }
  });
  const [uploading, setUploading] = useState(false);
  const [menu, setMenu] = useState(null); // { x, y } | null
  const [linkMode, setLinkMode] = useState(false);
  const [linkVal, setLinkVal] = useState('');

  const visible = wm.windows.filter((w) => !w.minimized);
  const hasWindows = wm.windows.length > 0;

  // A custom uploaded image, or one of the built-in presets.
  const customLayers = [
    <div key="img" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${customUrl}")` }} />,
    <div key="ov" className="absolute inset-0 bg-black/10 dark:bg-black/40" />,
  ];
  const wp = (wallpaper === 'custom' && customUrl)
    ? { label: 'Custom', layers: customLayers }
    : (WALLPAPERS[wallpaper] || WALLPAPERS[DEFAULT_WALLPAPER]);

  const pickWallpaper = (key) => {
    setWallpaper(key);
    try { localStorage.setItem(STORAGE, key); } catch { /* ignore */ }
    setMenu(null);
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setCustomUrl(file_url);
      try { localStorage.setItem(URL_STORAGE, file_url); } catch { /* ignore */ }
      pickWallpaper('custom');
    } catch (err) {
      alert(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const applyLink = () => {
    const u = linkVal.trim();
    if (!/^https?:\/\//i.test(u)) { alert('Enter a valid image URL (starts with http).'); return; }
    setCustomUrl(u);
    try { localStorage.setItem(URL_STORAGE, u); } catch { /* ignore */ }
    pickWallpaper('custom');
  };

  // Right-click the empty desktop → wallpaper menu (positioned within bounds).
  const onContextMenu = (e) => {
    if (e.target !== e.currentTarget && !e.target.dataset?.wallpaperLayer) return;
    e.preventDefault();
    setLinkMode(false); setLinkVal('');
    const rect = ref.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    setMenu({ x: Math.min(x, (rect?.width || 9999) - 240), y: Math.min(y, (rect?.height || 9999) - 280) });
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
    <div ref={ref} onContextMenu={onContextMenu} className="relative isolate flex-1 min-h-0 overflow-hidden">
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
          className="absolute z-[9999] w-56 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl py-1"
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

          <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />

          {customUrl && (
            <button
              onClick={() => pickWallpaper('custom')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="w-5 h-5 rounded border border-zinc-300 dark:border-zinc-700 bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url("${customUrl}")` }} />
              <span className="flex-1 text-left">Custom image</span>
              {wallpaper === 'custom' && <Check className="w-3.5 h-3.5 text-amber-500" />}
            </button>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-zinc-500">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            </span>
            <span className="flex-1 text-left">{uploading ? 'Uploading…' : 'Upload image…'}</span>
          </button>

          {!linkMode ? (
            <button
              onClick={() => setLinkMode(true)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-zinc-500"><Link2 className="w-3.5 h-3.5" /></span>
              <span className="flex-1 text-left">Link to image…</span>
            </button>
          ) : (
            <div className="px-2 py-1.5 flex gap-1">
              <input
                autoFocus
                value={linkVal}
                onChange={(e) => setLinkVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); }}
                placeholder="Paste image URL…"
                className="flex-1 min-w-0 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-2 py-1 focus:outline-none focus:border-amber-500/50"
              />
              <button onClick={applyLink} className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-medium">Set</button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </div>
      )}
    </div>
  );
}
