import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * The second build target: the Anaesthetist Mobile App as an installable PWA.
 *
 * One codebase, two Vite configs — not a fork. Only 14 of the ~163 files in the
 * mobile import closure are mobile-exclusive; the rest is the shared card body,
 * the BTM capture suite, the sheets, the whole store and the whole domain. A
 * copy would drift on the first polish fix. This target differs from
 * `vite.config.ts` in its root, its entry, and this plugin.
 *
 * `root: 'pwa'` brings four gotchas, each handled below.
 *
 * `server.fs.allow` deliberately needs NO change: Vite's workspace search finds
 * `aa-prototype` (there is no root `package.json` and no lockfile marker above
 * it), and `../src` is inside that, so the entry's imports resolve.
 */

/**
 * The build id shown in the More tab's Build card.
 *
 * Why it exists: once a service worker is installed, a phone can sit two deploys
 * behind with no outward sign, so "is this handset running the build I just
 * made?" has to be answerable by looking at the screen. That makes honesty the
 * only requirement, and it must never fail a build to work it out.
 *
 * HOST-AGNOSTIC ON PURPOSE, and do not reintroduce a vendor variable. This once
 * read one particular host's commit variable, which no other host sets — so
 * anywhere else it silently reported a placeholder on every deploy and the row
 * quietly stopped doing its one job. Git is the source of truth instead, with a
 * single generic override:
 *
 *   AA_BUILD_ID set      that value, wins outright. A host that already has the
 *                        commit in its own variable passes it through, which
 *                        keeps every vendor's variable name out of this file.
 *   git, clean tree      `a1b2c3d`. Rebuilding the same commit is reproducible,
 *                        so an installed phone correctly sees no update.
 *   git, dirty tree      `a1b2c3d-dirty-0731-1612`. The sha alone is ambiguous
 *                        while iterating on a handset, and two builds that look
 *                        identical is the exact failure this row exists to
 *                        catch, so a dirty build gets a discriminator.
 *   no git at all        `unknown`. A tarball, a copy without `.git`, a machine
 *                        with no git binary. Saying so beats inventing a value.
 *
 * The stamp is NOT a breach of the determinism convention. That rule governs app
 * code, so the seeded demo world rebuilds identically every run; this is Node,
 * at build time, in tooling that never touches domain state, and it produces a
 * string that is displayed and never computed on. Same reasoning that lets
 * `src/pwa/bootMetrics.ts` read `performance.now()`. It is confined to the dirty
 * branch so a clean, deployable build stays byte-reproducible.
 */
function readBuildId(): string {
  const override = process.env.AA_BUILD_ID?.trim()
  if (override) return override.slice(0, 32)

  // `stdio: ['ignore', 'pipe', 'ignore']` earns its keep twice: it swallows
  // git's "not a git repository" complaint so a tarball build stays quiet, and a
  // missing git binary lands in the same catch as a missing repo.
  const git = (args: string[]): string =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

  try {
    // `--short=7` rather than `--short`, which follows `core.abbrev` and can
    // widen as history grows; a fixed width is easier to compare by eye.
    const sha = git(['rev-parse', '--short=7', 'HEAD'])
    // Untracked files count as dirty deliberately: a new module that is imported
    // but not yet committed genuinely changes the bundle, and a false `-dirty`
    // costs nothing. `dist-pwa/` and the Playwright artifacts are gitignored, so
    // they never show up here.
    const dirty = git(['status', '--porcelain']).length > 0
    return dirty ? `${sha}-dirty-${localStamp()}` : sha
  } catch {
    return 'unknown'
  }
}

/** `MMDD-HHmm` in the builder's own timezone, short enough to read off a phone. */
function localStamp(): string {
  const now = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

const buildId = readBuildId()

export default defineConfig({
  root: 'pwa',
  // Vite would otherwise resolve `pwa/public`, which does not exist. Pointing
  // back gives ONE shared publicDir, which is what makes the self-hosted fonts
  // and the icon set serve both targets from a single copy.
  publicDir: '../public',
  cacheDir: '../node_modules/.vite-pwa',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app makes zero network calls, so there is nothing to runtime-cache
      // and no reason to hand-write a worker.
      strategies: 'generateSW',
      // Never `autoUpdate`: it reloads the page by itself, and mid-demo that
      // drops the slide-stack position and any open sheet. `src/pwa/
      // UpdatePrompt.tsx` puts the moment in the presenter's hands instead.
      registerType: 'prompt',
      manifest: {
        name: 'AA Booking & Billing',
        short_name: 'AA Booking',
        description: 'Anaesthesia Associates booking and billing, for anaesthetists.',
        lang: 'en-NZ',
        display: 'standalone',
        orientation: 'portrait',
        // Straight to the Lists tab, skipping the `Navigate to="lists"` hop.
        start_url: '/mobile/lists',
        // `/` rather than `/mobile`, so the entry's root redirect is in scope.
        scope: '/',
        // The app's identity on Android. Absent, it falls back to `start_url`,
        // which means any later change to `start_url` reads as a BRAND NEW app
        // to an already-installed phone: a second icon, a second storage
        // bucket, and no upgrade path. Pinning it while nothing has been
        // installed from a stable alias costs nothing; once it has, this string
        // must never change again.
        id: '/aa-booking-billing',
        // Both colours are MEASURED, not picked. Evaluating
        // `AA_DEFAULT_GRADIENT` at the top centre of the canvas: that point
        // sits 21.0% along a ramp from alpha 0.45 to 0, so alpha = 0.338, and
        // rgb(236,206,213) over #F6F8F7 gives #F3EAEC. Using it means there is
        // no seam where the status bar meets the atmosphere. Its relative
        // luminance is high, so Android picks dark status-bar icons. This is
        // sanctioned crimson: the mobile canvas's faint atmospheric wash is
        // listed in CLAUDE.md among the legitimate identity uses.
        theme_color: '#F3EAEC',
        // `neutral.bg`, the atmosphere's own base, for Android's generated
        // splash. iOS ignores it, which is why `pwa/index.html` also carries an
        // inline background rule.
        background_color: '#F6F8F7',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // A separate artwork, not the same file relabelled: Android's safe
          // zone is a circle at 80% of width, so a monogram sized to look right
          // unmasked gets clipped.
          { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The one setting that MUST be explicit. The plugin already defaults
        // `navigateFallback`, `cleanupOutdatedCaches` and
        // `dontCacheBustURLsMatching`, but it leaves `globPatterns` to
        // workbox-build's default, which omits woff2 and png — so the
        // self-hosted fonts and every icon would silently not be precached, and
        // the offline demo would fall back to system fonts.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico,webmanifest}'],
        globIgnores: ['**/*.txt'],
      },
      devOptions: {
        // Off by default: a worker in dev caches aggressively and makes HMR
        // confusing. Flip to true to exercise the update flow against the dev
        // server (see the README's device-testing loop).
        enabled: false,
      },
    }),
  ],
  define: {
    // Surfaced in the More tab. Without a visible build id you cannot tell
    // whether the phone actually picked up a deploy, and that burns
    // workshop-prep time.
    __BUILD_ID__: JSON.stringify(buildId),
    // Stamped at build time alongside the build id, for the More tab's
    // "Release Date" row. Build time, not render time: a render-time `new Date()`
    // would report when the user opened the tab, not when the build shipped.
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    outDir: '../dist-pwa',
    // MANDATORY. Vite's `resolveEmptyOutDir` returns false for an outDir
    // outside the root, so without this stale hashed assets accumulate forever
    // — and stale assets in a directory that is about to be precached by a
    // service worker is exactly the bug class this target is trying to avoid.
    emptyOutDir: true,
  },
  server: {
    // Playwright's existing `webServer` owns 5173.
    port: 5174,
    strictPort: true,
    // Bind every interface rather than localhost alone. Half of what this
    // target adds (safe areas, standalone chrome, the gestures, the icon) can
    // only be judged on a handset, so `http://<your-ip>:5174` from a phone on
    // the same wifi IS the primary loop, not an occasional extra. `preview`
    // inherits `server.host`, so this reaches `preview:pwa` too.
    host: true,
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
})
