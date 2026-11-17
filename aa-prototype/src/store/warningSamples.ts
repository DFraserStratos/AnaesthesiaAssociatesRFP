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
 * The pinned `multiWarning` Booking shows the prepayment and base-units
 * samples. Catch-up Phase 21 adds a child as the payer (per Procedure since 22a), which
 * stages on a minor (`targetFor`: the Booking on screen when its patient is
 * under 18, otherwise Grace Park's), so it never lands on `multiWarning`; each
 * later phase adds its sample here (22 a split that no longer fits the fee,
 * redirected to the fee-split Booking; 27 a prepaid procedure with no price on
 * the anaesthetist's own Contract; 40 a paying patient with a balance).
 */

import { buildSeed, RVG_GROUP, SEED_MARKERS, SEED_WARNING_SAMPLE_BOOKINGS } from '../domain/seed'
import { ADULT_AGE, childPayerOn, isPayerBilled } from '../domain/billing/whoIsBilled'
import { ageInCompletedYears } from '../domain/billing/modifiers'
import { baseUnitsFor, rvgGroupPickRefusal } from '../domain/billing/rvgGroups'
import type { Booking, Procedure } from '../domain/types'
import { WARNING_RULES, type WarningRuleId } from '../domain/warnings'
import type { AppState, AppStoreApi } from './appStore'
import { DEMO_TRIGGER_ACTOR } from './demoActors'
import { editProcedure, editRefusal } from './lifecycle'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import { pickRvgGroup } from './rvgGroupActions'
import { bookingRequiresPrepayment, prePaymentInvoicesForBooking, proceduresForBooking, railContextForList, railMastersOf } from './selectors'
import { contractCandidatesFor, openPriceFallbackFor } from '../domain/billing/contractRail'
import { setProcedureContract } from './contractSelectionActions'
import { payerAuditText, sameData, setProcedurePayer } from './payerActions'
import { payerOfferFor } from '../domain/billing/procedurePayer'
import { setBookingInsurance } from './insuranceActions'
import { approvalNumberMissing, hasApprovalNumber } from '../domain/billing/insurance'

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
  restore(state: SampleState, bookingId: string): Partial<Pick<AppState['schedule'], 'procedures' | 'bookings'>> | undefined
  /** The Booking fields the sample stages, restored and audited on unstage (catch-up Phase 21). */
  bookingFields?: readonly (keyof Booking)[]
  /** True when the sample stages Procedures' payers, restored and audited (`procedure.payer`) on unstage (catch-up Phase 22a). */
  stagesPayer?: boolean
  /**
   * Where the sample stages when raised from a Booking (catch-up Phase 21): by
   * default that Booking; the child payer sample redirects to a minor's.
   * Undefined when the sample has nowhere to stage.
   */
  targetFor?(state: SampleState, bookingId: string): string | undefined
  /** The audited entities the restore changes, for the unstage's audit metas. */
  restoredEntityIds(state: SampleState, bookingId: string): string[]
}

/** Audit actions on a Booking that change none of the values a sample stages. */
const NOT_A_VALUE_CHANGE: ReadonlySet<string> = new Set(['booking.warningCleared', 'booking.warningSampleUnstaged'])

/** The last audit entry per entity id (one pass, cached per audit array). */
const lastAuditCache = new WeakMap<readonly AppState['audit'][number][], Map<string, AppState['audit'][number]>>()
function lastAuditByEntity(audit: AppState['audit']): Map<string, AppState['audit'][number]> {
  const cached = lastAuditCache.get(audit)
  if (cached !== undefined) return cached
  const out = new Map<string, AppState['audit'][number]>()
  // An office Clear on the To-do card, or an unstage, is not a change to the sample's values (catch-up Phase 21 review).
  for (const entry of audit) if (!NOT_A_VALUE_CHANGE.has(entry.action)) out.set(entry.entityId, entry)
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

/** Deep equality whatever the key order (a seeded and a typed payer build their keys differently). */
function sameValue(a: unknown, b: unknown): boolean {
  return sameData(a, b)
}

/** The Booking's primary: base units and modifiers are recorded there only (catch-up Phase 23). */
function firstProcedure(state: Pick<AppState, 'schedule'>, bookingId: string): Procedure | undefined {
  return proceduresForBooking(state, bookingId).find((p) => p.isPrimary)
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
    // A prepaid Procedure cannot be split (catch-up Phase 22): raise the samples from another Booking.
    if (p.split !== undefined) return "This Booking's fee is split, so it cannot be prepaid: raise the samples from another Booking"
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

// ---------------------------------------------------------------------------
// A child as the payer, per Procedure (catch-up Phase 21; per Procedure since 22a; US-11.2.4, US-13.7.1)
// ---------------------------------------------------------------------------

/** The Contract fields the child sample may move on the first Procedure (when every Contract bills its holder). */
const CHILD_CONTRACT_FIELDS = ['governingContractId', 'enteredPrice', 'priceOverride', 'railAnswers', 'rvgGroupId', 'baseUnitsSelected', 'baseUnitsCaptured', 'modifierClaims', 'removedModifierIds'] as const satisfies readonly (keyof Procedure)[]
const NO_CONTRACT_RVG = 'CT-NO-CONTRACT'

/** True when the Booking's patient is under 18 on its List's date. */
function patientIsChild(state: SampleState, bookingId: string): boolean {
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  const patient = booking !== undefined ? state.masters.patients[booking.patientId] : undefined
  if (list === undefined || patient === undefined) return false
  const age = ageInCompletedYears(patient.dobISO, list.dateISO)
  return age !== undefined && age < ADULT_AGE
}

/** True when any of the Booking's Procedures raises the child payer warning (`childPayerOn`, per Procedure). */
function childRaisedOn(state: SampleState, bookingId: string): boolean {
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (booking === undefined || list === undefined) return false
  const patient = state.masters.patients[booking.patientId]
  return proceduresForBooking(state, bookingId).some((p) =>
    childPayerOn(p, patient, p.governingContractId !== undefined ? state.masters.contracts[p.governingContractId] : undefined, list.dateISO),
  )
}

/** The Booking's Procedures whose payer differs from the seed's (what the child sample stages). */
function payerMovedProcedures(state: Pick<AppState, 'schedule'>, bookingId: string): Procedure[] {
  return proceduresForBooking(state, bookingId).filter((p) => {
    const seed = seedProcedure(p.id)
    return seed !== undefined && !sameValue(p.payer, seed.payer)
  })
}

const childPayerSample: WarningSample = {
  ruleId: 'childPayer',
  fields: CHILD_CONTRACT_FIELDS,
  stagesPayer: true,
  targetFor(state, bookingId) {
    if (patientIsChild(state, bookingId)) return bookingId
    return SEED_MARKERS.guardianMinorBooking?.entityId
  },
  isStaged(state, bookingId) {
    if (state.schedule.bookings[bookingId] === undefined || !childRaisedOn(state, bookingId)) return false
    const moved = payerMovedProcedures(state, bookingId)
    const first = firstProcedure(state, bookingId)
    const seedFirst = first !== undefined ? seedProcedure(first.id) : undefined
    const contractMoved = first !== undefined && seedFirst !== undefined && first.governingContractId !== seedFirst.governingContractId
    if (moved.length === 0 && !contractMoved) return false
    return lastChangedByDemo(state, bookingId) || [...moved, ...(first !== undefined ? [first] : [])].some((p) => lastChangedByDemo(state, p.id))
  },
  seedRaises(bookingId) {
    return childRaisedOn(buildSeed(), bookingId)
  },
  stageRefusal(state, bookingId) {
    // Never stage over someone's real payer change: Clear would undo it.
    if (payerMovedProcedures(state, bookingId).length > 0) return "A payer on this Booking was changed: use Reset"
    return null
  },
  stage(api, actor, bookingId) {
    if (api.getState().schedule.bookings[bookingId] === undefined) return refuse('notFound', 'Booking not found.')
    // The patient pays on every Procedure: each payer moved once, with the offer to the Procedures sharing it.
    for (const p of proceduresForBooking(api.getState(), bookingId)) {
      const now = api.getState()
      const current = now.schedule.procedures[p.id]
      const booking = now.schedule.bookings[bookingId]
      if (current === undefined || booking === undefined || current.payer.kind === 'patient') continue
      const offer = payerOfferFor(proceduresForBooking(now, bookingId), p.id, now.masters.contracts, booking.patientId).map((o) => o.id)
      const res = setProcedurePayer(api, actor, p.id, { kind: 'patient' }, offer)
      if (!res.ok) return res
    }
    // A child billed only through holders raises nothing: move the first Procedure onto No contract · RVG.
    const procs = proceduresForBooking(api.getState(), bookingId)
    const contracts = api.getState().masters.contracts
    if (!procs.some((p) => isPayerBilled(p.governingContractId !== undefined ? contracts[p.governingContractId] : undefined)) && procs[0] !== undefined) {
      const res = setProcedureContract(api, actor, procs[0].id, NO_CONTRACT_RVG)
      if (!res.ok) return res
    }
    return ok(undefined)
  },
  restore(state, bookingId) {
    if (!this.isStaged(state, bookingId)) return undefined
    const procedures = { ...state.schedule.procedures }
    for (const p of payerMovedProcedures(state, bookingId)) procedures[p.id] = { ...p, payer: seedProcedure(p.id)!.payer }
    const first = firstProcedure(state, bookingId)
    const seedFirst = first !== undefined ? seedProcedure(first.id) : undefined
    if (first !== undefined && seedFirst !== undefined && first.governingContractId !== seedFirst.governingContractId) {
      const restored: Procedure = { ...procedures[first.id]! }
      for (const f of CHILD_CONTRACT_FIELDS) {
        if (seedFirst[f] === undefined) delete restored[f]
        else (restored as unknown as Record<string, unknown>)[f] = seedFirst[f]
      }
      procedures[first.id] = restored
    }
    return { procedures }
  },
  restoredEntityIds(state, bookingId) {
    if (!this.isStaged(state, bookingId)) return []
    const first = firstProcedure(state, bookingId)
    const seedFirst = first !== undefined ? seedProcedure(first.id) : undefined
    return first !== undefined && seedFirst !== undefined && first.governingContractId !== seedFirst.governingContractId ? [first.id] : []
  },
}

// ---------------------------------------------------------------------------
// A missing approval number on an insured Booking (catch-up Phase 21; US-11.4.3)
// ---------------------------------------------------------------------------

/** True when the Booking names an insurer (not a funder). */
function namesInsurer(state: Pick<AppState, 'schedule' | 'masters'>, bookingId: string): boolean {
  const funder = state.schedule.bookings[bookingId]?.funderPartyId
  return funder !== undefined && state.masters.parties[funder]?.kind === 'insurer'
}

/**
 * The approval sample's default target: the first seeded Booking that names
 * an insurer and holds a number, on an ACTIVE List no scenario marker uses
 * (computed once from the pristine seed).
 */
let approvalDefaultTarget: string | null | undefined
function defaultApprovalTarget(): string | undefined {
  if (approvalDefaultTarget === undefined) {
    const seed = buildSeed()
    const markers = new Set(Object.values(SEED_MARKERS).map((m) => m.entityId))
    const hit = Object.values(seed.schedule.bookings)
      .filter((b) => namesInsurer(seed, b.id) && hasApprovalNumber(b) && b.cancellation === undefined)
      .filter((b) => seed.schedule.lists[b.listId]?.state === 'ACTIVE' && !markers.has(b.id) && !markers.has(b.listId))
      .sort((a, b) => a.id.localeCompare(b.id))[0]
    approvalDefaultTarget = hit?.id ?? null
  }
  return approvalDefaultTarget ?? undefined
}

const approvalSample: WarningSample = {
  ruleId: 'approvalNumberMissing',
  fields: [],
  bookingFields: ['insuranceApprovalNumber'],
  // The seed's funder decides, so an office edit on the Booking on screen never redirects the sample onto it.
  targetFor(_state, bookingId) {
    return namesInsurer(buildSeed(), bookingId) ? bookingId : defaultApprovalTarget()
  },
  isStaged(state, bookingId) {
    const booking = state.schedule.bookings[bookingId]
    const seed = buildSeed().schedule.bookings[bookingId]
    if (booking === undefined || seed === undefined || !hasApprovalNumber(seed)) return false
    return booking.funderPartyId === seed.funderPartyId && !hasApprovalNumber(booking) && lastChangedByDemo(state, bookingId)
  },
  seedRaises(bookingId) {
    const seed = buildSeed()
    const booking = seed.schedule.bookings[bookingId]
    return booking !== undefined && approvalNumberMissing(booking, seed.masters.parties)
  },
  stageRefusal(state, bookingId) {
    const booking = state.schedule.bookings[bookingId]
    const seed = buildSeed().schedule.bookings[bookingId]
    if (booking === undefined || seed === undefined) return null
    // Never stage over someone's real change: Clear would undo it.
    if (booking.funderPartyId !== seed.funderPartyId || booking.insuranceApprovalNumber !== seed.insuranceApprovalNumber) {
      return "This Booking's insurer or approval number was changed: use Reset"
    }
    return null
  },
  stage(api, actor, bookingId) {
    const booking = api.getState().schedule.bookings[bookingId]
    if (booking === undefined) return refuse('notFound', 'Booking not found.')
    return setBookingInsurance(api, actor, bookingId, booking.funderPartyId !== undefined ? { funderPartyId: booking.funderPartyId } : {})
  },
  restore(state, bookingId) {
    if (!this.isStaged(state, bookingId)) return undefined
    const booking = state.schedule.bookings[bookingId]
    const seed = buildSeed().schedule.bookings[bookingId]
    if (booking === undefined || seed === undefined) return undefined
    const restored = { ...booking }
    if (seed.insuranceApprovalNumber === undefined) delete restored.insuranceApprovalNumber
    else restored.insuranceApprovalNumber = seed.insuranceApprovalNumber
    return { bookings: { ...state.schedule.bookings, [bookingId]: restored } }
  },
  restoredEntityIds() {
    return []
  },
}

// ---------------------------------------------------------------------------
// The split that no longer fits (catch-up Phase 22; US-08.2.3)
// ---------------------------------------------------------------------------

/** The seeded split Procedure on a Booking, from the pristine seed. */
function seedSplitProcedure(bookingId: string): Procedure | undefined {
  return proceduresForBooking(buildSeed(), bookingId).find((p) => p.split !== undefined)
}

/** The sample's split: the seed's, with its first typed share raised to $250.00, above the fee, so the rest has nothing left. */
function sampleSplitFor(seed: Procedure): Procedure['split'] {
  if (seed.split === undefined) return undefined
  let raised = false
  return {
    shares: seed.split.shares.map((share) => {
      if (raised || share.basis.kind === 'rest') return share
      raised = true
      return { ...share, basis: { kind: 'amount' as const, amountExGst: 250 } }
    }),
  }
}

const splitSample: WarningSample = {
  ruleId: 'splitDoesNotFit',
  fields: ['split'],
  // The Booking on screen when its seed carries a split, otherwise the fee-split Booking.
  targetFor(_state, bookingId) {
    return seedSplitProcedure(bookingId) !== undefined ? bookingId : SEED_MARKERS['feeSplitBooking']?.entityId
  },
  isStaged(state, bookingId) {
    const seed = seedSplitProcedure(bookingId)
    const p = seed !== undefined ? state.schedule.procedures[seed.id] : undefined
    if (seed === undefined || p === undefined) return false
    return sameValue(p.split, sampleSplitFor(seed)) && lastChangedByDemo(state, p.id)
  },
  seedRaises() {
    return false
  },
  stageRefusal(state, bookingId) {
    const seed = seedSplitProcedure(bookingId)
    const p = seed !== undefined ? state.schedule.procedures[seed.id] : undefined
    if (seed === undefined || p === undefined) return null
    return sameValue(p.split, seed.split) ? null : "This Booking's split was changed: use Reset"
  },
  stage(api, actor, bookingId) {
    const seed = seedSplitProcedure(bookingId)
    const current = seed !== undefined ? api.getState().schedule.procedures[seed.id] : undefined
    const split = seed !== undefined ? sampleSplitFor(seed) : undefined
    if (seed === undefined || current === undefined || split === undefined) return refuse('noProcedure', 'Nothing to stage on this Booking')
    // Written as the split stood before the fee moved: the guard in `setProcedureSplit` would refuse it, which is the point.
    mutate(
      api,
      actor,
      { entityType: 'procedure', entityId: current.id, action: 'procedure.split', before: { split: current.split ?? null }, after: { split } },
      (st) => ({ schedule: { ...st.schedule, procedures: { ...st.schedule.procedures, [current.id]: { ...current, split } } } }),
    )
    return ok(undefined)
  },
  restore(state, bookingId) {
    if (!this.isStaged(state, bookingId)) return undefined
    const seed = seedSplitProcedure(bookingId)
    const p = seed !== undefined ? state.schedule.procedures[seed.id] : undefined
    if (seed === undefined || p === undefined) return undefined
    const restored: Procedure = { ...p }
    if (seed.split === undefined) delete restored.split
    else restored.split = seed.split
    return { procedures: { ...state.schedule.procedures, [p.id]: restored } }
  },
  restoredEntityIds(state, bookingId) {
    const seed = seedSplitProcedure(bookingId)
    return seed !== undefined && this.isStaged(state, bookingId) ? [seed.id] : []
  },
}

/** One sample per registered rule, in `WARNING_RULES` order. */
export const WARNING_SAMPLES: readonly WarningSample[] = [prepaymentSample, baseUnitsSample, childPayerSample, approvalSample, splitSample]

/** Where a sample stages when raised from this Booking (itself, unless the sample redirects). */
export function sampleTarget(sample: WarningSample, state: SampleState, bookingId: string): string | undefined {
  return sample.targetFor !== undefined ? sample.targetFor(state, bookingId) : bookingId
}

/** Why a redirected target cannot take its sample, or null (catch-up Phase 21: it is skipped, the others still stage). */
function redirectSkipReason(sample: WarningSample, state: SampleState, bookingId: string): string | null {
  const booking = state.schedule.bookings[bookingId]
  const list = booking !== undefined ? state.schedule.lists[booking.listId] : undefined
  if (booking === undefined || list === undefined || buildSeed().schedule.bookings[bookingId] === undefined) return 'is not a seeded Booking'
  if (booking.cancellation !== undefined) return 'is cancelled'
  if (list.state === 'AUTHORISED') return 'is authorised'
  if (sample.isStaged(state, bookingId) || sample.seedRaises(bookingId)) return null
  return sample.stageRefusal?.(state, bookingId) !== null && sample.stageRefusal !== undefined ? 'was changed by hand' : null
}

/** True when the target can take its sample. */
function targetEditable(sample: WarningSample, state: SampleState, bookingId: string): boolean {
  return redirectSkipReason(sample, state, bookingId) === null
}

/**
 * Why a redirected sample cannot stage on its target, for the trigger's
 * message (catch-up Phase 21): an AUTHORISED target is skipped and the others
 * still stage.
 */
export function skippedSampleNotes(state: SampleState, bookingId: string): string[] {
  const notes: string[] = []
  for (const sample of WARNING_SAMPLES) {
    const target = sampleTarget(sample, state, bookingId)
    if (target === undefined || target === bookingId) continue
    const reason = redirectSkipReason(sample, state, target)
    if (reason !== null) notes.push(`The ${SAMPLE_NAMES[sample.ruleId]} sample's Booking ${reason}. Reset to raise it again.`)
  }
  return notes
}

const SAMPLE_NAMES: Record<WarningRuleId, string> = {
  prepaymentUnpaid: 'prepayment',
  baseUnitsOutsideGuide: 'base units',
  childPayer: 'child',
  approvalNumberMissing: 'approval number',
  splitDoesNotFit: 'split',
}

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
  // Each sample on its own target (catch-up Phase 21: the child sample redirects to a minor's Booking).
  const targeted = WARNING_SAMPLES.flatMap((s) => {
    const target = sampleTarget(s, state, bookingId)
    if (target === undefined) return []
    if (target !== bookingId && !targetEditable(s, state, target)) return [] // skipped, the others still stage
    return [{ s, target }]
  })
  if (targeted.every(({ s, target }) => s.seedRaises(target))) return 'This Booking already carries these warnings'
  if (targeted.every(({ s, target }) => s.seedRaises(target) || s.isStaged(state, target))) return 'Samples already raised'
  for (const { s, target } of targeted) {
    if (s.seedRaises(target) || s.isStaged(state, target)) continue
    const reason = s.stageRefusal?.(state, target) ?? null
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

/** The Bookings a raise from this Booking may have staged on: itself and any redirected target. */
export function sampleBookingsFor(state: SampleState, bookingId: string): string[] {
  const ids = new Set<string>([bookingId])
  for (const s of WARNING_SAMPLES) {
    const target = sampleTarget(s, state, bookingId)
    if (target !== undefined && s.isStaged(state, target)) ids.add(target)
  }
  return [...ids]
}

/** Why samples cannot be cleared from one Booking (and its redirected targets), or null. */
export function sampleClearRefusal(state: SampleState & Pick<AppState, 'billing'>, bookingId: string): string | null {
  // Nothing on this Booking itself: clearable when a redirected target holds one (catch-up Phase 21).
  if (!hasStagedSample(state, bookingId)) {
    const others = sampleBookingsFor(state, bookingId).filter((id) => id !== bookingId)
    return others.some((id) => sampleClearRefusal(state, id) === null) ? null : 'Nothing staged'
  }
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
    const target = sampleTarget(sample, state, bookingId)
    if (target === undefined || (target !== bookingId && !targetEditable(sample, state, target))) continue
    if (sample.seedRaises(target) || sample.isStaged(state, target)) continue
    const res = sample.stage(api, actor, target)
    if (!res.ok) return refuse(res.code, res.message)
    staged += 1
  }
  return ok(staged)
}

/** Clear the samples a raise from this Booking staged: on it, and on any redirected target (catch-up Phase 21). */
export function clearSamplesFor(api: AppStoreApi, bookingId: string, actor: Actor = DEMO_TRIGGER_ACTOR): Outcome<number> {
  const reason = sampleClearRefusal(api.getState(), bookingId)
  if (reason !== null) return refuse('sampleRefused', reason)
  let cleared = 0
  for (const id of sampleBookingsFor(api.getState(), bookingId)) {
    if (!hasStagedSample(api.getState(), id)) continue
    const res = clearSamplesOn(api, id, actor)
    if (!res.ok) return res
    cleared += res.value
  }
  return ok(cleared)
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
      // Each staged payer goes back to the seed's, audited per Procedure (catch-up Phases 21, 22a).
      ...(staged.some((s) => s.stagesPayer === true)
        ? payerMovedProcedures(state, bookingId).map((p) => ({
            entityType: 'procedure',
            entityId: p.id,
            action: 'procedure.payer',
            before: { payer: payerAuditText(state, p.payer, booking.patientId) },
            after: { payer: payerAuditText(state, seedProcedure(p.id)!.payer, booking.patientId) },
            stampBookingId: restoreStamp ? null : undefined,
          }))
        : []),
      // A cleared approval number goes back to the seed's (catch-up Phase 21).
      ...(staged.some((s) => s.bookingFields?.includes('insuranceApprovalNumber')) && seedBooking !== undefined
        ? [
            {
              entityType: 'booking',
              entityId: bookingId,
              action: 'booking.insurance',
              before: { insuranceApprovalNumber: booking.insuranceApprovalNumber ?? null },
              after: { insuranceApprovalNumber: seedBooking.insuranceApprovalNumber ?? null },
              stampBookingId: restoreStamp ? null : undefined,
            },
          ]
        : []),
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
