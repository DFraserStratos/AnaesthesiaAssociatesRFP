/**
 * AA's fee seed (catch-up Phase 16; US-10.3.3, D1).
 *
 * The sample fee schedule: AA's real fixed charges are still to come from its
 * accountant (OQ-60 part 1; Greg does not know them), so two demo-plausible
 * fixed items and a per-BCTI charge are seeded and labelled as a sample in the
 * UI. Every amount is excluding GST (US-05.2.7). These figures live here and in
 * tests only: the run, the screens and the triggers read `appSettings.aaFee`.
 *
 * Dr Souter's fee history (the only anaesthetist with seeded billing history):
 * May 2026, raised 1 Jun and paid 5 Jun, and June 2026, raised 1 Jul and unpaid,
 * each computed through `bctiRecordsFrom`, `bctisFor` and `aaFeeFor` over the
 * seeded Xero slice (never typed-in totals), with an `aaFee` ACCREC against her
 * existing payee contact and no ACCPAY. July stays uninvoiced so the first live
 * run has a month to raise. Ids use an H namespace disjoint from the runtime
 * counters (`AF####`, `AA-FEE-2026-####`).
 */

import type { AaFeeInvoice, AaFeeSettings, PaymentIn, XeroAccPay, XeroAccRec } from '../types'
import { buildAaFeeInvoice } from '../billing/aaFee'
import { BCTI_COUNT_RULE, bctiFeeHistory, bctiRecordsFrom, bctisFor } from '../billing/bcti'
import { ANAE } from './cast'

export const SAMPLE_AA_FEE_SETTINGS: AaFeeSettings = {
  fixedItems: [
    { id: 'FX1', description: 'Practice management', amount: 350 },
    { id: 'FX2', description: 'Office and reception', amount: 150 },
  ],
  perBctiCharge: 5,
}

interface SeedFeeRow {
  n: string
  monthISO: string
  raisedAtISO: string
  paidAtISO?: string
}

const SOUTER_FEE_HISTORY: SeedFeeRow[] = [
  { n: 'H01', monthISO: '2026-05', raisedAtISO: '2026-06-01T09:00:00', paidAtISO: '2026-06-05T10:00:00' },
  { n: 'H02', monthISO: '2026-06', raisedAtISO: '2026-07-01T09:00:00' },
]

export interface SeedAaFeeHistory {
  aaFeeInvoices: Record<string, AaFeeInvoice>
  accRecs: Record<string, XeroAccRec>
  payments: Record<string, PaymentIn>
}

/** Dr Souter's seeded fee invoices over the seeded Xero slice. */
export function buildSeedAaFeeHistory(
  xero: { accRecs: Record<string, XeroAccRec>; accPays: Record<string, XeroAccPay> },
  contactIdCache: Record<string, string>,
  settings: AaFeeSettings,
): SeedAaFeeHistory {
  const out: SeedAaFeeHistory = { aaFeeInvoices: {}, accRecs: {}, payments: {} }
  const anaesthetistId = ANAE.souter
  const contactId = contactIdCache[`anaesthetist:${anaesthetistId}`]
  if (contactId === undefined) return out
  const records = bctiRecordsFrom(xero)

  for (const row of SOUTER_FEE_HISTORY) {
    const { invoice, accRec } = buildAaFeeInvoice({
      id: `AF${row.n}`,
      invoiceNumber: `AA-FEE-2026-${row.n}`,
      accRecId: `XRF${row.n}`,
      anaesthetistId,
      contactId,
      monthISO: row.monthISO,
      settings,
      counted: bctisFor(records, anaesthetistId, row.monthISO, BCTI_COUNT_RULE, bctiFeeHistory(Object.values(out.aaFeeInvoices), anaesthetistId)),
      raisedAtISO: row.raisedAtISO,
      raisedBy: 'scheduled',
      ...(row.paidAtISO !== undefined ? { paidAtISO: row.paidAtISO } : {}),
    })
    out.aaFeeInvoices[invoice.id] = invoice
    out.accRecs[accRec.id] = accRec
    if (row.paidAtISO !== undefined) {
      out.payments[`PMTF${row.n}`] = {
        id: `PMTF${row.n}`,
        accRecId: accRec.id,
        amount: invoice.total,
        atISO: row.paidAtISO,
        idempotencyKey: `SEED-AAFEE-${row.n}`,
        source: 'aaFee',
      }
    }
  }
  return out
}
