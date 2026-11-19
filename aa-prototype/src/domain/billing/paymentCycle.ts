/**
 * The weekly payment cycle (catch-up Phase 39a; US-10.2.7, Proposed; OQ-47).
 * Each accounting week is a payment cycle named by its ISO week ("Week 30").
 * The office closes the week (snapshot and bank reconciliation), sorts out
 * anomalies on the check day, approves the week's BCTIs and sends the payment
 * schedule to the accountant, who pays it in Xero (D53).
 *
 * The ONE place a week, a cycle's days or an anomaly is computed. Pure:
 * date-fns over the dates it is given, never the wall clock. The days come
 * from `appSettings.paymentCycle`, never from code.
 */

import { addDays, format, getISOWeek, getISOWeekYear, parseISO, startOfISOWeek } from 'date-fns'
import type { AnaesthetistId, CycleAnomaly, IsoDate, IsoDateTime, PaymentCycleSettings, Weekday } from '../types'
import { toCents } from './money'

export interface IsoWeekRef {
  isoYear: number
  isoWeek: number
}

/** A payment cycle: its ISO week, its Monday to Sunday range and its planned close, check and schedule dates. */
export interface PaymentCycle extends IsoWeekRef {
  /** `2026-W30`. */
  cycleId: string
  /** Monday. */
  weekStartISO: IsoDate
  /** Sunday. */
  weekEndISO: IsoDate
  /** That week's close weekday. */
  closeDateISO: IsoDate
  /** The first check weekday after the close. */
  checkDateISO: IsoDate
  /** The first schedule weekday after the check. */
  scheduleDateISO: IsoDate
}

function dateOnly(iso: string): Date {
  return parseISO(iso.slice(0, 10))
}

function isoDate(d: Date): IsoDate {
  return format(d, 'yyyy-MM-dd')
}

/** The ISO week a date falls in (2026-12-31 and 2027-01-01 are both 2026-W53). */
export function isoWeekOf(dateISO: string): IsoWeekRef {
  const d = dateOnly(dateISO)
  return { isoYear: getISOWeekYear(d), isoWeek: getISOWeek(d) }
}

export function cycleIdOf(ref: IsoWeekRef): string {
  return `${ref.isoYear}-W${String(ref.isoWeek).padStart(2, '0')}`
}

/** The first date on or after `from` that falls on `weekday` (ISO, Monday 1). */
function onOrAfter(from: Date, weekday: Weekday): Date {
  const isoDay = ((from.getDay() + 6) % 7) + 1
  return addDays(from, (weekday - isoDay + 7) % 7)
}

/** The cycle a date falls in, with its planned days from the setting. */
export function cycleFor(dateISO: string, settings: PaymentCycleSettings): PaymentCycle {
  const d = dateOnly(dateISO)
  const monday = startOfISOWeek(d)
  const close = addDays(monday, settings.closeWeekday - 1)
  // The check and schedule days follow the close: the next such weekday after it.
  const check = onOrAfter(addDays(close, 1), settings.checkWeekday)
  const schedule = onOrAfter(addDays(check, 1), settings.scheduleWeekday)
  const ref = { isoYear: getISOWeekYear(d), isoWeek: getISOWeek(d) }
  return {
    ...ref,
    cycleId: cycleIdOf(ref),
    weekStartISO: isoDate(monday),
    weekEndISO: isoDate(addDays(monday, 6)),
    closeDateISO: isoDate(close),
    checkDateISO: isoDate(check),
    scheduleDateISO: isoDate(schedule),
  }
}

/** The cycle a cycle id names (its Monday). */
export function cycleOfId(cycleId: string, settings: PaymentCycleSettings): PaymentCycle {
  const m = /^(\d{4})-W(\d{2})$/.exec(cycleId)
  if (m === null) throw new Error(`Not a cycle id: ${cycleId}`)
  // ISO week 1 holds 4 January; step from its Monday.
  const week1Monday = startOfISOWeek(parseISO(`${m[1]}-01-04`))
  return cycleFor(isoDate(addDays(week1Monday, (Number(m[2]) - 1) * 7)), settings)
}

/** The cycle after this one. */
export function nextCycleId(cycleId: string, settings: PaymentCycleSettings): string {
  return cycleFor(isoDate(addDays(parseISO(cycleOfId(cycleId, settings).weekStartISO), 7)), settings).cycleId
}

/** "Week 30". */
export function cycleLabel(cycle: Pick<IsoWeekRef, 'isoWeek'>): string {
  return `Week ${cycle.isoWeek}`
}

/** "20 Jul to 26 Jul 2026" (the word "to", no dash). */
export function cycleRangeLabel(cycle: Pick<PaymentCycle, 'weekStartISO' | 'weekEndISO'>): string {
  return `${format(parseISO(cycle.weekStartISO), 'd MMM')} to ${format(parseISO(cycle.weekEndISO), 'd MMM yyyy')}`
}

const WEEKDAY_NAMES: Record<Weekday, string> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }

/** A weekday's name, for copy that names a cycle day (always from the setting, never typed into a component). */
export function weekdayName(weekday: Weekday): string {
  return WEEKDAY_NAMES[weekday]
}

/** "Friday 24 Jul": a planned cycle day. */
export function plannedDayLabel(dateISO: IsoDate): string {
  return format(parseISO(dateISO), 'EEEE d MMM')
}

// ---------------------------------------------------------------------------
// The close's bank reconciliation and the check day's anomalies
// ---------------------------------------------------------------------------

/** A ledger receipt the close reconciles: one that released a line in this cycle. */
export interface ReconcileReceipt {
  receiptId: string
  /** The pair whose line it released. */
  pairId: string
  /** The receivable invoice number the bank deposit quotes. */
  reference: string
  amount: number
  atISO: IsoDateTime
}

export interface ReconcileBankLine {
  id: string
  reference: string
  amount: number
  removedByDemo?: true
}

export interface ReconcileFinding {
  kind: 'receiptNotOnBank' | 'bankAmountDiffers'
  receiptId: string
  pairId: string
  reference: string
  amount: number
  /** What the bank download shows, when it differs. */
  bankAmount?: number
}

/**
 * Match each receipt to a bank line by reference and amount (each bank line
 * used once). A receipt with no line quoting its reference is not on the bank
 * download; one whose only lines differ in amount differs. A line the demo
 * removed counts as missing.
 */
export function reconcileWeek(input: { receipts: readonly ReconcileReceipt[]; bankLines: readonly ReconcileBankLine[] }): ReconcileFinding[] {
  const available = input.bankLines.filter((b) => b.removedByDemo !== true).slice().sort((a, b) => a.id.localeCompare(b.id))
  const used = new Set<string>()
  const receipts = input.receipts.slice().sort((a, b) => a.atISO.localeCompare(b.atISO) || a.receiptId.localeCompare(b.receiptId))
  const unmatched: ReconcileReceipt[] = []
  // Exact matches first, so a differing line is never taken from a receipt it matches exactly.
  for (const r of receipts) {
    const line = available.find((b) => !used.has(b.id) && b.reference === r.reference && toCents(b.amount) === toCents(r.amount))
    if (line !== undefined) used.add(line.id)
    else unmatched.push(r)
  }
  const findings: ReconcileFinding[] = []
  for (const r of unmatched) {
    const line = available.find((b) => !used.has(b.id) && b.reference === r.reference)
    if (line !== undefined) {
      used.add(line.id)
      findings.push({ kind: 'bankAmountDiffers', receiptId: r.receiptId, pairId: r.pairId, reference: r.reference, amount: r.amount, bankAmount: line.amount })
    } else {
      findings.push({ kind: 'receiptNotOnBank', receiptId: r.receiptId, pairId: r.pairId, reference: r.reference, amount: r.amount })
    }
  }
  return findings
}

/** The run lines `weekAnomalies` reads. */
export interface AnomalyLine {
  pairId: string
  anaesthetistId: AnaesthetistId
  billNumber: string
}

/**
 * The cycle's anomalies: one per reconciliation finding (on the line its
 * receipt released) and one `noBankAccount` per anaesthetist in the run with
 * no bank account on file (a flag for the check day, never an exclusion).
 * Deterministic ids (`<runId>-A<n>`) and order.
 */
export function weekAnomalies(input: {
  runId: string
  lines: readonly AnomalyLine[]
  reconciliation: readonly ReconcileFinding[]
  /** Anaesthetists with no bank account on file. */
  missingBank: ReadonlySet<AnaesthetistId>
  formatAmount: (n: number) => string
}): CycleAnomaly[] {
  const lineByPair = new Map(input.lines.map((l) => [l.pairId, l]))
  const out: Omit<CycleAnomaly, 'id'>[] = []
  const findings = input.reconciliation.slice().sort((a, b) => a.reference.localeCompare(b.reference) || a.receiptId.localeCompare(b.receiptId))
  for (const f of findings) {
    const line = lineByPair.get(f.pairId)
    if (line === undefined) continue
    out.push({
      kind: f.kind,
      pairIds: [f.pairId],
      anaesthetistId: line.anaesthetistId,
      detail:
        f.kind === 'receiptNotOnBank'
          ? `The receipt of ${input.formatAmount(f.amount)} for ${f.reference} is not on the bank download.`
          : `The receipt of ${input.formatAmount(f.amount)} for ${f.reference} shows as ${input.formatAmount(f.bankAmount ?? 0)} on the bank download.`,
      status: 'open',
    })
  }
  const anaesthetists = [...new Set(input.lines.map((l) => l.anaesthetistId))].sort()
  for (const a of anaesthetists) {
    if (!input.missingBank.has(a)) continue
    out.push({
      kind: 'noBankAccount',
      pairIds: input.lines.filter((l) => l.anaesthetistId === a).map((l) => l.pairId),
      anaesthetistId: a,
      detail: 'No bank account on file.',
      status: 'open',
    })
  }
  return out.map((a, i) => ({ id: `${input.runId}-A${i + 1}`, ...a }))
}
