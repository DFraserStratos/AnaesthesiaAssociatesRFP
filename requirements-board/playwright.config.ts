import { defineConfig } from '@playwright/test'

/**
 * Browser checks for what Vitest can't reach: React Flow's rendering. Boots its own board
 * on 5181 over the real catalogue, read-only (no spec saves, drags or edits), so it can run
 * beside the board you have open on 5180. Run: `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { baseURL: 'http://localhost:5181', viewport: { width: 1600, height: 1000 } },
  webServer: { command: 'npx vite --port 5181 --strictPort', url: 'http://localhost:5181', reuseExistingServer: false },
})
