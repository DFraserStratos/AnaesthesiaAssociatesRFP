/**
 * The PWA office stand-in behind "Hospital file imported and my booking matched" (catch-up Phase 33; re-pointed by
 * build plan Phase 68, D119). Deterministic and idempotent; PWA-safe (domain and store only).
 *
 * Every row arrives by its source through the ingest (`intakeIngest.ts`: the hospital's feed, or the rooms' mailbox
 * for a hospital that is not connected), never as the office; the office then decides through the one List-level
 * decision path (`decideArrivingLists`, as `OFFICE_SIMULATION_ACTOR`) with the derived suggestion, every difference
 * ticked and no Contract or RVG code pick (FT-02.1, OQ-78). Its S1 choice (catch-up Phase 34) has St George's send
 * its file, decides the confident rows for the persona's Tue 1 Dec AM List, and gives each Booking it created the
 * office's rail answer, No contract · RVG (D33: the RVG code stays the anaesthetist's; D125: a List-level decision
 * offers no per-row Contract pick, so the Contract is set after deciding). Exceptions stay with the office.
 */

import type { ImportDecision, IncomingBookingFields } from '../domain/types'
import { FOSTER_HOSPITAL_WORDING, SARAH_UPDATE_WORDING, SAMPLE_STG, effectiveIncoming, sessionLabel, type SuggestedDecision } from '../domain/intake'
import { APPT } from '../domain/integrations/messages'
import { ANAE } from '../domain/seed/cast'
import { FEED } from '../domain/integrations/feeds'
import { ok, refuse, transaction, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { OFFICE_SIMULATION_ACTOR } from './demoActors'
import { incomingKey, type DecisionInput } from './matchingActions'
import { decideArrivingLists, type RowDecision } from './intakeDecide'
import { mailboxPdfReceived, receiveHospitalBatch, receiveRowsForList } from './intakeIngest'
import { setProcedureContract } from './contractSelectionActions'
import { CONTRACT } from '../domain/seed/contracts'
import { projectedListId } from '../domain/slots'
import { assessImportRow } from './matchingSelectors'
import { findBookingByCorrelation, proceduresForBooking } from './selectors'

/** One definition of "the hospital sent exactly this" (the store's dedupe key). */
function sameIncoming(a: IncomingBookingFields, b: IncomingBookingFields): boolean {
  return incomingKey(a) === incomingKey(b)
}

function hospitalName(state: Pick<AppState, 'masters'>, hospitalId: string): string {
  return state.masters.hospitals[hospitalId]?.name ?? 'The hospital'
}

/** The Booking a decided row made or matched. */
function bookingIdOf(decision: ImportDecision | undefined): string | undefined {
  if (decision === undefined || decision.kind === 'reject' || decision.kind === 'leftOut') return undefined
  return decision.bookingId
}

/** A row's suggestion as the office's decision input (never a reject). */
function inputFor(suggestion: Exclude<SuggestedDecision, { kind: 'reject' }>): Exclude<DecisionInput, { kind: 'reject' }> {
  return suggestion.kind === 'match'
    ? { kind: 'match', bookingId: suggestion.bookingId, fieldsApplied: suggestion.fieldsApplied }
    : { kind: 'createBooking', listId: suggestion.listId }
}

// ---------------------------------------------------------------------------
// A hospital update for a Booking (the stand-in's "booking" choice)
// ---------------------------------------------------------------------------

/** Diane Foster's Booking (Tue 8 Dec AM, the rooms' `WLE MM`). */
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

/** The batch label the stand-in's hospital rows carry (its "already applied" check reads the suffix). */
const SAMPLE_SUFFIX = '(sample)'

/** The sample id of the stand-in's hospital update for a Booking (a rooms' PDF for a hospital that is not connected). */
function updateSampleId(bookingId: string): string {
  return `STAND-IN-UPDATE-${bookingId}`
}

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

/** S1's List: Dr Souter's Tue 1 Dec AM at St George's (SAMPLE_STG R1 and R2). */
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
    (r) => r.status === 'applied' && r.decision?.kind === 'match' && r.decision.bookingId === choice.bookingId && state.intake.batches[r.batchId]?.label.endsWith(SAMPLE_SUFFIX) === true && r.decision.changeType === 'modification',
  )
  return applied || mailboxPdfReceived(state, updateSampleId(choice.bookingId)) || Object.values(state.intake.rows).some((r) => r.status === 'applied' && sameIncoming(r.incoming, fields))
    ? 'This update was already applied'
    : null
}

/**
 * S1 on the handset (catch-up Phase 34): St George's sends its file through its
 * feed (`receiveHospitalBatch`, as the hospital; rows still open from an earlier
 * send are not sent twice), then, as `OFFICE_SIMULATION_ACTOR`, each confident
 * row for S1's List is decided with its suggestion through `decideArrivingLists`
 * (one change set), and each Booking it created is given the rail's answer for a
 * patient paying at the standard rate: No contract · RVG on every Procedure
 * (never on a matched Booking). The file's other rows stay open for the office.
 * One transaction: a refusal part way leaves nothing half-applied.
 */
export function officeImportsS1File(api: AppStoreApi): Outcome<{ created: string[]; patients: string[] }> {
  const reason = standInRefusal(api.getState(), { kind: 's1' })
  if (reason !== null) return refuse('standInRefused', reason)
  return transaction(api, () => {
    const sent = receiveHospitalBatch(api, SAMPLE_STG.hospitalId, SAMPLE_STG.label, SAMPLE_STG.rows, { sampleId: SAMPLE_STG.id })
    if (!sent.ok && sent.code !== 'alreadyWaiting') return sent
    const state = api.getState()
    const decisions: RowDecision[] = []
    for (const fields of S1_ROWS) {
      const row = Object.values(state.intake.rows).find((r) => r.status === 'open' && sameIncoming(r.incoming, fields))
      if (row === undefined) continue
      const a = assessImportRow(state, row.id)
      const suggestion = a?.suggestion
      if (a === undefined || a.queue !== 'ready' || suggestion === undefined || suggestion.kind === 'reject' || !confidentOnS1(state, suggestion)) continue
      decisions.push({ rowId: row.id, kind: 'apply', input: inputFor(suggestion) })
    }
    const created: string[] = []
    const patients: string[] = []
    if (decisions.length === 0) return ok({ created, patients })
    const decided = decideArrivingLists(api, OFFICE_SIMULATION_ACTOR, [{ rows: decisions }])
    if (!decided.ok) return decided
    for (const d of decisions) {
      if (d.kind !== 'apply' || d.input.kind !== 'createBooking') continue
      const row = api.getState().intake.rows[d.rowId]!
      const bookingId = bookingIdOf(row.decision)
      if (bookingId === undefined) continue
      created.push(bookingId)
      patients.push(row.incoming.patient.name)
      for (const p of proceduresForBooking(api.getState(), bookingId)) {
        if (p.governingContractId !== undefined) continue
        const set = setProcedureContract(api, OFFICE_SIMULATION_ACTOR, p.id, CONTRACT.noContractRvg)
        if (!set.ok) return set
      }
    }
    return ok({ created, patients })
  })
}

/**
 * The hospital row arrives and the office matches it (PWA only): the row arrives
 * by the List's hospital's own source (`receiveRowsForList`: its feed, or the
 * rooms' mailbox when it is not connected), then the office decides it through
 * `decideArrivingLists` as `OFFICE_SIMULATION_ACTOR` with the derived suggestion,
 * every difference ticked, no Contract or RVG code pick. A row already open with
 * the same fields is decided as it stands. (The S1 choice is `officeImportsS1File`.)
 */
export function officeMatchesHospitalRow(api: AppStoreApi, choice: Exclude<StandInChoice, { kind: 's1' }>): Outcome<{ bookingId: string; patient: string; where: string; hospital: string }> {
  const state = api.getState()
  const reason = standInRefusal(state, choice)
  if (reason !== null) return refuse('standInRefused', reason)
  const fields = choice.kind === 'list' ? newRowForList(state, choice.listId) : updateRowFor(state, choice.bookingId)
  if (fields === undefined) return refuse('notFound', 'Nothing to send')
  const listId = choice.kind === 'list' ? choice.listId : state.schedule.bookings[choice.bookingId]!.listId
  return transaction(api, () => {
    let rowId = Object.values(state.intake.rows).find((r) => r.status === 'open' && sameIncoming(r.incoming, fields))?.id
    if (rowId === undefined) {
      const sent = receiveRowsForList(api, listId, [fields], {
        label: `${hospitalName(state, fields.hospitalId)} theatre list ${SAMPLE_SUFFIX}`,
        sampleId: choice.kind === 'booking' ? updateSampleId(choice.bookingId) : `STAND-IN-NEW-${fields.patient.nhi ?? fields.patient.name}`,
      })
      if (!sent.ok) return sent
      rowId = sent.value.rowIds[0]
    }
    if (rowId === undefined) return refuse('alreadyReceived', 'This row was already decided')
    const assessment = assessImportRow(api.getState(), rowId)
    const suggestion = assessment?.suggestion
    if (assessment === undefined || suggestion === undefined || suggestion.kind === 'reject') return refuse('noSuggestion', assessment?.unmatchedReason ?? 'The office could not match this row')
    const decided = decideArrivingLists(api, OFFICE_SIMULATION_ACTOR, [{ rows: [{ rowId, kind: 'apply', input: inputFor(suggestion) }] }])
    if (!decided.ok) return decided
    const row = api.getState().intake.rows[rowId]!
    const f = effectiveIncoming(row)
    return ok({ bookingId: bookingIdOf(row.decision)!, patient: f.patient.name, where: sessionLabel(f.dateISO, f.session), hospital: hospitalName(api.getState(), f.hospitalId) })
  })
}
