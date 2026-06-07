import React, { useRef } from 'react';
import { X, Minus, Square, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWindowManager, titleOf } from '@/lib/WindowManager';
import WindowContent from './WindowContent';

const MIN_W = 360;
const MIN_H = 240;

export default function Window({ win, containerRef }) {
  const wm = useWindowManager();
  const dragState = useRef(null);
  const focused = wm.focusedId === win.id;
  const mobile = wm.isMobile;
  const maximized = win.maximized || mobile;

  const bounds = () => {
    const el = containerRef?.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: window.innerWidth, h: window.innerHeight };
  };

  const onDragStart = (e) => {
    if (maximized) return;
    e.preventDefault();
    wm.focusWindow(win.id);
    dragState.current = { mode: 'move', startX: e.clientX, startY: e.clientY, x: win.x, y: win.y };
    attach();
  };
  const onResizeStart = (e) => {
    if (maximized) return;
    e.preventDefault();
    e.stopPropagation();
    wm.focusWindow(win.id);
    dragState.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, w: win.w, h: win.h };
    attach();
  };

  const onMove = (e) => {
    const s = dragState.current;
    if (!s) return;
    const b = bounds();
    if (s.mode === 'move') {
      const nx = Math.min(Math.max(0, s.x + (e.clientX - s.startX)), Math.max(0, b.w - 80));
      const ny = Math.min(Math.max(0, s.y + (e.clientY - s.startY)), Math.max(0, b.h - 40));
      wm.setRect(win.id, { x: nx, y: ny });
    } else {
      const nw = Math.min(Math.max(MIN_W, s.w + (e.clientX - s.startX)), b.w - win.x);
      const nh = Math.min(Math.max(MIN_H, s.h + (e.clientY - s.startY)), b.h - win.y);
      wm.setRect(win.id, { w: nw, h: nh });
    }
  };
  const onUp = () => { dragState.current = null; detach(); };
  const attach = () => {
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };
  const detach = () => { window.removeEventListener('pointermove', onMove); };

  const style = maximized
    ? { left: 0, top: 0, right: 0, bottom: 0, zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  const Ctrl = ({ onClick, title, icon: Icon, hover }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerDown={(e) => e.stopPropagation()}
      title={title}
      aria-label={title}
      className={cn(
        'w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors',
        'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
        hover,
      )}
    >
      <Icon className="w-2.5 h-2.5" strokeWidth={2.75} />
    </button>
  );

  return (
    <div
      className={cn(
        'absolute flex flex-col overflow-hidden rounded-lg border bg-white dark:bg-zinc-950',
        'shadow-xl shadow-black/20 dark:shadow-black/50',
        focused ? 'border-amber-500/60 dark:border-amber-500/50' : 'border-zinc-300 dark:border-zinc-800',
        maximized && 'rounded-none',
      )}
      style={style}
      onPointerDown={() => wm.focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        onPointerDown={onDragStart}
        onDoubleClick={() => !mobile && wm.toggleMaximize(win.id)}
        className={cn(
          'flex items-center gap-2 px-2.5 h-9 shrink-0 select-none border-b',
          maximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
          focused
            ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/60',
        )}
      >
        <div className="flex items-center gap-1.5">
          <Ctrl onClick={() => wm.closeWindow(win.id)} title="Close" icon={X}
            hover="hover:bg-red-500 hover:text-white" />
          {!mobile && (
            <Ctrl onClick={() => wm.minimizeWindow(win.id)} title="Minimize" icon={Minus}
              hover="hover:bg-amber-500 hover:text-zinc-950" />
          )}
          {!mobile && (
            <Ctrl onClick={() => wm.toggleMaximize(win.id)} title={maximized ? 'Restore' : 'Maximize'}
              icon={maximized ? Copy : Square}
              hover="hover:bg-zinc-300 dark:hover:bg-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100" />
          )}
        </div>
        <span className={cn('text-xs font-semibold uppercase tracking-widest truncate',
          focused ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600')}>
          {titleOf(win.url)}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-zinc-950">
        <WindowContent id={win.id} url={win.url} />
      </div>

      {/* Resize handle */}
      {!maximized && (
        <div
          onPointerDown={onResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-zinc-400 dark:border-zinc-600" />
        </div>
      )}
    </div>
  );
}
