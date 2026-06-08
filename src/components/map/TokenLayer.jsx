import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

// Reusable token layer: a map image with draggable tokens positioned in
// percentage coordinates (resolution-independent). Controlled — token positions
// come from props; dragging emits onMoveLive (throttled, every move) and
// onMoveEnd (on drop). Works over any image; an optional square grid can snap.
//
// token: { id, label, x, y (0-100), color (hex), image_url|null, hp?, maxHp? }
export default function TokenLayer({
  imageUrl, gridCols = 0, tokens = [], canMove = false, locked = false,
  selectedId = null, onSelect, onMoveLive, onMoveEnd, className,
}) {
  const wrapRef = useRef(null);
  const drag = useRef(null); // { id, lastSent }

  const snap = (v) => {
    if (!gridCols) return Math.max(0, Math.min(100, v));
    const cell = 100 / gridCols;
    return Math.max(0, Math.min(100, (Math.floor(v / cell) + 0.5) * cell));
  };

  const pointToPct = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    return {
      x: snap(((e.clientX - r.left) / r.width) * 100),
      y: snap(((e.clientY - r.top) / r.height) * 100),
    };
  };

  const onDown = (e, t) => {
    if (!canMove || locked) { onSelect?.(t.id); return; }
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(t.id);
    drag.current = { id: t.id, lastSent: 0 };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const { x, y } = pointToPct(e);
    const now = e.timeStamp || Date.now();
    if (now - d.lastSent > 33) { d.lastSent = now; onMoveLive?.(d.id, x, y); }
    else { d.pending = { x, y }; }
  };
  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    window.removeEventListener('pointermove', onMove);
    if (!d) return;
    const { x, y } = pointToPct(e);
    onMoveEnd?.(d.id, x, y);
  };

  const gridStyle = gridCols > 0 ? {
    backgroundImage:
      'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px),' +
      'linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
    backgroundSize: `${100 / gridCols}% ${100 / gridCols}%`,
  } : null;

  return (
    <div ref={wrapRef} className={cn('relative select-none w-full', className)}>
      {imageUrl
        ? <img src={imageUrl} alt="" draggable={false} className="block w-full h-auto rounded-md" />
        : <div className="w-full aspect-video rounded-md bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-sm text-zinc-500">No map image</div>}

      {gridStyle && <div className="absolute inset-0 pointer-events-none rounded-md" style={gridStyle} />}

      {tokens.map((t) => {
        const color = t.color || '#f59e0b';
        const selected = selectedId === t.id;
        return (
          <div
            key={t.id}
            onPointerDown={(e) => onDown(e, t)}
            className={cn('absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center',
              canMove && !locked ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer')}
            style={{ left: `${t.x}%`, top: `${t.y}%`, touchAction: 'none', zIndex: selected ? 20 : 10 }}
          >
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-[11px] text-white shadow-md"
              style={{ border: `2px solid ${color}`, background: t.image_url ? '#000' : color, boxShadow: selected ? `0 0 0 2px ${color}` : undefined }}
            >
              {t.image_url
                ? <img src={t.image_url} alt="" draggable={false} className="w-full h-full object-cover" />
                : <span>{(t.label || '?').slice(0, 2).toUpperCase()}</span>}
            </div>
            {t.maxHp != null && (
              <div className="mt-0.5 w-8 sm:w-9 h-1 rounded-full bg-black/50 overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${Math.max(0, Math.min(100, ((t.hp ?? t.maxHp) / t.maxHp) * 100))}%` }} />
              </div>
            )}
            {t.label && (
              <span className="mt-0.5 px-1 rounded text-[9px] leading-tight text-white bg-black/60 max-w-[72px] truncate">{t.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
