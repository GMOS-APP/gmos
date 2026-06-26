import { useSyncExternalStore } from 'react';

// Device-level preference (mirrors useHotkeysEnabled) for whether the desktop
// "OS" experience — floating, draggable page windows — is on. When off, pages
// render full-screen with plain navigation, like the mobile layout. Defaults to
// on. Only affects desktop widths; mobile is always full-screen regardless.
const KEY = 'gmos_window_mode';
const listeners = new Set();

function read() {
  return localStorage.getItem(KEY) !== 'off';
}

export function setWindowModeEnabled(enabled) {
  localStorage.setItem(KEY, enabled ? 'on' : 'off');
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

export function useWindowMode() {
  return useSyncExternalStore(subscribe, read, () => true);
}
