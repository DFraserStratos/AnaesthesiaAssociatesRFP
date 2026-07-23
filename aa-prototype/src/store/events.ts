/**
 * Tiny typed app-event emitter — the subscription seams later phases hook:
 * Phase 08's billing run consumes `listAuthorised`; Phase 10's reconciliation
 * poll and archive job hook `dayAdvanced`.
 */

export type AppEvent =
  | { type: 'listAuthorised'; listId: string }
  | { type: 'dayAdvanced'; todayISO: string }

type Listener = (event: AppEvent) => void

const listeners = new Set<Listener>()

/** Subscribe to app events. Returns the unsubscribe function. */
export function onAppEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitAppEvent(event: AppEvent): void {
  for (const listener of listeners) {
    // A listener error must never destroy the emitting mutation's outcome —
    // authoriseList emits AFTER its commit, and a throw here would strand the
    // committed state with the caller's `ok` lost (Phase 08, 8th review).
    try {
      listener(event)
    } catch (error) {
      console.error('app-event listener failed', event.type, error)
    }
  }
}
