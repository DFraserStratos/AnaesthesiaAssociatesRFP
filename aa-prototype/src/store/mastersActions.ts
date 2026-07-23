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
  ListStatusKey,
  PermanentList,
  Session,
  SurgeonId,
} from '../domain/types'
import { enumerateDatesISO, horizonFor } from '../domain/clock'
import { generateListsForDates, SEED, type CanvasMasters } from '../domain/seed'
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

  let hospital: Hospital | undefined
  let contract: Contract | undefined
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const hospitalAlloc = allocateId(s.counters, 'hospital')
    const contractAlloc = allocateId(hospitalAlloc.counters, 'contract')
    hospital = { id: hospitalAlloc.id, name: trimmed }
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
      { entityType: 'hospital', entityId: hospital.id, action: 'hospital.create', after: { name: trimmed } },
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
}

/**
 * Edit an anaesthetist's contact / unit value / GST period / active flag.
 * Office-only; audited `anaesthetist.update` (before to after). Changing the
 * unit value re-prices every Type 1 / % Type 2 fee that reads it (the fee path
 * takes the live `unitValue`), demonstrated in the master-data screen.
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

  const next: Anaesthetist = { ...existing, ...patch }
  mutate(
    api,
    actor,
    {
      entityType: 'anaesthetist',
      entityId: registrationNumber,
      action: 'anaesthetist.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, existing[k as keyof Anaesthetist]])),
      after: patch,
      stampCardId: null,
    },
    (s) => ({
      masters: {
        ...s.masters,
        anaesthetists: { ...s.masters.anaesthetists, [registrationNumber]: next },
      },
    }),
  )
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
}

/**
 * Add an anaesthetist AND extend the canvas forward for them (D1: the canvas
 * grows, 2 Lists per anaesthetist per day). A new anaesthetist has no Permanent
 * List, so their forward rows are slot-RNG filled — that is the point: the
 * generator is order-independent, so generating just their slots over
 * `today..horizon.end` reproduces exactly what a fresh full-horizon seed at 85
 * anaesthetists would have produced (Phase 02's slot-hash decision). Audits
 * `anaesthetist.create` + one `canvas.generate` summary, one commit.
 */
export function addAnaesthetist(
  api: AppStoreApi,
  actor: Actor,
  fields: NewAnaesthetistFields,
): Outcome<{ registrationNumber: string; generatedLists: number }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office can add an anaesthetist.')
  const state = api.getState()
  const reg = fields.registrationNumber.trim()
  if (reg === '') return refuse('registrationRequired', 'A registration number is required.')
  if (fields.name.trim() === '') return refuse('nameRequired', 'A name is required.')
  if (state.masters.anaesthetists[reg] !== undefined) {
    return refuse('duplicateRegistration', 'That registration number is already in use.')
  }
  if (!(fields.unitValue > 0)) return refuse('invalidUnitValue', 'The unit value must be greater than zero.')

  const todayISO = state.clock.todayISO
  const horizon = horizonFor(todayISO)
  const dates = enumerateDatesISO(todayISO, horizon.endISO)
  const fromISO = dates[0] ?? todayISO
  const toISO = dates.at(-1) ?? horizon.endISO

  const anaesthetist: Anaesthetist = {
    registrationNumber: reg,
    name: fields.name.trim(),
    phone: fields.phone.trim(),
    email: fields.email.trim(),
    unitValue: fields.unitValue,
    gstPeriod: fields.gstPeriod,
    hpiId: fields.hpiId?.trim() ?? '',
    active: true,
  }

  const canvasMasters: CanvasMasters = {
    seed: SEED,
    anaesthetistIds: [reg],
    permanentLists: Object.values(state.masters.permanentLists),
    availability: Object.values(state.masters.availability),
    holidays: Object.values(state.masters.holidays),
  }
  const generated = generateListsForDates(canvasMasters, dates)

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
      after: { lists: generated.length, fromISO, toISO },
    },
  ]
  mutate(api, actor, metas, (s) => {
    const lists = { ...s.schedule.lists }
    for (const list of generated) if (lists[list.id] === undefined) lists[list.id] = list
    return {
      masters: { ...s.masters, anaesthetists: { ...s.masters.anaesthetists, [reg]: anaesthetist } },
      schedule: { ...s.schedule, lists },
    }
  })
  return ok({ registrationNumber: reg, generatedLists: generated.length })
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

  const message = `${trimmedName}: the hospital is closed on this date.`
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
      stampCardId: null,
    })
    const lists = { ...s.schedule.lists }
    for (const l of affected) {
      lists[l.id] = { ...l, conflicts: [...l.conflicts, { kind: 'holiday' as const, message }] }
      metas.push({
        entityType: 'list',
        entityId: l.id,
        action: 'list.conflict',
        after: { kind: 'holiday', message },
        stampCardId: null,
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
  statusKey: ListStatusKey
  hospitalId: HospitalId | null
  surgeonId: SurgeonId | null
  notes?: string
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
      statusKey: fields.statusKey,
      hospitalId: fields.hospitalId,
      surgeonId: fields.surgeonId,
      ...(fields.notes !== undefined && fields.notes.trim() !== '' ? { notes: fields.notes.trim() } : {}),
    }
    metas.push({
      entityType: 'permanentList',
      entityId: alloc.id,
      action: 'permanentList.create',
      after: { anaesthetistId: fields.anaesthetistId, dayOfWeek: fields.dayOfWeek, session: fields.session },
      stampCardId: null,
    })
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
  // notes cleared explicitly when blanked.
  if ('notes' in patch && (patch.notes === undefined || patch.notes.trim() === '')) delete next.notes
  mutate(
    api,
    actor,
    {
      entityType: 'permanentList',
      entityId: id,
      action: 'permanentList.update',
      before: Object.fromEntries(Object.keys(patch).map((k) => [k, existing[k as keyof PermanentList]])),
      after: patch,
      stampCardId: null,
    },
    (s) => ({
      masters: { ...s.masters, permanentLists: { ...s.masters.permanentLists, [id]: next } },
    }),
  )
  return ok(undefined)
}
