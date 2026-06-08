import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Local, per-client zoom + pan around its children (no sync). Applies a CSS
// transform to an inner layer; the visible box keeps the children's natural
// (unzoomed) size and clips the rest. Token-drag math inside still works because
// TokenLayer measures its own — now transformed — bounding rect.
//  - wheel / pinch / +,- buttons to zoom (toward cursor / pinch midpoint)
//  - drag the background to pan (tokens stopPropagation, so they win on a token)
export default function ZoomPan({ children, className, min = 1, max = 6 }) {
  const vp = useRef(null);
  const [tf, setTf] = useState({ z: 1, x: 0, y: 0 });
  const tfRef = useRef(tf);
  tfRef.current = tf;
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const pan = useRef(null);

  const rect = () => vp.current.getBoundingClientRect();

  const apply = (next) => {
    const r = rect();
    next.x = clamp(next.x, r.width * (1 - next.z), 0);
    next.y = clamp(next.y, r.height * (1 - next.z), 0);
    setTf(next);
  };
  const zoomAt = (cx, cy, factor) => {
    const prev = tfRef.current;
    const nz = clamp(prev.z * factor, min, max);
    const k = nz / prev.z;
    apply({ z: nz, x: cx - (cx - prev.x) * k, y: cy - (cy - prev.y) * k });
  };

  // Non-passive wheel so preventDefault stops the page from scrolling.
  useEffect(() => {
    const el = vp.current;
    if (!el) return undefined;
    const onWheel = (e) => { e.preventDefault(); const r = rect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, e);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: tfRef.current.z };
      pan.current = null;
    } else {
      pan.current = { sx: e.clientX, sy: e.clientY, ox: tfRef.current.x, oy: tfRef.current.y };
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, e);
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const r = rect();
      const mx = (a.clientX + b.clientX) / 2 - r.left;
      const my = (a.clientY + b.clientY) / 2 - r.top;
      const prev = tfRef.current;
      const nz = clamp(pinch.current.z * (d / pinch.current.d), min, max);
      const k = nz / prev.z;
      apply({ z: nz, x: mx - (mx - prev.x) * k, y: my - (my - prev.y) * k });
    } else if (pan.current && pointers.current.size === 1) {
      apply({ z: tfRef.current.z, x: pan.current.ox + (e.clientX - pan.current.sx), y: pan.current.oy + (e.clientY - pan.current.sy) });
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) pan.current = null;
  };

  const btn = (f) => { const r = rect(); zoomAt(r.width / 2, r.height / 2, f); };
  const reset = () => setTf({ z: 1, x: 0, y: 0 });

  const ctrl = 'w-7 h-7 flex items-center justify-center rounded-md bg-zinc-900/80 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 backdrop-blur';

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <div
        ref={vp}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none', cursor: tf.z > 1 ? (pan.current ? 'grabbing' : 'grab') : 'default' }}
      >
        <div style={{ transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.z})`, transformOrigin: '0 0' }}>
          {children}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex flex-col gap-1 select-none">
        <button type="button" onClick={() => btn(1.3)} title="Zoom in" className={ctrl}><ZoomIn className="w-4 h-4" /></button>
        <button type="button" onClick={() => btn(1 / 1.3)} title="Zoom out" className={ctrl}><ZoomOut className="w-4 h-4" /></button>
        <button type="button" onClick={reset} title="Reset view" className={ctrl}><Maximize className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
