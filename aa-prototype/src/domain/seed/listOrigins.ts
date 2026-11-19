/**
 * The seeded Lists' origins (catch-up Phase 34; US-02.2.4, DM-70). Every
 * seeded List is stamped where it is built (`originForNewList`): Lists a
 * recurring booking projects read `recurring`, every other seeded List
 * `manual`. Two pinned Lists, off every scripted beat, show the other two:
 *
 * - `pdf`: Dr Hughes's Tue 11 Aug AM at Forte Health for Mr Nand, sent from
 *   the PA's own address, which differs from Mr Nand's first office contact
 *   (Fendalton Specialist Rooms), so "Replies go to" shows the sender winning
 *   (for Phases 35 and 40).
 * - `hospital`: Dr Sharma's Mon 3 Aug PM at Southern Cross for Mr Hale.
 *
 * No RNG draw and no id moves.
 */

import type { List } from '../types'
import { projectedListId } from '../slots'
import { ANAE } from './cast'

export const SEED_ORIGIN_LISTS = {
  pdf: projectedListId(ANAE.hughes, '2026-08-11', 'AM'),
  hospital: projectedListId(ANAE.sharma, '2026-08-03', 'PM'),
} as const

/** The address the seeded `pdf` List's PDF arrived from (synthetic; not Mr Nand's first office contact). */
export const SEED_PDF_LIST_SENDER = 'anna.pa@fendaltonspecialists.example'

export function applySeedListOrigins(lists: Record<string, List>): void {
  const pdf = lists[SEED_ORIGIN_LISTS.pdf]
  if (pdf === undefined) throw new Error(`seed: the pinned pdf-origin List ${SEED_ORIGIN_LISTS.pdf} is missing`)
  lists[pdf.id] = { ...pdf, origin: { kind: 'pdf', senderEmail: SEED_PDF_LIST_SENDER } }
  const hospital = lists[SEED_ORIGIN_LISTS.hospital]
  if (hospital === undefined) throw new Error(`seed: the pinned hospital-origin List ${SEED_ORIGIN_LISTS.hospital} is missing`)
  lists[hospital.id] = { ...hospital, origin: { kind: 'hospital', hospitalId: hospital.hospitalId } }
}
