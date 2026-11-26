/**
 * Patients (catch-up Phase 40; US-11.1.4, US-11.1.5, US-11.3.2, US-11.3.3,
 * D11, D66, D74): the shared note on a List or Booking, the office's entry
 * points for an intake row waiting for an NHI, the balance threshold and the
 * office's balance preview before a save.
 *
 * Adding an NHI goes through 33a's one resolve path (`resolveStub`, which
 * composes 33's `correctImportRow` and `decideImportRow`): there is no second
 * create path here. The NHI request goes to ONE address (the List's sender,
 * else the surgeon's first office contact), read through 17b's helper as 34
 * extends it (`officeAddressFor`), never every contact.
 */

import type { ImportRow, IsoDate, Patient, PatientDetailDifference, PatientFollowUp, SharedNote } from '../domain/types'
import { validateNhi } from '../domain/nhi'
import { effectiveIncoming, validNhiOf } from '../domain/intake/matching'
import { checksPatientBalance, detailDifferences, patientBalanceStrength, patientBalanceSummary, type PatientBalanceStrength } from '../domain/patients'
import { officeAddressFor } from '../domain/surgeonContacts'
import { buildNhiRequestEmail } from '../domain/updateEmail'
import { patientBalanceCreditText, patientBalanceMildText, patientBalanceStrongText, PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS } from '../domain/warnings'
import type { AppState, AppStoreApi } from './appStore'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import { getBooking } from './lifecycle'
import { assessImportRow } from './matchingSelectors'
import { correctImportRow } from './matchingActions'
import { resolveStub, type ResolveStubResult } from './stubActions'
import { stubForRow } from './stubSelectors'
import { patientBalanceRows } from './patientLedger'
import { resendInvoice } from './billingRun'
import { patientByNhi } from './patientLookup'
import { clearWarning } from './warnings'

export { stampBalanceCheck, type BalanceCheckTrigger } from './balanceCheck'

// ---------------------------------------------------------------------------
// The balance threshold (item 1)
// ---------------------------------------------------------------------------

export const THRESHOLD_RANGE_MESSAGE = 'Enter a whole number of days from 1 to 730.'

/** The live threshold: the rule's stored parameter, else its default. */
export function patientBalanceThresholdDays(state: Pick<AppState, 'appSettings'>): number {
  return state.appSettings.warningRules.patientBalance?.params['thresholdDays'] ?? PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS
}

/**
 * The one rule parameter with a UI (Master data): office only, a whole number
 * of days from 1 to 730. Warnings are derived live, so the new value applies
 * at the next evaluation; nothing stored is rewritten. Audited
 * `settings.patientBalanceThreshold`.
 */
export function setPatientBalanceThreshold(api: AppStoreApi, actor: Actor, days: number): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office changes the balance warning threshold.')
  if (!Number.isInteger(days) || days < 1 || days > 730) return refuse('thresholdRange', THRESHOLD_RANGE_MESSAGE)
  const state = api.getState()
  const before = patientBalanceThresholdDays(state)
  if (before === days) return ok(undefined)
  mutate(
    api,
    actor,
    { entityType: 'settings', entityId: 'patientBalance', action: 'settings.patientBalanceThreshold', before: { thresholdDays: before }, after: { thresholdDays: days } },
    (s) => {
      const current = s.appSettings.warningRules.patientBalance ?? { active: true, params: { thresholdDays: PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS } }
      return {
        appSettings: {
          ...s.appSettings,
          warningRules: { ...s.appSettings.warningRules, patientBalance: { ...current, params: { ...current.params, thresholdDays: days } } },
        },
      }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// The shared note (item 4; US-11.3.3)
// ---------------------------------------------------------------------------

export const SHARED_NOTE_MAX_LENGTH = 500
export const NOTE_REQUIRED_MESSAGE = 'Write the note first.'
export const NOTE_TOO_LONG_MESSAGE = `Keep the note to ${SHARED_NOTE_MAX_LENGTH} characters.`
export const NOTE_OWN_ONLY_MESSAGE = 'You can add a note only to your own Lists and Bookings.'

export type SharedNoteTarget = { bookingId: string } | { listId: string }

/**
 * A free-text note on a List or Booking (US-11.3.3): any actor (the office,
 * or the anaesthetist on their own List or Booking), non-empty, up to 500
 * characters, append-only with author and time. Audited `note.added`. It
 * sits beside the Booking's `notes` field and the office's List notes, which
 * stay as they are.
 */
export function addSharedNote(api: AppStoreApi, actor: Actor, target: SharedNoteTarget, text: string): Outcome<{ noteId: string }> {
  const trimmed = text.trim()
  if (trimmed === '') return refuse('noteRequired', NOTE_REQUIRED_MESSAGE)
  if (trimmed.length > SHARED_NOTE_MAX_LENGTH) return refuse('noteTooLong', NOTE_TOO_LONG_MESSAGE)
  const state = api.getState()
  const bookingId = 'bookingId' in target ? target.bookingId : undefined
  const list =
    bookingId !== undefined ? getBooking(state, bookingId)?.list : state.schedule.lists[(target as { listId: string }).listId]
  if (list === undefined || (bookingId !== undefined && state.schedule.bookings[bookingId] === undefined)) {
    return refuse('notFound', bookingId !== undefined ? 'Booking not found.' : 'List not found.')
  }
  if (actor.role === 'anaesthetist' && (actor.anaesthetistId === undefined || list.anaesthetistId !== actor.anaesthetistId)) {
    return refuse('notOwnList', NOTE_OWN_ONLY_MESSAGE)
  }
  let noteId = ''
  mutate(
    api,
    actor,
    [
      bookingId !== undefined
        ? { entityType: 'booking', entityId: bookingId, action: 'note.added', after: { text: trimmed } }
        : { entityType: 'list', entityId: list.id, action: 'note.added', after: { text: trimmed } },
    ],
    (s) => {
      const alloc = allocateId(s.counters, 'sharedNote')
      noteId = alloc.id
      const note: SharedNote = { id: alloc.id, text: trimmed, atISO: clockISO(s.clock), by: actor.who }
      if (bookingId !== undefined) {
        const b = s.schedule.bookings[bookingId]!
        return {
          schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [bookingId]: { ...b, noteLog: [...(b.noteLog ?? []), note] } } },
          counters: alloc.counters,
        }
      }
      const l = s.schedule.lists[list.id]!
      return {
        schedule: { ...s.schedule, lists: { ...s.schedule.lists, [list.id]: { ...l, noteLog: [...(l.noteLog ?? []), note] } } },
        counters: alloc.counters,
      }
    },
  )
  return ok({ noteId })
}

// ---------------------------------------------------------------------------
// Waiting rows (item 6; US-11.1.5)
// ---------------------------------------------------------------------------

export const OFFICE_ADDS_NHI_MESSAGE = 'The office adds the NHI.'
export const ROW_HAS_NHI_MESSAGE = 'This row already has an NHI.'

export type AddNhiResult = ResolveStubResult

/**
 * The office adds the NHI to a row waiting for one (US-11.1.4, US-11.1.5):
 * through 33a's one resolve path when the row's stub stands (the Booking takes
 * the stub's place, matched to the patient's single record or with the one new
 * record), else 33's `correctImportRow` alone, leaving the decision to the
 * row's arrival in Intake. Office (and the simulated office) only.
 */
export function addNhiToWaitingRow(api: AppStoreApi, actor: Actor, rowId: string, nhi: string): Outcome<AddNhiResult> {
  if (actor.role !== 'office') return refuse('officeOnly', OFFICE_ADDS_NHI_MESSAGE)
  const state = api.getState()
  const row = state.intake.rows[rowId]
  if (row === undefined) return refuse('notFound', 'Row not found.')
  if (row.status !== 'open') return refuse('alreadyDecided', 'This row has already been decided.')
  const sent = effectiveIncoming(row).patient.nhi
  if (sent !== undefined && sent.trim() !== '') return refuse('rowHasNhi', ROW_HAS_NHI_MESSAGE)
  const v = validateNhi(nhi)
  if (!v.valid) return refuse('invalidNhi', v.reason ?? 'That NHI is not valid.')
  const stub = stubForRow(state, rowId)
  if (stub !== undefined) return resolveStub(api, actor, stub.id, { kind: 'addNhi', nhi: v.normalised })
  const corrected = correctImportRow(api, actor, rowId, { nhi: v.normalised })
  if (!corrected.ok) return corrected
  return ok({ kind: 'needsDecision', reason: 'The NHI is added. The row has no List yet: decide it with its arrival.' })
}

export interface NhiRowPreview {
  /** The record the typed NHI matches, or undefined for "no record". */
  existing?: { nhi: string; name: string; dobISO: string; bookingCount: number }
  /** The row's details against that record (none when no record). */
  differences: PatientDetailDifference[]
  /** `validateNhi`'s reason when the typed NHI is not valid. */
  invalidReason?: string
}

/** For the Add NHI sheet: the record a typed NHI matches and how the row's details differ from it. */
export function nhiRowPreview(state: Pick<AppState, 'intake' | 'masters' | 'schedule'>, rowId: string, typedNhi: string): NhiRowPreview {
  const row = state.intake.rows[rowId]
  if (row === undefined) return { differences: [] }
  const v = validateNhi(typedNhi)
  if (!v.valid) return { differences: [], ...(typedNhi.trim() !== '' ? { invalidReason: v.reason ?? 'That NHI is not valid.' } : {}) }
  const patient = patientByNhi(state, v.normalised)
  if (patient === undefined) return { differences: [] }
  const incoming = effectiveIncoming(row).patient
  const bookingCount = Object.values(state.schedule.bookings).filter((b) => b.patientId === patient.hiddenInternalId && b.cancellation === undefined).length
  return {
    existing: { nhi: patient.nhi, name: patient.name, dobISO: patient.dobISO, bookingCount },
    differences: detailDifferences(patient, { name: incoming.name, ...(incoming.dobISO !== undefined ? { dobISO: incoming.dobISO } : {}) }),
  }
}

export interface NhiRequestAddress {
  /** One address only, or '' when none is held. */
  to: string
  /** The surgeon's other office addresses, offered to switch to (never filled in together). */
  alternatives: { email: string; label: string }[]
  /** Name and phone for each address offered (`to` first), from the one helper, for the row's contact line. */
  contacts: { email: string; name?: string; phone?: string }[]
}

/** Where a waiting row's NHI request goes: the List's sender, else the surgeon's first office contact (D74). */
export function nhiRequestAddressFor(state: Pick<AppState, 'intake' | 'masters' | 'schedule'>, rowId: string): NhiRequestAddress {
  const assessment = assessImportRow(state as AppState, rowId)
  if (assessment === undefined) return { to: '', alternatives: [], contacts: [] }
  const list = assessment.targetListId !== undefined ? state.schedule.lists[assessment.targetListId] : undefined
  // D74: the List's sender first. A rooms' PDF row with no List yet chases the PDF's own sender.
  const row = state.intake.rows[rowId]
  const pdfSender = row?.source === 'rooms' ? (state.intake.batches[row.batchId]?.senderEmail?.trim() ?? '') : ''
  const senderOf = list?.origin.kind === 'pdf' ? list : pdfSender !== '' ? { origin: { kind: 'pdf' as const, senderEmail: pdfSender } } : list
  const found = officeAddressFor(state.masters, assessment.surgeonId ?? list?.surgeonId ?? '', senderOf)
  if (found.to === null) return { to: '', alternatives: [], contacts: [] }
  return {
    contacts: [found.to, ...found.others].map((a) => ({ email: a.email, ...(a.name !== undefined ? { name: a.name } : {}), ...(a.phone !== undefined ? { phone: a.phone } : {}) })),
    to: found.to.email,
    alternatives: found.others.map((a) => ({ email: a.email, label: a.source === 'listSender' ? 'Sent the List' : (a.name ?? 'Office contact') })),
  }
}

/**
 * The office asks for a waiting row's NHI (US-11.1.5): the email to ONE
 * address (`nhiRequestAddressFor`; `to` may pick one of the alternatives),
 * carrying only the patient as received, the date, session, hospital,
 * surgeon, time and wording; never a DOB, an NHI, notes, money, Contract or
 * payer. Returns the `mailto:` link; audited `importRow.nhiRequested`.
 */
export function requestNhiFromOffice(api: AppStoreApi, actor: Actor, rowId: string, to?: string): Outcome<{ href: string; to: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office requests an NHI.')
  const state = api.getState()
  const row: ImportRow | undefined = state.intake.rows[rowId]
  if (row === undefined) return refuse('notFound', 'Row not found.')
  if (row.status !== 'open') return refuse('alreadyDecided', 'This row has already been decided.')
  const fields = effectiveIncoming(row)
  if (validNhiOf(fields) !== undefined) return refuse('rowHasNhi', ROW_HAS_NHI_MESSAGE)
  const email = nhiRequestEmailFor(state, rowId, to)
  if (email === undefined) return refuse('notFound', 'Row not found.')
  mutate(api, actor, { entityType: 'importRow', entityId: rowId, action: 'importRow.nhiRequested', after: { to: email.to }, stampBookingId: null }, () => ({}))
  return ok(email)
}

/**
 * The NHI request's `mailto:` link without asking yet (the Waiting for NHI
 * row's real `<a href>`; the click asks through `requestNhiFromOffice`, which
 * audits). Same address rule and the same body.
 */
export function nhiRequestEmailFor(state: Pick<AppState, 'intake' | 'masters' | 'schedule'>, rowId: string, to?: string): { href: string; to: string } | undefined {
  const row: ImportRow | undefined = state.intake.rows[rowId]
  if (row === undefined) return undefined
  const fields = effectiveIncoming(row)
  const address = nhiRequestAddressFor(state, rowId)
  const allowed = [address.to, ...address.alternatives.map((a) => a.email)].filter((a) => a !== '')
  const picked = to !== undefined && allowed.some((a) => a.toLowerCase() === to.trim().toLowerCase()) ? to.trim() : address.to
  const assessment = assessImportRow(state as AppState, rowId)
  const surgeon = assessment?.surgeonId !== undefined ? state.masters.surgeons[assessment.surgeonId]?.name : fields.surgeon?.name
  const email = buildNhiRequestEmail({
    to: picked,
    patientName: fields.patient.name,
    dateISO: fields.dateISO,
    session: fields.session,
    hospital: state.masters.hospitals[fields.hospitalId]?.name ?? fields.hospitalId,
    ...(surgeon !== undefined ? { surgeon } : {}),
    ...(fields.scheduledTime !== undefined ? { time: fields.scheduledTime } : {}),
    ...(fields.procedure?.text !== undefined ? { wording: fields.procedure.text } : {}),
  })
  return { href: email.href, to: picked }
}

// ---------------------------------------------------------------------------
// The office's balance preview before a save (item 7)
// ---------------------------------------------------------------------------

export const PATIENT_BALANCE_PREVIEW_CAPTION = 'Staff can go ahead. The warning stays on the to-do list until cleared.'

export interface PatientBalancePreview {
  strength: PatientBalanceStrength
  text?: string
}

/**
 * What the balance rule would raise for a create or match the office is about
 * to save (Admin phone advice, a matching row): reads the form's payers (one
 * per Procedure) through `checksPatientBalance`, so a guardian on every
 * Procedure hides it. Never stops the save.
 */
export function patientBalancePreview(
  state: Pick<AppState, 'billing' | 'schedule' | 'masters' | 'appSettings' | 'clock'>,
  who: { patientId: string } | { nhi: string },
  payers: readonly ({ kind: string } | undefined)[],
  opts: { excludeBookingId?: string } = {},
): PatientBalancePreview {
  if (!checksPatientBalance(payers)) return { strength: 'none' }
  const patient: Patient | undefined = 'patientId' in who ? state.masters.patients[who.patientId] : validateNhi(who.nhi).valid ? patientByNhi(state, who.nhi) : undefined
  if (patient === undefined) return { strength: 'none' }
  const threshold = patientBalanceThresholdDays(state)
  // A match excludes the matched Booking's own invoices, as the warning itself does (27's warning covers a prepayment).
  const summary = patientBalanceSummary(patientBalanceRows(state, patient.hiddenInternalId), {
    patientId: patient.hiddenInternalId,
    todayISO: state.clock.todayISO as IsoDate,
    ...(opts.excludeBookingId !== undefined ? { excludeBookingId: opts.excludeBookingId } : {}),
  })
  const strength = patientBalanceStrength(summary, threshold)
  if (strength === 'none') return { strength }
  const text =
    summary.owing.length === 0
      ? patientBalanceCreditText(patient.name, summary)
      : strength === 'strong'
        ? patientBalanceStrongText(patient.name, summary, threshold)
        : patientBalanceMildText(patient.name, summary, threshold)
  return { strength, text }
}

// ---------------------------------------------------------------------------
// The follow-up log (session 2, item 12; US-11.3.3)
// ---------------------------------------------------------------------------

export const FOLLOW_UP_TEXT_REQUIRED_MESSAGE = 'Write what happened first.'
export const FOLLOW_UP_DATE_MESSAGE = 'Pick today or a later day for the reminder.'
export const FOLLOW_UP_OFFICE_ONLY_MESSAGE = 'Only the office keeps the follow-up log.'

export type FollowUpKind = PatientFollowUp['kind']

export interface FollowUpInput {
  /** The patient, by NHI (the record's key). */
  nhi: string
  kind: FollowUpKind
  text: string
  /** A reminder's day: required for a reminder, on or after today (demo clock). */
  dueDateISO?: IsoDate
  invoiceId?: string
  warningKey?: string
}

/** A real calendar day in `YYYY-MM-DD` (no 30 February, no month 13). */
function isCalendarDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (m === null) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (mo < 1 || mo > 12 || d < 1) return false
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1]!
  return d <= days
}

export const INVOICE_NOT_THIS_PATIENT_MESSAGE = 'That invoice is not one of this patient\'s.'

/** The patient's row for the invoice (any payer, as the record lists them), or undefined when it is not theirs. */
function patientsInvoiceRow(state: Parameters<typeof patientBalanceRows>[0], patientId: string, invoiceId: string) {
  return patientBalanceRows(state, patientId).find((r) => r.invoiceId === invoiceId)
}

/**
 * Log a call, a note, a reminder or a resend on the patient record
 * (US-11.3.3): office only, non-empty text, a reminder on or after today.
 * Append-only into `patientCare.followUps`; audited `patient.followUp`.
 */
export function logPatientFollowUp(api: AppStoreApi, actor: Actor, input: FollowUpInput): Outcome<{ followUpId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', FOLLOW_UP_OFFICE_ONLY_MESSAGE)
  const state = api.getState()
  const patient = patientByNhi(state, input.nhi)
  if (patient === undefined) return refuse('notFound', 'Patient not found.')
  const text = input.text.trim()
  if (text === '') return refuse('textRequired', FOLLOW_UP_TEXT_REQUIRED_MESSAGE)
  if (input.kind === 'reminder' && (input.dueDateISO === undefined || !isCalendarDate(input.dueDateISO) || input.dueDateISO < state.clock.todayISO)) {
    return refuse('reminderDate', FOLLOW_UP_DATE_MESSAGE)
  }
  const invoice = input.invoiceId !== undefined ? state.billing.invoices[input.invoiceId] : undefined
  if (input.invoiceId !== undefined && invoice === undefined) return refuse('notFound', 'Invoice not found.')
  if (input.invoiceId !== undefined && patientsInvoiceRow(state, patient.hiddenInternalId, input.invoiceId) === undefined) return refuse('notThisPatient', INVOICE_NOT_THIS_PATIENT_MESSAGE)
  const patientId = patient.hiddenInternalId
  let followUpId = ''
  mutate(
    api,
    actor,
    {
      entityType: 'patient',
      entityId: patientId,
      action: 'patient.followUp',
      after: {
        kind: input.kind,
        text,
        ...(input.kind === 'reminder' ? { dueDateISO: input.dueDateISO } : {}),
        ...(invoice !== undefined ? { invoiceNumber: invoice.invoiceNumber } : {}),
      },
      stampBookingId: null,
    },
    (s) => {
      const alloc = allocateId(s.counters, 'followUp')
      followUpId = alloc.id
      const entry: PatientFollowUp = {
        id: alloc.id,
        patientId,
        kind: input.kind,
        text,
        ...(input.invoiceId !== undefined ? { invoiceId: input.invoiceId } : {}),
        ...(input.warningKey !== undefined ? { warningKey: input.warningKey } : {}),
        ...(input.kind === 'reminder' && input.dueDateISO !== undefined ? { dueDateISO: input.dueDateISO } : {}),
        atISO: clockISO(s.clock),
        by: actor.who,
      }
      return { patientCare: { ...s.patientCare, followUps: { ...s.patientCare.followUps, [alloc.id]: entry } }, counters: alloc.counters }
    },
  )
  return ok({ followUpId })
}

/** Tick an open reminder done (US-11.3.3): office only; audited `patient.followUpDone`. */
export function completeFollowUp(api: AppStoreApi, actor: Actor, id: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', FOLLOW_UP_OFFICE_ONLY_MESSAGE)
  const entry = api.getState().patientCare.followUps[id]
  if (entry === undefined) return refuse('notFound', 'Follow-up not found.')
  if (entry.kind !== 'reminder') return refuse('notReminder', 'Only a reminder is ticked done.')
  if (entry.doneAtISO !== undefined) return refuse('alreadyDone', 'This reminder is already done.')
  mutate(
    api,
    actor,
    { entityType: 'patient', entityId: entry.patientId, action: 'patient.followUpDone', before: { text: entry.text }, after: { done: true }, stampBookingId: null },
    (s) => {
      const current = s.patientCare.followUps[id]!
      return {
        patientCare: { ...s.patientCare, followUps: { ...s.patientCare.followUps, [id]: { ...current, doneAtISO: clockISO(s.clock), doneBy: actor.who } } },
      }
    },
  )
  return ok(undefined)
}

/** The record offers Resend only on an invoice already emailed and not credited (there is no address field to type one). */
export function canResendFromRecord(rowStatus: string, deliveryStatus: string | undefined): boolean {
  return deliveryStatus === 'sent' && rowStatus !== 'credited'
}

/**
 * The record's Resend (US-11.3.1): 22's `resendInvoice`, which appends to the
 * invoice's send history (a second send is never refused), then a `resend`
 * entry in the follow-up log naming the invoice. There is no portal delivery
 * in the model (D55's default, OQ-114 open), so every resend is an email.
 */
export function resendInvoiceFromRecord(api: AppStoreApi, actor: Actor, nhi: string, invoiceId: string, opts: { to?: string } = {}): Outcome<{ to: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can resend an invoice.')
  const state = api.getState()
  const patient = patientByNhi(state, nhi)
  if (patient === undefined) return refuse('notFound', 'Patient not found.')
  const row = patientsInvoiceRow(state, patient.hiddenInternalId, invoiceId)
  if (row === undefined) return refuse('notThisPatient', INVOICE_NOT_THIS_PATIENT_MESSAGE)
  if (!canResendFromRecord(row.status, state.billing.invoices[invoiceId]?.delivery?.status)) return refuse('notResendable', 'Only a sent invoice that is not credited is resent from the record.')
  const sent = resendInvoice(api, actor, invoiceId, opts)
  if (!sent.ok) return sent
  const invoice = api.getState().billing.invoices[invoiceId]!
  const delivery = invoice.delivery
  const to = delivery?.status === 'sent' ? (delivery.sends[delivery.sends.length - 1]?.to ?? '') : ''
  const logged = logPatientFollowUp(api, actor, { nhi, kind: 'resend', text: `Resent ${invoice.invoiceNumber} to ${to}`, invoiceId })
  if (!logged.ok) return logged
  return ok({ to })
}

/**
 * Clear a balance warning from the patient record (15a's `clearWarning`). A
 * note given with it is also logged as a `note` follow-up linked by
 * `warningKey`, so the log says why the office went ahead.
 */
export function clearBalanceWarningWithNote(api: AppStoreApi, actor: Actor, bookingId: string, key: string, note?: string): Outcome {
  const cleared = clearWarning(api, actor, bookingId, key)
  if (!cleared.ok) return cleared
  const text = note?.trim() ?? ''
  if (text === '') return cleared
  const state = api.getState()
  const booking = state.schedule.bookings[bookingId]
  const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
  if (patient === undefined) return cleared
  const logged = logPatientFollowUp(api, actor, { nhi: patient.nhi, kind: 'note', text, warningKey: key })
  return logged.ok ? ok(undefined) : logged
}
