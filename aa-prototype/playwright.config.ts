import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright is a visual-testing aid for the build: it boots the dev server and
 * captures screenshots of each app screen (see `visual/screens.spec.ts`) so the
 * rendered UI can be eyeballed against the design mockups. Not a CI gate.
 *
 * Run: `npm run shots` (writes PNGs to `visual/shots/`, gitignored).
 *
 * TWO targets, because the mobile app now ships under two hosts:
 *
 *   prototype  the framed desktop prototype on 5173, 1440x900, every existing
 *              spec. Its `use` block is the config's ORIGINAL top-level `use`,
 *              moved down verbatim, so nothing about the existing suite changes.
 *   pwa-device the installable PWA on 5174, emulating an iPhone 14 Pro, matched
 *              by filename so it picks up exactly one spec.
 *
 * Both dev servers start together (`webServer` takes an array). `dev:pwa` uses
 * `vite.pwa.config.ts`, which pins port 5174 with `strictPort`.
 *
 * AA_PROTO_PORT and AA_PWA_PORT move both servers (and every URL here) for a
 * parallel build lane in its own worktree (docs/prototype-build/catch-up/LANES.md);
 * the dev servers it starts inherit them. Unset, the ports are 5173 and 5174.
 */
const PROTO_URL = `http://localhost:${process.env['AA_PROTO_PORT'] ?? 5173}`
const PWA_URL = `http://localhost:${process.env['AA_PWA_PORT'] ?? 5174}`
export default defineConfig({
  testDir: './visual',
  outputDir: './visual/.output',
  fullyParallel: true,
  reporter: 'list',
  projects: [
    {
      name: 'pwa-device',
      testMatch: /pwa-device\.spec\.ts$/,
      use: {
        ...devices['iPhone 14 Pro'],
        // The descriptor's own `defaultBrowserType` is `webkit`, which is a
        // separate ~100MB browser download this repo has never needed — every
        // existing spec runs on the Chromium that `npx playwright install`
        // already put in place. Pin Chromium so `npm run shots` keeps working
        // from a stock checkout. What the descriptor is actually here for is
        // the 393x660 viewport, DPR 3, `isMobile` and `hasTouch`; the engine
        // difference costs us only `env(safe-area-inset-*)`, which no headless
        // browser reports anyway (see the spec's floor assertions).
        browserName: 'chromium',
        baseURL: PWA_URL,
      },
    },
    {
      name: 'prototype',
      testIgnore: /pwa-device\.spec\.ts$/,
      use: {
        baseURL: PROTO_URL,
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: PROTO_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev:pwa',
      url: PWA_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
