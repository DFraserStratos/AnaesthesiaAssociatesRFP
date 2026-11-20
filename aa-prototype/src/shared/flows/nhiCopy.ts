/**
 * The add-booking NHI field's captions, in one place (catch-up Phase 40;
 * D11, US-03.1.5, US-11.1.4). Phase 40a adds the NHI lookup to the same
 * field: its captions belong here too.
 */

import { validateNhi } from '../../domain/nhi'
import { formatDob } from '../format'

/** Save's disabled reason while the NHI is blank or invalid. */
export const NHI_NEEDED_TO_SAVE = 'An NHI is needed to save a Booking.'

/** The field's hint while it is blank. */
export const NHI_REQUIRED_HINT = 'Required. Seven characters, as on the referral or the hospital list.'

/** Added to the matched-record line when the typed details differ from the record's. */
export const DETAILS_DIFFER_LINE = 'Some details differ. The office will review them.'

/** The saved Booking reused the record this NHI matched. */
export const LINKED_TO_EXISTING_RECORD = 'Linked to an existing patient record by NHI. No duplicate was created.'

/** The saved Booking made a new record. */
export const NEW_PATIENT_RECORD = 'A new patient record was created for this booking.'

/** The live line under the field when the NHI matches a record. */
export function matchedRecordText(name: string, dobISO: string): string {
  return `Matches an existing record: ${name}, born ${formatDob(dobISO)}.`
}

/** The field's live check: `invalid` and its reason while a typed NHI is not valid; the hint while blank. */
export function nhiFieldCheck(nhi: string): { valid: boolean; invalid: boolean; hint?: string } {
  if (nhi.trim() === '') return { valid: false, invalid: false, hint: NHI_REQUIRED_HINT }
  const verdict = validateNhi(nhi)
  if (verdict.valid) return { valid: true, invalid: false }
  return { valid: false, invalid: true, hint: verdict.reason ?? 'The NHI is not valid.' }
}
