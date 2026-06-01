import { useEffect, useRef } from 'react';

const isMac = typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** True when the event originates from a field where typing should win. */
function inEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * Register global keyboard shortcuts.
 *
 * Each binding: { code, key, mod, shift, alt, allowInInput, handler }
 *  - code: KeyboardEvent.code (e.g. 'KeyN', 'Slash') — preferred, layout/dead-key safe
 *  - key:  fallback exact KeyboardEvent.key match when `code` is absent
 *  - mod:  require the platform command key (⌘ on macOS, Ctrl elsewhere)
 *  - shift/alt: require those modifiers
 *  - allowInInput: still fire while a text field is focused (e.g. ⌘K)
 *
 * Bindings are read through a ref so the listener attaches once and callers
 * don't need to memoize the array.
 */
export function useHotkeys(bindings) {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    function onKeyDown(e) {
      const editable = inEditable(e.target) || inEditable(document.activeElement);
      for (const b of ref.current) {
        if (!b) continue;
        const { code, key, mod = false, shift = false, alt = false, allowInInput = false } = b;
        if (editable && !allowInInput) continue;

        const keyMatch = code ? e.code === code : e.key.toLowerCase() === key?.toLowerCase();
        if (!keyMatch) continue;

        const modMatch = mod ? (isMac ? e.metaKey : e.ctrlKey) : (!e.metaKey && !e.ctrlKey);
        const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
        const altMatch = alt ? e.altKey : !e.altKey;
        if (modMatch && shiftMatch && altMatch) {
          e.preventDefault();
          b.handler(e);
          return;
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/** Human-readable modifier labels for help/hint UI. */
export const MOD_LABEL = isMac ? '⌘' : 'Ctrl';
export const ALT_LABEL = isMac ? '⌥' : 'Alt';
