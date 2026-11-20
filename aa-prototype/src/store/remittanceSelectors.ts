/**
 * The payment run's documents as the screens read them (catch-up Phase 39a;
 * US-10.2.5, US-10.2.7): the payment schedule the office sends the
 * accountant, each anaesthetist's remittance advice (the run washed up: every
 * BCTI paid, every negative netted, the net and where it went), and the list
 * of an anaesthetist's advices for web Accounts. The figures come from the
 * pure `paymentSchedule` and `remittanceAdvice` over the frozen run; the store
 * only supplies detection (from the ledger), names, numbers and the masked
 * account. No NHI, no patient detail beyond the payer the BCTI carries.
 */

import type { AnaesthetistId, InvoiceSupplier, IsoDateTime, PayablesRun } from '../domain/types'
import { supplierFor } from '../domain/billing/invoicePresentation'
import { paymentSchedule, remittanceAdvice, type PaymentScheduleRow, type RemittanceAdvice } from '../domain/billing/payablesRun'
import { cycleLabel, cycleRangeLabel } from '../domain/billing/paymentCycle'
import { toCents } from '../domain/billing/money'
import type { AppState } from './appStore'
import { accPayOfLine, destinationMaskedFor, lineDetection, negativeOpenAmount } from './paymentCycleActions'
import { disbursementsByPair, heldRunByPair } from './indexes'

/** The ledger reads; Xero's batch payment and credit allocations only where the caller passes Xero (the Admin document; web money views read the ledger alone, US-08.3.2). */
type DocState = Pick<AppState, 'billing' | 'masters'> & Partial<Pick<AppState, 'xero'>>

export interface PaymentScheduleView {
  run: PayablesRun
  week: string
  rows: (PaymentScheduleRow & { name: string })[]
  bctiCount: number
  positives: number
  netted: number
  total: number
  sentAtISO?: IsoDateTime
}

/** The Tuesday schedule for a run (absent before the run is approved: nothing is frozen yet). */
export function paymentScheduleFor(state: DocState, runId: string): PaymentScheduleView | undefined {
  const run = state.billing.payablesRuns[runId]
  if (run === undefined) return undefined
  const s = paymentSchedule(run, (id) => destinationMaskedFor(state, id))
  return {
    run,
    week: cycleLabel(run),
    rows: s.rows.map((r) => ({ ...r, name: state.masters.anaesthetists[r.anaesthetistId]?.name ?? r.anaesthetistId })),
    bctiCount: s.bctiCount,
    positives: s.positives,
    netted: s.netted,
    total: s.total,
    ...(run.scheduledAtISO !== undefined ? { sentAtISO: run.scheduledAtISO } : {}),
  }
}

export interface RemittanceNettingView {
  negativeInvoiceId: string
  /** `CN-2026-0001-P`. */
  number: string
  /** The invoice the credit reversed. */
  creditOf: string
  amount: number
}

export interface RemittanceAdviceView extends Omit<RemittanceAdvice, 'netted'> {
  run: PayablesRun
  /** `RA-2026-W30-41267`: a derived reference, shown on the document. */
  reference: string
  week: string
  weekRange: string
  anaesthetistName: string
  /** The anaesthetist as the document's supplier (22's block), AA its agent. */
  supplier?: InvoiceSupplier
  hpiId?: string
  gstNumber?: string
  /** The masked account it was paid to, or null when none is on file. */
  paidTo: string | null
  /** The batch payment date, once Xero has paid. */
  paidOnISO?: IsoDateTime
  batchPaymentId?: string
  /** What Xero allocated of the negatives (the credit side). */
  creditAllocated: number
  netted: RemittanceNettingView[]
}

/** One anaesthetist's remittance advice for a run, or undefined when they are not in it. */
export function remittanceAdviceFor(state: DocState, runId: string, anaesthetistId: AnaesthetistId): RemittanceAdviceView | undefined {
  const run = state.billing.payablesRuns[runId]
  if (run === undefined) return undefined
  const advice = remittanceAdvice(run, anaesthetistId, (pairId) => {
    const line = run.lines.find((l) => l.pairId === pairId)!
    return lineDetection(state, run, line)
  })
  if (advice === null) return undefined
  const a = state.masters.anaesthetists[anaesthetistId]
  const batch = Object.values(state.xero?.batchPayments ?? {}).find((b) => b.payablesRunId === runId && b.anaesthetistId === anaesthetistId)
  // The ACCPAYs this anaesthetist's lines pay: the credit Xero allocated against them in this run.
  const bills = new Set(run.lines.filter((l) => l.anaesthetistId === anaesthetistId).map((l) => accPayOfLine(state, l)).filter((id): id is string => id !== undefined))
  const allocated = Object.values(state.xero?.creditAllocations ?? {}).filter((x) => x.payablesRunId === runId && bills.has(x.accPayId))
  const paidOn = batch?.atISO ?? (advice.status === 'paid' ? advice.lines.reduce<string | undefined>((m, l) => (l.detection.state === 'paid' && (m === undefined || l.detection.atISO > m) ? l.detection.atISO : m), undefined) : undefined)
  return {
    ...advice,
    run,
    reference: `RA-${run.cycleId}-${anaesthetistId}`,
    week: cycleLabel(run),
    weekRange: cycleRangeLabel(run),
    anaesthetistName: a?.name ?? anaesthetistId,
    ...(a !== undefined ? { supplier: supplierFor(a) } : {}),
    ...(a?.hpiId !== undefined ? { hpiId: a.hpiId } : {}),
    ...(a?.gstNumber !== undefined && a.gstNumber !== '' ? { gstNumber: a.gstNumber } : {}),
    paidTo: destinationMaskedFor(state, anaesthetistId),
    ...(paidOn !== undefined ? { paidOnISO: paidOn } : {}),
    ...(batch !== undefined ? { batchPaymentId: batch.id } : {}),
    creditAllocated: allocated.reduce((n, x) => n + toCents(x.amount), 0) / 100,
    netted: advice.netted.map((n) => {
      const neg = state.billing.negativeInvoices[n.negativeInvoiceId]
      const original = neg !== undefined ? state.billing.invoices[neg.originalInvoiceId] : undefined
      return { negativeInvoiceId: n.negativeInvoiceId, number: neg?.number ?? n.negativeInvoiceId, creditOf: original?.invoiceNumber ?? '', amount: n.amount }
    }),
  }
}

export interface RemittanceRow {
  runId: string
  week: string
  cycleId: string
  paidOnISO?: IsoDateTime
  bctis: number
  netted: number
  net: number
  status: 'paid' | 'awaitingXero'
}

/** An anaesthetist's remittance advices, newest first: every approved run (week or staged) they are paid in. */
export function remittancesFor(state: DocState, anaesthetistId: AnaesthetistId): RemittanceRow[] {
  const rows: RemittanceRow[] = []
  for (const run of Object.values(state.billing.payablesRuns)) {
    if (run.status === 'closed' || run.status === 'superseded' || run.approvedAtISO === undefined) continue
    const view = remittanceAdviceFor(state, run.id, anaesthetistId)
    if (view === undefined) continue
    rows.push({ runId: run.id, week: view.week, cycleId: run.cycleId, ...(view.paidOnISO !== undefined ? { paidOnISO: view.paidOnISO } : {}), bctis: view.lines.length, netted: view.nettedTotal, net: view.net, status: view.status })
  }
  return rows.sort((a, b) => (b.paidOnISO ?? '9999').localeCompare(a.paidOnISO ?? '9999') || b.runId.localeCompare(a.runId, 'en', { numeric: true }))
}

/** What an anaesthetist still has to net: their open negative invoices (OQ-71: with no later payment, AA settles it outside the system). */
export function stillToNetFor(state: Pick<AppState, 'billing'>, anaesthetistId: AnaesthetistId): number {
  let cents = 0
  for (const n of Object.values(state.billing.negativeInvoices)) if (n.anaesthetistId === anaesthetistId && n.status === 'toNet') cents += toCents(negativeOpenAmount(state, n.id))
  return cents / 100
}

export interface PaymentWeekRow {
  runId: string
  /** "Week 30", or undefined for a payout no run the app knows paid. */
  week?: string
  /** Cash paid out in this run. */
  paid: number
  /** Settled by netting a negative invoice in this run. */
  netted: number
  atISO: IsoDateTime
}

/** The week of every payment on one payable (a pair's, or a transfer's): cash and netting grouped by the run that paid them (US-10.2.7's first criterion). */
export function paymentWeeksForPair(state: Pick<AppState, 'billing'>, pairId: string): PaymentWeekRow[] {
  const byRun = new Map<string, PaymentWeekRow>()
  const row = (runId: string, atISO: string): PaymentWeekRow => {
    const r = byRun.get(runId) ?? { runId, ...(state.billing.payablesRuns[runId] !== undefined ? { week: cycleLabel(state.billing.payablesRuns[runId]!) } : {}), paid: 0, netted: 0, atISO }
    if (atISO > r.atISO) r.atISO = atISO
    byRun.set(runId, r)
    return r
  }
  // Indexed (a row reads this per payable): the pair's own payouts; nettings are few, scanned.
  for (const d of disbursementsByPair(state.billing.disbursements).get(pairId) ?? []) row(d.payablesRunId, d.atISO).paid += toCents(d.amount)
  for (const n of Object.values(state.billing.negativeInvoices)) for (const x of n.nettings ?? []) if (x.pairId === pairId) row(x.runId, x.atISO).netted += toCents(x.amount)
  return [...byRun.values()].map((r) => ({ ...r, paid: r.paid / 100, netted: r.netted / 100 })).sort((a, b) => a.atISO.localeCompare(b.atISO))
}

/** The week a payable was last held out of a run ("Week 30"), or undefined: web Payments' quiet note (the anomaly itself is the office's). */
export function heldOutRunFor(state: Pick<AppState, 'billing'>, pairId: string): string | undefined {
  const held = heldRunByPair(state.billing.payablesRuns).get(pairId)
  const run = held !== undefined ? state.billing.payablesRuns[held.id] : undefined
  return run !== undefined ? cycleLabel(run) : undefined
}

/** The runs an anaesthetist is in, newest first (the Admin Ledger's Payment runs card). */
export function runsForAnaesthetist(state: Pick<AppState, 'billing'>, anaesthetistId: AnaesthetistId): PayablesRun[] {
  return Object.values(state.billing.payablesRuns)
    .filter((r) => r.status !== 'superseded' && r.byAnaesthetist.some((t) => t.anaesthetistId === anaesthetistId))
    .sort((a, b) => b.closedAtISO.localeCompare(a.closedAtISO) || b.id.localeCompare(a.id, 'en', { numeric: true }))
}
