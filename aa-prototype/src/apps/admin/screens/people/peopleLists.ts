/**
 * The People lists' search and filters (build plan Phase 53; US-13.4.1 "Find a
 * person"), pure: each takes every record and the list's state, and returns the
 * matching rows in the list's order. No React, no store; the tabs page the
 * result.
 *
 * - Search is case-insensitive on the name and the other fields each list names;
 *   an HPI CPN or registration number matches with its spaces taken out.
 * - Anaesthetists: Active (default), Inactive or All by `statusOn` on the given
 *   day (Phase 52: one starting later, or leaving, is still Active), and a tier;
 *   in surname order.
 * - Surgeons: Active (default), Retired or All by `isRetired`, and a specialty; in
 *   surname order.
 * - Specialties: by name.
 */

import type { Anaesthetist, Surgeon } from '../../../../domain/types'
import type { Specialty } from '../../../../domain/specialties'
import { isInPracticeOn } from '../../../../domain/anaesthetistStatus'
import { isRetired } from '../../../../domain/masterLifecycle'
import { compareBySurname } from '../../../../domain/surgeons'
import { surnameOf } from '../../../../shared/format'

export type AnaesthetistStatusFilter = 'active' | 'inactive' | 'all'
export type SurgeonStatusFilter = 'active' | 'retired' | 'all'

/** `all`, or a tier's number as text ('1' to '4'). */
export type TierFilter = string

const ALL = 'all'

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** An identifier with its spaces taken out, upper-cased: "ABC 123" matches "abc123". */
function compact(text: string): string {
  return text.replace(/\s+/g, '').toUpperCase()
}

/** Whether a search matches: an empty search matches all; else a name-like field contains it, or an identifier contains it with spaces taken out. */
function matches(q: string, words: readonly (string | undefined)[], ids: readonly (string | undefined)[]): boolean {
  const query = normalise(q)
  if (query === '') return true
  if (words.some((w) => w !== undefined && normalise(w).includes(query))) return true
  // Every identifier here holds a digit (a registration number, an HPI CPN such as 12ABCD), so a
  // word-only search never matches one by chance.
  const id = compact(q)
  return /\d/.test(id) && ids.some((x) => x !== undefined && compact(x).includes(id))
}

export interface AnaesthetistListState {
  q: string
  status: AnaesthetistStatusFilter
  tier: TierFilter
}

/** Anaesthetists by name, registration number or HPI CPN; Active, Inactive or All by `statusOn` on `todayISO`; a tier through `tierOf`; surname order. */
export function anaesthetistRows(
  all: readonly Anaesthetist[],
  { q, status, tier }: AnaesthetistListState,
  todayISO: string,
  tierOf: (anaesthetistId: string) => number,
): Anaesthetist[] {
  return all
    .filter((a) => status === ALL || (status === 'inactive') !== isInPracticeOn(a, todayISO))
    .filter((a) => tier === ALL || String(tierOf(a.registrationNumber)) === tier)
    .filter((a) => matches(q, [a.name], [a.registrationNumber, a.hpiId]))
    .sort((a, b) => surnameOf(a.name).localeCompare(surnameOf(b.name)) || a.name.localeCompare(b.name))
}

export interface SurgeonListState {
  q: string
  status: SurgeonStatusFilter
  /** `all`, or a specialty id. */
  specialtyId: string
}

/** Surgeons by name, practice name or HPI CPN; Active, Retired or All; one specialty; surname order. */
export function surgeonRows(all: readonly Surgeon[], { q, status, specialtyId }: SurgeonListState): Surgeon[] {
  return all
    .filter((s) => status === ALL || (status === 'retired') === isRetired(s))
    .filter((s) => specialtyId === ALL || s.specialtyIds.includes(specialtyId))
    .filter((s) => matches(q, [s.name, s.practiceName], [s.hpiId]))
    .sort(compareBySurname)
}

/** Specialties by name, in name order. */
export function specialtyRows(all: readonly Specialty[], { q }: { q: string }): Specialty[] {
  return all.filter((s) => matches(q, [s.name], [])).sort((a, b) => a.name.localeCompare(b.name))
}
