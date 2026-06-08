import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initAccent } from '@/lib/theme'
import { installGlobalErrorHandlers } from '@/lib/reportError'
import ErrorBoundary from '@/components/common/ErrorBoundary'

initAccent() // apply any cached brand accent before first paint
installGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
