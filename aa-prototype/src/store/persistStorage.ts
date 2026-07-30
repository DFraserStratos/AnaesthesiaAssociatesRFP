/**
 * Resilient localStorage for the persisted store — storage MECHANICS only.
 *
 * zustand's `persist` writes through `api.setState`: the middleware serialises
 * and calls `storage.setItem` inline, immediately AFTER the in-memory state has
 * already changed, and there is no try/catch anywhere on that path. Two
 * consequences matter now the prototype ships as an installable phone PWA.
 *
 * 1. A FAILED write (a `QuotaExceededError`, Safari's private-mode storage, a
 *    profile with site data blocked) throws out of `mutate()` and into whatever
 *    click handler started it. React error boundaries do NOT catch throws from
 *    event handlers, so the screen keeps showing the correct new state while
 *    every later tap throws, and the next reload silently rewinds to the last
 *    good write — the worst possible failure shape mid-demo. `setItem` below
 *    catches the write, latches `persistDisabled` and stops trying, degrading
 *    to "this session will not survive a reload" instead of a dead UI.
 *
 * 2. EVERY mutation re-serialises the WHOLE store. The pristine seed stringifies
 *    to 1,171,213 bytes (the schedule alone is ~845 KB across 3,877 Lists; the
 *    audit log another ~224 KB) — roughly 1.8 ms to stringify on an M-series
 *    Mac, so 8 to 20 ms on a mid-range phone, synchronously, on every card
 *    completion and every fee edit. A ~250 ms trailing timer collapses a burst
 *    of mutations into a single write; the last value for a key wins.
 *
 * Capacity is not the risk: 1.12 MB against Safari's ~5 MB budget, growing only
 * ~5.8 KB per demo day advanced. The `bytes()` readout on `/demo/data` keeps
 * that honest during a workshop.
 *
 * The stored key, shape and version are untouched, so this needs no
 * PERSIST_VERSION bump and no migration: an existing persisted store rehydrates
 * exactly as before.
 *
 * THE ONE TRAP, and it has already caught two tests. Coalescing means
 * `localStorage` is no longer in step with the store within the same tick.
 * Nothing in `src/` reads the `aa-demo` key directly — only this module and the
 * middleware do, so the app is unaffected — but anything that reaches past the
 * UI into the payload must account for it:
 *
 *   - a READ taken straight after a mutation sees the PREVIOUS payload;
 *   - a raw `setItem` on the key can be clobbered by the pending write landing
 *     on top of it a moment later, including via the `pagehide` flush that a
 *     page reload triggers.
 *
 * In Vitest, call `flushPersist()` first (`persistMigrate.test.ts` does). In
 * Playwright, poll for the payload to contain what the flow just produced
 * (`visual/admin-phase08.spec.ts` does) rather than sleeping on a guess.
 *
 * WHY NOT IndexedDB: `createJSONStorage` would then hydrate ASYNCHRONOUSLY, and
 * every launch would paint one frame of the pristine seed before the persisted
 * state landed — a visible flash of the wrong demo day. IndexedDB is the escape
 * hatch if the payload ever passes ~2 MB; until then a coalesced, guarded
 * synchronous write is the right trade.
 *
 * WHY `pagehide` + `visibilitychange`: those are the two events that actually
 * fire when an iOS PWA is backgrounded or killed. `beforeunload` is not
 * reliable on mobile, so it is deliberately not used.
 */

import type { StateStorage } from 'zustand/middleware'

/**
 * The trailing-write window. Long enough to swallow a burst of mutations (a
 * billing run writes many times in a few frames), short enough that a real tab
 * close rarely races it — and the two flush events below cover it when it does.
 */
const WRITE_DELAY_MS = 250

/** Safari's per-origin localStorage budget, the tightest of the browsers the demo runs on. */
export const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024

// ---------------------------------------------------------------------------
// Module state (one persisted store per page, so module-level is the right scope)
// ---------------------------------------------------------------------------

/**
 * The last value handed to `setItem` for each key: the queued write while the
 * timer is running, and afterwards our record of what storage holds. Kept even
 * when persistence has latched off, so the diagnostics readout stays live and
 * an in-session read still agrees with what the store thinks it wrote.
 */
const lastValue = new Map<string, string>()

/** Keys whose `lastValue` has not been written through yet. */
const unwritten = new Set<string>()

let timer: ReturnType<typeof setTimeout> | undefined
let listenersBound = false
let persistDisabled = false
let persistDisabledReason: string | null = null

/** The key most recently read or written, so `bytes()` can be called with no argument. */
let lastKey: string | null = null

// ---------------------------------------------------------------------------
// Guarded access to the real store
// ---------------------------------------------------------------------------

/** localStorage, or null where there is no DOM (jsdom is fine; a worker or SSR is not) or the property access itself throws. */
function backingStore(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Latch persistence off for the rest of the session and remember why. */
function disablePersistence(error: unknown): void {
  persistDisabled = true
  persistDisabledReason = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  console.warn('persistence paused after a storage error', error)
}

/**
 * Flush points. Registered once, lazily, on the first write: `pagehide` covers
 * an iOS PWA being killed or swiped away, `visibilitychange` covers it being
 * backgrounded (the far commoner case — a presenter switching apps mid-demo).
 */
function bindFlushListeners(): void {
  if (listenersBound) return
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  listenersBound = true
  window.addEventListener('pagehide', flushPersist)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPersist()
  })
}

// ---------------------------------------------------------------------------
// The StateStorage surface
// ---------------------------------------------------------------------------

function getItem(name: string): string | null {
  lastKey = name
  // A value this module is still holding — queued behind the timer, or stranded
  // by a failed write — is fresher than storage, so a read-after-write inside
  // the same tick stays consistent.
  const held = lastValue.get(name)
  if (held !== undefined && (unwritten.has(name) || persistDisabled)) return held
  const store = backingStore()
  if (store === null) return held ?? null
  try {
    return store.getItem(name)
  } catch {
    return held ?? null
  }
}

function setItem(name: string, value: string): void {
  lastKey = name
  lastValue.set(name, value)
  if (persistDisabled) return
  unwritten.add(name)
  bindFlushListeners()
  if (timer !== undefined) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = undefined
    flushPersist()
  }, WRITE_DELAY_MS)
}

function removeItem(name: string): void {
  lastKey = name
  lastValue.delete(name)
  unwritten.delete(name)
  if (unwritten.size === 0 && timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
  const store = backingStore()
  if (store === null) return
  // A remove is allowed through even when writes have latched off: it frees
  // space rather than consuming it, and clearing the key is how a hard reset
  // recovers. It does not un-latch — one storage failure is enough to stop
  // trusting writes for the rest of the session.
  try {
    store.removeItem(name)
  } catch (error) {
    disablePersistence(error)
  }
}

/**
 * zustand's synchronous `StateStorage`, hardened. Wired in `appStore.ts` as
 * `storage: createJSONStorage(() => resilientLocalStorage)`.
 */
export const resilientLocalStorage: StateStorage = { getItem, setItem, removeItem }

// ---------------------------------------------------------------------------
// Companion API (the flush hook + the /demo/data readout)
// ---------------------------------------------------------------------------

/** Write every queued value through now, synchronously, and disarm the timer. */
export function flushPersist(): void {
  if (timer !== undefined) {
    clearTimeout(timer)
    timer = undefined
  }
  if (unwritten.size === 0) return
  const keys = [...unwritten]
  // Cleared up front: a write that fails must not be retried on the next tick.
  unwritten.clear()
  if (persistDisabled) return
  const store = backingStore()
  if (store === null) return
  for (const name of keys) {
    const value = lastValue.get(name)
    if (value === undefined) continue
    try {
      store.setItem(name, value)
    } catch (error) {
      disablePersistence(error)
      return
    }
  }
}

/** Whether writes have latched off, and the error that stopped them. */
export function persistStatus(): { disabled: boolean; reason: string | null } {
  return { disabled: persistDisabled, reason: persistDisabledReason }
}

// A one-entry measurement cache. `bytes()` is read from a React render, and the
// held value is the SAME string reference between mutations, so the `===` below
// short-circuits on identity and the ~1.1 MB payload is encoded only when it
// actually changes.
let measuredValue: string | null = null
let measuredBytes = 0

function byteLengthOf(value: string): number {
  if (value === measuredValue) return measuredBytes
  measuredValue = value
  try {
    // A byte count, not a UTF-16 code-unit count: macrons in NZ patient names
    // and the middot in list labels each cost two bytes, and the quota is
    // measured in bytes.
    measuredBytes = typeof TextEncoder === 'undefined' ? value.length : new TextEncoder().encode(value).length
  } catch {
    measuredBytes = value.length
  }
  return measuredBytes
}

/**
 * Byte length of the currently persisted (or queued) payload for `name`,
 * defaulting to the key this module last touched — in the app that is the one
 * persisted store, resolved when zustand reads the key at hydration.
 */
export function bytes(name: string | null = lastKey): number {
  if (name === null) return 0
  const held = lastValue.get(name)
  if (held !== undefined) return byteLengthOf(held)
  const store = backingStore()
  if (store === null) return 0
  try {
    const stored = store.getItem(name)
    return stored === null ? 0 : byteLengthOf(stored)
  } catch {
    return 0
  }
}
