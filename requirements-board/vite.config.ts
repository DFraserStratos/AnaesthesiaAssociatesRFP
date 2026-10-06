import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { cataloguePlugin } from './server/cataloguePlugin.ts'

// A local dev tool: the dev server is the app's file API, so there is no production build to host.
export default defineConfig({
  plugins: [react(), cataloguePlugin()],
  server: { port: 5180, strictPort: true },
  // Loaded only when an artifact needs them; pre-bundled up front, so the first one shown never reloads the page.
  optimizeDeps: { include: ['mermaid', 'pdfjs-dist'] },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
