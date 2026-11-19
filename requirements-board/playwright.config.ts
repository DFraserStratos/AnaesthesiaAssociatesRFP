import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'
import { FIXTURE_DIR } from './e2e/fixtureCatalogue.ts'

/**
 * Browser checks for what Vitest can't reach: React Flow's rendering. Boards boot on:
 *   5182  a synthetic fixture catalogue in the temp folder, for specs that write (Mapped drags);
 *   5181  with BOARD_E2E_REAL=1 only: this project's own catalogue, read-only (no spec saves,
 *         drags or edits there), so it can run beside the board you have open on 5180. Its
 *         specs check this project's content, so they are opt-in and not part of the kit.
 * Run: `npm run test:e2e` (add BOARD_E2E_REAL=1 for the project's live checks; BOARD_E2E_REAL_PORT
 * moves that board off 5181, for a worktree whose ports differ).
 */
const REAL = process.env.BOARD_E2E_REAL === '1'
const REAL_PORT = process.env.BOARD_E2E_REAL_PORT ?? '5181'

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { viewport: { width: 1600, height: 1000 } },
  projects: [
    ...(REAL ? [{ name: 'real', testMatch: ['board-edges.spec.ts', 'artifacts-real.spec.ts'], use: { baseURL: `http://localhost:${REAL_PORT}` } }] : []),
    // One worker: every fixture spec resets the same folder, so two at once would race.
    { name: 'fixture', testMatch: ['board-mapped.spec.ts', 'status-picker.spec.ts', 'question-delete.spec.ts', 'question-answer.spec.ts', 'question-step.spec.ts', 'board-search.spec.ts', 'item-links.spec.ts', 'item-delete.spec.ts', 'artifacts.spec.ts', 'sources.spec.ts', 'settings.spec.ts', 'diff.spec.ts', 'origin.spec.ts', 'bad-data.spec.ts', 'one-rule.spec.ts', 'edit-sheets.spec.ts'], workers: 1, use: { baseURL: 'http://localhost:5182' } },
  ],
  webServer: [
    // Its own change journal, so a test run never writes into the one beside the board on 5180.
    ...(REAL ? [{ command: `npx vite --port ${REAL_PORT} --strictPort`, env: { HISTORY_DIR: join(tmpdir(), 'requirements-board-e2e-history'), PDF_FACTS_DIR: join(tmpdir(), 'requirements-board-e2e-pdf-facts') }, url: `http://localhost:${REAL_PORT}`, reuseExistingServer: false }] : []),
    {
      command: `node e2e/fixtureCatalogue.ts "${FIXTURE_DIR}" && npx vite --port 5182 --strictPort`,
      env: { REQUIREMENTS_DIR: FIXTURE_DIR, PDF_FACTS_DIR: join(tmpdir(), 'requirements-board-e2e-pdf-facts') },
      url: 'http://localhost:5182',
      reuseExistingServer: false,
    },
  ],
})
