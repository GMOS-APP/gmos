import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Pencil, Check, Plus, X, GripVertical, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/useMediaQuery';

const Grid = WidthProvider(GridLayout);
const COLS = 12;
// Small row height so a widget's height can fit its content closely (no scroll).
// Each widget's row-span is measured from its rendered height, never fixed.
const ROW_H = 8;
const MARGIN = 12;
const VERSION = 2; // bump when the layout math changes, to invalidate old saves
const KEY = (cid) => `gmos_dash_${cid}`;
// px → row-span that fully contains it (ceil so content is never clipped/scrolled).
const rowsFor = (px) => Math.max(2, Math.ceil((px + MARGIN) / (ROW_H + MARGIN)));
// Rough initial span before the first measurement, derived from the registry's
// (64px-based) default h, so first paint is in the right ballpark.
const initRows = (h) => Math.max(4, Math.round((h * 64) / (ROW_H + MARGIN)));

function load(cid) {
  try {
    const raw = localStorage.getItem(KEY(cid));
    if (raw) { const s = JSON.parse(raw); if (s && s.v === VERSION) return s; }
  } catch { /* ignore */ }
  return null;
}
function save(cid, state) {
  try { localStorage.setItem(KEY(cid), JSON.stringify(state)); } catch { /* ignore */ }
}

// Build the initial { active, layout } from widget defaults the first time (or
// after a reset), honoring each widget's defaultActive + availability.
function buildDefault(widgets) {
  const active = widgets.filter((w) => w.defaultActive && w.available !== false).map((w) => w.id);
  const layout = widgets
    .filter((w) => active.includes(w.id))
    .map((w) => ({ i: w.id, x: w.x, y: w.y * 4, w: w.w, h: initRows(w.h), minW: w.minW || 2, minH: 2 }));
  return { v: VERSION, active, layout };
}

// Drop a newly-added widget at the bottom of the current layout.
function placeAtBottom(layout, w) {
  const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  return { i: w.id, x: 0, y: maxY, w: w.w, h: initRows(w.h), minW: w.minW || 2, minH: 2 };
}

function AddMenu({ widgets, active, onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const addable = widgets.filter((w) => !active.includes(w.id) && w.available !== false);
  const core = addable.filter((w) => w.group !== 'tool');
  const tools = addable.filter((w) => w.group === 'tool');

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <Plus className="w-3.5 h-3.5" /> Add widget
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 max-h-80 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg z-30 py-1">
          {addable.length === 0 && (
            <p className="px-3 py-2 text-xs text-zinc-500">Everything is already on your dashboard.</p>
          )}
          {core.length > 0 && <p className="px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Sections</p>}
          {core.map((w) => <AddRow key={w.id} w={w} onAdd={() => { onAdd(w.id); setOpen(false); }} />)}
          {tools.length > 0 && <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Tools</p>}
          {tools.map((w) => <AddRow key={w.id} w={w} onAdd={() => { onAdd(w.id); setOpen(false); }} />)}
        </div>
      )}
    </div>
  );
}
function AddRow({ w, onAdd }) {
  return (
    <button onClick={onAdd} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
      {w.Icon && <w.Icon className="w-4 h-4 text-amber-500 flex-shrink-0" />}
      <span className="truncate">{w.title}</span>
    </button>
  );
}

// One grid cell. Measures its own natural content height and reports the needed
// row-span up, so the grid grows the cell to fit — widgets never scroll.
function WidgetItem({ w, editing, onRemove, onMeasure }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const report = () => onMeasure(w.id, rowsFor(el.offsetHeight));
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w.id, editing, onMeasure]);

  return (
    <div className="h-full overflow-hidden">
      {/* This inner element is NOT height-constrained, so its offsetHeight is the
          true content height we measure. */}
      <div ref={ref}>
        {editing ? (
          <div className="rounded-xl ring-2 ring-amber-400/60 dark:ring-amber-500/40 bg-white dark:bg-zinc-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-2 py-1 bg-amber-50 dark:bg-amber-500/10 cursor-move">
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 truncate">
                <GripVertical className="w-3.5 h-3.5 flex-shrink-0" /> {w.title}
              </span>
              {w.removable !== false && (
                <button onClick={() => onRemove(w.id)}
                  className="dash-no-drag flex-shrink-0 p-0.5 rounded text-amber-700/70 dark:text-amber-300/70 hover:text-red-500 hover:bg-red-500/10"
                  title={`Remove ${w.title}`} aria-label={`Remove ${w.title}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="p-3 pointer-events-none select-none">{w.node}</div>
          </div>
        ) : w.node}
      </div>
    </div>
  );
}

export default function DashboardGrid({ campaignId, widgets }) {
  const wide = useMediaQuery('(min-width: 768px)');
  const byId = useMemo(() => Object.fromEntries(widgets.map((w) => [w.id, w])), [widgets]);

  const [state, setState] = useState(() => load(campaignId) || buildDefault(widgets));
  const [editing, setEditing] = useState(false);
  const [measured, setMeasured] = useState({}); // id -> row-span from content

  useEffect(() => { save(campaignId, state); }, [campaignId, state]);

  const onMeasure = useCallback((id, rows) => {
    setMeasured((m) => (m[id] === rows ? m : { ...m, [id]: rows }));
  }, []);

  const active = useMemo(
    () => state.active.filter((id) => byId[id] && byId[id].available !== false),
    [state.active, byId],
  );

  // Effective layout: positions/width from saved state, height from measurement.
  const layout = useMemo(() => {
    const existing = new Map(state.layout.map((l) => [l.i, l]));
    return active.map((id) => {
      const base = existing.get(id) || placeAtBottom(state.layout, byId[id]);
      return { i: id, x: base.x, y: base.y, w: base.w, h: measured[id] ?? base.h, minW: byId[id].minW || 2, minH: 2 };
    });
  }, [active, state.layout, measured, byId]);

  const onLayoutChange = (next) => {
    if (!editing) return;
    setState((s) => {
      const merged = next.map(({ i, x, y, w, h, minW }) => ({ i, x, y, w, h, minW, minH: 2 }));
      if (JSON.stringify(merged) === JSON.stringify(s.layout)) return s; // avoid loops
      return { ...s, layout: merged };
    });
  };
  const addWidget = (id) => setState((s) => ({
    ...s, active: [...s.active, id], layout: [...s.layout, placeAtBottom(s.layout, byId[id])],
  }));
  const removeWidget = (id) => setState((s) => ({
    ...s, active: s.active.filter((x) => x !== id), layout: s.layout.filter((l) => l.i !== id),
  }));
  const reset = () => { setMeasured({}); setState(buildDefault(widgets)); };

  const toolbar = (
    <div className="flex items-center justify-end gap-2 mb-3">
      {editing && <AddMenu widgets={widgets} active={active} onAdd={addWidget} />}
      {editing && (
        <button onClick={reset} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Reset to the default layout">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      )}
      <button
        onClick={() => setEditing((e) => !e)}
        className={cn('inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold',
          editing ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' : 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800')}
      >
        {editing ? <><Check className="w-3.5 h-3.5" /> Done</> : <><Pencil className="w-3.5 h-3.5" /> Edit layout</>}
      </button>
    </div>
  );

  // Mobile: no grid — stack active widgets in layout order. No scroll concerns
  // since each widget renders at its natural height.
  if (!wide) {
    const ordered = [...active].sort((a, b) => {
      const la = layout.find((l) => l.i === a) || {}; const lb = layout.find((l) => l.i === b) || {};
      return (la.y - lb.y) || (la.x - lb.x);
    });
    return (
      <div className="space-y-6">
        {ordered.map((id) => <div key={id}>{byId[id].node}</div>)}
      </div>
    );
  }

  return (
    <div>
      {toolbar}
      {editing && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mb-2 text-right">
          Drag the title bar to move · drag the right edge to set width · height fits the content · saved on this device.
        </p>
      )}
      <Grid
        className="-mx-1"
        layout={layout}
        cols={COLS}
        rowHeight={ROW_H}
        margin={[MARGIN, MARGIN]}
        isDraggable={editing}
        isResizable={editing}
        draggableCancel=".dash-no-drag"
        resizeHandles={['e']}
        compactType="vertical"
        onLayoutChange={onLayoutChange}
      >
        {active.map((id) => (
          <div key={id}>
            <WidgetItem w={byId[id]} editing={editing} onRemove={removeWidget} onMeasure={onMeasure} />
          </div>
        ))}
      </Grid>
    </div>
  );
}
