/**
 * The Ledger tab's reads (Phase 64): every anaesthetist's row in one pass, the
 * receipts to place, and the one sentence. The maths is pure, in
 * `domain/billing/ledgerLists.ts`; these feed it from the store.
 */

import { anaesthetistLedgerRows, ledgerSentence, receiptsToPlace, type AnaesthetistLedgerRow, type LedgerSentence, type ReceiptsToPlace } from '../domain/billing/ledgerLists'
import type { XeroQueueItem } from '../domain/types'
import type { ReconciliationStatus } from '../domain/billing/reconciliation'
import { drSurname, surnameOf } from '../shared/format'
import type { AppState } from './appStore'
import { ledgerPositionOf } from './ledgerSelectors'
import { reconciliationStatusOf } from './reconciliationSelectors'

export interface AnaesthetistLedgerRowView extends AnaesthetistLedgerRow {
  /** "Dr Souter". */
  name: string
}

type RowsState = Pick<AppState, 'billing' | 'masters'>

let rowsCache: { ledger: object; transfers: object; unmatched: object; anaesthetists: object; rows: AnaesthetistLedgerRowView[] } | null = null

/**
 * Every anaesthetist in `masters.anaesthetists` with their ledger row, sorted by
 * surname (then full name, then id). One pass over the ledger, memoised on the
 * records it reads.
 */
export function anaesthetistLedgerRowsOf(state: RowsState): AnaesthetistLedgerRowView[] {
  const { ledger, transfers, unmatchedReceipts } = state.billing
  const anaesthetists = state.masters.anaesthetists
  const c = rowsCache
  if (c !== null && c.ledger === ledger && c.transfers === transfers && c.unmatched === unmatchedReceipts && c.anaesthetists === anaesthetists) return c.rows
  const roster = Object.values(anaesthetists).sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)) || a.name.localeCompare(b.name) || a.registrationNumber.localeCompare(b.registrationNumber))
  const ids = roster.map((a) => a.registrationNumber)
  const rows = anaesthetistLedgerRows(Object.values(ledger), transfers, Object.values(unmatchedReceipts), ids).map((row, i) => ({ ...row, name: drSurname(roster[i]!.name) }))
  rowsCache = { ledger, transfers, unmatched: unmatchedReceipts, anaesthetists, rows }
  return rows
}

/** The receipts held because they matched no invoice, oldest first, with their count and total. */
export function receiptsToPlaceOf(state: Pick<AppState, 'billing'>): ReceiptsToPlace {
  return receiptsToPlace(Object.values(state.billing.unmatchedReceipts))
}

/** The Ledger's notice: the Day view's reconciliation status, the ledger's imbalance and how many accounts are out of balance. */
export function ledgerSentenceOf(state: Pick<AppState, 'billing' | 'xero' | 'clock' | 'masters'>): LedgerSentence {
  return ledgerSentenceFor(reconciliationStatusOf(state), state)
}

/**
 * The sentence for a status already derived (the Ledger tab passes the Day view's `useReconciliationStatus`,
 * so the tab, the Day view's card and the badge read one status); reads only `billing` and `masters` itself.
 */
export function ledgerSentenceFor(status: ReconciliationStatus, state: Pick<AppState, 'billing' | 'masters'>): LedgerSentence {
  const kinds = new Map<string, XeroQueueItem['kind']>()
  for (const q of Object.values(state.billing.xeroQueue)) kinds.set(q.id, q.kind)
  return ledgerSentence(status, {
    ledgerImbalance: ledgerPositionOf(state).imbalance,
    anaesthetistsOutOfBalance: anaesthetistLedgerRowsOf(state).filter((r) => !r.inBalance).length,
    xeroQueueKinds: kinds,
  })
}
