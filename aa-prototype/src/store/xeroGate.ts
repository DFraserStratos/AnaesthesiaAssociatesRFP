/**
 * The one gate every engine-to-Xero call passes (catch-up Phase 37; EP-09:
 * "Xero calls are handled outside the main application request cycle, so a
 * slow or unavailable Xero API does not ... block workflow progression").
 *
 * A call either goes to Xero now or is written to the durable Xero sync queue
 * (`billing.xeroQueue`) with its first failed attempt, and the queue
 * (`xeroQueue.ts`) retries it with backoff on the demo clock. This module holds
 * only the verdict and the keyed enqueue, so the hand-off, the payment webhook
 * and the poll can call it without importing the queue's handlers.
 */

import type { XeroQueueItem } from '../domain/types'
import { nextAttemptISO } from '../domain/xero/queue'
import { allocateId, clockISO, mutate, ok, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

/** The queue's own system actor (audit source system). */
export const XERO_QUEUE_ACTOR: Actor = { who: 'Xero sync queue', role: 'system', source: 'system' }

export const XERO_OUTAGE_ERROR = 'Xero API unavailable (simulated outage)'
export const XERO_FAULT_ERROR = 'Xero rejected the call (simulated fault)'

/** False while the simulated outage is on: Xero's API does not answer the engine. */
export function xeroAvailable(state: Pick<AppState, 'settings'>): boolean {
  return state.settings.xeroOutage === undefined
}

export type GateVerdict = { go: true } | { go: false; error: string; consumesFault: boolean }

/**
 * May this call reach Xero now? No during an outage. No, once, when the demo
 * fault is armed for it (`failNextHandoff`, scoped to one Booking by
 * `failHandoffBookingId`): the fault applies to the engine's pushes (a pair's
 * hand-off, a transfer's journal), never to a payment Xero tells the engine of.
 */
export function gateFor(state: Pick<AppState, 'settings'>, push?: { bookingId?: string }): GateVerdict {
  if (!xeroAvailable(state)) return { go: false, error: XERO_OUTAGE_ERROR, consumesFault: false }
  if (push !== undefined && state.settings.failNextHandoff === true) {
    const scoped = state.settings.failHandoffBookingId
    if (scoped === undefined || scoped === push.bookingId) return { go: false, error: XERO_FAULT_ERROR, consumesFault: true }
  }
  return { go: true }
}

export interface EnqueueInput {
  kind: XeroQueueItem['kind']
  idempotencyKey: string
  target: XeroQueueItem['target']
  lastError: string
  /** Clear the armed demo fault in the same commit (it fires once). */
  consumesFault?: boolean
}

/**
 * Write one call to the queue with its first failed attempt (module-internal
 * to the gate's callers). Idempotent by key: an open item with that key is
 * returned, never duplicated. Audited `xero.queued`, source system.
 */
export function enqueueXeroWork(api: AppStoreApi, input: EnqueueInput): Outcome<{ itemId: string; created: boolean }> {
  const state = api.getState()
  const existing = Object.values(state.billing.xeroQueue).find((q) => q.status !== 'sent' && q.idempotencyKey === input.idempotencyKey)
  if (existing !== undefined && input.consumesFault !== true) return ok({ itemId: existing.id, created: false })
  let itemId = existing?.id ?? ''
  const metas: MutationMeta[] = []
  mutate(
    api,
    XERO_QUEUE_ACTOR,
    metas,
    (s) => {
      const settings = input.consumesFault === true ? clearFault(s.settings) : s.settings
      const after = { kind: input.kind, idempotencyKey: input.idempotencyKey, lastError: input.lastError, ...input.target }
      if (existing !== undefined) {
        metas.push({ entityType: 'xeroQueueItem', entityId: existing.id, action: 'xero.queued', after: { ...after, alreadyQueued: true } })
        return { settings }
      }
      const nowISO = clockISO(s.clock)
      const allocated = allocateId(s.counters, 'xeroQueueItem')
      itemId = allocated.id
      metas.push({ entityType: 'xeroQueueItem', entityId: allocated.id, action: 'xero.queued', after })
      const item: XeroQueueItem = {
        id: allocated.id,
        kind: input.kind,
        idempotencyKey: input.idempotencyKey,
        target: input.target,
        enqueuedAtISO: nowISO,
        attempts: 1,
        nextAttemptAtISO: nextAttemptISO(nowISO, 1),
        lastError: input.lastError,
        status: 'waiting',
      }
      return { billing: { ...s.billing, xeroQueue: { ...s.billing.xeroQueue, [item.id]: item } }, counters: allocated.counters, settings }
    },
  )
  return ok({ itemId, created: existing === undefined })
}

function clearFault(settings: AppState['settings']): AppState['settings'] {
  const { failHandoffBookingId: _scoped, ...rest } = settings
  return { ...rest, failNextHandoff: false }
}
