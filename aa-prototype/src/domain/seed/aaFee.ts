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
 * each computed through `bctiRecordsOf` (the seeded ledger's payable legs),
 * `bctisFor` and `aaFeeFor` (never typed-in totals), each an `aaFee` ledger
 * pair (catch-up Phase 36) mirrored by an `aaFee` ACCREC against her existing
 * payee contact, with no payable and no ACCPAY. July stays uninvoiced so the first live
 * run has a month to raise. Ids use an H namespace disjoint from the runtime
 * counters (`AF####`, `AA-FEE-2026-####`).
 */

import type { AaFeeInvoice, AaFeeSettings, LedgerPair, LedgerReceipt, PaymentIn, XeroAccRec } from '../types'
import { aaFeeAccRecFor, buildAaFeeInvoice } from '../billing/aaFee'
import { BCTI_COUNT_RULE, bctiFeeHistory, bctisFor } from '../billing/bcti'
import { applyReceipt, bctiRecordsOf, gstComponentOf } from '../billing/ledger'
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
  { n: 'H01', monthISO: '2026-09', raisedAtISO: '2026-10-05T09:00:00', paidAtISO: '2026-10-09T10:00:00' },
  { n: 'H02', monthISO: '2026-10', raisedAtISO: '2026-11-04T09:00:00' },
]

export interface SeedAaFeeHistory {
  aaFeeInvoices: Record<string, AaFeeInvoice>
  ledger: Record<string, LedgerPair>
  receipts: Record<string, LedgerReceipt>
  accRecs: Record<string, XeroAccRec>
  payments: Record<string, PaymentIn>
}

/** Dr Souter's seeded fee invoices, counted over the seeded ledger. */
export function buildSeedAaFeeHistory(
  ledger: Readonly<Record<string, LedgerPair>>,
  contactIdCache: Record<string, string>,
  settings: AaFeeSettings,
): SeedAaFeeHistory {
  const out: SeedAaFeeHistory = { aaFeeInvoices: {}, ledger: {}, receipts: {}, accRecs: {}, payments: {} }
  const anaesthetistId = ANAE.souter
  const contactId = contactIdCache[`anaesthetist:${anaesthetistId}`]
  if (contactId === undefined) return out
  const records = bctiRecordsOf(Object.values(ledger))

  for (const row of SOUTER_FEE_HISTORY) {
    const built = buildAaFeeInvoice({
      id: `AF${row.n}`,
      invoiceNumber: `AA-FEE-2026-${row.n}`,
      ledgerPairId: `HBCF${row.n.slice(1)}`,
      anaesthetistId,
      monthISO: row.monthISO,
      settings,
      counted: bctisFor(records, anaesthetistId, row.monthISO, BCTI_COUNT_RULE, bctiFeeHistory(Object.values(out.aaFeeInvoices), anaesthetistId)),
      raisedAtISO: row.raisedAtISO,
      raisedBy: 'scheduled',
    })
    const invoice = built.invoice
    const accRecId = `XRF${row.n}`
    let pair = { ...built.pair, receivable: { ...built.pair.receivable, xeroAccRecId: accRecId } }
    if (row.paidAtISO !== undefined) {
      pair = applyReceipt(pair, invoice.total, row.paidAtISO).pair
      out.receipts[`RCTF${row.n}`] = {
        id: `RCTF${row.n}`,
        pairId: pair.id,
        pairKind: 'aaFee',
        accRecId,
        grossAmount: invoice.total,
        gstAmount: gstComponentOf(invoice.total),
        atISO: row.paidAtISO,
        idempotencyKey: `SEED-AAFEE-${row.n}`,
        source: 'aaFee',
      }
      out.payments[`PMTF${row.n}`] = {
        id: `PMTF${row.n}`,
        accRecId,
        amount: invoice.total,
        atISO: row.paidAtISO,
        idempotencyKey: `SEED-AAFEE-${row.n}`,
        source: 'aaFee',
      }
    }
    out.aaFeeInvoices[invoice.id] = invoice
    out.ledger[pair.id] = pair
    out.accRecs[accRecId] = aaFeeAccRecFor(invoice, pair, { accRecId, contactId, issuedAtISO: row.raisedAtISO })
  }
  return out
}
