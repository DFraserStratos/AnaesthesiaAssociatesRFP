/**
 * A surgeons' room's email and its practice manager and PA contacts (catch-up
 * Phase 17a; US-13.6.1, US-13.6.5, DM-60). Pure, no React, never imports
 * `src/shared`.
 *
 * The one place the office's emails resolve a room's address: Phase 35's
 * update email and Phase 40's NHI request call `roomEmailForSurgeon` and offer
 * `otherRoomsForSurgeon`; nothing else reads `SurgeonRoom.contactEmail` for
 * them (`roomContactsGuard.test.ts` keeps it so).
 *
 * PROVISIONAL (OQ-127 parts 1 and 5, owner decision D74, open): contacts are
 * held on the room and may be named for one surgeon of that room
 * (`forSurgeonId`, the only owner field); for a surgeon at more than one room
 * the **main room's** email is the To, the surgeon's other rooms returned so
 * the drafts can offer them. A contact is never the To. If AA answers "by
 * surgeon", only the owner field and `contactsForSurgeon` change; if "the
 * emails go to the PA" or another room, only `roomEmailForSurgeon` changes.
 */

import { mainRoomOf, roomsForSurgeon } from './surgeons'
import type { RoomContact, RoomContactRole, Surgeon, SurgeonId, SurgeonRoom, SurgeonRoomId } from './types'

type RoomMasters = {
  surgeons: Readonly<Record<string, Surgeon>>
  surgeonRooms: Readonly<Record<string, SurgeonRoom>>
}

/** The one label set for a contact's role. */
export const ROOM_CONTACT_ROLE_LABELS: Record<RoomContactRole, string> = {
  PRACTICE_MANAGER: 'Practice manager',
  PA: 'PA',
}

/** Roles in display order: practice manager first. */
export const ROOM_CONTACT_ROLES: readonly RoomContactRole[] = ['PRACTICE_MANAGER', 'PA']

/** A contact named for no one surgeon (the profile, the room sheet and the audit). */
export const WHOLE_ROOM_LABEL = 'Whole room'
/** A contact named for the surgeon whose profile shows it. */
export const FOR_THIS_SURGEON_LABEL = 'For this surgeon'

/** What every view says for a room with no email held. */
export const NO_ROOM_EMAIL = 'No email held'

/** The one provisional line (OQ-127, D74), shown once on a surgeon's profile. */
export const ROOM_CONTACTS_PROVISIONAL_NOTE = "Where contacts belong, and which room's apply, is to be confirmed with AA"

/** A room's contact email, trimmed, or `''` for no room or no email held. */
export function roomContactEmail(room: SurgeonRoom | undefined): string {
  return room?.contactEmail?.trim() ?? ''
}

/**
 * The address the office's emails use for a surgeon (Phase 35's update email,
 * Phase 40's NHI request): by default the main room's contact email; given a
 * `roomId` that is one of the surgeon's rooms, that room's. `''` for an unknown
 * surgeon, a missing room, a room the surgeon is not in, or no email held.
 * Never throws; a contact is never returned.
 */
export function roomEmailForSurgeon(masters: RoomMasters, surgeonId: SurgeonId, roomId?: SurgeonRoomId): string {
  const room = roomId === undefined ? mainRoomOf(masters, surgeonId) : roomsForSurgeon(masters, surgeonId).find((r) => r.id === roomId)
  return roomContactEmail(room)
}

/** The surgeon's rooms after the main one, in order, each with its email (`''` when none); `[]` for one room. */
export function otherRoomsForSurgeon(masters: RoomMasters, surgeonId: SurgeonId): { room: SurgeonRoom; email: string }[] {
  return roomsForSurgeon(masters, surgeonId)
    .slice(1)
    .map((room) => ({ room, email: roomContactEmail(room) }))
}

function byRoleThenName(a: RoomContact, b: RoomContact): number {
  return ROOM_CONTACT_ROLES.indexOf(a.role) - ROOM_CONTACT_ROLES.indexOf(b.role) || a.name.localeCompare(b.name)
}

/**
 * The contacts a surgeon's profile shows for one room: the room's whole-room
 * contacts, then those named for this surgeon, each group by role (practice
 * manager first) then name. Contacts named for another surgeon are left out.
 */
export function contactsForSurgeon(room: SurgeonRoom | undefined, surgeonId: SurgeonId): RoomContact[] {
  const contacts = room?.contacts ?? []
  const wholeRoom = contacts.filter((c) => c.forSurgeonId === undefined).sort(byRoleThenName)
  const named = contacts.filter((c) => c.forSurgeonId === surgeonId).sort(byRoleThenName)
  return [...wholeRoom, ...named]
}

/** Every contact of a room, whole-room ones first, each with the surgeon it is named for (if any). */
export function contactsForRoom(
  room: SurgeonRoom | undefined,
  surgeons: Readonly<Record<string, Surgeon>>,
): { contact: RoomContact; surgeon?: Surgeon }[] {
  const contacts = [...(room?.contacts ?? [])].sort(
    (a, b) => Number(a.forSurgeonId !== undefined) - Number(b.forSurgeonId !== undefined) || byRoleThenName(a, b),
  )
  return contacts.map((contact) => {
    const surgeon = contact.forSurgeonId !== undefined ? surgeons[contact.forSurgeonId] : undefined
    return surgeon !== undefined ? { contact, surgeon } : { contact }
  })
}
