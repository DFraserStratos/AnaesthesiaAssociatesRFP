import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cataloguePlugin } from './server/cataloguePlugin.ts'

// A second worktree's ports: a git-ignored `.lane.env` (KEY=value lines) beside the board folder
// fills in BOARD_PORT when it is not already set.
const laneEnv = new URL('../.lane.env', import.meta.url)
if (existsSync(laneEnv) && process.env.BOARD_PORT === undefined) {
  const m = /^\s*BOARD_PORT\s*=\s*(\d+)\s*$/m.exec(readFileSync(laneEnv, 'utf8'))
  if (m) process.env.BOARD_PORT = m[1]
}

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// A local dev tool: the dev server is the app's file API, so there is no production build to host.
export default defineConfig({
  plugins: [react(), cataloguePlugin()],
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
  },
})
