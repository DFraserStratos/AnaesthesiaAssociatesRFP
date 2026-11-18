/**
 * The Ledger's demo bodies (catch-up Phase 36): the "Inject unmatched receipt"
 * trigger and the PWA's "Office runs payables" stand-in. Badged demo-only on
 * their surfaces; each acts through the product's own store actions.
 */

import { ANAE } from '../domain/seed'
import { drSurname, formatCurrency } from '../shared/format'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { anaesthetistLedgerPosition, heldUnmatchedReceipts } from './ledgerSelectors'
import { runPayables } from './payablesActions'
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

/** The PWA stand-in's refusal: nothing due to the persona's anaesthetist. */
export function officeRunsPayablesRefusal(state: Pick<AppState, 'billing'>, anaesthetistId: string = ANAE.souter): string | null {
  return anaesthetistLedgerPosition(state, anaesthetistId).dueNow > 0 ? null : 'Nothing due to pay out'
}

/** Stands in for the office's payables run, for the phone's anaesthetist only: pays out what is due to them. */
export function officeRunsPayables(api: AppStoreApi, anaesthetistId: string = ANAE.souter): Outcome<{ message: string }> {
  const refusal = officeRunsPayablesRefusal(api.getState(), anaesthetistId)
  if (refusal !== null) return refuse('nothingDue', refusal)
  const out = runPayables(api, OFFICE_SIMULATION_ACTOR, { anaesthetistId })
  if (!out.ok) return out
  const name = drSurname(api.getState().masters.anaesthetists[anaesthetistId]?.name ?? anaesthetistId)
  return ok({ message: `The office paid out ${formatCurrency(out.value.totalDisbursed)} to ${name}. Paid out rises by it.` })
}
