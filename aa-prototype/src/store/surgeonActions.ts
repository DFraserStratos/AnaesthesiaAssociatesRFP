/**
 * Surgeon master data (catch-up Phase 17; FT-13.6, US-13.6.2, US-13.4.1):
 * surgeons and surgeon groups. Office-only, one audited `mutate()` commit
 * each, plain-English refusals. No delete or deactivate yet (Phase 42).
 *
 * Catch-up Phase 17b (D74, D76; OQ-143's default): the system keeps no
 * surgeons' rooms. A surgeon holds a practice name (plain text), one personal
 * contact and one or more office contacts, each cleaned (blank fields
 * dropped), a non-blank email shape-checked and named in the refusal, and an
 * all-blank office set dropped. The HPI CPN is optional unless
 * `surgeonHpiCpnRequired()` says otherwise (never, today): blank is held as
 * absent; a number held is shape-checked and unique across every
 * practitioner, surgeons and anaesthetists alike. The anaesthetist's HPI CPN
 * stays mandatory in `mastersActions.ts` (catch-up Phase 26).
 *
 * Catch-up Phase 18a (US-13.6.6): a surgeon holds one or more specialties from
 * AA's list, required here (not only in the form): a save with none, or with
 * an unknown one, is refused. The audit prints them by name.
 */

import type { Surgeon, SurgeonContact, SurgeonGroup } from '../domain/types'
import {
  HPI_CPN_INVALID,
  hpiCpnHolder,
  isPlausibleEmail,
  isPlausibleHpiCpn,
  normaliseHpiCpn,
  surgeonHpiCpnRequired,
} from '../domain/surgeons'
import { cleanContact, isBlankContact } from '../domain/surgeonContacts'
import { cleanSpecialtyIds, specialtyNames } from '../domain/specialties'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

// ---------------------------------------------------------------------------
// Surgeons
// ---------------------------------------------------------------------------

export interface SurgeonFields {
  name: string
  /** One or more, from AA's list; the first is shown first. */
  specialtyIds: string[]
  /** Plain text; blank holds none. */
  practiceName?: string
  /** The surgeon's own contact; any field blank. */
  personalContact?: SurgeonContact
  /** In order, the first with an email the office's default To; all-blank sets are dropped. */
  officeContacts?: readonly SurgeonContact[]
  /** Blank holds none (OQ-129, D76) unless `surgeonHpiCpnRequired()`. */
  hpiId?: string
  medicalRegistrationNumber?: string
}

/** The refusal for a contact's malformed email, naming the contact ("Personal contact", "Office contact 2"). */
function invalidContactEmail(label: string): Outcome<Omit<Surgeon, 'id'>> {
  return refuse('invalidEmail', `${label}: that email does not look right. Use the form name@example.co.nz.`)
}

function cleanSurgeonFields(
  state: AppState,
  fields: SurgeonFields,
  excludeSurgeonId?: string,
): Outcome<Omit<Surgeon, 'id'>> {
  const name = fields.name.trim()
  if (name === '') return refuse('nameRequired', 'A surgeon name is required.')
  const specialties = cleanSpecialtyIds(fields.specialtyIds, state.masters.specialties)
  if (!specialties.ok) return refuse(specialties.code, specialties.message)
  const personalContact = cleanContact(fields.personalContact)
  if (personalContact.email !== undefined && !isPlausibleEmail(personalContact.email)) {
    return invalidContactEmail('Personal contact')
  }
  const officeContacts: SurgeonContact[] = []
  const given = fields.officeContacts ?? []
  for (let i = 0; i < given.length; i += 1) {
    if (isBlankContact(given[i])) continue
    const contact = cleanContact(given[i])
    if (contact.email !== undefined && !isPlausibleEmail(contact.email)) return invalidContactEmail(`Office contact ${i + 1}`)
    officeContacts.push(contact)
  }
  const hpiId = normaliseHpiCpn(fields.hpiId ?? '')
  if (hpiId === '' && surgeonHpiCpnRequired()) {
    return refuse('hpiCpnRequired', "An HPI CPN is required. It is the surgeon's unique number on the Health Provider Index.")
  }
  if (hpiId !== '') {
    if (!isPlausibleHpiCpn(hpiId)) return refuse('invalidHpiCpn', HPI_CPN_INVALID)
    const holder = hpiCpnHolder(state.masters, hpiId, excludeSurgeonId !== undefined ? { surgeonId: excludeSurgeonId } : undefined)
    if (holder !== null) return refuse('duplicateHpiCpn', `That HPI CPN already belongs to ${holder.name}.`)
  }
  const practiceName = fields.practiceName?.trim() ?? ''
  const registration = fields.medicalRegistrationNumber?.trim() ?? ''
  return ok({
    name,
    specialtyIds: specialties.ids,
    ...(practiceName !== '' ? { practiceName } : {}),
    personalContact,
    officeContacts,
    ...(hpiId !== '' ? { hpiId } : {}),
    ...(registration !== '' ? { medicalRegistrationNumber: registration } : {}),
  })
}

/** A contact as the audit prints it: "name · email · phone", blanks left out; "None" when all are blank. */
export function contactAuditText(contact: SurgeonContact | undefined): string {
  const c = cleanContact(contact)
  const parts = [c.name, c.email, c.phone].filter((v): v is string => v !== undefined)
  return parts.length === 0 ? 'None' : parts.join(' · ')
}

/** The audited fields of a surgeon, in display order. */
const AUDITED = ['name', 'specialtyIds', 'practiceName', 'personalContact', 'officeContacts', 'hpiId', 'medicalRegistrationNumber'] as const
type AuditedKey = (typeof AUDITED)[number]

/**
 * One audited field as text the History shows: specialties by name, a contact
 * as "name · email · phone", office contacts one per line, a blank practice
 * or registration as '' and a blank HPI CPN as "None" (never `undefined`).
 */
function auditValue(key: AuditedKey, surgeon: Omit<Surgeon, 'id'>, state: Pick<AppState, 'masters'>): unknown {
  switch (key) {
    case 'specialtyIds':
      return specialtyNames(state.masters, surgeon.specialtyIds)
    case 'personalContact':
      return contactAuditText(surgeon.personalContact)
    case 'officeContacts':
      return surgeon.officeContacts.length === 0 ? 'None' : surgeon.officeContacts.map(contactAuditText)
    case 'hpiId':
      return surgeon.hpiId ?? 'None'
    default:
      return surgeon[key] ?? ''
  }
}

/** The audit key a field is recorded under (`specialties` for `specialtyIds`, as 18a left it). */
function auditKey(key: AuditedKey): string {
  return key === 'specialtyIds' ? 'specialties' : key
}

function auditRecord(keys: readonly AuditedKey[], surgeon: Omit<Surgeon, 'id'>, state: Pick<AppState, 'masters'>): Record<string, unknown> {
  return Object.fromEntries(keys.map((k) => [auditKey(k), auditValue(k, surgeon, state)]))
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
    const shown = AUDITED.filter((k) => k === 'hpiId' || k === 'personalContact' || k === 'officeContacts' || cleaned.value[k] !== undefined)
    metas.push({ entityType: 'surgeon', entityId: id, action: 'surgeon.create', after: auditRecord(shown, cleaned.value, s), stampBookingId: null })
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
  const changed = AUDITED.filter((k) => JSON.stringify(existing[k] ?? '') !== JSON.stringify(next[k] ?? ''))
  if (changed.length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'surgeon',
      entityId: surgeonId,
      action: 'surgeon.update',
      before: auditRecord(changed, existing, state),
      after: auditRecord(changed, next, state),
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, surgeons: { ...s.masters.surgeons, [surgeonId]: next } } }),
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
  // Only the fields that changed are audited (members compared as a set); no change writes nothing.
  const before: Record<string, unknown> = {}
  const after: Record<string, unknown> = {}
  if (next.name !== existing.name) {
    before.name = existing.name
    after.name = next.name
  }
  if ((next.description ?? '') !== (existing.description ?? '')) {
    before.description = existing.description ?? ''
    after.description = next.description ?? ''
  }
  const sameMembers =
    next.memberSurgeonIds.length === existing.memberSurgeonIds.length &&
    next.memberSurgeonIds.every((id) => existing.memberSurgeonIds.includes(id))
  if (!sameMembers) {
    before.memberSurgeonIds = existing.memberSurgeonIds
    after.memberSurgeonIds = next.memberSurgeonIds
  }
  if (Object.keys(after).length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'surgeonGroup',
      entityId: groupId,
      action: 'surgeonGroup.update',
      before,
      after,
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, surgeonGroups: { ...s.masters.surgeonGroups, [groupId]: next } } }),
  )
  return ok(undefined)
}
