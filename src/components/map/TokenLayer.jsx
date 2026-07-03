import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Reusable token layer: a map image with draggable tokens positioned in
// percentage coordinates (resolution-independent). Controlled — token positions
// come from props; dragging emits onMoveLive (throttled, every move) and
// onMoveEnd (on drop). Works over any image; an optional square grid can snap.
//
// token: { id, label, x, y (0-100), color (hex), image_url|null, hp?, maxHp?,
//          size? ('s'|'m'|'l'|'h'), conditions? (emoji[]) }
//
// VTT extras (all optional):
//   tool          'select' | 'fog' | 'ruler' — fog/ruler capture pointer input
//   fog           { enabled, revealed: number[] } on the virtual FOG_COLS grid
//   fogMode       'gm' (dim overlay) | 'player' (opaque black)
//   onFogPaint    (cells:number[], reveal:boolean) => void  — batched on drop
//   pings         [{ id, x, y, color }] — rendered as ripples (parent expires)
//   onPing        (x, y) => void — double-click/tap on the board
//   activeTokenId — pulsing ring (whose turn it is)

// Fog lives on a fixed virtual grid so toggling the display grid never
// invalidates revealed cells. Square cells, FOG_COLS across.
export const FOG_COLS = 24;

const SIZE_PX = { s: 22, m: 34, l: 52, h: 76 };

export default function TokenLayer({
  imageUrl, gridCols = 0, tokens = [], canMove = false, locked = false,
  selectedId = null, onSelect, onMoveLive, onMoveEnd, className,
  tool = 'select', fog = null, fogMode = 'gm', onFogPaint,
  pings = [], onPing, activeTokenId = null,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drag = useRef(null); // { id, lastSent }
  const fogDrag = useRef(null); // { reveal, cells:Set }
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ruler, setRuler] = useState(null); // { x1, y1, x2, y2 } in %

  // Track the rendered size so the grid can use SQUARE pixel cells (a %-based
  // grid is rectangular on a non-square image).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cellPx = gridCols > 0 && size.w ? size.w / gridCols : 0;
  const cellPctX = gridCols > 0 ? 100 / gridCols : 0;
  const cellPctY = cellPx && size.h ? (cellPx / size.h) * 100 : cellPctX; // square cell as % of height

  const snap = (v, axis) => {
    if (!gridCols) return Math.max(0, Math.min(100, v));
    const cell = axis === 'y' ? cellPctY : cellPctX;
    if (!cell) return Math.max(0, Math.min(100, v));
    return Math.max(0, Math.min(100, (Math.floor(v / cell) + 0.5) * cell));
  };

  const rawPct = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const pointToPct = (e) => {
    const p = rawPct(e);
    return { x: snap(p.x, 'x'), y: snap(p.y, 'y') };
  };

  // ── Fog geometry (virtual FOG_COLS grid, square cells) ─────────────────────
  const fogCellPx = size.w ? size.w / FOG_COLS : 0;
  const fogRows = fogCellPx && size.h ? Math.ceil(size.h / fogCellPx) : 0;
  const fogCellAt = (e) => {
    if (!fogCellPx) return null;
    const r = wrapRef.current.getBoundingClientRect();
    const col = Math.floor((e.clientX - r.left) / fogCellPx);
    const row = Math.floor((e.clientY - r.top) / fogCellPx);
    if (col < 0 || col >= FOG_COLS || row < 0 || row >= fogRows) return null;
    return row * FOG_COLS + col;
  };

  // Paint the fog canvas whenever fog state or the rendered size changes.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !fog?.enabled || !size.w || !size.h) return;
    cv.width = size.w;
    cv.height = size.h;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, size.w, size.h);
    ctx.fillStyle = fogMode === 'player' ? '#09090b' : 'rgba(9,9,11,0.55)';
    const revealed = new Set(fog.revealed || []);
    for (let row = 0; row < fogRows; row++) {
      for (let col = 0; col < FOG_COLS; col++) {
        if (!revealed.has(row * FOG_COLS + col)) {
          // +1px bleed hides hairline seams between cells
          ctx.fillRect(col * fogCellPx, row * fogCellPx, fogCellPx + 1, fogCellPx + 1);
        }
      }
    }
  }, [fog, fogMode, size.w, size.h, fogRows, fogCellPx]);

  // ── Board-level pointer handling (fog painting, ruler) ─────────────────────
  const onBoardDown = (e) => {
    if (tool === 'fog' && fog?.enabled && onFogPaint) {
      e.preventDefault();
      const cell = fogCellAt(e);
      // alt/right-drag hides; normal drag reveals
      fogDrag.current = { reveal: !(e.altKey || e.button === 2), cells: new Set(cell != null ? [cell] : []), last: cell };
      window.addEventListener('pointermove', onFogMove);
      window.addEventListener('pointerup', onFogUp, { once: true });
    } else if (tool === 'ruler') {
      e.preventDefault();
      const p = rawPct(e);
      setRuler({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
      window.addEventListener('pointermove', onRulerMove);
      window.addEventListener('pointerup', onRulerUp, { once: true });
    }
  };
  const onFogMove = (e) => {
    const d = fogDrag.current;
    if (!d) return;
    const cell = fogCellAt(e);
    if (cell == null) return;
    // Interpolate between the previous sample and this one so a fast swipe
    // paints a contiguous strip instead of scattered cells.
    if (d.last != null && d.last !== cell) {
      let c0 = d.last % FOG_COLS, r0 = Math.floor(d.last / FOG_COLS);
      const c1 = cell % FOG_COLS, r1 = Math.floor(cell / FOG_COLS);
      const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
      for (let i = 1; i <= steps; i++) {
        const c = Math.round(c0 + ((c1 - c0) * i) / steps);
        const r = Math.round(r0 + ((r1 - r0) * i) / steps);
        d.cells.add(r * FOG_COLS + c);
      }
    }
    d.cells.add(cell);
    d.last = cell;
  };
  const onFogUp = () => {
    window.removeEventListener('pointermove', onFogMove);
    const d = fogDrag.current;
    fogDrag.current = null;
    if (d && d.cells.size) onFogPaint([...d.cells], d.reveal);
  };
  const onRulerMove = (e) => {
    if (!wrapRef.current) return;
    const p = rawPct(e);
    setRuler((r) => (r ? { ...r, x2: p.x, y2: p.y } : r));
  };
  const onRulerUp = () => {
    window.removeEventListener('pointermove', onRulerMove);
    setRuler(null);
  };

  // ── Token movement ──────────────────────────────────────────────────────────
  const onDown = (e, t) => {
    if (tool !== 'select') return; // fog/ruler own the pointer
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
      'linear-gradient(to right, rgba(0,0,0,0.45) 1px, transparent 1px),' +
      'linear-gradient(to bottom, rgba(0,0,0,0.45) 1px, transparent 1px)',
    backgroundSize: cellPx ? `${cellPx}px ${cellPx}px` : `${100 / gridCols}% ${100 / gridCols}%`,
  } : null;

  // Ruler distance: measured in display-grid squares (virtual fog grid when the
  // display grid is off), 5 ft per square.
  const rulerLabel = (() => {
    if (!ruler || !size.w || !size.h) return null;
    const unitPx = cellPx || fogCellPx;
    if (!unitPx) return null;
    const dxPx = ((ruler.x2 - ruler.x1) / 100) * size.w;
    const dyPx = ((ruler.y2 - ruler.y1) / 100) * size.h;
    const squares = Math.sqrt(dxPx * dxPx + dyPx * dyPx) / unitPx;
    return `${squares.toFixed(1)} sq · ${Math.round(squares * 5)} ft`;
  })();

  return (
    <div
      ref={wrapRef}
      onPointerDown={onBoardDown}
      onDoubleClick={onPing ? (e) => { const p = rawPct(e); onPing(p.x, p.y); } : undefined}
      onContextMenu={tool === 'fog' ? (e) => e.preventDefault() : undefined}
      className={cn('relative select-none w-full', className,
        tool === 'fog' && 'cursor-cell', tool === 'ruler' && 'cursor-crosshair')}
      style={{ touchAction: tool !== 'select' ? 'none' : undefined }}
    >
      {imageUrl
        ? <img src={imageUrl} alt="" draggable={false} className="block w-full h-auto rounded-md" />
        : <div className="w-full aspect-video rounded-md bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-sm text-zinc-500">No map image</div>}

      {gridStyle && <div className="absolute inset-0 pointer-events-none rounded-md" style={gridStyle} />}

      {/* Fog of war */}
      {fog?.enabled && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-md" style={{ zIndex: 5 }} />
      )}

      {tokens.map((t) => {
        // Players don't see tokens hidden under fog (their center cell is unrevealed).
        if (fogMode === 'player' && fog?.enabled && fogCellPx && size.h) {
          const col = Math.floor(((t.x / 100) * size.w) / fogCellPx);
          const row = Math.floor(((t.y / 100) * size.h) / fogCellPx);
          if (!(fog.revealed || []).includes(row * FOG_COLS + col)) return null;
        }
        const color = t.color || '#f59e0b';
        const selected = selectedId === t.id;
        const isActive = activeTokenId === t.id;
        const px = SIZE_PX[t.size] || SIZE_PX.m;
        return (
          <div
            key={t.id}
            onPointerDown={(e) => onDown(e, t)}
            className={cn('absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center',
              tool === 'select' && canMove && !locked ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer')}
            style={{ left: `${t.x}%`, top: `${t.y}%`, touchAction: 'none', zIndex: selected ? 20 : 10 }}
          >
            <div className="relative">
              {isActive && (
                <span
                  className="absolute -inset-1.5 rounded-full animate-pulse pointer-events-none"
                  style={{ border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}` }}
                />
              )}
              <div
                className="rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-md"
                style={{
                  width: px, height: px, fontSize: Math.max(9, Math.round(px * 0.32)),
                  border: `2px solid ${color}`, background: t.image_url ? '#000' : color,
                  boxShadow: selected ? `0 0 0 2px ${color}` : undefined,
                }}
              >
                {t.image_url
                  ? <img src={t.image_url} alt="" draggable={false} className="w-full h-full object-cover" />
                  : <span>{(t.label || '?').slice(0, 2).toUpperCase()}</span>}
              </div>
              {Array.isArray(t.conditions) && t.conditions.length > 0 && (
                <div className="absolute -top-1.5 -right-1.5 flex flex-wrap justify-end max-w-[40px] leading-none pointer-events-none" style={{ fontSize: 10 }}>
                  {t.conditions.slice(0, 4).map((c) => <span key={c}>{c}</span>)}
                </div>
              )}
            </div>
            {t.maxHp != null && (
              <div className="mt-0.5 h-1 rounded-full bg-black/50 overflow-hidden" style={{ width: px }}>
                <div className="h-full bg-red-500" style={{ width: `${Math.max(0, Math.min(100, ((t.hp ?? t.maxHp) / t.maxHp) * 100))}%` }} />
              </div>
            )}
            {t.label && (
              <span className="mt-0.5 px-1 rounded text-[9px] leading-tight text-white bg-black/60 max-w-[72px] truncate">{t.label}</span>
            )}
          </div>
        );
      })}

      {/* Pings — expanding ripples, parent expires them */}
      {pings.map((p) => (
        <span key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: 30 }}>
          <span className="absolute -translate-x-1/2 -translate-y-1/2 block w-10 h-10 rounded-full animate-ping" style={{ background: p.color || '#f59e0b', opacity: 0.6 }} />
          <span className="absolute -translate-x-1/2 -translate-y-1/2 block w-3 h-3 rounded-full" style={{ background: p.color || '#f59e0b' }} />
        </span>
      ))}

      {/* Ruler */}
      {ruler && size.w > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 40 }} viewBox={`0 0 ${size.w} ${size.h}`}>
          <line
            x1={(ruler.x1 / 100) * size.w} y1={(ruler.y1 / 100) * size.h}
            x2={(ruler.x2 / 100) * size.w} y2={(ruler.y2 / 100) * size.h}
            stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 5" strokeLinecap="round" />
        </svg>
      )}
      {ruler && rulerLabel && (
        <span
          className="absolute -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[11px] font-mono pointer-events-none whitespace-nowrap"
          style={{ left: `${(ruler.x1 + ruler.x2) / 2}%`, top: `${(ruler.y1 + ruler.y2) / 2}%`, zIndex: 41 }}
        >
          {rulerLabel}
        </span>
      )}
    </div>
  );
}
