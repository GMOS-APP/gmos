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

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
