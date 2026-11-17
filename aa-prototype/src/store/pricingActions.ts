/**
 * Changing a Procedure's price (catch-up Phase 24; FT-05.4, US-03.5.1,
 * US-05.4.1, US-05.4.2, DM-14): the one store action that writes the typed
 * price, `enteredPrice`. Who may is the pure gates' (`procedurePrice.ts`):
 * - the anaesthetist on her own List until AUTHORISED (38a's `editRefusal`),
 *   then only on an RVG Contract whose override setting allows it, or the
 *   amount on No contract · Fixed price (`anaesthetistMayTypePrice`);
 * - the office on any Contract until AUTHORISED (D63), except a prepaid price
 *   once its prepayment invoice is raised (`officeMayChangePrice`, A16);
 * - an integration never.
 * No reason is asked. Every change is audited `procedure.price` with the
 * actor; the last change stands, neither side outranking the other (OQ-16).
 * `null` clears the typed price, so the price is computed again.
 */

import type { Procedure } from '../domain/types'
import {
  anaesthetistMayTypePrice,
  anaesthetistPriceRefusalMessage,
  INTEGRATION_PRICE_MESSAGE,
  officeMayChangePrice,
  typedPriceProblem,
  type AnaesthetistPriceRight,
} from '../domain/billing/procedurePrice'
import { OFFICE_TYPES_AMOUNT_MESSAGE } from '../domain/billing/contractRail'
import { mutate, ok, refuse, type Actor, type Outcome } from './mutate'
import type { AppState, AppStoreApi } from './appStore'
import { editRefusal } from './lifecycle'
import { procedureOn } from './contractSelectionActions'
import { prepaymentRaisedFor } from './selectors'


/** The anaesthetist's gate for this Procedure's Contract (`null`: no Contract yet). */
export function anaesthetistPriceRightFor(state: Pick<AppState, 'masters'>, procedure: Pick<Procedure, 'governingContractId'>): AnaesthetistPriceRight {
  const contract = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId] : undefined
  return anaesthetistMayTypePrice(contract)
}

/**
 * Whether this actor may change this Procedure's price now, as data: the
 * refusal the store would give, or null. The screens read it to decide
 * between an editable field and a read-only figure, so nothing pretends.
 */
export function priceChangeRefusal(state: AppState, actor: Actor, procedureId: string): Outcome<never> | null {
  const at = procedureOn(state, procedureId)
  if (!at.found) return at.refusal
  const { procedure, list } = at
  if (actor.source === 'integration') return refuse('integrationPrice', INTEGRATION_PRICE_MESSAGE)
  const rights = editRefusal(actor, list)
  if (rights !== null) return rights
  // A raised prepayment holds the price for everyone (A16, D30 narrowed), whatever Contract it is on now.
  const office = officeMayChangePrice({ prepaymentRaised: prepaymentRaisedFor(state, procedureId) })
  if (!office.may) return refuse('prepaidPriceRaised', office.message)
  if (actor.role === 'anaesthetist') {
    const right = anaesthetistPriceRightFor(state, procedure)
    if (right.may) return null
    if (right.reason === 'office') return refuse('officeTypesAmount', OFFICE_TYPES_AMOUNT_MESSAGE)
    const name = procedure.governingContractId !== undefined ? state.masters.contracts[procedure.governingContractId]?.name : undefined
    return refuse(right.reason === 'prepaid' ? 'pricePrepaid' : 'priceSetByContract', anaesthetistPriceRefusalMessage(name, right.reason))
  }
  return null
}

/** Set (or, with `null`, clear) a Procedure's typed price. */
export function setProcedurePrice(api: AppStoreApi, actor: Actor, procedureId: string, price: number | null): Outcome {
  const state = api.getState()
  const refused = priceChangeRefusal(state, actor, procedureId)
  if (refused !== null) return refused
  const problem = typedPriceProblem(price)
  if (problem !== null) return refuse('priceInvalid', problem)
  const procedure = state.schedule.procedures[procedureId] as Procedure
  const nextPrice = price ?? undefined
  if (nextPrice === procedure.enteredPrice) return ok(undefined)
  const next: Procedure = { ...procedure }
  if (nextPrice === undefined) delete next.enteredPrice
  else next.enteredPrice = nextPrice
  mutate(
    api,
    actor,
    {
      entityType: 'procedure',
      entityId: procedureId,
      action: 'procedure.price',
      before: { enteredPrice: procedure.enteredPrice ?? null },
      after: { enteredPrice: nextPrice ?? null },
    },
    (s) => ({ schedule: { ...s.schedule, procedures: { ...s.schedule.procedures, [procedureId]: next } } }),
  )
  return ok(undefined)
}
