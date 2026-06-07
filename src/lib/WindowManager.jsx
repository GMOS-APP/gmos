import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { CAMPAIGN_NAV_ITEMS } from '@/lib/navItems';

// Pages that live *inside* the campaign desktop as windows. Anything else
// (CampaignList, AccountSettings, About) escapes the window manager and
// navigates the top-level router.
export const WINDOW_PAGES = [
  'CampaignDashboard', 'EntityBrowser', 'EntityDetail', 'RelationshipMap', 'CampaignMap',
  'SessionBrowser', 'SessionPage', 'RandomTableBrowser', 'CampaignTimeline',
  'CampaignNotes', 'CampaignSettings', 'PartyInventory', 'PlayerView',
];

const LABELS = Object.fromEntries(CAMPAIGN_NAV_ITEMS.map((i) => [i.page, i.label]));
const EXTRA_LABELS = { EntityDetail: 'Entity', SessionPage: 'Session' };

export function pageKeyOf(url) {
  return (url || '').replace(/^\//, '').split('?')[0] || 'CampaignDashboard';
}
export function paramsOf(url) {
  const q = (url || '').split('?')[1] || '';
  return new URLSearchParams(q);
}
export function titleOf(url) {
  const key = pageKeyOf(url);
  return LABELS[key] || EXTRA_LABELS[key] || key;
}
// Stable identity so reopening the same logical page focuses its window instead
// of stacking duplicates, while distinct records (entity ids, sessions) each
// get their own window.
export function dedupeKey(url) {
  const key = pageKeyOf(url);
  const p = paramsOf(url);
  const id = p.get('id') || p.get('session_id') || (p.get('new') ? `new-${p.get('type') || ''}` : '');
  return id ? `${key}:${id}` : key;
}

const WindowManagerContext = createContext(null);
export const useWindowManager = () => useContext(WindowManagerContext);

const STORAGE = (cid) => `gmos_windows_${cid}`;

function loadPersisted(cid) {
  try {
    const raw = localStorage.getItem(STORAGE(cid));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Array.isArray(data?.windows) && data.windows.length) return data;
  } catch { /* ignore */ }
  return null;
}

// Cascade placement for a fresh window, sized to the viewport.
function defaultRect(index) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const w = Math.min(1080, Math.max(560, vw - 160));
  const h = Math.min(760, Math.max(420, vh - 200));
  const off = (index % 6) * 30;
  const x = Math.max(8, Math.round((vw - w) / 2) - 90 + off);
  const y = Math.max(8, 24 + off);
  return { x, y, w, h };
}

export function WindowManagerProvider({ campaignId, seedUrl, navigate, isMobile, children }) {
  const [windows, setWindows] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const zRef = useRef(1);
  const idRef = useRef(1);
  const seededRef = useRef(false);

  const newId = () => `w${idRef.current++}`;

  // Seed from persisted layout or the entry URL — once per campaign.
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const persisted = loadPersisted(campaignId);
    if (persisted) {
      const maxZ = Math.max(1, ...persisted.windows.map((w) => w.z || 1));
      zRef.current = maxZ + 1;
      idRef.current = persisted.windows.length + 1;
      // Re-key ids deterministically so refs stay unique.
      const restored = persisted.windows.map((w, i) => ({ ...w, id: `w${i + 1}` }));
      idRef.current = restored.length + 1;
      setWindows(restored);
      setFocusedId(persisted.focusedId && restored.find((w) => w.id === persisted.focusedId) ? persisted.focusedId : restored[restored.length - 1].id);
      return;
    }
    const url = seedUrl || '/CampaignDashboard';
    const id = newId();
    const rect = defaultRect(0);
    zRef.current = 2;
    // Guard against clobbering a window opened by a child effect before this ran.
    setWindows((prev) => (prev.length ? prev : [{ id, url, ...rect, z: 1, minimized: false, maximized: isMobile || false }]));
    setFocusedId((cur) => cur || id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Persist on change.
  useEffect(() => {
    if (!seededRef.current || !campaignId) return;
    try {
      localStorage.setItem(STORAGE(campaignId), JSON.stringify({ windows, focusedId }));
    } catch { /* ignore */ }
  }, [windows, focusedId, campaignId]);

  const focusWindow = useCallback((id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, z: zRef.current++, minimized: false } : w)));
    setFocusedId(id);
  }, []);

  const openWindow = useCallback((url, opts = {}) => {
    const key = dedupeKey(url);
    setWindows((prev) => {
      const existing = prev.find((w) => dedupeKey(w.url) === key);
      if (existing) {
        setFocusedId(existing.id);
        return prev.map((w) => (w.id === existing.id
          ? { ...w, url, z: zRef.current++, minimized: false }
          : w));
      }
      const id = newId();
      const rect = defaultRect(prev.length);
      const win = { id, url, ...rect, z: zRef.current++, minimized: false, maximized: opts.maximized || isMobile || false };
      setFocusedId(id);
      return [...prev, win];
    });
  }, [isMobile]);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      setFocusedId((cur) => (cur === id ? (next.length ? next[next.length - 1].id : null) : cur));
      return next;
    });
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
    setFocusedId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleMaximize = useCallback((id) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized, z: zRef.current++ } : w)));
    setFocusedId(id);
  }, []);

  const setRect = useCallback((id, rect) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...rect } : w)));
  }, []);

  // Called by a window when its own internal router navigates (in-window links).
  const updateWindowUrl = useCallback((id, url) => {
    setWindows((prev) => prev.map((w) => (w.id === id && w.url !== url ? { ...w, url } : w)));
  }, []);

  // Leave the window manager entirely for a non-campaign page.
  const escape = useCallback((url) => { if (navigate) navigate(url); }, [navigate]);

  const value = {
    windows, focusedId, isMobile,
    openWindow, closeWindow, focusWindow, minimizeWindow, toggleMaximize, setRect, updateWindowUrl, escape,
  };
  return <WindowManagerContext.Provider value={value}>{children}</WindowManagerContext.Provider>;
}
