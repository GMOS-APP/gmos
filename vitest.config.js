import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// Kept separate from vite.config.js so tests don't load the PWA plugin.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.mjs'],
    setupFiles: ['./src/__tests__/setup.js'],
  },
})
