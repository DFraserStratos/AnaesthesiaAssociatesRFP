/**
 * Patient selectors (catch-up Phase 40; US-11.1.1, US-11.1.5, US-11.3.1,
 * US-11.3.2, US-11.3.3, US-13.2.2): the Admin patient search and record, the
 * office's view of intake rows waiting for an NHI, and the counts the nav
 * badge reads. Every money figure is read from 36's ledger
 * (`patientBalanceRows`), never `state.xero`. Nothing here returns the
 * internal patient id for display: the NHI is the identifier the UI shows.
 *
 * Plain functions over `Pick`-narrowed state; components select the slices
 * and memoise the call.
 */

import { daysBetween } from '../domain/dateDays'
import { toCents } from '../domain/billing/money'
import { parseBookingQuery, patientMatches } from '../domain/bookingSearch'
import { ageInCompletedYears } from '../domain/billing/modifiers'
import { ETHNICITY_DEMO_SUBSET } from '../domain/nzhis'
import { effectiveIncoming } from '../domain/intake/matching'
import {
  countsTowardPatientBalance,
  invoiceAgeDays,
  patientBalanceStrength,
  patientBalanceSummary,
  patientCentricBalance,
  waitingNhiUrgency,
  type PatientBalanceRow,
  type PatientBalanceStrength,
  type PatientCentricBalance,
  type WaitingNhiUrgency,
} from '../domain/patients'
import { strongerOf, type WarningStrength } from '../domain/warnings'
import type { AuditEntry, Booking, IsoDate, Patient, PatientFollowUp, PatientPendingDetails, Session } from '../domain/types'
import type { AppState } from './appStore'
import { assessImportRow } from './matchingSelectors'
import { canResendFromRecord, nhiRequestAddressFor, patientBalanceThresholdDays, type NhiRequestAddress } from './patientActions'
import { patientByNhi } from './patientLookup'
import { patientBalanceRows } from './patientLedger'
import { stubForRow } from './stubSelectors'
import { openWarnings, type OpenWarningRow, type WarningState } from './warnings'

export type PatientSelectorState = Pick<AppState, 'billing' | 'schedule' | 'masters' | 'appSettings' | 'clock' | 'patientCare' | 'intake' | 'audit'>

// ---------------------------------------------------------------------------
// Balance warnings and follow-ups
// ---------------------------------------------------------------------------

/** 15a's `openWarnings`, the `patientBalance` rule only. */
export function openBalanceWarnings(state: WarningState): OpenWarningRow[] {
  return openWarnings(state).filter((r) => r.warning.ruleId === 'patientBalance')
}

/** The strongest open balance warning per patient. */
function openBalanceByPatient(state: WarningState): Map<string, WarningStrength> {
  const out = new Map<string, WarningStrength>()
  for (const row of openBalanceWarnings(state)) {
    const prev = out.get(row.patientId)
    out.set(row.patientId, prev === undefined ? row.warning.strength : strongerOf(prev, row.warning.strength))
  }
  return out
}

/** Reminders not done and due today or earlier, oldest first. */
export function followUpsDue(state: Pick<AppState, 'patientCare' | 'clock'>): PatientFollowUp[] {
  return Object.values(state.patientCare.followUps)
    .filter((f) => f.kind === 'reminder' && f.doneAtISO === undefined && f.dueDateISO !== undefined && f.dueDateISO <= state.clock.todayISO)
    .sort((a, b) => (a.dueDateISO ?? '').localeCompare(b.dueDateISO ?? '') || a.id.localeCompare(b.id))
}

export function patientsWithPendingDetails(state: Pick<AppState, 'masters'>): Patient[] {
  return Object.values(state.masters.patients)
    .filter((p) => p.pendingDetails !== undefined && p.pendingDetails.differences.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name) || a.nhi.localeCompare(b.nhi))
}

// ---------------------------------------------------------------------------
// Bookings by patient
// ---------------------------------------------------------------------------

function bookingsByPatient(bookings: Readonly<Record<string, Booking>>): Map<string, Booking[]> {
  const out = new Map<string, Booking[]>()
  for (const b of Object.values(bookings)) {
    if (b.cancellation !== undefined) continue
    const list = out.get(b.patientId)
    if (list === undefined) out.set(b.patientId, [b])
    else list.push(b)
  }
  return out
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const PATIENT_SEARCH_LIMIT = 50
/** An empty search lists the patients booked within this many days. */
export const PATIENT_SEARCH_UPCOMING_DAYS = 14

export interface PatientSearchRow {
  nhi: string
  name: string
  dobISO: IsoDate
  age?: number
  nextBooking?: { bookingId: string; listId: string; dateISO: IsoDate; session: Session }
  /** Signed, net of credit held (US-13.2.2); negative reads "in credit". */
  balance: number
  /** The strongest open balance warning, if any. */
  warning?: WarningStrength
}

const DOB_ISO = /^\d{4}-\d{2}-\d{2}$/
const DOB_NZ = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

function dobQuery(raw: string): string | undefined {
  const q = raw.trim()
  if (DOB_ISO.test(q)) return q
  const m = DOB_NZ.exec(q)
  if (m === null) return undefined
  return `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`
}

/**
 * Find patients by name (any word), NHI (normalised: "zaa 0067" finds
 * ZAA0067) or date of birth (`YYYY-MM-DD` or `DD/MM/YYYY`). Name and NHI
 * reuse 38a's `patientMatches`; only the DOB is added here. At most 50 rows,
 * by name. An empty query lists the patients with a Booking in the next 14
 * days, then everyone with an open item (a balance warning or details to
 * review).
 */
export function patientSearch(state: PatientSelectorState, query: string): PatientSearchRow[] {
  const today = state.clock.todayISO
  const byPatient = bookingsByPatient(state.schedule.bookings)
  const warnings = openBalanceByPatient(state)
  const nextOf = (patientId: string): PatientSearchRow['nextBooking'] => {
    let best: PatientSearchRow['nextBooking']
    for (const b of byPatient.get(patientId) ?? []) {
      const list = state.schedule.lists[b.listId]
      if (list === undefined || list.dateISO < today) continue
      if (best === undefined || list.dateISO < best.dateISO) best = { bookingId: b.id, listId: list.id, dateISO: list.dateISO, session: list.session }
    }
    return best
  }
  const rowOf = (p: Patient): PatientSearchRow => {
    const next = nextOf(p.hiddenInternalId)
    const age = ageInCompletedYears(p.dobISO, today)
    const warning = warnings.get(p.hiddenInternalId)
    return {
      nhi: p.nhi,
      name: p.name,
      dobISO: p.dobISO,
      ...(age !== undefined ? { age } : {}),
      ...(next !== undefined ? { nextBooking: next } : {}),
      balance: patientCentricBalance(patientBalanceRows(state, p.hiddenInternalId), p.hiddenInternalId).outstandingTotal,
      ...(warning !== undefined ? { warning } : {}),
    }
  }
  const byName = (a: Patient, b: Patient) => a.name.localeCompare(b.name) || a.nhi.localeCompare(b.nhi)
  const patients = Object.values(state.masters.patients)

  if (query.trim() === '') {
    const upcoming = patients.filter((p) => {
      const next = nextOf(p.hiddenInternalId)
      return next !== undefined && daysBetween(today, next.dateISO) <= PATIENT_SEARCH_UPCOMING_DAYS
    })
    const seen = new Set(upcoming.map((p) => p.hiddenInternalId))
    const open = patients.filter((p) => !seen.has(p.hiddenInternalId) && (warnings.has(p.hiddenInternalId) || p.pendingDetails !== undefined))
    return [...upcoming.sort(byName), ...open.sort(byName)].slice(0, PATIENT_SEARCH_LIMIT).map(rowOf)
  }
  const dob = dobQuery(query)
  const parsed = parseBookingQuery(query)
  const hits = patients.filter((p) => (dob !== undefined ? p.dobISO === dob : patientMatches(parsed, p)))
  return hits.sort(byName).slice(0, PATIENT_SEARCH_LIMIT).map(rowOf)
}

// ---------------------------------------------------------------------------
// The patient record
// ---------------------------------------------------------------------------

export interface PatientBookingRow {
  bookingId: string
  listId: string
  dateISO: IsoDate
  session: Session
  scheduledTime?: string
  hospital: string
  anaesthetist?: string
  warning?: WarningStrength
}

export interface PatientInvoiceRow extends PatientBalanceRow {
  anaesthetist?: string
  bookingDateISO?: IsoDate
  countsTowardBalance: boolean
  ageDays: number
  sends: { atISO: string; to: string; by: string }[]
  /** Resend is offered: an invoice already emailed and not credited (`canResendFromRecord`). */
  resendable: boolean
}

export interface PatientRecordView {
  patient: Pick<Patient, 'nhi' | 'name' | 'dobISO' | 'phone' | 'email' | 'postalAddress' | 'ethnicityCode'>
  age?: number
  ethnicityLabel?: string
  ethnicityPending?: Patient['ethnicityPending']
  pendingDetails?: PatientPendingDetails
  /** Who first recorded the patient, from the audit trail (absent for seeded patients). */
  source?: { who: string; atISO: string }
  upcoming: PatientBookingRow[]
  past: PatientBookingRow[]
  followUps: PatientFollowUp[]
  invoices: PatientInvoiceRow[]
  balance: PatientCentricBalance
  /** Billed to the patient: what the warning reads. `net` is owing less credit held (negative reads "in credit"). */
  billedToPatient: { owingTotal: number; owingCount: number; oldestAgeDays: number; creditHeld: number; net: number; strength: PatientBalanceStrength }
  /** Every other payer's outstanding less credit held, signed. */
  otherPayersTotal: number
  /** The Invoices table's footer: what is still owed on every row (a credited row owes nothing). */
  invoicesOutstanding: number
}

/** The patient record by NHI (the route's key): details, Bookings, follow-ups, every invoice and the balances. */
export function patientRecordView(state: PatientSelectorState, nhi: string): PatientRecordView | undefined {
  const p = patientByNhi(state, nhi)
  if (p === undefined) return undefined
  const patientId = p.hiddenInternalId
  const today = state.clock.todayISO
  const warnings = new Map<string, WarningStrength>()
  for (const row of openBalanceWarnings(state)) {
    if (row.patientId !== patientId) continue
    const prev = warnings.get(row.bookingId)
    warnings.set(row.bookingId, prev === undefined ? row.warning.strength : strongerOf(prev, row.warning.strength))
  }
  const bookings: PatientBookingRow[] = []
  for (const b of bookingsByPatient(state.schedule.bookings).get(patientId) ?? []) {
    const list = state.schedule.lists[b.listId]
    if (list === undefined) continue
    const warning = warnings.get(b.id)
    const anaesthetist = list.anaesthetistId !== undefined ? state.masters.anaesthetists[list.anaesthetistId]?.name : undefined
    bookings.push({
      bookingId: b.id,
      listId: list.id,
      dateISO: list.dateISO,
      session: list.session,
      ...(b.scheduledTime !== undefined ? { scheduledTime: b.scheduledTime } : {}),
      hospital: state.masters.hospitals[list.hospitalId]?.name ?? list.hospitalId,
      ...(anaesthetist !== undefined ? { anaesthetist } : {}),
      ...(warning !== undefined ? { warning } : {}),
    })
  }
  const byDate = (a: PatientBookingRow, b: PatientBookingRow) => a.dateISO.localeCompare(b.dateISO) || a.session.localeCompare(b.session) || (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '')
  const upcoming = bookings.filter((b) => b.dateISO >= today).sort(byDate)
  const past = bookings.filter((b) => b.dateISO < today).sort((a, b) => byDate(b, a))

  const rows = patientBalanceRows(state, patientId)
  const invoices: PatientInvoiceRow[] = rows.map((row) => {
    const invoice = state.billing.invoices[row.invoiceId]
    const booking = state.schedule.bookings[row.bookingId]
    const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
    const anaesthetistId = row.anaesthetistId ?? list?.anaesthetistId
    const anaesthetist = anaesthetistId !== undefined ? state.masters.anaesthetists[anaesthetistId]?.name : undefined
    const sends = invoice?.delivery?.status === 'sent' ? invoice.delivery.sends.map((s) => ({ atISO: s.atISO, to: s.to, by: s.by })) : []
    return {
      ...row,
      ...(anaesthetist !== undefined ? { anaesthetist } : {}),
      ...(list !== undefined ? { bookingDateISO: list.dateISO } : {}),
      countsTowardBalance: countsTowardPatientBalance(row, patientId),
      ageDays: invoiceAgeDays(row.raisedAtISO, today),
      sends,
      resendable: canResendFromRecord(row.status, invoice?.delivery?.status),
    }
  })
  const summary = patientBalanceSummary(rows, { patientId, todayISO: today })
  const balance = patientCentricBalance(rows, patientId)
  const created: AuditEntry | undefined = state.audit.find((e) => e.entityType === 'patient' && e.entityId === patientId && e.action === 'patient.create')
  const age = ageInCompletedYears(p.dobISO, today)
  const ethnicityLabel = p.ethnicityCode !== undefined ? ETHNICITY_DEMO_SUBSET.find((e) => e.code === p.ethnicityCode)?.label : undefined
  return {
    patient: {
      nhi: p.nhi,
      name: p.name,
      dobISO: p.dobISO,
      ...(p.phone !== undefined && p.phone.trim() !== '' ? { phone: p.phone } : {}),
      ...(p.email !== undefined && p.email.trim() !== '' ? { email: p.email } : {}),
      ...(p.postalAddress !== undefined ? { postalAddress: p.postalAddress } : {}),
      ...(p.ethnicityCode !== undefined ? { ethnicityCode: p.ethnicityCode } : {}),
    },
    ...(age !== undefined ? { age } : {}),
    ...(ethnicityLabel !== undefined ? { ethnicityLabel } : {}),
    ...(p.ethnicityPending !== undefined ? { ethnicityPending: p.ethnicityPending } : {}),
    ...(p.pendingDetails !== undefined ? { pendingDetails: p.pendingDetails } : {}),
    ...(created !== undefined ? { source: { who: created.who, atISO: created.atISO } } : {}),
    upcoming,
    past,
    followUps: Object.values(state.patientCare.followUps)
      .filter((f) => f.patientId === patientId)
      .sort((a, b) => b.atISO.localeCompare(a.atISO) || b.id.localeCompare(a.id)),
    invoices,
    balance,
    billedToPatient: {
      owingTotal: summary.owingTotal,
      owingCount: summary.owing.length,
      oldestAgeDays: summary.oldestAgeDays,
      creditHeld: summary.creditTotal,
      net: (toCents(summary.owingTotal) - toCents(summary.creditTotal)) / 100,
      strength: patientBalanceStrength(summary, patientBalanceThresholdDays(state)),
    },
    otherPayersTotal:
      balance.byPayer
        .filter((b) => !(b.billedTo.kind === 'patient' && b.billedTo.id === patientId))
        .reduce((t, b) => t + toCents(b.outstanding) - toCents(b.creditHeld), 0) / 100,
    invoicesOutstanding: rows.reduce((t, r) => t + (r.status === 'credited' ? 0 : toCents(r.outstanding)), 0) / 100,
  }
}

// ---------------------------------------------------------------------------
// Intake rows waiting for an NHI (US-11.1.5)
// ---------------------------------------------------------------------------

export interface WaitingNhiRow {
  rowId: string
  patientName: string
  dobISO?: IsoDate
  /** The List 33's step finds (hospital, date, session, surgeon), when one exists. */
  listId?: string
  dateISO: IsoDate
  session: Session
  hospital: string
  scheduledTime?: string
  wording?: string
  surgeon?: string
  /** One address to chase, and the others offered (D74). */
  chase: NhiRequestAddress
  /** The row's standing stub on its List (33a), when one stands. */
  stubId?: string
  daysToGo: number
  urgency: WaitingNhiUrgency
  /** When the office last asked for the NHI. */
  requestedAtISO?: string
}

/**
 * One row per open intake row waiting for an NHI (33's `waitingForNhi`),
 * by date then time. Derived, never stored: a row leaves the moment its NHI
 * is added.
 */
export function waitingNhiRows(state: Pick<AppState, 'intake' | 'masters' | 'schedule' | 'clock' | 'audit'>): WaitingNhiRow[] {
  const today = state.clock.todayISO
  const requested = new Map<string, string>()
  for (const e of state.audit) if (e.action === 'importRow.nhiRequested') requested.set(e.entityId, e.atISO)
  const out: WaitingNhiRow[] = []
  for (const row of Object.values(state.intake.rows)) {
    if (row.status !== 'open') continue
    const assessment = assessImportRow(state as AppState, row.id)
    if (assessment === undefined || !assessment.waitingForNhi) continue
    const fields = effectiveIncoming(row)
    // A hospital cancellation without an NHI is not chased: it stays on Matching for Reject.
    if (fields.hospitalStatus === 'cancelled') continue
    const surgeonId = assessment.surgeonId
    const surgeon = surgeonId !== undefined ? state.masters.surgeons[surgeonId]?.name : fields.surgeon?.name
    const stub = stubForRow(state, row.id)
    const at = requested.get(row.id)
    out.push({
      rowId: row.id,
      patientName: fields.patient.name,
      ...(fields.patient.dobISO !== undefined ? { dobISO: fields.patient.dobISO } : {}),
      ...(assessment.targetListId !== undefined ? { listId: assessment.targetListId } : {}),
      dateISO: fields.dateISO,
      session: fields.session,
      hospital: state.masters.hospitals[fields.hospitalId]?.name ?? fields.hospitalId,
      ...(fields.scheduledTime !== undefined ? { scheduledTime: fields.scheduledTime } : {}),
      ...(fields.procedure?.text !== undefined ? { wording: fields.procedure.text } : {}),
      ...(surgeon !== undefined ? { surgeon } : {}),
      chase: nhiRequestAddressFor(state, row.id),
      ...(stub !== undefined ? { stubId: stub.id } : {}),
      daysToGo: daysBetween(today, fields.dateISO),
      urgency: waitingNhiUrgency(fields.dateISO, today),
      ...(at !== undefined ? { requestedAtISO: at } : {}),
    })
  }
  return out.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.rowId.localeCompare(b.rowId))
}

/**
 * The Patients nav badge: open strong balance warnings, due reminders and details to review.
 * Rows waiting for an NHI are not counted here: they are Intake's, counted once in
 * `matchingAttentionCount` (US-11.1.5).
 */
export function patientAttentionCount(state: PatientSelectorState): number {
  return (
    openBalanceWarnings(state).filter((r) => r.warning.strength === 'strong').length +
    followUpsDue(state).length +
    patientsWithPendingDetails(state).length
  )
}
