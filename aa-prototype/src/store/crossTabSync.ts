/**
 * Live sync between browser tabs of the SAME ORIGIN.
 *
 * A presenter edits a Booking in the Admin app in one tab
 * (`localhost:5173/admin/...`) and wants the anaesthetist's phone in another
 * tab (`localhost:5173/mobile/...`) to show it without a refresh. Both tabs
 * persist the one store to localStorage under `PERSIST_KEY`, and the browser
 * fires a `storage` event in every OTHER tab of the origin whenever one of
 * them writes that key (never in the tab that wrote it). This listens for it
 * and rehydrates the store from the new payload through zustand's own
 * `persist.rehydrate()`, so the same version check, migrate and
 * `backfillMerge` run as at launch, and every subscribed component re-renders.
 *
 * NO ECHO. The adopt must not write anything back, or the other tab gets a
 * `storage` event of its own, rehydrates, writes, and the two tabs ping-pong
 * the 1.1 MB payload every 250 ms. `adoptExternal` (persistStorage.ts) drops
 * any write this tab still had queued and records the new payload as what
 * storage holds; `withoutWrites` swallows any `setItem` zustand or the shell
 * restore below makes during the rehydrate. Writes are only ever fired by
 * local mutations, which is also what keeps this from looping: tab A's
 * mutation writes, tab B adopts silently, and nothing more happens.
 *
 * LAST WRITER WINS. If this tab had a mutation still queued behind the write
 * timer when the event arrives, that mutation is lost: the other tab wrote
 * later, its payload is adopted whole. For a demo with one presenter driving
 * one tab at a time that is the right trade, and it never throws.
 *
 * PER-TAB VIEW STATE. `shell.currentApp` is persisted but means "the app this
 * tab is showing". Adopting the Admin tab's value would make the mobile tab's
 * `AppShell` effect set it straight back (a local mutation, so a write), the
 * Admin tab would do the same in reply, and the tabs would ping-pong after
 * all. So this tab's own value is put back after the rehydrate, inside the
 * same `withoutWrites`, through the existing shell action (the store
 * discipline in `mutate.test.ts` allows no direct `setState` here).
 *
 * A CLEARED KEY (`newValue === null`: `removeItem` on the key, or
 * `localStorage.clear()`, which arrives with `key === null`) is adopted as
 * "storage holds nothing" but does NOT rehydrate. Rehydrating from nothing
 * merges into the current state and changes nothing, and the in-app hard
 * reset (`PwaDemoPanel`) removes the key and then immediately writes the
 * fresh seed, which arrives here as an ordinary event and is adopted. What
 * matters on a clear is that this tab's pending write is dropped, so a
 * `pagehide` flush cannot put the old payload back behind the reset. After a
 * bare clear from devtools this tab keeps showing what it has until either
 * tab next writes.
 *
 * SAME ORIGIN ONLY. localStorage, and so the `storage` event, is scoped per
 * origin. The installable PWA on port 5174 (`npm run dev:pwa`, or an installed
 * build on its own host) is a different origin from the framed prototype on
 * 5173 and cannot sync with it; two tabs of either one can.
 */

import { reportDiagnostic } from './diagnostics'
import type { BoundAppStore } from './appStore'
import { isPersistPaused, adoptExternal, withoutWrites } from './persistStorage'

/** zustand types the bound store without the persist mutator; this is the slice of it used here. */
interface PersistApi {
  persist: { rehydrate: () => Promise<void> | void }
}

/** Stores already listening, so a second call (HMR, a test) does not bind twice. */
const bound = new WeakSet<object>()

/**
 * Listen for another tab's writes to `key` and rehydrate `store` from them.
 * Returns the unbind (a no-op where nothing was bound). Does nothing outside a
 * browser (no `window`), and binds a given store once.
 */
export function bindCrossTabSync(store: BoundAppStore, key: string): () => void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {}
  if (bound.has(store)) return () => {}
  const api = store as unknown as BoundAppStore & PersistApi
  if (typeof api.persist?.rehydrate !== 'function') return () => {}
  bound.add(store)

  const onStorage = (event: StorageEvent): void => {
    // `key === null` is a `localStorage.clear()` in the other tab.
    if (event.key !== key && event.key !== null) return
    // sessionStorage events share the same `storage` event name.
    try {
      if (event.storageArea !== null && event.storageArea !== window.localStorage) return
    } catch {
      return
    }
    // Full-scale data is held in memory only (catch-up Phase 43): while saving is paused this tab
    // ignores the other tab's writes, rather than swapping its data under a full-scale banner.
    if (isPersistPaused()) return
    const newValue = event.key === null ? null : event.newValue
    try {
      adoptExternal(key, newValue)
      if (newValue === null) return
      withoutWrites(() => {
        const ownApp = api.getState().shell.currentApp
        void api.persist.rehydrate()
        if (api.getState().shell.currentApp !== ownApp) api.getState().setCurrentApp(ownApp)
      })
    } catch (error) {
      // A malformed payload must not take the tab down; it keeps its state.
      reportDiagnostic('warn', 'cross-tab sync skipped an update it could not read', { error })
    }
  }

  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('storage', onStorage)
    bound.delete(store)
  }
}
