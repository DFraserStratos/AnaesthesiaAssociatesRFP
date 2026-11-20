/**
 * The "details differ" comparison (catch-up Phase 40; US-11.1.1). Pure.
 *
 * When an NHI returns with different details, the incoming values are held
 * for review (`Patient.pendingDetails`), never written over the record. A
 * field the incoming side lacks is not a difference; a field the existing
 * record lacks is enrichment (filled in, not a difference). Name and address
 * compare trimmed and case-insensitive, a phone by its digits, a DOB exactly.
 */

import { formatPostalAddress } from '../billing/payer'
import type { Patient, PatientDetailDifference, PatientDetailField } from '../types'

type DetailSource = Partial<Pick<Patient, 'name' | 'dobISO' | 'phone' | 'email' | 'postalAddress'>>

function norm(field: PatientDetailField, value: string): string {
  if (field === 'phone') return value.replace(/\D/g, '')
  if (field === 'dobISO') return value
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** The comparable text of each field (an address as its one line). */
export function detailText(p: DetailSource): Partial<Record<PatientDetailField, string>> {
  return {
    ...(p.name !== undefined ? { name: p.name } : {}),
    ...(p.dobISO !== undefined ? { dobISO: p.dobISO } : {}),
    ...(p.phone !== undefined ? { phone: p.phone } : {}),
    ...(p.email !== undefined ? { email: p.email } : {}),
    ...(p.postalAddress !== undefined ? { address: formatPostalAddress(p.postalAddress) } : {}),
  }
}

export const PATIENT_DETAIL_FIELDS: readonly PatientDetailField[] = ['name', 'dobISO', 'phone', 'email', 'address']

export function detailDifferences(existing: DetailSource, incoming: DetailSource): PatientDetailDifference[] {
  const a = detailText(existing)
  const b = detailText(incoming)
  const out: PatientDetailDifference[] = []
  for (const field of PATIENT_DETAIL_FIELDS) {
    const inc = b[field]
    const ex = a[field]
    if (inc === undefined || inc.trim() === '') continue
    if (ex === undefined || ex.trim() === '') continue
    if (norm(field, ex) !== norm(field, inc)) out.push({ field, existing: ex, incoming: inc })
  }
  return out
}
