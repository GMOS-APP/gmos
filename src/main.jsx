import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initAccent } from '@/lib/theme'
import { installGlobalErrorHandlers } from '@/lib/reportError'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { registerSW } from 'virtual:pwa-register'

initAccent() // apply any cached brand accent before first paint
installGlobalErrorHandlers()

// Progressive Web App: register the service worker and APPLY updates promptly.
// When a new version is precached, activate the waiting worker and reload so
// users don't get stuck running stale code (previously it only applied on some
// future manual reload). Also poll for updates hourly for long-lived tabs.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() { updateSW(true); },
  onRegisteredSW(_swUrl, registration) {
    if (registration) setInterval(() => registration.update(), 60 * 60 * 1000);
  },
})

// When a deploy lands mid-session, a lazy route chunk from the old build can
// vanish (new SW precache + new server assets) and the dynamic import fails.
// Vite signals this via `vite:preloadError` — reload once to pick up the new
// build instead of stranding the user on the error boundary. The flag prevents
// a reload loop if the failure persists.
window.addEventListener('vite:preloadError', (e) => {
  if (sessionStorage.getItem('gmos_chunk_reload') === '1') return; // let the boundary show
  sessionStorage.setItem('gmos_chunk_reload', '1');
  e.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => {
  // Successful load — clear the guard so future deploys can auto-recover too.
  setTimeout(() => sessionStorage.removeItem('gmos_chunk_reload'), 10_000);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
