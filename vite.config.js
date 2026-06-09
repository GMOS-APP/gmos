import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // react-draggable (via react-grid-layout) reads process.env.DRAGGABLE_DEBUG in
  // its drag handlers; `process` is undefined in the browser, so without this it
  // throws on drag-start and the dashboard widgets won't move. Define it away.
  define: {
    'process.env.DRAGGABLE_DEBUG': 'false',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { 'process.env.DRAGGABLE_DEBUG': 'false' },
    },
  },
})
