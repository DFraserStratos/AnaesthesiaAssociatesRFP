/**
 * Sample warnings for the demo (catch-up Phase 15a): the bodies of the "Raise
 * sample warnings" and "Clear sample warnings" demo actions.
 *
 * One entry per warning rule. A sample stages its rule's condition on a seeded
 * Booking through an audited store action, acting as `DEMO_TRIGGER_ACTOR`, and
 * unstages it by restoring the pristine seed's values (the seed is built once
 * and deterministic, so unstage works after a reload too), dropping the staged
 * warnings' clearances so raising them again shows them open.
 *
 * Two rules are registered (catch-up Phase 19 added out-of-range base units),
 * so the pinned `multiWarning` Booking shows two warnings; each later phase
 * adds its sample here (21 a child
 * as the payer on the Booking, and insurer-will-pay with no insurer Contract;
 * 27 a prepaid procedure with no price on the anaesthetist's own Contract; 40
 * a paying patient with a balance).
 */

import { buildSeed, RVG_GROUP, SEED_WARNING_SAMPLE_BOOKINGS } from '../domain/seed'
import { baseUnitsFor, rvgGroupPickRefusal } from '../domain/billing/rvgGroups'
import type { Procedure } from '../domain/types'
import { WARNING_RULES, type WarningRuleId } from '../domain/warnings'
import type { AppState, AppStoreApi } from './appStore'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { editProcedure, editRefusal } from './lifecycle'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import { pickRvgGroup } from './rvgGroupActions'
import { bookingRequiresPrepayment, prePaymentInvoicesForBooking, proceduresForBooking, railContextForList, railMastersOf } from './selectors'
import { contractCandidatesFor, openPriceFallbackFor } from '../domain/billing/contractRail'
import { setProcedureContract } from './contractSelectionActions'

/** What the staging checks read: the schedule and masters, and the audit trail that says who last changed it. */
type SampleState = Pick<AppState, 'schedule' | 'audit' | 'masters'>

export interface WarningSample {
  ruleId: WarningRuleId
  /** The Procedure fields the sample stages, and so restores and audits on unstage. */
  fields: readonly (keyof Procedure)[]
  /**
   * True when this sample's condition is staged on the Booking: it differs from
   * the seed, holds the sample's values, and the demo actions made the last
   * change, so a real edit to the same values is never mistaken for a sample
   * (and never reverted by "Clear sample warnings").
   */
  isStaged(state: SampleState, bookingId: string): boolean
  /** True when the pristine seed already raises this sample's rule on the Booking (not a target). */
  seedRaises(bookingId: string): boolean
  /**
   * Why this sample cannot stage cleanly on the Booking, or null. Checked for
   * every sample before any stages, so a raise never half-stages.
   */
  stageRefusal?(state: SampleState, bookingId: string): string | null
  /** Stage the condition. The caller has checked the Booking is a seeded, editable target. */
  stage(api: AppStoreApi, actor: Actor, bookingId: string): Outcome
  /** The fields to restore from the seed, as a schedule patch, or undefined when nothing is staged. */
  restore(state: SampleState, bookingId: string): Pick<AppState['schedule'], 'procedures'> | undefined
  /** The audited entities the restore changes, for the unstage's audit metas. */
  restoredEntityIds(state: SampleState, bookingId: string): string[]
}

/** The last audit entry per entity id (one pass, cached per audit array). */
const lastAuditCache = new WeakMap<readonly AppState['audit'][number][], Map<string, AppState['audit'][number]>>()
function lastAuditByEntity(audit: AppState['audit']): Map<string, AppState['audit'][number]> {
  const cached = lastAuditCache.get(audit)
  if (cached !== undefined) return cached
  const out = new Map<string, AppState['audit'][number]>()
  for (const entry of audit) out.set(entry.entityId, entry)
  lastAuditCache.set(audit, out)
  return out
}

/** True when the demo actions made the last audited change to this entity. */
function lastChangedByDemo(state: SampleState, entityId: string): boolean {
  return lastAuditByEntity(state.audit).get(entityId)?.who === DEMO_TRIGGER_ACTOR.who
}

// ---------------------------------------------------------------------------
// The unpaid prepayment sample
// ---------------------------------------------------------------------------

/**
 * The prepayment sample (catch-up Phase 20 re-points 15a's): the office moves
 * the Booking's first Procedure (in `proceduresForBooking` order; no primary
 * flag until Phase 23) onto a prepaid Contract through the step rail's own
 * action: the List's first prepaid candidate (its anaesthetist's own price
 * list), else Patient › Prepaid's open-price fallback with the sample amount
 * typed. A prepaid Contract is what requires the prepayment (INTERIM until
 * Phase 27). Clear restores every field the Contract change can touch.
 */
const PREPAYMENT_FIELDS = [
  'governingContractId',
  'enteredPrice',
  'priceOverride',
  'railAnswers',
  'billsHolderInterim',
  'rvgGroupId',
  'baseUnitsSelected',
  'baseUnitsCaptured',
  'modifierClaims',
  'removedModifierIds',
] as const satisfies readonly (keyof Procedure)[]

/** The amount the sample types on Prepaid · Fixed price, ex GST. */
export const PREPAYMENT_SAMPLE_AMOUNT = 500

/** The prepaid Contract the sample stages for a Booking: the List's first prepaid candidate, else Patient › Prepaid's fallback. */
function prepaidSampleContract(state: Pick<AppState, 'masters' | 'schedule'>, bookingId: string): { contractId: string; enteredPrice?: number } | undefined {
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (list === undefined) return undefined
  const masters = railMastersOf(state)
  const own = contractCandidatesFor(masters, railContextForList(state, list)).find((c) => c.prepaid && c.billsTo === 'payer')
  if (own !== undefined) return { contractId: own.id }
  const fallback = openPriceFallbackFor(masters, { kind: 'patient', prepaid: true })
  return fallback !== undefined ? { contractId: fallback.id, enteredPrice: PREPAYMENT_SAMPLE_AMOUNT } : undefined
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function firstProcedure(state: Pick<AppState, 'schedule'>, bookingId: string): Procedure | undefined {
  return proceduresForBooking(state, bookingId)[0]
}

function seedProcedure(procedureId: string): Procedure | undefined {
  return buildSeed().schedule.procedures[procedureId]
}

const prepaymentSample: WarningSample = {
  ruleId: 'prepaymentUnpaid',
  fields: PREPAYMENT_FIELDS,
  isStaged(state, bookingId) {
    const p = firstProcedure(state, bookingId)
    const seed = p !== undefined ? seedProcedure(p.id) : undefined
    if (p === undefined || seed === undefined || p.governingContractId === seed.governingContractId) return false
    const contract = p.governingContractId !== undefined ? state.masters.contracts[p.governingContractId] : undefined
    return contract?.prepaid === true && lastChangedByDemo(state, p.id)
  },
  seedRaises(bookingId) {
    return bookingRequiresPrepayment(buildSeed(), bookingId)
  },
  stageRefusal(state, bookingId) {
    const p = firstProcedure(state, bookingId)
    const seed = p !== undefined ? seedProcedure(p.id) : undefined
    if (p === undefined || seed === undefined) return null
    // Never stage over someone's real Contract change: Clear would undo it.
    if (p.governingContractId !== seed.governingContractId) return "This Booking's Contract was changed: use Reset"
    return prepaidSampleContract(state, bookingId) === undefined ? 'No prepaid Contract fits this Booking' : null
  },
  stage(api, actor, bookingId) {
    const p = firstProcedure(api.getState(), bookingId)
    if (p === undefined) return refuse('noProcedure', 'Nothing to stage on this Booking')
    const pick = prepaidSampleContract(api.getState(), bookingId)
    if (pick === undefined) return refuse('noPrepaidContract', 'No prepaid Contract fits this Booking')
    return setProcedureContract(api, actor, p.id, pick.contractId, pick.enteredPrice !== undefined ? { enteredPrice: pick.enteredPrice } : {})
  },
  restore(state, bookingId) {
    if (!this.isStaged(state, bookingId)) return undefined
    const p = firstProcedure(state, bookingId)
    const seed = p !== undefined ? seedProcedure(p.id) : undefined
    if (p === undefined || seed === undefined) return undefined
    const restored: Procedure = { ...p }
    for (const f of PREPAYMENT_FIELDS) {
      if (seed[f] === undefined) delete restored[f]
      else (restored as unknown as Record<string, unknown>)[f] = seed[f]
    }
    return { procedures: { ...state.schedule.procedures, [p.id]: restored } }
  },
  restoredEntityIds(state, bookingId) {
    const p = firstProcedure(state, bookingId)
    return p !== undefined && this.isStaged(state, bookingId) ? [p.id] : []
  },
}

// ---------------------------------------------------------------------------
// The base units outside the RVG guide sample (catch-up Phase 19)
// ---------------------------------------------------------------------------

/** The fields the base-units sample stages on its Procedure. */
const BASE_UNITS_FIELDS = ['rvgGroupId', 'baseUnitsSelected', 'baseUnitsCaptured'] as const satisfies readonly (keyof Procedure)[]

/**
 * The Procedure the base-units sample stages on: the Booking's first Procedure
 * (in `proceduresForBooking` order) that carries an RVG code in the pristine
 * seed, else its first Procedure. A stable rule on the seed, never a hard-coded id.
 */
function baseUnitsTarget(bookingId: string): Procedure | undefined {
  const seedProcs = proceduresForBooking(buildSeed(), bookingId)
  return seedProcs.find((p) => p.rvgGroupId !== undefined) ?? seedProcs[0]
}

/**
 * What the sample records: base units of the larger of the row's range top
 * and its figure, plus 2 (from the seed's row, so an office edit to the row
 * never moves the sample), as the chosen value on a ranged row, else as a
 * typed value. With no RVG code on the target, the H4 row with 14 chosen.
 */
function baseUnitsSampleValues(target: Procedure): Pick<Procedure, 'rvgGroupId' | 'baseUnitsSelected' | 'baseUnitsCaptured'> {
  const seed = buildSeed()
  const group = target.rvgGroupId !== undefined ? seed.masters.rvgGroups[target.rvgGroupId] : undefined
  if (group === undefined) return { rvgGroupId: RVG_GROUP.h4!, baseUnitsSelected: 14 }
  const units = Math.max(group.baseUnitsRange?.max ?? 0, group.baseUnits) + 2
  return group.baseUnitsRange !== undefined
    ? { rvgGroupId: group.id, baseUnitsSelected: units }
    : { rvgGroupId: group.id, baseUnitsCaptured: { units, source: 'overridden' } }
}

const baseUnitsSample: WarningSample = {
  ruleId: 'baseUnitsOutsideGuide',
  fields: BASE_UNITS_FIELDS,
  isStaged(state, bookingId) {
    const target = baseUnitsTarget(bookingId)
    const p = target !== undefined ? state.schedule.procedures[target.id] : undefined
    if (p === undefined || target === undefined) return false
    const values = baseUnitsSampleValues(target)
    const holdsSample = BASE_UNITS_FIELDS.every((f) => sameValue(p[f], values[f]))
    const differsFromSeed = BASE_UNITS_FIELDS.some((f) => !sameValue(p[f], target[f]))
    return holdsSample && differsFromSeed && lastChangedByDemo(state, p.id)
  },
  stageRefusal(state, bookingId) {
    const target = baseUnitsTarget(bookingId)
    const p = target !== undefined ? state.schedule.procedures[target.id] : undefined
    if (p === undefined || target === undefined) return null
    // Never stage over someone's real edit to these fields: Clear would wipe it.
    if (BASE_UNITS_FIELDS.some((f) => !sameValue(p[f], target[f]))) return "This Booking's base units were changed: use Reset"
    const values = baseUnitsSampleValues(target)
    const pick = values.rvgGroupId !== p.rvgGroupId ? rvgGroupPickRefusal(state.masters.rvgGroups, values.rvgGroupId, p.rvgGroupId) : null
    return pick !== null ? 'The RVG code this sample uses is retired' : null
  },
  seedRaises(bookingId) {
    const seed = buildSeed()
    return proceduresForBooking(seed, bookingId).some((p) => {
      const group = p.rvgGroupId !== undefined ? seed.masters.rvgGroups[p.rvgGroupId] : undefined
      return group !== undefined && baseUnitsFor({ procedure: p, group }).outsideGuide
    })
  },
  stage(api, actor, bookingId) {
    const target = baseUnitsTarget(bookingId)
    if (target === undefined) return refuse('noProcedure', 'Nothing to stage on this Booking')
    const values = baseUnitsSampleValues(target)
    const current = api.getState().schedule.procedures[target.id]
    if (current === undefined) return refuse('noProcedure', 'Nothing to stage on this Booking')
    if (current.rvgGroupId !== values.rvgGroupId) {
      const picked = pickRvgGroup(api, actor, target.id, values.rvgGroupId ?? null)
      if (!picked.ok) return picked
    }
    return editProcedure(api, actor, target.id, {
      baseUnitsSelected: values.baseUnitsSelected,
      baseUnitsCaptured: values.baseUnitsCaptured,
    })
  },
  restore(state, bookingId) {
    if (!this.isStaged(state, bookingId)) return undefined
    const target = baseUnitsTarget(bookingId)
    const p = target !== undefined ? state.schedule.procedures[target.id] : undefined
    if (p === undefined || target === undefined) return undefined
    const restored: Procedure = { ...p }
    for (const f of BASE_UNITS_FIELDS) {
      if (target[f] === undefined) delete restored[f]
      else (restored as unknown as Record<string, unknown>)[f] = target[f]
    }
    return { procedures: { ...state.schedule.procedures, [p.id]: restored } }
  },
  restoredEntityIds(state, bookingId) {
    const target = baseUnitsTarget(bookingId)
    return target !== undefined && this.isStaged(state, bookingId) ? [target.id] : []
  },
}

/** One sample per registered rule, in `WARNING_RULES` order. */
export const WARNING_SAMPLES: readonly WarningSample[] = [prepaymentSample, baseUnitsSample]

/** The registered rule count, for the triggers' honest message. */
export const WARNING_RULE_COUNT = WARNING_RULES.length

// ---------------------------------------------------------------------------
// Targets and refusals
// ---------------------------------------------------------------------------

/** True when `bookingId` is a sample-staged Booking for any sample. */
export function hasStagedSample(state: SampleState, bookingId: string): boolean {
  return WARNING_SAMPLES.some((s) => s.isStaged(state, bookingId))
}

/** Every Booking that carries at least one staged sample. */
export function stagedSampleBookings(state: SampleState): string[] {
  return Object.keys(state.schedule.bookings)
    .filter((id) => hasStagedSample(state, id))
    .sort()
}

/** Why samples cannot be raised on one Booking, or null. */
export function sampleRaiseRefusal(state: SampleState & Pick<AppState, 'masters'>, bookingId: string): string | null {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined || buildSeed().schedule.bookings[bookingId] === undefined) {
    return 'Samples stage on seeded Bookings only'
  }
  if (booking.cancellation !== undefined || proceduresForBooking(state, bookingId).length === 0) {
    return 'Nothing to stage on this Booking'
  }
  const list = state.schedule.lists[booking.listId]
  if (list === undefined) return 'Nothing to stage on this Booking'
  if (list.state === 'AUTHORISED') return "This Booking's List is authorised"
  if (WARNING_SAMPLES.every((s) => s.seedRaises(bookingId))) return 'This Booking already carries these warnings'
  if (WARNING_SAMPLES.every((s) => s.seedRaises(bookingId) || s.isStaged(state, bookingId))) return 'Samples already raised'
  for (const sample of WARNING_SAMPLES) {
    if (sample.seedRaises(bookingId) || sample.isStaged(state, bookingId)) continue
    const reason = sample.stageRefusal?.(state, bookingId) ?? null
    if (reason !== null) return reason
  }
  return null
}

/** Why the demo day's samples cannot be raised, or null. */
export function daySampleRaiseRefusal(state: SampleState & Pick<AppState, 'masters'>): string | null {
  const reasons = SEED_WARNING_SAMPLE_BOOKINGS.targets.map((id) => sampleRaiseRefusal(state, id))
  if (reasons.some((r) => r === null)) return null
  if (reasons.every((r) => r === 'Samples already raised')) return 'Samples already raised'
  return reasons.find((r) => r !== 'Samples already raised') ?? 'Samples already raised'
}

/** Why samples cannot be cleared from one Booking, or null. */
export function sampleClearRefusal(state: SampleState & Pick<AppState, 'billing'>, bookingId: string): string | null {
  if (!hasStagedSample(state, bookingId)) return 'Nothing staged'
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (list?.state === 'AUTHORISED') return "This Booking's List is authorised"
  // A real invoice raised on the staged prepayment cannot be quietly undone:
  // restoring the seed would leave it orphaned. Reset clears it.
  if (prePaymentInvoicesForBooking(state, bookingId).length > 0) {
    return 'A pre-procedure invoice was raised on this sample: use Reset'
  }
  return null
}

/** Why the samples cannot be cleared anywhere, or null. */
export function allSampleClearRefusal(state: SampleState & Pick<AppState, 'billing'>): string | null {
  const staged = stagedSampleBookings(state)
  if (staged.length === 0) return 'Nothing staged'
  if (staged.some((id) => sampleClearRefusal(state, id) === null)) return null
  return sampleClearRefusal(state, staged[0]!)
}

// ---------------------------------------------------------------------------
// Stage and unstage
// ---------------------------------------------------------------------------

/** Stage every sample on one Booking that is not yet staged there. Returns how many were staged. */
export function raiseSamplesOn(api: AppStoreApi, bookingId: string, actor: Actor = DEMO_TRIGGER_ACTOR): Outcome<number> {
  const reason = sampleRaiseRefusal(api.getState(), bookingId)
  if (reason !== null) return refuse('sampleRefused', reason)
  let staged = 0
  for (const sample of WARNING_SAMPLES) {
    const state = api.getState()
    if (sample.seedRaises(bookingId) || sample.isStaged(state, bookingId)) continue
    const res = sample.stage(api, actor, bookingId)
    if (!res.ok) return refuse(res.code, res.message)
    staged += 1
  }
  return ok(staged)
}

/**
 * Undo every staged sample on one Booking: restore the seed's values and drop
 * the staged rules' clearances, in one audited mutation
 * (`booking.warningSampleUnstaged`).
 */
export function clearSamplesOn(api: AppStoreApi, bookingId: string, actor: Actor = DEMO_TRIGGER_ACTOR): Outcome<number> {
  const state = api.getState()
  const reason = sampleClearRefusal(state, bookingId)
  if (reason !== null) return refuse('sampleRefused', reason)
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (booking === undefined || list === undefined) return refuse('notFound', 'Booking not found.')
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights

  const staged = WARNING_SAMPLES.filter((s) => s.isStaged(state, bookingId))
  const ruleIds = new Set(staged.map((s) => s.ruleId))
  // Each restored Procedure once, with every field the staged samples set on it
  // (two samples can stage on the same Procedure).
  const fieldsByProcedure = new Map<string, Set<keyof Procedure>>()
  for (const sample of staged) {
    for (const id of sample.restoredEntityIds(state, bookingId)) {
      const set = fieldsByProcedure.get(id) ?? new Set<keyof Procedure>()
      for (const f of sample.fields) set.add(f)
      fieldsByProcedure.set(id, set)
    }
  }
  // The Booking's last-modified stamp goes back to the seed's when only the
  // demo actions have touched it since; otherwise someone's real edit stands.
  const seedBooking = buildSeed().schedule.bookings[bookingId]
  const touchesBooking = (a: AppState['audit'][number]) =>
    a.entityId === bookingId || state.schedule.procedures[a.entityId]?.bookingId === bookingId
  const firstDemo = state.audit.findIndex((a) => a.who === DEMO_TRIGGER_ACTOR.who && touchesBooking(a))
  const touchedByOthers = firstDemo >= 0 && state.audit.slice(firstDemo).some((a) => a.who !== DEMO_TRIGGER_ACTOR.who && touchesBooking(a))
  const restoreStamp = seedBooking !== undefined && !touchedByOthers && booking.lastModifiedBy === DEMO_TRIGGER_ACTOR.who
  mutate(
    api,
    actor,
    [
      {
        entityType: 'booking',
        entityId: bookingId,
        action: 'booking.warningSampleUnstaged',
        after: { ruleId: [...ruleIds].join(', ') },
        stampBookingId: restoreStamp ? null : undefined,
      },
      ...[...fieldsByProcedure.entries()].map(([id, fields]) => ({
        entityType: 'procedure',
        entityId: id,
        action: 'procedure.update',
        before: Object.fromEntries([...fields].map((f) => [f, state.schedule.procedures[id]?.[f]])),
        after: Object.fromEntries([...fields].map((f) => [f, seedProcedure(id)?.[f]])),
        stampBookingId: restoreStamp ? null : undefined,
      })),
    ],
    (s) => {
      let schedule = s.schedule
      for (const sample of staged) {
        const patch = sample.restore({ schedule, audit: s.audit, masters: s.masters }, bookingId)
        if (patch !== undefined) schedule = { ...schedule, ...patch }
      }
      if (restoreStamp) {
        const current = schedule.bookings[bookingId]!
        schedule = {
          ...schedule,
          bookings: {
            ...schedule.bookings,
            [bookingId]: { ...current, lastModifiedBy: seedBooking.lastModifiedBy, lastModifiedAtISO: seedBooking.lastModifiedAtISO },
          },
        }
      }
      const warningClearances = Object.fromEntries(
        Object.entries(schedule.warningClearances).filter(
          ([, c]) => !(c.bookingId === bookingId && ruleIds.has(c.ruleId)),
        ),
      )
      return { schedule: { ...schedule, warningClearances } }
    },
  )
  return ok(staged.length)
}

/** Raise the demo day's samples on every pinned target that can take them. */
export function raiseDaySamples(api: AppStoreApi, actor: Actor = DEMO_TRIGGER_ACTOR): Outcome<number> {
  const reason = daySampleRaiseRefusal(api.getState())
  if (reason !== null) return refuse('sampleRefused', reason)
  let staged = 0
  for (const id of SEED_WARNING_SAMPLE_BOOKINGS.targets) {
    if (sampleRaiseRefusal(api.getState(), id) !== null) continue
    const res = raiseSamplesOn(api, id, actor)
    if (!res.ok) return res
    staged += res.value
  }
  return ok(staged)
}

/** Clear every staged sample, wherever it was raised. */
export function clearAllSamples(api: AppStoreApi, actor: Actor = DEMO_TRIGGER_ACTOR): Outcome<number> {
  const reason = allSampleClearRefusal(api.getState())
  if (reason !== null) return refuse('sampleRefused', reason)
  let cleared = 0
  for (const id of stagedSampleBookings(api.getState())) {
    if (sampleClearRefusal(api.getState(), id) !== null) continue
    const res = clearSamplesOn(api, id, actor)
    if (!res.ok) return res
    cleared += res.value
  }
  return ok(cleared)
}
