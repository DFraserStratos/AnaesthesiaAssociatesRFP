import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cataloguePlugin } from './server/cataloguePlugin.ts'
import { loadLaneEnv } from './server/laneEnv.ts'

// A second worktree's ports: a git-ignored `.lane.env` (KEY=value lines) at the repository's top
// fills in BOARD_PORT (and any other variable) when it is not already set.
loadLaneEnv()

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// A local dev tool: the dev server is the app's file API. The one build meant to be hosted is a
// snapshot (`--mode snapshot`, run by `npm run snapshot`): read-only, reading the catalogue from a
// `catalogue.json` beside it, with relative paths so it works under any sub-path of a static host.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'snapshot' ? [react()] : [react(), cataloguePlugin()],
  base: mode === 'snapshot' ? './' : '/',
  // BOARD_PORT moves it (a second checkout or worktree running its own board). The dev server is
  // also the catalogue's file API, so no other page may read it: CORS is off (Vite's default lets
  // any localhost page read every response), and host checking stays on (the API's Origin check
  // depends on it). The catalogue plugin refuses Vite's own serving of the catalogue folders.
  server: { port: Number(process.env.BOARD_PORT ?? 5180), strictPort: true, cors: false },
  // The kit's version, shown on the About and Settings pages.
  define: { __BOARD_VERSION__: JSON.stringify(version) },
  // Loaded only when an artifact needs them; pre-bundled up front, so the first one shown never reloads the page.
  optimizeDeps: { include: ['mermaid', 'pdfjs-dist'] },
  test: {
    environment: 'node',
    // Tests keep their own stored PDF facts, apart from the real board's `.pdf-facts/`.
    env: { PDF_FACTS_DIR: join(tmpdir(), 'requirements-board-test-pdf-facts') },
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // Setup and cleanup hooks spawn boards and git and delete scratch trees: on a loaded machine they
    // overran the 10 s default with every test passing.
    hookTimeout: 60_000,
  },
}))
