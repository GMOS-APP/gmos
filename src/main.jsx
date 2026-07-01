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

// Progressive Web App: register the service worker and auto-update in the
// background. When a new version is precached, refresh once it's safe.
registerSW({ immediate: true, onNeedRefresh() { /* autoUpdate applies on next load */ } })

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
