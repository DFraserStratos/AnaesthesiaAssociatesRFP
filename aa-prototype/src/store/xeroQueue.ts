/**
 * The Xero outage and the durable Xero sync queue (catch-up Phase 37; EP-09:
 * "every financial event is written to a queue before it is sent to Xero. A
 * failed call retries automatically with exponential backoff, so nothing is
 * lost"; "idempotency: ... retries never result in duplicate invoices";
 * testing covers "retry and alerting").
 *
 * The gate (`xeroGate.ts`) writes a call here with its first failed attempt.
 * `processXeroQueue` works the due items in id order on every demo-clock
 * change (`wireXeroQueue`), one attempt per item per call, so a seven-day jump
 * is one more attempt, not a burst. While Xero is unavailable each attempt
 * fails and backs off (2, 4, 8 ... 60 minutes), alerting from the fifth; when
 * Xero answers each item runs its own idempotent handler and is marked sent.
 * No timers: time is the demo clock alone. Nothing mutates or audits when no
 * item is due.
 */

import type { XeroQueueItem } from '../domain/types'
import { isAlerted, isDue, nextAttemptISO } from '../domain/xero/queue'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { onAppEvent } from './events'
import { openXeroQueueItems } from './ledgerSelectors'
import { createTransferJournal, createXeroPair } from './xeroHandoff'
import { receivePayment } from './paymentActions'
import { recordDisbursement } from './disbursementDetection'
import { runReconciliationPoll } from './reconciliationPoll'
import { XERO_OUTAGE_ERROR, XERO_QUEUE_ACTOR, xeroAvailable } from './xeroGate'

export { xeroAvailable } from './xeroGate'

/**
 * Switch the simulated outage on or off (demo; audit `xero.outageStarted`,
 * `xero.outageEnded`). Ending it drains the queue at once, in order.
 */
export function setXeroOutage(api: AppStoreApi, actor: Actor, on: boolean): Outcome<{ sent: number }> {
  const state = api.getState()
  if (actor.role === 'anaesthetist') return refuse('notAllowed', 'Only the demo controls Xero.')
  if (on) {
    if (!xeroAvailable(state)) return refuse('alreadyOn', 'Xero is already unavailable')
    mutate(api, actor, { entityType: 'settings', entityId: 'demo', action: 'xero.outageStarted', after: { sinceISO: clockISO(state.clock) } }, (s) => ({
      settings: { ...s.settings, xeroOutage: { sinceISO: clockISO(s.clock) } },
    }))
    return ok({ sent: 0 })
  }
  if (xeroAvailable(state)) return refuse('notOn', 'Xero is connected')
  mutate(api, actor, { entityType: 'settings', entityId: 'demo', action: 'xero.outageEnded', before: { sinceISO: state.settings.xeroOutage?.sinceISO } }, (s) => {
    const { xeroOutage: _gone, ...rest } = s.settings
    return { settings: rest }
  })
  return ok({ sent: processXeroQueue(api, { force: true }).sent })
}

export interface ProcessResult {
  attempted: number
  sent: number
  failed: number
}

/** Run one item's own idempotent handler against Xero. A refusal returns its reason; the item then stays open as a failed attempt. */
function runHandler(api: AppStoreApi, item: XeroQueueItem): string | undefined {
  const t = item.target
  switch (item.kind) {
    case 'handoff': {
      if (t.pairId === undefined) return 'No pair to hand off'
      const out = createXeroPair(api, t.pairId)
      return out.ok ? undefined : out.message
    }
    case 'journal': {
      if (t.transferId === undefined) return 'No transfer to post'
      const out = createTransferJournal(api, t.transferId)
      return out.ok ? undefined : out.message
    }
    case 'paymentSync': {
      const payment = t.xeroPaymentId !== undefined ? api.getState().xero.payments[t.xeroPaymentId] : undefined
      if (payment === undefined) return 'The payment is no longer in Xero'
      const out = receivePayment(api, { accRecId: payment.accRecId, amount: payment.amount, idempotencyKey: payment.idempotencyKey, source: 'webhook', atISO: payment.atISO })
      return out.ok ? undefined : out.message
    }
    case 'disbursementSync': {
      const bill = t.xeroDisbursementId !== undefined ? api.getState().xero.disbursements[t.xeroDisbursementId] : undefined
      if (bill === undefined) return 'The bill payment is no longer in Xero'
      const out = recordDisbursement(api, {
        ...(bill.accPayId !== undefined ? { accPayId: bill.accPayId } : {}),
        ...(bill.transferId !== undefined ? { transferId: bill.transferId } : {}),
        xeroDisbursementId: bill.id,
        amount: bill.amount,
        atISO: bill.atISO,
        idempotencyKey: bill.idempotencyKey,
        detectedBy: 'webhook',
        payablesRunId: bill.payablesRunId,
      })
      return out.ok ? undefined : out.message
    }
    case 'poll':
      runReconciliationPoll(api)
      return undefined
  }
}

/** One failed attempt: count it, back off, alert from the fifth. */
function recordFailure(api: AppStoreApi, item: XeroQueueItem, error: string): void {
  const metas: MutationMeta[] = []
  mutate(api, XERO_QUEUE_ACTOR, metas, (s) => {
    const now = s.billing.xeroQueue[item.id]
    if (now === undefined) {
      metas.push({ entityType: 'xeroQueueItem', entityId: item.id, action: 'xero.retryFailed', after: { missing: true } })
      return {}
    }
    const attempts = now.attempts + 1
    const atISO = clockISO(s.clock)
    const alerted = isAlerted(attempts)
    const next: XeroQueueItem = { ...now, attempts, nextAttemptAtISO: nextAttemptISO(atISO, attempts), lastError: error, status: alerted ? 'alerted' : 'waiting' }
    metas.push({ entityType: 'xeroQueueItem', entityId: item.id, action: 'xero.retryFailed', after: { kind: now.kind, attempts, nextAttemptAtISO: next.nextAttemptAtISO, lastError: error } })
    if (alerted && now.status !== 'alerted') metas.push({ entityType: 'xeroQueueItem', entityId: item.id, action: 'xero.retryAlert', after: { kind: now.kind, attempts } })
    return { billing: { ...s.billing, xeroQueue: { ...s.billing.xeroQueue, [item.id]: next } } }
  })
}

function markSent(api: AppStoreApi, item: XeroQueueItem, note?: string): void {
  mutate(api, XERO_QUEUE_ACTOR, { entityType: 'xeroQueueItem', entityId: item.id, action: 'xero.queueSent', after: { kind: item.kind, attempts: item.attempts + 1, idempotencyKey: item.idempotencyKey, ...(note !== undefined ? { note } : {}) } }, (s) => {
    const now = s.billing.xeroQueue[item.id]
    if (now === undefined) return {}
    const { lastError: _cleared, ...rest } = now
    return { billing: { ...s.billing, xeroQueue: { ...s.billing.xeroQueue, [item.id]: { ...rest, attempts: now.attempts + 1, status: 'sent', sentAtISO: clockISO(s.clock) } } } }
  })
}

/**
 * Work the queue: the due items (or every open item, `force`; or one,
 * `itemId`), in id order, one attempt each. Returns what it did; with nothing
 * due it neither mutates nor audits.
 */
export function processXeroQueue(api: AppStoreApi, opts: { force?: boolean; itemId?: string } = {}): ProcessResult {
  const state = api.getState()
  const nowISO = clockISO(state.clock)
  const items = openXeroQueueItems(state).filter((q) => (opts.itemId !== undefined ? q.id === opts.itemId : opts.force === true || isDue(q, nowISO)))
  const result: ProcessResult = { attempted: 0, sent: 0, failed: 0 }
  for (const queued of items) {
    // Re-read: an earlier item's handler (a poll) may have changed this one.
    const item = api.getState().billing.xeroQueue[queued.id]
    if (item === undefined || item.status === 'sent') continue
    result.attempted += 1
    if (!xeroAvailable(api.getState())) {
      recordFailure(api, item, XERO_OUTAGE_ERROR)
      result.failed += 1
      continue
    }
    const refused = runHandler(api, item)
    if (refused !== undefined) {
      // Xero answered but the call could not complete (a target gone, an amount above what was released): it stays open,
      // counts as a problem and alerts after five tries, rather than reading as sent.
      recordFailure(api, item, refused)
      result.failed += 1
      continue
    }
    markSent(api, item)
    result.sent += 1
  }
  return result
}

/** The office's "Retry now" on a queue row: one attempt at once (it fails again while Xero is down). */
export function retryXeroItemNow(api: AppStoreApi, actor: Actor, itemId: string): Outcome<ProcessResult> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can retry a Xero call.')
  const item = api.getState().billing.xeroQueue[itemId]
  if (item === undefined) return refuse('notFound', 'Queue item not found.')
  if (item.status === 'sent') return refuse('alreadySent', 'Already sent to Xero.')
  return ok(processXeroQueue(api, { itemId }))
}

/** Subscribe the queue to every demo-clock change. Call once at bootstrap (both builds); returns the unsubscribe. */
export function wireXeroQueue(api: AppStoreApi): () => void {
  return onAppEvent((event) => {
    if (event.type === 'clockAdvanced') processXeroQueue(api)
  })
}
