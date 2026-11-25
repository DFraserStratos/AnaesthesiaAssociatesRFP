/**
 * An anaesthetist moves a single Booking to a colleague (catch-up Phase 32a;
 * US-01.4.7, US-01.4.6, DM-42; OQ-85 answered, D61). Pure: no React, no store,
 * no shared, no clock reads. Inputs are domain-typed slices and `todayISO`,
 * never `AppState`.
 *
 * THE RULE (D61): the receiver is a colleague free in the Booking's day and
 * session, found from the free list or by typing a name. The move always
 * creates a new List in that session (the store does it through Phase 28's
 * `placeListOnSlot`); a Booking never goes into an existing List, so a
 * colleague whose session holds one is not offered. A colleague on leave or
 * unavailable is not offered until they set that session available
 * themselves, which is their acceptance.
 *
 * AVAILABILITY ONLY (US-01.4.5, US-01.4.7, OQ-113 answered, D44, D54): nothing
 * here takes, reads or returns a pairing preference or a priority tier, and
 * nothing imports `domain/pairingPreferences.ts`. Colleagues come in surname
 * order, never grouped, marked or ordered otherwise.
 *
 * ONE RULE EACH: ownership, state and date are Phase 32's `ownMoveRefusal`;
 * whether a session can take the work is Phase 32's `receiveRefusal` (open
 * sessions only, for every actor). This file maps their answers to a single Booking's words.
 */

import { ownMoveRefusal, receiveRefusal, type ListMoveInput, type MoveRefusal } from './listMoves'
import { matchesNameQuery, titledSurname } from './names'
import { slotIdFor } from './slots'
import { compareBySurname } from './surgeons'
import type { AnaesthetistId, AssignedList, Booking, Slot } from './types'
import { isActiveOn } from './anaesthetistStatus'

/** The slices a single-Booking move reads: Phase 32's, plus the Bookings. */
export interface BookingMoveInput extends ListMoveInput {
  bookings: Readonly<Record<string, Booking>>
}

/** Why a receiver cannot take the Booking. */
export type ReceiverBlock = 'noSlot' | 'notAvailable' | 'hasList'

/** One colleague as the move sheet shows them: who, whether they can take it, and one plain line. */
export interface BookingReceiver {
  anaesthetistId: AnaesthetistId
  name: string
  /** The session the new List goes into, when they can take it. */
  offer: { slotId: string } | null
  block?: ReceiverBlock
  line: string
}

export const RECEIVER_LINES = {
  offer: 'Free this session. A new List is created for them',
  notAvailable: 'Not available this session. They can set it available in their app, then you can move it.',
  hasList: 'Already has a List this session',
  noSlot: 'No session that day',
} as const satisfies Record<ReceiverBlock | 'offer', string>

/** ownMoveRefusal's List words, said of a Booking. */
const BOOKING_MESSAGES: Readonly<Record<string, string>> = {
  notFound: 'You can only move Bookings from your own Lists.',
  draftList: 'You can only move Bookings from your own Lists.',
  notOwnList: 'You can only move Bookings from your own Lists.',
  listSubmitted: 'This List has been submitted. Only the office can move its Bookings now.',
  listAuthorised: 'This List is authorised and locked. Only the office can move its Bookings now.',
  pastDate: "This List's day has passed. Ask the office to move it.",
}

/**
 * Why this anaesthetist may not move this Booking herself, or null. Only a
 * non-cancelled Booking on her own ACTIVE List dated today or later. A
 * Booking on a Draft List reads `notOwnList` (the anaesthetist never sees the
 * words "Draft List").
 */
export function bookingMoveRefusal(
  input: Pick<BookingMoveInput, 'lists' | 'bookings'>,
  bookingId: string,
  actorAnaesthetistId: AnaesthetistId | undefined,
  todayISO: string,
): MoveRefusal | null {
  const booking = input.bookings[bookingId]
  if (booking === undefined) return { code: 'notFound', message: 'Booking not found.' }
  if (booking.cancellation !== undefined) return { code: 'cancelled', message: 'This Booking is cancelled.' }
  const listRefusal = ownMoveRefusal(input, booking.listId, actorAnaesthetistId, todayISO)
  if (listRefusal === null) return null
  const code = listRefusal.code === 'notFound' || listRefusal.code === 'draftList' ? 'notOwnList' : listRefusal.code
  return { code, message: BOOKING_MESSAGES[listRefusal.code] ?? listRefusal.message }
}

/** The Booking's List and that List's session, or undefined (a Draft List has no session). */
function sourceOf(input: BookingMoveInput, bookingId: string): { list: AssignedList; from: Slot } | undefined {
  const booking = input.bookings[bookingId]
  if (booking === undefined) return undefined
  const list = input.lists[booking.listId]
  if (list === undefined || list.state === 'DRAFT') return undefined
  const from = input.slots[list.slotId]
  return from === undefined ? undefined : { list, from }
}

function receiverRow(
  input: BookingMoveInput,
  source: { list: AssignedList; from: Slot },
  anaesthetistId: string,
  name: string,
  occupied?: ReadonlySet<string>,
): BookingReceiver {
  const slotId = slotIdFor(anaesthetistId, source.list.dateISO, source.list.session)
  const refusal = receiveRefusal(input, source.from, slotId, { ...(occupied !== undefined ? { occupied } : {}) })
  if (refusal === null) return { anaesthetistId, name, offer: { slotId }, line: RECEIVER_LINES.offer }
  if (refusal.code === 'notFound') return { anaesthetistId, name, offer: null, block: 'noSlot', line: RECEIVER_LINES.noSlot }
  if (refusal.code === 'slotOccupied') return { anaesthetistId, name, offer: null, block: 'hasList', line: RECEIVER_LINES.hasList }
  return { anaesthetistId, name, offer: null, block: 'notAvailable', line: RECEIVER_LINES.notAvailable }
}

/**
 * Every active colleague (never the mover) whose name matches `query`, in
 * surname order, each with an offer (free and empty that session) or a block.
 * An empty query matches everyone. Order is by name alone (OQ-113).
 */
export function bookingMoveReceivers(input: BookingMoveInput, bookingId: string, moverId: AnaesthetistId, query: string): BookingReceiver[] {
  const source = sourceOf(input, bookingId)
  if (source === undefined) return []
  // Which sessions hold a List, worked out once for every colleague (as Phase 32's pushTargets does).
  const occupied = new Set<string>(input.occupied ?? [])
  if (input.occupied === undefined) for (const list of Object.values(input.lists)) if (list.slotId !== undefined) occupied.add(list.slotId)
  const out: BookingReceiver[] = []
  for (const colleague of Object.values(input.anaesthetists)) {
    if (colleague.registrationNumber === moverId || !isActiveOn(colleague, source.list.dateISO)) continue
    if (!matchesNameQuery(colleague.name, query)) continue
    out.push(receiverRow(input, source, colleague.registrationNumber, colleague.name, occupied))
  }
  return out.sort(compareBySurname)
}

/** The colleagues free and empty that session, in surname order: what the sheet shows before anything is typed. */
export function freeColleagues(input: BookingMoveInput, bookingId: string, moverId: AnaesthetistId): BookingReceiver[] {
  return bookingMoveReceivers(input, bookingId, moverId, '').filter((r) => r.offer !== null)
}

export type BookingPlacement =
  | { ok: true; slotId: string }
  | { ok: false; code: ReceiverBlock | 'notFound'; message: string }

/**
 * Where the Booking would land with this receiver: the one placement rule the
 * store action calls. An offer is the receiver's free, empty session; anything
 * else is refused with a plain sentence.
 */
export function bookingPlacement(input: BookingMoveInput, bookingId: string, toAnaesthetistId: AnaesthetistId): BookingPlacement {
  const source = sourceOf(input, bookingId)
  const receiver = input.anaesthetists[toAnaesthetistId]
  if (source === undefined || receiver === undefined || !isActiveOn(receiver, source.list.dateISO) || toAnaesthetistId === source.list.anaesthetistId) {
    return { ok: false, code: 'notFound', message: 'Choose a colleague to move it to.' }
  }
  const row = receiverRow(input, source, toAnaesthetistId, receiver.name)
  if (row.offer !== null) return { ok: true, slotId: row.offer.slotId }
  const who = titledSurname(receiver.name)
  if (row.block === 'hasList') return { ok: false, code: 'hasList', message: `${who} already has a List this session.` }
  if (row.block === 'noSlot') return { ok: false, code: 'noSlot', message: source.from.session === 'OOH' ? `${who} has no out-of-hours session open that day.` : `${who} has no session that day.` }
  return { ok: false, code: 'notAvailable', message: `${who} is not available this session. They need to set it available first.` }
}
