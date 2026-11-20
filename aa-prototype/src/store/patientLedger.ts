/**
 * A patient's invoice rows as the balance rules read them (catch-up Phase 40;
 * US-11.3.1, US-11.3.2, US-13.2.2): 36's patient position rows (`patientLedgerPosition`'s), each
 * with the credit 39 holds for its payer and the billed party's name. Read
 * through the ledger selectors only, never `state.xero`, and never a second
 * copy of the ledger's arithmetic. Kept apart from `patientSelectors.ts` so
 * the warning facts (`warnings.ts`) can read it without an import cycle.
 */

import type { PatientBalanceRow } from '../domain/patients'
import type { AppState } from './appStore'
import { patientPosition } from '../domain/billing/ledger'
import { pairsByPatient } from './indexes'
import { counterpartyName } from './selectors'

export type PatientLedgerState = Pick<AppState, 'billing' | 'schedule' | 'masters'>

/** The billed party's name through the one counterparty resolver (hospital, insurer, organisation, party, payer); never an id. */
function billedToName(state: PatientLedgerState, invoiceId: string, billedTo: PatientBalanceRow['billedTo']): string | undefined {
  const invoice = state.billing.invoices[invoiceId]
  const named = invoice?.billedTo?.name
  if (named !== undefined) return named
  const name = counterpartyName(state, billedTo, invoice?.bookingId)
  return name === billedTo.id ? undefined : name
}

/** Every invoice row of the patient, across every anaesthetist and every payer, oldest first. */
export function patientBalanceRows(state: PatientLedgerState, patientId: string): PatientBalanceRow[] {
  // 36's patient position over the patient's own pairs (43's index), the same rows `patientLedgerPosition` reads.
  return patientPosition(pairsByPatient(state.billing.ledger).get(patientId) ?? [], patientId).rows.map((row) => {
    const pair = state.billing.ledger[row.pairId]
    const creditHeld = pair !== undefined && pair.kind !== 'aaFee' ? (pair.credit?.heldForPayer ?? 0) : 0
    const name = billedToName(state, row.invoiceId, row.billedTo)
    return {
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      bookingId: row.bookingId,
      billedTo: row.billedTo,
      raisedAtISO: row.raisedAtISO,
      total: row.total,
      outstanding: row.outstanding,
      status: row.status,
      creditHeld,
      ...(row.anaesthetistId !== undefined ? { anaesthetistId: row.anaesthetistId } : {}),
      ...(name !== undefined ? { billedToName: name } : {}),
    }
  })
}
