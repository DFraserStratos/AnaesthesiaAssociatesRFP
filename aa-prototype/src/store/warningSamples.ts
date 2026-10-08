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
 * With one rule registered, a Booking with two warnings is proven in tests;
 * each later phase adds its sample here (19 out-of-range base units; 21 a child
 * as the payer on the Booking, and insurer-will-pay with no insurer Contract;
 * 27 a prepaid procedure with no price on the anaesthetist's own Contract; 40
 * a paying patient with a balance).
 */

import { buildSeed, SEED_WARNING_SAMPLE_BOOKINGS } from '../domain/seed'
import type { Procedure } from '../domain/types'
import { WARNING_RULES, type WarningRuleId } from '../domain/warnings'
import type { AppState, AppStoreApi } from './appStore'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { editProcedure, editRefusal } from './lifecycle'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import { bookingRequiresPrepayment, prePaymentInvoicesForBooking, proceduresForBooking } from './selectors'

/** What the staging checks read: the schedule, and the audit trail that says who last changed it. */
type SampleState = Pick<AppState, 'schedule' | 'audit'>

export interface WarningSample {
  ruleId: WarningRuleId
  /**
   * True when this sample's condition is staged on the Booking: it differs from
   * the seed, holds the sample's values, and the demo actions made the last
   * change, so a real edit to the same values is never mistaken for a sample
   * (and never reverted by "Clear sample warnings").
   */
  isStaged(state: SampleState, bookingId: string): boolean
  /** True when the pristine seed already raises this sample's rule on the Booking (not a target). */
  seedRaises(bookingId: string): boolean
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
 * The fields the prepayment sample stages on the Booking's first Procedure (in
 * `proceduresForBooking` order; there is no primary flag until Phase 23). The
 * detail keeps the Booking billing-complete, because the validator requires it
 * for this category. Phase 20 deletes these fields and re-points the sample at
 * the Booking's office-set prepayment flag; Phase 27 at the prepaid set.
 */
const PREPAYMENT_SAMPLE = {
  billingRoute: 'billableParty',
  patientPaymentCategory: 'selfFundedPrepayment',
  prepaymentDetail: { type: 'full' },
} as const satisfies Pick<Procedure, 'billingRoute' | 'patientPaymentCategory' | 'prepaymentDetail'>

type PrepaymentField = keyof typeof PREPAYMENT_SAMPLE
const PREPAYMENT_FIELDS = Object.keys(PREPAYMENT_SAMPLE) as PrepaymentField[]

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
  isStaged(state, bookingId) {
    const p = firstProcedure(state, bookingId)
    const seed = p !== undefined ? seedProcedure(p.id) : undefined
    if (p === undefined || seed === undefined) return false
    const holdsSample = PREPAYMENT_FIELDS.every((f) => sameValue(p[f], PREPAYMENT_SAMPLE[f]))
    const differsFromSeed = PREPAYMENT_FIELDS.some((f) => !sameValue(p[f], seed[f]))
    return holdsSample && differsFromSeed && lastChangedByDemo(state, p.id)
  },
  seedRaises(bookingId) {
    return bookingRequiresPrepayment(buildSeed(), bookingId)
  },
  stage(api, actor, bookingId) {
    const p = firstProcedure(api.getState(), bookingId)
    if (p === undefined) return refuse('noProcedure', 'Nothing to stage on this Booking')
    return editProcedure(api, actor, p.id, { ...PREPAYMENT_SAMPLE, prepaymentDetail: { ...PREPAYMENT_SAMPLE.prepaymentDetail } })
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

/** One sample per registered rule, in `WARNING_RULES` order. */
export const WARNING_SAMPLES: readonly WarningSample[] = [prepaymentSample]

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
export function sampleRaiseRefusal(state: SampleState, bookingId: string): string | null {
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
  return null
}

/** Why the demo day's samples cannot be raised, or null. */
export function daySampleRaiseRefusal(state: SampleState): string | null {
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
  const procedureIds = staged.flatMap((s) => s.restoredEntityIds(state, bookingId))
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
      ...procedureIds.map((id) => ({
        entityType: 'procedure',
        entityId: id,
        action: 'procedure.update',
        before: Object.fromEntries(PREPAYMENT_FIELDS.map((f) => [f, state.schedule.procedures[id]?.[f]])),
        after: Object.fromEntries(PREPAYMENT_FIELDS.map((f) => [f, seedProcedure(id)?.[f]])),
        stampBookingId: restoreStamp ? null : undefined,
      })),
    ],
    (s) => {
      let schedule = s.schedule
      for (const sample of staged) {
        const patch = sample.restore({ schedule, audit: s.audit }, bookingId)
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
