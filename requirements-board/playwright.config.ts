import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'
import { FIXTURE_DIR } from './e2e/fixtureCatalogue.ts'

/**
 * Browser checks for what Vitest can't reach: React Flow's rendering. Two boards boot:
 *   5181  the real catalogue, read-only (no spec saves, drags or edits there), so it can
 *         run beside the board you have open on 5180;
 *   5182  a synthetic fixture catalogue in the temp folder, for specs that write (Mapped drags).
 * Run: `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { viewport: { width: 1600, height: 1000 } },
  projects: [
    { name: 'real', testMatch: 'board-edges.spec.ts', use: { baseURL: 'http://localhost:5181' } },
    { name: 'fixture', testMatch: 'board-mapped.spec.ts', use: { baseURL: 'http://localhost:5182' } },
  ],
  webServer: [
    // Its own change journal, so a test run never writes into the one beside the board on 5180.
    { command: 'npx vite --port 5181 --strictPort', env: { HISTORY_DIR: join(tmpdir(), 'requirements-board-e2e-history') }, url: 'http://localhost:5181', reuseExistingServer: false },
    {
      command: `node e2e/fixtureCatalogue.ts "${FIXTURE_DIR}" && npx vite --port 5182 --strictPort`,
      env: { CATALOGUE_DIR: FIXTURE_DIR },
      url: 'http://localhost:5182',
      reuseExistingServer: false,
    },
  ],
})
