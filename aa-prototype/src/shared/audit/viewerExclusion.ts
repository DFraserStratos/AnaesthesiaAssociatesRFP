/**
 * The audit viewer's carve-out (catch-up Phase 39; US-13.5.2, DM-45): credit
 * notes are audited, payments are not. Money moving (payments, receipts,
 * disbursements, AA fee payments and payouts) is recorded in Xero, so these
 * actions are kept out of the Audit viewer and entity History. The store's
 * record keeps every entry (the ledger and the demo read it): this list only
 * filters what the two surfaces show. Master data, Contract, time-entry and
 * credit-note actions stay audited. Pure.
 */

import type { AuditEntry } from '../../domain/types'

/** The action keys the Audit viewer and entity History leave out: every action that records money moving. */
export const AUDIT_VIEWER_EXCLUDED: readonly string[] = [
  // Money in (Phase 10, catch-up Phases 36 and 37): a payment detected, landed in Xero, recorded in the ledger.
  'xero.paymentReceived',
  'xero.paymentLanded',
  'ledger.receiptRecorded',
  'ledger.receiptNoop',
  // The payable released as money comes in (the ACCPAY authorised; a transferred prepayment released).
  'xero.accpayAuthorised',
  'prepayment.transferReleased',
  // Money out (catch-up Phase 37): the bill paid in Xero, and the engine's record of the payout.
  'xero.disbursed',
  'ledger.disbursed',
  'ledger.disburseNoop',
  // Receipts that matched no invoice, and the office allocating or refunding them (catch-up Phase 36).
  'ledger.unmatchedReceipt',
  'ledger.unmatchedAllocated',
  'ledger.unmatchedRefunded',
  'ledger.allocationNoop',
  // Bulk remittance matched in Xero's bank reconciliation (catch-up Phase 37; US-10.2.4).
  'xero.remittanceReceived',
  'xero.bankLineMatched',
  'xero.bankLineUnmatched',
  // AA's monthly fee paid by the anaesthetist (catch-up Phase 16).
  'aaFee.paymentRecorded',
]

const EXCLUDED = new Set(AUDIT_VIEWER_EXCLUDED)

/** Whether the Audit viewer and entity History show this entry. */
export function shownInAuditViewer(entry: Pick<AuditEntry, 'action'>): boolean {
  return !EXCLUDED.has(entry.action)
}

/** The entries the Audit viewer and entity History show (filtering only; nothing is removed from the store). */
export function auditViewerEntries<T extends Pick<AuditEntry, 'action'>>(entries: readonly T[]): T[] {
  return entries.filter(shownInAuditViewer)
}
