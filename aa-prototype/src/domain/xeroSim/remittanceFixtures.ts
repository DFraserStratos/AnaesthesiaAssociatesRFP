/**
 * The seeded bulk remittance (catch-up Phase 37; US-10.2.4). Simulates a
 * hospital's remittance advice arriving in Xero; the Billing Engine never
 * reads this (see `remittance.ts` and `scopeFence.test.ts`).
 *
 * St George's settles aged invoices in one deposit: two of Dr Souter's
 * backdrop receivables quoted exactly (`oa01`, `oa03`), and a third line for
 * `oa04`'s amount quoting its number with the digits transposed, so Xero's
 * add-on cannot match it and it waits in bank reconciliation for the office.
 * `oa07` (Mitchell) is deliberately not on it. Lines are resolved from the
 * seed's stable history ACCREC ids at run time, never typed amounts.
 */

import type { PaymentIn, XeroAccRec } from '../types'
import { toCents } from '../billing/money'
import type { RemittanceLineInput } from './remittance'

export interface RemittanceFixtureLine {
  /** A stable line key within the fixture. */
  key: string
  /** The seeded ACCREC whose balance this line pays. */
  accRecId: string
  /** What the payer quoted: the exact InvoiceNumber, or a mistyped one. */
  quote: { exact: true } | { mistyped: string }
}

export interface RemittanceFixture {
  /** Shown as the remittance's reference. */
  reference: string
  lines: readonly RemittanceFixtureLine[]
}

/** Dr Souter's backdrop (domain/seed/history.ts): oa01, oa03, oa04 are XRH01, XRH03, XRH04; oa07 Mitchell is XRH07. */
export const ST_GEORGES_REMITTANCE: RemittanceFixture = {
  reference: "St George's remittance 21 Jul",
  lines: [
    { key: 'L1', accRecId: 'XRH01', quote: { exact: true } },
    { key: 'L2', accRecId: 'XRH03', quote: { exact: true } },
    // AA-2026-H04 quoted with its digits transposed.
    { key: 'L3', accRecId: 'XRH04', quote: { mistyped: 'AA-2026-H40' } },
  ],
}

export interface ResolvedRemittance {
  payerContactId: string
  lines: (RemittanceLineInput & { key: string; accRecId: string })[]
}

/**
 * Resolve a fixture against Xero's ACCRECs: each line's quoted reference and
 * amount (the ACCREC's open balance). Refuses (a reason) when an ACCREC is
 * missing, voided, already holds a payment in Xero, or the lines do not share
 * one contact.
 */
export function resolveRemittance(
  fixture: RemittanceFixture,
  xero: { accRecs: Readonly<Record<string, XeroAccRec>>; payments: Readonly<Record<string, PaymentIn>> },
): { ok: true; value: ResolvedRemittance } | { ok: false; reason: string } {
  const { accRecs } = xero
  const paymentOn = new Set(Object.values(xero.payments).map((p) => p.accRecId))
  const lines: ResolvedRemittance['lines'] = []
  let contact: string | undefined
  for (const line of fixture.lines) {
    const rec = accRecs[line.accRecId]
    if (rec === undefined) return { ok: false, reason: `No invoice ${line.accRecId} in Xero` }
    if (rec.status === 'voided') return { ok: false, reason: `${rec.invoiceNumber} is voided in Xero` }
    if (toCents(rec.amountReceived) > 0 || paymentOn.has(rec.id)) return { ok: false, reason: `${rec.invoiceNumber} already has a payment applied` }
    if (contact !== undefined && rec.contactId !== contact) return { ok: false, reason: 'The remittance lines name different payers' }
    contact = rec.contactId
    lines.push({
      key: line.key,
      lineId: line.key,
      accRecId: rec.id,
      quotedReference: 'exact' in line.quote ? rec.invoiceNumber : line.quote.mistyped,
      amount: (toCents(rec.amountDue) - toCents(rec.amountReceived)) / 100,
    })
  }
  if (contact === undefined) return { ok: false, reason: 'The remittance has no lines' }
  return { ok: true, value: { payerContactId: contact, lines } }
}
