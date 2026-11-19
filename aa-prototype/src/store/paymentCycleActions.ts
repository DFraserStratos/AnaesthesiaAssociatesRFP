/**
 * The weekly payment cycle (catch-up Phase 39a; US-10.2.7, US-10.2.6,
 * US-10.2.5, DM-25). The office works each week in four steps on the Billing
 * monitor: close the week (snapshot and bank reconciliation), sort out the
 * check day's anomalies (fixed, or held out and rolled into the next week),
 * approve the week's BCTIs, and send the payment schedule to the accountant,
 * who pays it in Xero (`payRunInXero`; D53). Every step is office only, one
 * `mutate()` each, audited on the run. The demo clock never gates a step and
 * the cycle never advances it: each step is taken in order on any day and
 * stamps the clock's actual time beside the planned day from the setting.
 *
 * The run's lines, nettings and totals come from the pure
 * `domain/billing/payablesRun.ts`, fed from the ledger alone (never
 * `state.xero`). A run is frozen at approval; a stale run is superseded and
 * closed afresh, never edited.
 *
 * The approval gate: every path that pays a payable pays only an unheld line
 * of an approved run that has been scheduled (`scheduledLineFor`).
 */

import type { AppSettings } from '../domain/warnings/types'
import type { AnaesthetistId, CycleAnomaly, CycleSnapshot, IsoDateTime, PayablesRun, PayablesRunLine, PaymentCycleSettings } from '../domain/types'
import { anaesthetistPosition, isBookingPair, isHoldingLeg, ledgerPosition, settledOn } from '../domain/billing/ledger'
import { toCents, roundToCents } from '../domain/billing/money'
import { cycleFor, cycleLabel, cycleOfId, nextCycleId, reconcileWeek, weekAnomalies, type PaymentCycle, type ReconcileReceipt } from '../domain/billing/paymentCycle'
import { applyHolds, buildWeekRun, netNegatives, type OpenNegative, type RunDraft, type RunLegInput } from '../domain/billing/payablesRun'
import { defaultPaymentCycleSettings } from '../domain/warnings/settings'
import { maskBankAccount } from '../domain/bankAccount'
import { formatCurrency } from '../shared/format'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { invoiceAddresseeName } from './selectors'

// ---------------------------------------------------------------------------
// Copy (one place)
// ---------------------------------------------------------------------------

export const PAYMENT_CYCLE_COPY = {
  officeOnly: 'Only the AA office runs the payment cycle.',
  nothingToClose: "Nothing is waiting for this week's run.",
  previousWeekOpen: (label: string) => `Finish ${label}'s run first.`,
  notClosed: 'This step is only open while the week is closed.',
  anomaliesOpen: 'Hold out or mark fixed every anomaly first.',
  nothingToApprove: 'Every line is held out: nothing to approve.',
  notApprovedYet: 'Approve the week first.',
  runStale: 'Something changed since this week was closed. Re-close the week.',
  notApproved: 'This payable is not in an approved payment run yet.',
  useRun: 'This bill has a negative netted against it. Pay it with its run.',
  nothingScheduled: 'Nothing scheduled to pay',
  reasonRequired: 'Say why this line is held out.',
  notFound: 'Payment run not found.',
  anomalyNotFound: 'Anomaly not found.',
  lineNotFound: 'That BCTI is not on this run.',
  cannotReclose: 'This run has been sent to Xero: it can no longer be re-closed.',
  rule: 'A released payable is paid only in an approved weekly run.',
} as const

/** The reason a check-day hold records for each anomaly kind. */
export const ANOMALY_LABEL: Record<CycleAnomaly['kind'], string> = {
  receiptNotOnBank: 'Receipt not on the bank download',
  bankAmountDiffers: 'Bank amount differs',
  noBankAccount: 'No bank account on file',
  flaggedByOffice: 'Flagged by the office',
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

type CycleState = Pick<AppState, 'billing' | 'masters' | 'schedule' | 'clock' | 'appSettings'>

export function paymentCycleSettingsOf(state: { appSettings?: Partial<AppSettings> }): PaymentCycleSettings {
  return state.appSettings?.paymentCycle ?? defaultPaymentCycleSettings()
}

const UNSETTLED: ReadonlySet<PayablesRun['status']> = new Set(['closed', 'approved', 'scheduled', 'paying'])

/** Runs whose lines still hold money (not paid, not superseded), in id order. */
export function unsettledRuns(state: Pick<AppState, 'billing'>): PayablesRun[] {
  return Object.values(state.billing.payablesRuns)
    .filter((r) => UNSETTLED.has(r.status))
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
}

/** Every run, newest first (the monitor's list and the Ledger's card). */
export function runsNewestFirst(state: Pick<AppState, 'billing'>): PayablesRun[] {
  return Object.values(state.billing.payablesRuns).sort((a, b) => b.closedAtISO.localeCompare(a.closedAtISO) || b.id.localeCompare(a.id, 'en', { numeric: true }))
}

/** What a run has settled on one line so far, from the ledger: the disbursements and nettings recorded for it. */
export function settledInRun(state: Pick<AppState, 'billing'>, runId: string, pairId: string): number {
  let cents = 0
  for (const d of Object.values(state.billing.disbursements)) if (d.payablesRunId === runId && d.pairId === pairId) cents += toCents(d.amount)
  for (const n of Object.values(state.billing.negativeInvoices)) for (const x of n.nettings ?? []) if (x.runId === runId && x.pairId === pairId) cents += toCents(x.amount)
  return cents / 100
}

/** What unsettled runs (other than `exceptRunId`) still hold of a leg: the anti-double-take rule. */
function inFlightFor(state: Pick<AppState, 'billing'>, pairId: string, exceptRunId?: string): number {
  let cents = 0
  for (const run of unsettledRuns(state)) {
    if (run.id === exceptRunId) continue
    for (const line of run.lines) {
      if (line.pairId !== pairId || line.heldOut !== undefined) continue
      cents += Math.max(0, toCents(line.amount) - toCents(settledInRun(state, run.id, pairId)))
    }
  }
  return cents / 100
}

/** What a run still nets of one negative: its netting less what Xero has reported allocated for it. */
function nettingInFlight(state: Pick<AppState, 'billing'>, negativeInvoiceId: string, exceptRunId?: string): number {
  let cents = 0
  const neg = state.billing.negativeInvoices[negativeInvoiceId]
  for (const run of unsettledRuns(state)) {
    if (run.id === exceptRunId) continue
    for (const n of run.nettings) {
      if (n.negativeInvoiceId !== negativeInvoiceId) continue
      const recorded = (neg?.nettings ?? []).filter((x) => x.runId === run.id).reduce((s, x) => s + toCents(x.amount), 0)
      cents += Math.max(0, toCents(n.amount) - recorded)
    }
  }
  return cents / 100
}

/** A negative invoice's open amount: its `recoveryDue` less what runs have netted (never `amount`; its `offsetAmount` never enters a run). */
export function negativeOpenAmount(state: Pick<AppState, 'billing'>, negativeInvoiceId: string): number {
  const n = state.billing.negativeInvoices[negativeInvoiceId]
  if (n === undefined || n.status === 'offset') return 0
  return roundToCents(n.recoveryDue - (n.nettings ?? []).reduce((s, x) => s + x.amount, 0))
}

/**
 * The open negatives a run may net: 39's `toNet` negative invoices with their
 * ACCPAYCREDIT in Xero (Xero allocates it), less anything an unsettled run
 * already nets. Whatever the credit note's cause and whoever raised it.
 */
export function openNegativesForRun(state: Pick<AppState, 'billing'>, exceptRunId?: string): OpenNegative[] {
  const out: OpenNegative[] = []
  for (const n of Object.values(state.billing.negativeInvoices)) {
    if (n.status !== 'toNet' || n.accPayCreditNoteId === undefined) continue
    const open = roundToCents(negativeOpenAmount(state, n.id) - nettingInFlight(state, n.id, exceptRunId))
    if (toCents(open) > 0) out.push({ id: n.id, anaesthetistId: n.anaesthetistId, issuedAtISO: n.issuedAtISO, open })
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

function serviceDateOf(state: Pick<AppState, 'schedule'>, listId: string, fallbackISO: string): string {
  return state.schedule.lists[listId]?.dateISO ?? fallbackISO.slice(0, 10)
}

function latestReceiptOn(state: Pick<AppState, 'billing'>, pairId: string): IsoDateTime | undefined {
  let latest: string | undefined
  for (const r of Object.values(state.billing.receipts)) if (r.pairId === pairId && (latest === undefined || r.atISO > latest)) latest = r.atISO
  return latest
}

/**
 * Every payable leg the ledger could offer a run, with what is available now
 * (released less paid out less netted less anything an unsettled run other
 * than `exceptRunId` holds). Booking pairs' payables, transfers' `in` legs,
 * and the AA Holding account's collect payables not yet transferred (which
 * `runExclusionFor` keeps out and reports).
 */
export function runLegsFromLedger(state: CycleState, exceptRunId?: string): RunLegInput[] {
  const legs: RunLegInput[] = []
  const transferred = new Set(Object.values(state.billing.transfers).map((t) => t.collectPairId))
  for (const pair of Object.values(state.billing.ledger)) {
    if (!isBookingPair(pair) || pair.payable === undefined) continue
    const p = pair.payable
    if (isHoldingLeg(p) && transferred.has(pair.id)) continue
    const available = isHoldingLeg(p) ? roundToCents(p.releasedAmount - settledOn(p)) : roundToCents(p.releasedAmount - settledOn(p) - inFlightFor(state, pair.id, exceptRunId))
    if (toCents(available) <= 0) continue
    const invoice = state.billing.invoices[pair.invoiceId]
    const released = latestReceiptOn(state, pair.id)
    legs.push({
      pairId: pair.id,
      kind: 'pair',
      payee: p.payee,
      billNumber: p.number,
      receivableInvoiceNumber: pair.receivable.number,
      serviceDateISO: serviceDateOf(state, pair.listId, pair.createdAtISO),
      payerName: invoice !== undefined ? invoiceAddresseeName(state as AppState, invoice) : '',
      ...(released !== undefined ? { releasedAtISO: released } : {}),
      available,
      nettable: p.xeroAccPayId !== undefined,
    })
  }
  for (const t of Object.values(state.billing.transfers)) {
    const available = roundToCents(t.in.releasedAmount - settledOn(t.in) - inFlightFor(state, t.id, exceptRunId))
    if (toCents(available) <= 0) continue
    const collect = state.billing.ledger[t.collectPairId]
    const invoice = state.billing.invoices[t.invoiceId]
    const released = latestReceiptOn(state, t.collectPairId)
    legs.push({
      pairId: t.id,
      kind: 'transfer',
      payee: t.in.payee,
      billNumber: t.in.number,
      receivableInvoiceNumber: collect?.receivable.number ?? t.in.number,
      serviceDateISO: serviceDateOf(state, collect !== undefined && isBookingPair(collect) ? collect.listId : '', t.createdAtISO),
      payerName: invoice !== undefined ? invoiceAddresseeName(state as AppState, invoice) : '',
      ...(released !== undefined ? { releasedAtISO: released } : {}),
      available,
      nettable: false,
    })
  }
  return legs.sort((a, b) => a.pairId.localeCompare(b.pairId))
}

/** Week runs that count for the cycle (not superseded), by cycle id. */
function weekRunsByCycle(state: Pick<AppState, 'billing'>): Map<string, PayablesRun> {
  const m = new Map<string, PayablesRun>()
  for (const r of Object.values(state.billing.payablesRuns)) if (r.kind === 'week' && r.status !== 'superseded') m.set(r.cycleId, r)
  return m
}

/** The latest week run closed before this cycle (the one whose held lines roll into it). */
function previousWeekRun(state: Pick<AppState, 'billing'>, cycleId: string): PayablesRun | undefined {
  return [...weekRunsByCycle(state).values()].filter((r) => r.cycleId < cycleId).sort((a, b) => b.cycleId.localeCompare(a.cycleId))[0]
}

/** The open cycle: the earliest ISO week, from the demo clock's week on, with no week run yet. */
export function openCycle(state: Pick<AppState, 'billing' | 'clock' | 'appSettings'>): PaymentCycle {
  const settings = paymentCycleSettingsOf(state)
  const taken = weekRunsByCycle(state)
  let cycle = cycleFor(state.clock.todayISO, settings)
  while (taken.has(cycle.cycleId)) cycle = cycleOfId(nextCycleId(cycle.cycleId, settings), settings)
  return cycle
}

/** A week run still being worked (closed, approved or scheduled): the next week cannot close until it is sent to Xero. */
export function weekRunInProgress(state: Pick<AppState, 'billing'>): PayablesRun | undefined {
  return Object.values(state.billing.payablesRuns).find((r) => r.kind === 'week' && (r.status === 'closed' || r.status === 'approved' || r.status === 'scheduled'))
}

function heldEarlierFor(state: Pick<AppState, 'billing'>, cycleId: string): Map<string, string> {
  const prev = previousWeekRun(state, cycleId)
  const m = new Map<string, string>()
  if (prev !== undefined) for (const l of prev.lines) if (l.heldOut !== undefined) m.set(l.pairId, prev.id)
  return m
}

/** The open cycle's draft: what is waiting for this week's run, from the ledger alone. */
export function openCycleDraft(state: CycleState, exceptRunId?: string): RunDraft & { cycle: PaymentCycle } {
  const cycle = openCycle(state)
  return { cycle, ...buildWeekRun({ legs: runLegsFromLedger(state, exceptRunId), negatives: openNegativesForRun(state, exceptRunId), heldEarlier: heldEarlierFor(state, cycle.cycleId) }) }
}

/** An anaesthetist's masked bank account, or null when none is on file (26's bank details are display-only; never paid from). */
export function destinationMaskedFor(state: Pick<AppState, 'masters'>, anaesthetistId: AnaesthetistId): string | null {
  const n = state.masters.anaesthetists[anaesthetistId]?.bankAccount?.accountNumber?.trim() ?? ''
  return n === '' ? null : maskBankAccount(n)
}

function snapshotOf(state: CycleState, atISO: string, anaesthetistIds: readonly string[]): CycleSnapshot {
  const pairs = Object.values(state.billing.ledger)
  const unmatched = Object.values(state.billing.unmatchedReceipts)
  const pos = ledgerPosition(pairs, state.billing.transfers, unmatched)
  return {
    atISO,
    receiptsHeld: pos.receiptsHeld,
    payablesDue: pos.payablesDue,
    recoveryDue: pos.recoveryDueFromAnaesthetists,
    imbalance: pos.imbalance,
    byAnaesthetist: anaesthetistIds.map((id) => {
      const a = anaesthetistPosition(pairs, state.billing.transfers, unmatched, id)
      return { anaesthetistId: id, payablesDue: a.dueNow, recoveryDue: a.recoveryDue }
    }),
  }
}

/** The receipts the close reconciles: those on the run's pairs (a transfer's collect pair) recorded since the previous week's close. */
function receiptsToReconcile(state: CycleState, lines: readonly PayablesRunLine[], sinceISO: string | undefined): ReconcileReceipt[] {
  const pairOf = new Map<string, string>()
  for (const l of lines) {
    const collect = l.kind === 'transfer' ? state.billing.transfers[l.pairId]?.collectPairId : l.pairId
    if (collect !== undefined) pairOf.set(collect, l.pairId)
  }
  const out: ReconcileReceipt[] = []
  for (const r of Object.values(state.billing.receipts)) {
    const linePair = pairOf.get(r.pairId)
    if (linePair === undefined || (sinceISO !== undefined && r.atISO <= sinceISO)) continue
    out.push({ receiptId: r.id, pairId: linePair, reference: state.billing.ledger[r.pairId]?.receivable.number ?? '', amount: r.grossAmount, atISO: r.atISO })
  }
  return out
}

/** Build a closed week run for a cycle, as the store would write it (no state change). */
function closedRunFor(state: CycleState, actor: Actor, runId: string, cycle: PaymentCycle, opts: { exceptRunId?: string; carry?: PayablesRun } = {}): PayablesRun {
  const atISO = clockISO(state.clock)
  const draft = buildWeekRun({ legs: runLegsFromLedger(state, opts.exceptRunId), negatives: openNegativesForRun(state, opts.exceptRunId), heldEarlier: heldEarlierFor(state, cycle.cycleId) })
  const prev = previousWeekRun(state, cycle.cycleId)
  const found = reconcileWeek({ receipts: receiptsToReconcile(state, draft.lines, prev?.closedAtISO), bankLines: Object.values(state.billing.bankLines) })
  const missingBank = new Set(draft.lines.map((l) => l.anaesthetistId).filter((a) => destinationMaskedFor(state, a) === null))
  let anomalies = weekAnomalies({ runId, lines: draft.lines, reconciliation: found, missingBank, formatAmount: formatCurrency })
  let lines = draft.lines
  let nettings = draft.nettings
  let byAnaesthetist = draft.byAnaesthetist
  // Re-close: the holds and fixed anomalies that still apply carry over.
  if (opts.carry !== undefined) {
    const sameAnomaly = (a: CycleAnomaly, b: CycleAnomaly) => a.kind === b.kind && a.anaesthetistId === b.anaesthetistId && a.pairIds.join() === b.pairIds.join()
    anomalies = anomalies.map((a) => {
      const was = opts.carry!.anomalies.find((b) => sameAnomaly(a, b))
      return was !== undefined && was.status !== 'open' ? { ...a, status: was.status, ...(was.resolvedAtISO !== undefined ? { resolvedAtISO: was.resolvedAtISO } : {}), ...(was.resolvedBy !== undefined ? { resolvedBy: was.resolvedBy } : {}) } : a
    })
    const holds = new Map<string, NonNullable<PayablesRunLine['heldOut']>>()
    for (const l of opts.carry.lines) if (l.heldOut !== undefined && lines.some((x) => x.pairId === l.pairId)) holds.set(l.pairId, l.heldOut)
    for (const was of opts.carry.anomalies.filter((a) => a.kind === 'flaggedByOffice' && a.pairIds.some((p) => holds.has(p)))) anomalies.push({ ...was, id: `${runId}-A${anomalies.length + 1}` })
    const held = applyHolds(lines, holds, openNegativesForRun(state, opts.exceptRunId))
    lines = held.lines
    nettings = held.nettings
    byAnaesthetist = held.byAnaesthetist
  }
  return {
    id: runId,
    kind: 'week',
    cycleId: cycle.cycleId,
    isoYear: cycle.isoYear,
    isoWeek: cycle.isoWeek,
    weekStartISO: cycle.weekStartISO,
    weekEndISO: cycle.weekEndISO,
    status: 'closed',
    closedAtISO: atISO,
    closedBy: { who: actor.who, role: actor.role },
    snapshot: snapshotOf(state, atISO, [...new Set(lines.map((l) => l.anaesthetistId))].sort()),
    anomalies,
    lines,
    nettings,
    byAnaesthetist,
    excluded: draft.excluded.map((e) => {
      const pair = state.billing.ledger[e.pairId]
      const anaesthetistId = pair !== undefined && isBookingPair(pair) ? pair.anaesthetistId : undefined
      return { ...e, ...(anaesthetistId !== undefined ? { anaesthetistId } : {}) }
    }),
  }
}

/**
 * Why a run no longer matches the ledger, or null: a line's pair credited or
 * no longer able to pay its amount, a new exclusion, or a different netting
 * (a new open negative for an anaesthetist in the run).
 */
export function runStaleness(state: CycleState, run: PayablesRun): string | null {
  if (!(run.status === 'closed' || run.status === 'approved' || run.status === 'scheduled')) return null
  const legs = new Map(runLegsFromLedger(state, run.id).map((l) => [l.pairId, l]))
  for (const line of run.lines) {
    if (line.heldOut !== undefined) continue
    const leg = legs.get(line.pairId)
    if (leg === undefined || leg.payee.kind !== 'anaesthetist' || toCents(leg.available) < toCents(line.amount)) return PAYMENT_CYCLE_COPY.runStale
  }
  if (run.kind === 'staged') return null
  const now = netNegatives(run.lines, openNegativesForRun(state, run.id))
  const key = (n: { negativeInvoiceId: string; amount: number; allocations: { pairId: string; amount: number }[] }) => `${n.negativeInvoiceId}:${toCents(n.amount)}:${n.allocations.map((a) => `${a.pairId}=${toCents(a.amount)}`).join(',')}`
  if (now.nettings.map(key).join('|') !== run.nettings.map(key).join('|')) return PAYMENT_CYCLE_COPY.runStale
  return null
}

/**
 * The approval gate: the scheduled (or paying) run line a payable may be paid
 * on, with what Xero has still to pay on it. Undefined when the payable is
 * not an unheld line of an approved, scheduled run.
 */
export function scheduledLineFor(state: Pick<AppState, 'billing' | 'xero'>, pairId: string): { run: PayablesRun; line: PayablesRunLine } | undefined {
  for (const run of Object.values(state.billing.payablesRuns).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))) {
    if (run.status !== 'scheduled' && run.status !== 'paying') continue
    const line = run.lines.find((l) => l.pairId === pairId && l.heldOut === undefined)
    if (line !== undefined && toCents(xeroUnsentOn(state, run, line)) > 0) return { run, line }
  }
  return undefined
}

/** The ACCPAY a run line pays (a pair's), or none (a transfer). */
export function accPayOfLine(state: Pick<AppState, 'billing'>, line: Pick<PayablesRunLine, 'pairId' | 'kind'>): string | undefined {
  if (line.kind === 'transfer') return undefined
  const pair = state.billing.ledger[line.pairId]
  return pair !== undefined && isBookingPair(pair) ? pair.payable?.xeroAccPayId : undefined
}

/** What Xero has been sent for a run line so far: its bill payments and credit allocations in this run. */
export function xeroSentOn(state: Pick<AppState, 'billing' | 'xero'>, run: Pick<PayablesRun, 'id'>, line: Pick<PayablesRunLine, 'pairId' | 'kind'>): number {
  const accPayId = accPayOfLine(state, line)
  let cents = 0
  for (const d of Object.values(state.xero.disbursements)) {
    if (d.payablesRunId !== run.id) continue
    if ((line.kind === 'transfer' && d.transferId === line.pairId) || (accPayId !== undefined && d.accPayId === accPayId)) cents += toCents(d.amount)
  }
  if (accPayId !== undefined) for (const a of Object.values(state.xero.creditAllocations)) if (a.payablesRunId === run.id && a.accPayId === accPayId) cents += toCents(a.amount)
  return cents / 100
}

function xeroUnsentOn(state: Pick<AppState, 'billing' | 'xero'>, run: PayablesRun, line: PayablesRunLine): number {
  return Math.max(0, roundToCents(line.amount - xeroSentOn(state, run, line)))
}

/** Each unheld line's detection: paid once the engine has recorded all of it (cash and netting), with the latest date. */
export function lineDetection(state: Pick<AppState, 'billing'>, run: PayablesRun, line: PayablesRunLine): { state: 'awaitingXero' } | { state: 'paid'; atISO: IsoDateTime } {
  if (toCents(settledInRun(state, run.id, line.pairId)) < toCents(line.amount)) return { state: 'awaitingXero' }
  let at = run.paidAtISO ?? run.closedAtISO
  for (const d of Object.values(state.billing.disbursements)) if (d.payablesRunId === run.id && d.pairId === line.pairId && d.atISO > at) at = d.atISO
  for (const n of Object.values(state.billing.negativeInvoices)) for (const x of n.nettings ?? []) if (x.runId === run.id && x.pairId === line.pairId && x.atISO > at) at = x.atISO
  return { state: 'paid', atISO: at }
}

/** A run's derived payment state: each unheld line's detection, and whether all are paid. */
export function payablesRunState(state: Pick<AppState, 'billing'>, runId: string): { lines: { pairId: string; detection: ReturnType<typeof lineDetection> }[]; allPaid: boolean } | undefined {
  const run = state.billing.payablesRuns[runId]
  if (run === undefined) return undefined
  const lines = run.lines.filter((l) => l.heldOut === undefined).map((l) => ({ pairId: l.pairId, detection: lineDetection(state, run, l) }))
  return { lines, allPaid: lines.every((l) => l.detection.state === 'paid') }
}

/** "Week 30": the week a payment (disbursement, netting or batch payment) was paid in, from its run. Undefined for a run the app does not know. */
export function paymentWeekFor(state: Pick<AppState, 'billing'>, runId: string | undefined): string | undefined {
  const run = runId !== undefined ? state.billing.payablesRuns[runId] : undefined
  return run !== undefined ? cycleLabel(run) : undefined
}

/**
 * The run completion step (inside the detection `mutate`): every run in
 * `paying` whose unheld lines the ledger has now settled in full becomes
 * `paid`, stamped with the detection's date. Returns the new runs map and
 * the audit metas (source system).
 */
export function completeRunsIn(billing: AppState['billing'], atISO: IsoDateTime): { payablesRuns: AppState['billing']['payablesRuns']; metas: MutationMeta[] } {
  const metas: MutationMeta[] = []
  let runs = billing.payablesRuns
  for (const run of Object.values(billing.payablesRuns)) {
    if (run.status !== 'paying') continue
    const unheld = run.lines.filter((l) => l.heldOut === undefined)
    if (!unheld.every((l) => toCents(settledInRun({ billing }, run.id, l.pairId)) >= toCents(l.amount))) continue
    runs = { ...runs, [run.id]: { ...run, status: 'paid', paidAtISO: atISO } }
    const total = run.byAnaesthetist.reduce((n, t) => n + toCents(t.net), 0) / 100
    metas.push({ entityType: 'payablesRun', entityId: run.id, action: 'payables.runPaid', before: { status: 'paying' }, after: { status: 'paid', week: cycleLabel(run), cycleId: run.cycleId, bctis: unheld.length, paidOut: total } })
  }
  return { payablesRuns: runs, metas }
}

// ---------------------------------------------------------------------------
// The steps (office only, one mutate each)
// ---------------------------------------------------------------------------

function officeOnly(actor: Actor): Outcome<never> | null {
  return actor.role === 'office' ? null : refuse('officeOnly', PAYMENT_CYCLE_COPY.officeOnly)
}

function runTotals(run: Pick<PayablesRun, 'byAnaesthetist' | 'lines'>) {
  const sum = (pick: (t: PayablesRun['byAnaesthetist'][number]) => number) => run.byAnaesthetist.reduce((n, t) => n + toCents(pick(t)), 0) / 100
  return { bctis: run.lines.filter((l) => l.heldOut === undefined).length, held: run.lines.filter((l) => l.heldOut !== undefined).length, positives: sum((t) => t.positives), netted: sum((t) => t.netted), net: sum((t) => t.net), remainingToNet: sum((t) => t.remainingToNet) }
}

/** Friday: close the open week. Snapshots what is released and unpaid, the ledger and the bank reconciliation. */
export function closeWeek(api: AppStoreApi, actor: Actor): Outcome<{ runId: string; cycleId: string; anomalies: number }> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const state = api.getState()
  const inProgress = weekRunInProgress(state)
  if (inProgress !== undefined) return refuse('previousWeekOpen', PAYMENT_CYCLE_COPY.previousWeekOpen(cycleLabel(inProgress)))
  const draft = openCycleDraft(state)
  if (draft.lines.length === 0) return refuse('nothingToClose', PAYMENT_CYCLE_COPY.nothingToClose)
  let runId = ''
  let anomalies = 0
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const allocated = allocateId(s.counters, 'payablesRun')
    runId = allocated.id
    const run = closedRunFor(s, actor, runId, draft.cycle)
    anomalies = run.anomalies.length
    metas.push({ entityType: 'payablesRun', entityId: runId, action: 'payments.weekClosed', after: { week: cycleLabel(run), cycleId: run.cycleId, ...runTotals(run), anomalies: run.anomalies.length, snapshot: run.snapshot } })
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [runId]: run } }, counters: allocated.counters }
  })
  return ok({ runId, cycleId: draft.cycle.cycleId, anomalies })
}

function closedRunOr(state: Pick<AppState, 'billing'>, runId: string): Outcome<PayablesRun> {
  const run = state.billing.payablesRuns[runId]
  if (run === undefined) return refuse('notFound', PAYMENT_CYCLE_COPY.notFound)
  if (run.status !== 'closed' || run.kind !== 'week') return refuse('notClosed', PAYMENT_CYCLE_COPY.notClosed)
  return ok(run)
}

function rehold(state: CycleState, run: PayablesRun, holds: Map<string, NonNullable<PayablesRunLine['heldOut']>>): Pick<PayablesRun, 'lines' | 'nettings' | 'byAnaesthetist'> {
  return applyHolds(run.lines, holds, openNegativesForRun(state, run.id))
}

function holdsOf(run: PayablesRun): Map<string, NonNullable<PayablesRunLine['heldOut']>> {
  return new Map(run.lines.flatMap((l) => (l.heldOut !== undefined ? [[l.pairId, l.heldOut] as const] : [])))
}

/** Check day: hold an anomaly's lines (or one line, with a reason) out of this run. They roll into the next week's run. */
export function holdOutOfRun(api: AppStoreApi, actor: Actor, runId: string, target: { anomalyId: string } | { pairId: string; reason: string }): Outcome<{ held: number }> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const found = closedRunOr(api.getState(), runId)
  if (!found.ok) return found
  const run = found.value
  let pairIds: string[]
  let reason: string
  let anomalyId: string | undefined
  if ('anomalyId' in target) {
    const anomaly = run.anomalies.find((a) => a.id === target.anomalyId)
    if (anomaly === undefined) return refuse('anomalyNotFound', PAYMENT_CYCLE_COPY.anomalyNotFound)
    pairIds = anomaly.pairIds
    reason = ANOMALY_LABEL[anomaly.kind]
    anomalyId = anomaly.id
  } else {
    if (target.reason.trim() === '') return refuse('reasonRequired', PAYMENT_CYCLE_COPY.reasonRequired)
    if (!run.lines.some((l) => l.pairId === target.pairId)) return refuse('lineNotFound', PAYMENT_CYCLE_COPY.lineNotFound)
    pairIds = [target.pairId]
    reason = target.reason.trim()
  }
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const at = clockISO(s.clock)
    const now = s.billing.payablesRuns[runId]!
    let anomalies = now.anomalies
    if (anomalyId === undefined) {
      anomalyId = `${runId}-A${anomalies.length + 1}`
      const line = now.lines.find((l) => l.pairId === pairIds[0])!
      anomalies = [...anomalies, { id: anomalyId, kind: 'flaggedByOffice', pairIds, anaesthetistId: line.anaesthetistId, detail: reason, status: 'heldOut', resolvedAtISO: at, resolvedBy: actor.who }]
    } else {
      anomalies = anomalies.map((a) => (a.id === anomalyId ? { ...a, status: 'heldOut', resolvedAtISO: at, resolvedBy: actor.who } : a))
    }
    const holds = holdsOf(now)
    for (const p of pairIds) holds.set(p, { anomalyId: anomalyId!, reason, atISO: at, by: actor.who })
    const next = { ...now, anomalies, ...rehold(s, now, holds) }
    const line = now.lines.find((l) => pairIds.includes(l.pairId))
    metas.push({ entityType: 'payablesRun', entityId: runId, action: 'payments.lineHeldOut', after: { week: cycleLabel(now), bills: now.lines.filter((l) => pairIds.includes(l.pairId)).map((l) => l.billNumber), reason, anomalyId, rollsInto: cycleLabel({ isoWeek: cycleOfId(nextCycleId(now.cycleId, paymentCycleSettingsOf(s)), paymentCycleSettingsOf(s)).isoWeek }), ...(line !== undefined ? { anaesthetistId: line.anaesthetistId } : {}) } })
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [runId]: next } } }
  })
  return ok({ held: pairIds.length })
}

/** Return a held line to the run (while closed). Its anomaly opens again; an office flag goes. */
export function releaseHold(api: AppStoreApi, actor: Actor, runId: string, pairId: string): Outcome<undefined> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const found = closedRunOr(api.getState(), runId)
  if (!found.ok) return found
  const line = found.value.lines.find((l) => l.pairId === pairId && l.heldOut !== undefined)
  if (line === undefined) return refuse('lineNotFound', PAYMENT_CYCLE_COPY.lineNotFound)
  mutate(api, actor, { entityType: 'payablesRun', entityId: runId, action: 'payments.holdReleased', after: { week: cycleLabel(found.value), bill: line.billNumber } }, (s) => {
    const now = s.billing.payablesRuns[runId]!
    const anomalyId = line.heldOut!.anomalyId
    const holds = holdsOf(now)
    // The anomaly's other lines come back with it: an anomaly is held or not, as a whole.
    const anomaly = now.anomalies.find((a) => a.id === anomalyId)
    for (const p of anomaly?.pairIds ?? [pairId]) holds.delete(p)
    const anomalies = now.anomalies.flatMap((a) => (a.id !== anomalyId ? [a] : a.kind === 'flaggedByOffice' ? [] : [{ id: a.id, kind: a.kind, pairIds: a.pairIds, anaesthetistId: a.anaesthetistId, detail: a.detail, status: 'open' as const }]))
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [runId]: { ...now, anomalies, ...rehold(s, now, holds) } } } }
  })
  return ok(undefined)
}

/** Check day: the office sorted an anomaly out; its lines stay in the run. */
export function markAnomalyFixed(api: AppStoreApi, actor: Actor, runId: string, anomalyId: string): Outcome<undefined> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const found = closedRunOr(api.getState(), runId)
  if (!found.ok) return found
  const anomaly = found.value.anomalies.find((a) => a.id === anomalyId && a.status === 'open')
  if (anomaly === undefined) return refuse('anomalyNotFound', PAYMENT_CYCLE_COPY.anomalyNotFound)
  mutate(api, actor, { entityType: 'payablesRun', entityId: runId, action: 'payments.anomalyFixed', after: { week: cycleLabel(found.value), anomalyId, kind: anomaly.kind, detail: anomaly.detail } }, (s) => {
    const now = s.billing.payablesRuns[runId]!
    const anomalies = now.anomalies.map((a) => (a.id === anomalyId ? { ...a, status: 'fixed' as const, resolvedAtISO: clockISO(s.clock), resolvedBy: actor.who } : a))
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [runId]: { ...now, anomalies } } } }
  })
  return ok(undefined)
}

/** Approve the week's BCTIs (US-10.2.6): the run's lines freeze. Refused while an anomaly is open, when every line is held, or when the run is stale. */
export function approveWeekBctis(api: AppStoreApi, actor: Actor, runId: string): Outcome<undefined> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const state = api.getState()
  const found = closedRunOr(state, runId)
  if (!found.ok) return found
  const run = found.value
  if (run.anomalies.some((a) => a.status === 'open')) return refuse('anomaliesOpen', PAYMENT_CYCLE_COPY.anomaliesOpen)
  if (run.lines.every((l) => l.heldOut !== undefined)) return refuse('nothingToApprove', PAYMENT_CYCLE_COPY.nothingToApprove)
  const stale = runStaleness(state, run)
  if (stale !== null) return refuse('runStale', stale)
  mutate(api, actor, { entityType: 'payablesRun', entityId: runId, action: 'payables.runApproved', before: { status: 'closed' }, after: { status: 'approved', week: cycleLabel(run), ...runTotals(run), byAnaesthetist: run.byAnaesthetist, excluded: run.excluded } }, (s) => {
    const now = s.billing.payablesRuns[runId]!
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [runId]: { ...now, status: 'approved', approvedAtISO: clockISO(s.clock), approvedBy: { who: actor.who, role: actor.role } } } } }
  })
  return ok(undefined)
}

/** Tuesday: send the payment schedule to the accountant (a document on the run; no email). */
export function sendPaymentSchedule(api: AppStoreApi, actor: Actor, runId: string): Outcome<undefined> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const state = api.getState()
  const run = state.billing.payablesRuns[runId]
  if (run === undefined) return refuse('notFound', PAYMENT_CYCLE_COPY.notFound)
  if (run.status !== 'approved') return refuse('notApproved', PAYMENT_CYCLE_COPY.notApprovedYet)
  const stale = runStaleness(state, run)
  if (stale !== null) return refuse('runStale', stale)
  mutate(api, actor, { entityType: 'payablesRun', entityId: runId, action: 'payments.scheduleSent', before: { status: 'approved' }, after: { status: 'scheduled', week: cycleLabel(run), total: runTotals(run).net } }, (s) => {
    const now = s.billing.payablesRuns[runId]!
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [runId]: { ...now, status: 'scheduled', scheduledAtISO: clockISO(s.clock), scheduledBy: { who: actor.who, role: actor.role } } } } }
  })
  return ok(undefined)
}

/** Re-close a stale week: the run is superseded and a fresh one closed for the same week, in one mutate, carrying the holds and fixed anomalies that still apply. */
export function recloseWeek(api: AppStoreApi, actor: Actor, runId: string): Outcome<{ runId: string }> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const state = api.getState()
  const old = state.billing.payablesRuns[runId]
  if (old === undefined) return refuse('notFound', PAYMENT_CYCLE_COPY.notFound)
  if (old.kind !== 'week' || !(old.status === 'closed' || old.status === 'approved' || old.status === 'scheduled')) return refuse('cannotReclose', PAYMENT_CYCLE_COPY.cannotReclose)
  const settings = paymentCycleSettingsOf(state)
  let newId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const allocated = allocateId(s.counters, 'payablesRun')
    newId = allocated.id
    const fresh = closedRunFor(s, actor, newId, cycleOfId(old.cycleId, settings), { exceptRunId: old.id, carry: old })
    metas.push({ entityType: 'payablesRun', entityId: old.id, action: 'payments.runSuperseded', before: { status: old.status }, after: { status: 'superseded', supersededBy: newId, week: cycleLabel(old) } })
    metas.push({ entityType: 'payablesRun', entityId: newId, action: 'payments.weekClosed', after: { week: cycleLabel(fresh), cycleId: fresh.cycleId, ...runTotals(fresh), anomalies: fresh.anomalies.length, snapshot: fresh.snapshot, recloseOf: old.id } })
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [old.id]: { ...old, status: 'superseded', supersededBy: newId }, [newId]: fresh } }, counters: allocated.counters }
  })
  return ok({ runId: newId })
}

/**
 * A one-line staged run for one pair (the demo stand-ins' one-click payouts):
 * closed, approved and scheduled in one mutate, in the demo clock's week. It
 * is not the week's cycle and never closes the week; the week's run never
 * takes what it paid. Refuses a pair already a line in an unsettled run.
 */
export function stagePairRun(api: AppStoreApi, actor: Actor, pairId: string): Outcome<{ runId: string; cycleId: string; amount: number }> {
  const guard = officeOnly(actor)
  if (guard !== null) return guard
  const state = api.getState()
  if (unsettledRuns(state).some((r) => r.lines.some((l) => l.pairId === pairId && l.heldOut === undefined))) return refuse('useRun', 'This payable is already in a payment run. Pay it with its run.')
  const leg = runLegsFromLedger(state).find((l) => l.pairId === pairId)
  if (leg === undefined) return refuse('nothingToApprove', 'Nothing released and unpaid on this payable.')
  if (leg.payee.kind !== 'anaesthetist') return refuse('holdingSystemOnly', 'The AA Holding account is never paid by a payment run.')
  const cycle = cycleFor(state.clock.todayISO, paymentCycleSettingsOf(state))
  let runId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const allocated = allocateId(s.counters, 'payablesRun')
    runId = allocated.id
    const at = clockISO(s.clock)
    const draft = buildWeekRun({ legs: [leg], negatives: [] })
    const by = { who: actor.who, role: actor.role }
    const run: PayablesRun = {
      id: runId,
      kind: 'staged',
      cycleId: cycle.cycleId,
      isoYear: cycle.isoYear,
      isoWeek: cycle.isoWeek,
      weekStartISO: cycle.weekStartISO,
      weekEndISO: cycle.weekEndISO,
      status: 'scheduled',
      closedAtISO: at,
      closedBy: by,
      snapshot: snapshotOf(s, at, draft.lines.map((l) => l.anaesthetistId)),
      anomalies: [],
      lines: draft.lines,
      nettings: [],
      byAnaesthetist: draft.byAnaesthetist,
      excluded: [],
      approvedAtISO: at,
      approvedBy: by,
      scheduledAtISO: at,
      scheduledBy: by,
    }
    metas.push({ entityType: 'payablesRun', entityId: runId, action: 'payables.runApproved', after: { status: 'scheduled', staged: true, week: cycleLabel(run), bill: leg.billNumber, amount: leg.available } })
    return { billing: { ...s.billing, payablesRuns: { ...s.billing.payablesRuns, [runId]: run } }, counters: allocated.counters }
  })
  return ok({ runId, cycleId: cycle.cycleId, amount: leg.available })
}
