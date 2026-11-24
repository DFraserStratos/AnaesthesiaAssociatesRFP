/**
 * The matching screen's demo trigger bodies (catch-up Phase 33). Deterministic
 * and idempotent; PWA-safe (domain and store only).
 *
 * - `receiveTheatreList`: the hospital's file arriving on its own (bar).
 * - `stageUpdateForBooking`: the hospital sending a later update for a Booking
 *   already matched (bar).
 * - `officeMatchesHospitalRow`: the PWA office stand-in, which stages a row and
 *   decides it through `decideImportRow` with the derived suggestion, every
 *   difference ticked and no Contract or RVG code pick (FT-02.1, OQ-78). Its S1
 *   choice (catch-up Phase 34) imports the St George's file as Admin Intake
 *   does, decides the confident rows for the persona's Tue 28 Jul AM List, and
 *   gives each Booking it created the office's rail answer, No contract · RVG
 *   (D33: the RVG code stays the anaesthetist's). Exceptions stay with the office.
 *
 * Every row enters through `stageImportRows` (channel `download`); nothing here
 * writes a Booking any other way.
 */

import type { Booking, IncomingBookingFields } from '../domain/types'
import {
  FOSTER_HOSPITAL_WORDING,
  SARAH_UPDATE_WORDING,
  SAMPLE_STG,
  SAMPLE_SX,
  effectiveIncoming,
  sessionLabel,
  type HospitalDownloadSample,
  type SuggestedDecision,
} from '../domain/intake'
import { APPT } from '../domain/integrations/messages'
import { ANAE } from '../domain/seed/cast'
import { FEED } from '../domain/integrations/feeds'
import { ok, refuse, transaction, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { decideImportRow, importHospitalDownload, incomingKey, stageImportRows, type DecisionInput } from './matchingActions'
import { setProcedureContract } from './contractSelectionActions'
import { CONTRACT } from '../domain/seed/contracts'
import { projectedListId } from '../domain/slots'
import { assessImportRow } from './matchingSelectors'
import { findBookingByCorrelation, proceduresForBooking } from './selectors'

/** The hospital each bar choice sends (the two integrated hospitals, D52). */
export const THEATRE_LIST_SAMPLES: Readonly<Record<'stg' | 'sx', HospitalDownloadSample>> = { stg: SAMPLE_STG, sx: SAMPLE_SX }

/** One definition of "the hospital sent exactly this" (the store's dedupe key). */
function sameIncoming(a: IncomingBookingFields, b: IncomingBookingFields): boolean {
  return incomingKey(a) === incomingKey(b)
}

function received(state: Pick<AppState, 'intake'>, fields: IncomingBookingFields): boolean {
  return Object.values(state.intake.rows).some((r) => sameIncoming(r.incoming, fields))
}

function hospitalName(state: Pick<AppState, 'masters'>, hospitalId: string): string {
  return state.masters.hospitals[hospitalId]?.name ?? 'The hospital'
}

// ---------------------------------------------------------------------------
// Import hospital file (bar)
// ---------------------------------------------------------------------------

export function theatreListRefusal(state: Pick<AppState, 'intake'>, hospital: 'stg' | 'sx'): string | null {
  return THEATRE_LIST_SAMPLES[hospital].rows.every((r) => received(state, r)) ? 'This list is already on Matching' : null
}

/** The hospital's file arriving (it stages the sample's rows and applies nothing). */
export function receiveTheatreList(api: AppStoreApi, actor: Actor, hospital: 'stg' | 'sx'): Outcome<{ rowIds: string[] }> {
  const reason = theatreListRefusal(api.getState(), hospital)
  if (reason !== null) return refuse('alreadyReceived', reason)
  const sample = THEATRE_LIST_SAMPLES[hospital]
  const label = `${hospitalName(api.getState(), sample.hospitalId)} theatre list (sample)`
  const staged = stageImportRows(api, actor, 'download', sample.hospitalId, label, sample.rows, { sampleId: sample.id })
  if (!staged.ok) return staged
  return ok({ rowIds: staged.value.rowIds })
}

// ---------------------------------------------------------------------------
// Send update for a matched Booking (bar)
// ---------------------------------------------------------------------------

/** Diane Foster's Booking (Tue 4 Aug AM, the rooms' `WLE MM`): the default target. */
export function fosterBookingId(state: Pick<AppState, 'schedule'>): string | undefined {
  return findBookingByCorrelation(state as AppState, { sourceFeedId: FEED.stg, externalAppointmentId: APPT.s14 })?.id
}

function plusMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * The row a hospital would send for an update to a Booking: the same List and
 * patient, a time 30 minutes later (Foster: MSG-STG-1012's 12:15, with its
 * note), and the hospital's fuller wording (Foster: AR-35 row 27; Sarah
 * Mitchell: the appendicectomy spelt out; any other: its RVG group's
 * description or its held text, or none).
 */
export function updateRowFor(state: AppState, bookingId: string): IncomingBookingFields | undefined {
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
  if (booking === undefined || list === undefined || patient === undefined || patient.nhi === undefined) return undefined
  const surgeon = list.surgeonId != null ? state.masters.surgeons[list.surgeonId] : undefined
  const isFoster = bookingId === fosterBookingId(state)
  const primary = proceduresForBooking(state, bookingId).find((p) => p.isPrimary)
  const text = isFoster
    ? FOSTER_HOSPITAL_WORDING
    : patient.name === 'Sarah Mitchell'
      ? SARAH_UPDATE_WORDING
      : primary?.rvgGroupId !== undefined
        ? state.masters.rvgGroups[primary.rvgGroupId]?.description
        : primary?.procedureText?.text
  return {
    hospitalId: list.hospitalId,
    dateISO: list.dateISO,
    session: list.session,
    ...(booking.correlationRef !== undefined ? { externalRef: booking.correlationRef.externalAppointmentId } : {}),
    ...(surgeon !== undefined ? { surgeon: { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) } } : {}),
    scheduledTime: isFoster ? '12:15' : plusMinutes(booking.scheduledTime ?? '08:00', 30),
    patient: { name: patient.name, nhi: patient.nhi, ...(patient.dobISO !== '' ? { dobISO: patient.dobISO } : {}) },
    ...(text !== undefined && text.trim() !== '' ? { procedure: { text } } : {}),
    ...(isFoster ? { note: 'Bumped 15 min at surgeon request' } : {}),
    hospitalStatus: 'booked',
  }
}

function updatable(state: AppState, bookingId: string | undefined): Booking | undefined {
  if (bookingId === undefined) return undefined
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (booking === undefined || list === undefined || booking.cancellation !== undefined || list.state === 'AUTHORISED') return undefined
  return booking
}

/** The Booking an update targets: the one the selected row matched, if open and not authorised; else Diane Foster's. */
export function updateTarget(state: AppState, selectedRowId: string | undefined): string | undefined {
  const selected = selectedRowId !== undefined ? assessImportRow(state, selectedRowId)?.match?.bookingId : undefined
  return updatable(state, selected)?.id ?? updatable(state, fosterBookingId(state))?.id
}

export function sendUpdateRefusal(state: AppState, selectedRowId: string | undefined): string | null {
  const target = updateTarget(state, selectedRowId)
  if (target === undefined) return 'Select a row matched to an open Booking'
  const fields = updateRowFor(state, target)
  if (fields === undefined) return 'Select a row matched to an open Booking'
  const same = Object.values(state.intake.rows).filter((r) => sameIncoming(r.incoming, fields))
  if (same.some((r) => r.status === 'open')) return 'This update is already waiting on Matching'
  return same.length > 0 ? 'This update was already sent' : null
}

/** Stage the hospital's later update for a matched Booking: it waits for the office to approve it (US-02.1.3). */
export function stageUpdateForBooking(api: AppStoreApi, actor: Actor, bookingId: string): Outcome<{ rowId: string; patient: string; hospital: string }> {
  const state = api.getState()
  const fields = updateRowFor(state, bookingId)
  if (fields === undefined) return refuse('notFound', 'Select a row matched to an open Booking')
  const staged = stageImportRows(api, actor, 'download', fields.hospitalId, `${hospitalName(state, fields.hospitalId)} update (sample)`, [fields])
  if (!staged.ok) return staged
  const rowId = staged.value.rowIds[0]
  if (rowId === undefined) return refuse('alreadyReceived', 'This update is already waiting on Matching')
  return ok({ rowId, patient: fields.patient.name, hospital: hospitalName(state, fields.hospitalId) })
}

// ---------------------------------------------------------------------------
// The PWA office stand-in
// ---------------------------------------------------------------------------

/** Three synthetic patients with AR-35 wording and valid NHIs, used in order (the stand-in's "new hospital booking"). */
export const STAND_IN_POOL: readonly { name: string; nhi: string; dobISO: string; text: string; time: string }[] = [
  { name: 'Mere Tautahi', nhi: 'ZQA4333', dobISO: '1966-07-18', text: 'R inguinal hernia mesh', time: '10:30' },
  { name: 'Liam Gordon', nhi: 'ZQA4708', dobISO: '1981-12-06', text: 'L knee scope + partial menisectomy', time: '11:15' },
  { name: 'Hana Ruru', nhi: 'ZQA5445', dobISO: '1991-04-14', text: 'carpal tunnel decomp L', time: '12:00' },
]

const STAND_IN_HOSPITALS = new Set(['H-STG', 'H-SX'])

function patientOnList(state: AppState, listId: string, nhi: string): boolean {
  return Object.values(state.schedule.bookings).some((b) => b.listId === listId && b.cancellation === undefined && state.masters.patients[b.patientId]?.nhi === nhi)
}

/** The next unused pool patient for a List, or undefined (none left, or the List cannot take one). */
export function nextPoolPatient(state: AppState, listId: string): (typeof STAND_IN_POOL)[number] | undefined {
  const list = state.schedule.lists[listId]
  // The persona's own ACTIVE List at an integrated hospital (Dr Souter in the PWA).
  if (list === undefined || list.state !== 'ACTIVE' || list.anaesthetistId !== ANAE.souter || !STAND_IN_HOSPITALS.has(list.hospitalId)) return undefined
  return STAND_IN_POOL.find((p) => !patientOnList(state, listId, p.nhi) && !Object.values(state.intake.rows).some((r) => r.incoming.patient.nhi === p.nhi && r.incoming.dateISO === list.dateISO))
}

function newRowForList(state: AppState, listId: string): IncomingBookingFields | undefined {
  const list = state.schedule.lists[listId]
  const p = nextPoolPatient(state, listId)
  if (list === undefined || p === undefined) return undefined
  const surgeon = list.surgeonId != null ? state.masters.surgeons[list.surgeonId] : undefined
  return {
    hospitalId: list.hospitalId,
    dateISO: list.dateISO,
    session: list.session,
    ...(surgeon !== undefined ? { surgeon: { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) } } : {}),
    scheduledTime: p.time,
    patient: { name: p.name, nhi: p.nhi, dobISO: p.dobISO },
    procedure: { text: p.text },
    hospitalStatus: 'booked',
  }
}

export type StandInChoice = { kind: 's1' } | { kind: 'list'; listId: string } | { kind: 'booking'; bookingId: string }

/** S1's List: Dr Souter's Tue 28 Jul AM at St George's (SAMPLE_STG R1 and R2). */
export const S1_LIST_ID = projectedListId(ANAE.souter, '2026-12-01', 'AM')

/** The St George's file's rows for S1's List: Sarah Mitchell (new) and Dylan Kereama (no change). */
const S1_ROWS = SAMPLE_STG.rows.filter((r) => r.dateISO === '2026-12-01' && r.session === 'AM')

/**
 * The S1 rows the stand-in may still decide: each not yet staged, or open and
 * confident (ready, with a create or match suggestion onto S1's List).
 */
function s1Pending(state: AppState): IncomingBookingFields[] {
  return S1_ROWS.filter((fields) => {
    const rows = Object.values(state.intake.rows).filter((r) => sameIncoming(r.incoming, fields))
    if (rows.length === 0) return true
    const open = rows.find((r) => r.status === 'open')
    if (open === undefined) return false
    const a = assessImportRow(state, open.id)
    return a !== undefined && a.queue === 'ready' && confidentOnS1(state, a.suggestion)
  })
}

function confidentOnS1(state: AppState, suggestion: SuggestedDecision | undefined): boolean {
  if (suggestion === undefined) return false
  if (suggestion.kind === 'createBooking') return suggestion.listId === S1_LIST_ID
  if (suggestion.kind === 'match') return state.schedule.bookings[suggestion.bookingId]?.listId === S1_LIST_ID
  return false
}

export function standInRefusal(state: AppState, choice: StandInChoice): string | null {
  if (choice.kind === 's1') return s1Pending(state).length === 0 ? 'Nothing new from the hospital for your Lists' : null
  if (choice.kind === 'list') {
    const list = state.schedule.lists[choice.listId]
    if (list === undefined || list.state !== 'ACTIVE') return 'This List is not open for new Bookings'
    return newRowForList(state, choice.listId) === undefined ? 'No more sample hospital bookings for this List' : null
  }
  const booking = state.schedule.bookings[choice.bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (booking === undefined || list === undefined) return 'Booking not found'
  if (list.state === 'AUTHORISED') return 'This List is authorised and locked'
  const fields = updateRowFor(state, choice.bookingId)
  if (fields === undefined) return 'This Booking has no NHI to match on'
  // One approved update per Booking: a later time would otherwise make a new update on every run.
  const applied = Object.values(state.intake.rows).some(
    (r) => r.status === 'applied' && r.decision?.kind === 'match' && r.decision.bookingId === choice.bookingId && state.intake.batches[r.batchId]?.label.endsWith('(sample)') === true && r.decision.changeType === 'modification',
  )
  return applied || Object.values(state.intake.rows).some((r) => r.status === 'applied' && sameIncoming(r.incoming, fields)) ? 'This update was already applied' : null
}

/**
 * S1 on the handset (catch-up Phase 34): the St George's file imported as Admin
 * Intake does (33's dedupe), then, as `OFFICE_SIMULATION_ACTOR`, each confident
 * row for S1's List decided with its suggestion, and each Booking it created
 * given the rail's answer for a patient paying at the standard rate: No contract
 * · RVG on every Procedure (never on a matched Booking). The file's other rows
 * stay open for the office. One transaction: a refusal part way leaves nothing
 * half-applied.
 */
export function officeImportsS1File(api: AppStoreApi): Outcome<{ created: string[]; patients: string[] }> {
  const reason = standInRefusal(api.getState(), { kind: 's1' })
  if (reason !== null) return refuse('standInRefused', reason)
  return transaction(api, () => {
    const imported = importHospitalDownload(api, OFFICE_SIMULATION_ACTOR, SAMPLE_STG.id)
    if (!imported.ok) return imported
    const created: string[] = []
    const patients: string[] = []
    for (const fields of S1_ROWS) {
      const state = api.getState()
      const row = Object.values(state.intake.rows).find((r) => r.status === 'open' && sameIncoming(r.incoming, fields))
      if (row === undefined) continue
      const a = assessImportRow(state, row.id)
      const suggestion = a?.suggestion
      if (a === undefined || a.queue !== 'ready' || suggestion === undefined || !confidentOnS1(state, suggestion)) continue
      const input: DecisionInput =
        suggestion.kind === 'match'
          ? { kind: 'match', bookingId: suggestion.bookingId, fieldsApplied: suggestion.fieldsApplied }
          : { kind: 'createBooking', listId: S1_LIST_ID }
      const decided = decideImportRow(api, OFFICE_SIMULATION_ACTOR, row.id, input)
      if (!decided.ok) return decided
      if (input.kind !== 'createBooking' || decided.value.bookingId === undefined) continue
      created.push(decided.value.bookingId)
      patients.push(fields.patient.name)
      for (const p of proceduresForBooking(api.getState(), decided.value.bookingId)) {
        if (p.governingContractId !== undefined) continue
        const set = setProcedureContract(api, OFFICE_SIMULATION_ACTOR, p.id, CONTRACT.noContractRvg)
        if (!set.ok) return set
      }
    }
    return ok({ created, patients })
  })
}

/**
 * The hospital row arrives and the office matches it (PWA only): stage the row,
 * then `decideImportRow` as `OFFICE_SIMULATION_ACTOR` with the derived
 * suggestion, every difference ticked, no Contract or RVG code pick. (The S1
 * choice is `officeImportsS1File`.)
 */
export function officeMatchesHospitalRow(api: AppStoreApi, choice: Exclude<StandInChoice, { kind: 's1' }>): Outcome<{ bookingId: string; patient: string; where: string; hospital: string }> {
  const state = api.getState()
  const reason = standInRefusal(state, choice)
  if (reason !== null) return refuse('standInRefused', reason)
  const fields = choice.kind === 'list' ? newRowForList(state, choice.listId) : updateRowFor(state, choice.bookingId)
  if (fields === undefined) return refuse('notFound', 'Nothing to send')
  // A row already staged with these fields (the S1 row imported on Admin, say) is decided as it stands.
  const existing = Object.values(state.intake.rows).find((r) => r.status === 'open' && sameIncoming(r.incoming, fields))
  let rowId = existing?.id
  if (rowId === undefined) {
    const staged = stageImportRows(api, OFFICE_SIMULATION_ACTOR, 'download', fields.hospitalId, `${hospitalName(state, fields.hospitalId)} theatre list (sample)`, [fields])
    if (!staged.ok) return staged
    rowId = staged.value.rowIds[0]
  }
  if (rowId === undefined) return refuse('alreadyReceived', 'This row was already decided')
  const assessment = assessImportRow(api.getState(), rowId)
  const suggestion = assessment?.suggestion
  if (assessment === undefined || suggestion === undefined || suggestion.kind === 'reject') return refuse('noSuggestion', assessment?.unmatchedReason ?? 'The office could not match this row')
  const input: DecisionInput =
    suggestion.kind === 'match'
      ? { kind: 'match', bookingId: suggestion.bookingId, fieldsApplied: suggestion.fieldsApplied }
      : { kind: 'createBooking', listId: suggestion.listId }
  const decided = decideImportRow(api, OFFICE_SIMULATION_ACTOR, rowId, input)
  if (!decided.ok) return decided
  const f = effectiveIncoming(api.getState().intake.rows[rowId]!)
  return ok({ bookingId: decided.value.bookingId!, patient: f.patient.name, where: sessionLabel(f.dateISO, f.session), hospital: hospitalName(api.getState(), f.hospitalId) })
}
