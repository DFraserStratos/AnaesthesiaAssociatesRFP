/**
 * Where a List came from (catch-up Phase 34; US-02.2.4, DM-70). Pure, no React.
 *
 * Every List records its origin: a surgeon's rooms' PDF with the address it
 * arrived from, the hospital's list, entry by hand, or a recurring booking.
 * Every creation path stamps it through `originForNewList`, and nothing else
 * changes it except `originAfterRoomsRow` (the later-address rule below).
 *
 * The build choices US-02.2.4 leaves open live here, one place each:
 * - **A later PDF from another address** (`originAfterRoomsRow`): a rooms row
 *   decided onto a `pdf` List, from a later PDF that arrived from a different
 *   address, replaces the List's sender with the newer one, so the office
 *   replies to whoever sent the latest list (the earlier address goes to the
 *   List's History, `list.senderChanged`). A rooms row landing on a hospital or
 *   by-hand List adds no sender.
 * - **A recurring booking's List** (`originForNewList({ kind: 'recurring' })`):
 *   records `recurring`, with no sender.
 * - **A List made from another List** (a Booking moved to a free session, the
 *   post-op addendum): keeps the origin of the List it came from.
 * - **An office-logged request** whose source is a PDF records `pdf` with the
 *   "Sent from" address typed on the request form; any other request, or a PDF
 *   request with no address, is entered by hand.
 */

import type { HospitalId, ImportSource, ListOrigin, PdfListId, RequestSource } from '../types'

/** Why a List is being created: each creation path names its own cause. */
export type NewListCause =
  /** The office creates a List in a session, or the seed records one. */
  | { kind: 'office' }
  /** The office logs a surgeon's request as a Draft List (Phase 31). */
  | { kind: 'request'; source?: RequestSource; senderEmail?: string }
  /** The office's decision on an import row creates the List (33's create path). */
  | { kind: 'importRow'; source: ImportSource; hospitalId: HospitalId; senderEmail?: string; pdfListId?: PdfListId }
  /** A recurring booking projects the List, or stands for its closed session as a Draft List. */
  | { kind: 'recurring' }
  /** A new List made from another (a moved Booking's new List, the post-op addendum). */
  | { kind: 'derived'; from: { origin: ListOrigin } }

/** The one helper every List creation path calls. */
export function originForNewList(cause: NewListCause): ListOrigin {
  switch (cause.kind) {
    case 'office':
      return { kind: 'manual' }
    case 'request': {
      const sender = cause.senderEmail?.trim() ?? ''
      return cause.source === 'pdf' && sender !== '' ? { kind: 'pdf', senderEmail: sender } : { kind: 'manual' }
    }
    case 'importRow': {
      const sender = cause.senderEmail?.trim() ?? ''
      if (cause.source === 'rooms' && sender !== '') {
        return { kind: 'pdf', senderEmail: sender, ...(cause.pdfListId !== undefined ? { pdfListId: cause.pdfListId } : {}) }
      }
      return { kind: 'hospital', hospitalId: cause.hospitalId }
    }
    case 'recurring':
      return { kind: 'recurring' }
    case 'derived':
      return { ...cause.from.origin }
  }
}

/**
 * The later-address rule (US-02.2.4 build choice): the origin a List takes
 * when a rooms row from a PDF that arrived from `senderEmail` is decided onto
 * it, or `undefined` when it does not change. Only a `pdf` List changes, and
 * only for a different address (ignoring case).
 */
export function originAfterRoomsRow(origin: ListOrigin, senderEmail: string | undefined, pdfListId: PdfListId | undefined): ListOrigin | undefined {
  if (origin.kind !== 'pdf') return undefined
  const sender = senderEmail?.trim() ?? ''
  if (sender === '' || sender.toLowerCase() === origin.senderEmail.toLowerCase()) return undefined
  return { kind: 'pdf', senderEmail: sender, ...(pdfListId !== undefined ? { pdfListId } : {}) }
}

/** The address a List holds, where it came from a PDF. */
export function listSenderEmail(list: { origin: ListOrigin } | undefined): string | undefined {
  return list?.origin.kind === 'pdf' ? list.origin.senderEmail : undefined
}

/** The origin in words, for the Admin List view and the Booking. */
export function listOriginText(origin: ListOrigin, hospitalName: (id: HospitalId) => string): string {
  switch (origin.kind) {
    case 'pdf':
      return `From a rooms' PDF · sent from ${origin.senderEmail}`
    case 'hospital':
      return `From the hospital's list · ${hospitalName(origin.hospitalId)}`
    case 'manual':
      return 'Entered by hand'
    case 'recurring':
      return 'From a recurring booking'
  }
}
