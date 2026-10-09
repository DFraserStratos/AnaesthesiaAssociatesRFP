/**
 * The BCTI count (catch-up Phase 16; FT-10.3, US-10.3.1). AA's monthly fee
 * charges per buyer-created tax invoice (BCTI), and BCTIs are counted HERE and
 * nowhere else, over the one record list the store's `bctiRecords` builds.
 *
 * The rules, in one place:
 *  - One BCTI per receivable invoice: its ACCPAY, of the same value as the
 *    receivable (the transcript's "per transaction"). Whether it should be one
 *    per procedure is still open with AA's accountant (OQ-29).
 *  - Each counted once, against the anaesthetist who did the procedure (the
 *    ACCPAY's stored `anaesthetistId`; OQ-60's recommendation), so a Booking
 *    moved between anaesthetists is never charged twice.
 *  - Only once paid: a BCTI counts once its receivable is paid in full, in the
 *    calendar month it was paid (Greg's 2026-10-02 view, OQ-60 part 2).
 *    Being confirmed with AA's accountant: flip `paidOnly` if it is not. Counting by
 *    the paid month, not the issue month, charges every paid BCTI exactly once,
 *    including one paid after its issue month's run.
 *  - Never missed: a BCTI whose paid month was already invoiced for that
 *    anaesthetist (a current month run to date, or a payment the reconciliation
 *    poll backdates into an invoiced month) counts in the next month not yet
 *    invoiced, and one already charged on a fee invoice never counts again.
 *  - The fee is never netted against payables (Greg, 2026-10-02: trust law).
 *    That is a rule, not a switch: nothing here, or anywhere, deducts it.
 *
 * Pure (convention 9).
 */

import type { AnaesthetistId, IsoDateTime, XeroAccPay, XeroAccRec } from '../types'

export interface BctiRecord {
  /** The ACCPAY: the BCTI itself. */
  accPayId: string
  /** The ACCPAY's number (the receivable's with `-P`). */
  billNumber: string
  receivableInvoiceNumber: string
  /** Who did the procedure: the anaesthetist charged for this BCTI. */
  anaesthetistId: AnaesthetistId
  issuedAtISO: IsoDateTime
  /** Set once the receivable is paid in full. */
  receivablePaidAtISO?: IsoDateTime
  voided: boolean
}

/** The one switch on the count. `paidOnly: false` counts by issue month instead. */
export interface BctiCountRule {
  paidOnly: boolean
}

export const BCTI_COUNT_RULE: BctiCountRule = { paidOnly: true }

/** What the anaesthetist's fee invoices already hold: the BCTIs charged and the months invoiced. */
export interface BctiFeeHistory {
  charged: ReadonlySet<string>
  invoicedMonths: ReadonlySet<string>
}

export const NO_FEE_HISTORY: BctiFeeHistory = { charged: new Set(), invoicedMonths: new Set() }

/** The fee history `bctisFor` needs, from an anaesthetist's fee invoices. */
export function bctiFeeHistory(
  feeInvoices: Iterable<{ anaesthetistId: AnaesthetistId; monthISO: string; bctis: readonly { accPayId: string }[] }>,
  anaesthetistId: AnaesthetistId,
): BctiFeeHistory {
  const charged = new Set<string>()
  const invoicedMonths = new Set<string>()
  for (const f of feeInvoices) {
    if (f.anaesthetistId !== anaesthetistId) continue
    invoicedMonths.add(f.monthISO)
    for (const b of f.bctis) charged.add(b.accPayId)
  }
  return { charged, invoicedMonths }
}

function nextMonth(monthISO: string): string {
  const y = Number(monthISO.slice(0, 4))
  const m = Number(monthISO.slice(5, 7))
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

/** The month a BCTI dated in `monthISO` is charged in: that month, or the next one not yet invoiced. */
function chargeMonth(monthISO: string, invoicedMonths: ReadonlySet<string>): string {
  let month = monthISO
  while (invoicedMonths.has(month)) month = nextMonth(month)
  return month
}

/**
 * The BCTIs charged to `anaesthetistId` for `monthISO` (`YYYY-MM`): theirs,
 * not voided, not already charged, each ACCPAY once, in the paid month (or the
 * issue month with `paidOnly: false`), carried to the next month not yet
 * invoiced when that month already was. Sorted by that date, then ACCPAY id.
 */
export function bctisFor(
  records: readonly BctiRecord[],
  anaesthetistId: AnaesthetistId,
  monthISO: string,
  rule: BctiCountRule = BCTI_COUNT_RULE,
  history: BctiFeeHistory = NO_FEE_HISTORY,
): BctiRecord[] {
  const dateOf = (r: BctiRecord): string | undefined => (rule.paidOnly ? r.receivablePaidAtISO : r.issuedAtISO)
  const seen = new Set<string>()
  const counted: BctiRecord[] = []
  for (const r of records) {
    if (r.anaesthetistId !== anaesthetistId || r.voided || history.charged.has(r.accPayId)) continue
    const at = dateOf(r)
    if (at === undefined || chargeMonth(at.slice(0, 7), history.invoicedMonths) !== monthISO) continue
    if (seen.has(r.accPayId)) continue
    seen.add(r.accPayId)
    counted.push(r)
  }
  return counted.sort((a, b) => (dateOf(a) ?? '').localeCompare(dateOf(b) ?? '') || a.accPayId.localeCompare(b.accPayId))
}

/**
 * The BCTI record list: one record per procedure ACCPAY (the ACCPAY is the
 * BCTI), carrying its stored number, anaesthetist and issue date and its
 * ACCREC's paid date. A pre-payment invoice's ACCPAY is a BCTI too. AA fee
 * ACCRECs have no ACCPAY, so they are never counted. The store's
 * `bctiRecords(state)` is this over the Xero slice; the seed's fee history uses
 * it directly. Later phases that add invoices (22: a Split Contract's two
 * receivables; 36: the ledger's payable legs, with a parity test; 38b:
 * additional invoices; 39: re-issued invoices after a credit; 39b: event
 * invoices) feed this list and never count BCTIs anywhere else.
 */
export function bctiRecordsFrom(xero: {
  accRecs: Readonly<Record<string, XeroAccRec>>
  accPays: Readonly<Record<string, XeroAccPay>>
}): BctiRecord[] {
  const records: BctiRecord[] = []
  for (const pay of Object.values(xero.accPays)) {
    const rec = xero.accRecs[pay.accRecId]
    if (rec === undefined || rec.kind !== 'procedure') continue
    records.push({
      accPayId: pay.id,
      billNumber: pay.invoiceNumber,
      receivableInvoiceNumber: rec.invoiceNumber,
      anaesthetistId: pay.anaesthetistId,
      issuedAtISO: pay.issuedAtISO,
      ...(rec.paidAtISO !== undefined ? { receivablePaidAtISO: rec.paidAtISO } : {}),
      voided: rec.status === 'voided',
    })
  }
  return records.sort((a, b) => a.accPayId.localeCompare(b.accPayId))
}
