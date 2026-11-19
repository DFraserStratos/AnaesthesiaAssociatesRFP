/**
 * The Ledger's demo bodies (catch-up Phase 36): the "Inject unmatched receipt"
 * trigger and the PWA's "Office runs this week's payment cycle" stand-in
 * (39a). Badged demo-only on
 * their surfaces; each acts through the product's own store actions.
 */

import { ANAE } from '../domain/seed'
import { drSurname, formatCurrency } from '../shared/format'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { anaesthetistLedgerPosition, heldUnmatchedReceipts } from './ledgerSelectors'
import { OFFICE_CYCLE_COPY, officeRunsCycleRefusal, runThisWeeksCycle } from './payablesActions'
import { paymentWeekFor } from './paymentCycleActions'
import { recordUnmatchedReceipt } from './paymentActions'
import { ok, refuse, type Outcome } from './mutate'

/** The bank-feed notification the trigger simulates: $120.00 that matches no invoice number. */
export const UNMATCHED_RECEIPT_DEMO = {
  amount: 120,
  /** Its bank reference names Dr Souter: the receipt counts in her ledger until it is cleared. */
  namesSouter: { id: 'souter', label: 'Names Dr Souter', reference: 'Bank deposit · SOUTER JULY', anaesthetistId: ANAE.souter },
  /** Its bank reference names no one: it counts only in the whole ledger. */
  namesNoOne: { id: 'none', label: 'Names no one', reference: 'Bank deposit · JULY' },
} as const

export const RESOLVE_HELD_FIRST = 'Resolve the held receipt first'

/** Disabled while a receipt is held (one at a time keeps the beat legible). */
export function injectUnmatchedRefusal(state: Pick<AppState, 'billing'>): string | null {
  return heldUnmatchedReceipts(state).length > 0 ? RESOLVE_HELD_FIRST : null
}

/** A bank deposit for $120.00 that matches no invoice, by the Xero webhook; key `UNMATCHED-DEMO-<n>`, never reused. */
export function injectUnmatchedReceipt(api: AppStoreApi, choiceId: string | undefined): Outcome<{ id: string; message: string }> {
  const refusal = injectUnmatchedRefusal(api.getState())
  if (refusal !== null) return refuse('held', refusal)
  const named = choiceId !== UNMATCHED_RECEIPT_DEMO.namesNoOne.id
  const n = Object.keys(api.getState().billing.unmatchedReceipts).length + 1
  const out = recordUnmatchedReceipt(api, {
    amount: UNMATCHED_RECEIPT_DEMO.amount,
    reference: named ? UNMATCHED_RECEIPT_DEMO.namesSouter.reference : UNMATCHED_RECEIPT_DEMO.namesNoOne.reference,
    idempotencyKey: `UNMATCHED-DEMO-${n}`,
    source: 'webhook',
    ...(named ? { anaesthetistId: UNMATCHED_RECEIPT_DEMO.namesSouter.anaesthetistId } : {}),
  })
  if (!out.ok) return out
  const amount = formatCurrency(UNMATCHED_RECEIPT_DEMO.amount)
  return ok({
    id: out.value.id,
    message: named
      ? `A ${amount} deposit naming Dr Souter matched no invoice. The ledger is out of balance by ${amount} and Dr Souter is on the out-of-balance list.`
      : `A ${amount} deposit matched no invoice. The ledger is out of balance by ${amount}; it names no anaesthetist.`,
  })
}

/**
 * The PWA stand-in's refusal (catch-up Phase 39a): nothing due to the
 * persona's anaesthetist, or the week's close raised an anomaly only the
 * office can sort out.
 */
export function officeRunsWeeksCycleRefusal(state: Pick<AppState, 'billing' | 'xero' | 'masters' | 'schedule' | 'clock' | 'appSettings'>, anaesthetistId: string = ANAE.souter): string | null {
  const cycle = officeRunsCycleRefusal(state)
  if (cycle === OFFICE_CYCLE_COPY.anomaly) return cycle
  return anaesthetistLedgerPosition(state, anaesthetistId).dueNow > 0 && cycle === null ? null : OFFICE_CYCLE_COPY.nothingDue
}

/**
 * Stands in for the office running this week's payment cycle (catch-up Phase
 * 39a): close the week, approve its BCTIs, send the schedule, and the
 * accountant pays it in Xero; the engine records each payment when Xero
 * reports it. The message names the week and what Dr Souter was paid.
 */
export function officeRunsWeeksCycle(api: AppStoreApi, anaesthetistId: string = ANAE.souter): Outcome<{ message: string }> {
  const refusal = officeRunsWeeksCycleRefusal(api.getState(), anaesthetistId)
  if (refusal !== null) return refuse(refusal === OFFICE_CYCLE_COPY.anomaly ? 'anomaliesOpen' : 'nothingDue', refusal)
  const before = anaesthetistLedgerPosition(api.getState(), anaesthetistId).paidOut
  const out = runThisWeeksCycle(api, OFFICE_SIMULATION_ACTOR)
  if (!out.ok) return out
  const state = api.getState()
  const paid = Math.round((anaesthetistLedgerPosition(state, anaesthetistId).paidOut - before) * 100) / 100
  const name = drSurname(state.masters.anaesthetists[anaesthetistId]?.name ?? anaesthetistId)
  const week = paymentWeekFor(state, out.value.payablesRunId) ?? 'this week'
  return ok({ message: `The office ran ${week}'s payment cycle and the accountant paid it in Xero: ${formatCurrency(paid)} to ${name}, recorded from Xero's bill-paid webhook. Paid out rises by it; it leaves Outstanding and shows under GST this month.` })
}
