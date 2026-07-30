import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * The second build target: the Anaesthetist Mobile App as an installable PWA.
 *
 * One codebase, two Vite configs — not a fork. Only 14 of the ~154 files in the
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

/** Vercel exposes the deployed commit; fall back to something honest locally. */
const buildId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local-dev'

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
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
})
