/**
 * The add-booking NHI field's captions, in one place (catch-up Phase 40;
 * D11, US-03.1.5, US-11.1.4). Phase 40a adds the NHI lookup to the same
 * field: its captions belong here too.
 */

import { NHI_REASONS, NHI_SHAPE_HINT, nhiEntryFeedback } from '../../domain/nhi'
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

/** The caption once a typed NHI is valid (catch-up Phase 40a). */
export const VALID_NHI = 'Valid NHI'

/**
 * The field's live check as it is typed (catch-up Phase 40a, on
 * `nhiEntryFeedback`): the required hint while blank, the shape hint while
 * short, the validator's reason at once for an I or O and on the seventh
 * character, and "Valid NHI" (success) once it validates.
 */
export function nhiFieldCheck(nhi: string): { valid: boolean; invalid: boolean; hint?: string; tone?: 'success' } {
  const feedback = nhiEntryFeedback(nhi)
  switch (feedback.state) {
    case 'empty':
      return { valid: false, invalid: false, hint: NHI_REQUIRED_HINT }
    case 'incomplete':
      return { valid: false, invalid: false, hint: NHI_SHAPE_HINT }
    case 'invalid':
      return { valid: false, invalid: true, hint: feedback.reason ?? NHI_REASONS.notValid }
    case 'valid':
      return { valid: true, invalid: false, hint: VALID_NHI, tone: 'success' }
  }
}
