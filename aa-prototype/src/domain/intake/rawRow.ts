/**
 * The raw hospital row (catch-up Phase 43; US-15.0.6 failed message handling,
 * US-02.1.4): the row exactly as the sender sent it, including the columns the
 * matcher does not map (address, phone, next of kin, the hospital's own patient
 * number, the referrer, a clinical note). Held on the import row, written once
 * when the row is staged, never edited (corrections stay in `corrections`), and
 * shown only through the office's restricted, audited, masked view.
 *
 * The prototype has no real files, so `rawRowFor` builds each row's raw columns
 * from its incoming fields plus a few synthetic extras derived from the row
 * itself (no RNG draw, so no seeded id or figure moves).
 */

import type { ImportChannel, IncomingBookingFields, RawImportRow } from '../types'
import { hashStringToSeed } from '../seed/slotHash'

const STREETS = ['Clyde Road', 'Papanui Road', 'Ilam Road', 'Riccarton Road', 'Harewood Road', 'Colombo Street', 'Linwood Avenue', 'Innes Road']
const SUBURBS = ['Fendalton', 'Merivale', 'Ilam', 'Riccarton', 'Bishopdale', 'Sydenham', 'Linwood', 'St Albans']
const KIN = ['Aroha', 'Ben', 'Claire', 'Daniel', 'Hine', 'Jack', 'Mere', 'Sam']
const REFERRERS = ['Dr K. Walsh (GP)', 'Dr R. Ngata (GP)', 'Dr M. Lee (GP)', 'Riccarton Medical Centre']
const NOTES = ['Previous PONV', 'Latex allergy', 'Type 2 diabetes, diet controlled', 'No known allergies']

const CHANNEL_SOURCE: Record<ImportChannel, string> = {
  download: 'Hospital download',
  manualSheet: 'Spreadsheet sent by the hospital',
  feedMessage: 'Hospital message (Future scope)',
  pdfList: "Surgeon's rooms PDF list",
}

/** The raw columns for one incoming row: what was mapped, then what the matcher never reads. */
export function rawRowFor(incoming: IncomingBookingFields, channel: ImportChannel): RawImportRow {
  const h = hashStringToSeed(`${incoming.patient.name}|${incoming.dateISO}|${incoming.session}|${incoming.hospitalId}`)
  const pickOf = <T,>(items: readonly T[], shift: number): T => items[(h >>> shift) % items.length]!
  const surname = incoming.patient.name.split(' ').pop() ?? 'Patient'
  const columns: { name: string; value: string }[] = [
    { name: 'Source', value: CHANNEL_SOURCE[channel] },
    { name: 'Hospital patient number', value: `MRN${String(100000 + (h % 900000))}` },
    { name: 'Patient name', value: incoming.patient.name },
    { name: 'NHI', value: incoming.patient.nhi ?? '' },
    { name: 'Date of birth', value: incoming.patient.dobISO ?? '' },
    { name: 'Address', value: `${(h % 240) + 2} ${pickOf(STREETS, 3)}, ${pickOf(SUBURBS, 7)}, Christchurch 80${String(h % 90).padStart(2, '0')}` },
    { name: 'Phone', value: `021 55${String(h % 100000).padStart(5, '0')}` },
    { name: 'Email', value: `${surname.toLowerCase().replace(/[^a-z]/g, '')}.${h % 1000}@example.net` },
    { name: 'Next of kin', value: `${pickOf(KIN, 11)} ${surname}` },
    { name: 'Next of kin phone', value: `027 55${String((h >>> 5) % 100000).padStart(5, '0')}` },
    { name: 'Date', value: incoming.dateISO },
    { name: 'Session', value: incoming.session },
    { name: 'Time', value: incoming.scheduledTime ?? '' },
    { name: 'Surgeon', value: incoming.surgeon?.name ?? '' },
    { name: 'Procedure', value: incoming.procedure?.text ?? '' },
    { name: 'Procedure code', value: incoming.procedure?.code ?? '' },
    { name: 'Referrer', value: pickOf(REFERRERS, 13) },
    { name: 'Clinical note', value: pickOf(NOTES, 17) },
    { name: 'Status', value: incoming.hospitalStatus },
  ]
  if (incoming.insurer !== undefined) columns.push({ name: 'Insurer', value: incoming.insurer.text }, { name: 'Approval number', value: incoming.insurer.approvalNumber ?? '' })
  if (incoming.note !== undefined) columns.push({ name: 'Note', value: incoming.note })
  return { columns }
}
