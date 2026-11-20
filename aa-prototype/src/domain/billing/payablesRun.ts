/**
 * The payment run's maths (catch-up Phase 39a; US-10.2.5, US-10.2.6,
 * US-10.2.7, DM-25). The ONE place a run draft, a hold or a netting is
 * computed. Pure: the store feeds it legs and open negatives from the ledger
 * (never `state.xero`) and writes what it returns.
 *
 * Netting (US-10.2.5): each anaesthetist's open negative invoices, oldest
 * first, are netted against their unheld positive lines, allocated to bills
 * oldest first. A run never pays below zero: what it cannot net stays open
 * for a later cycle, and an anaesthetist with open negatives and no positives
 * is not in the run (OQ-71, answered: AA settles a negative with no later
 * payment outside the system; nothing is built for it).
 */

import type { AnaesthetistId, IsoDate, IsoDateTime, PayablesRunExclusion, PayablesRunLine, PayablesRunNetting, PayeeRef, RunAnaesthetistTotal, RunExclusionReason } from '../types'
import { toCents } from './money'

// ---------------------------------------------------------------------------
// The one standing exclusion point
// ---------------------------------------------------------------------------

/**
 * Why a payable leg is kept out of every run, or null. The ONE standing
 * exclusion point: any later standing hold is added here, never elsewhere. (A
 * check-day hold is a per-cycle decision on the run's line, not an exclusion;
 * a missing bank account is a check-day anomaly, never an exclusion.)
 *
 * 1. `heldInHoldingAccount` (27a; US-06.5.1): a prepaid Booking's collect
 *    payable is to the AA Holding account, and no run takes it. Its
 *    prepayment reaches a run only as the anaesthetist's payable that 27a's
 *    transfer creates, an ordinary line once released.
 */
export function runExclusionFor(input: { payee: PayeeRef }): RunExclusionReason | null {
  if (input.payee.kind === 'holding') return 'heldInHoldingAccount'
  return null
}

// ---------------------------------------------------------------------------
// Building a week's run
// ---------------------------------------------------------------------------

/** One payable leg offered to a run: what the store read from the ledger. */
export interface RunLegInput {
  pairId: string
  kind: 'pair' | 'transfer'
  payee: PayeeRef
  billNumber: string
  receivableInvoiceNumber: string
  serviceDateISO: IsoDate
  payerName: string
  releasedAtISO?: IsoDateTime
  /** Released less paid out less netted less anything in an unsettled run. */
  available: number
  /** Whether a negative can be netted against it (a pair's ACCPAY in Xero). */
  nettable: boolean
}

/** One open negative invoice: what is left of its `recoveryDue` to net (less anything an unsettled run already nets). */
export interface OpenNegative {
  id: string
  anaesthetistId: AnaesthetistId
  issuedAtISO: IsoDateTime
  open: number
}

export interface RunDraft {
  lines: PayablesRunLine[]
  nettings: PayablesRunNetting[]
  byAnaesthetist: RunAnaesthetistTotal[]
  excluded: PayablesRunExclusion[]
}

function lineOrder(a: Pick<PayablesRunLine, 'serviceDateISO' | 'billNumber' | 'pairId'>, b: Pick<PayablesRunLine, 'serviceDateISO' | 'billNumber' | 'pairId'>): number {
  return a.serviceDateISO.localeCompare(b.serviceDateISO) || a.billNumber.localeCompare(b.billNumber, 'en', { numeric: true }) || a.pairId.localeCompare(b.pairId)
}

/**
 * A week's run from the legs and open negatives: the lines (positive amounts
 * only, service date then bill number, tagged `rolledFromRunId` where an
 * earlier cycle held them out), the exclusions with their amounts, then the
 * netting and the totals over the unheld lines. Only anaesthetists with a line
 * appear.
 */
export function buildWeekRun(input: {
  legs: readonly RunLegInput[]
  negatives: readonly OpenNegative[]
  /** Pair id to the run that held it out last (the line rolls into this one). */
  heldEarlier?: ReadonlyMap<string, string>
}): RunDraft {
  const lines: PayablesRunLine[] = []
  const excluded: PayablesRunExclusion[] = []
  for (const leg of input.legs) {
    if (toCents(leg.available) <= 0) continue
    const reason = runExclusionFor({ payee: leg.payee })
    if (reason !== null || leg.payee.kind !== 'anaesthetist') {
      excluded.push({ pairId: leg.pairId, reason: reason ?? 'heldInHoldingAccount', amount: leg.available })
      continue
    }
    const rolledFrom = input.heldEarlier?.get(leg.pairId)
    lines.push({
      pairId: leg.pairId,
      kind: leg.kind,
      anaesthetistId: leg.payee.anaesthetistId,
      billNumber: leg.billNumber,
      receivableInvoiceNumber: leg.receivableInvoiceNumber,
      serviceDateISO: leg.serviceDateISO,
      payerName: leg.payerName,
      ...(leg.releasedAtISO !== undefined ? { releasedAtISO: leg.releasedAtISO } : {}),
      amount: leg.available,
      nettable: leg.nettable,
      ...(rolledFrom !== undefined ? { rolledFromRunId: rolledFrom } : {}),
    })
  }
  lines.sort(lineOrder)
  excluded.sort((a, b) => a.pairId.localeCompare(b.pairId))
  const netted = netNegatives(lines, input.negatives)
  return { lines, excluded, nettings: netted.nettings, byAnaesthetist: netted.byAnaesthetist }
}

/**
 * Mark the held lines (or return them to the run) and recompute the nettings
 * and totals over what is left. A negative whose positives are all held stays
 * open for the next cycle.
 */
export function applyHolds(
  lines: readonly PayablesRunLine[],
  holds: ReadonlyMap<string, NonNullable<PayablesRunLine['heldOut']>>,
  negatives: readonly OpenNegative[],
): Pick<RunDraft, 'lines' | 'nettings' | 'byAnaesthetist'> {
  const next = lines.map((l) => {
    const hold = holds.get(l.pairId)
    if (hold !== undefined) return { ...l, heldOut: hold }
    const { heldOut: _drop, ...rest } = l
    return rest
  })
  const netted = netNegatives(next, negatives)
  return { lines: next, nettings: netted.nettings, byAnaesthetist: netted.byAnaesthetist }
}

/**
 * Net each anaesthetist's open negatives (oldest first, by `issuedAtISO` then
 * id) against their unheld positive lines, allocating to nettable bills oldest
 * first. Never below zero: `net = positives - netted`, `netted <= positives`,
 * and `remainingToNet` is what could not be netted. Exact cents.
 */
export function netNegatives(lines: readonly PayablesRunLine[], negatives: readonly OpenNegative[]): { nettings: PayablesRunNetting[]; byAnaesthetist: RunAnaesthetistTotal[] } {
  const unheld = lines.filter((l) => l.heldOut === undefined).slice().sort(lineOrder)
  const anaesthetists = [...new Set(unheld.map((l) => l.anaesthetistId))].sort()
  const nettings: PayablesRunNetting[] = []
  const byAnaesthetist: RunAnaesthetistTotal[] = []
  for (const a of anaesthetists) {
    const mine = unheld.filter((l) => l.anaesthetistId === a)
    const positives = mine.reduce((n, l) => n + toCents(l.amount), 0)
    // What each nettable bill still has to absorb, in bill order.
    const room = mine.filter((l) => l.nettable).map((l) => ({ pairId: l.pairId, cents: toCents(l.amount) }))
    let nettedCents = 0
    let remainingCents = 0
    const open = negatives
      .filter((n) => n.anaesthetistId === a && toCents(n.open) > 0)
      .slice()
      .sort((x, y) => x.issuedAtISO.localeCompare(y.issuedAtISO) || x.id.localeCompare(y.id))
    for (const neg of open) {
      let want = toCents(neg.open)
      const allocations: { pairId: string; amount: number }[] = []
      for (const r of room) {
        if (want === 0) break
        if (r.cents === 0) continue
        const take = Math.min(r.cents, want)
        r.cents -= take
        want -= take
        allocations.push({ pairId: r.pairId, amount: take / 100 })
      }
      const took = toCents(neg.open) - want
      nettedCents += took
      remainingCents += want
      if (took > 0) nettings.push({ negativeInvoiceId: neg.id, anaesthetistId: a, amount: took / 100, allocations })
    }
    byAnaesthetist.push({
      anaesthetistId: a,
      bctiCount: mine.length,
      positives: positives / 100,
      netted: nettedCents / 100,
      net: (positives - nettedCents) / 100,
      remainingToNet: remainingCents / 100,
    })
  }
  return { nettings, byAnaesthetist }
}

// ---------------------------------------------------------------------------
// The documents: the payment schedule and the remittance advice
// ---------------------------------------------------------------------------

/** The run fields the documents read. */
export interface RunForDocuments {
  lines: readonly PayablesRunLine[]
  nettings: readonly PayablesRunNetting[]
  byAnaesthetist: readonly RunAnaesthetistTotal[]
}

export interface PaymentScheduleRow {
  anaesthetistId: AnaesthetistId
  bctiCount: number
  positives: number
  netted: number
  net: number
  /** The masked bank account, or null when none is on file. */
  destinationMasked: string | null
}

/** The schedule the office sends the accountant (US-10.2.7's Tuesday step): one row per anaesthetist and the total, from the frozen run. */
export function paymentSchedule(run: RunForDocuments, destinationOf: (anaesthetistId: AnaesthetistId) => string | null): { rows: PaymentScheduleRow[]; bctiCount: number; positives: number; netted: number; total: number } {
  const rows = run.byAnaesthetist.map((t) => ({ anaesthetistId: t.anaesthetistId, bctiCount: t.bctiCount, positives: t.positives, netted: t.netted, net: t.net, destinationMasked: destinationOf(t.anaesthetistId) }))
  const sum = (pick: (r: PaymentScheduleRow) => number) => rows.reduce((n, r) => n + toCents(pick(r)), 0) / 100
  return { rows, bctiCount: rows.reduce((n, r) => n + r.bctiCount, 0), positives: sum((r) => r.positives), netted: sum((r) => r.netted), total: sum((r) => r.net) }
}

/** Whether Xero has reported a line paid (and when). */
export type LineDetection = { state: 'awaitingXero' } | { state: 'paid'; atISO: IsoDateTime }

export interface RemittanceLine {
  pairId: string
  billNumber: string
  invoiceNumber: string
  serviceDateISO: IsoDate
  payerName: string
  amount: number
  detection: LineDetection
}

export interface RemittanceNetting {
  negativeInvoiceId: string
  amount: number
}

export interface RemittanceAdvice {
  anaesthetistId: AnaesthetistId
  lines: RemittanceLine[]
  netted: RemittanceNetting[]
  positives: number
  nettedTotal: number
  net: number
  /** Only when non-zero: what this run could not net, left for a later run. */
  remainingToNet: number
  /** Paid when every line is detected paid. */
  status: 'paid' | 'awaitingXero'
}

/**
 * One anaesthetist's remittance advice for a run (US-10.2.5: "the run washed
 * up"): every BCTI paid, every negative netted, the net, anything still to
 * net. Held lines are not on it. Detection is passed in by the store.
 */
export function remittanceAdvice(run: RunForDocuments, anaesthetistId: AnaesthetistId, detection: (pairId: string) => LineDetection): RemittanceAdvice | null {
  const total = run.byAnaesthetist.find((t) => t.anaesthetistId === anaesthetistId)
  if (total === undefined) return null
  const lines = run.lines
    .filter((l) => l.anaesthetistId === anaesthetistId && l.heldOut === undefined)
    .slice()
    .sort(lineOrder)
    .map((l) => ({ pairId: l.pairId, billNumber: l.billNumber, invoiceNumber: l.receivableInvoiceNumber, serviceDateISO: l.serviceDateISO, payerName: l.payerName, amount: l.amount, detection: detection(l.pairId) }))
  const netted = run.nettings.filter((n) => n.anaesthetistId === anaesthetistId).map((n) => ({ negativeInvoiceId: n.negativeInvoiceId, amount: n.amount }))
  return {
    anaesthetistId,
    lines,
    netted,
    positives: total.positives,
    nettedTotal: total.netted,
    net: total.net,
    remainingToNet: total.remainingToNet,
    status: lines.every((l) => l.detection.state === 'paid') ? 'paid' : 'awaitingXero',
  }
}
