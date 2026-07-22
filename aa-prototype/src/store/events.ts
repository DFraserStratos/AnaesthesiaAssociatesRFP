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
  for (const listener of listeners) listener(event)
}
