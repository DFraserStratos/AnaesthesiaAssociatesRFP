/**
 * Simulates Xero's bank reconciliation and remittance add-on. The Billing
 * Engine never calls this; see US-10.2.4 (bulk remittance stays in Xero).
 *
 * Catch-up Phase 37: one hospital remittance pays several receivables in one
 * deposit. The add-on matches each line to an ACCREC by its exact stored
 * InvoiceNumber, for no more than that ACCREC's balance; what it cannot match
 * stays unmatched in Xero's bank reconciliation for the office to handle
 * there. Only `store/xeroSimActions.ts` and the Xero simulator UI import this
 * folder (`scopeFence.test.ts`). Pure, deterministic.
 */

import type { XeroAccRec } from '../types'
import { toCents } from '../billing/money'

/** One line of a remittance advice: the invoice number the payer quoted and the amount paid. */
export interface RemittanceLineInput {
  lineId: string
  quotedReference: string
  amount: number
}

export interface RemittanceMatch {
  lineId: string
  accRecId: string
  amount: number
}

export interface RemittanceMatchResult {
  matched: RemittanceMatch[]
  unmatched: string[]
}

/**
 * Match each line on an exact InvoiceNumber with an amount at or below that
 * ACCREC's balance. A voided ACCREC is never matched; a line matches at most
 * one ACCREC and an ACCREC at most one line of the remittance.
 */
export function matchRemittanceLines(lines: readonly RemittanceLineInput[], accRecsForContact: readonly XeroAccRec[]): RemittanceMatchResult {
  const byNumber = new Map<string, XeroAccRec>()
  for (const r of [...accRecsForContact].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!byNumber.has(r.invoiceNumber)) byNumber.set(r.invoiceNumber, r)
  }
  const used = new Set<string>()
  const matched: RemittanceMatch[] = []
  const unmatched: string[] = []
  for (const line of lines) {
    const rec = byNumber.get(line.quotedReference)
    const balance = rec === undefined ? 0 : toCents(rec.amountDue) - toCents(rec.amountReceived)
    const amount = toCents(line.amount)
    if (rec === undefined || rec.status === 'voided' || used.has(rec.id) || amount <= 0 || amount > balance) {
      unmatched.push(line.lineId)
      continue
    }
    used.add(rec.id)
    matched.push({ lineId: line.lineId, accRecId: rec.id, amount: amount / 100 })
  }
  return { matched, unmatched }
}
