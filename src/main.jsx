import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initAccent } from '@/lib/theme'

initAccent() // apply any cached brand accent before first paint

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
