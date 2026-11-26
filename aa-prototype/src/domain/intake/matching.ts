/**
 * The matching screen's pure matcher (catch-up Phase 33; US-02.1.2, US-02.1.3,
 * US-02.1.4, FT-02.5; AR-21 `look-for-match`, `match-found`,
 * `review-differences`). No React, no store import: the store builds a plain
 * `MatchingView` and every function here reads it.
 *
 * - The match key is the List's hospital, date, session and surgeon, then the
 *   patient's NHI on it (`findMatch`, one function, so a change of key is one
 *   edit). Never by name alone, never by the hospital's appointment id, never
 *   on another day: a Booking on another day is another Booking (D62).
 * - Suggestions are derived at read time and never stored, so they never go
 *   stale. A suggestion never carries a Contract or an RVG code (FT-02.1: no
 *   automated decisions; OQ-78: no default Contract).
 * - A row with no NHI waits (D11): no suggestion, only Reject or adding the
 *   NHI; it exposes the List it would land on for Phase 33a's stub (D66).
 */

import type {
  ChangeType,
  ImportChannel,
  ImportDecision,
  ImportRow,
  IncomingBookingFields,
  IncomingFieldKey,
  InvoiceDescription,
  ListState,
  ProcedureText,
  ProcedureTextSource,
  Session,
} from '../types'
import { validateNhi } from '../nhi'
import { titledSurname } from '../names'
import { normaliseHpiCpn } from '../surgeons'
import { shortDay } from '../dateText'
import { isBlankText, replacesProcedureText } from '../billing/procedureStack'

// ---------------------------------------------------------------------------
// The view the store hands in
// ---------------------------------------------------------------------------

export interface MatchingProcedure {
  id: string
  isPrimary: boolean
  procedureText: ProcedureText | null
  invoiceDescription: InvoiceDescription | null
  /** The chosen Contract's invoice description, or null (none chosen or blank). */
  contractInvoiceDescription: string | null
}

export interface MatchingBooking {
  id: string
  listId: string
  patient: { name: string; nhi?: string; dobISO?: string }
  scheduledTime?: string
  notes?: string
  cancelled: boolean
  funderPartyId?: string
  insuranceApprovalNumber?: string
  /** In display order: the primary first. */
  procedures: MatchingProcedure[]
}

export interface MatchingList {
  id: string
  hospitalId: string
  surgeonId?: string
  dateISO: string
  session: Session
  state: ListState
  anaesthetistId?: string
  slotId?: string
}

/** A session a new List could take: free, open and holding no List. */
export interface MatchingSlot {
  id: string
  anaesthetistId: string
  dateISO: string
  session: Session
}

export interface MatchingView {
  bookings: Readonly<Record<string, MatchingBooking>>
  lists: Readonly<Record<string, MatchingList>>
  openSlots: readonly MatchingSlot[]
  surgeons: Readonly<Record<string, { id: string; name: string; hpiId?: string }>>
  hospitals: Readonly<Record<string, { id: string; name: string }>>
  anaesthetists: Readonly<Record<string, { name: string }>>
  parties: Readonly<Record<string, { name: string }>>
  /** Every row (any status), for the duplicate flag. */
  rows: readonly ImportRow[]
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

/** Plain-language change types (FT-02.5): one map. */
export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  new: 'New',
  modification: 'Modification',
  cancellation: 'Cancellation',
  noChange: 'No change',
}

export const INCOMING_FIELD_LABELS: Record<IncomingFieldKey, string> = {
  time: 'Time',
  patientName: 'Patient name',
  dob: 'Date of birth',
  nhi: 'NHI',
  procedureText: 'Procedure as received',
  insurer: 'Insurer or funder',
  note: 'Note',
}

/** How a row arrived, in words (app copy says "import", never "download"). */
export const IMPORT_CHANNEL_LABELS: Record<ImportChannel, string> = {
  download: 'Hospital import',
  manualSheet: 'Keyed sheet',
  feedMessage: 'Future-scope HL7 demo',
  pdfList: 'Rooms PDF',
}

/** The office's decisions, in words. */
export const DECISION_KIND_LABELS: Record<ImportDecision['kind'], string> = {
  match: 'Match and apply',
  createBooking: 'Create a Booking on a List',
  createList: 'Create a List in a session',
  createDraft: 'Create a Draft List',
  reject: 'Reject',
  leftOut: 'Left out',
}

export const NO_NHI_REASON = 'No NHI. Add the NHI to continue.'

/**
 * The procedure text's change-history source for a row's channel (US-02.5.7):
 * a hospital's imported file, its feed, or a sheet the office keyed.
 */
export function sourceTextChannelFor(channel: ImportChannel): ProcedureTextSource {
  switch (channel) {
    case 'download':
      return 'hospitalDownload'
    case 'feedMessage':
      return 'hospitalFeed'
    case 'manualSheet':
      return 'hospitalSheet'
    case 'pdfList':
      return 'surgeonPdf'
  }
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

/** The row's fields with the office's corrections laid over them. The wording is never corrected. */
export function effectiveIncoming(row: Pick<ImportRow, 'incoming' | 'corrections'>): IncomingBookingFields {
  const c = row.corrections
  if (c === undefined) return row.incoming
  const patient = { ...row.incoming.patient }
  if (c.nhi !== undefined) patient.nhi = c.nhi
  if (c.patientName !== undefined) patient.name = c.patientName
  if (c.dobISO !== undefined) patient.dobISO = c.dobISO
  return {
    ...row.incoming,
    patient,
    ...(c.scheduledTime !== undefined ? { scheduledTime: c.scheduledTime } : {}),
  }
}

/** The row's NHI, normalised, when it is present and valid. */
export function validNhiOf(fields: IncomingBookingFields): string | undefined {
  const raw = fields.patient.nhi
  if (raw === undefined || raw.trim() === '') return undefined
  const v = validateNhi(raw)
  return v.valid ? v.normalised : undefined
}

export function hasNhi(fields: IncomingBookingFields): boolean {
  return fields.patient.nhi !== undefined && fields.patient.nhi.trim() !== ''
}

export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/^(dr|mr|ms|mrs|miss|prof)\.?\s+/, '').replace(/[^a-z]/g, '')
}

/** The surname alone, lower case, for a loose name match ("Mr T. Hale" and "Mr Hale"). */
function surnameKey(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts[parts.length - 1] ?? '').toLowerCase().replace(/[^a-z]/g, '')
}

/**
 * The row's surgeon (OQ-52): by HPI CPN when the row carries one, else by
 * name (exact without the title, then a unique surname). The office's picked
 * surgeon (a correction) wins.
 */
export function resolveSurgeon(view: Pick<MatchingView, 'surgeons'>, row: Pick<ImportRow, 'incoming' | 'corrections'>): string | undefined {
  if (row.corrections?.surgeonId !== undefined && view.surgeons[row.corrections.surgeonId] !== undefined) return row.corrections.surgeonId
  const sent = row.incoming.surgeon
  if (sent === undefined) return undefined
  const all = Object.values(view.surgeons)
  if (sent.hpiId !== undefined && sent.hpiId.trim() !== '') {
    const cpn = normaliseHpiCpn(sent.hpiId)
    const byCpn = all.find((s) => s.hpiId !== undefined && normaliseHpiCpn(s.hpiId) === cpn)
    if (byCpn !== undefined) return byCpn.id
  }
  const exact = all.filter((s) => normaliseName(s.name) === normaliseName(sent.name))
  if (exact.length === 1) return exact[0]!.id
  const bySurname = all.filter((s) => surnameKey(s.name) === surnameKey(sent.name))
  return bySurname.length === 1 ? bySurname[0]!.id : undefined
}

// ---------------------------------------------------------------------------
// The match (US-02.1.3's key)
// ---------------------------------------------------------------------------

export type MatchBasis = 'listAndPatient' | 'patientOnDay' | 'byHand'

export const MATCH_BASIS_LABELS: Record<MatchBasis, string> = {
  listAndPatient: 'Matched by date, surgeon, hospital and session, then NHI',
  patientOnDay: 'Matched by NHI at this hospital on that day',
  byHand: 'Chosen by hand',
}

export interface RowMatch {
  bookingId: string
  listId: string
  basis: MatchBasis
}

/** Lists that can hold the row: not removed (the caller's view holds none), at the key. */
export function listsAtKey(view: Pick<MatchingView, 'lists'>, fields: IncomingBookingFields, surgeonId: string | undefined): MatchingList[] {
  return Object.values(view.lists)
    .filter(
      (l) =>
        l.hospitalId === fields.hospitalId &&
        l.dateISO === fields.dateISO &&
        l.session === fields.session &&
        (surgeonId === undefined || l.surgeonId === surgeonId),
    )
    .sort((a, b) => a.id.localeCompare(b.id))
}

function bookingFor(view: Pick<MatchingView, 'bookings'>, listIds: readonly string[], nhi: string, cancelled: boolean): MatchingBooking | undefined {
  const ids = new Set(listIds)
  return Object.values(view.bookings)
    .filter((b) => ids.has(b.listId) && b.cancelled === cancelled && b.patient.nhi === nhi)
    .sort((a, b) => a.id.localeCompare(b.id))[0]
}

/**
 * The List, then the patient (US-02.1.3; AR-21 `look-for-match`): the List at
 * the row's hospital, date and session with its surgeon, then the Booking on
 * it for the patient's valid NHI. With the surgeon unrecognised, the patient's
 * NHI on that hospital's Lists that day and session. A non-cancelled Booking is
 * preferred; a cancelled one is returned with `cancelled` so the row is flagged.
 */
export function findMatch(
  view: Pick<MatchingView, 'bookings' | 'lists'>,
  fields: IncomingBookingFields,
  surgeonId: string | undefined,
): (RowMatch & { cancelled: boolean }) | undefined {
  const nhi = validNhiOf(fields)
  if (nhi === undefined) return undefined
  const basis: MatchBasis = surgeonId !== undefined ? 'listAndPatient' : 'patientOnDay'
  const listIds = listsAtKey(view, fields, surgeonId).map((l) => l.id)
  const live = bookingFor(view, listIds, nhi, false)
  if (live !== undefined) return { bookingId: live.id, listId: live.listId, basis, cancelled: false }
  const gone = bookingFor(view, listIds, nhi, true)
  if (gone !== undefined) return { bookingId: gone.id, listId: gone.listId, basis, cancelled: true }
  return undefined
}

/**
 * The office's search by hand (AR-21: "the admin can also search by hand"):
 * by patient name or NHI across that hospital's non-cancelled Bookings on the
 * row's date, at most 20.
 */
export function searchBookingsForRow(view: Pick<MatchingView, 'bookings' | 'lists'>, fields: IncomingBookingFields, query: string): MatchingBooking[] {
  const q = query.trim().toLowerCase()
  return Object.values(view.bookings)
    .filter((b) => {
      const list = view.lists[b.listId]
      if (list === undefined || b.cancelled) return false
      if (list.hospitalId !== fields.hospitalId || list.dateISO !== fields.dateISO) return false
      if (q === '') return true
      return b.patient.name.toLowerCase().includes(q) || (b.patient.nhi ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? '') || a.id.localeCompare(b.id))
    .slice(0, 20)
}

// ---------------------------------------------------------------------------
// Differences (US-02.1.3)
// ---------------------------------------------------------------------------

/** What the hospital's text does to the invoice description (D37, D73), read from the recorded origin. */
export type InvoiceEffect = 'replaces' | 'keptContract' | 'keptEdit'

export const INVOICE_EFFECT_LABELS: Record<InvoiceEffect, string> = {
  replaces: 'Also becomes the invoice description',
  keptContract: "The Contract's invoice description stays",
  keptEdit: "The admin's edited description stays; newer hospital text has arrived",
}

export interface FieldDiff {
  key: IncomingFieldKey
  label: string
  current: string | null
  incoming: string
  /** `replaces` for the text (the current one kept in the change history), `appends` for a note, `flagged` for an NHI (never applied). */
  effect: 'sets' | 'replaces' | 'appends' | 'flagged'
  invoiceEffect?: InvoiceEffect
}

/** The procedure a row's text goes to: the primary, else the first. */
export function targetProcedure(booking: Pick<MatchingBooking, 'procedures'>): MatchingProcedure | undefined {
  return booking.procedures.find((p) => p.isPrimary) ?? booking.procedures[0]
}

export function invoiceEffectFor(procedure: Pick<MatchingProcedure, 'invoiceDescription' | 'contractInvoiceDescription'>): InvoiceEffect {
  if (procedure.invoiceDescription?.origin === 'edited') return 'keptEdit'
  if (!isBlankText(procedure.contractInvoiceDescription)) return 'keptContract'
  return 'replaces'
}

/** The hospital note line appended to the Booking's notes ("St George's, 21 Jul: ..."). */
export function hospitalNoteLine(hospitalName: string, receivedAtISO: string, note: string): string {
  return `${hospitalName}, ${shortDay(receivedAtISO.slice(0, 10)).replace(/^\w+ /, '')}: ${note}`
}

/**
 * The field-level differences between the matched Booking and the row
 * (US-02.1.3). The date, session and List are the key, so they never differ;
 * a field the hospital did not supply is skipped (never a change). The text is
 * compared character for character with the target Procedure's current text,
 * with no check against the rooms' wording (US-02.5.7); a difference replaces
 * it. The insurer is a difference only when the row names an insurer or
 * funder Party (Phase 21's field); otherwise it is shown as a note.
 */
export function diffFields(
  view: Pick<MatchingView, 'parties'>,
  booking: MatchingBooking,
  row: Pick<ImportRow, 'incoming' | 'corrections' | 'channel'>,
): { diffs: FieldDiff[]; insurerNote?: { text: string; approvalNumber?: string } } {
  const fields = effectiveIncoming(row)
  const diffs: FieldDiff[] = []
  const push = (key: IncomingFieldKey, current: string | null | undefined, incoming: string, effect: FieldDiff['effect'] = 'sets') =>
    diffs.push({ key, label: INCOMING_FIELD_LABELS[key], current: current ?? null, incoming, effect })

  if (fields.scheduledTime !== undefined && fields.scheduledTime !== booking.scheduledTime) push('time', booking.scheduledTime, fields.scheduledTime)
  if (fields.patient.name.trim() !== '' && fields.patient.name.trim() !== booking.patient.name) push('patientName', booking.patient.name, fields.patient.name.trim())
  if (fields.patient.dobISO !== undefined && fields.patient.dobISO !== '' && fields.patient.dobISO !== booking.patient.dobISO) {
    push('dob', booking.patient.dobISO, fields.patient.dobISO)
  }
  const nhi = validNhiOf(fields)
  if (nhi !== undefined && booking.patient.nhi !== undefined && nhi !== booking.patient.nhi) push('nhi', booking.patient.nhi, nhi, 'flagged')

  const text = fields.procedure?.text
  const procedure = targetProcedure(booking)
  if (text !== undefined && !isBlankText(text) && procedure !== undefined) {
    if (replacesProcedureText(procedure.procedureText, { text, source: sourceTextChannelFor(row.channel) })) {
      diffs.push({
        key: 'procedureText',
        label: INCOMING_FIELD_LABELS.procedureText,
        current: procedure.procedureText?.text ?? null,
        incoming: text,
        effect: 'replaces',
        invoiceEffect: invoiceEffectFor(procedure),
      })
    }
  }

  let insurerNote: { text: string; approvalNumber?: string } | undefined
  const insurer = fields.insurer
  if (insurer !== undefined) {
    if (insurer.insurerPartyId !== undefined) {
      const partyChanged = insurer.insurerPartyId !== booking.funderPartyId
      const numberChanged = insurer.approvalNumber !== undefined && insurer.approvalNumber !== booking.insuranceApprovalNumber
      if (partyChanged || numberChanged) {
        const name = (id: string | undefined) => (id === undefined ? undefined : (view.parties[id]?.name ?? id))
        const describe = (party: string | undefined, number: string | undefined) =>
          party === undefined ? null : number !== undefined ? `${party} · Approval ${number}` : party
        const current = describe(name(booking.funderPartyId), booking.insuranceApprovalNumber)
        diffs.push({
          key: 'insurer',
          label: INCOMING_FIELD_LABELS.insurer,
          current,
          incoming: describe(name(insurer.insurerPartyId), insurer.approvalNumber ?? booking.insuranceApprovalNumber) ?? insurer.text,
          effect: 'sets',
        })
      }
    } else {
      insurerNote = { text: insurer.text, ...(insurer.approvalNumber !== undefined ? { approvalNumber: insurer.approvalNumber } : {}) }
    }
  }

  if (fields.note !== undefined && fields.note.trim() !== '' && !(booking.notes ?? '').includes(fields.note.trim())) {
    push('note', booking.notes, fields.note.trim(), 'appends')
  }
  return { diffs, ...(insurerNote !== undefined ? { insurerNote } : {}) }
}

/** New with no match; Cancellation when the hospital cancelled; Modification on any difference; else No change. */
export function classifyChange(match: { cancelled: boolean } | undefined, fields: IncomingBookingFields, diffs: readonly FieldDiff[]): ChangeType {
  if (match === undefined) return 'new'
  if (fields.hospitalStatus === 'cancelled') return match.cancelled ? 'noChange' : 'cancellation'
  return diffs.length > 0 ? 'modification' : 'noChange'
}

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

export type RowFlagCode = 'nhiInvalid' | 'noNhi' | 'surgeonNotRecognised' | 'listAuthorised' | 'bookingCancelled' | 'earlierRowOpen' | 'noWording'

export interface RowFlag {
  code: RowFlagCode
  label: string
  /** `all`: no decision; `allButReject`: only Reject; `apply`: the match cannot be applied. Absent: mild. */
  blocks?: 'all' | 'allButReject' | 'apply'
  /** The other open row (`earlierRowOpen`). */
  otherRowId?: string
}

export const ROW_FLAG_LABELS: Record<RowFlagCode, string> = {
  nhiInvalid: 'NHI invalid',
  noNhi: 'No NHI',
  surgeonNotRecognised: 'Surgeon not recognised',
  listAuthorised: 'List authorised',
  bookingCancelled: 'Booking cancelled',
  earlierRowOpen: 'Earlier row for this Booking still open',
  noWording: 'No procedure wording sent',
}

/** The duplicate key: hospital, date, session and the patient (NHI, else name and date of birth). */
export function rowPatientKey(fields: IncomingBookingFields): string {
  const nhi = validNhiOf(fields) ?? (fields.patient.nhi ?? '').trim().toUpperCase()
  const who = nhi !== '' ? nhi : `${normaliseName(fields.patient.name)}|${fields.patient.dobISO ?? ''}`
  return `${fields.hospitalId}|${fields.dateISO}|${fields.session}|${who}`
}

function earlierOpenRow(view: Pick<MatchingView, 'rows'>, row: ImportRow): ImportRow | undefined {
  const key = rowPatientKey(effectiveIncoming(row))
  return view.rows
    .filter((r) => r.id !== row.id && r.status === 'open' && r.id.localeCompare(row.id) < 0 && rowPatientKey(effectiveIncoming(r)) === key)
    .sort((a, b) => a.id.localeCompare(b.id))[0]
}

// ---------------------------------------------------------------------------
// The suggestion
// ---------------------------------------------------------------------------

export type SuggestedDecision =
  | { kind: 'match'; bookingId: string; changeType: ChangeType; fieldsApplied: IncomingFieldKey[] }
  | { kind: 'createBooking'; listId: string }
  | { kind: 'reject'; reason: string }

export interface RowAssessment {
  rowId: string
  fields: IncomingBookingFields
  surgeonId?: string
  changeType: ChangeType
  match?: RowMatch & { cancelled: boolean }
  diffs: FieldDiff[]
  insurerNote?: { text: string; approvalNumber?: string }
  suggestion?: SuggestedDecision
  unmatchedReason?: string
  waitingForNhi: boolean
  /** The List the row would land on (hospital, date, session and surgeon), for Phase 33a's stub (D66). */
  targetListId?: string
  flags: RowFlag[]
  queue: 'ready' | 'unmatched'
}

function surgeonLabel(view: Pick<MatchingView, 'surgeons'>, surgeonId: string | undefined, fields: IncomingBookingFields): string {
  const name = surgeonId !== undefined ? view.surgeons[surgeonId]?.name : fields.surgeon?.name
  return name !== undefined ? titledSurname(name) : 'an unknown surgeon'
}

function hospitalLabel(view: Pick<MatchingView, 'hospitals'>, hospitalId: string): string {
  return view.hospitals[hospitalId]?.name ?? hospitalId
}

/** "Tue 28 Jul AM" */
export function sessionLabel(dateISO: string, session: Session): string {
  return `${shortDay(dateISO)} ${session === 'OOH' ? 'Out-of-hours' : session}`
}

/** The List a New row would be created on: an assigned List that can take Bookings, else an unassigned Draft List. */
function newRowTarget(view: Pick<MatchingView, 'lists'>, fields: IncomingBookingFields, surgeonId: string | undefined): MatchingList | undefined {
  if (surgeonId === undefined) return undefined
  const lists = listsAtKey(view, fields, surgeonId)
  return lists.find((l) => l.state === 'ACTIVE' || l.state === 'SUBMITTED') ?? lists.find((l) => l.state === 'DRAFT')
}

/**
 * Everything the screen shows for one row (US-02.1.2 to US-02.1.4): its change
 * type, match and differences, the suggested decision, why it is unmatched,
 * and its flags. Pure: same view, same answer.
 */
export function suggestDecision(view: MatchingView, row: ImportRow): RowAssessment {
  const fields = effectiveIncoming(row)
  const surgeonId = resolveSurgeon(view, row)
  const flags: RowFlag[] = []
  const flag = (code: RowFlagCode, blocks?: RowFlag['blocks'], otherRowId?: string) =>
    flags.push({ code, label: ROW_FLAG_LABELS[code], ...(blocks !== undefined ? { blocks } : {}), ...(otherRowId !== undefined ? { otherRowId } : {}) })

  const nhiSent = hasNhi(fields)
  const nhi = validNhiOf(fields)
  if (!nhiSent) flag('noNhi', 'allButReject')
  else if (nhi === undefined) flag('nhiInvalid', 'all')
  if (fields.surgeon !== undefined && surgeonId === undefined) flag('surgeonNotRecognised')
  if (fields.surgeon === undefined && row.corrections?.surgeonId === undefined) flag('surgeonNotRecognised')
  const earlier = earlierOpenRow(view, row)
  if (earlier !== undefined) flag('earlierRowOpen', undefined, earlier.id)

  const atKey = surgeonId !== undefined ? listsAtKey(view, fields, surgeonId) : []
  // A List that can take Bookings first, as a New row's target does (33a: the stub stands where the Booking would land).
  const targetListId = (atKey.find((l) => l.state === 'ACTIVE' || l.state === 'SUBMITTED') ?? atKey.find((l) => l.state !== 'AUTHORISED') ?? atKey[0])?.id
  const where = `${hospitalLabel(view, fields.hospitalId)} for ${surgeonLabel(view, surgeonId, fields)} on ${sessionLabel(fields.dateISO, fields.session)}`
  const base = { rowId: row.id, fields, ...(surgeonId !== undefined ? { surgeonId } : {}) }

  // A row with no NHI waits, creating nothing (D11): only Reject or adding the NHI.
  if (!nhiSent) {
    return {
      ...base,
      changeType: fields.hospitalStatus === 'cancelled' ? 'cancellation' : 'new',
      diffs: [],
      unmatchedReason: NO_NHI_REASON,
      waitingForNhi: true,
      ...(targetListId !== undefined ? { targetListId } : {}),
      flags,
      queue: 'unmatched',
    }
  }

  const match = findMatch(view, fields, surgeonId)
  const booking = match !== undefined ? view.bookings[match.bookingId] : undefined
  const { diffs, insurerNote } = booking !== undefined ? diffFields(view, booking, row) : { diffs: [] as FieldDiff[], insurerNote: undefined }
  const changeType = classifyChange(match, fields, diffs)
  const text = fields.procedure?.text
  if (match === undefined && fields.hospitalStatus !== 'cancelled' && (text === undefined || isBlankText(text))) flag('noWording')
  if (match !== undefined && view.lists[match.listId]?.state === 'AUTHORISED') flag('listAuthorised', 'apply')
  if (match?.cancelled === true && fields.hospitalStatus !== 'cancelled') flag('bookingCancelled')

  const out: RowAssessment = {
    ...base,
    changeType,
    diffs,
    ...(insurerNote !== undefined ? { insurerNote } : {}),
    ...(match !== undefined ? { match } : {}),
    waitingForNhi: false,
    ...(targetListId !== undefined ? { targetListId } : {}),
    flags,
    queue: 'unmatched',
  }
  if (nhi === undefined) {
    out.unmatchedReason = 'The NHI is not valid. Correct it to continue.'
    return out
  }

  if (match !== undefined) {
    if (match.cancelled && fields.hospitalStatus !== 'cancelled') {
      out.suggestion = { kind: 'reject', reason: 'The Booking is cancelled.' }
    } else {
      out.suggestion = { kind: 'match', bookingId: match.bookingId, changeType, fieldsApplied: diffs.filter((d) => d.effect !== 'flagged').map((d) => d.key) }
    }
    out.queue = 'ready'
    return out
  }

  if (fields.hospitalStatus === 'cancelled') {
    out.unmatchedReason = `No Booking for this patient on ${surgeonLabel(view, surgeonId, fields)}'s List at ${hospitalLabel(view, fields.hospitalId)} on ${sessionLabel(fields.dateISO, fields.session)}`
    return out
  }
  const target = newRowTarget(view, fields, surgeonId)
  if (target !== undefined) {
    out.suggestion = { kind: 'createBooking', listId: target.id }
    out.queue = 'ready'
    return out
  }
  out.unmatchedReason = surgeonId === undefined ? `Surgeon not recognised: no List found at ${hospitalLabel(view, fields.hospitalId)} on ${sessionLabel(fields.dateISO, fields.session)}` : `No List at ${where}`
  return out
}

/** Who a List belongs to, in words: "Dr Souter", or "Draft List" when nobody is assigned. */
export function listOwnerLabel(view: Pick<MatchingView, 'anaesthetists'>, list: Pick<MatchingList, 'anaesthetistId'>): string {
  const name = list.anaesthetistId !== undefined ? view.anaesthetists[list.anaesthetistId]?.name : undefined
  return name !== undefined ? titledSurname(name) : 'Draft List'
}

/**
 * The suggestion in plain words (the table's Suggested column): "Create
 * Booking on Dr Souter, Tue 28 Jul AM", "Apply 3 changes", "Unmatched: no List
 * at ...", "Waiting for an NHI".
 */
export function suggestionText(view: Pick<MatchingView, 'lists' | 'anaesthetists' | 'bookings'>, a: RowAssessment): string {
  if (a.waitingForNhi) return 'Waiting for an NHI'
  const s = a.suggestion
  if (s === undefined) {
    const reason = a.unmatchedReason ?? 'no suggestion'
    return `Unmatched: ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`
  }
  switch (s.kind) {
    case 'createBooking': {
      const list = view.lists[s.listId]
      return list === undefined ? 'Create Booking' : `Create Booking on ${listOwnerLabel(view, list)}, ${sessionLabel(list.dateISO, list.session)}`
    }
    case 'match': {
      const who = view.bookings[s.bookingId]?.patient.name ?? 'the Booking'
      if (s.changeType === 'cancellation') return `Cancel ${who}'s Booking`
      if (s.changeType === 'noChange') return 'Mark as matched, nothing to change'
      return `Apply ${s.fieldsApplied.length} ${s.fieldsApplied.length === 1 ? 'change' : 'changes'} to ${who}'s Booking`
    }
    case 'reject':
      return `Reject: ${s.reason.charAt(0).toLowerCase()}${s.reason.slice(1)}`
  }
}

/** The sessions a New row's List could go in: free, open and holding no List, that date and session. */
export function openSlotsForRow(view: Pick<MatchingView, 'openSlots'>, fields: IncomingBookingFields): MatchingSlot[] {
  return view.openSlots.filter((s) => s.dateISO === fields.dateISO && s.session === fields.session)
}

/** The Lists a row could be created on: ACTIVE and SUBMITTED Lists and Draft Lists at the hospital that date and session first, then others that day. */
export function listsForRow(view: Pick<MatchingView, 'lists'>, fields: IncomingBookingFields): MatchingList[] {
  const open = Object.values(view.lists).filter((l) => l.hospitalId === fields.hospitalId && l.dateISO === fields.dateISO && l.state !== 'AUTHORISED')
  const rank = (l: MatchingList) => (l.session === fields.session ? 0 : 1)
  return open.sort((a, b) => rank(a) - rank(b) || a.session.localeCompare(b.session) || a.id.localeCompare(b.id))
}

// ---------------------------------------------------------------------------
// The queue
// ---------------------------------------------------------------------------

export interface MatchingCounts {
  open: number
  new: number
  modification: number
  cancellation: number
  unmatched: number
}

/** Each open row's assessment (ready first, then unmatched, each oldest first) and the stats strip's counts. */
export function matchingQueue(view: MatchingView, rows: readonly ImportRow[]): { assessments: RowAssessment[]; counts: MatchingCounts } {
  const open = rows.filter((r) => r.status === 'open').sort((a, b) => a.receivedAtISO.localeCompare(b.receivedAtISO) || a.id.localeCompare(b.id))
  const assessments = open.map((r) => suggestDecision(view, r))
  const counts: MatchingCounts = { open: open.length, new: 0, modification: 0, cancellation: 0, unmatched: 0 }
  for (const a of assessments) {
    if (a.queue === 'unmatched') counts.unmatched += 1
    if (a.changeType === 'new') counts.new += 1
    else if (a.changeType === 'modification') counts.modification += 1
    else if (a.changeType === 'cancellation') counts.cancellation += 1
  }
  const ordered = [...assessments.filter((a) => a.queue === 'ready'), ...assessments.filter((a) => a.queue === 'unmatched')]
  return { assessments: ordered, counts }
}
