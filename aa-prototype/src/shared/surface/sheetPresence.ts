/**
 * Whether any `BottomSheet` is on screen right now.
 *
 * The handset's floating "Demo" chip (`src/pwa/PwaDemoActions.tsx`) sits at
 * zIndex 55 so it clears the tab bar and the Booking's dock, but a sheet's
 * scrim and panel (zIndex 70) are siblings in other stacking contexts, and the
 * chip ended up painted on top of an open sheet's controls. Rather than a
 * z-index arms race between unrelated subtrees, the chip simply steps aside
 * while a sheet is up: every mounted `BottomSheet` registers here (it is
 * mounted only while open, closing animation included), and the chip reads
 * `useAnySheetOpen()`.
 *
 * A plain module counter with `useSyncExternalStore`, not React context: the
 * sheets and the chip live in different subtrees (the chip is host chrome in
 * `MobileViewport`), and this is UI presence, not app state, so it has no
 * business in the persisted store. Lives in `shared/surface/` beside the sheet
 * and imports nothing, so it is safe in the PWA closure (`pwaPurity.test.ts`).
 */

import { useEffect, useSyncExternalStore } from 'react'

let openCount = 0
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function snapshot(): boolean {
  return openCount > 0
}

/** Register one open sheet; returns its release. Release is idempotent. */
export function registerOpenSheet(): () => void {
  openCount += 1
  emit()
  let released = false
  return () => {
    if (released) return
    released = true
    openCount -= 1
    emit()
  }
}

/** Call from a sheet: registered for as long as the calling component is mounted. */
export function useRegisterOpenSheet(): void {
  useEffect(() => registerOpenSheet(), [])
}

/** True while at least one `BottomSheet` is mounted. */
export function useAnySheetOpen(): boolean {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
