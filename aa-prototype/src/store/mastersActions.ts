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
  HospitalHoliday,
  List,
  ListKind,
  RecurringBooking,
  Session,
  Slot,
  SurgeonId,
} from '../domain/types'
import { LIST_KINDS } from '../domain/types'
import { isWallTime } from '../domain/slots'
import { seriesPaintedCount } from '../domain/seed'
import { anaesthetistCanvasDelta, applyGenerated, clashDraftsInto, pairingRefusal, placeListOnSlot } from './slotActions'
import { RECURRING_BOOKING_CHANGED } from '../domain/draftLists'
import { previewApplyAllRecurringBookings, previewRecurringBookingChange, previewRetireRecurringBooking } from './selectors'
import { holidayCause } from '../domain/conflicts'
import { normaliseClash } from '../domain/draftLists'
import { emptyPlan, firstAffectedDate, type PlanKept, type PlanSkipped, type ProjectedFields, type ProjectionPlan } from '../domain/recurringBookingProjection'
import { hpiCpnHolder, isPlausibleEmail, normaliseHpiCpn } from '../domain/surgeons'
import { pairingAcknowledgement } from '../domain/pairingPreferences'
import { allocateId, clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'

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
    hospital = { id: hospitalAlloc.id, name: trimmed, locationType: 'hospital', ...(email !== '' ? { contactEmail: email } : {}) }
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
        ...(seriesPaintedCount(delta.add) > 0 ? { seriesSessions: seriesPaintedCount(delta.add) } : {}),
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
    let counters = s.counters
    if (delta !== null) {
      // An earlier start date or a reactivation generates sessions; recurring clashes on them become Draft Lists (catch-up Phase 31).
      const applied = applyGenerated(s, delta.add, actor.who, metas)
      schedule = applied.schedule
      counters = applied.counters
      if (delta.removeSlotIds.length > 0) {
        const slots = { ...schedule.slots }
        for (const id of delta.removeSlotIds) delete slots[id]
        schedule = { ...schedule, slots }
      }
    }
    return {
      masters: { ...s.masters, anaesthetists: { ...s.masters.anaesthetists, [registrationNumber]: next } },
      schedule,
      counters,
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
  mutate(api, actor, metas, (s) => {
    const applied = applyGenerated(s, generated, actor.who, metas)
    return {
      masters: { ...s.masters, anaesthetists: { ...s.masters.anaesthetists, [reg]: anaesthetist } },
      schedule: applied.schedule,
      counters: applied.counters,
    }
  })
  return ok({ registrationNumber: reg, generatedSlots: generated.slots.length, generatedLists: generated.lists.length, fromISO })
}

// ---------------------------------------------------------------------------
// Hospital holidays (add + live reconcile)
// ---------------------------------------------------------------------------

/**
 * Add a hospital-holiday master row (US-01.5.1). Conflicts are not stamped
 * here: the one rule in `mutate()` flags every List at that hospital on that
 * date in the same commit (`list.conflict` per List), and `flaggedListCount`
 * comes from its result (catch-up Phase 30). Future rolled days pick the
 * holiday up the same way.
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
  if (!ISO_DATE.test(dateISO)) return refuse('dateRequired', 'A valid date is required.')
  if (Object.values(state.masters.holidays).some((h) => h.hospitalId === hospitalId && h.dateISO === dateISO)) {
    return refuse('duplicateHoliday', 'That hospital already has a holiday recorded on that date.')
  }

  const metas: MutationMeta[] = []
  let holidayId = ''
  const result = mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'holiday')
    holidayId = alloc.id
    const holiday: HospitalHoliday = { id: alloc.id, hospitalId, dateISO, name: trimmedName }
    metas.push({
      entityType: 'holiday',
      entityId: alloc.id,
      action: 'holiday.create',
      after: { hospitalId, dateISO, name: trimmedName },
      stampBookingId: null,
    })
    return {
      masters: { ...s.masters, holidays: { ...s.masters.holidays, [alloc.id]: holiday } },
      counters: alloc.counters,
    }
  })
  return ok({ holidayId, flaggedListCount: result.conflictsRaised.length })
}

/**
 * Edit a hospital holiday's date or name (US-01.5.1, FT-01.5; catch-up Phase
 * 30). The hospital is fixed: moving a closure to another hospital is delete
 * and add. Moving the date resolves the old date's flags and raises the new
 * date's; a rename only changes the wording (no conflict meta). Audited
 * `holiday.update` with before and after.
 */
export function editHospitalHoliday(
  api: AppStoreApi,
  actor: Actor,
  id: string,
  patch: { dateISO?: string; name?: string },
): Outcome<{ flagged: number; resolved: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can change a hospital holiday.')
  const state = api.getState()
  const existing = state.masters.holidays[id]
  if (existing === undefined) return refuse('notFound', 'Holiday not found.')
  const name = patch.name === undefined ? existing.name : patch.name.trim()
  if (name === '') return refuse('nameRequired', 'A holiday name is required.')
  const dateISO = patch.dateISO ?? existing.dateISO
  if (!ISO_DATE.test(dateISO)) return refuse('dateRequired', 'A valid date is required.')
  if (Object.values(state.masters.holidays).some((h) => h.id !== id && h.hospitalId === existing.hospitalId && h.dateISO === dateISO)) {
    return refuse('duplicateHoliday', 'That hospital already has a holiday recorded on that date.')
  }
  if (name === existing.name && dateISO === existing.dateISO) return ok({ flagged: 0, resolved: 0 })

  const next: HospitalHoliday = { ...existing, name, dateISO }
  const result = mutate(
    api,
    actor,
    {
      entityType: 'holiday',
      entityId: id,
      action: 'holiday.update',
      before: { hospitalId: existing.hospitalId, dateISO: existing.dateISO, name: existing.name },
      after: { hospitalId: existing.hospitalId, dateISO, name },
      stampBookingId: null,
    },
    (s) => ({ masters: { ...s.masters, holidays: { ...s.masters.holidays, [id]: next } } }),
  )
  return ok({ flagged: result.conflictsRaised.length, resolved: result.conflictsResolved.length })
}

/**
 * Delete a hospital holiday (US-01.5.1; catch-up Phase 30). The row goes (the
 * audit keeps it as `holiday.delete` with the full before) and the one rule
 * resolves every flag it caused, including any the office had cleared.
 */
export function deleteHospitalHoliday(api: AppStoreApi, actor: Actor, id: string): Outcome<{ resolved: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can delete a hospital holiday.')
  const state = api.getState()
  const existing = state.masters.holidays[id]
  if (existing === undefined) return refuse('notFound', 'Holiday not found.')
  const result = mutate(
    api,
    actor,
    { entityType: 'holiday', entityId: id, action: 'holiday.delete', before: { ...existing }, stampBookingId: null },
    (s) => {
      const holidays = { ...s.masters.holidays }
      delete holidays[id]
      return { masters: { ...s.masters, holidays } }
    },
  )
  return ok({ resolved: result.conflictsResolved.length })
}

/** Lists a holiday currently flags (live or cleared), for the delete confirmation's count. */
export function listsFlaggedByHoliday(state: Pick<AppState, 'schedule'>, holidayId: string): number {
  const cause = holidayCause(holidayId)
  return Object.values(state.schedule.lists).filter(
    (l) => l.conflicts.some((c) => c.cause === cause) || (l.conflictClears ?? []).some((c) => c.cause === cause),
  ).length
}

// ---------------------------------------------------------------------------
// Recurring bookings (the weekly patterns that create the canvas's Lists)
// ---------------------------------------------------------------------------

/** Fields for a new recurring booking (incl. the usual-surgeon column). */
export interface NewRecurringBookingFields {
  anaesthetistId: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  session: Session
  kind: ListKind
  /** Required, as on every List it projects (US-01.3.1; catch-up Phase 31). */
  hospitalId: HospitalId
  surgeonId: SurgeonId
  /** Optional session times, written as the Slot's own times when projected; blank follows the default session times. */
  startTime?: string
  endTime?: string
  notes?: string
  /** First date the arrangement runs (blank: from tomorrow's canvas onwards). */
  effectiveFromISO?: string
  /** Last date it runs (blank: ongoing). */
  effectiveToISO?: string
}

/** Kind and optional session times, checked the same on add and edit (catch-up Phase 28). */
function recurringBookingRefusal(t: { kind?: ListKind; startTime?: string; endTime?: string }): Outcome<never> | null {
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

/** What a recurring-booking add, edit, retire or the view-level apply did to the canvas. */
export interface RecurringBookingApplyResult {
  id?: string
  created: number
  updated: number
  removed: number
  /** Sessions already closed when the arrangement reached them: each became a Draft List (catch-up Phase 31, OQ-81 part 2). */
  skipped: PlanSkipped[]
  /** Empty recurring-clash Draft Lists brought in line with the change, or removed (soft) because no longer covered. */
  draftListsUpdated: number
  draftListsRemoved: number
  /** Lists in covered sessions left as they are, with why. */
  kept: PlanKept[]
  /** The first date the canvas changed (for "Show on day grid"). */
  firstAffectedDateISO?: string
}

/** Start and end dates, checked the same on add and edit. */
function rangeRefusal(r: { effectiveFromISO?: string; effectiveToISO?: string }, todayISO: string): Outcome<never> | null {
  for (const v of [r.effectiveFromISO, r.effectiveToISO]) {
    if (v !== undefined && !ISO_DATE.test(v)) return refuse('invalidDate', 'Dates are YYYY-MM-DD.')
  }
  if (r.effectiveFromISO !== undefined && r.effectiveToISO !== undefined && r.effectiveToISO < r.effectiveFromISO) {
    return refuse('invalidRange', 'The last date must be on or after the first date.')
  }
  if (r.effectiveToISO !== undefined && r.effectiveToISO < todayISO) {
    return refuse('endInPast', 'The last date cannot be before today.')
  }
  return null
}

/**
 * Apply a projection plan inside a mutate recipe (catch-up Phase 30): created
 * Lists go through 28's `placeListOnSlot` with their provenance and no
 * Bookings; updates rewrite only untouched projected Lists; removals delete only
 * empty projected ACTIVE Lists and leave the session empty and as it was.
 * Catch-up Phase 31: each skipped session (already closed) becomes a
 * recurring-clash Draft List through the one rule (OQ-81 part 2); an empty
 * clash Draft List follows an edit or is soft-removed when no longer covered.
 * Conflicts on the result come from the one rule in `mutate()`.
 */
function applyPlan(
  s: AppState,
  plan: ProjectionPlan,
  metas: MutationMeta[],
  actor: Actor,
  recurringBookings: Readonly<Record<string, RecurringBooking>> = s.masters.recurringBookings,
): { schedule: AppState['schedule']; counters: Record<string, number> } {
  let counters = s.counters
  const slots = { ...s.schedule.slots }
  const lists = { ...s.schedule.lists }
  const atISO = clockISO(s.clock)
  const withTimes = (slot: Slot, f: ProjectedFields): Slot => {
    const next = { ...slot }
    if (f.startTime !== undefined) next.startTime = f.startTime
    if (f.endTime !== undefined) next.endTime = f.endTime
    return next
  }
  for (const c of plan.create) {
    const slot = slots[c.slotId]!
    const placed = placeListOnSlot(counters, slot, c.fields)
    counters = placed.counters
    lists[placed.list.id] = { ...placed.list, recurringBookingId: c.recurringBookingId }
    slots[slot.id] = withTimes(slot, c.fields)
    metas.push({ ...placed.meta, after: { ...(placed.meta.after as object), source: 'recurringBooking', recurringBookingId: c.recurringBookingId } })
  }
  for (const u of plan.update) {
    const list = lists[u.listId]!
    const next: List = { ...list, kind: u.fields.kind, hospitalId: u.fields.hospitalId, surgeonId: u.fields.surgeonId }
    if (u.fields.notes === undefined) delete next.notes
    else next.notes = u.fields.notes
    lists[list.id] = next
    const slot = withTimes(slots[u.slotId]!, u.fields)
    if (u.resetTimes === true) {
      if (u.fields.startTime === undefined) delete slot.startTime
      if (u.fields.endTime === undefined) delete slot.endTime
    }
    slots[u.slotId] = slot
    metas.push({
      entityType: 'list',
      entityId: list.id,
      action: 'list.update',
      before: { kind: list.kind, hospitalId: list.hospitalId, surgeonId: list.surgeonId, notes: list.notes ?? null },
      after: { kind: next.kind, hospitalId: next.hospitalId, surgeonId: next.surgeonId, notes: next.notes ?? null, source: 'recurringBooking' },
      stampBookingId: null,
    })
  }
  for (const r of plan.remove) {
    const list = lists[r.listId]!
    delete lists[r.listId]
    // The emptied session drops the times the arrangement gave it, as a move's vacated session does.
    if (r.resetTimes === true && slots[r.slotId] !== undefined) {
      const slot = { ...slots[r.slotId]! }
      delete slot.startTime
      delete slot.endTime
      slots[r.slotId] = slot
    }
    metas.push({
      entityType: 'list',
      entityId: list.id,
      action: 'list.remove',
      before: { slotId: list.slotId ?? null, kind: list.kind, hospitalId: list.hospitalId, surgeonId: list.surgeonId, recurringBookingId: r.recurringBookingId },
      stampBookingId: null,
    })
  }
  // Catch-up Phase 31: the recurring clash (OQ-81 part 2), the same rule as generation.
  const clashes = plan.skipped
    .map((k) => normaliseClash(k, slots))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)
  const drafts = clashDraftsInto(lists, clashes, { recurringBookings, todayISO: s.clock.todayISO, nowISO: atISO, by: actor.who, counters })
  counters = drafts.counters
  metas.push(...drafts.metas)
  for (const u of plan.draftUpdate) {
    const list = lists[u.listId]!
    const next: List = { ...list, kind: u.fields.kind, hospitalId: u.fields.hospitalId, surgeonId: u.fields.surgeonId }
    if (u.fields.notes === undefined) delete next.notes
    else next.notes = u.fields.notes
    lists[list.id] = next
    metas.push({
      entityType: 'list',
      entityId: list.id,
      action: 'list.update',
      before: { kind: list.kind, hospitalId: list.hospitalId, surgeonId: list.surgeonId, notes: list.notes ?? null },
      after: { kind: next.kind, hospitalId: next.hospitalId, surgeonId: next.surgeonId, notes: next.notes ?? null, source: 'recurringBooking' },
      stampBookingId: null,
    })
  }
  for (const r of plan.draftRemove) {
    const list = lists[r.listId]!
    lists[list.id] = { ...list, removedAtISO: atISO, removedBy: actor.who, removeReason: RECURRING_BOOKING_CHANGED, removeCause: 'recurringBookingChanged' }
    metas.push({
      entityType: 'list',
      entityId: list.id,
      action: 'draftList.remove',
      before: { state: 'DRAFT', removedAtISO: null },
      after: { state: 'DRAFT', removedAtISO: atISO, removeReason: RECURRING_BOOKING_CHANGED, recurringBookingId: r.recurringBookingId },
      stampBookingId: null,
    })
  }
  return { schedule: { ...s.schedule, slots, lists }, counters }
}

function resultOf(plan: ProjectionPlan, id?: string): RecurringBookingApplyResult {
  const first = firstAffectedDate(plan)
  return {
    ...(id !== undefined ? { id } : {}),
    created: plan.create.length,
    updated: plan.update.length,
    removed: plan.remove.length,
    skipped: plan.skipped,
    draftListsUpdated: plan.draftUpdate.length,
    draftListsRemoved: plan.draftRemove.length,
    kept: plan.kept,
    ...(first !== undefined ? { firstAffectedDateISO: first } : {}),
  }
}

const planCounts = (plan: ProjectionPlan) => ({
  created: plan.create.length,
  updated: plan.update.length,
  removed: plan.remove.length,
  kept: plan.kept.length,
  skipped: plan.skipped.length,
  draftListsUpdated: plan.draftUpdate.length,
  draftListsRemoved: plan.draftRemove.length,
})

/**
 * Add a recurring booking and paint it over the existing canvas in one
 * commit (US-01.3.2; catch-up Phase 30): its Lists are created, empty, on
 * every session it covers from tomorrow to the far end of the horizon setting.
 * A session already closed is skipped (the anaesthetist's calendar is painted
 * first, OQ-81 part 1) and counted for Phase 31's Draft List. Audited
 * `recurringBooking.create` plus a `list.create` per List.
 */
export function addRecurringBooking(
  api: AppStoreApi,
  actor: Actor,
  fields: NewRecurringBookingFields,
): Outcome<RecurringBookingApplyResult & { id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add a recurring booking.')
  const state = api.getState()
  if (state.masters.anaesthetists[fields.anaesthetistId] === undefined) {
    return refuse('notFound', 'Anaesthetist not found.')
  }
  const invalid =
    pairingRefusal(fields, state.masters, 'pairingRequired') ?? recurringBookingRefusal(fields) ?? rangeRefusal(fields, state.clock.todayISO)
  if (invalid !== null) return invalid

  const metas: MutationMeta[] = []
  let id = ''
  let plan = emptyPlan()
  mutate(api, actor, metas, (s) => {
    const alloc = allocateId(s.counters, 'recurringBooking')
    id = alloc.id
    const recurringBooking: RecurringBooking = {
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
      ...(fields.effectiveFromISO !== undefined ? { effectiveFromISO: fields.effectiveFromISO } : {}),
      ...(fields.effectiveToISO !== undefined ? { effectiveToISO: fields.effectiveToISO } : {}),
    }
    plan = previewRecurringBookingChange(s, undefined, recurringBooking)
    metas.push({
      entityType: 'recurringBooking',
      entityId: alloc.id,
      action: 'recurringBooking.create',
      after: { anaesthetistId: fields.anaesthetistId, dayOfWeek: fields.dayOfWeek, session: fields.session, ...planCounts(plan) },
      stampBookingId: null,
    })
    // A not-preferred usual surgeon warns in the sheet and never blocks; going
    // ahead records the acknowledgement in the same commit (Phase 17).
    const ack = pairingAcknowledgement(s.officePrivate.pairingPreferences, fields.anaesthetistId, fields.surgeonId)
    if (ack !== null) {
      metas.push({
        entityType: 'recurringBooking',
        entityId: alloc.id,
        action: 'recurringBooking.pairingAcknowledged',
        after: ack,
        stampBookingId: null,
      })
    }
    const applied = applyPlan({ ...s, counters: alloc.counters }, plan, metas, actor, { ...s.masters.recurringBookings, [alloc.id]: recurringBooking })
    return {
      masters: { ...s.masters, recurringBookings: { ...s.masters.recurringBookings, [alloc.id]: recurringBooking } },
      schedule: applied.schedule,
      counters: applied.counters,
    }
  })
  return ok({ ...resultOf(plan, id), id })
}

/** Editable recurring-booking fields (the id is immutable; retire with `retireRecurringBooking`). */
export type RecurringBookingPatch = Partial<Omit<RecurringBooking, 'id' | 'retiredAtISO'>>

/**
 * Edit a recurring booking (incl. usual surgeon) and project the change over
 * the existing canvas in one commit (US-01.3.2; catch-up Phase 30; this
 * supersedes Phase 07's "edits apply to future generated days only"): from
 * tomorrow to the far end of the horizon, its empty projected ACTIVE Lists
 * follow the new fields, sessions it no longer covers lose them, and newly
 * covered open sessions gain one. Lists with Bookings, SUBMITTED or AUTHORISED
 * Lists and Lists the office edited are kept. Audited `recurringBooking.update`.
 */
export function editRecurringBooking(
  api: AppStoreApi,
  actor: Actor,
  id: string,
  patch: RecurringBookingPatch,
): Outcome<RecurringBookingApplyResult & { id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can edit a recurring booking.')
  const state = api.getState()
  const existing = state.masters.recurringBookings[id]
  if (existing === undefined) return refuse('notFound', 'Recurring booking not found.')
  if (existing.retiredAtISO !== undefined) return refuse('alreadyRetired', 'This recurring booking is retired.')

  const next: RecurringBooking = { ...existing, ...patch }
  // Notes, session times and dates cleared explicitly when blanked.
  for (const key of ['notes', 'startTime', 'endTime', 'effectiveFromISO', 'effectiveToISO'] as const) {
    if (key in patch && (patch[key] === undefined || String(patch[key]).trim() === '')) delete next[key]
  }
  if (next.notes !== undefined) next.notes = next.notes.trim()
  // The end-in-past check applies only to a date this edit sets: a row that has
  // already ended can still be edited (and an unchanged past end is no new claim).
  const endChanged = 'effectiveToISO' in patch && patch.effectiveToISO !== existing.effectiveToISO
  const invalid = pairingRefusal(next, state.masters, 'pairingRequired') ?? recurringBookingRefusal(next) ?? rangeRefusal(endChanged ? next : { ...next, effectiveToISO: undefined }, state.clock.todayISO) ?? (next.effectiveFromISO !== undefined && next.effectiveToISO !== undefined && next.effectiveToISO < next.effectiveFromISO ? refuse('invalidRange', 'The last date must be on or after the first date.') : null)
  if (invalid !== null) return invalid
  const metas: MutationMeta[] = []
  // Only a changed pairing records the acknowledgement (a notes-only edit
  // never re-logs it). Phase 17; never a refusal.
  const pairingChanged = next.anaesthetistId !== existing.anaesthetistId || next.surgeonId !== existing.surgeonId
  const ack = pairingChanged ? pairingAcknowledgement(state.officePrivate.pairingPreferences, next.anaesthetistId, next.surgeonId) : null
  let plan = emptyPlan()
  mutate(api, actor, metas, (s) => {
    plan = previewRecurringBookingChange(s, existing, next)
    metas.push({
      entityType: 'recurringBooking',
      entityId: id,
      action: 'recurringBooking.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, existing[k as keyof RecurringBooking]])),
      after: { ...patch, ...planCounts(plan) },
      stampBookingId: null,
    })
    if (ack !== null) {
      metas.push({ entityType: 'recurringBooking', entityId: id, action: 'recurringBooking.pairingAcknowledged', after: ack, stampBookingId: null })
    }
    const applied = applyPlan(s, plan, metas, actor, { ...s.masters.recurringBookings, [id]: next })
    return {
      masters: { ...s.masters, recurringBookings: { ...s.masters.recurringBookings, [id]: next } },
      schedule: applied.schedule,
      counters: applied.counters,
    }
  })
  return ok({ ...resultOf(plan, id), id })
}

/**
 * Retire a recurring booking (US-01.3.2 "can be retired"; catch-up Phase 30):
 * its last date becomes `lastDateISO` (default today; never before today) and
 * it never projects again. Its empty projected Lists after that date go; Lists
 * with Bookings stay. No hard delete: the row stays in the master, muted, with
 * its history. Audited `recurringBooking.retire`.
 */
export function retireRecurringBooking(
  api: AppStoreApi,
  actor: Actor,
  id: string,
  lastDateISO?: string,
): Outcome<RecurringBookingApplyResult & { id: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can retire a recurring booking.')
  const state = api.getState()
  const existing = state.masters.recurringBookings[id]
  if (existing === undefined) return refuse('notFound', 'Recurring booking not found.')
  if (existing.retiredAtISO !== undefined) return refuse('alreadyRetired', 'This recurring booking is already retired.')
  const lastDate = lastDateISO ?? state.clock.todayISO
  if (!ISO_DATE.test(lastDate)) return refuse('invalidDate', 'Choose a valid last date.')
  if (lastDate < state.clock.todayISO) return refuse('endInPast', 'The last date cannot be before today.')
  if (existing.effectiveFromISO !== undefined && lastDate < existing.effectiveFromISO) {
    return refuse('invalidRange', 'The last date must be on or after the first date it runs.')
  }
  const end = existing.effectiveToISO !== undefined && existing.effectiveToISO < lastDate ? existing.effectiveToISO : lastDate

  const metas: MutationMeta[] = []
  let plan = emptyPlan()
  mutate(api, actor, metas, (s) => {
    const next: RecurringBooking = { ...existing, effectiveToISO: end, retiredAtISO: clockISO(s.clock) }
    // Removals only: retiring never creates or rewrites a List.
    plan = previewRetireRecurringBooking(s, existing, lastDate)
    metas.push({
      entityType: 'recurringBooking',
      entityId: id,
      action: 'recurringBooking.retire',
      before: { effectiveToISO: existing.effectiveToISO ?? null },
      after: { effectiveToISO: end, ...planCounts(plan) },
      stampBookingId: null,
    })
    const applied = applyPlan(s, plan, metas, actor)
    return {
      masters: { ...s.masters, recurringBookings: { ...s.masters.recurringBookings, [id]: next } },
      schedule: applied.schedule,
      counters: applied.counters,
    }
  })
  return ok({ ...resultOf(plan, id), id })
}

/**
 * The view-level "Apply to canvas now" (US-01.3.2; catch-up Phase 30): every
 * running recurring booking re-painted onto sessions that have come free since
 * the last projection (leave cancelled, a List removed, an anaesthetist made
 * active), and its own untouched Lists brought back in line. It never removes
 * and never touches a kept List. A second press with nothing to do writes no
 * List meta (the summary entry still records the press). Audited
 * `recurringBooking.apply` with the counts.
 */
export function applyRecurringBookingsToCanvas(api: AppStoreApi, actor: Actor): Outcome<RecurringBookingApplyResult> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can apply recurring bookings to the canvas.')
  const metas: MutationMeta[] = []
  let plan = emptyPlan()
  mutate(api, actor, metas, (s) => {
    plan = previewApplyAllRecurringBookings(s)
    metas.push({
      entityType: 'recurringBooking',
      entityId: 'all',
      action: 'recurringBooking.apply',
      after: planCounts(plan),
      stampBookingId: null,
    })
    if (plan.create.length === 0 && plan.update.length === 0 && plan.skipped.length === 0 && plan.draftUpdate.length === 0) return {}
    const applied = applyPlan(s, plan, metas, actor)
    return { schedule: applied.schedule, counters: applied.counters }
  })
  return ok(resultOf(plan))
}
