import { useSyncExternalStore } from 'react';

// Device-level preference (mirrors the theme convention) for whether global
// keyboard shortcuts are active. Defaults to enabled.
const KEY = 'gmos_hotkeys_enabled';
const listeners = new Set();

function read() {
  return localStorage.getItem(KEY) !== 'false';
}

export function setHotkeysEnabled(enabled) {
  localStorage.setItem(KEY, enabled ? 'true' : 'false');
  listeners.forEach((l) => l());
}

function subscribe(cb) {
  listeners.add(cb);
  const onStorage = (e) => { if (e.key === KEY) cb(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useHotkeysEnabled() {
  return useSyncExternalStore(subscribe, read, () => true);
}
