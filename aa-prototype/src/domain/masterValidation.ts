/**
 * Master data's field rules that were inline in the store (catch-up Phase 42;
 * US-13.4.1, US-13.4.3): the hospital, the hospital holiday and the public
 * holiday. The office's add and edit and the seed load's row check call these
 * same functions, so a rejected row's reason is word for word the refusal the
 * sheet shows. The pricing masters keep their own validators in
 * `domain/billing` (Parties, Contracts, price ranges, RVG groups, funding
 * tags), the specialties theirs in `domain/specialties.ts`, the surgeon's
 * HPI CPN and contacts theirs in `domain/surgeons.ts` and
 * `domain/surgeonContacts.ts`. Pure: no React, no store.
 */

import { isPlausibleEmail } from './surgeons'
import type { Hospital, HospitalHoliday, PublicHoliday } from './types'

export interface FieldRefusal {
  code: string
  message: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar date in ISO form (31 Feb is not one). */
export function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number) as [number, number, number]
  if (m < 1 || m > 12 || d < 1) return false
  const days = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]!
  return d <= days
}

// ---------------------------------------------------------------------------
// Hospitals
// ---------------------------------------------------------------------------

export const HOSPITAL_EMAIL_INVALID = 'That contact email does not look right. Use the form name@example.co.nz.'

/** A hospital's name and contact email (US-13.4.1), for add and edit. */
export function hospitalFieldsRefusal(
  fields: { name: string; contactEmail?: string },
  hospitals: Readonly<Record<string, Pick<Hospital, 'id' | 'name'>>>,
  excludeId?: string,
): FieldRefusal | null {
  const name = fields.name.trim()
  if (name === '') return { code: 'nameRequired', message: 'A hospital name is required.' }
  if (Object.values(hospitals).some((h) => h.id !== excludeId && h.name === name)) {
    return { code: 'duplicateName', message: 'A hospital with that name already exists.' }
  }
  const email = fields.contactEmail?.trim() ?? ''
  if (email !== '' && !isPlausibleEmail(email)) return { code: 'invalidEmail', message: HOSPITAL_EMAIL_INVALID }
  return null
}

// ---------------------------------------------------------------------------
// Hospital holidays (30)
// ---------------------------------------------------------------------------

/** One closure per hospital and date, a name and a real date (US-01.5.1). */
export function hospitalHolidayRefusal(
  fields: { hospitalId: string; dateISO: string; name: string },
  masters: { hospitals: Readonly<Record<string, unknown>>; holidays: Readonly<Record<string, HospitalHoliday>> },
  excludeId?: string,
): FieldRefusal | null {
  if (masters.hospitals[fields.hospitalId] === undefined) return { code: 'notFound', message: 'Hospital not found.' }
  if (fields.name.trim() === '') return { code: 'nameRequired', message: 'A holiday name is required.' }
  if (!isRealIsoDate(fields.dateISO)) return { code: 'dateRequired', message: 'A valid date is required.' }
  if (Object.values(masters.holidays).some((h) => h.id !== excludeId && h.hospitalId === fields.hospitalId && h.dateISO === fields.dateISO)) {
    return { code: 'duplicateHoliday', message: 'That hospital already has a holiday recorded on that date.' }
  }
  return null
}

// ---------------------------------------------------------------------------
// Public holidays (42)
// ---------------------------------------------------------------------------

export interface PublicHolidayFields {
  dateISO: string
  name: string
  kind: PublicHoliday['kind']
  region?: string
  openHospitalIds: readonly string[]
}

/** A name, a real date, one public holiday per date, and only known hospitals listed open. */
export function publicHolidayRefusal(
  fields: PublicHolidayFields,
  masters: { hospitals: Readonly<Record<string, unknown>>; publicHolidays: Readonly<Record<string, PublicHoliday>> },
  excludeId?: string,
): FieldRefusal | null {
  if (fields.name.trim() === '') return { code: 'nameRequired', message: 'A public holiday name is required.' }
  if (!isRealIsoDate(fields.dateISO)) return { code: 'dateRequired', message: 'A valid date is required.' }
  const clash = Object.values(masters.publicHolidays).find((p) => p.id !== excludeId && p.dateISO === fields.dateISO)
  if (clash !== undefined) {
    return { code: 'duplicatePublicHoliday', message: `${clash.name} is already a public holiday on that date.` }
  }
  if (fields.openHospitalIds.some((id) => masters.hospitals[id] === undefined)) {
    return { code: 'unknownHospital', message: 'One of the hospitals listed open is not in the master data.' }
  }
  return null
}

/** The stored row's fields: trimmed, the region only on a regional holiday, open hospitals de-duplicated in order. */
export function cleanPublicHoliday(fields: PublicHolidayFields): Omit<PublicHoliday, 'id'> {
  const region = fields.region?.trim() ?? ''
  return {
    dateISO: fields.dateISO,
    name: fields.name.trim(),
    kind: fields.kind,
    ...(fields.kind === 'regional' && region !== '' ? { region } : {}),
    openHospitalIds: [...new Set(fields.openHospitalIds)],
  }
}
