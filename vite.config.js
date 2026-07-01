import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/main.jsx (bundled = same-origin, CSP-safe). No
      // inline/injected registration script.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'GM/OS — The Game Master OS',
        short_name: 'GM/OS',
        description: 'Keep your whole tabletop campaign in one place and run your sessions — NPCs, locations, prep, notes, initiative, dice, and a live battle map.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'any',
        categories: ['games', 'productivity', 'entertainment'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        // SPA fallback for app routes; keep server-rendered/marketing endpoints
        // (sitemap, rss, edge functions) on the network.
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\/sitemap\.xml$/, /\/rss\.xml$/, /\/api\//, /\/functions\//],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
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
