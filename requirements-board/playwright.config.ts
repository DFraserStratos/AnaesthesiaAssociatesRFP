import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from '@playwright/test'
import { FIXTURE_DIR } from './e2e/fixtureCatalogue.ts'
import { SNAPSHOT_SITE_DIR } from './e2e/snapshotFixture.ts'
import { boardPort, loadLaneEnv } from './server/laneEnv.ts'

/**
 * Browser checks for what Vitest can't reach: React Flow's rendering. Boards boot on ports that follow
 * the worktree's own board (`BOARD_PORT`, filled from `.lane.env`, default 5180), so two worktrees
 * never collide:
 *   BOARD_PORT + 2 (5182)  a synthetic fixture catalogue in the temp folder, for specs that write
 *                          (Mapped drags); `BOARD_E2E_PORT` moves it;
 *   BOARD_PORT + 1 (5181)  a snapshot of the fixture catalogue (`npm run snapshot`), served as static
 *                          files by `vite preview`; `BOARD_E2E_SNAPSHOT_PORT` moves it;
 *   BOARD_PORT + 3 (5183)  with BOARD_E2E_REAL=1 only: the board's own catalogue, read-only (no spec
 *                          saves, drags or edits there), so it can run beside the board you have open.
 *                          `BOARD_E2E_REAL_PORT` moves it. `artifact-regions.spec.ts` opens every named
 *                          region of whatever catalogue that is; a project may add its own content specs.
 * Run: `npm run test:e2e` (add BOARD_E2E_REAL=1 for the live catalogue's checks). Give worktrees board
 * ports at least 4 apart, so one's e2e boards never land on another's board.
 */
loadLaneEnv()
const REAL = process.env.BOARD_E2E_REAL === '1'
const FIXTURE_PORT = process.env.BOARD_E2E_PORT ?? String(boardPort() + 2)
const REAL_PORT = process.env.BOARD_E2E_REAL_PORT ?? String(boardPort() + 3)
const SNAPSHOT_PORT = process.env.BOARD_E2E_SNAPSHOT_PORT ?? String(boardPort() + 1)

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { viewport: { width: 1600, height: 1000 } },
  projects: [
    // `artifacts-real.spec.ts` is this project's own content checks (not in a shared kit).
    ...(REAL ? [{ name: 'real', testMatch: ['board-edges.spec.ts', 'artifact-regions.spec.ts', 'artifacts-real.spec.ts'], use: { baseURL: `http://localhost:${REAL_PORT}` } }] : []),
    // One worker: every fixture spec resets the same folder, so two at once would race.
    { name: 'fixture', testMatch: ['board-mapped.spec.ts', 'board-canvas.spec.ts', 'status-picker.spec.ts', 'question-delete.spec.ts', 'question-answer.spec.ts', 'question-step.spec.ts', 'board-search.spec.ts', 'item-links.spec.ts', 'item-delete.spec.ts', 'artifacts.spec.ts', 'sources.spec.ts', 'settings.spec.ts', 'diff.spec.ts', 'origin.spec.ts', 'bad-data.spec.ts', 'one-rule.spec.ts', 'edit-sheets.spec.ts'], workers: 1, use: { baseURL: `http://localhost:${FIXTURE_PORT}` } },
    // Served at the host's root; its URLs are relative, so a sub-path host serves it the same way.
    { name: 'snapshot', testMatch: ['snapshot.spec.ts'], workers: 1, use: { baseURL: `http://localhost:${SNAPSHOT_PORT}/` } },
  ],
  webServer: [
    // Its own change journal, so a test run never writes into the one beside the board you have open.
    ...(REAL ? [{ command: `npx vite --port ${REAL_PORT} --strictPort`, env: { HISTORY_DIR: join(tmpdir(), 'requirements-board-e2e-history'), PDF_FACTS_DIR: join(tmpdir(), 'requirements-board-e2e-pdf-facts') }, url: `http://localhost:${REAL_PORT}`, reuseExistingServer: false }] : []),
    {
      command: `node e2e/fixtureCatalogue.ts "${FIXTURE_DIR}" && npx vite --port ${FIXTURE_PORT} --strictPort`,
      env: { REQUIREMENTS_DIR: FIXTURE_DIR, PDF_FACTS_DIR: join(tmpdir(), 'requirements-board-e2e-pdf-facts') },
      url: `http://localhost:${FIXTURE_PORT}`,
      reuseExistingServer: false,
    },
    {
      command: `node e2e/snapshotFixture.ts && npx vite preview --mode snapshot --outDir "${SNAPSHOT_SITE_DIR}" --port ${SNAPSHOT_PORT} --strictPort`,
      env: { PDF_FACTS_DIR: join(tmpdir(), 'requirements-board-e2e-pdf-facts') },
      url: `http://localhost:${SNAPSHOT_PORT}`,
      reuseExistingServer: false,
    },
  ],
})
