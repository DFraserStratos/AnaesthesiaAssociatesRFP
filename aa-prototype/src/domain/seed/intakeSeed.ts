/**
 * The seeded intake (catch-up Phase 33a; FT-02.6, D66): one Southern Cross
 * import holding one row with no NHI, waiting in the unmatched queue, and its
 * stub on Dr Souter's Tue 4 Aug PM List (Ms Patel), a List no scripted beat
 * uses. Synthetic patient; AR-35-style wording. No RNG draw, no patient
 * record (a waiting row creates none, D11), so no seeded id moves.
 *
 * Seeded ids use their own namespace (`IBS`, `IRS`) so the first runtime
 * import is still IB0001 / IR0001; the stub is STB0001 and the `stub` counter
 * starts at 2.
 */

import type { ImportBatch, ImportRow, Stub, SurgeonPdfList } from '../types'
import { buildFacsimile, PDF_LIST_SAMPLES } from '../intake/pdfLists'
import { DEMO_TODAY } from '../clock'
import { ANAE, HOSP } from './cast'
import { projectedListId } from '../slots'
import { rawRowFor } from '../intake/rawRow'

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

/**
 * The seeded PDF list (catch-up Phase 34; DM-61): Mr Okafor's Wed 5 Aug AM
 * list, as received from the practice PA's address, not yet corrected or sent.
 * PDL0001; the `pdfList` counter starts at 2. Its target holds no List, so no
 * scripted List is touched.
 */
export const SEED_PDF_LIST = {
  id: 'PDL0001',
  sampleId: 'PDF-OKAFOR-0805',
} as const

export function seededPdfLists(): Record<string, SurgeonPdfList> {
  const sample = PDF_LIST_SAMPLES.find((s) => s.id === SEED_PDF_LIST.sampleId)!
  const list: SurgeonPdfList = {
    id: SEED_PDF_LIST.id,
    sampleId: sample.id,
    file: { name: sample.fileName, facsimile: buildFacsimile(sample) },
    surgeonId: sample.surgeonId,
    senderEmail: sample.defaultSender,
    hospitalId: sample.hospitalId,
    subject: sample.subject,
    receivedAtISO: `${DEMO_TODAY}T07:10:00`,
    receivedBy: 'Kirsty W.',
    target: { ...sample.target },
    status: 'received',
    rows: sample.rows.map(({ id, ...asRead }) => ({ id, asRead, corrections: [] })),
  }
  return { [list.id]: list }
}

export function seededIntake(): { batches: Record<string, ImportBatch>; rows: Record<string, ImportRow>; stubs: Record<string, Stub>; pdfLists: Record<string, SurgeonPdfList> } {
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
    importedBy: 'Kirsty W.',
    importedAtISO: RECEIVED_AT,
    rowIds: [row.id],
    skippedCount: 0,
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
  return { batches: { [batch.id]: batch }, rows: { [row.id]: row }, stubs: { [stub.id]: stub }, pdfLists: seededPdfLists() }
}
