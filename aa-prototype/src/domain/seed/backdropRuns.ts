/**
 * Backdrop weekly payment runs (catch-up Phase 39a; US-10.2.7): every payout
 * a backdrop builds (Dr Souter's seeded history, "Seed a month of BCTIs", the
 * "Stage a payment week" fixture) belongs to a run, one per ISO week of its
 * payment dates, so every payment has a run, a week and a remittance advice.
 * Pure: the lines and totals come from `buildWeekRun` over the paid legs
 * (never typed-in figures), the days from the cycle setting, ids from a
 * namespace (`PRH01`, `XBPH01`, `BNKH001` for the seed). It moves no money:
 * it only names each payout's run, adds Xero's batch payments and writes the
 * bank download line of every payment.
 */

import type { BankLine, BookingLedgerPair, Disbursement, Invoice, LedgerDisbursement, PayablesRun, PaymentCycleSettings, PaymentIn, XeroAccPay, XeroAccRec, XeroBatchPayment } from '../types'
import { cycleFor } from '../billing/paymentCycle'
import { buildWeekRun, type RunLegInput } from '../billing/payablesRun'
import { roundToCents } from '../billing/money'

/** Who the backdrop runs name as closing, approving and scheduling them. */
export const SEEDED_OFFICE = { who: 'Office (seeded)', role: 'office' as const }

export interface BackdropRunsInput {
  /** Run and batch-payment id namespace (`H` for the seed). */
  ns: string
  settings: PaymentCycleSettings
  ledger: Readonly<Record<string, BookingLedgerPair>>
  invoices: Readonly<Record<string, Pick<Invoice, 'id' | 'billedTo' | 'counterparty'>>>
  /** The payer's display name for a pair (the invoice's addressee). */
  payerNameOf: (pair: BookingLedgerPair) => string
  /** The List date of a pair (its service date). */
  serviceDateOf: (pair: BookingLedgerPair) => string
  ledgerDisbursements: Readonly<Record<string, LedgerDisbursement>>
  xeroDisbursements: Readonly<Record<string, Disbursement>>
  accPays: Readonly<Record<string, Pick<XeroAccPay, 'contactId'>>>
  /** Mark the runs `seeded` (the app's seed), or not (a demo fixture). */
  seeded: boolean
}

export interface BackdropRuns {
  runs: Record<string, PayablesRun>
  /** The payouts with their run named. */
  ledgerDisbursements: Record<string, LedgerDisbursement>
  xeroDisbursements: Record<string, Disbursement>
  batchPayments: Record<string, XeroBatchPayment>
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

/** Group the payouts into one paid week run per ISO week of their dates, oldest first. */
export function backdropRunsFor(input: BackdropRunsInput): BackdropRuns {
  const byWeek = new Map<string, LedgerDisbursement[]>()
  for (const d of Object.values(input.ledgerDisbursements).sort((a, b) => a.atISO.localeCompare(b.atISO) || a.id.localeCompare(b.id))) {
    const week = cycleFor(d.atISO, input.settings).cycleId
    byWeek.set(week, [...(byWeek.get(week) ?? []), d])
  }
  const runs: Record<string, PayablesRun> = {}
  const ledgerDisbursements: Record<string, LedgerDisbursement> = { ...input.ledgerDisbursements }
  const xeroDisbursements: Record<string, Disbursement> = { ...input.xeroDisbursements }
  const batchPayments: Record<string, XeroBatchPayment> = {}
  let r = 0
  let b = 0
  for (const [cycleId, paid] of [...byWeek.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
    r += 1
    const runId = `PR${input.ns}${pad(r)}`
    const cycle = cycleFor(paid[0]!.atISO, input.settings)
    const legs: RunLegInput[] = []
    for (const d of paid) {
      const pair = input.ledger[d.pairId]
      if (pair === undefined || pair.payable === undefined) continue
      legs.push({
        pairId: pair.id,
        kind: 'pair',
        payee: pair.payable.payee,
        billNumber: pair.payable.number,
        receivableInvoiceNumber: pair.receivable.number,
        serviceDateISO: input.serviceDateOf(pair),
        payerName: input.payerNameOf(pair),
        ...(pair.receivable.paidInAtISO !== undefined ? { releasedAtISO: pair.receivable.paidInAtISO } : {}),
        available: d.amount,
        nettable: pair.payable.xeroAccPayId !== undefined,
      })
    }
    const draft = buildWeekRun({ legs, negatives: [] })
    const firstDay = paid[0]!.atISO.slice(0, 10)
    const at = `${firstDay}T08:00:00`
    const total = roundToCents(draft.byAnaesthetist.reduce((n, t) => n + t.net, 0))
    runs[runId] = {
      id: runId,
      kind: 'week',
      cycleId,
      isoYear: cycle.isoYear,
      isoWeek: cycle.isoWeek,
      weekStartISO: cycle.weekStartISO,
      weekEndISO: cycle.weekEndISO,
      status: 'paid',
      closedAtISO: at,
      closedBy: SEEDED_OFFICE,
      // The ledger at close for a backdrop week: what the run paid was due and held, nothing else recorded.
      snapshot: { atISO: at, receiptsHeld: total, payablesDue: total, recoveryDue: 0, imbalance: 0, byAnaesthetist: draft.byAnaesthetist.map((t) => ({ anaesthetistId: t.anaesthetistId, payablesDue: t.net, recoveryDue: 0 })) },
      anomalies: [],
      lines: draft.lines,
      nettings: [],
      byAnaesthetist: draft.byAnaesthetist,
      excluded: [],
      approvedAtISO: at,
      approvedBy: SEEDED_OFFICE,
      scheduledAtISO: at,
      scheduledBy: SEEDED_OFFICE,
      sentToXeroAtISO: at,
      paidAtISO: paid.reduce((m, d) => (d.atISO > m ? d.atISO : m), paid[0]!.atISO),
      ...(input.seeded ? { seeded: true as const } : {}),
    }
    for (const d of paid) {
      ledgerDisbursements[d.id] = { ...d, payablesRunId: runId }
      if (d.xeroDisbursementId !== undefined && xeroDisbursements[d.xeroDisbursementId] !== undefined) xeroDisbursements[d.xeroDisbursementId] = { ...xeroDisbursements[d.xeroDisbursementId]!, payablesRunId: runId }
    }
    // One batch payment per anaesthetist for the run's cash, carrying its bill payments.
    for (const t of draft.byAnaesthetist) {
      const bills = paid.filter((d) => d.anaesthetistId === t.anaesthetistId && d.xeroDisbursementId !== undefined && xeroDisbursements[d.xeroDisbursementId] !== undefined)
      if (bills.length === 0) continue
      b += 1
      const id = `XBP${input.ns}${pad(b)}`
      const first = xeroDisbursements[bills[0]!.xeroDisbursementId!]!
      const contactId = first.accPayId !== undefined ? (input.accPays[first.accPayId]?.contactId ?? '') : ''
      batchPayments[id] = { id, contactId, anaesthetistId: t.anaesthetistId, payablesRunId: runId, cycleId, total: t.net, atISO: runs[runId]!.paidAtISO!, billPaymentIds: bills.map((d) => d.xeroDisbursementId!) }
      for (const d of bills) xeroDisbursements[d.xeroDisbursementId!] = { ...xeroDisbursements[d.xeroDisbursementId!]!, batchPaymentId: id }
    }
  }
  return { runs, ledgerDisbursements, xeroDisbursements, batchPayments }
}

/** The bank download line of every payment Xero holds (each seeded receipt, and a missed webhook's money, already in the bank). */
export function backdropBankLines(ns: string, payments: Readonly<Record<string, PaymentIn>>, accRecs: Readonly<Record<string, Pick<XeroAccRec, 'invoiceNumber' | 'kind'>>>): Record<string, BankLine> {
  const out: Record<string, BankLine> = {}
  let n = 0
  for (const p of Object.values(payments).sort((a, b) => a.atISO.localeCompare(b.atISO) || a.id.localeCompare(b.id))) {
    const rec = accRecs[p.accRecId]
    // AA's own fee payments go to its own account, not the trust account the cycle reconciles.
    if (rec === undefined || rec.kind === 'aaFee' || p.source === 'aaFee') continue
    n += 1
    const id = `BNK${ns}${pad(n, 3)}`
    out[id] = { id, dateISO: p.atISO.slice(0, 10), amount: p.amount, reference: rec.invoiceNumber, xeroPaymentId: p.id }
  }
  return out
}
