/**
 * Intake's front door (build plan Phase 68; D117 to D120, D125; US-02.1.1, US-02.1.5, US-02.2.1, US-02.2.3, DM-11,
 * DM-13 to DM-16, DM-21): arrivals made by their source. A hospital's feed sends a batch, a cancellation or a message
 * that fails; the rooms' mailbox receives a PDF, read at once, or a page that cannot be read. Each action runs as its
 * source (the hospital's integration actor, or the mailbox), never as the office, is audited, and decides nothing:
 * rows are only staged through `stageImportRows`, where a row with no NHI gets its stub as before. The office decides
 * every List later (`intakeDecide.ts`).
 *
 * - A rooms' PDF lands with its rows at once (no received-then-sent step): the `SurgeonPdfList` is written `sent`,
 *   its rows carrying the reader's values with confidence and box (D120), and its rows staged with the rooms as their
 *   source. A re-send (same surgeon, hospital, day and session as a List AA holds) also stages one removal row for
 *   each Booking the rooms brought that it lacks (DM-13), unless one for that Booking is already open; a left-out
 *   removal is offered again by a later re-send that still lacks it. A hospital List is never checked for missing
 *   Bookings (hospitals send cancellations).
 * - Every row of an arrival is staged, identical ones included (DM-21); only a row identical to one still open is
 *   skipped, so the one job stays one.
 * - A message that fails, or a PDF that cannot be read, is an arrival with no rows and its reason: never dropped.
 */

import type { ArrivalSource, ImportBatch, IncomingBookingFields, IntegrationMessage, PdfListRow, PdfRowAsRead, Session, SurgeonPdfList } from '../domain/types'
import {
  OKAFOR_STORY_LIST,
  STG_DAY_BEFORE,
  SX_CANCELLATION,
  type MailboxPdfSample,
} from '../domain/intake/hospitalDownloads'
import { pdfListBatchLabel, pdfListFieldsOf, pdfRowIncoming, readRoomsPdf, resentPdfListOf } from '../domain/intake/pdfLists'
import { normaliseName, sessionLabel, validNhiOf } from '../domain/intake/matching'
import { resolveNamedAnaesthetist } from '../domain/intake/arrivals'
import { validateNhi } from '../domain/nhi'
import { isEmailShaped } from '../domain/billing/payer'
import { INTAKE_SOURCE_IDS } from '../domain/seed/intakeSeed'
import { SCRIPTED_BEAT_SCHEDULE } from '../domain/seed'
import { allocateId, clockISO, mutate, ok, refuse, transaction, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { incomingKey, stageImportRows } from './matchingActions'
import { integrationActorForHospital, MAX_ATTEMPTS } from './integrationActions'

export type { MailboxPdfSample, MailboxPdfSampleRow } from '../domain/intake/hospitalDownloads'

/** The rooms' mailbox as the actor of what arrives in it (D119): an integration, never the office. */
export const MAILBOX_ACTOR: Actor = { who: "Rooms' mailbox", role: 'system', source: 'integration' }

/** The reason a removal row carries (DM-13). */
export const REMOVAL_REASON = 'Not on the re-sent List'

const SESSION_RANK: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }

/** A hospital's intake source record (DM-14), if it has one. */
function hospitalSourceOf(state: Pick<AppState, 'intake'>, hospitalId: string) {
  return Object.values(state.intake.sources).find((s) => s.kind === 'hospitalFeed' && s.hospitalId === hospitalId)
}

/** Why a hospital cannot send through a feed, or null when its feed is receiving. */
export function hospitalFeedRefusal(state: Pick<AppState, 'intake' | 'masters'>, hospitalId: string): string | null {
  const hospital = state.masters.hospitals[hospitalId]
  if (hospital === undefined) return 'Hospital not found.'
  const source = hospitalSourceOf(state, hospitalId)
  if (source === undefined || source.state !== 'receiving') return `${hospital.name} is not connected: its Lists come by PDF to the rooms' mailbox.`
  return null
}

// ---------------------------------------------------------------------------
// The rooms' mailbox: a PDF read at once
// ---------------------------------------------------------------------------

function asReadOf(row: MailboxPdfSample['rows'][number]): PdfRowAsRead {
  const out: PdfRowAsRead = { name: row.name, procedureText: row.procedureText }
  if (row.nhi !== undefined) out.nhi = row.nhi
  if (row.dobISO !== undefined) out.dobISO = row.dobISO
  if (row.scheduledTime !== undefined) out.scheduledTime = row.scheduledTime
  return out
}

function personKey(name: string, dobISO: string | undefined): string {
  return `${normaliseName(name)}|${dobISO ?? ''}`
}

/**
 * The removal rows a re-sent rooms' PDF stages (DM-13, D125): for each List AA holds at the PDF's surgeon, hospital,
 * day and session, each live Booking the rooms brought (`source: 'surgeonPdf'`, or made by a decided rooms row) that
 * the PDF lacks (by NHI, else name and birth date), unless an open removal row for it already stands.
 */
export function removalRowsFor(
  state: Pick<AppState, 'masters' | 'schedule' | 'intake'>,
  at: { surgeonId: string; hospitalId: string; dateISO: string; session: Session },
  sent: readonly IncomingBookingFields[],
  surgeon: { name: string; hpiId?: string },
): { bookingId: string; incoming: IncomingBookingFields }[] {
  const lists = Object.values(state.schedule.lists)
    .filter((l) => l.removedAtISO === undefined && l.hospitalId === at.hospitalId && l.dateISO === at.dateISO && l.session === at.session && l.surgeonId === at.surgeonId)
    .sort((a, b) => a.id.localeCompare(b.id))
  if (lists.length === 0) return []
  const nhis = new Set(sent.flatMap((f) => {
    const nhi = validNhiOf(f)
    return nhi !== undefined ? [nhi] : []
  }))
  const people = new Set(sent.map((f) => personKey(f.patient.name, f.patient.dobISO)))
  const rows = Object.values(state.intake.rows)
  const roomsMade = new Set(
    rows.flatMap((r) =>
      r.source === 'rooms' && r.decision !== undefined && (r.decision.kind === 'createBooking' || r.decision.kind === 'createList' || r.decision.kind === 'createDraft') ? [r.decision.bookingId] : [],
    ),
  )
  const openRemoval = new Set(rows.flatMap((r) => (r.status === 'open' && r.removalOfBookingId !== undefined ? [r.removalOfBookingId] : [])))
  const out: { bookingId: string; incoming: IncomingBookingFields }[] = []
  for (const list of lists) {
    const bookings = Object.values(state.schedule.bookings)
      .filter((b) => b.listId === list.id && b.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
    for (const b of bookings) {
      if (b.source !== 'surgeonPdf' && !roomsMade.has(b.id)) continue
      if (openRemoval.has(b.id)) continue
      const patient = state.masters.patients[b.patientId]
      if (patient === undefined) continue
      const nhi = patient.nhi !== undefined && patient.nhi !== '' ? validateNhi(patient.nhi) : undefined
      const dobISO = patient.dobISO !== undefined && patient.dobISO !== '' ? patient.dobISO : undefined
      if ((nhi?.valid === true && nhis.has(nhi.normalised)) || people.has(personKey(patient.name, dobISO))) continue
      out.push({
        bookingId: b.id,
        incoming: {
          hospitalId: list.hospitalId,
          dateISO: list.dateISO,
          session: list.session,
          surgeon: { ...surgeon },
          ...(b.scheduledTime !== undefined ? { scheduledTime: b.scheduledTime } : {}),
          patient: { name: patient.name, ...(patient.nhi !== undefined && patient.nhi !== '' ? { nhi: patient.nhi } : {}), ...(dobISO !== undefined ? { dobISO } : {}) },
          hospitalStatus: 'cancelled',
          cancelReason: REMOVAL_REASON,
        },
      })
    }
  }
  return out
}

/** Whether a mailbox sample has already arrived (the trigger's "already received" check). */
export function mailboxPdfReceived(state: Pick<AppState, 'intake'>, sampleId: string): boolean {
  return Object.values(state.intake.pdfLists).some((l) => l.sampleId === sampleId)
}

/**
 * A rooms' PDF arrives (US-02.2.1, D125): by the mailbox (the sender from the email), or added by hand by a person
 * with the address it came from. The PDF is read at once (`simulateRead`: values, confidences and boxes) and kept
 * `sent`, and its rows are staged with the rooms as their source, each carrying its `pdfRowId` and the anaesthetist
 * the rooms name; a re-send also stages its removal rows. Refused when the sample has already arrived, the sender is
 * not an address, or every row is already waiting. Decides nothing.
 */
export function receiveMailboxPdf(
  api: AppStoreApi,
  sample: MailboxPdfSample,
  opts: { byHand?: { by: string; senderEmail: string } } = {},
): Outcome<{ batchId: string; pdfListId: string; rowIds: string[]; removalRowIds: string[] }> {
  const state = api.getState()
  const byHand = opts.byHand
  const sender = (byHand?.senderEmail ?? sample.senderEmail).trim()
  if (!isEmailShaped(sender)) return refuse('invalidEmail', 'Enter the address the PDF was sent from as an email address.')
  if (byHand !== undefined && byHand.by.trim() === '') return refuse('byRequired', 'Say who added the PDF.')
  if (mailboxPdfReceived(state, sample.id)) return refuse('alreadyReceived', 'This PDF has already arrived.')
  const surgeon = state.masters.surgeons[sample.surgeonId]
  if (surgeon === undefined) return refuse('notFound', 'That surgeon is not in the master data.')
  if (state.masters.hospitals[sample.hospitalId] === undefined) return refuse('notFound', 'Hospital not found.')
  if (sample.rows.length === 0) return refuse('noRows', 'A PDF with no patients cannot be made into a List.')

  const actor: Actor = byHand !== undefined ? { who: byHand.by.trim(), role: 'office', source: 'office' } : MAILBOX_ACTOR
  const anaesthetists = Object.fromEntries(
    Object.entries(state.masters.anaesthetists).map(([id, a]) => [id, { name: a.name, ...(a.hpiId !== undefined ? { hpiId: a.hpiId } : {}) }]),
  )
  const namedId = sample.anaesthetist !== undefined ? resolveNamedAnaesthetist(anaesthetists, { anaesthetist: sample.anaesthetist }) : undefined
  // Read from the layout that draws the page (`readRoomsPdf`): each value's box is where its text is printed. The
  // practice printed is the surgeon's own, as the masters hold it, unless the sample names one.
  const practice = sample.practice ?? surgeon.practiceName
  const reading = readRoomsPdf({ ...sample, ...(practice !== undefined ? { practice } : {}) })
  const pdfRows: PdfListRow[] = sample.rows.map((r, i) => ({ id: r.id, asRead: asReadOf(r), corrections: [], read: reading.rows[i]!.read }))
  // `target.anaesthetistId` is the named anaesthetist resolved to the master, '' when none is named or resolved.
  const target = { anaesthetistId: namedId ?? '', dateISO: sample.dateISO, session: sample.session }
  const surgeonFields = { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) }
  const incoming = pdfRows.map((r) => ({
    ...pdfRowIncoming({ hospitalId: sample.hospitalId, target }, r, surgeonFields),
    ...(sample.anaesthetist !== undefined ? { anaesthetist: { ...sample.anaesthetist } } : {}),
  }))
  const removals = removalRowsFor(state, { surgeonId: sample.surgeonId, hospitalId: sample.hospitalId, dateISO: sample.dateISO, session: sample.session }, incoming, surgeonFields)
  const replaces = resentPdfListOf(state.intake.pdfLists, { surgeonId: sample.surgeonId, hospitalId: sample.hospitalId, target })
  const arrivalSource: ArrivalSource = byHand !== undefined ? { kind: 'byHand', by: actor.who, senderEmail: sender } : { kind: 'mailbox', senderEmail: sender }
  const label = pdfListBatchLabel(surgeon.name, sessionLabel(sample.dateISO, sample.session))
  // The id the PDF's own write allocates next (staging allocates batches and rows, never a PDF list).
  const pdfListId = allocateId(state.counters, 'pdfList').id

  return transaction(api, () => {
    const staged = stageImportRows(api, actor, 'pdfList', sample.hospitalId, label, [...incoming, ...removals.map((r) => r.incoming)], {
      source: 'rooms',
      sampleId: sample.id,
      pdfListId,
      senderEmail: sender,
      arrivalSource,
      ...(byHand !== undefined ? { importedBy: actor.who } : { sourceId: INTAKE_SOURCE_IDS.mailbox }),
      pdfRowIds: [...pdfRows.map((r) => r.id), ...removals.map(() => undefined)],
      removalOfBookingIds: [...pdfRows.map(() => undefined), ...removals.map((r) => r.bookingId)],
    })
    if (!staged.ok) return staged
    const batchId = staged.value.batchId
    if (batchId === undefined) return refuse('alreadyWaiting', 'Every row of this PDF is already waiting in Intake.')
    mutate(
      api,
      actor,
      {
        entityType: 'pdfList',
        entityId: pdfListId,
        action: byHand !== undefined ? 'pdfList.addByHand' : 'pdfList.receive',
        after: {
          sampleId: sample.id,
          senderEmail: sender,
          surgeonId: sample.surgeonId,
          rows: pdfRows.length,
          batchId,
          ...(reading.scanned ? { scanned: true } : {}),
          template: reading.template,
          ...(replaces !== undefined ? { replacesId: replaces.id } : {}),
        },
        stampBookingId: null,
      },
      (s) => {
        const alloc = allocateId(s.counters, 'pdfList')
        if (alloc.id !== pdfListId) throw new Error(`receiveMailboxPdf: expected ${pdfListId}, allocated ${alloc.id}`)
        const atISO = clockISO(s.clock)
        const list: SurgeonPdfList = {
          id: pdfListId,
          sampleId: sample.id,
          surgeonId: sample.surgeonId,
          senderEmail: sender,
          hospitalId: sample.hospitalId,
          subject: sample.subject,
          receivedAtISO: atISO,
          receivedBy: actor.who,
          target,
          status: 'sent',
          ...(replaces !== undefined ? { replacesId: replaces.id } : {}),
          batchId,
          sentAtISO: atISO,
          sentBy: actor.who,
          rows: pdfRows,
          ...pdfListFieldsOf(reading),
        }
        return { intake: { ...s.intake, pdfLists: { ...s.intake.pdfLists, [pdfListId]: list } }, counters: alloc.counters }
      },
    )
    const rowsNow = api.getState().intake.rows
    const rowIds = staged.value.rowIds.filter((id) => rowsNow[id]?.removalOfBookingId === undefined)
    const removalRowIds = staged.value.rowIds.filter((id) => rowsNow[id]?.removalOfBookingId !== undefined)
    return ok({ batchId, pdfListId, rowIds, removalRowIds })
  })
}

/**
 * A PDF that cannot be made into a List arrives in the mailbox (D120, D125): an arrival with no rows, its page and its
 * reason, shown in the feed and under the mailbox until the office dismisses it. Never dropped.
 */
export function receiveUnreadablePdf(
  api: AppStoreApi,
  input: { fileName: string; facsimile: string; senderEmail: string; reason: string },
  opts: { byHand?: { by: string } } = {},
): Outcome<{ batchId: string }> {
  const sender = input.senderEmail.trim()
  // Added by hand (Phase 70, at the Wave 7 join): the person who added it, with the address it came from.
  const byHand = opts.byHand !== undefined && opts.byHand.by.trim() !== '' ? opts.byHand.by.trim() : undefined
  const actor: Actor = byHand !== undefined ? { who: byHand, role: 'office', source: 'office' } : MAILBOX_ACTOR
  if (!isEmailShaped(sender)) return refuse('invalidEmail', 'Enter the address the PDF was sent from as an email address.')
  if (input.fileName.trim() === '') return refuse('fileRequired', 'The PDF needs a file name.')
  if (input.reason.trim() === '') return refuse('reasonRequired', 'Say why the PDF cannot be read.')
  let batchId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'importBatch')
    batchId = alloc.id
    const atISO = clockISO(s.clock)
    const batch: ImportBatch = {
      id: batchId,
      channel: 'pdfList',
      source: 'rooms',
      // Nothing on the page could be read, so no hospital is known.
      hospitalId: '',
      label: input.fileName.trim(),
      arrivalSource: byHand !== undefined ? { kind: 'byHand', by: byHand, senderEmail: sender } : { kind: 'mailbox', senderEmail: sender },
      receivedAtISO: atISO,
      ...(byHand !== undefined ? { importedBy: byHand } : {}),
      rowIds: [],
      senderEmail: sender,
      file: { name: input.fileName.trim(), facsimile: input.facsimile, pages: [input.facsimile] },
      unreadableReason: input.reason.trim(),
    }
    metas.push({
      entityType: 'importBatch',
      entityId: batchId,
      action: 'importBatch.unreadable',
      after: { file: batch.file!.name, senderEmail: sender, reason: batch.unreadableReason },
      stampBookingId: null,
    })
    // Only the mailbox's own arrivals move its last received time.
    const mailbox = byHand === undefined ? s.intake.sources[INTAKE_SOURCE_IDS.mailbox] : undefined
    const sources = mailbox !== undefined ? { ...s.intake.sources, [mailbox.id]: { ...mailbox, lastReceivedAtISO: atISO } } : s.intake.sources
    return { intake: { ...s.intake, batches: { ...s.intake.batches, [batchId]: batch }, sources }, counters: alloc.counters }
  })
  return ok({ batchId })
}

// ---------------------------------------------------------------------------
// A hospital's feed: a batch, a cancellation, a message that fails
// ---------------------------------------------------------------------------

/**
 * A hospital's feed sends a batch of rows (US-02.1.5: they arrive on their own, no import), as the hospital's
 * integration actor. Every row is staged, identical ones included (DM-21); the source's `lastReceivedAtISO` moves.
 * Refused when the hospital is not connected, a row is for another hospital, or every row is already waiting.
 */
export function receiveHospitalBatch(
  api: AppStoreApi,
  hospitalId: string,
  label: string,
  rows: readonly IncomingBookingFields[],
  opts: { sampleId?: string } = {},
): Outcome<{ batchId: string; rowIds: string[] }> {
  const state = api.getState()
  const why = hospitalFeedRefusal(state, hospitalId)
  if (why !== null) return refuse(state.masters.hospitals[hospitalId] === undefined ? 'notFound' : 'notConnected', why)
  if (rows.length === 0) return refuse('noRows', 'A hospital batch needs at least one row.')
  if (rows.some((r) => r.hospitalId !== hospitalId)) return refuse('hospitalMismatch', 'Every row must be for the hospital that sent it.')
  const source = hospitalSourceOf(state, hospitalId)!
  const staged = stageImportRows(api, integrationActorForHospital(hospitalId), 'download', hospitalId, label, rows, {
    arrivalSource: { kind: 'hospitalFeed', hospitalId },
    sourceId: source.id,
    ...(opts.sampleId !== undefined ? { sampleId: opts.sampleId } : {}),
  })
  if (!staged.ok) return staged
  if (staged.value.batchId === undefined) return refuse('alreadyWaiting', 'Every row of this batch is already waiting in Intake.')
  return ok({ batchId: staged.value.batchId, rowIds: staged.value.rowIds })
}

/** A hospital's feed cancels one Booking (a one-row batch, `hospitalStatus: 'cancelled'`). Decides nothing. */
export function receiveCancellation(api: AppStoreApi, hospitalId: string, row: IncomingBookingFields, label?: string): Outcome<{ batchId: string; rowId: string }> {
  const hospital = api.getState().masters.hospitals[hospitalId]
  const out = receiveHospitalBatch(api, hospitalId, label ?? `${hospital?.name ?? 'Hospital'} · appointment cancelled`, [{ ...row, hospitalStatus: 'cancelled' }])
  if (!out.ok) return out
  return ok({ batchId: out.value.batchId, rowId: out.value.rowIds[0]! })
}

/**
 * A hospital's feed message that fails (US-15.0.6, D119): held with its reason, never dropped. The message is written
 * to `integrations.messages` in the dead-letter shape (its raw text kept, for the restricted raw view), and the arrival
 * has no rows, its `heldReason` and its `messageId`. Refused when the hospital is not connected.
 */
export function receiveFailedMessage(
  api: AppStoreApi,
  hospitalId: string,
  input: { label: string; reason: string; raw: string },
): Outcome<{ batchId: string; messageId: string }> {
  const state = api.getState()
  const why = hospitalFeedRefusal(state, hospitalId)
  if (why !== null) return refuse(state.masters.hospitals[hospitalId] === undefined ? 'notFound' : 'notConnected', why)
  const feed = Object.values(state.integrations.feeds).find((f) => f.hospitalId === hospitalId)
  if (feed === undefined) return refuse('notConnected', why ?? 'This hospital has no feed.')
  if (input.reason.trim() === '') return refuse('reasonRequired', 'Say why the message is held.')
  const source = hospitalSourceOf(state, hospitalId)!
  const actor = integrationActorForHospital(hospitalId)
  let batchId = ''
  let messageId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const msgAlloc = allocateId(s.counters, 'integrationMessage')
    const batchAlloc = allocateId(msgAlloc.counters, 'importBatch')
    messageId = msgAlloc.id
    batchId = batchAlloc.id
    const atISO = clockISO(s.clock)
    const reason = input.reason.trim()
    const message: IntegrationMessage = {
      id: messageId,
      feedId: feed.id,
      messageControlId: `${feed.id}-HELD-${messageId}`,
      eventType: feed.transport === 'fhir' ? 'Appointment' : 'S12',
      status: 'deadLetter',
      attempts: MAX_ATTEMPTS,
      receivedAtISO: atISO,
      updatedAtISO: atISO,
      raw: input.raw,
      failureReason: reason,
    }
    const batch: ImportBatch = {
      id: batchId,
      channel: 'feedMessage',
      source: 'hospital',
      hospitalId,
      label: input.label,
      arrivalSource: { kind: 'hospitalFeed', hospitalId },
      receivedAtISO: atISO,
      rowIds: [],
      heldReason: reason,
      messageId,
    }
    metas.push(
      { entityType: 'integrationMessage', entityId: messageId, action: 'integration.receive', after: { status: 'deadLetter', feed: feed.id, event: message.eventType }, stampBookingId: null },
      { entityType: 'importBatch', entityId: batchId, action: 'importBatch.held', after: { label: input.label, hospitalId, reason, messageId }, stampBookingId: null },
    )
    const src = s.intake.sources[source.id]
    const sources = src !== undefined ? { ...s.intake.sources, [src.id]: { ...src, lastReceivedAtISO: atISO } } : s.intake.sources
    return {
      integrations: { ...s.integrations, messages: { ...s.integrations.messages, [messageId]: message } },
      intake: { ...s.intake, batches: { ...s.intake.batches, [batchId]: batch }, sources },
      counters: batchAlloc.counters,
    }
  })
  return ok({ batchId, messageId })
}

// ---------------------------------------------------------------------------
// The story's rows built from the schedule (deterministic: sorted, no randomness)
// ---------------------------------------------------------------------------

const SCRIPTED_LISTS: ReadonlySet<string> = new Set(SCRIPTED_BEAT_SCHEDULE.listIds)

function surgeonFieldsOf(state: Pick<AppState, 'masters'>, surgeonId: string): { name: string; hpiId?: string } | undefined {
  const s = state.masters.surgeons[surgeonId]
  return s === undefined ? undefined : { name: s.name, ...(s.hpiId !== undefined ? { hpiId: s.hpiId } : {}) }
}

/** A live Booking as a hospital would send it unchanged: only fields AA holds, so the matcher reads no change. */
function bookingAsSent(state: Pick<AppState, 'masters'>, booking: AppState['schedule']['bookings'][string], at: { hospitalId: string; dateISO: string; session: Session }, surgeon: { name: string; hpiId?: string }): IncomingBookingFields | undefined {
  const patient = state.masters.patients[booking.patientId]
  if (patient === undefined || patient.nhi === undefined || !validateNhi(patient.nhi).valid) return undefined
  return {
    hospitalId: at.hospitalId,
    dateISO: at.dateISO,
    session: at.session,
    surgeon,
    ...(booking.scheduledTime !== undefined ? { scheduledTime: booking.scheduledTime } : {}),
    patient: { name: patient.name, nhi: patient.nhi, ...(patient.dobISO !== undefined && patient.dobISO !== '' ? { dobISO: patient.dobISO } : {}) },
    hospitalStatus: 'booked',
  }
}

/**
 * St George's day-before message for Wed 25 Nov (D119 action 3): Mr Okafor's rows (`STG_DAY_BEFORE.okaforRows`), then
 * every live Booking of the day's first `STG_DAY_BEFORE.matchingListCount` other St George's Lists, sent exactly as AA
 * holds them (so each List matches exactly); the first of them names its anaesthetist. A List qualifies when it is
 * ACTIVE, not removed, not Mr Okafor's, no scripted beat uses it, and every live Booking's patient has a valid NHI.
 * In the core seed there are none, so only Mr Okafor's rows are sent; the practice holds many.
 */
export function stgDayBeforeRows(state: Pick<AppState, 'masters' | 'schedule'>): IncomingBookingFields[] {
  const { hospitalId, dateISO } = STG_DAY_BEFORE
  const lists = Object.values(state.schedule.lists)
    .filter((l) => l.hospitalId === hospitalId && l.dateISO === dateISO && l.state === 'ACTIVE' && l.removedAtISO === undefined && l.surgeonId !== OKAFOR_STORY_LIST.surgeonId && !SCRIPTED_LISTS.has(l.id))
    .sort((a, b) => SESSION_RANK[a.session] - SESSION_RANK[b.session] || a.id.localeCompare(b.id))
  const out: IncomingBookingFields[] = [...STG_DAY_BEFORE.okaforRows]
  let taken = 0
  for (const list of lists) {
    if (taken >= STG_DAY_BEFORE.matchingListCount) break
    const surgeon = surgeonFieldsOf(state, list.surgeonId)
    if (surgeon === undefined) continue
    const bookings = Object.values(state.schedule.bookings)
      .filter((b) => b.listId === list.id && b.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
    if (bookings.length === 0) continue
    const rows = bookings.map((b) => bookingAsSent(state, b, list, surgeon))
    if (rows.some((r) => r === undefined)) continue
    const anaesthetist = taken === 0 && list.anaesthetistId !== undefined ? state.masters.anaesthetists[list.anaesthetistId] : undefined
    for (const r of rows as IncomingBookingFields[]) out.push(anaesthetist !== undefined ? { ...r, anaesthetist: { name: anaesthetist.name, ...(anaesthetist.hpiId !== undefined ? { hpiId: anaesthetist.hpiId } : {}) } } : r)
    taken += 1
  }
  return out
}

/**
 * Southern Cross's cancellation (D119 action 4): the first live Booking, by day, session, time and id, on an ACTIVE
 * Southern Cross List after today that no scripted beat uses, its patient with a valid NHI, sent cancelled with
 * `SX_CANCELLATION.cancelReason`. Undefined when the schedule holds none (the core seed holds none; the practice many).
 */
export function sxCancellationRow(state: Pick<AppState, 'masters' | 'schedule' | 'clock'>): IncomingBookingFields | undefined {
  const lists = Object.values(state.schedule.lists)
    .filter((l) => l.hospitalId === SX_CANCELLATION.hospitalId && l.dateISO > state.clock.todayISO && l.state === 'ACTIVE' && l.removedAtISO === undefined && !SCRIPTED_LISTS.has(l.id))
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || SESSION_RANK[a.session] - SESSION_RANK[b.session] || a.id.localeCompare(b.id))
  for (const list of lists) {
    const surgeon = surgeonFieldsOf(state, list.surgeonId)
    if (surgeon === undefined) continue
    const bookings = Object.values(state.schedule.bookings)
      .filter((b) => b.listId === list.id && b.cancellation === undefined)
      .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
    for (const b of bookings) {
      const row = bookingAsSent(state, b, list, surgeon)
      if (row !== undefined) return { ...row, hospitalStatus: 'cancelled', cancelReason: SX_CANCELLATION.cancelReason }
    }
  }
  return undefined
}

// ---------------------------------------------------------------------------
// The demo actions' repeat guards (D119; deterministic reads of what has already arrived)
// ---------------------------------------------------------------------------

/** Whether a hospital batch from this sample has already arrived (St George's day-before List runs once). */
export function hospitalBatchReceived(state: Pick<AppState, 'intake'>, sampleId: string): boolean {
  return Object.values(state.intake.batches).some((b) => b.sampleId === sampleId)
}

/** Whether a row identical to these fields is still open (the ingest would skip it: the one job stays one). */
export function identicalRowOpen(state: Pick<AppState, 'intake'>, fields: IncomingBookingFields): boolean {
  const key = incomingKey(fields)
  return Object.values(state.intake.rows).some((r) => r.status === 'open' && incomingKey(r.incoming) === key)
}

/** Whether a PDF that cannot be read, with this file name, still stands in the feed (not dismissed). */
export function unreadablePdfStanding(state: Pick<AppState, 'intake'>, fileName: string): boolean {
  return Object.values(state.intake.batches).some((b) => b.unreadableReason !== undefined && b.file?.name === fileName.trim() && b.dismissed === undefined)
}

/** Whether a held message from this hospital, with this label, still stands in the feed (not dismissed). */
export function heldMessageStanding(state: Pick<AppState, 'intake'>, hospitalId: string, label: string): boolean {
  return Object.values(state.intake.batches).some((b) => b.heldReason !== undefined && b.hospitalId === hospitalId && b.label === label && b.dismissed === undefined)
}

// ---------------------------------------------------------------------------
// The PWA stand-ins: rows for one List, arriving by that List's hospital's own source (D119, D125)
// ---------------------------------------------------------------------------

/** The address a stand-in's rooms PDF comes from (synthetic). */
export const STAND_IN_ROOMS_ADDRESS = 'lists@surgicalrooms.example'

/** A row as a rooms' PDF prints it. */
function printedRow(id: string, f: IncomingBookingFields): MailboxPdfSample['rows'][number] {
  return {
    id,
    name: f.patient.name,
    ...(f.patient.nhi !== undefined && f.patient.nhi !== '' ? { nhi: f.patient.nhi } : {}),
    ...(f.patient.dobISO !== undefined && f.patient.dobISO !== '' ? { dobISO: f.patient.dobISO } : {}),
    ...(f.scheduledTime !== undefined ? { scheduledTime: f.scheduledTime } : {}),
    procedureText: f.procedure?.text ?? '',
  }
}

/** Same person: by valid NHI when both carry one, else by name and birth date. */
function samePerson(a: IncomingBookingFields, b: IncomingBookingFields): boolean {
  const na = validNhiOf(a)
  const nb = validNhiOf(b)
  if (na !== undefined && nb !== undefined) return na === nb
  return personKey(a.patient.name, a.patient.dobISO) === personKey(b.patient.name, b.patient.dobISO)
}

/**
 * Rows for one List AA holds, arriving by its hospital's own source, for the PWA office stand-ins (never as the
 * office): a connected hospital's feed sends them as a batch (`receiveHospitalBatch`); any other hospital's rooms
 * email the List as a PDF (`receiveMailboxPdf`), printed as a re-send would be: every live Booking AA holds on it
 * whose patient has a valid NHI, then the given rows (each in place of a Booking for the same person), so no Booking
 * reads as missing (DM-13). Returns, in the given rows' order, the open row each became (undefined when none did).
 */
export function receiveRowsForList(
  api: AppStoreApi,
  listId: string,
  rows: readonly IncomingBookingFields[],
  opts: { label: string; sampleId: string },
): Outcome<{ batchId: string; rowIds: (string | undefined)[] }> {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  const surgeonId = list?.surgeonId ?? undefined
  const surgeon = surgeonId !== undefined ? state.masters.surgeons[surgeonId] : undefined
  const hospital = list !== undefined ? state.masters.hospitals[list.hospitalId] : undefined
  if (list === undefined || surgeonId === undefined || surgeon === undefined || hospital === undefined) return refuse('notFound', 'This List has no surgeon.')
  const openRowOf = (fields: IncomingBookingFields, batchId: string): string | undefined => {
    const key = incomingKey(fields)
    const open = Object.values(api.getState().intake.rows).filter((r) => r.status === 'open' && incomingKey(r.incoming) === key)
    return (open.find((r) => r.batchId === batchId) ?? open[0])?.id
  }
  if (hospitalFeedRefusal(state, list.hospitalId) === null) {
    const out = receiveHospitalBatch(api, list.hospitalId, opts.label, rows, { sampleId: opts.sampleId })
    if (!out.ok) return out
    return ok({ batchId: out.value.batchId, rowIds: rows.map((f) => openRowOf(f, out.value.batchId)) })
  }
  const surgeonFields = { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) }
  const held = Object.values(state.schedule.bookings)
    .filter((b) => b.listId === list.id && b.cancellation === undefined)
    .sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
    .flatMap((b) => {
      const fields = bookingAsSent(state, b, list, surgeonFields)
      if (fields === undefined || rows.some((r) => samePerson(r, fields))) return []
      const text = Object.values(state.schedule.procedures).find((p) => p.bookingId === b.id && p.isPrimary)?.procedureText?.text
      return [text !== undefined ? { ...fields, procedure: { text } } : fields]
    })
  const sample: MailboxPdfSample = {
    id: opts.sampleId,
    fileName: `${opts.label}.pdf`,
    surgeonId,
    surgeonName: surgeon.name,
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    subject: opts.label,
    senderEmail: STAND_IN_ROOMS_ADDRESS,
    dateISO: list.dateISO,
    session: list.session,
    rows: [...held.map((f, i) => printedRow(`R${i + 1}`, f)), ...rows.map((f, i) => printedRow(`N${i + 1}`, f))],
  }
  const out = receiveMailboxPdf(api, sample)
  if (!out.ok) return out
  const staged = Object.values(api.getState().intake.rows).filter((r) => r.batchId === out.value.batchId)
  return ok({ batchId: out.value.batchId, rowIds: rows.map((_, i) => staged.find((r) => r.pdfRowId === `N${i + 1}`)?.id) })
}
