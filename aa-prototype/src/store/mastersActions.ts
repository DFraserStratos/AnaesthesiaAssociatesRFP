/**
 * Master-data invariants (7th review B14 + 3rd review #9): every hospital and
 * every direct-billing insurer ALWAYS holds a protected default Type 1
 * contract — so creating a hospital, or flipping an insurer to direct claims,
 * atomically creates that contract in the same commit. (Phase 07's
 * delete/end-date protection is the other half of the guarantee.)
 */

import type {
  Anaesthetist,
  Contract,
  GstPeriod,
  HospitalId,
  Hospital,
  ListKind,
  PermanentList,
  Session,
  SurgeonId,
} from '../domain/types'
import { LIST_KINDS } from '../domain/types'
import { isWallTime } from '../domain/slots'
import { closedHospitalMessage } from '../domain/seed'
import { anaesthetistCanvasDelta, withGenerated } from './slotActions'
import { hpiCpnHolder, isPlausibleEmail, normaliseHpiCpn } from '../domain/surgeons'
import { pairingAcknowledgement } from '../domain/pairingPreferences'
import { allocateId, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'

function defaultType1(
  id: string,
  name: string,
  holderType: Contract['holderType'],
  holderId: string,
  effectiveFromISO: string,
): Contract {
  return {
    id,
    name,
    type: 1,
    holderType,
    holderId,
    scope: { kind: 'organisation' },
    permitsIndividualArrangement: false,
    isDefault: true,
    effectiveFromISO,
  }
}

export function createHospital(
  api: AppStoreApi,
  actor: Actor,
  name: string,
  contactEmail?: string,
): Outcome<{ hospital: Hospital; defaultContract: Contract }> {
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can add a hospital.')
  }
  const trimmed = name.trim()
  if (trimmed === '') return refuse('nameRequired', 'A hospital name is required.')
  const state = api.getState()
  if (Object.values(state.masters.hospitals).some((h) => h.name === trimmed)) {
    return refuse('duplicateName', 'A hospital with that name already exists.')
  }
  const email = contactEmail?.trim() ?? ''
  if (email !== '' && !isPlausibleEmail(email)) {
    return refuse('invalidEmail', 'That contact email does not look right. Use the form name@example.co.nz.')
  }

  let hospital: Hospital | undefined
  let contract: Contract | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const hospitalAlloc = allocateId(s.counters, 'hospital')
    const contractAlloc = allocateId(hospitalAlloc.counters, 'contract')
    hospital = { id: hospitalAlloc.id, name: trimmed, ...(email !== '' ? { contactEmail: email } : {}) }
    // Effective from the seed epoch, not today: the protected default is the
    // guaranteed billing fallback and must cover PAST service dates too — a
    // list dated before the hospital's creation still bills (8th review).
    contract = defaultType1(
      contractAlloc.id,
      `${trimmed} standard units (default Type 1)`,
      'hospital',
      hospitalAlloc.id,
      '2020-01-01',
    )
    metas.push(
      { entityType: 'hospital', entityId: hospital.id, action: 'hospital.create', after: { name: trimmed, ...(email !== '' ? { contactEmail: email } : {}) } },
      {
        entityType: 'contract',
        entityId: contract.id,
        action: 'contract.create',
        after: { holderType: 'hospital', holderId: hospital.id, isDefault: true },
      },
    )
    return {
      masters: {
        ...s.masters,
        hospitals: { ...s.masters.hospitals, [hospital.id]: hospital },
        contracts: { ...s.masters.contracts, [contract.id]: contract },
      },
      counters: contractAlloc.counters,
    }
  })

  if (hospital === undefined || contract === undefined) {
    return refuse('createFailed', 'The hospital could not be created.')
  }
  return ok({ hospital, defaultContract: contract })
}

/** Editable hospital fields (catch-up Phase 17). Blank `contactEmail` clears it. */
export interface HospitalPatch {
  name?: string
  contactEmail?: string
}

/**
 * Edit a hospital's name or contact email (US-13.4.1: "hospitals, each with a
 * contact email for booking updates"). Office-only; refuses a blank or
 * duplicate name and an implausible email. Audited `hospital.update`.
 */
export function editHospital(api: AppStoreApi, actor: Actor, hospitalId: HospitalId, patch: HospitalPatch): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a hospital.')
  const state = api.getState()
  const existing = state.masters.hospitals[hospitalId]
  if (existing === undefined) return refuse('notFound', 'Hospital not found.')
  const next: Hospital = { ...existing }
  const clean: HospitalPatch = {}
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (name === '') return refuse('nameRequired', 'A hospital name is required.')
    if (Object.values(state.masters.hospitals).some((h) => h.id !== hospitalId && h.name === name)) {
      return refuse('duplicateName', 'A hospital with that name already exists.')
    }
    if (name !== existing.name) {
      next.name = name
      clean.name = name
    }
  }
  if (patch.contactEmail !== undefined) {
    const email = patch.contactEmail.trim()
    if (email !== '' && !isPlausibleEmail(email)) {
      return refuse('invalidEmail', 'That contact email does not look right. Use the form name@example.co.nz.')
    }
    if (email !== (existing.contactEmail ?? '')) {
      if (email === '') delete next.contactEmail
      else next.contactEmail = email
      clean.contactEmail = email
    }
  }
  // Only the fields that changed are audited; a save that changes nothing writes nothing.
  if (Object.keys(clean).length === 0) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'hospital',
      entityId: hospitalId,
      action: 'hospital.update',
      before: Object.fromEntries(Object.keys(clean).map((k) => [k, existing[k as keyof Hospital] ?? ''])),
      after: clean,
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, hospitals: { ...s.masters.hospitals, [hospitalId]: next } } }),
  )
  return ok(undefined)
}

export function setInsurerDirectClaims(
  api: AppStoreApi,
  actor: Actor,
  insurerId: string,
  acceptsDirectClaims: boolean,
): Outcome<{ createdDefaultContract: Contract | null }> {
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can change insurer settings.')
  }
  const state = api.getState()
  const insurer = state.masters.insurers[insurerId]
  if (insurer === undefined) return refuse('notFound', 'Insurer not found.')
  if (insurer.acceptsDirectClaims === acceptsDirectClaims) {
    return ok({ createdDefaultContract: null })
  }

  const hasDefault = Object.values(state.masters.contracts).some(
    (c) => c.isDefault && c.holderType === 'insurer' && c.holderId === insurerId,
  )
  const needsDefault = acceptsDirectClaims && !hasDefault

  let contract: Contract | null = null
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    metas.push({
      entityType: 'insurer',
      entityId: insurerId,
      action: 'insurer.update',
      before: { acceptsDirectClaims: insurer.acceptsDirectClaims },
      after: { acceptsDirectClaims },
    })
    let counters = s.counters
    let contracts = s.masters.contracts
    if (needsDefault) {
      const alloc = allocateId(counters, 'contract')
      counters = alloc.counters
      contract = defaultType1(
        alloc.id,
        `${insurer.name} standard units (default Type 1)`,
        'insurer',
        insurerId,
        s.clock.todayISO,
      )
      contracts = { ...contracts, [alloc.id]: contract }
      metas.push({
        entityType: 'contract',
        entityId: alloc.id,
        action: 'contract.create',
        after: { holderType: 'insurer', holderId: insurerId, isDefault: true },
      })
    }
    return {
      masters: {
        ...s.masters,
        insurers: { ...s.masters.insurers, [insurerId]: { ...insurer, acceptsDirectClaims } },
        contracts,
      },
      counters,
    }
  })

  return ok({ createdDefaultContract: contract })
}

// ---------------------------------------------------------------------------
// Anaesthetist master (edit + add-with-canvas-forward)
// ---------------------------------------------------------------------------

/** Editable Anaesthetist fields (registration number is the immutable id). */
export interface AnaesthetistPatch {
  unitValue?: number
  phone?: string
  email?: string
  gstPeriod?: GstPeriod
  active?: boolean
  /** The HPI CPN, optional on an anaesthetist; a typed one is stored normalised and must be unique across practitioners (Phase 17). */
  hpiId?: string
  /** The start date (catch-up Phase 28, US-01.1.3): moving it adds or removes Slots from today on. */
  startDateISO?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Refuse an HPI CPN another practitioner already holds (catch-up Phase 17,
 * OQ-52): the identifier is unique across surgeons and anaesthetists
 * whichever record is saved first. Blank never clashes.
 */
function hpiCpnClash(state: ReturnType<AppStoreApi['getState']>, hpiId: string, anaesthetistId?: string): Outcome<never> | null {
  const holder = hpiCpnHolder(state.masters, hpiId, anaesthetistId !== undefined ? { anaesthetistId } : undefined)
  return holder === null ? null : refuse('duplicateHpiCpn', `That HPI CPN already belongs to ${holder.name}.`)
}

/**
 * Edit an anaesthetist's contact / unit value / GST period / active flag /
 * start date. Office-only; audited `anaesthetist.update` (before to after).
 * Changing the unit value re-prices every Type 1 / % Type 2 fee that reads it.
 *
 * Start date and active (catch-up Phase 28; US-01.1.3 "Once created, the Slots
 * can be edited freely"; FT-01.1 "every active anaesthetist") add or remove
 * the anaesthetist's Slots from the demo clock's today on, in the same commit
 * (`canvas.generate` or `canvas.trim`); nothing before today is touched and no
 * List is ever deleted: a change that would remove a Slot holding a List is
 * refused (`listsBeforeStart`, `listsAhead`).
 */
export function editAnaesthetist(
  api: AppStoreApi,
  actor: Actor,
  registrationNumber: string,
  patch: AnaesthetistPatch,
): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit an anaesthetist.')
  const state = api.getState()
  const existing = state.masters.anaesthetists[registrationNumber]
  if (existing === undefined) return refuse('notFound', 'Anaesthetist not found.')
  if (patch.unitValue !== undefined && !(patch.unitValue > 0)) {
    return refuse('invalidUnitValue', 'The unit value must be greater than zero.')
  }
  if (patch.hpiId !== undefined) {
    patch = { ...patch, hpiId: normaliseHpiCpn(patch.hpiId) }
    const clash = hpiCpnClash(state, patch.hpiId ?? '', registrationNumber)
    if (clash !== null) return clash
  }
  if (patch.startDateISO !== undefined && !ISO_DATE.test(patch.startDateISO)) {
    return refuse('invalidStartDate', 'Choose a valid start date.')
  }

  const next: Anaesthetist = { ...existing, ...patch }
  const metas: MutationMeta[] = [
    {
      entityType: 'anaesthetist',
      entityId: registrationNumber,
      action: 'anaesthetist.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, existing[k as keyof Anaesthetist]])),
      after: patch,
      stampBookingId: null,
    },
  ]

  // The canvas follows a start-date or active change, from today on.
  const canvasChanged = next.startDateISO !== existing.startDateISO || next.active !== existing.active
  const todayISO = state.clock.todayISO
  const delta = canvasChanged ? anaesthetistCanvasDelta(state, next, todayISO) : null
  if (delta !== null && delta.listsInRemoved.length > 0) {
    const n = delta.listsInRemoved.length
    const who = `${existing.name} has ${n} ${n === 1 ? 'List' : 'Lists'}`
    if (!next.active) return refuse('listsAhead', `${who} from today. Reassign ${n === 1 ? 'it' : 'them'} first.`)
    return refuse('listsBeforeStart', `${who} before that date. Reassign ${n === 1 ? 'it' : 'them'} first.`)
  }
  if (delta !== null && delta.add.slots.length > 0) {
    metas.push({
      entityType: 'canvas',
      entityId: registrationNumber,
      action: 'canvas.generate',
      after: {
        slots: delta.add.slots.length,
        lists: delta.add.lists.length,
        fromISO: delta.add.slots[0]?.dateISO,
        toISO: delta.add.slots.at(-1)?.dateISO,
      },
      stampBookingId: null,
    })
  }
  if (delta !== null && delta.removeSlotIds.length > 0) {
    metas.push({
      entityType: 'canvas',
      entityId: registrationNumber,
      action: 'canvas.trim',
      after: { slots: delta.removeSlotIds.length, fromISO: todayISO },
      stampBookingId: null,
    })
  }

  mutate(api, actor, metas, (s) => {
    let schedule = s.schedule
    if (delta !== null) {
      schedule = withGenerated(schedule, delta.add).schedule
      if (delta.removeSlotIds.length > 0) {
        const slots = { ...schedule.slots }
        for (const id of delta.removeSlotIds) delete slots[id]
        schedule = { ...schedule, slots }
      }
    }
    return {
      masters: { ...s.masters, anaesthetists: { ...s.masters.anaesthetists, [registrationNumber]: next } },
      schedule,
    }
  })
  return ok(undefined)
}

/** Fields for a new anaesthetist (the caller supplies the registration number id). */
export interface NewAnaesthetistFields {
  registrationNumber: string
  name: string
  phone: string
  email: string
  unitValue: number
  gstPeriod: GstPeriod
  hpiId?: string
  /** Required (US-01.1.3): the anaesthetist's Slots are created from this date. */
  startDateISO: string
}

/**
 * Add an anaesthetist AND create their Slots (catch-up Phase 28; US-01.1.3:
 * "creates their Slots from their start date"): an AM and a PM Slot, all free,
 * for every horizon day from the later of the start date and the demo clock's
 * today, through the one generator (a new anaesthetist has no recurring
 * booking, so nothing is projected). A start date beyond the horizon end
 * creates none yet: the roll-forward creates them when the horizon reaches it.
 * Audits `anaesthetist.create` + one `canvas.generate` summary, one commit.
 */
export function addAnaesthetist(
  api: AppStoreApi,
  actor: Actor,
  fields: NewAnaesthetistFields,
): Outcome<{ registrationNumber: string; generatedSlots: number; generatedLists: number; fromISO: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add an anaesthetist.')
  const state = api.getState()
  const reg = fields.registrationNumber.trim()
  if (reg === '') return refuse('registrationRequired', 'A registration number is required.')
  if (fields.name.trim() === '') return refuse('nameRequired', 'A name is required.')
  if (state.masters.anaesthetists[reg] !== undefined) {
    return refuse('duplicateRegistration', 'That registration number is already in use.')
  }
  if (!(fields.unitValue > 0)) return refuse('invalidUnitValue', 'The unit value must be greater than zero.')
  const hpiId = normaliseHpiCpn(fields.hpiId ?? '')
  const clash = hpiCpnClash(state, hpiId)
  if (clash !== null) return clash
  if (!ISO_DATE.test(fields.startDateISO)) return refuse('invalidStartDate', 'Choose a valid start date.')

  const todayISO = state.clock.todayISO
  const fromISO = fields.startDateISO > todayISO ? fields.startDateISO : todayISO

  const anaesthetist: Anaesthetist = {
    registrationNumber: reg,
    name: fields.name.trim(),
    phone: fields.phone.trim(),
    email: fields.email.trim(),
    unitValue: fields.unitValue,
    gstPeriod: fields.gstPeriod,
    hpiId,
    startDateISO: fields.startDateISO,
    active: true,
  }
  const { add: generated, toISO } = anaesthetistCanvasDelta(state, anaesthetist, fromISO)

  const metas: MutationMeta[] = [
    {
      entityType: 'anaesthetist',
      entityId: reg,
      action: 'anaesthetist.create',
      after: { name: anaesthetist.name, unitValue: anaesthetist.unitValue },
    },
    {
      entityType: 'canvas',
      entityId: reg,
      action: 'canvas.generate',
      after: { slots: generated.slots.length, lists: generated.lists.length, fromISO, toISO },
    },
  ]
  mutate(api, actor, metas, (s) => ({
    masters: { ...s.masters, anaesthetists: { ...s.masters.anaesthetists, [reg]: anaesthetist } },
    schedule: withGenerated(s.schedule, generated).schedule,
  }))
  return ok({ registrationNumber: reg, generatedSlots: generated.slots.length, generatedLists: generated.lists.length, fromISO })
}

// ---------------------------------------------------------------------------
// Hospital holidays (add + live reconcile)
// ---------------------------------------------------------------------------

/**
 * Add a hospital-holiday master row AND reconcile it onto the already-generated
 * canvas: every booked List at that hospital on that date gains the same
 * `holiday`-kind `ListConflict` the generator would have stamped
 * (`canvas.ts` closed-hospital logic), so the Phase-06 amber conflict flag
 * appears live. Audits `holiday.create` + one `list.conflict` per flagged List
 * (the action name setAvailability already uses for a reconciled conflict),
 * batched in one commit. Future rolled days pick the holiday up at generation.
 */
export function addHospitalHoliday(
  api: AppStoreApi,
  actor: Actor,
  hospitalId: string,
  dateISO: string,
  name: string,
): Outcome<{ holidayId: string; flaggedListCount: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a hospital holiday.')
  const state = api.getState()
  if (state.masters.hospitals[hospitalId] === undefined) return refuse('notFound', 'Hospital not found.')
  const trimmedName = name.trim()
  if (trimmedName === '') return refuse('nameRequired', 'A holiday name is required.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return refuse('dateRequired', 'A valid date is required.')
  if (Object.values(state.masters.holidays).some((h) => h.hospitalId === hospitalId && h.dateISO === dateISO)) {
    return refuse('duplicateHoliday', 'That hospital already has a holiday recorded on that date.')
  }

  const message = closedHospitalMessage(trimmedName)
  const affected = Object.values(state.schedule.lists).filter(
    (l) =>
      l.dateISO === dateISO &&
      l.hospitalId === hospitalId &&
      !l.conflicts.some((c) => c.kind === 'holiday' && c.message === message),
  )

  const metas: MutationMeta[] = []
  let holidayId = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'holiday')
    holidayId = alloc.id
    const holiday = { id: alloc.id, hospitalId, dateISO, name: trimmedName }
    metas.push({
      entityType: 'holiday',
      entityId: alloc.id,
      action: 'holiday.create',
      after: { hospitalId, dateISO, name: trimmedName },
      stampBookingId: null,
    })
    const lists = { ...s.schedule.lists }
    for (const l of affected) {
      lists[l.id] = { ...l, conflicts: [...l.conflicts, { kind: 'holiday' as const, message }] }
      metas.push({
        entityType: 'list',
        entityId: l.id,
        action: 'list.conflict',
        after: { kind: 'holiday', message },
        stampBookingId: null,
      })
    }
    return {
      masters: { ...s.masters, holidays: { ...s.masters.holidays, [alloc.id]: holiday } },
      schedule: { ...s.schedule, lists },
      counters: alloc.counters,
    }
  })
  return ok({ holidayId, flaggedListCount: affected.length })
}

// ---------------------------------------------------------------------------
// Permanent Lists (weekly templates the canvas generates from)
// ---------------------------------------------------------------------------

/** Fields for a new Permanent List template (incl. the usual-surgeon column). */
export interface NewPermanentListFields {
  anaesthetistId: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  session: Session
  kind: ListKind
  hospitalId: HospitalId | null
  surgeonId: SurgeonId | null
  /** Optional template times, written as the Slot's own times when projected; blank follows the default session times. */
  startTime?: string
  endTime?: string
  notes?: string
}

/** Kind and optional template times, checked the same on add and edit (catch-up Phase 28). */
function templateRefusal(t: { kind?: ListKind; startTime?: string; endTime?: string }): Outcome<never> | null {
  if (t.kind !== undefined && !(LIST_KINDS as readonly string[]).includes(t.kind)) {
    return refuse('invalidKind', 'A recurring booking is a private, public or pre-op List.')
  }
  for (const v of [t.startTime, t.endTime]) {
    if (v !== undefined && v !== '' && !isWallTime(v)) return refuse('invalidTime', 'Times are HH:mm, for example 13:30.')
  }
  if (t.startTime !== undefined && t.endTime !== undefined && t.startTime !== '' && t.endTime !== '' && !(t.startTime < t.endTime)) {
    return refuse('invalidTimes', 'The start time must be before the end time.')
  }
  return null
}

/**
 * Add a Permanent List template. Master edit only — it does NOT retro-regenerate
 * the existing canvas (already-generated days keep their Lists); future rolled
 * days pick it up, consistent with the generator. Audited `permanentList.create`.
 */
export function addPermanentList(
  api: AppStoreApi,
  actor: Actor,
  fields: NewPermanentListFields,
): Outcome<{ id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a permanent list.')
  const state = api.getState()
  if (state.masters.anaesthetists[fields.anaesthetistId] === undefined) {
    return refuse('notFound', 'Anaesthetist not found.')
  }
  const invalid = templateRefusal(fields)
  if (invalid !== null) return invalid

  const metas: MutationMeta[] = []
  let id = ''
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'permanentList')
    id = alloc.id
    const template: PermanentList = {
      id: alloc.id,
      anaesthetistId: fields.anaesthetistId,
      dayOfWeek: fields.dayOfWeek,
      session: fields.session,
      kind: fields.kind,
      hospitalId: fields.hospitalId,
      surgeonId: fields.surgeonId,
      ...(fields.startTime !== undefined && fields.startTime !== '' ? { startTime: fields.startTime } : {}),
      ...(fields.endTime !== undefined && fields.endTime !== '' ? { endTime: fields.endTime } : {}),
      ...(fields.notes !== undefined && fields.notes.trim() !== '' ? { notes: fields.notes.trim() } : {}),
    }
    metas.push({
      entityType: 'permanentList',
      entityId: alloc.id,
      action: 'permanentList.create',
      after: { anaesthetistId: fields.anaesthetistId, dayOfWeek: fields.dayOfWeek, session: fields.session },
      stampBookingId: null,
    })
    // A not-preferred usual surgeon warns in the sheet and never blocks; going
    // ahead records the acknowledgement in the same commit (Phase 17).
    const ack = pairingAcknowledgement(s.officePrivate.pairingPreferences, fields.anaesthetistId, fields.surgeonId)
    if (ack !== null) {
      metas.push({
        entityType: 'permanentList',
        entityId: alloc.id,
        action: 'permanentList.pairingAcknowledged',
        after: ack,
        stampBookingId: null,
      })
    }
    return {
      masters: { ...s.masters, permanentLists: { ...s.masters.permanentLists, [alloc.id]: template } },
      counters: alloc.counters,
    }
  })
  return ok({ id })
}

/** Editable Permanent List fields (the template id is immutable). */
export type PermanentListPatch = Partial<Omit<PermanentList, 'id'>>

/** Edit a Permanent List template (incl. usual surgeon). Audited `permanentList.update`. */
export function editPermanentList(
  api: AppStoreApi,
  actor: Actor,
  id: string,
  patch: PermanentListPatch,
): Outcome {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a permanent list.')
  const state = api.getState()
  const existing = state.masters.permanentLists[id]
  if (existing === undefined) return refuse('notFound', 'Permanent list not found.')

  const next: PermanentList = { ...existing, ...patch }
  const invalid = templateRefusal(next)
  if (invalid !== null) return invalid
  // notes and template times cleared explicitly when blanked.
  if ('notes' in patch && (patch.notes === undefined || patch.notes.trim() === '')) delete next.notes
  if ('startTime' in patch && (patch.startTime === undefined || patch.startTime === '')) delete next.startTime
  if ('endTime' in patch && (patch.endTime === undefined || patch.endTime === '')) delete next.endTime
  const metas: MutationMeta[] = [
    {
      entityType: 'permanentList',
      entityId: id,
      action: 'permanentList.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, existing[k as keyof PermanentList]])),
      after: patch,
      stampBookingId: null,
    },
  ]
  // Only a changed pairing records the acknowledgement (a notes-only edit
  // never re-logs it). Phase 17; never a refusal.
  const pairingChanged = next.anaesthetistId !== existing.anaesthetistId || next.surgeonId !== existing.surgeonId
  const ack = pairingChanged ? pairingAcknowledgement(state.officePrivate.pairingPreferences, next.anaesthetistId, next.surgeonId) : null
  if (ack !== null) {
    metas.push({
      entityType: 'permanentList',
      entityId: id,
      action: 'permanentList.pairingAcknowledged',
      after: ack,
      stampBookingId: null,
    })
  }
  mutate(
    api,
    actor,
    metas,
    (s) => ({
      masters: { ...s.masters, permanentLists: { ...s.masters.permanentLists, [id]: next } },
    }),
  )
  return ok(undefined)
}
