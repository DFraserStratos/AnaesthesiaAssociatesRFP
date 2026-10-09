/**
 * Surgeon master data (catch-up Phase 17; FT-13.6, US-13.6.1, US-13.6.2,
 * US-13.4.1): surgeons, surgeons' rooms and surgeon groups. Office-only, one
 * audited `mutate()` commit each, plain-English refusals. No delete or
 * deactivate yet (Phase 42).
 *
 * The surgeon's HPI CPN (OQ-52) is required, stored trimmed and upper-cased,
 * shape-checked, and unique across every practitioner, surgeons and
 * anaesthetists alike. A room's surgeons are derived from `Surgeon.roomId`.
 */

import type { Surgeon, SurgeonGroup, SurgeonRoom } from '../domain/types'
import { hpiCpnHolder, isPlausibleEmail, isPlausibleHpiCpn, normaliseHpiCpn } from '../domain/surgeons'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

// ---------------------------------------------------------------------------
// Surgeons
// ---------------------------------------------------------------------------

export interface SurgeonFields {
  name: string
  specialty?: string
  roomId: string
  hpiId: string
  medicalRegistrationNumber?: string
}

function cleanSurgeonFields(
  state: AppState,
  fields: SurgeonFields,
  excludeSurgeonId?: string,
): Outcome<Omit<Surgeon, 'id'>> {
  const name = fields.name.trim()
  if (name === '') return refuse('nameRequired', 'A surgeon name is required.')
  if (state.masters.surgeonRooms[fields.roomId] === undefined) {
    return refuse('roomRequired', "Choose the surgeon's room.")
  }
  const hpiId = normaliseHpiCpn(fields.hpiId)
  if (hpiId === '') return refuse('hpiCpnRequired', 'An HPI CPN is required. It is the surgeon\'s unique number on the Health Provider Index.')
  if (!isPlausibleHpiCpn(hpiId)) {
    return refuse('invalidHpiCpn', 'That HPI CPN does not look right. It is two digits then four letters, for example 12ABCD.')
  }
  const holder = hpiCpnHolder(state.masters, hpiId, excludeSurgeonId !== undefined ? { surgeonId: excludeSurgeonId } : undefined)
  if (holder !== null) return refuse('duplicateHpiCpn', `That HPI CPN already belongs to ${holder.name}.`)
  const specialty = fields.specialty?.trim() ?? ''
  const registration = fields.medicalRegistrationNumber?.trim() ?? ''
  return ok({
    name,
    roomId: fields.roomId,
    hpiId,
    ...(specialty !== '' ? { specialty } : {}),
    ...(registration !== '' ? { medicalRegistrationNumber: registration } : {}),
  })
}

/** Add a surgeon. Audited `surgeon.create`. */
export function createSurgeon(api: AppStoreApi, actor: Actor, fields: SurgeonFields): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a surgeon.')
  const cleaned = cleanSurgeonFields(api.getState(), fields)
  if (!cleaned.ok) return cleaned
  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'surgeon')
    id = alloc.id
    const surgeon: Surgeon = { id, ...cleaned.value }
    metas.push({ entityType: 'surgeon', entityId: id, action: 'surgeon.create', after: { ...cleaned.value }, stampBookingId: null })
    return { masters: { ...s.masters, surgeons: { ...s.masters.surgeons, [id]: surgeon } }, counters: alloc.counters }
  })
  return ok({ id })
}

/** Edit a surgeon (same fields and rules; the id is immutable). Audited `surgeon.update` with the changed fields. */
export function editSurgeon(api: AppStoreApi, actor: Actor, surgeonId: string, fields: SurgeonFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a surgeon.')
  const state = api.getState()
  const existing = state.masters.surgeons[surgeonId]
  if (existing === undefined) return refuse('notFound', 'Surgeon not found.')
  const cleaned = cleanSurgeonFields(state, fields, surgeonId)
  if (!cleaned.ok) return cleaned
  const next: Surgeon = { id: surgeonId, ...cleaned.value }
  const keys = ['name', 'specialty', 'roomId', 'hpiId', 'medicalRegistrationNumber'] as const
  const changed = keys.filter((k) => (existing[k] ?? '') !== (next[k] ?? ''))
  if (changed.length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'surgeon',
      entityId: surgeonId,
      action: 'surgeon.update',
      before: Object.fromEntries(changed.map((k) => [k, existing[k] ?? ''])),
      after: Object.fromEntries(changed.map((k) => [k, next[k] ?? ''])),
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, surgeons: { ...s.masters.surgeons, [surgeonId]: next } } }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Surgeons' rooms
// ---------------------------------------------------------------------------

export interface SurgeonRoomFields {
  name: string
  contactEmail: string
  phone: string
}

function cleanRoomFields(fields: SurgeonRoomFields): Outcome<Omit<SurgeonRoom, 'id'>> {
  const name = fields.name.trim()
  if (name === '') return refuse('nameRequired', 'A room name is required.')
  const contactEmail = fields.contactEmail.trim()
  if (!isPlausibleEmail(contactEmail)) {
    return refuse('invalidEmail', 'That contact email does not look right. Use the form name@example.co.nz.')
  }
  return ok({ name, contactEmail, phone: fields.phone.trim() })
}

/** Add a surgeons' room. Audited `surgeonRoom.create`. */
export function createSurgeonRoom(api: AppStoreApi, actor: Actor, fields: SurgeonRoomFields): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', "Only the office can add a surgeons' room.")
  const cleaned = cleanRoomFields(fields)
  if (!cleaned.ok) return cleaned
  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'surgeonRoom')
    id = alloc.id
    metas.push({ entityType: 'surgeonRoom', entityId: id, action: 'surgeonRoom.create', after: { ...cleaned.value }, stampBookingId: null })
    return {
      masters: { ...s.masters, surgeonRooms: { ...s.masters.surgeonRooms, [id]: { id, ...cleaned.value } } },
      counters: alloc.counters,
    }
  })
  return ok({ id })
}

/** Edit a surgeons' room. Membership is changed from the surgeon, never here. Audited `surgeonRoom.update`. */
export function editSurgeonRoom(api: AppStoreApi, actor: Actor, roomId: string, fields: SurgeonRoomFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', "Only the office can edit a surgeons' room.")
  const existing = api.getState().masters.surgeonRooms[roomId]
  if (existing === undefined) return refuse('notFound', 'Room not found.')
  const cleaned = cleanRoomFields(fields)
  if (!cleaned.ok) return cleaned
  const next: SurgeonRoom = { id: roomId, ...cleaned.value }
  const keys = ['name', 'contactEmail', 'phone'] as const
  const changed = keys.filter((k) => existing[k] !== next[k])
  if (changed.length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'surgeonRoom',
      entityId: roomId,
      action: 'surgeonRoom.update',
      before: Object.fromEntries(changed.map((k) => [k, existing[k]])),
      after: Object.fromEntries(changed.map((k) => [k, next[k]])),
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, surgeonRooms: { ...s.masters.surgeonRooms, [roomId]: next } } }),
  )
  return ok(undefined)
}

// ---------------------------------------------------------------------------
// Surgeon groups
// ---------------------------------------------------------------------------

export interface SurgeonGroupFields {
  name: string
  description?: string
  memberSurgeonIds: readonly string[]
}

function cleanGroupFields(state: AppState, fields: SurgeonGroupFields): Outcome<Omit<SurgeonGroup, 'id'>> {
  const name = fields.name.trim()
  if (name === '') return refuse('nameRequired', 'A group name is required.')
  const members = [...new Set(fields.memberSurgeonIds)]
  const unknown = members.find((id) => state.masters.surgeons[id] === undefined)
  if (unknown !== undefined) return refuse('notFound', 'One of the chosen surgeons was not found.')
  const description = fields.description?.trim() ?? ''
  return ok({ name, memberSurgeonIds: members, ...(description !== '' ? { description } : {}) })
}

/** Add a surgeon group (members de-duplicated). Audited `surgeonGroup.create`. */
export function createSurgeonGroup(api: AppStoreApi, actor: Actor, fields: SurgeonGroupFields): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a surgeon group.')
  const cleaned = cleanGroupFields(api.getState(), fields)
  if (!cleaned.ok) return cleaned
  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'surgeonGroup')
    id = alloc.id
    metas.push({ entityType: 'surgeonGroup', entityId: id, action: 'surgeonGroup.create', after: { ...cleaned.value }, stampBookingId: null })
    return {
      masters: { ...s.masters, surgeonGroups: { ...s.masters.surgeonGroups, [id]: { id, ...cleaned.value } } },
      counters: alloc.counters,
    }
  })
  return ok({ id })
}

/** Edit a surgeon group. Audited `surgeonGroup.update`. */
export function editSurgeonGroup(api: AppStoreApi, actor: Actor, groupId: string, fields: SurgeonGroupFields): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a surgeon group.')
  const state = api.getState()
  const existing = state.masters.surgeonGroups[groupId]
  if (existing === undefined) return refuse('notFound', 'Group not found.')
  const cleaned = cleanGroupFields(state, fields)
  if (!cleaned.ok) return cleaned
  const next: SurgeonGroup = { id: groupId, ...cleaned.value }
  mutate(
    api,
    actor,
    {
      entityType: 'surgeonGroup',
      entityId: groupId,
      action: 'surgeonGroup.update',
      before: { name: existing.name, description: existing.description ?? '', memberSurgeonIds: existing.memberSurgeonIds },
      after: { name: next.name, description: next.description ?? '', memberSurgeonIds: next.memberSurgeonIds },
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, surgeonGroups: { ...s.masters.surgeonGroups, [groupId]: next } } }),
  )
  return ok(undefined)
}
