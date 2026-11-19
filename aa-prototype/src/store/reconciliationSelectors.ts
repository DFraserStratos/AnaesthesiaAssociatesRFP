/**
 * The reconciliation checks (catch-up Phase 37; US-13.2.4, DM-67): one data
 * table of what should balance, each row computed from the same selectors the
 * Ledger, the Billing monitor and the Xero simulator's Bank reconciliation
 * show, so the numbers never disagree. `reconciliationStatus` (pure, in
 * `domain/billing/reconciliation.ts`) turns them into one status. Nothing here
 * is stored.
 *
 * Built: the ledger's own equation, the ledger against the Xero mirror, and
 * Xero's unmatched bank lines. Not modelled, because they wait on the posting
 * design (Greg and Sam's process maps, 2026-11-10): a clearing account, the
 * sub-ledger against control account checks and a bank feed. A later change
 * adds a row to `RECONCILIATION_CHECKS`, not code elsewhere. AA's own fee money
 * stays outside, as in the ledger (Phase 36).
 *
 * Reads Xero's bank lines straight from state: the engine never imports the
 * Xero simulation (`domain/xeroSim/scopeFence.test.ts`).
 */

import { roundToCents, toCents } from '../domain/billing/money'
import { reconciliationStatus, type ReconciliationCheck, type ReconciliationStatus, type UnresolvedItem } from '../domain/billing/reconciliation'
import type { XeroBankLine } from '../domain/types'
import type { AppState } from './appStore'
import { clockISO } from './mutate'
import { heldUnmatchedReceipts, ledgerPositionOf, openXeroDivergences, xeroQueueView } from './ledgerSelectors'

type ReconState = Pick<AppState, 'billing' | 'xero' | 'clock'>

/** Lines still unmatched in Xero's bank reconciliation (the office handles them in Xero), with their remittance's date and reference. */
export function unmatchedBankLines(state: Pick<AppState, 'xero'>): (XeroBankLine & { receivedAtISO: string; reference: string })[] {
  return Object.values(state.xero.bankLines)
    .filter((l) => l.status === 'unmatched')
    .map((l) => {
      const r = state.xero.remittances[l.remittanceId]
      return { ...l, receivedAtISO: r?.receivedAtISO ?? '', reference: r?.reference ?? '' }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}

const sum = (items: readonly UnresolvedItem[]): number => roundToCents(items.reduce((n, i) => n + toCents(i.amount), 0) / 100)

/** The ledger: its equation (Phase 36), and receipts held because they matched no invoice. */
function ledgerCheck(state: ReconState): Omit<ReconciliationCheck, 'id' | 'label'> {
  const items: UnresolvedItem[] = heldUnmatchedReceipts(state).map((r) => ({
    id: r.id,
    label: `Unmatched receipt ${r.reference !== '' ? `"${r.reference}"` : r.id}`,
    amount: r.amount,
    sinceISO: r.atISO,
    source: 'unmatchedReceipt',
  }))
  return { difference: ledgerPositionOf(state).imbalance, items }
}

/**
 * The ledger against the Xero mirror: every call still waiting in the Xero
 * sync queue (a pair not yet in Xero, a payment or bill payment not yet
 * synced), and every change made directly in Xero that the poll flagged. A
 * pair the seed never handed off (24's range beat) has no queue item and is
 * not counted.
 */
function ledgerAgainstXeroCheck(state: ReconState): Omit<ReconciliationCheck, 'id' | 'label'> {
  const queued: UnresolvedItem[] = []
  for (const row of xeroQueueView(state).open) {
    const q = row.item
    let amount = 0
    if (q.kind === 'handoff' && row.pairId !== undefined) amount = state.billing.ledger[row.pairId]?.receivable.amount ?? 0
    else if (q.kind === 'journal' && q.target.transferId !== undefined) amount = state.billing.transfers[q.target.transferId]?.in.amount ?? 0
    // A credit's correction (catch-up Phase 39): the credit note's total waits to reach Xero.
    else if (q.kind === 'correction' && q.target.creditNoteId !== undefined) amount = state.billing.creditNotes[q.target.creditNoteId]?.total ?? 0
    else if (q.kind === 'paymentSync' && q.target.xeroPaymentId !== undefined) amount = state.xero.payments[q.target.xeroPaymentId]?.amount ?? 0
    else if (q.kind === 'disbursementSync' && q.target.xeroDisbursementId !== undefined) amount = state.xero.disbursements[q.target.xeroDisbursementId]?.amount ?? 0
    else continue // the poll itself moves no money
    queued.push({ id: q.id, label: `${row.what}: waiting for Xero`, amount, sinceISO: q.enqueuedAtISO, source: 'xeroQueue' })
  }
  const flagged: UnresolvedItem[] = openXeroDivergences(state).map((d) => {
    const number = state.billing.invoices[d.invoiceId]?.invoiceNumber ?? d.invoiceId
    // A payment after the engine's credit (catch-up Phase 39): what Xero took and the ledger never applied.
    const amount = d.kind === 'voidedInXero' ? d.engineHolds.outstanding : d.kind === 'paidAfterCredit' ? d.xeroShows.total : roundToCents(d.engineHolds.amount - d.xeroShows.total)
    const what = d.kind === 'voidedInXero' ? 'voided in Xero' : d.kind === 'paidAfterCredit' ? (d.leg === 'payable' ? 'paid out in Xero after its credit' : 'paid in Xero after its credit') : 'amended in Xero'
    return { id: d.id, label: `${number} ${what}`, amount, sinceISO: d.detectedAtISO, source: 'xeroDivergence' }
  })
  const items = [...queued, ...flagged]
  return { difference: sum(items), items }
}

/** Xero's bank reconciliation: remittance lines Xero's add-on could not match. */
function xeroBankLinesCheck(state: ReconState): Omit<ReconciliationCheck, 'id' | 'label'> {
  const items: UnresolvedItem[] = unmatchedBankLines(state).map((l) => ({
    id: l.id,
    label: `Bank line quoting ${l.quotedReference}`,
    amount: l.amount,
    sinceISO: l.receivedAtISO,
    source: 'bankLine',
  }))
  return { difference: sum(items), items }
}

/** The checked accounts, in AA's words. One row per check: a posting-design change adds a row here. */
export const RECONCILIATION_CHECKS: readonly { id: string; label: string; compute: (state: ReconState) => Omit<ReconciliationCheck, 'id' | 'label'> }[] = [
  { id: 'ledger', label: 'Ledger', compute: ledgerCheck },
  { id: 'ledgerAgainstXero', label: 'Ledger against Xero', compute: ledgerAgainstXeroCheck },
  { id: 'xeroBankLines', label: 'Xero bank lines', compute: xeroBankLinesCheck },
]

export function reconciliationChecksOf(state: ReconState): ReconciliationCheck[] {
  return RECONCILIATION_CHECKS.map((c) => ({ id: c.id, label: c.label, ...c.compute(state) }))
}

/** The status the Admin Day card shows: derived on every read, never stored. */
export function reconciliationStatusOf(state: ReconState): ReconciliationStatus {
  return reconciliationStatus(reconciliationChecksOf(state), clockISO(state.clock))
}
