// Central error sink. Always logs; forwards to Sentry if it's present (loaded
// via a loader <script> or the SDK) — so wiring real error tracking later is a
// zero-code change: add the Sentry loader + DSN and these calls light up.
export function reportError(error, info) {
  try {
    // eslint-disable-next-line no-console
    console.error('[gmos]', error, info || '');
    const S = typeof window !== 'undefined' ? window.Sentry : null;
    if (S?.captureException) S.captureException(error, info ? { extra: info } : undefined);
  } catch { /* never throw from the error reporter */ }
}

// Catch errors that escape React (async, event handlers, promises).
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined' || window.__gmosErrHandlers) return;
  window.__gmosErrHandlers = true;
  window.addEventListener('error', (e) => reportError(e.error || e.message, { type: 'window.error' }));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, { type: 'unhandledrejection' }));
}
