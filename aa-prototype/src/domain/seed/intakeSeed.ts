/**
 * The seeded intake (catch-up Phase 33a; FT-02.6, D66; build plan Phase 68, D125): every arrival made by its source.
 *
 * - One Southern Cross batch holding one row with no NHI, waiting, and its stub on Dr Souter's Tue 8 Dec PM List
 *   (Ms Patel), a List no scripted beat uses. Synthetic patient; AR-35-style wording; no patient record (a waiting
 *   row creates none, D11).
 * - Mr Okafor's rooms' PDF (`PDL0001`), arrived in the mailbox from the practice PA's address and read at once: its
 *   rows staged as open rows, each with its `pdfRowId` and the reader's values (one NHI printed wrongly reads unsure).
 *   Its List (Forte Health, Wed 9 Dec AM) is not held, so it is a New List.
 * - One decided arrival, so Decided is not empty: St George's day-before List for Mon 23 Nov AM (Dr Tom Ngata, Mr
 *   Nand), every row matched with no change by the office on the Monday morning.
 * - The morning's other arrivals (`intakeMorning.ts`): what St George's, Southern Cross and the rooms' mailbox sent
 *   before the office sat down, and a few decided ones, read from the schedule the slice is built over (the core seed
 *   under test; the whole practice at runtime, where `practiceAppState` rebuilds the slice over it).
 *
 * No RNG draw, so no seeded id moves. Seeded ids use their own namespace (`IBS`, `IRS`) so the first runtime arrival
 * is still IB0001 / IR0001; the stub is STB0001 (the `stub` counter starts at 2) and the PDF PDL0001 (`pdfList` at 2).
 */

import type { ImportBatch, ImportRow, IncomingBookingFields, IntakeSource, Stub, SurgeonPdfList } from '../types'
import { buildFacsimile, PDF_LIST_SAMPLES, pdfListBatchLabel, pdfRowIncoming } from '../intake/pdfLists'
import { readValuesOfRow, simulateRead } from '../intake/pdfRead'
import { sessionLabel } from '../intake/matching'
import { longDay, shortDay } from '../dateText'
import { DEMO_TODAY } from '../clock'
import { ANAE, HOSP } from './cast'
import { projectedListId } from '../slots'
import { rawRowFor } from '../intake/rawRow'
import { seededMorning, type MorningSource } from './intakeMorning'

export const SEED_STUB = {
  batchId: 'IBS001',
  rowId: 'IRS001',
  stubId: 'STB0001',
  listId: projectedListId(ANAE.souter, '2026-12-08', 'PM'),
  patientName: 'Mere Tipene',
  /** The NHI the office types on Matching (and the PWA stand-in adds): synthetic, valid, held by no seeded patient. */
  nhiToType: 'ZQA1024',
} as const

const RECEIVED_AT = `${DEMO_TODAY}T07:30:00`
const SOURCE_LABEL = 'Southern Cross theatre list, Tue 8 Dec'

/** The rooms' mailbox address the PDFs arrive at (D125). */
export const ROOMS_MAILBOX_ADDRESS = 'lists@aa.example'

/** The source ids (build plan Phase 68; DM-14). */
export const INTAKE_SOURCE_IDS = { stg: 'SRC-STG', sx: 'SRC-SX', mailbox: 'SRC-MAILBOX', forte: 'SRC-FORTE' } as const

/**
 * The seeded PDF list (catch-up Phase 34; DM-61; re-cast in build plan Phase 68 as a mailbox arrival): Mr Okafor's
 * Wed 9 Dec AM list at Forte Health, naming Dr Rutherford, from the practice PA's address, read at once and its rows
 * staged (`batchId`, rows `rowIds`). PDL0001; the `pdfList` counter starts at 2. Its List is not held, so no scripted
 * List is touched.
 */
export const SEED_PDF_LIST = {
  id: 'PDL0001',
  sampleId: 'PDF-OKAFOR-0805',
  batchId: 'IBS002',
  rowIds: ['IRS002', 'IRS003', 'IRS004'],
  /** The anaesthetist the PDF names. */
  anaesthetist: { name: 'Dr James Rutherford', hpiId: '11RUTJ' },
} as const

const PDF_RECEIVED_AT = `${DEMO_TODAY}T07:10:00`
/** The mailbox's actor name (`MAILBOX_ACTOR.who` in the store). */
const MAILBOX_WHO = "Rooms' mailbox"
const OKAFOR = { name: 'Mr C. Okafor', hpiId: '43OKAC' } as const

/** The seeded PDF and its arrival: the list as read, its batch and its open rows. */
function seededPdfArrival(): { list: SurgeonPdfList; batch: ImportBatch; rows: ImportRow[] } {
  const sample = PDF_LIST_SAMPLES.find((s) => s.id === SEED_PDF_LIST.sampleId)!
  const asRead = sample.rows.map(({ id, ...rest }) => ({ id, asRead: rest }))
  const read = simulateRead({
    header: { surgeon: sample.surgeonName, hospital: sample.hospitalName, date: longDay(sample.target.dateISO), session: sample.target.session, anaesthetist: SEED_PDF_LIST.anaesthetist.name },
    // R2's NHI is printed wrongly (ZAA0068 fails its check digit): the reader is unsure of it.
    rows: asRead.map((r) => ({ id: r.id, values: readValuesOfRow(r.asRead), ...(r.id === 'R2' ? { confidence: { nhi: 0.62 } } : {}) })),
  })
  const list: SurgeonPdfList = {
    id: SEED_PDF_LIST.id,
    sampleId: sample.id,
    file: { name: sample.fileName, facsimile: buildFacsimile(sample) },
    surgeonId: sample.surgeonId,
    senderEmail: sample.defaultSender,
    hospitalId: sample.hospitalId,
    subject: sample.subject,
    receivedAtISO: PDF_RECEIVED_AT,
    receivedBy: MAILBOX_WHO,
    target: { ...sample.target },
    status: 'sent',
    batchId: SEED_PDF_LIST.batchId,
    sentAtISO: PDF_RECEIVED_AT,
    sentBy: MAILBOX_WHO,
    rows: asRead.map((r, i) => ({ id: r.id, asRead: r.asRead, corrections: [], read: read.rows[i]!.read })),
    headerRead: read.headerRead,
  }
  const rows: ImportRow[] = list.rows.map((pdfRow, i) => {
    const incoming: IncomingBookingFields = { ...pdfRowIncoming(list, pdfRow, { ...OKAFOR }), anaesthetist: { ...SEED_PDF_LIST.anaesthetist } }
    return {
      id: SEED_PDF_LIST.rowIds[i]!,
      batchId: SEED_PDF_LIST.batchId,
      channel: 'pdfList',
      source: 'rooms',
      receivedAtISO: PDF_RECEIVED_AT,
      incoming,
      status: 'open',
      raw: rawRowFor(incoming, 'pdfList'),
      pdfRowId: pdfRow.id,
    }
  })
  const batch: ImportBatch = {
    id: SEED_PDF_LIST.batchId,
    channel: 'pdfList',
    source: 'rooms',
    hospitalId: sample.hospitalId,
    label: pdfListBatchLabel(sample.surgeonName, sessionLabel(sample.target.dateISO, sample.target.session)),
    sampleId: sample.id,
    arrivalSource: { kind: 'mailbox', senderEmail: sample.defaultSender },
    receivedAtISO: PDF_RECEIVED_AT,
    rowIds: rows.map((r) => r.id),
    pdfListId: list.id,
    senderEmail: sample.defaultSender,
  }
  return { list, batch, rows }
}

/**
 * The seeded decided arrival (build plan Phase 68; D125, so Decided is not empty): St George's day-before List for
 * Mon 23 Nov AM, Dr Tom Ngata's List with Mr Nand, a List no scripted beat uses. Each of its live Bookings was sent
 * exactly as held, and the office matched every row with no change on the Monday morning.
 */
export const SEED_DECIDED_ARRIVAL = {
  batchId: 'IBS003',
  listId: projectedListId(ANAE.ngata, '2026-11-23', 'AM'),
  receivedAtISO: '2026-11-22T18:05:00',
  decidedAtISO: '2026-11-23T07:35:00',
  decidedBy: 'Kirsty W.',
  /** The first row id; the rest follow (IRS005, IRS006, ...). */
  firstRowNumber: 5,
} as const

/**
 * The schedule and masters the seeded arrivals are read from: the core seed under test, the whole practice at
 * runtime (`practiceAppState`). Structural, so the store's state satisfies it.
 */
export type IntakeSeedSource = MorningSource

function seededDecidedArrival(from: IntakeSeedSource): { batch: ImportBatch; rows: ImportRow[] } | undefined {
  const a = SEED_DECIDED_ARRIVAL
  const list = from.schedule.lists[a.listId]
  if (list === undefined) return undefined
  const surgeon = from.masters.surgeons[list.surgeonId]
  const bookings = Object.values(from.schedule.bookings)
    .filter((b) => b.listId === list.id && b.cancellation === undefined)
    .sort((x, y) => (x.scheduledTime ?? '99:99').localeCompare(y.scheduledTime ?? '99:99') || x.id.localeCompare(y.id))
  const rows: ImportRow[] = []
  for (const b of bookings) {
    const patient = from.masters.patients[b.patientId]
    if (patient === undefined) continue
    const incoming: IncomingBookingFields = {
      hospitalId: list.hospitalId,
      dateISO: list.dateISO,
      session: list.session,
      ...(surgeon !== undefined ? { surgeon: { name: surgeon.name, ...(surgeon.hpiId !== undefined ? { hpiId: surgeon.hpiId } : {}) } } : {}),
      ...(b.scheduledTime !== undefined ? { scheduledTime: b.scheduledTime } : {}),
      patient: { name: patient.name, nhi: patient.nhi, ...(patient.dobISO !== '' ? { dobISO: patient.dobISO } : {}) },
      hospitalStatus: 'booked',
    }
    rows.push({
      id: `IRS${String(a.firstRowNumber + rows.length).padStart(3, '0')}`,
      batchId: a.batchId,
      channel: 'download',
      source: 'hospital',
      receivedAtISO: a.receivedAtISO,
      incoming,
      status: 'applied',
      decision: { kind: 'match', bookingId: b.id, changeType: 'noChange', fieldsApplied: [], listId: list.id },
      decidedBy: a.decidedBy,
      decidedAtISO: a.decidedAtISO,
      raw: rawRowFor(incoming, 'download'),
    })
  }
  if (rows.length === 0) return undefined
  const batch: ImportBatch = {
    id: a.batchId,
    channel: 'download',
    source: 'hospital',
    hospitalId: list.hospitalId,
    label: `St George's theatre Lists · ${shortDay(list.dateISO)}`,
    arrivalSource: { kind: 'hospitalFeed', hospitalId: list.hospitalId },
    receivedAtISO: a.receivedAtISO,
    rowIds: rows.map((r) => r.id),
  }
  return { batch, rows }
}

/**
 * The sources and their state (build plan Phase 68; DM-14, D125 with OQ-109 part 1 open): St George's (HL7 v2) and
 * Southern Cross (FHIR R4) receiving, the rooms' mailbox reading, Forte Health not connected (its Lists come by PDF).
 * Every other hospital without a record reads as not connected. Inbound only: nothing is ever sent back.
 */
export function seededSources(batches: readonly Pick<ImportBatch, 'arrivalSource' | 'receivedAtISO'>[] = []): Record<string, IntakeSource> {
  // Each source's last arrival: the newest seeded one it made (the stored time the feed and Sources read).
  const newest = (match: (b: Pick<ImportBatch, 'arrivalSource'>) => boolean, fallback: string) =>
    batches.filter(match).reduce((max, b) => (b.receivedAtISO > max ? b.receivedAtISO : max), fallback)
  const fromHospital = (hospitalId: string) => (b: Pick<ImportBatch, 'arrivalSource'>) => b.arrivalSource.kind === 'hospitalFeed' && b.arrivalSource.hospitalId === hospitalId
  const sources: IntakeSource[] = [
    { id: INTAKE_SOURCE_IDS.stg, kind: 'hospitalFeed', name: "St George's", hospitalId: HOSP.stg, protocol: 'HL7 v2', state: 'receiving', lastReceivedAtISO: newest(fromHospital(HOSP.stg), SEED_DECIDED_ARRIVAL.receivedAtISO) },
    { id: INTAKE_SOURCE_IDS.sx, kind: 'hospitalFeed', name: 'Southern Cross', hospitalId: HOSP.sx, protocol: 'FHIR R4', state: 'receiving', lastReceivedAtISO: newest(fromHospital(HOSP.sx), RECEIVED_AT) },
    { id: INTAKE_SOURCE_IDS.mailbox, kind: 'mailbox', name: "Rooms' mailbox", address: ROOMS_MAILBOX_ADDRESS, state: 'reading', lastReceivedAtISO: newest((b) => b.arrivalSource.kind === 'mailbox', PDF_RECEIVED_AT) },
    { id: INTAKE_SOURCE_IDS.forte, kind: 'hospitalFeed', name: 'Forte Health', hospitalId: HOSP.forte, state: 'notConnected' },
  ]
  return Object.fromEntries(sources.map((s) => [s.id, s]))
}

/** The seeded intake slice over a schedule; each source's last received time is its newest seeded arrival. */
export function seededIntake(from: IntakeSeedSource): {
  batches: Record<string, ImportBatch>
  rows: Record<string, ImportRow>
  stubs: Record<string, Stub>
  pdfLists: Record<string, SurgeonPdfList>
  sources: Record<string, IntakeSource>
} {
  const row: ImportRow = {
    id: SEED_STUB.rowId,
    batchId: SEED_STUB.batchId,
    channel: 'download',
    source: 'hospital',
    receivedAtISO: RECEIVED_AT,
    incoming: {
      hospitalId: HOSP.sx,
      dateISO: '2026-12-08',
      session: 'PM',
      surgeon: { name: 'Ms K. Patel', hpiId: '41PATK' },
      scheduledTime: '14:00',
      patient: { name: SEED_STUB.patientName, dobISO: '1981-10-18' },
      procedure: { text: 'Lap chole', code: 'G4' },
      hospitalStatus: 'booked',
    },
    status: 'open',
  }
  // The row as the hospital sent it (catch-up Phase 43), from its own fields: no RNG draw.
  row.raw = rawRowFor(row.incoming, row.channel)
  const batch: ImportBatch = {
    id: SEED_STUB.batchId,
    channel: 'download',
    source: 'hospital',
    hospitalId: HOSP.sx,
    label: SOURCE_LABEL,
    arrivalSource: { kind: 'hospitalFeed', hospitalId: HOSP.sx },
    receivedAtISO: RECEIVED_AT,
    rowIds: [row.id],
  }
  const stub: Stub = {
    id: SEED_STUB.stubId,
    listId: SEED_STUB.listId,
    importRowId: row.id,
    reason: 'noNhi',
    asReceived: { patientName: SEED_STUB.patientName, procedureText: 'Lap chole', scheduledTime: '14:00', hospitalId: HOSP.sx, sourceLabel: SOURCE_LABEL },
    createdAtISO: RECEIVED_AT,
    status: 'standing',
  }
  const pdf = seededPdfArrival()
  const decided = seededDecidedArrival(from)
  const morning = seededMorning(from)
  const batches: ImportBatch[] = [batch, pdf.batch, ...(decided !== undefined ? [decided.batch] : []), ...morning.batches]
  const rows: ImportRow[] = [row, ...pdf.rows, ...(decided?.rows ?? []), ...morning.rows]
  return {
    batches: Object.fromEntries(batches.map((b) => [b.id, b])),
    rows: Object.fromEntries(rows.map((r) => [r.id, r])),
    stubs: Object.fromEntries([stub, ...morning.stubs].map((s) => [s.id, s])),
    pdfLists: Object.fromEntries([pdf.list, ...morning.pdfLists].map((l) => [l.id, l])),
    sources: seededSources(batches),
  }
}
