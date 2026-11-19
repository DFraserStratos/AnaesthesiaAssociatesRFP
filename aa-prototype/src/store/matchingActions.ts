/**
 * The matching screen's store actions (catch-up Phase 33; US-02.1.1 to
 * US-02.1.4, FT-02.5; AR-21 `create-booking`, `apply-change`,
 * `record-change`).
 *
 * - `stageImportRows`: the one place rows enter (hospital imports, sheets,
 *   feed messages here; Phase 34's rooms PDF rows later). Nothing is merged or
 *   decided automatically.
 * - `decideImportRow`: the one path from a row to the schedule, the office's
 *   explicit decision (no silent apply, RV-13). It calls the existing guarded
 *   write paths as the office and records the row's decision last, with a
 *   Booking-side history entry naming the row. A refusal changes nothing: the
 *   guards are checked first, and a step refused after that still rolls the
 *   whole decision back (the Phase 11 review-fix rule).
 *
 * Every write goes through the audited `mutate()`.
 */

import { rawRowFor } from '../domain/intake/rawRow'
import type {
  ChangeType,
  ImportBatch,
  ImportChannel,
  ImportDecision,
  ImportRow,
  ImportRowCorrections,
  ImportSource,
  IncomingBookingFields,
  IncomingFieldKey,
  ListOrigin,
  OfficePicks,
  Session,
} from '../domain/types'
import { validateNhi } from '../domain/nhi'
import { isBlankText } from '../domain/billing/procedureStack'
import { isInsurerOrFunder } from '../domain/billing/insurance'
import {
  classifyChange,
  diffFields,
  effectiveIncoming,
  findMatch,
  hospitalNoteLine,
  listsForRow,
  openSlotsForRow,
  rowPatientKey,
  searchBookingsForRow,
  sourceTextChannelFor,
  targetProcedure,
  validNhiOf,
  type FieldDiff,
} from '../domain/intake/matching'
import { hospitalDownloadSample, hospitalSourceKey } from '../domain/intake/hospitalDownloads'
import { allocateId, clockISO, mutate, ok, refuse, transaction, type Actor, type MutationMeta, type Outcome, withChangeSet } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { createBooking } from './bookingActions'
import { cancelBooking, editBooking, editRefusal } from './lifecycle'
import { editPatient } from './intake'
import { applyDefaultInvoiceDescription, replaceProcedureText } from './procedureTextActions'
import { setBookingInsurance } from './insuranceActions'
import { setProcedureContract } from './contractSelectionActions'
import { pickRvgGroup } from './rvgGroupActions'
import { assignListToSlot } from './slotActions'
import { createDraftList } from './draftListActions'
import { assessImportRow, matchingView } from './matchingSelectors'
import { placeStubsForRows, settleStubForRow, stubOutcomeForDecision } from './stubSettle'
import { listSenderEmail, originAfterRoomsRow, originForNewList } from '../domain/lists/listOrigin'

function officeOnly(actor: Actor): Outcome<never> | null {
  return actor.role === 'office' ? null : refuse('officeOnly', 'Only the AA office decides rows on the matching screen.')
}

/** A stable key for "the hospital sent exactly this" (the wording character for character; never the office's corrections). */
export function incomingKey(fields: IncomingBookingFields): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : typeof v === 'object' && v !== null
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])]))
        : v
  return JSON.stringify(sort(fields))
}

// ---------------------------------------------------------------------------
// stageImportRows: the one place rows enter
// ---------------------------------------------------------------------------

export interface StageExtras {
  sampleId?: string
  messageId?: string
  /** Whose rows these are (D51): the hospital's (every Phase 33 channel) or the rooms' (Phase 34). */
  source?: ImportSource
  /** Channel `pdfList` (Phase 34): the PDF list and the address it arrived from, kept on the batch. */
  pdfListId?: string
  senderEmail?: string
}

/**
 * Stage a batch of rows (one commit, audited `importBatch.create` plus one
 * `importRow.receive` per row). A row identical to one already received, of
 * any status, is skipped and counted: a corrected or rejected row never comes
 * back on the next import. A changed row for the same Booking is staged (the
 * matcher flags the earlier one if it is still open). No batch is written when
 * every row is skipped.
 */
export function stageImportRows(
  api: AppStoreApi,
  actor: Actor,
  channel: ImportChannel,
  hospitalId: string,
  label: string,
  rows: readonly IncomingBookingFields[],
  extras: StageExtras = {},
): Outcome<{ batchId?: string; rowIds: string[]; skipped: number }> {
  const state = api.getState()
  if (state.masters.hospitals[hospitalId] === undefined) return refuse('notFound', 'Hospital not found.')
  // A row is skipped when the hospital sent exactly this before and nothing has
  // arrived for that patient since: identical to an open row, or to the latest
  // row received for the same patient, session and hospital (any status, so a
  // decided or rejected row is not restaged on every import). A later revert to
  // an earlier value is a new row (review fix).
  const existing = Object.values(state.intake.rows).sort((a, b) => a.receivedAtISO.localeCompare(b.receivedAtISO) || a.id.localeCompare(b.id))
  const openKeys = new Set(existing.filter((r) => r.status === 'open').map((r) => incomingKey(r.incoming)))
  const latest = new Map<string, string>()
  for (const r of existing) latest.set(rowPatientKey(r.incoming), incomingKey(r.incoming))
  const fresh: IncomingBookingFields[] = []
  let skipped = 0
  for (const row of rows) {
    const key = incomingKey(row)
    if (openKeys.has(key) || latest.get(rowPatientKey(row)) === key) {
      skipped += 1
      continue
    }
    openKeys.add(key)
    latest.set(rowPatientKey(row), key)
    fresh.push(row)
  }
  if (fresh.length === 0) return ok({ rowIds: [], skipped })

  const source = extras.source ?? 'hospital'
  let batchId = ''
  const rowIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const batchAlloc = allocateId(s.counters, 'importBatch')
    let counters = batchAlloc.counters
    batchId = batchAlloc.id
    const atISO = clockISO(s.clock)
    const newRows: Record<string, ImportRow> = {}
    for (const incoming of fresh) {
      const alloc = allocateId(counters, 'importRow')
      counters = alloc.counters
      rowIds.push(alloc.id)
      newRows[alloc.id] = {
        id: alloc.id,
        batchId,
        channel,
        source,
        receivedAtISO: atISO,
        incoming,
        status: 'open',
        ...(extras.messageId !== undefined ? { messageId: extras.messageId } : {}),
        // The row as sent, held under restricted access (catch-up Phase 43; US-15.0.6): written once, never edited.
        raw: rawRowFor(incoming, channel),
      }
    }
    const batch: ImportBatch = {
      id: batchId,
      channel,
      source,
      hospitalId,
      label,
      ...(extras.sampleId !== undefined ? { sampleId: extras.sampleId } : {}),
      ...(extras.pdfListId !== undefined ? { pdfListId: extras.pdfListId } : {}),
      ...(extras.senderEmail !== undefined ? { senderEmail: extras.senderEmail } : {}),
      importedBy: actor.who,
      importedAtISO: atISO,
      rowIds: [...rowIds],
      skippedCount: skipped,
    }
    metas.push({
      entityType: 'importBatch',
      entityId: batchId,
      action: 'importBatch.create',
      after: { label, channel, source, hospitalId, rows: rowIds.length, skipped },
      stampBookingId: null,
    })
    for (const id of rowIds) {
      const r = newRows[id]!
      metas.push({
        entityType: 'importRow',
        entityId: id,
        action: 'importRow.receive',
        after: { batchId, patient: r.incoming.patient.name, dateISO: r.incoming.dateISO, session: r.incoming.session },
        stampBookingId: null,
      })
    }
    return {
      intake: { ...s.intake, batches: { ...s.intake.batches, [batchId]: batch }, rows: { ...s.intake.rows, ...newRows } },
      counters,
    }
  })
  // A row with no NHI waits and creates nothing (D11); a stub stands in its place on its List (33a, D66).
  placeStubsForRows(api, actor, rowIds)
  return ok({ batchId, rowIds, skipped })
}

/**
 * Import a hospital's file (US-02.1.1; the button reads "Import hospital
 * file", D52: no sync). Stages the sample's rows; re-importing the same file
 * adds nothing.
 */
export function importHospitalDownload(
  api: AppStoreApi,
  actor: Actor,
  sampleId: string,
): Outcome<{ batchId?: string; added: number; skipped: number }> {
  const office = officeOnly(actor)
  if (office !== null) return office
  const sample = hospitalDownloadSample(sampleId)
  if (sample === undefined) return refuse('unknownSample', 'No such sample file.')
  const staged = stageImportRows(api, actor, sample.channel, sample.hospitalId, sample.label, sample.rows, { sampleId })
  if (!staged.ok) return staged
  return ok({ ...(staged.value.batchId !== undefined ? { batchId: staged.value.batchId } : {}), added: staged.value.rowIds.length, skipped: staged.value.skipped })
}

// ---------------------------------------------------------------------------
// correctImportRow
// ---------------------------------------------------------------------------

export const WORDING_KEPT_MESSAGE = "The hospital's wording is kept as received."

/**
 * The office corrects a row's identifying fields (NHI, name, date of birth,
 * time, surgeon), open rows only, audited `importRow.correct`; the original is
 * kept. The NHI is validated on entry: typing a valid NHI into a row with none
 * releases it. The procedure wording is never corrected.
 */
export function correctImportRow(api: AppStoreApi, actor: Actor, rowId: string, rawPatch: ImportRowCorrections): Outcome {
  const office = officeOnly(actor)
  if (office !== null) return office
  const patch = rawPatch as ImportRowCorrections & Record<string, unknown>
  if ('procedure' in patch || 'procedureText' in patch || 'text' in patch) return refuse('wordingKeptAsReceived', WORDING_KEPT_MESSAGE)
  const state = api.getState()
  const row = state.intake.rows[rowId]
  if (row === undefined) return refuse('notFound', 'Row not found.')
  if (row.status !== 'open') return refuse('alreadyDecided', 'This row has already been decided.')
  const next: ImportRowCorrections = { ...row.corrections }
  if (patch.nhi !== undefined) {
    const v = validateNhi(patch.nhi)
    if (!v.valid) return refuse('invalidNhi', v.reason ?? 'That NHI is not valid.')
    next.nhi = v.normalised
  }
  if (patch.patientName !== undefined) {
    if (patch.patientName.trim() === '') return refuse('nameRequired', 'The patient needs a name.')
    next.patientName = patch.patientName.trim()
  }
  if (patch.dobISO !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(patch.dobISO)) return refuse('invalidDob', 'Enter the date of birth as a date.')
    next.dobISO = patch.dobISO
  }
  if (patch.scheduledTime !== undefined) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(patch.scheduledTime)) return refuse('invalidTime', 'Enter the time as HH:MM.')
    next.scheduledTime = patch.scheduledTime
  }
  if (patch.surgeonId !== undefined) {
    if (state.masters.surgeons[patch.surgeonId] === undefined) return refuse('notFound', 'That surgeon is not in the master data.')
    next.surgeonId = patch.surgeonId
  }
  mutate(
    api,
    actor,
    { entityType: 'importRow', entityId: rowId, action: 'importRow.correct', before: row.corrections ?? {}, after: next, stampBookingId: null },
    (s) => {
      const cur = s.intake.rows[rowId]
      if (cur === undefined) return {}
      return { intake: { ...s.intake, rows: { ...s.intake.rows, [rowId]: { ...cur, corrections: next } } } }
    },
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// decideImportRow: the one place a row reaches the schedule
// ---------------------------------------------------------------------------

/** What the office chose in the panel. The ids the decision creates are filled in when it applies. */
export type DecisionInput =
  | {
      kind: 'match'
      bookingId: string
      fieldsApplied: readonly IncomingFieldKey[]
      picks?: OfficePicks
      /** "Use it" (D73): the hospital's newer text replaces the admin's edited invoice description too. */
      useNewerText?: boolean
    }
  | { kind: 'createBooking'; listId: string; picks?: OfficePicks }
  | { kind: 'createList'; slotId: string; surgeonId?: string; picks?: OfficePicks }
  | { kind: 'createDraft'; surgeonId?: string; picks?: OfficePicks }
  | { kind: 'reject'; reason: string }

export const NHI_REQUIRED_MESSAGE = 'Add the NHI first.'
export const INVALID_NHI_MESSAGE = 'Correct the NHI before applying.'
export const LIST_LOCKED_MESSAGE = 'This List is authorised and locked.'
export const SURGEON_REQUIRED_MESSAGE = 'Choose the surgeon first.'
export const WORDING_OR_CODE_MESSAGE = 'This row has no procedure wording. Choose an RVG code first.'


/** Who sent the row, in words: the hospital, its daily sheet, or the surgeon's rooms (a PDF list, Phase 34). */
function hospitalFrom(state: AppState, row: ImportRow): string {
  if (row.source === 'rooms') return `${row.incoming.surgeon?.name ?? 'The surgeon'}'s rooms`
  const name = state.masters.hospitals[row.incoming.hospitalId]?.name ?? 'The hospital'
  return row.channel === 'manualSheet' ? `${name} daily sheet` : name
}

/** The origin a List created from this row records (US-02.2.4): the rooms' PDF with its sender, or the hospital's list. */
function originFromRow(state: AppState, row: ImportRow): ListOrigin {
  const batch = state.intake.batches[row.batchId]
  return originForNewList({
    kind: 'importRow',
    source: row.source,
    hospitalId: row.incoming.hospitalId,
    ...(batch?.senderEmail !== undefined ? { senderEmail: batch.senderEmail } : {}),
    ...(batch?.pdfListId !== undefined ? { pdfListId: batch.pdfListId } : {}),
  })
}

/**
 * US-02.2.4's later-address rule, applied when a rooms row is decided onto an
 * existing List: a `pdf` List takes the newer sender, the earlier address to
 * its History (`list.senderChanged`). Anything else changes nothing.
 */
function applyRoomsSender(api: AppStoreApi, actor: Actor, row: ImportRow, listId: string): void {
  if (row.source !== 'rooms') return
  const state = api.getState()
  const list = state.schedule.lists[listId]
  const batch = state.intake.batches[row.batchId]
  if (list === undefined) return
  const next = originAfterRoomsRow(list.origin, batch?.senderEmail, batch?.pdfListId, (id) => state.intake.pdfLists[id]?.receivedAtISO)
  if (next === undefined) return
  mutate(
    api,
    actor,
    { entityType: 'list', entityId: listId, action: 'list.senderChanged', before: { senderEmail: listSenderEmail(list) }, after: { senderEmail: listSenderEmail({ origin: next }), importRowId: row.id }, stampBookingId: null },
    (s) => {
      const cur = s.schedule.lists[listId]
      if (cur === undefined) return {}
      return { schedule: { ...s.schedule, lists: { ...s.schedule.lists, [listId]: { ...cur, origin: next } } } }
    },
  )
}

function hospitalName(state: AppState, hospitalId: string): string {
  return state.masters.hospitals[hospitalId]?.name ?? 'The hospital'
}

/** The fields a row's new Booking takes: the patient, the text as received, the time, a note line, the correlation ref. */
function createInput(state: AppState, row: ImportRow, fields: IncomingBookingFields, picks: OfficePicks | undefined) {
  const text = fields.procedure?.text
  const note = fields.note !== undefined && fields.note.trim() !== '' ? hospitalNoteLine(hospitalName(state, fields.hospitalId), row.receivedAtISO, fields.note.trim()) : undefined
  return {
    patient: {
      nhi: validNhiOf(fields)!,
      name: fields.patient.name,
      dobISO: fields.patient.dobISO ?? '',
      ...(fields.patient.ethnicityCode !== undefined ? { ethnicityCode: fields.patient.ethnicityCode } : {}),
    },
    ...(text !== undefined && !isBlankText(text) ? { sourceText: { text, source: sourceTextChannelFor(row.channel), from: hospitalFrom(state, row) } } : {}),
    ...(picks?.rvgGroupId !== undefined ? { rvgGroupId: picks.rvgGroupId } : {}),
    ...(picks?.contract !== undefined ? { governingContractId: picks.contract.contractId } : {}),
    ...(picks?.contract?.enteredPrice !== undefined ? { enteredPrice: picks.contract.enteredPrice } : {}),
    ...(fields.scheduledTime !== undefined ? { scheduledTime: fields.scheduledTime } : {}),
    ...(note !== undefined ? { notes: note } : {}),
    ...(fields.externalRef !== undefined ? { correlationRef: { sourceFeedId: hospitalSourceKey(fields.hospitalId), externalAppointmentId: fields.externalRef } } : {}),
    // A rooms row's Booking is from the surgeon's PDF (Phase 34); every other row's from the hospital.
    source: row.source === 'rooms' ? ('surgeonPdf' as const) : ('hospitalDownload' as const),
  }
}

/** The row's insurer on the new or matched Booking, through Phase 21's one writer (D28: source data, never who is billed). */
function recordInsurer(api: AppStoreApi, actor: Actor, bookingId: string, fields: IncomingBookingFields): Outcome {
  const insurer = fields.insurer
  if (insurer?.insurerPartyId === undefined) return ok(undefined)
  // A number the hospital did not send is never a change: the Booking's own stays (review fix).
  const number = insurer.approvalNumber ?? api.getState().schedule.bookings[bookingId]?.insuranceApprovalNumber
  return setBookingInsurance(api, actor, bookingId, {
    funderPartyId: insurer.insurerPartyId,
    ...(number !== undefined ? { insuranceApprovalNumber: number } : {}),
  })
}

/** A create decision's guards (pre-check): something to show, and a recordable insurer. */
function createRefusal(state: AppState, fields: IncomingBookingFields, picks: OfficePicks | undefined): Outcome<never> | null {
  const text = fields.procedure?.text
  if ((text === undefined || isBlankText(text)) && picks?.rvgGroupId === undefined) return refuse('wordingOrCodeRequired', WORDING_OR_CODE_MESSAGE)
  if (picks?.recordInsurer !== false && fields.insurer?.insurerPartyId !== undefined && !isInsurerOrFunder(state.masters.parties[fields.insurer.insurerPartyId])) {
    return refuse('notInsurerOrFunder', 'The insurer the hospital sent is not an insurer or funder.')
  }
  return null
}

function stale(): Outcome<never> {
  return refuse('staleSuggestion', 'This row has changed since it was shown. Check it again.')
}

/**
 * The office's decision on a row (US-02.1.2, US-02.1.3, FT-02.5): match and
 * apply the ticked differences, create a Booking on a List, create a List in
 * an anaesthetist's session or a Draft List holding the row's Booking, or
 * reject with a reason. Applies while the List is ACTIVE or SUBMITTED, refused
 * once AUTHORISED (US-02.5.4). A Booking never moves through a row (D62); a row
 * never sets a Contract, an RVG code, a payer or a billable party itself.
 */
function decideImportRowUnscoped(
  api: AppStoreApi,
  actor: Actor,
  rowId: string,
  input: DecisionInput,
): Outcome<{ decision: ImportDecision; bookingId?: string; listId?: string }> {
  const office = officeOnly(actor)
  if (office !== null) return office
  const state = api.getState()
  const row = state.intake.rows[rowId]
  if (row === undefined) return refuse('notFound', 'Row not found.')
  if (row.status !== 'open') return refuse('alreadyDecided', 'This row has already been decided.')

  if (input.kind === 'reject') {
    if (input.reason.trim() === '') return refuse('reasonRequired', 'Give a reason to reject this row.')
    const decision: ImportDecision = { kind: 'reject', reason: input.reason.trim() }
    record(api, actor, row, decision, undefined)
    return ok({ decision })
  }

  const fields = effectiveIncoming(row)
  const nhiRaw = fields.patient.nhi
  if (nhiRaw === undefined || nhiRaw.trim() === '') return refuse('nhiRequired', NHI_REQUIRED_MESSAGE)
  if (validNhiOf(fields) === undefined) return refuse('invalidNhi', INVALID_NHI_MESSAGE)
  const assessment = assessImportRow(state, rowId)!
  const view = matchingView(state)
  const picks = input.picks

  if (input.kind === 'match') {
    const booking = view.bookings[input.bookingId]
    const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
    if (booking === undefined || list === undefined) return refuse('notFound', 'Booking not found.')
    if (list.hospitalId !== fields.hospitalId) return refuse('hospitalMismatch', 'That Booking is at another hospital.')
    const byHand = searchBookingsForRow(view, fields, '').some((b) => b.id === booking.id)
    if (assessment.match?.bookingId !== booking.id && !byHand) return stale()
    if (list.state === 'AUTHORISED') return refuse('listLocked', LIST_LOCKED_MESSAGE)
    const rights = editRefusal(actor, list)
    if (rights !== null) return rights
    const { diffs } = diffFields(view, booking, row)
    const changeType = classifyChange({ cancelled: booking.cancelled }, fields, diffs)
    if (booking.cancelled && changeType !== 'noChange') return refuse('bookingCancelled', 'This Booking is cancelled. Reject the row, or create a new Booking.')
    // With an NHI that differs (a Booking chosen by hand), the patient's name and date of birth
    // are never written: that would rename another patient's record (review fix).
    const nhiDiffers = diffs.some((d) => d.key === 'nhi')
    const applied = applicableFields(diffs, input.fieldsApplied, changeType).filter((k) => !nhiDiffers || (k !== 'patientName' && k !== 'dob'))
    if (applied.includes('insurer') && fields.insurer?.insurerPartyId !== undefined && !isInsurerOrFunder(state.masters.parties[fields.insurer.insurerPartyId])) {
      return refuse('notInsurerOrFunder', 'The insurer the hospital sent is not an insurer or funder.')
    }
    return transaction(api, () => {
      const done = applyMatch(api, actor, row, fields, booking.id, changeType, applied, picks)
      if (!done.ok) return done
      if (changeType !== 'cancellation' && changeType !== 'noChange') applyRoomsSender(api, actor, row, booking.listId)
      const target = targetProcedure(matchingView(api.getState()).bookings[booking.id]!)
      if (input.useNewerText === true && applied.includes('procedureText') && target !== undefined) {
        const used = applyDefaultInvoiceDescription(api, actor, target.id)
        if (!used.ok) return used
      }
      const recorded = changeType === 'cancellation' ? undefined : picks
      const decision: ImportDecision = { kind: 'match', bookingId: booking.id, changeType, fieldsApplied: applied, ...(recorded !== undefined ? { picks: recorded } : {}) }
      record(api, actor, row, decision, { bookingId: booking.id, changeType, fields: applied })
      return ok({ decision, bookingId: booking.id })
    })
  }

  if (fields.hospitalStatus === 'cancelled') return refuse('notANewBooking', 'A cancelled row cannot create a Booking.')
  // The patient may have been booked since the panel opened (another row applied): never a second Booking (review fix).
  const live = findMatch(view, fields, assessment.surgeonId)
  if (live !== undefined && !live.cancelled) return refuse('alreadyBooked', 'This patient is already booked in this session. Match the row to that Booking instead.')
  const createGuard = createRefusal(state, fields, picks)
  if (createGuard !== null) return createGuard

  if (input.kind === 'createBooking') {
    const list = state.schedule.lists[input.listId]
    if (list === undefined || list.removedAtISO !== undefined) return refuse('notFound', 'List not found.')
    if (list.hospitalId !== fields.hospitalId) return refuse('hospitalMismatch', 'That List is at another hospital.')
    if (list.state === 'AUTHORISED') return refuse('listLocked', LIST_LOCKED_MESSAGE)
    if (!listsForRow(view, fields).some((l) => l.id === list.id)) return stale()
    const rights = editRefusal(actor, list)
    if (rights !== null) return rights
    return transaction(api, () => {
      const created = createOnList(api, actor, row, fields, list.id, picks)
      if (!created.ok) return created
      applyRoomsSender(api, actor, row, list.id)
      const decision: ImportDecision = { kind: 'createBooking', listId: list.id, bookingId: created.value, ...(picks !== undefined ? { picks } : {}) }
      record(api, actor, row, decision, { bookingId: created.value, changeType: 'new', fields: createdFields(fields) })
      return ok({ decision, bookingId: created.value, listId: list.id })
    })
  }

  const surgeonId = input.surgeonId ?? assessment.surgeonId
  if (surgeonId === undefined || state.masters.surgeons[surgeonId] === undefined) return refuse('surgeonRequired', SURGEON_REQUIRED_MESSAGE)

  if (input.kind === 'createList') {
    const slot = state.schedule.slots[input.slotId]
    if (slot === undefined) return refuse('notFound', 'Session not found.')
    if (!openSlotsForRow(view, fields).some((s) => s.id === slot.id)) return stale()
    return transaction(api, () => {
      const placed = assignListToSlot(api, actor, slot.id, { hospitalId: fields.hospitalId, surgeonId, kind: 'private', origin: originFromRow(state, row) })
      if (!placed.ok) return placed
      const created = createOnList(api, actor, row, fields, placed.value.listId, picks)
      if (!created.ok) return created
      const decision: ImportDecision = { kind: 'createList', slotId: slot.id, listId: placed.value.listId, bookingId: created.value, ...(picks !== undefined ? { picks } : {}) }
      record(api, actor, row, decision, { bookingId: created.value, changeType: 'new', fields: createdFields(fields) })
      return ok({ decision, bookingId: created.value, listId: placed.value.listId })
    })
  }

  // createDraft (US-01.6.1, OQ-44): all four fields, holding the row's Booking.
  return transaction(api, () => {
    const text = fields.procedure?.text
    const note = `From ${row.source === 'rooms' ? `${hospitalFrom(state, row)} PDF list` : row.channel === 'manualSheet' ? hospitalFrom(state, row) : `${hospitalName(state, fields.hospitalId)} theatre list`}: ${fields.patient.name}${fields.scheduledTime !== undefined ? `, ${fields.scheduledTime}` : ''}${text !== undefined && !isBlankText(text) ? `, ${text}` : ''}`
    const draft = createDraftList(
      api,
      actor,
      { hospitalId: fields.hospitalId, surgeonId, dateISO: fields.dateISO, session: fields.session as Session, note, listOrigin: originFromRow(state, row) },
      'hospitalRow',
    )
    if (!draft.ok) return draft
    const created = createOnList(api, actor, row, fields, draft.value.listId, picks)
    if (!created.ok) return created
    const decision: ImportDecision = { kind: 'createDraft', listId: draft.value.listId, bookingId: created.value, ...(picks !== undefined ? { picks } : {}) }
    record(api, actor, row, decision, { bookingId: created.value, changeType: 'new', fields: createdFields(fields) })
    return ok({ decision, bookingId: created.value, listId: draft.value.listId })
  })
}

/** The fields a created Booking takes from the row, for its History line. */
function createdFields(fields: IncomingBookingFields): IncomingFieldKey[] {
  const out: IncomingFieldKey[] = []
  if (fields.scheduledTime !== undefined) out.push('time')
  if (fields.procedure?.text !== undefined && !isBlankText(fields.procedure.text)) out.push('procedureText')
  if (fields.insurer?.insurerPartyId !== undefined) out.push('insurer')
  if (fields.note !== undefined && fields.note.trim() !== '') out.push('note')
  return out
}

/** The ticked differences the decision may apply: never an NHI, none on a cancellation or No change. */
function applicableFields(diffs: readonly FieldDiff[], ticked: readonly IncomingFieldKey[], changeType: ChangeType): IncomingFieldKey[] {
  if (changeType !== 'modification') return []
  const tick = new Set(ticked)
  return diffs.filter((d) => d.effect !== 'flagged' && tick.has(d.key)).map((d) => d.key)
}

function createOnList(
  api: AppStoreApi,
  actor: Actor,
  row: ImportRow,
  fields: IncomingBookingFields,
  listId: string,
  picks: OfficePicks | undefined,
): Outcome<string> {
  const state = api.getState()
  // Each Procedure gets the patient as payer through 22a's creation path (this phase passes none, D85).
  const created = createBooking(api, actor, listId, createInput(state, row, fields, picks))
  if (!created.ok) return created
  if (picks?.recordInsurer !== false) {
    const insured = recordInsurer(api, actor, created.value.bookingId, fields)
    if (!insured.ok) return insured
  }
  return ok(created.value.bookingId)
}

function applyMatch(
  api: AppStoreApi,
  actor: Actor,
  row: ImportRow,
  fields: IncomingBookingFields,
  bookingId: string,
  changeType: ChangeType,
  applied: readonly IncomingFieldKey[],
  picks: OfficePicks | undefined,
): Outcome {
  const state = api.getState()
  const booking = state.schedule.bookings[bookingId]!
  const view = matchingView(state)
  const procedure = targetProcedure(view.bookings[bookingId]!)

  if (changeType === 'cancellation') {
    const reason = fields.cancelReason ?? `Cancelled by ${hospitalName(state, fields.hospitalId)} (hospital row ${row.id})`
    return cancelBooking(api, actor, bookingId, reason)
  }

  // The office's picks first (the refusable steps), then the ticked differences.
  if (picks?.contract !== undefined && procedure !== undefined) {
    const set = setProcedureContract(api, actor, procedure.id, picks.contract.contractId, picks.contract.enteredPrice !== undefined ? { enteredPrice: picks.contract.enteredPrice } : {})
    if (!set.ok) return set
  }
  if (picks?.rvgGroupId !== undefined && procedure !== undefined) {
    const picked = pickRvgGroup(api, actor, procedure.id, picks.rvgGroupId)
    if (!picked.ok) return picked
  }
  if (applied.includes('insurer')) {
    const insured = recordInsurer(api, actor, bookingId, fields)
    if (!insured.ok) return insured
  }
  const patch: { scheduledTime?: string; notes?: string } = {}
  if (applied.includes('time') && fields.scheduledTime !== undefined) patch.scheduledTime = fields.scheduledTime
  if (applied.includes('note') && fields.note !== undefined) {
    // Appended as one line, never overwriting the Booking's own notes.
    const line = hospitalNoteLine(hospitalName(state, fields.hospitalId), row.receivedAtISO, fields.note.trim())
    patch.notes = booking.notes !== undefined && booking.notes.trim() !== '' ? `${booking.notes}\n${line}` : line
  }
  if (Object.keys(patch).length > 0) {
    const edited = editBooking(api, actor, bookingId, patch)
    if (!edited.ok) return edited
  }
  const patientPatch: { name?: string; dobISO?: string } = {}
  if (applied.includes('patientName')) patientPatch.name = fields.patient.name.trim()
  if (applied.includes('dob') && fields.patient.dobISO !== undefined) patientPatch.dobISO = fields.patient.dobISO
  if (Object.keys(patientPatch).length > 0) {
    const edited = editPatient(api, actor, booking.patientId, patientPatch, bookingId)
    if (!edited.ok) return edited
  }
  const text = fields.procedure?.text
  if (applied.includes('procedureText') && text !== undefined && procedure !== undefined) {
    // Replaces the held text (the old one to the change history) and refreshes the invoice description (D37, D73).
    const replaced = replaceProcedureText(api, actor, procedure.id, { text, source: sourceTextChannelFor(row.channel), from: hospitalFrom(state, row) })
    if (!replaced.ok) return replaced
  }
  return ok(undefined)
}

/** Write the row's decision last, in one commit with the Booking-side history entry naming the row. */
function record(
  api: AppStoreApi,
  actor: Actor,
  row: ImportRow,
  decision: ImportDecision,
  booking: { bookingId: string; changeType: ChangeType; fields: readonly IncomingFieldKey[] } | undefined,
): void {
  const state = api.getState()
  const metas: MutationMeta[] = [
    {
      entityType: 'importRow',
      entityId: row.id,
      action: 'importRow.decide',
      before: { status: 'open' },
      after: { status: decision.kind === 'reject' ? 'rejected' : 'applied', decision },
      stampBookingId: null,
    },
  ]
  if (booking !== undefined) {
    metas.push({
      entityType: 'booking',
      entityId: booking.bookingId,
      action: 'booking.fromHospitalRow',
      after: {
        importRowId: row.id,
        hospital: hospitalFrom(state, row),
        channel: row.channel,
        changeType: booking.changeType,
        fields: [...booking.fields],
      },
    })
  }
  mutate(api, actor, metas, (s) => {
    const cur = s.intake.rows[row.id]
    if (cur === undefined) return {}
    const next: ImportRow = {
      ...cur,
      status: decision.kind === 'reject' ? 'rejected' : 'applied',
      decision,
      decidedBy: actor.who,
      decidedAtISO: clockISO(s.clock),
    }
    // The row's stub, if one stands, is settled in the same commit (33a: the one place a stub's status changes).
    const settled = settleStubForRow(s.intake.stubs, row.id, stubOutcomeForDecision(decision), clockISO(s.clock), actor.who)
    if (settled !== undefined) metas.push(settled.meta)
    return { intake: { ...s.intake, rows: { ...s.intake.rows, [row.id]: next }, ...(settled !== undefined ? { stubs: settled.stubs } : {}) } }
  })
}

/** `decideImportRowUnscoped` as one change set (`match`), whichever app calls it (catch-up Phase 35; DM-35). */
export function decideImportRow(...args: Parameters<typeof decideImportRowUnscoped>): ReturnType<typeof decideImportRowUnscoped> {
  return withChangeSet(args[0], 'match', () => decideImportRowUnscoped(...args))
}
