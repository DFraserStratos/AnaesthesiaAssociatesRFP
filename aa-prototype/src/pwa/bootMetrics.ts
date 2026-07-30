/**
 * Cold-launch instrumentation for the installed PWA, surfaced in the More tab
 * next to the build id.
 *
 * There is real work to measure. The mobile-only import closure has to parse
 * and evaluate, and `src/domain/seed` builds its whole world eagerly at module
 * scope: 3,877 Lists, 172 Cards, 175 Procedures and 915 audit entries. That
 * measured at a median 23.6 ms on an M-series Mac, so a realistic phone cold
 * launch is 0.4 to 1.0 s of JS, all of it local once the service worker has
 * precached. No mitigation is warranted, and specifically no `manualChunks`:
 * with one route and a fully precached shell, splitting adds a round trip on
 * first load and buys nothing warm. This exists so the claim can be checked on
 * the actual device rather than argued about.
 *
 * `performance.now()` is a monotonic timer, not a wall clock. It is not the
 * demo clock and never touches domain state, so it does not breach the
 * determinism convention.
 */

const MARK_START = 'aa-pwa-boot-start'
const MARK_READY = 'aa-pwa-first-render'

let firstRenderMs: number | null = null

/** Call from the entry, before `createRoot(...).render(...)`. */
export function markBootStart(): void {
  performance.mark?.(MARK_START)
}

/**
 * Call once the first frame has been committed. Safe to call more than once;
 * only the first value is kept, so a StrictMode double-invoke cannot skew it.
 *
 * Measured from `performance.timeOrigin`, which in a document is navigation
 * start, NOT from this module's own evaluation. The distinction matters: this
 * module sits near the end of the entry's static imports, and ES module
 * evaluation is depth-first, so by the time it runs, the store, the domain and
 * the eager seed build have all already happened. Timing from here would report
 * a flattering three milliseconds and measure nothing anybody cares about.
 */
export function markFirstRender(): void {
  if (firstRenderMs !== null) return
  performance.mark?.(MARK_READY)
  firstRenderMs = performance.now()
}

/** Milliseconds from navigation start to first render, or null if not yet reached. */
export function bootMs(): number | null {
  return firstRenderMs === null ? null : Math.round(firstRenderMs)
}
