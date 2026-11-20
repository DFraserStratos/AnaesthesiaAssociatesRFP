/**
 * The patient balance rules (catch-up Phase 40; US-11.3.1, US-11.3.2,
 * US-13.2.2, RV-36; D24, OQ-74 answered). Pure: no store import
 * (`domainPurity.test.ts`).
 *
 * Two halves, each in one place:
 * - **Which earlier invoices count toward the warning:** only receivables
 *   billed to the patient themself (`{ kind: 'patient', id }`,
 *   `countsTowardPatientBalance`). Hospital, insurer, ACC, other holder and
 *   named-payer (a guardian) invoices count toward the record's
 *   patient-centric balance (`patientCentricBalance`, US-13.2.2) but never
 *   toward the warning.
 * - **Which new Bookings are checked:** only one with a Procedure whose payer
 *   is the patient (`checksPatientBalance`, D85). The Contract never gates it.
 *
 * The age counts from the invoice date (`invoiceAgeDays`, the only place the
 * basis lives); a credit balance is a mild warning (D24).
 */

import { daysBetween } from '../dateDays'
import { roundToCents, toCents } from '../billing/money'
import type { CounterpartyRef, IsoDate, IsoDateTime } from '../types'

/** One invoice row as the rules read it: 36's `PatientPositionRow` plus the credit held for its payer (39). */
export interface PatientBalanceRow {
  invoiceId: string
  invoiceNumber: string
  bookingId: string
  billedTo: CounterpartyRef
  /** The invoice date. */
  raisedAtISO: IsoDateTime
  total: number
  /** What is still owed, never negative (a credited row owes nothing). */
  outstanding: number
  status: 'paid' | 'partPaid' | 'unpaid' | 'credited'
  /** What the payer had paid on a credited invoice, held for them (39's `credit.heldForPayer`); 0 otherwise. */
  creditHeld: number
  /** The payee anaesthetist (absent on a prepayment held in the AA Holding account). */
  anaesthetistId?: string
  /** The billed party's name, where the caller knows it (the by-payer breakdown). */
  billedToName?: string
}

/** A running total kept in whole cents. */
class CentSum {
  private cents = 0
  add(amount: number): void {
    this.cents += toCents(amount)
  }
  get value(): number {
    return this.cents / 100
  }
}

/** Whole calendar days from the invoice date to today: the only place the threshold's basis lives (D24). */
export function invoiceAgeDays(raisedAtISO: IsoDateTime | IsoDate, todayISO: IsoDate): number {
  return daysBetween(raisedAtISO.slice(0, 10), todayISO)
}

/** True only for a row billed to the patient themself; never a hospital, insurer, holder, named payer or AA fee row. */
export function countsTowardPatientBalance(row: Pick<PatientBalanceRow, 'billedTo'>, patientId: string): boolean {
  return row.billedTo.kind === 'patient' && row.billedTo.id === patientId
}

/** True when any Procedure's payer is the patient (D85): the one place "which new Bookings are checked" lives. */
export function checksPatientBalance(payers: readonly ({ kind: string } | undefined)[]): boolean {
  return payers.some((p) => p?.kind === 'patient')
}

export interface OwingInvoice {
  invoiceId: string
  invoiceNumber: string
  bookingId: string
  raisedAtISO: IsoDateTime
  outstanding: number
  ageDays: number
}

export interface PatientBalanceSummary {
  /** Oldest first. */
  owing: OwingInvoice[]
  owingTotal: number
  /** 0 when nothing is owed. */
  oldestAgeDays: number
  /** Credit held for the patient on their own rows. */
  creditTotal: number
}

/**
 * Over the rows billed to the patient, excluding every invoice of the Booking
 * being checked (its own prepayment included: 27's warning covers that).
 */
export function patientBalanceSummary(
  rows: readonly PatientBalanceRow[],
  opts: { patientId: string; todayISO: IsoDate; excludeBookingId?: string },
): PatientBalanceSummary {
  const owing: OwingInvoice[] = []
  const owed = new CentSum()
  const credit = new CentSum()
  for (const row of rows) {
    if (!countsTowardPatientBalance(row, opts.patientId)) continue
    if (opts.excludeBookingId !== undefined && row.bookingId === opts.excludeBookingId) continue
    if (row.creditHeld > 0) credit.add(row.creditHeld)
    if (row.status === 'credited' || toCents(row.outstanding) <= 0) continue
    owed.add(row.outstanding)
    owing.push({
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoiceNumber,
      bookingId: row.bookingId,
      raisedAtISO: row.raisedAtISO,
      outstanding: row.outstanding,
      ageDays: invoiceAgeDays(row.raisedAtISO, opts.todayISO),
    })
  }
  owing.sort((a, b) => a.raisedAtISO.localeCompare(b.raisedAtISO) || a.invoiceNumber.localeCompare(b.invoiceNumber))
  return {
    owing,
    owingTotal: owed.value,
    oldestAgeDays: owing.length > 0 ? owing[0]!.ageDays : 0,
    creditTotal: credit.value,
  }
}

export type PatientBalanceStrength = 'none' | 'mild' | 'strong'

/** Owing past the threshold is strong, owing within it mild, in credit with nothing owing mild; owing decides when both. */
export function patientBalanceStrength(summary: PatientBalanceSummary, thresholdDays: number): PatientBalanceStrength {
  if (summary.owing.length > 0) return summary.oldestAgeDays > thresholdDays ? 'strong' : 'mild'
  return toCents(summary.creditTotal) > 0 ? 'mild' : 'none'
}

export interface PayerBalance {
  billedTo: CounterpartyRef
  name?: string
  outstanding: number
  creditHeld: number
}

export interface PatientCentricBalance {
  /** Signed: outstanding less credit held; negative reads "in credit". */
  outstandingTotal: number
  /** One entry per billable party, the patient's own first. */
  byPayer: PayerBalance[]
  /** The counting subset: what the warning reads. */
  billedToPatient: { outstanding: number; creditHeld: number }
}

/** Every row of the patient, whoever the billable party (US-13.2.2), net of credit held. */
export function patientCentricBalance(rows: readonly PatientBalanceRow[], patientId: string): PatientCentricBalance {
  const total = new CentSum()
  const byKey = new Map<string, PayerBalance>()
  let ownOutstanding = 0
  let ownCredit = 0
  for (const row of rows) {
    const outstanding = row.status === 'credited' ? 0 : row.outstanding
    total.add(outstanding)
    total.add(-row.creditHeld)
    const key = `${row.billedTo.kind}:${row.billedTo.id}`
    const prev = byKey.get(key) ?? { billedTo: row.billedTo, ...(row.billedToName !== undefined ? { name: row.billedToName } : {}), outstanding: 0, creditHeld: 0 }
    prev.outstanding = roundToCents(prev.outstanding + outstanding)
    prev.creditHeld = roundToCents(prev.creditHeld + row.creditHeld)
    byKey.set(key, prev)
    if (countsTowardPatientBalance(row, patientId)) {
      ownOutstanding = roundToCents(ownOutstanding + outstanding)
      ownCredit = roundToCents(ownCredit + row.creditHeld)
    }
  }
  const ownKey = `patient:${patientId}`
  const byPayer = [...byKey.entries()]
    .sort(([a], [b]) => (a === ownKey ? -1 : b === ownKey ? 1 : a.localeCompare(b)))
    .map(([, v]) => v)
  return { outstandingTotal: total.value, byPayer, billedToPatient: { outstanding: ownOutstanding, creditHeld: ownCredit } }
}
