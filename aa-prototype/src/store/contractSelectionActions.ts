/**
 * The step rail's writes (catch-up Phase 20; US-04.3.8, US-04.3.9, US-03.4.1,
 * FT-03.4): setting a Procedure's one Contract, keeping the answers so far,
 * and the amount typed on an open-price fallback. Every rule is the pure
 * module's (`domain/billing/contractRail.ts`); these actions add the edit
 * window (38a's `editRefusal`: the office and the anaesthetist on their own
 * ACTIVE and SUBMITTED Lists, nobody once AUTHORISED), the candidate guard and
 * one audited commit each.
 */

import type { Booking, ContractId, List, Procedure, RailAnswers } from '../domain/types'
import {
  NOT_A_CANDIDATE_MESSAGE,
  OFFICE_TYPES_AMOUNT_MESSAGE,
  PREPAID_OFFICE_ONLY_MESSAGE,
  applyContractChange,
  contractAllowedOn,
  contractChangeRefusal,
  mayTypeEnteredPrice,
  type RailActor,
} from '../domain/billing/contractRail'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal, getBooking, withRvgRowChange } from './lifecycle'
import { railContextForList, railMastersOf } from './selectors'
import { claimsAuditView } from '../domain/billing/modifiers'
import { refreshedInvoiceDescriptionFor } from '../domain/billing/procedureStack'

/** The rail's actor for a store actor: the anaesthetist, or the office (system and integration act as the office). */
export function railActorOf(actor: Actor): RailActor {
  return actor.role === 'anaesthetist' ? 'anaesthetist' : 'office'
}

/** A typed amount is dollars to the cent, 0 or more. */
function enteredPriceRefusal(amount: number | undefined): Outcome<never> | null {
  if (amount === undefined) return null
  if (!Number.isFinite(amount) || amount < 0 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) {
    return refuse('enteredPriceInvalid', 'Type the price in dollars and cents, 0 or more.')
  }
  return null
}

/**
 * Whether this actor may put this Contract on a Procedure on this List
 * (US-04.3.2, A17, A37): a known Contract; a candidate, No contract · RVG or
 * the fallback of a destination the List offers; the anaesthetist never onto
 * or off a prepaid Contract and typing only on No contract · Fixed price. A
 * Disabled Contract already on the Procedure is kept as it is (D81).
 */
export function contractPickRefusal(
  state: AppState,
  actor: Actor,
  list: List,
  current: Pick<Procedure, 'governingContractId'> | undefined,
  contractId: ContractId,
  opts: { enteredPrice?: number } = {},
): Outcome<never> | null {
  const contract = state.masters.contracts[contractId]
  if (contract === undefined) return refuse('contractUnknown', 'That Contract could not be found.')
  const typed = enteredPriceRefusal(opts.enteredPrice)
  if (typed !== null) return typed
  const kept = current?.governingContractId === contractId
  if (!kept && !contractAllowedOn(railMastersOf(state), railContextForList(state, list), contractId)) {
    return refuse('notACandidate', NOT_A_CANDIDATE_MESSAGE)
  }
  const limit = contractChangeRefusal(railActorOf(actor), state.masters, current?.governingContractId, contractId, opts)
  if (limit !== null) return refuse(limit.code, limit.message)
  if (opts.enteredPrice !== undefined && contract.pricing.kind !== 'open') {
    return refuse('notOpenPrice', 'Only an Other price takes a typed amount.')
  }
  return null
}

type ProcedureAt =
  | { found: false; refusal: Outcome<never> }
  | { found: true; procedure: Procedure; booking: Booking; list: List }

function procedureOn(state: AppState, procedureId: string): ProcedureAt {
  const procedure = state.schedule.procedures[procedureId]
  if (procedure === undefined) return { found: false, refusal: refuse('notFound', 'Procedure not found.') }
  const at = getBooking(state, procedure.bookingId)
  if (at === undefined) return { found: false, refusal: refuse('notFound', 'The procedure has no Booking.') }
  if (at.booking.cancellation !== undefined) {
    return { found: false, refusal: refuse('bookingCancelled', 'This Booking is cancelled. Its procedures cannot be changed.') }
  }
  return { found: true, procedure, booking: at.booking, list: at.list }
}

/**
 * Set a Procedure's one Contract (US-04.3.1, US-03.4.1): the answers so far
 * and any typed price cleared, the RVG code filled from the new Contract's
 * default only when empty, recorded RVG detail kept (19's row-change rule and
 * 19b's claim reconcile in the same commit). No reason is asked. One audited
 * `procedure.contract` entry with the Contract, RVG code and price before and
 * after; 21a flags an anaesthetist's change at review from it.
 */
export function setProcedureContract(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  contractId: ContractId,
  opts: { enteredPrice?: number; demoStage?: true } = {},
): Outcome {
  const state = api.getState()
  const at = procedureOn(state, procedureId)
  if (!at.found) return at.refusal
  const { procedure, list } = at
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  // Demo staging only (S4 Beat 3's "Trigger billing failure"): the demo
  // actions may store a known Contract that is not a candidate today, as a
  // Booking set up before its price lapsed would hold, so the run's "Needs a
  // price" can be shown. Nobody else bypasses the candidate guard.
  const staged = opts.demoStage === true && actor.source === 'demo' && state.masters.contracts[contractId] !== undefined
  if (opts.demoStage === true && !staged) return refuse('notACandidate', NOT_A_CANDIDATE_MESSAGE)
  if (!staged) {
    const refused = contractPickRefusal(state, actor, list, procedure, contractId, opts)
    if (refused !== null) return refused
  }
  // The same Contract with no new amount is no change: never clears an amount someone typed.
  if (procedure.governingContractId === contractId && (opts.enteredPrice === undefined || opts.enteredPrice === procedure.enteredPrice)) return ok(undefined)

  const change = applyContractChange(state.masters, procedure, contractId, opts.enteredPrice !== undefined ? { enteredPrice: opts.enteredPrice } : {})
  const row = withRvgRowChange(state, procedure, change)
  if (!row.ok) return row
  const patch = row.value.patch
  const reconciled = row.value.reconciled
  const next: Procedure = { ...procedure, ...patch, ...(reconciled ?? {}) }
  for (const key of Object.keys(patch) as (keyof Procedure)[]) {
    if (patch[key] === undefined) delete next[key]
  }
  // The invoice description follows the Contract's (US-08.4.6, D37) unless the office edited it (D73).
  next.invoiceDescription = refreshedInvoiceDescriptionFor(next, state.masters.contracts)

  const view = (p: Procedure) => ({
    governingContractId: p.governingContractId,
    rvgGroupId: p.rvgGroupId,
    enteredPrice: p.enteredPrice,
    priceOverride: p.priceOverride,
    railAnswers: p.railAnswers,
    invoiceDescription: p.invoiceDescription?.text ?? null,
  })
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.contract',
      before: { ...view(procedure), ...(reconciled !== null ? claimsAuditView(procedure, state.masters.modifiers) : {}) },
      after: { ...view(next), ...(reconciled !== null ? claimsAuditView(next, state.masters.modifiers) : {}) },
    },
    (s) => ({
      schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } },
    }),
  )
  return ok(undefined)
}

/**
 * Keep the answers so far on a Procedure with no Contract (US-04.3.8), so the
 * other side carries on from them. Audited `procedure.railAnswers`. A
 * Procedure with a Contract keeps none: it is refused, unless
 * `releaseContract` is set: an answer that no longer leads to the Contract
 * releases it (owner review, 2026-11-16: every answer is saved as it is given,
 * so the other side sees how far the choice has got). The release is audited as
 * a `procedure.contract` change; the RVG code stays, a typed price goes with
 * its Contract. Only the office takes a Procedure off a prepaid Contract.
 */
export function setRailAnswers(
  api: AppStoreApi,
  actor: Actor,
  procedureId: string,
  answers: RailAnswers | undefined,
  opts: { releaseContract?: true } = {},
): Outcome {
  const state = api.getState()
  const at = procedureOn(state, procedureId)
  if (!at.found) return at.refusal
  const { procedure, list } = at
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  if (procedure.governingContractId !== undefined) {
    if (opts.releaseContract !== true) return refuse('contractSet', 'This procedure already has a Contract. Change it on the step rail.')
    const was = state.masters.contracts[procedure.governingContractId]
    if (actor.role === 'anaesthetist' && was?.prepaid === true) return refuse('prepaidOfficeOnly', PREPAID_OFFICE_ONLY_MESSAGE)
    if (actor.role === 'anaesthetist' && answers?.destination === 'patient' && answers.narrow === 'prepaid') {
      return refuse('prepaidOfficeOnly', PREPAID_OFFICE_ONLY_MESSAGE)
    }
    const next: Procedure = { ...procedure }
    delete next.governingContractId
    delete next.enteredPrice
    if (answers === undefined) delete next.railAnswers
    else next.railAnswers = answers
    next.invoiceDescription = refreshedInvoiceDescriptionFor(next, state.masters.contracts)
    const view = (p: Procedure) => ({
      governingContractId: p.governingContractId,
      enteredPrice: p.enteredPrice,
      railAnswers: p.railAnswers,
      invoiceDescription: p.invoiceDescription?.text ?? null,
    })
    mutate(
      api,
      actor,
      { entityType: 'procedure', entityId: procedureId, action: 'procedure.contract', before: view(procedure), after: view(next) },
      (s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } } }),
    )
    return ok(undefined)
  }
  // The anaesthetist is never on Prepaid (A17).
  if (actor.role === 'anaesthetist' && answers?.destination === 'patient' && answers.narrow === 'prepaid') {
    return refuse('prepaidOfficeOnly', PREPAID_OFFICE_ONLY_MESSAGE)
  }
  if (JSON.stringify(answers) === JSON.stringify(procedure.railAnswers)) return ok(undefined)
  const next: Procedure = { ...procedure }
  if (answers === undefined) delete next.railAnswers
  else next.railAnswers = answers
  mutate(
    api,
    actor,
    { entityType: 'procedure', entityId: procedureId, action: 'procedure.railAnswers', before: { railAnswers: procedure.railAnswers }, after: { railAnswers: answers } },
    (s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } } }),
  )
  return ok(undefined)
}

/**
 * The amount typed on a Procedure's open-price fallback (US-04.3.9): the
 * office on any, the anaesthetist only on No contract · Fixed price. INTERIM
 * `enteredPrice` until Phase 24. Audited `procedure.enteredPrice`.
 */
export function setEnteredPrice(api: AppStoreApi, actor: Actor, procedureId: string, amount: number | undefined): Outcome {
  const state = api.getState()
  const at = procedureOn(state, procedureId)
  if (!at.found) return at.refusal
  const { procedure, list } = at
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  if (contract === undefined || contract.pricing.kind !== 'open') {
    return refuse('notOpenPrice', 'Only an Other price takes a typed amount.')
  }
  if (!mayTypeEnteredPrice(railActorOf(actor), contract, state.masters.parties)) {
    return refuse('officeTypesAmount', OFFICE_TYPES_AMOUNT_MESSAGE)
  }
  const typed = enteredPriceRefusal(amount)
  if (typed !== null) return typed
  if (amount === procedure.enteredPrice) return ok(undefined)
  const next: Procedure = { ...procedure }
  if (amount === undefined) delete next.enteredPrice
  else next.enteredPrice = amount
  mutate(
    api,
    actor,
    { entityType: 'procedure', entityId: procedureId, action: 'procedure.enteredPrice', before: { enteredPrice: procedure.enteredPrice }, after: { enteredPrice: amount } },
    (s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } } }),
  )
  return ok(undefined)
}
