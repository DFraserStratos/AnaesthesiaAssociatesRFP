/**
 * Booking search for the anaesthetist (catch-up Phase 38a; US-03.1.7,
 * US-03.1.6). Pure: parse a typed query, fold a name for comparison, match a
 * patient. The store's `searchBookingsFor` applies it to the anaesthetist's own
 * Bookings.
 *
 * The rule (a plan reading, for the owner's review): a query that has the shape
 * of an NHI, in either format, with spaces and case ignored, is matched exactly
 * against the patient's NHI, whether or not its check character passes;
 * anything else is a name query, matched when every word of it appears inside
 * the patient's name, ignoring case, accents and the ʻokina. A patient with no
 * NHI is found by name only. No fuzzy matching, no date of birth, no invoice
 * number (the stories name name and NHI only).
 */

import { validateNhi } from './nhi'
import type { Patient } from './types'

/** Fewer letters or digits than this is too short to search. */
export const BOOKING_QUERY_MIN_CHARS = 2

export type BookingQuery =
  | { kind: 'empty' }
  | { kind: 'tooShort' }
  | { kind: 'nhi'; nhi: string }
  | { kind: 'name'; tokens: string[] }

/**
 * Fold a name for comparison: lower case, accents removed (NFD, combining marks
 * dropped), the ʻokina and apostrophes removed, runs of spaces and hyphens
 * collapsed to one space. "Faʻaoso" folds to "faaoso", "Māori" to "maori".
 */
export function foldName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u02bb\u02bc\u2018\u2019'\u0060]/g, '')
    .toLowerCase()
    .replace(/[\s-]+/g, ' ')
    .trim()
}

export function parseBookingQuery(raw: string): BookingQuery {
  const trimmed = raw.trim()
  if (trimmed === '') return { kind: 'empty' }
  const significant = foldName(trimmed).replace(/[^a-z0-9]/g, '')
  if (significant.length < BOOKING_QUERY_MIN_CHARS) return { kind: 'tooShort' }
  // The NHI's own normalisation (validateNhi), on the query with its spaces removed.
  const nhi = validateNhi(trimmed.replace(/\s+/g, ''))
  if (nhi.format !== null) return { kind: 'nhi', nhi: nhi.normalised }
  const tokens = foldName(trimmed).split(' ').filter((t) => t !== '')
  return { kind: 'name', tokens }
}

export function patientMatches(query: BookingQuery, patient: Pick<Patient, 'name'> & { nhi?: string }): boolean {
  if (query.kind === 'nhi') {
    return patient.nhi !== undefined && validateNhi(patient.nhi.replace(/\s+/g, '')).normalised === query.nhi
  }
  if (query.kind === 'name') {
    const name = foldName(patient.name)
    return query.tokens.every((t) => name.includes(t))
  }
  return false
}
