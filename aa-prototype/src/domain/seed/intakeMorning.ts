/**
 * The seeded morning at Intake: what the sources sent on the demo day before the office sat down (05:30 to 08:30),
 * and what the office decided yesterday and first thing, so Arrivals looks like a real morning rather than two items.
 * Every arrival is made by its source, as `store/intakeIngest.ts` would make it, and decides nothing.
 *
 * - St George's (HL7): its day-before file for Wed 25 Nov over several Lists (updates with a time or wording change,
 *   Lists that match exactly, and a new List no one holds), and a later message for a List the next day adding a
 *   patient with no NHI (who waits, their stub on the List).
 * - Southern Cross (FHIR): a cancellation, an update, and a message held because it cannot tell who the patient is.
 * - The rooms' mailbox: Mr Nand's new List naming a free anaesthetist (one patient with no NHI), a re-sent List with
 *   a time change and a Booking missing from it (offered as a removal), Ms Reid's scan with values to check, and a
 *   page that cannot be read.
 * - Decided: St George's Lists for today matched yesterday evening, a Southern Cross update the office rejected, a
 *   held message dismissed, and a rooms' PDF that matched exactly.
 *
 * Read from the schedule the slice is built over (the core seed under test, the whole practice at runtime), never
 * random: every target is the first that qualifies in a fixed order, and an arrival whose target is absent is left
 * out quietly. Nothing touches a List a scripted beat uses, Mr Okafor's St George's Wed 25 Nov PM List (D119), the
 * St George's Lists or the Southern Cross Booking the demo actions send, or Dr Rutherford's sessions.
 *
 * Ids have their own namespace (`IBM`, `IRM`, `STB9`, `PDL9`) so no counter moves and no runtime id clashes.
 */

import type { Anaesthetist, Booking, ImportBatch, ImportRow, IncomingBookingFields, List, Patient, Procedure, Session, Slot, Stub, Surgeon, SurgeonPdfList } from '../types'
import {
  mailboxPdfHeaderValues,
  MORNING_HOSPITAL_WORDING,
  MORNING_NAND_PDF,
  MORNING_REID_SCAN,
  MORNING_STG_NEW_LIST,
  MORNING_STG_NO_NHI,
  MORNING_SX,
  MORNING_UNREADABLE,
  morningRoomsAddress,
  OKAFOR_STORY_LIST,
  STG_DAY_BEFORE,
  SX_CANCELLATION,
  type MailboxPdfSample,
  type MailboxPdfSampleRow,
  type MorningPdfSpec,
} from '../intake/hospitalDownloads'
import { buildFacsimile, buildUnreadableFacsimile, pdfListBatchLabel, pdfRowIncoming } from '../intake/pdfLists'
import { readValuesOfRow, simulateRead } from '../intake/pdfRead'
import { sessionLabel } from '../intake/matching'
import { resolveNamedAnaesthetist } from '../intake/arrivals'
import { rawRowFor } from '../intake/rawRow'
import { stubFor } from '../intake/stubs'
import { isOpenSlot, type SlotStatusRecords } from '../slotStatus'
import { isActiveOn } from '../anaesthetistStatus'
import { validateNhi } from '../nhi'
import { longDayNoYear, shortDay } from '../dateText'
import { addDaysISO, DEMO_TODAY } from '../clock'
import { ANAE, HOSP, SURG } from './cast'
import { LIST_MOVE_DEMO, SCRIPTED_BEAT_SCHEDULE } from './index'

/** The schedule and masters the morning is read from (structural: the store's state satisfies it). */
export interface MorningSource {
  schedule: {
    lists: Readonly<Record<string, List>>
    bookings: Readonly<Record<string, Booking>>
    slots: Readonly<Record<string, Slot>>
    procedures: Readonly<Record<string, Procedure>>
  }
  masters: {
    patients: Readonly<Record<string, Patient>>
    surgeons: Readonly<Record<string, Surgeon>>
    anaesthetists: Readonly<Record<string, Anaesthetist>>
    slotStatuses: SlotStatusRecords
  }
}

export interface SeededMorning {
  batches: ImportBatch[]
  rows: ImportRow[]
  stubs: Stub[]
  pdfLists: SurgeonPdfList[]
}

/** Who decided the decided arrivals. */
const OFFICE = 'Kirsty W.'
const MAILBOX_WHO = "Rooms' mailbox"
/** The reason a removal row carries (`REMOVAL_REASON` in the store's ingest: the same words). */
const REMOVAL_REASON = 'Not on the re-sent List'

const YESTERDAY = addDaysISO(DEMO_TODAY, -1)
const at = (time: string, day: string = DEMO_TODAY) => `${day}T${time}:00`

/** When each arrival came in (today unless named), and when the decided ones were decided. */
export const MORNING_TIMES = {
  stgDayBefore: at('05:40'),
  sxHeld: at('05:52'),
  sxCancellation: at('06:05'),
  stgNextDay: at('06:20'),
  unreadable: at('06:31'),
  reidScan: at('06:58'),
  sxUpdate: at('07:24'),
  resend: at('07:42'),
  nandPdf: at('08:12'),
  /** Yesterday: a rooms' PDF that matched, a Southern Cross update rejected, a held message dismissed, St George's Lists for today. */
  pdfMatched: at('15:10', YESTERDAY),
  pdfMatchedDecided: at('15:32', YESTERDAY),
  sxRejected: at('16:40', YESTERDAY),
  sxRejectedDecided: at('17:05', YESTERDAY),
  sxHeldYesterday: at('16:55', YESTERDAY),
  sxHeldDismissed: at('17:08', YESTERDAY),
  stgToday: at('18:10', YESTERDAY),
  stgTodayDecided: at('06:50'),
} as const

const SESSION_RANK: Record<Session, number> = { AM: 0, PM: 1, OOH: 2 }
const PROTECTED_LISTS: ReadonlySet<string> = new Set<string>([
  ...SCRIPTED_BEAT_SCHEDULE.listIds,
  LIST_MOVE_DEMO.movableListId,
  LIST_MOVE_DEMO.returnListId,
])
const PROTECTED_SLOTS: ReadonlySet<string> = new Set<string>([...SCRIPTED_BEAT_SCHEDULE.slotIds, LIST_MOVE_DEMO.unavailableSlotId])

// ---------------------------------------------------------------------------
// Reading the schedule
// ---------------------------------------------------------------------------

function surgeonFields(from: MorningSource, surgeonId: string | null | undefined): { name: string; hpiId?: string } | undefined {
  const s = surgeonId != null ? from.masters.surgeons[surgeonId] : undefined
  return s === undefined ? undefined : { name: s.name, ...(s.hpiId !== undefined ? { hpiId: s.hpiId } : {}) }
}

/** The schedule indexed once per source (the practice holds thousands of Lists and Bookings). */
interface MorningIndex {
  bookingsByList: Map<string, Booking[]>
  primaryText: Map<string, string>
  lists: List[]
}
const indexes = new WeakMap<MorningSource['schedule'], MorningIndex>()
function indexOf(from: MorningSource): MorningIndex {
  const hit = indexes.get(from.schedule)
  if (hit !== undefined) return hit
  const bookingsByList = new Map<string, Booking[]>()
  for (const b of Object.values(from.schedule.bookings)) {
    if (b.cancellation !== undefined) continue
    const list = bookingsByList.get(b.listId)
    if (list === undefined) bookingsByList.set(b.listId, [b])
    else list.push(b)
  }
  for (const list of bookingsByList.values()) list.sort((a, b) => (a.scheduledTime ?? '99:99').localeCompare(b.scheduledTime ?? '99:99') || a.id.localeCompare(b.id))
  const primaryText = new Map<string, string>()
  for (const p of Object.values(from.schedule.procedures)) {
    const text = p.procedureText?.text
    if (p.isPrimary && text !== undefined) primaryText.set(p.bookingId, text)
  }
  const index = { bookingsByList, primaryText, lists: Object.values(from.schedule.lists).sort(byDaySessionId) }
  indexes.set(from.schedule, index)
  return index
}

/** A List's live Bookings by time (untimed last), then id. */
function liveBookings(from: MorningSource, listId: string): Booking[] {
  return indexOf(from).bookingsByList.get(listId) ?? []
}

function validNhiPatient(from: MorningSource, b: Booking): Patient | undefined {
  const p = from.masters.patients[b.patientId]
  return p !== undefined && p.nhi !== undefined && validateNhi(p.nhi).valid ? p : undefined
}

/** A live Booking as a sender would send it unchanged: only fields AA holds, so the matcher reads no change. */
function asSent(from: MorningSource, b: Booking, list: List, surgeon: { name: string; hpiId?: string }): IncomingBookingFields | undefined {
  const p = validNhiPatient(from, b)
  if (p === undefined) return undefined
  return {
    hospitalId: list.hospitalId,
    dateISO: list.dateISO,
    session: list.session,
    surgeon: { ...surgeon },
    ...(b.scheduledTime !== undefined ? { scheduledTime: b.scheduledTime } : {}),
    patient: { name: p.name, nhi: p.nhi!, ...(p.dobISO !== undefined && p.dobISO !== '' ? { dobISO: p.dobISO } : {}) },
    hospitalStatus: 'booked',
  }
}

function primaryText(from: MorningSource, bookingId: string): string | undefined {
  return indexOf(from).primaryText.get(bookingId)
}

/** An ACTIVE List no beat or demo uses, with at least `min` live Bookings, every patient with a valid NHI. */
function qualifies(from: MorningSource, list: List, min: number, opts: { source?: Booking['source'] } = {}): boolean {
  if (list.state !== 'ACTIVE' || list.removedAtISO !== undefined || PROTECTED_LISTS.has(list.id)) return false
  if (surgeonFields(from, list.surgeonId) === undefined) return false
  const bookings = liveBookings(from, list.id)
  if (bookings.length < min) return false
  if (opts.source !== undefined && bookings.some((b) => b.source !== opts.source)) return false
  return bookings.every((b) => validNhiPatient(from, b) !== undefined)
}

function byDaySessionId(a: List, b: List): number {
  return a.dateISO.localeCompare(b.dateISO) || SESSION_RANK[a.session] - SESSION_RANK[b.session] || a.id.localeCompare(b.id)
}

function listsWhere(from: MorningSource, pick: (l: List) => boolean): List[] {
  return indexOf(from).lists.filter(pick)
}

/** Whether AA holds a List for this surgeon at this hospital, day and session. */
function heldAt(from: MorningSource, hospitalId: string, dateISO: string, session: Session, surgeonId: string): boolean {
  return Object.values(from.schedule.lists).some(
    (l) => l.removedAtISO === undefined && l.hospitalId === hospitalId && l.dateISO === dateISO && l.session === session && l.surgeonId === surgeonId,
  )
}

/**
 * The first anaesthetist (by id) whose session is free that day: open, no List in it, active, no demo's, never Dr
 * Rutherford (the Okafor story names him), and not one the morning has already named (`named`, which it joins).
 */
function freeAnaesthetist(from: MorningSource, dateISO: string, session: Session, named: Set<string>): { name: string; hpiId?: string } | undefined {
  const withList = new Set(Object.values(from.schedule.lists).flatMap((l) => (l.removedAtISO === undefined && l.state !== 'DRAFT' ? [l.slotId] : [])))
  const slot = Object.values(from.schedule.slots)
    .filter((s) => s.dateISO === dateISO && s.session === session && s.anaesthetistId !== ANAE.rutherford && !named.has(s.anaesthetistId) && !PROTECTED_SLOTS.has(s.id) && !withList.has(s.id))
    .filter((s) => {
      const a = from.masters.anaesthetists[s.anaesthetistId]
      return a !== undefined && isActiveOn(a, dateISO) && isOpenSlot(s, undefined, from.masters.slotStatuses)
    })
    .sort((a, b) => a.anaesthetistId.localeCompare(b.anaesthetistId))[0]
  const a = slot !== undefined ? from.masters.anaesthetists[slot.anaesthetistId] : undefined
  if (slot !== undefined) named.add(slot.anaesthetistId)
  return a === undefined ? undefined : { name: a.name, ...(a.hpiId !== undefined ? { hpiId: a.hpiId } : {}) }
}

function shiftTime(time: string | undefined, minutes: number): string | undefined {
  if (time === undefined || !/^\d{2}:\d{2}$/.test(time)) return undefined
  const total = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + minutes
  if (total < 0 || total >= 24 * 60) return undefined
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Building records
// ---------------------------------------------------------------------------

/** Ids in the morning's own namespace, allocated in build order. */
function idAllocator() {
  let batch = 0
  let row = 0
  let stub = 0
  let pdf = 0
  return {
    batch: () => `IBM${String(++batch).padStart(3, '0')}`,
    row: () => `IRM${String(++row).padStart(3, '0')}`,
    stub: () => `STB9${String(++stub).padStart(3, '0')}`,
    pdf: () => `PDL9${String(++pdf).padStart(3, '0')}`,
  }
}
type Ids = ReturnType<typeof idAllocator>

type Decided = Pick<ImportRow, 'status' | 'decision' | 'decidedBy' | 'decidedAtISO'>

function hospitalRow(ids: Ids, batchId: string, receivedAtISO: string, incoming: IncomingBookingFields, decided?: Decided): ImportRow {
  return {
    id: ids.row(),
    batchId,
    channel: 'download',
    source: 'hospital',
    receivedAtISO,
    incoming,
    status: 'open',
    ...(decided ?? {}),
    raw: rawRowFor(incoming, 'download'),
  }
}

function hospitalBatch(id: string, hospitalId: string, label: string, receivedAtISO: string, rows: readonly ImportRow[]): ImportBatch {
  return { id, channel: 'download', source: 'hospital', hospitalId, label, arrivalSource: { kind: 'hospitalFeed', hospitalId }, receivedAtISO, rowIds: rows.map((r) => r.id) }
}

/** A matched-with-no-change decision on a Booking AA holds. */
function noChange(b: Booking, by: string, atISO: string): Decided {
  return { status: 'applied', decision: { kind: 'match', bookingId: b.id, changeType: 'noChange', fieldsApplied: [], listId: b.listId }, decidedBy: by, decidedAtISO: atISO }
}

/**
 * A rooms' PDF as the mailbox reads it, and its arrival: the list read at once (values with confidence and box),
 * its batch, and a row per printed patient, plus any removal rows (`removals`: a Booking the re-send lacks).
 */
function pdfArrival(
  from: MorningSource,
  ids: Ids,
  sample: MailboxPdfSample,
  receivedAtISO: string,
  opts: { removals?: readonly { bookingId: string; incoming: IncomingBookingFields }[]; decided?: (row: MailboxPdfSampleRow) => Decided | undefined } = {},
): { list: SurgeonPdfList; batch: ImportBatch; rows: ImportRow[] } | undefined {
  const surgeon = surgeonFields(from, sample.surgeonId)
  if (surgeon === undefined) return undefined
  const anaesthetists = Object.fromEntries(Object.entries(from.masters.anaesthetists).map(([id, a]) => [id, { name: a.name, ...(a.hpiId !== undefined ? { hpiId: a.hpiId } : {}) }]))
  const namedId = sample.anaesthetist !== undefined ? resolveNamedAnaesthetist(anaesthetists, { anaesthetist: sample.anaesthetist }) : undefined
  const asRead = sample.rows.map(({ id, confidence: _c, ...rest }) => ({ id, asRead: rest }))
  const read = simulateRead({
    header: mailboxPdfHeaderValues(sample),
    ...(sample.headerConfidence !== undefined ? { headerConfidence: sample.headerConfidence } : {}),
    rows: sample.rows.map((r, i) => ({ id: r.id, values: readValuesOfRow(asRead[i]!.asRead), ...(r.confidence !== undefined ? { confidence: r.confidence } : {}) })),
    scanned: sample.scanned === true,
  })
  const batchId = ids.batch()
  const listId = ids.pdf()
  const target = { anaesthetistId: namedId ?? '', dateISO: sample.dateISO, session: sample.session }
  const list: SurgeonPdfList = {
    id: listId,
    sampleId: sample.id,
    file: { name: sample.fileName, facsimile: buildFacsimile(sample) },
    surgeonId: sample.surgeonId,
    senderEmail: sample.senderEmail,
    hospitalId: sample.hospitalId,
    subject: sample.subject,
    receivedAtISO,
    receivedBy: MAILBOX_WHO,
    target,
    status: 'sent',
    batchId,
    sentAtISO: receivedAtISO,
    sentBy: MAILBOX_WHO,
    rows: asRead.map((r, i) => ({ id: r.id, asRead: r.asRead, corrections: [], read: read.rows[i]!.read })),
    headerRead: read.headerRead,
    ...(sample.scanned === true ? { scanned: true } : {}),
  }
  const rows: ImportRow[] = list.rows.map((pdfRow, i) => {
    const incoming: IncomingBookingFields = {
      ...pdfRowIncoming({ hospitalId: sample.hospitalId, target }, pdfRow, surgeon),
      ...(sample.anaesthetist !== undefined ? { anaesthetist: { ...sample.anaesthetist } } : {}),
    }
    return {
      id: ids.row(),
      batchId,
      channel: 'pdfList',
      source: 'rooms',
      receivedAtISO,
      incoming,
      status: 'open',
      ...(opts.decided?.(sample.rows[i]!) ?? {}),
      raw: rawRowFor(incoming, 'pdfList'),
      pdfRowId: pdfRow.id,
    }
  })
  for (const r of opts.removals ?? []) {
    rows.push({ id: ids.row(), batchId, channel: 'pdfList', source: 'rooms', receivedAtISO, incoming: r.incoming, status: 'open', raw: rawRowFor(r.incoming, 'pdfList'), removalOfBookingId: r.bookingId })
  }
  const batch: ImportBatch = {
    id: batchId,
    channel: 'pdfList',
    source: 'rooms',
    hospitalId: sample.hospitalId,
    label: pdfListBatchLabel(sample.surgeonName, sessionLabel(sample.dateISO, sample.session)),
    sampleId: sample.id,
    arrivalSource: { kind: 'mailbox', senderEmail: sample.senderEmail },
    receivedAtISO,
    rowIds: rows.map((r) => r.id),
    pdfListId: listId,
    senderEmail: sample.senderEmail,
  }
  return { list, batch, rows }
}

/** A sample's subject line: "Operating list · Tuesday 15 December (PM)". */
function subjectFor(dateISO: string, session: Session): string {
  return `Operating list · ${longDayNoYear(dateISO)} (${session})`
}

/** A morning PDF spec placed on its first candidate day whose List AA does not hold, naming a free anaesthetist if asked. */
function placeSpec(from: MorningSource, spec: MorningPdfSpec, named: Set<string>): MailboxPdfSample | undefined {
  for (const c of spec.candidates) {
    if (heldAt(from, spec.hospitalId, c.dateISO, c.session, spec.surgeonId)) continue
    const anaesthetist = spec.namesAnaesthetist ? freeAnaesthetist(from, c.dateISO, c.session, named) : undefined
    if (spec.namesAnaesthetist && anaesthetist === undefined) continue
    const { candidates: _c, namesAnaesthetist: _n, ...rest } = spec
    return { ...rest, senderEmail: roomsAddressOf(from, spec.surgeonId, spec.senderEmail), dateISO: c.dateISO, session: c.session, subject: subjectFor(c.dateISO, c.session), ...(anaesthetist !== undefined ? { anaesthetist } : {}) }
  }
  return undefined
}

/** The address a surgeon's rooms email from: their practice's office inbox when the master holds one. */
function roomsAddressOf(from: MorningSource, surgeonId: string, fallback: string): string {
  const email = from.masters.surgeons[surgeonId]?.officeContacts.find((c) => c.email !== undefined && c.email.trim() !== '')?.email
  return email ?? fallback
}

function printed(id: string, f: IncomingBookingFields, procedureText: string): MailboxPdfSampleRow {
  return {
    id,
    name: f.patient.name,
    ...(f.patient.nhi !== undefined ? { nhi: f.patient.nhi } : {}),
    ...(f.patient.dobISO !== undefined ? { dobISO: f.patient.dobISO } : {}),
    ...(f.scheduledTime !== undefined ? { scheduledTime: f.scheduledTime } : {}),
    procedureText,
  }
}

// ---------------------------------------------------------------------------
// The morning
// ---------------------------------------------------------------------------

/** The St George's Lists the day-before demo action sends (`stgDayBeforeRows` in the store): never seeded here. */
function demoStgLists(from: MorningSource): Set<string> {
  const out = new Set<string>()
  for (const l of listsWhere(from, (l) => l.hospitalId === STG_DAY_BEFORE.hospitalId && l.dateISO === STG_DAY_BEFORE.dateISO && l.surgeonId !== OKAFOR_STORY_LIST.surgeonId)) {
    if (out.size >= STG_DAY_BEFORE.matchingListCount) break
    if (l.state !== 'ACTIVE' || l.removedAtISO !== undefined || SCRIPTED_BEAT_SCHEDULE.listIds.some((id) => id === l.id)) continue
    if (surgeonFields(from, l.surgeonId) === undefined) continue
    const bookings = liveBookings(from, l.id)
    if (bookings.length === 0 || bookings.some((b) => validNhiPatient(from, b) === undefined)) continue
    out.add(l.id)
  }
  return out
}

/** The Southern Cross List the cancel demo action takes its Booking from (`sxCancellationRow` in the store). */
function demoSxList(from: MorningSource): string | undefined {
  return listsWhere(
    from,
    (l) => l.hospitalId === SX_CANCELLATION.hospitalId && l.dateISO > DEMO_TODAY && l.state === 'ACTIVE' && l.removedAtISO === undefined && !SCRIPTED_BEAT_SCHEDULE.listIds.some((id) => id === l.id),
  ).find((l) => surgeonFields(from, l.surgeonId) !== undefined && liveBookings(from, l.id).some((b) => validNhiPatient(from, b) !== undefined))?.id
}

export function seededMorning(from: MorningSource): SeededMorning {
  const ids = idAllocator()
  const out: SeededMorning = { batches: [], rows: [], stubs: [], pdfLists: [] }
  const used = new Set<string>([...demoStgLists(from)])
  const sxDemo = demoSxList(from)
  if (sxDemo !== undefined) used.add(sxDemo)
  const take = (l: List) => {
    used.add(l.id)
    return l
  }
  const free = (l: List) => !used.has(l.id)
  // Dr Rutherford is named by the Okafor PDFs; each other anaesthetist the morning names is named once.
  const named = new Set<string>([ANAE.rutherford])

  // --- St George's day-before file for Wed 25 Nov: two updates, three Lists as held, one new List -----------------
  {
    const day = STG_DAY_BEFORE.dateISO
    const held = listsWhere(from, (l) => l.hospitalId === HOSP.stg && l.dateISO === day && free(l) && l.surgeonId !== OKAFOR_STORY_LIST.surgeonId && qualifies(from, l, 2))
    const updates = held.slice(0, 2).map(take)
    const same = held.slice(2, 5).map(take)
    const batchId = ids.batch()
    const rows: ImportRow[] = []
    const recv = MORNING_TIMES.stgDayBefore
    updates.forEach((list, n) => {
      const surgeon = surgeonFields(from, list.surgeonId)!
      liveBookings(from, list.id).forEach((b, i) => {
        const sent = asSent(from, b, list, surgeon)!
        let f = sent
        if (n === 0 && i === 0) {
          // The hospital's fuller wording, when it has one for the procedure AA holds; else a later start.
          const held = primaryText(from, b.id)
          const wording = held !== undefined ? MORNING_HOSPITAL_WORDING[held] : undefined
          const later = shiftTime(sent.scheduledTime, 15)
          f = wording !== undefined ? { ...sent, procedure: { text: wording } } : later !== undefined ? { ...sent, scheduledTime: later } : sent
        }
        if (n === 0 && i === 1) {
          const later = shiftTime(sent.scheduledTime, 20)
          if (later !== undefined) f = { ...sent, scheduledTime: later, note: 'Moved at theatre request' }
        }
        if (n === 1 && i === 0) {
          const earlier = shiftTime(sent.scheduledTime, -15)
          if (earlier !== undefined) f = { ...sent, scheduledTime: earlier }
        }
        rows.push(hospitalRow(ids, batchId, recv, f))
      })
    })
    for (const list of same) {
      const surgeon = surgeonFields(from, list.surgeonId)!
      for (const b of liveBookings(from, list.id)) rows.push(hospitalRow(ids, batchId, recv, asSent(from, b, list, surgeon)!))
    }
    // The new List: the first surgeon with no List at St George's that morning.
    const s = MORNING_STG_NEW_LIST
    const surgeonId = s.surgeonIds.find((id) => !heldAt(from, HOSP.stg, day, s.session, id) && from.masters.surgeons[id] !== undefined)
    if (surgeonId !== undefined) {
      const surgeon = surgeonFields(from, surgeonId)!
      const anaesthetist = freeAnaesthetist(from, day, s.session, named)
      for (const p of s.patients) {
        rows.push(
          hospitalRow(ids, batchId, recv, {
            hospitalId: HOSP.stg,
            dateISO: day,
            session: s.session,
            surgeon,
            ...(anaesthetist !== undefined ? { anaesthetist } : {}),
            scheduledTime: p.scheduledTime,
            patient: { name: p.name, ...(p.nhi !== undefined ? { nhi: p.nhi } : {}), dobISO: p.dobISO },
            procedure: { text: p.procedureText },
            hospitalStatus: 'booked',
          }),
        )
      }
    }
    if (rows.length > 0) {
      out.rows.push(...rows)
      out.batches.push(hospitalBatch(batchId, HOSP.stg, STG_DAY_BEFORE.label, recv, rows))
    }
  }

  // --- St George's, a later message: a List the day after, one Booking moved, a patient added with no NHI ---------
  {
    const list = listsWhere(from, (l) => l.hospitalId === HOSP.stg && l.dateISO > STG_DAY_BEFORE.dateISO && free(l) && qualifies(from, l, 2))[0]
    if (list !== undefined) {
      take(list)
      const surgeon = surgeonFields(from, list.surgeonId)!
      const batchId = ids.batch()
      const recv = MORNING_TIMES.stgNextDay
      const label = `St George's theatre Lists · ${shortDay(list.dateISO)}`
      const rows: ImportRow[] = liveBookings(from, list.id).map((b, i) => {
        const sent = asSent(from, b, list, surgeon)!
        const later = i === 0 ? shiftTime(sent.scheduledTime, 30) : undefined
        return hospitalRow(ids, batchId, recv, later !== undefined ? { ...sent, scheduledTime: later } : sent)
      })
      const p = MORNING_STG_NO_NHI
      const waiting = hospitalRow(ids, batchId, recv, {
        hospitalId: HOSP.stg,
        dateISO: list.dateISO,
        session: list.session,
        surgeon,
        scheduledTime: list.session === 'AM' ? p.scheduledTime : '16:15',
        patient: { name: p.name, dobISO: p.dobISO },
        procedure: { text: p.procedureText },
        hospitalStatus: 'booked',
      })
      rows.push(waiting)
      const stub = stubFor(waiting, { id: list.id, state: list.state }, label, recv)
      if (stub !== undefined) out.stubs.push({ id: ids.stub(), ...stub })
      out.rows.push(...rows)
      out.batches.push(hospitalBatch(batchId, HOSP.stg, label, recv, rows))
    }
  }

  // --- Southern Cross: a held message, a cancellation and an update ---------------------------------------------
  out.batches.push({
    id: ids.batch(),
    channel: 'feedMessage',
    source: 'hospital',
    hospitalId: HOSP.sx,
    label: MORNING_SX.held.label,
    arrivalSource: { kind: 'hospitalFeed', hospitalId: HOSP.sx },
    receivedAtISO: MORNING_TIMES.sxHeld,
    rowIds: [],
    heldReason: MORNING_SX.held.reason,
  })
  {
    const ahead = listsWhere(from, (l) => l.hospitalId === HOSP.sx && l.dateISO > DEMO_TODAY && free(l) && qualifies(from, l, 1))
    const cancelList = ahead[0]
    if (cancelList !== undefined) {
      take(cancelList)
      const b = liveBookings(from, cancelList.id)[0]!
      const sent = asSent(from, b, cancelList, surgeonFields(from, cancelList.surgeonId)!)!
      const batchId = ids.batch()
      const row = hospitalRow(ids, batchId, MORNING_TIMES.sxCancellation, { ...sent, hospitalStatus: 'cancelled', cancelReason: MORNING_SX.cancelReason })
      out.rows.push(row)
      out.batches.push(hospitalBatch(batchId, HOSP.sx, SX_CANCELLATION.label, MORNING_TIMES.sxCancellation, [row]))
    }
    const updateList = ahead.find((l) => free(l) && liveBookings(from, l.id).some((b) => shiftTime(b.scheduledTime, 30) !== undefined))
    if (updateList !== undefined) {
      take(updateList)
      const b = liveBookings(from, updateList.id).find((x) => shiftTime(x.scheduledTime, 30) !== undefined)!
      const sent = asSent(from, b, updateList, surgeonFields(from, updateList.surgeonId)!)!
      const batchId = ids.batch()
      const row = hospitalRow(ids, batchId, MORNING_TIMES.sxUpdate, { ...sent, scheduledTime: shiftTime(sent.scheduledTime, 30)!, note: MORNING_SX.updateNote })
      out.rows.push(row)
      out.batches.push(hospitalBatch(batchId, HOSP.sx, 'Southern Cross · appointment updated', MORNING_TIMES.sxUpdate, [row]))
    }
  }

  // --- The rooms' mailbox ---------------------------------------------------------------------------------------
  const addPdf = (arrival: ReturnType<typeof pdfArrival>) => {
    if (arrival === undefined) return
    out.pdfLists.push(arrival.list)
    out.batches.push(arrival.batch)
    out.rows.push(...arrival.rows)
  }
  // A page that cannot be read.
  {
    const u = MORNING_UNREADABLE
    out.batches.push({
      id: ids.batch(),
      channel: 'pdfList',
      source: 'rooms',
      hospitalId: '',
      label: u.fileName,
      arrivalSource: { kind: 'mailbox', senderEmail: u.senderEmail },
      receivedAtISO: MORNING_TIMES.unreadable,
      rowIds: [],
      senderEmail: u.senderEmail,
      file: { name: u.fileName, facsimile: buildUnreadableFacsimile(u.fileName) },
      unreadableReason: u.reason,
    })
  }
  // Ms Reid's scan.
  {
    const sample = placeSpec(from, MORNING_REID_SCAN, named)
    if (sample !== undefined) addPdf(pdfArrival(from, ids, sample, MORNING_TIMES.reidScan))
  }
  // A re-sent List the rooms brought, three or more Bookings: a cast surgeon's in December first, then any surgeon's
  // in December (never one sharing a name with Dr Rutherford, whom the Okafor story names, nor Ms Reid or Mr Nand),
  // then the first ahead.
  {
    const roomsHospitals = new Set<string>([HOSP.forte, HOSP.ces])
    const cast = new Set<string>(Object.values(SURG))
    const candidates = listsWhere(from, (l) => roomsHospitals.has(l.hospitalId) && l.dateISO > addDaysISO(DEMO_TODAY, 1) && free(l) && qualifies(from, l, 3, { source: 'surgeonPdf' }))
    const december = candidates.filter((l) => l.dateISO >= '2026-12-01' && !/rutherford/i.test(from.masters.surgeons[l.surgeonId ?? '']?.name ?? ''))
    // Not Ms Reid or Mr Nand, whose rooms send their own PDFs this morning.
    const others = december.filter((l) => l.surgeonId !== SURG.reid && l.surgeonId !== SURG.nand)
    const list = others.find((l) => cast.has(l.surgeonId ?? '')) ?? others[0] ?? candidates[0]
    const surgeon = list !== undefined ? from.masters.surgeons[list.surgeonId ?? ''] : undefined
    const hospitalName = list !== undefined ? ({ [HOSP.forte]: 'Forte Health', [HOSP.ces]: 'Christchurch Eye Surgery' } as Record<string, string>)[list.hospitalId] : undefined
    if (list !== undefined && surgeon !== undefined && hospitalName !== undefined) {
      take(list)
      const fields = surgeonFields(from, surgeon.id)!
      const bookings = liveBookings(from, list.id)
      const kept = bookings.slice(0, -1)
      const missing = bookings[bookings.length - 1]!
      const rows = kept.map((b, i) => {
        const f = asSent(from, b, list, fields)!
        const moved = i === 1 ? shiftTime(f.scheduledTime, 20) : undefined
        return printed(`R${i + 1}`, moved !== undefined ? { ...f, scheduledTime: moved } : f, primaryText(from, b.id) ?? '')
      })
      const missingFields = asSent(from, missing, list, fields)!
      const sample: MailboxPdfSample = {
        id: `PDF-MORNING-RESEND-${list.id}`,
        fileName: `${surgeon.name.split(' ').slice(-1)[0]} list ${shortDay(list.dateISO)} ${list.session} (updated).pdf`,
        surgeonId: surgeon.id,
        surgeonName: surgeon.name,
        hospitalId: list.hospitalId,
        hospitalName,
        subject: `${subjectFor(list.dateISO, list.session)} · updated`,
        senderEmail: roomsAddressOf(from, surgeon.id, morningRoomsAddress(surgeon.name)),
        dateISO: list.dateISO,
        session: list.session,
        note: 'Re-sent: one time change, and one Booking no longer on it.',
        rows,
      }
      addPdf(
        pdfArrival(from, ids, sample, MORNING_TIMES.resend, {
          removals: [{ bookingId: missing.id, incoming: { ...missingFields, hospitalStatus: 'cancelled', cancelReason: REMOVAL_REASON } }],
        }),
      )
    }
  }
  // Mr Nand's new List, naming a free anaesthetist.
  {
    const sample = placeSpec(from, MORNING_NAND_PDF, named)
    if (sample !== undefined) addPdf(pdfArrival(from, ids, sample, MORNING_TIMES.nandPdf))
  }

  // --- Decided: yesterday's and first thing's -------------------------------------------------------------------
  // A rooms' PDF yesterday afternoon that matched exactly, decided at once.
  {
    const list = listsWhere(from, (l) => (l.hospitalId === HOSP.forte || l.hospitalId === HOSP.ces) && l.dateISO > DEMO_TODAY && free(l) && qualifies(from, l, 2, { source: 'surgeonPdf' }))[0]
    const surgeon = list !== undefined ? from.masters.surgeons[list.surgeonId ?? ''] : undefined
    if (list !== undefined && surgeon !== undefined) {
      take(list)
      const fields = surgeonFields(from, surgeon.id)!
      const bookings = liveBookings(from, list.id)
      const byRow = new Map<string, Booking>()
      const rows = bookings.map((b, i) => {
        byRow.set(`R${i + 1}`, b)
        return printed(`R${i + 1}`, asSent(from, b, list, fields)!, primaryText(from, b.id) ?? '')
      })
      const hospitalName = list.hospitalId === HOSP.forte ? 'Forte Health' : 'Christchurch Eye Surgery'
      const sample: MailboxPdfSample = {
        id: `PDF-MORNING-MATCHED-${list.id}`,
        fileName: `${surgeon.name.split(' ').slice(-1)[0]} list ${shortDay(list.dateISO)} ${list.session}.pdf`,
        surgeonId: surgeon.id,
        surgeonName: surgeon.name,
        hospitalId: list.hospitalId,
        hospitalName,
        subject: subjectFor(list.dateISO, list.session),
        senderEmail: roomsAddressOf(from, surgeon.id, morningRoomsAddress(surgeon.name)),
        dateISO: list.dateISO,
        session: list.session,
        rows,
      }
      addPdf(pdfArrival(from, ids, sample, MORNING_TIMES.pdfMatched, { decided: (r) => noChange(byRow.get(r.id)!, OFFICE, MORNING_TIMES.pdfMatchedDecided) }))
    }
  }
  // A Southern Cross update yesterday the office rejected (a List today).
  {
    const list = listsWhere(from, (l) => l.hospitalId === HOSP.sx && l.dateISO === DEMO_TODAY && free(l) && qualifies(from, l, 1))[0]
    if (list !== undefined) {
      take(list)
      const b = liveBookings(from, list.id)[0]!
      const sent = asSent(from, b, list, surgeonFields(from, list.surgeonId)!)!
      const later = shiftTime(sent.scheduledTime, 45)
      if (later !== undefined) {
        const batchId = ids.batch()
        const row = hospitalRow(ids, batchId, MORNING_TIMES.sxRejected, { ...sent, scheduledTime: later, note: MORNING_SX.rejectedNote }, {
          status: 'rejected',
          decision: { kind: 'reject', reason: MORNING_SX.rejectReason },
          decidedBy: OFFICE,
          decidedAtISO: MORNING_TIMES.sxRejectedDecided,
        })
        out.rows.push(row)
        out.batches.push(hospitalBatch(batchId, HOSP.sx, 'Southern Cross · appointment updated', MORNING_TIMES.sxRejected, [row]))
      }
    }
  }
  // A Southern Cross message held yesterday, dismissed.
  out.batches.push({
    id: ids.batch(),
    channel: 'feedMessage',
    source: 'hospital',
    hospitalId: HOSP.sx,
    label: MORNING_SX.heldYesterday.label,
    arrivalSource: { kind: 'hospitalFeed', hospitalId: HOSP.sx },
    receivedAtISO: MORNING_TIMES.sxHeldYesterday,
    rowIds: [],
    heldReason: MORNING_SX.heldYesterday.reason,
    dismissed: { by: OFFICE, atISO: MORNING_TIMES.sxHeldDismissed, reason: MORNING_SX.heldYesterday.dismissReason },
  })
  // St George's Lists for today, sent yesterday evening exactly as held, matched first thing.
  {
    const lists = listsWhere(from, (l) => l.hospitalId === HOSP.stg && l.dateISO === DEMO_TODAY && free(l) && qualifies(from, l, 1)).slice(0, 2).map(take)
    if (lists.length > 0) {
      const batchId = ids.batch()
      const rows: ImportRow[] = []
      for (const list of lists) {
        const surgeon = surgeonFields(from, list.surgeonId)!
        for (const b of liveBookings(from, list.id)) rows.push(hospitalRow(ids, batchId, MORNING_TIMES.stgToday, asSent(from, b, list, surgeon)!, noChange(b, OFFICE, MORNING_TIMES.stgTodayDecided)))
      }
      out.rows.push(...rows)
      out.batches.push(hospitalBatch(batchId, HOSP.stg, `St George's theatre Lists · ${shortDay(DEMO_TODAY)}`, MORNING_TIMES.stgToday, rows))
    }
  }
  return out
}
