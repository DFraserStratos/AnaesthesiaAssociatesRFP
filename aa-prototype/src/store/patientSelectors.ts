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
// The Patients list (build plan Phase 57; US-11.3.1, US-11.3.3, DM-10)
// ---------------------------------------------------------------------------

/** Coming up lists the patients with a Booking within this many days. */
export const PATIENT_SEARCH_UPCOMING_DAYS = 14

/** The Patients tab's filters: Coming up (the default), Needs follow-up and All. */
export type PatientListFilter = 'comingUp' | 'followUp' | 'all'

/** Why a patient needs the office (DM-10): one reason of each kind at most, per patient. */
export type PatientNeedReason =
  | {
      kind: 'balance'
      /** The strongest open balance warning on the patient's Bookings. */
      strength: WarningStrength
      /** Billed to the patient, owing less credit held (negative reads "in credit"). */
      net: number
      owingCount: number
      oldestAgeDays: number
      /** The strong warning's age threshold, for its words. */
      thresholdDays: number
    }
  | {
      kind: 'followUpDue'
      /** The oldest due reminder. */
      followUpId: string
      dueDateISO: IsoDate
      text: string
      invoiceNumber?: string
      /** Further due reminders for the patient. */
      more: number
    }
  | {
      kind: 'detailsDiffer'
      fields: PatientPendingDetails['differences'][number]['field'][]
      source: PatientPendingDetails['source']
      by?: string
    }

export interface PatientListRow {
  nhi: string
  name: string
  dobISO: IsoDate
  age?: number
  nextBooking?: { bookingId: string; listId: string; dateISO: IsoDate; session: Session }
  /** The strongest open balance warning, if any. */
  warning?: WarningStrength
  /** Why the patient needs the office, most pressing first; empty when nothing does. */
  reasons: PatientNeedReason[]
}

/** A row of Needs follow-up: never without a reason. */
export type PatientNeedRow = PatientListRow & { reasons: [PatientNeedReason, ...PatientNeedReason[]] }

const DOB_ISO = /^\d{4}-\d{2}-\d{2}$/
const DOB_NZ = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

function dobQuery(raw: string): string | undefined {
  const q = raw.trim()
  if (DOB_ISO.test(q)) return q
  const m = DOB_NZ.exec(q)
  if (m === null) return undefined
  return `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`
}

const SESSION_ORDER: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }

/** Each patient's next Booking (today or later), from one pass over the Bookings. */
function nextBookingByPatient(state: Pick<AppState, 'schedule' | 'clock'>): Map<string, NonNullable<PatientListRow['nextBooking']>> {
  const today = state.clock.todayISO
  const out = new Map<string, NonNullable<PatientListRow['nextBooking']>>()
  for (const b of Object.values(state.schedule.bookings)) {
    if (b.cancellation !== undefined) continue
    const list = state.schedule.lists[b.listId]
    if (list === undefined || list.dateISO < today) continue
    const best = out.get(b.patientId)
    if (best === undefined || list.dateISO < best.dateISO || (list.dateISO === best.dateISO && SESSION_ORDER[list.session] < SESSION_ORDER[best.session])) {
      out.set(b.patientId, { bookingId: b.id, listId: list.id, dateISO: list.dateISO, session: list.session })
    }
  }
  return out
}

/** Every patient's reasons to need the office, keyed by the internal id (never shown). */
function reasonsByPatient(state: PatientSelectorState): Map<string, PatientNeedReason[]> {
  const today = state.clock.todayISO
  const out = new Map<string, PatientNeedReason[]>()
  const push = (patientId: string, reason: PatientNeedReason) => {
    const list = out.get(patientId)
    if (list === undefined) out.set(patientId, [reason])
    else list.push(reason)
  }
  // A balance warning: every open one counts, mild included (an amount owing or a credit, US-11.3.3); one reason per patient, the strongest.
  const thresholdDays = patientBalanceThresholdDays(state)
  for (const [patientId, strength] of openBalanceByPatient(state)) {
    const summary = patientBalanceSummary(patientBalanceRows(state, patientId), { patientId, todayISO: today })
    push(patientId, {
      kind: 'balance',
      strength,
      net: (toCents(summary.owingTotal) - toCents(summary.creditTotal)) / 100,
      owingCount: summary.owing.length,
      oldestAgeDays: summary.oldestAgeDays,
      thresholdDays,
    })
  }
  // A follow-up due on its date or after: one reason per patient, the oldest, with how many more.
  const due = new Map<string, PatientFollowUp[]>()
  for (const f of followUpsDue(state)) {
    const list = due.get(f.patientId)
    if (list === undefined) due.set(f.patientId, [f])
    else list.push(f)
  }
  for (const [patientId, reminders] of due) {
    const oldest = reminders[0]!
    const invoiceNumber = oldest.invoiceId !== undefined ? state.billing.invoices[oldest.invoiceId]?.invoiceNumber : undefined
    push(patientId, {
      kind: 'followUpDue',
      followUpId: oldest.id,
      dueDateISO: oldest.dueDateISO!,
      text: oldest.text,
      ...(invoiceNumber !== undefined ? { invoiceNumber } : {}),
      more: reminders.length - 1,
    })
  }
  // Details received that differ from the record: one reason naming the fields.
  for (const p of patientsWithPendingDetails(state)) {
    const pending = p.pendingDetails!
    push(p.hiddenInternalId, {
      kind: 'detailsDiffer',
      fields: pending.differences.map((d) => d.field),
      source: pending.source,
      ...(pending.by !== undefined ? { by: pending.by } : {}),
    })
  }
  return out
}

/** How pressing a patient's reasons are: a strong balance warning, then a follow-up due, then details that differ, then the rest. */
function pressRank(reasons: readonly PatientNeedReason[]): number {
  if (reasons.some((r) => r.kind === 'balance' && r.strength === 'strong')) return 0
  if (reasons.some((r) => r.kind === 'followUpDue')) return 1
  if (reasons.some((r) => r.kind === 'detailsDiffer')) return 2
  return 3
}

function rankOfReason(r: PatientNeedReason): number {
  if (r.kind === 'balance') return r.strength === 'strong' ? 0 : 3
  return r.kind === 'followUpDue' ? 1 : 2
}

function oldestDue(reasons: readonly PatientNeedReason[]): string {
  const r = reasons.find((x) => x.kind === 'followUpDue')
  return r !== undefined && r.kind === 'followUpDue' ? r.dueDateISO : '9999-12-31'
}

interface ListContext {
  next: Map<string, NonNullable<PatientListRow['nextBooking']>>
  warnings: Map<string, WarningStrength>
  reasons: Map<string, PatientNeedReason[]>
}

function listContext(state: PatientSelectorState): ListContext {
  return { next: nextBookingByPatient(state), warnings: openBalanceByPatient(state), reasons: reasonsByPatient(state) }
}

function listRowOf(p: Patient, ctx: ListContext, today: IsoDate): PatientListRow {
  const next = ctx.next.get(p.hiddenInternalId)
  const age = ageInCompletedYears(p.dobISO, today)
  const warning = ctx.warnings.get(p.hiddenInternalId)
  const reasons = [...(ctx.reasons.get(p.hiddenInternalId) ?? [])].sort((a, b) => rankOfReason(a) - rankOfReason(b))
  return {
    nhi: p.nhi,
    name: p.name,
    dobISO: p.dobISO,
    ...(age !== undefined ? { age } : {}),
    ...(next !== undefined ? { nextBooking: next } : {}),
    ...(warning !== undefined ? { warning } : {}),
    reasons,
  }
}

const byName = (a: PatientListRow, b: PatientListRow) => a.name.localeCompare(b.name) || a.nhi.localeCompare(b.nhi)

/** Most pressing first (a strong balance warning, the oldest follow-up due, details that differ, the rest), ties by name. */
function byPressing(a: PatientListRow, b: PatientListRow): number {
  return pressRank(a.reasons) - pressRank(b.reasons) || oldestDue(a.reasons).localeCompare(oldestDue(b.reasons)) || byName(a, b)
}

function needRows(state: PatientSelectorState, ctx: ListContext): PatientNeedRow[] {
  const today = state.clock.todayISO
  const out: PatientNeedRow[] = []
  for (const patientId of ctx.reasons.keys()) {
    const p = state.masters.patients[patientId]
    if (p === undefined) continue
    out.push(listRowOf(p, ctx, today) as PatientNeedRow)
  }
  return out.sort(byPressing)
}

/**
 * Every patient needing the office (DM-10; US-11.3.3), one row per patient with its reasons: an open
 * balance warning (mild or strong, the strongest), a reminder due today or earlier (the oldest, with
 * how many more) and details received that differ from the record. Most pressing first. Derived,
 * never stored: a patient leaves the moment their last reason is resolved. Rows waiting for an NHI
 * have no patient record and are Intake's (US-11.1.5). The Needs follow-up rows, its count, the
 * People badge (`patientAttentionCount`) and the patient's page all read this.
 */
export function patientsNeedingOffice(state: PatientSelectorState): PatientNeedRow[] {
  return needRows(state, listContext(state))
}

/** One patient's reasons to need the office (the page's Needs the office card): `patientsNeedingOffice`'s, for that patient. */
export function patientNeedReasons(state: PatientSelectorState, nhi: string): PatientNeedReason[] {
  return patientsNeedingOffice(state).find((r) => r.nhi === nhi)?.reasons ?? []
}

/**
 * The Patients tab's list (US-11.3.1): one filter (Coming up, a Booking within 14 days, by the next
 * Booking's date then name; Needs follow-up, `patientsNeedingOffice`'s order; All, by name), narrowed
 * by a search on name (any word), NHI (normalised: "zaa 0067" finds ZAA0067) or date of birth
 * (`YYYY-MM-DD` or `DD/MM/YYYY`). Every match, uncapped: the screen pages it. `allCount` is how many
 * patients the search finds under All, for the "Search all patients" hint. A row's balance is read
 * for the rows shown (`patientListBalance`).
 */
export function patientList(state: PatientSelectorState, filter: PatientListFilter, query: string): { rows: PatientListRow[]; allCount: number } {
  const today = state.clock.todayISO
  const ctx = listContext(state)
  const q = query.trim()
  const dob = q === '' ? undefined : dobQuery(q)
  const parsed = q === '' ? undefined : parseBookingQuery(q)
  const matches = (p: Pick<Patient, 'name' | 'nhi' | 'dobISO'>) => q === '' || (dob !== undefined ? p.dobISO === dob : patientMatches(parsed!, p))
  const patients = Object.values(state.masters.patients)
  const allCount = q === '' ? patients.length : patients.filter(matches).length

  if (filter === 'followUp') return { rows: needRows(state, ctx).filter(matches), allCount }
  if (filter === 'all') return { rows: patients.filter(matches).map((p) => listRowOf(p, ctx, today)).sort(byName), allCount }
  const rows = patients
    .filter((p) => {
      const next = ctx.next.get(p.hiddenInternalId)
      return next !== undefined && daysBetween(today, next.dateISO) <= PATIENT_SEARCH_UPCOMING_DAYS && matches(p)
    })
    .map((p) => listRowOf(p, ctx, today))
    .sort((a, b) => a.nextBooking!.dateISO.localeCompare(b.nextBooking!.dateISO) || SESSION_ORDER[a.nextBooking!.session] - SESSION_ORDER[b.nextBooking!.session] || byName(a, b))
  return { rows, allCount }
}

/** A list row's balance: signed, net of credit held (US-13.2.2); negative reads "in credit". */
export function patientListBalance(state: PatientSelectorState, nhi: string): number {
  const p = patientByNhi(state, nhi)
  if (p === undefined) return 0
  return patientCentricBalance(patientBalanceRows(state, p.hiddenInternalId), p.hiddenInternalId).outstandingTotal
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
 * The People nav badge (build plan Phase 57; US-11.3.3, DM-10): the number of patients on Needs
 * follow-up, `patientsNeedingOffice(state).length`, so the badge, the filter's figure and the list
 * always agree. A patient with several reasons counts once. Rows waiting for an NHI are not counted
 * here: they are Intake's, counted once in `matchingAttentionCount` (US-11.1.5).
 */
export function patientAttentionCount(state: PatientSelectorState): number {
  return patientsNeedingOffice(state).length
}
