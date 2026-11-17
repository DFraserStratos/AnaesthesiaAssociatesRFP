/**
 * Practice manager and PA contacts on a surgeons' room (catch-up Phase 17a;
 * US-13.6.5). Office only, one audited `mutate()` commit each, on the room
 * (`entityType` `surgeonRoom`). Held on the room and optionally named for one
 * surgeon of that room (OQ-127's default, D74, provisional; the rule lives in
 * `domain/roomContacts.ts`). A contact needs a name, a plausible email and a
 * role; no phone, and never a surgeon's own email.
 */

import type { RoomContact, RoomContactRole, SurgeonRoom } from '../domain/types'
import { isPlausibleEmail } from '../domain/surgeons'
import { ROOM_CONTACT_ROLE_LABELS, ROOM_CONTACT_ROLES, WHOLE_ROOM_LABEL } from '../domain/roomContacts'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

export interface RoomContactFields {
  name: string
  email: string
  role: RoomContactRole | ''
  /** A surgeon of this room, or absent (or '') for the whole room. */
  forSurgeonId?: string
}

function cleanContact(state: AppState, room: SurgeonRoom, fields: RoomContactFields, excludeId?: string): Outcome<Omit<RoomContact, 'id'>> {
  const name = fields.name.trim()
  if (name === '') return refuse('nameRequired', 'A contact name is required.')
  const email = fields.email.trim()
  if (!isPlausibleEmail(email)) return refuse('invalidEmail', 'That email does not look right. Use the form name@example.co.nz.')
  if (fields.role === '' || !ROOM_CONTACT_ROLES.includes(fields.role)) return refuse('roleRequired', 'Choose practice manager or PA.')
  const forSurgeonId = fields.forSurgeonId?.trim() ?? ''
  if (forSurgeonId !== '' && !(state.masters.surgeons[forSurgeonId]?.roomIds.includes(room.id) ?? false)) {
    return refuse('surgeonNotInRoom', `That surgeon is not at ${room.name}. Choose one of the room's surgeons, or the whole room.`)
  }
  const duplicate = (room.contacts ?? []).some(
    (c) => c.id !== excludeId && c.email.toLowerCase() === email.toLowerCase() && c.role === fields.role && (c.forSurgeonId ?? '') === forSurgeonId,
  )
  if (duplicate) return refuse('duplicateContact', 'That contact is already recorded on this room.')
  return ok({ name, email, role: fields.role, ...(forSurgeonId !== '' ? { forSurgeonId } : {}) })
}

/** A contact's audit values, the role and surgeon as words, never ids or `undefined`. */
function auditContact(state: AppState, c: Omit<RoomContact, 'id'>): Record<string, string> {
  const surgeon = c.forSurgeonId !== undefined ? state.masters.surgeons[c.forSurgeonId]?.name ?? c.forSurgeonId : WHOLE_ROOM_LABEL
  return { contact: c.name, email: c.email, role: ROOM_CONTACT_ROLE_LABELS[c.role], for: surgeon }
}

function withContacts(s: AppState, room: SurgeonRoom, contacts: RoomContact[]): Partial<AppState> {
  return { masters: { ...s.masters, surgeonRooms: { ...s.masters.surgeonRooms, [room.id]: { ...room, contacts } } } }
}

/** Add a practice manager or PA to a room. Audited `roomContact.add`. */
export function addRoomContact(api: AppStoreApi, actor: Actor, roomId: string, fields: RoomContactFields): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a room contact.')
  const state = api.getState()
  const room = state.masters.surgeonRooms[roomId]
  if (room === undefined) return refuse('notFound', 'Room not found.')
  const cleaned = cleanContact(state, room, fields)
  if (!cleaned.ok) return cleaned
  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'roomContact')
    id = alloc.id
    const current = s.masters.surgeonRooms[roomId] ?? room
    metas.push({ entityType: 'surgeonRoom', entityId: roomId, action: 'roomContact.add', after: auditContact(s, cleaned.value), stampBookingId: null })
    return { ...withContacts(s, current, [...(current.contacts ?? []), { id, ...cleaned.value }]), counters: alloc.counters }
  })
  return ok({ id })
}

/** Edit a room contact. Audited `roomContact.update` with the changed fields; no change writes nothing. */
export function editRoomContact(api: AppStoreApi, actor: Actor, roomId: string, contactId: string, fields: RoomContactFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a room contact.')
  const state = api.getState()
  const room = state.masters.surgeonRooms[roomId]
  const existing = room?.contacts?.find((c) => c.id === contactId)
  if (room === undefined || existing === undefined) return refuse('notFound', 'Contact not found.')
  const cleaned = cleanContact(state, room, fields, contactId)
  if (!cleaned.ok) return cleaned
  const next: RoomContact = { id: contactId, ...cleaned.value }
  const before = auditContact(state, existing)
  const after = auditContact(state, next)
  // Changed fields compared on the record (ids, not the names the audit prints).
  const changed = (['email', 'role', 'for'] as const).filter((k) =>
    k === 'for' ? (existing.forSurgeonId ?? '') !== (next.forSurgeonId ?? '') : existing[k] !== next[k],
  )
  if (existing.name === next.name && changed.length === 0) return ok(undefined)
  // The contact's name always shows, so History says whose details changed.
  const pick = (v: Record<string, string>) => ({ contact: v.contact!, ...Object.fromEntries(changed.map((k) => [k, v[k]!])) })
  mutate(
    api,
    actor,
    { entityType: 'surgeonRoom', entityId: roomId, action: 'roomContact.update', before: pick(before), after: pick(after), stampBookingId: null },
    (s) => {
      const current = s.masters.surgeonRooms[roomId] ?? room
      return withContacts(s, current, (current.contacts ?? []).map((c) => (c.id === contactId ? next : c)))
    },
  )
  return ok(undefined)
}

/** Remove a room contact. Audited `roomContact.remove`. */
export function removeRoomContact(api: AppStoreApi, actor: Actor, roomId: string, contactId: string): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can remove a room contact.')
  const state = api.getState()
  const room = state.masters.surgeonRooms[roomId]
  const existing = room?.contacts?.find((c) => c.id === contactId)
  if (room === undefined || existing === undefined) return refuse('notFound', 'Contact not found.')
  mutate(
    api,
    actor,
    { entityType: 'surgeonRoom', entityId: roomId, action: 'roomContact.remove', before: auditContact(state, existing), stampBookingId: null },
    (s) => {
      const current = s.masters.surgeonRooms[roomId] ?? room
      return withContacts(s, current, (current.contacts ?? []).filter((c) => c.id !== contactId))
    },
  )
  return ok(undefined)
}
