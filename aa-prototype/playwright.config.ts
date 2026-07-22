import { defineConfig } from '@playwright/test'

/**
 * Playwright is a visual-testing aid for the build: it boots the dev server and
 * captures screenshots of each app screen (see `visual/screens.spec.ts`) so the
 * rendered UI can be eyeballed against the design mockups. Not a CI gate.
 *
 * Run: `npm run shots` (writes PNGs to `visual/shots/`, gitignored).
 */
export default defineConfig({
  testDir: './visual',
  outputDir: './visual/.output',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
