/**
 * Modifier store actions (catch-up Phase 19b; DM-44, US-03.3.4, US-03.3.8,
 * US-05.1.4, US-05.1.5). A Procedure's optional modifiers are claimed one at a
 * time, each with a short explanation; the pre-applied ones (age, included)
 * are derived, and removing or putting one back is stored as
 * `removedModifierIds`. Every write is one audited `mutate()` with
 * `editProcedure`'s rights (`editRefusal`): the anaesthetist on their own
 * List, the office per its edit rules, nobody once AUTHORISED. The rules
 * themselves are the domain's (`domain/billing/modifiers.ts`).
 */

import type { Modifier, ModifierClaim, ModifierId, Procedure } from '../domain/types'
import {
  AA_OWN_BLOCK,
  applyClaim,
  claimAuditView,
  claimsAuditView,
  claimRefusal,
  preApplicableModifiersFor,
  preAppliedModifiersFor,
  reconcileClaims,
  withoutClaim,
} from '../domain/billing/modifiers'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal, getBooking, MODIFIERS_ON_PRIMARY_MESSAGE } from './lifecycle'
import { modifierFactsFor } from './modifierFacts'
import { slicesOf, withSource, type Plan, type PlanSource } from './masterPlanners'
import { allocateId, mutate, ok, refuse, type Actor, type Outcome } from './mutate'

export interface ClaimInput {
  modifierId: ModifierId
  explanation: string
  /** Only for a modifier whose printed value is not a plain number. */
  units?: number
}

type Loaded = { state: AppState; procedure: Procedure }

function load(api: AppStoreApi, actor: Actor, procedureId: string): Loaded | Outcome<never> {
  const state = api.getState()
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return refuse('notFound', 'Procedure not found.')
  const found = getBooking(state, procedure.bookingId)
  if (found === undefined) return refuse('notFound', 'The procedure has no Booking.')
  const rights = editRefusal(actor, found.list)
  if (rights !== null) return rights
  return { state, procedure }
}

function write(procedureId: string, next: Procedure) {
  return (s: AppState) => ({
    schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } },
  })
}

function claimOf(input: ClaimInput): ModifierClaim {
  return {
    modifierId: input.modifierId,
    explanation: input.explanation,
    ...(input.units !== undefined ? { units: input.units } : {}),
  }
}

/** Claim an optional modifier with its explanation. Audited `procedure.modifierClaim`. */
export function claimModifier(api: AppStoreApi, actor: Actor, procedureId: string, input: ClaimInput): Outcome {
  const loaded = load(api, actor, procedureId)
  if (!('state' in loaded)) return loaded
  const { state, procedure } = loaded
  // The Booking's modifiers are recorded once, on the primary (catch-up Phase 23).
  if (!procedure.isPrimary) return refuse('modifiersOnPrimary', MODIFIERS_ON_PRIMARY_MESSAGE)
  const facts = modifierFactsFor(state, procedure)
  const preApplied = preAppliedModifiersFor({ ...facts, removedModifierIds: procedure.removedModifierIds })
  const claim = claimOf(input)
  const refused = claimRefusal(claim, { claims: procedure.modifierClaims, preApplied, modifiers: state.masters.modifiers })
  if (refused !== null) return refuse('modifierClaimRefused', refused)
  const modifierClaims = applyClaim(procedure.modifierClaims, claim)
  const saved = modifierClaims.find((c) => c.modifierId === claim.modifierId)!
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.modifierClaim',
      before: { modifier: 'none' },
      after: claimAuditView(saved, state.masters.modifiers),
    },
    // Claiming answers the modifiers step (catch-up Phase 21a): the marker is never cleared afterwards.
    write(procedureId, { ...procedure, modifierClaims, modifiersConfirmed: true }),
  )
  return ok(undefined)
}

/**
 * "None apply" (catch-up Phase 21a; US-03.3.4, US-03.3.9: choosing no
 * modifier is a valid answer, AR-58 A20, the marker our reading): answers the
 * modifiers step with no claim. The anaesthetist on their own ACTIVE or
 * SUBMITTED List and the office (`editRefusal`); idempotent (a second press
 * writes nothing). Audited `procedure.modifiersConfirm`.
 */
export function confirmNoModifiers(api: AppStoreApi, actor: Actor, procedureId: string): Outcome {
  const loaded = load(api, actor, procedureId)
  if (!('state' in loaded)) return loaded
  const { procedure } = loaded
  // The modifiers step is the Booking's, answered on the primary (catch-up Phase 23).
  if (!procedure.isPrimary) return refuse('modifiersOnPrimary', MODIFIERS_ON_PRIMARY_MESSAGE)
  if (procedure.modifiersConfirmed === true) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.modifiersConfirm',
      before: { modifiersConfirmed: false },
      after: { modifiersConfirmed: true },
    },
    write(procedureId, { ...procedure, modifiersConfirmed: true }),
  )
  return ok(undefined)
}

/** Change a claim's explanation (and its entered units). Audited `procedure.modifierExplanation` with before and after. */
export function editModifierExplanation(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  modifierId: ModifierId,
  explanation: string,
  units?: number,
): Outcome {
  const loaded = load(api, actor, procedureId)
  if (!('state' in loaded)) return loaded
  const { state, procedure } = loaded
  if (!procedure.isPrimary) return refuse('modifiersOnPrimary', MODIFIERS_ON_PRIMARY_MESSAGE)
  const current = procedure.modifierClaims.find((c) => c.modifierId === modifierId)
  if (current === undefined) return refuse('notClaimed', 'That modifier is not claimed on this Procedure.')
  if (explanation.trim() === '') return refuse('modifierClaimRefused', 'Add a short explanation, or remove the modifier.')
  const facts = modifierFactsFor(state, procedure)
  const preApplied = preAppliedModifiersFor({ ...facts, removedModifierIds: procedure.removedModifierIds })
  const claim = claimOf({ modifierId, explanation, ...(units !== undefined ? { units } : {}) })
  const refused = claimRefusal(claim, {
    claims: procedure.modifierClaims,
    preApplied,
    modifiers: state.masters.modifiers,
    replacing: true,
  })
  if (refused !== null) return refuse('modifierClaimRefused', refused)
  const modifierClaims = applyClaim(procedure.modifierClaims, claim)
  const saved = modifierClaims.find((c) => c.modifierId === modifierId)!
  if (saved.explanation === current.explanation && saved.units === current.units) return ok(undefined)
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.modifierExplanation',
      before: claimAuditView(current, state.masters.modifiers),
      after: claimAuditView(saved, state.masters.modifiers),
    },
    write(procedureId, { ...procedure, modifierClaims }),
  )
  return ok(undefined)
}

/**
 * Remove a modifier: a claim is taken off (`procedure.modifierUnclaim`); a
 * pre-applied one (age, included) is added to `removedModifierIds`
 * (`procedure.modifierRemove`, with its origin). Nothing is locked.
 */
export function removeModifier(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  modifierId: ModifierId,
  /** Which row the Remove came from; a pre-applied row removes the pre-applied modifier even beside a duplicate claim. */
  from: 'claim' | 'preApplied' = 'claim',
): Outcome {
  const loaded = load(api, actor, procedureId)
  if (!('state' in loaded)) return loaded
  const { state, procedure } = loaded
  // Removing a claim is allowed anywhere (a clear); removing a pre-applied modifier is the Booking's, on the primary.
  if (from === 'preApplied' && !procedure.isPrimary) return refuse('modifiersOnPrimary', MODIFIERS_ON_PRIMARY_MESSAGE)
  const modifiers = state.masters.modifiers
  const claim = procedure.modifierClaims.find((c) => c.modifierId === modifierId)
  if (claim !== undefined && from === 'claim') {
    mutate(
      api,
      actor,
      {
        entityType: 'procedure',
        entityId: procedureId,
        action: 'procedure.modifierUnclaim',
        before: claimAuditView(claim, modifiers),
        after: { modifier: 'none' },
      },
      write(procedureId, { ...procedure, modifierClaims: withoutClaim(procedure.modifierClaims, modifierId) }),
    )
    return ok(undefined)
  }
  const facts = modifierFactsFor(state, procedure)
  const applied = preAppliedModifiersFor({ ...facts, removedModifierIds: procedure.removedModifierIds }).find(
    (r) => r.modifierId === modifierId,
  )
  if (applied === undefined) return refuse('notOnProcedure', 'That modifier is not on this Procedure.')
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.modifierRemove',
      before: { modifier: `${applied.code} · ${applied.label}`, appliedBecause: applied.detail },
      after: { modifier: 'removed' },
    },
    write(procedureId, { ...procedure, removedModifierIds: [...procedure.removedModifierIds, modifierId] }),
  )
  return ok(undefined)
}

/**
 * Put back a pre-applied modifier the anaesthetist removed. A hand claim of
 * the same modifier made meanwhile is dropped in the same commit (it is never
 * counted twice). Refused when the modifier no longer applies. Audited
 * `procedure.modifierRestore`.
 */
export function restoreModifier(api: AppStoreApi, actor: Actor, procedureId: string, modifierId: ModifierId): Outcome {
  const loaded = load(api, actor, procedureId)
  if (!('state' in loaded)) return loaded
  const { state, procedure } = loaded
  if (!procedure.isPrimary) return refuse('modifiersOnPrimary', MODIFIERS_ON_PRIMARY_MESSAGE)
  if (!procedure.removedModifierIds.includes(modifierId)) {
    return refuse('notRemoved', 'That modifier was not removed from this Procedure.')
  }
  const facts = modifierFactsFor(state, procedure)
  const candidate = preApplicableModifiersFor(facts).find((r) => r.modifierId === modifierId)
  if (candidate === undefined) return refuse('noLongerApplies', 'That modifier no longer applies to this Procedure.')
  const next = reconcileClaims(
    procedure.modifierClaims,
    procedure.removedModifierIds.filter((id) => id !== modifierId),
    facts,
  )
  // A hand claim of the same modifier, made while it was removed, drops here: audit it.
  const claimsChanged = next.modifierClaims.length !== procedure.modifierClaims.length
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.modifierRestore',
      before: {
        modifier: 'removed',
        ...(claimsChanged ? { modifierClaims: claimsAuditView(procedure, state.masters.modifiers).modifierClaims } : {}),
      },
      after: {
        modifier: `${candidate.code} · ${candidate.label}`,
        appliedBecause: candidate.detail,
        ...(claimsChanged ? { modifierClaims: claimsAuditView(next, state.masters.modifiers).modifierClaims } : {}),
      },
    },
    write(procedureId, { ...procedure, ...next }),
  )
  return ok(undefined)
}

export interface AaModifierInput {
  code: string
  factor: string
  /** A whole number of 0 or more. */
  units: number
}

/**
 * Add one of AA's own modifiers (US-05.1.5): office only, audited
 * `modifier.create`. The code must not clash with another AA row (RVG codes
 * may repeat; ids differ). The RVG rows are as printed and are not edited
 * here (Phase 42 loads and edits masters).
 */
export function addAaModifier(api: AppStoreApi, actor: Actor, input: AaModifierInput): Outcome<{ id: ModifierId }> {
  const plan = planAaModifierCreate(api.getState(), actor, input)
  if (!plan.ok) return plan
  mutate(api, actor, plan.value.metas, () => plan.value.next)
  return ok({ id: plan.value.id })
}

/** Plan one of AA's own modifiers (the seed load folds the same planner). */
export function planAaModifierCreate(state: AppState, actor: Actor, input: AaModifierInput, source?: PlanSource): Outcome<Plan> {
  if (actor.role !== 'office') return refuse('officeOnly', "Only the office can add AA's own modifiers.")
  const code = input.code.trim().replace(/\s+/g, ' ')
  const factor = input.factor.trim().replace(/\s+/g, ' ')
  if (code === '') return refuse('codeRequired', 'Enter a code.')
  if (code.length > 12) return refuse('codeTooLong', 'Keep the code to 12 characters or fewer.')
  if (factor === '') return refuse('factorRequired', 'Describe the modifying factor.')
  if (!Number.isInteger(input.units) || input.units < 0) return refuse('unitsInvalid', 'Units must be a whole number of 0 or more.')
  const clash = Object.values(state.masters.modifiers).some(
    (m) => m.source === 'aa' && m.code.toLowerCase() === code.toLowerCase(),
  )
  if (clash) return refuse('codeTaken', `AA already has a modifier ${code}.`)
  const alloc = allocateId(state.counters, 'modifier')
  const id = alloc.id
  const row: Modifier = {
    id,
    code,
    block: AA_OWN_BLOCK,
    factor,
    unitsAsPrinted: String(input.units),
    units: input.units,
    source: 'aa',
  }
  return ok({
    id,
    next: { ...slicesOf(state), masters: { ...state.masters, modifiers: { ...state.masters.modifiers, [id]: row } }, counters: alloc.counters },
    metas: withSource(
      [{ entityType: 'modifier', entityId: id, action: 'modifier.create', after: { code, factor, units: input.units }, stampBookingId: null }],
      source,
    ),
  })
}
