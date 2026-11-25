/**
 * "Payer loses billing email" (build plan Phase 60, item 9; US-13.3.1,
 * US-13.3.2, D116): the body of the Billing tab's demo trigger. The registry
 * entry is added at Wave 5's join (D111); this file holds what it calls.
 *
 * It picks a Booking about to be billed whose payer can be reached now, clears
 * that payer's billing email and postal address where the payer is held (a
 * holder Party, the patient, or another payer typed on the Booking's
 * Procedures) in one audited write, then bills the List. Under D116 the run
 * fails that Booking whole (`payerNoAddress`), so it shows in the Billing
 * tab's Problems until the office fixes the payer and retries.
 *
 * Authorising a List bills it at once (`wireBillingRun` listens for
 * `listAuthorised`), so the seed holds no authorised, unbilled List, and every
 * seeded SUBMITTED List is one a scripted beat or another demo uses. So the
 * target is normally a finished ACTIVE List (its day gone, every Booking
 * complete), which the simulated office submits and authorises through the
 * normal lifecycle so the run fires; an authorised, unbilled List (a refused
 * run) or a free SUBMITTED List is preferred when one exists. Lists a scripted
 * beat, another trigger or a seeded checklist state uses are never picked, nor
 * the backdrop. Within a step, a Booking billed to a person (the patient or
 * another payer) comes before one billed to a holder Party, since clearing a
 * Party's details would fail every later Booking billed to it; then the first
 * by Booking id.
 *
 * The writes (the clear, then submit, authorise and run) live in
 * `store/demoPayerContact.ts`; this file picks the Booking, says why the
 * trigger is disabled, and holds the registry entry's fixed fields.
 *
 * PWA-pure: no `apps/` import (the Billing tab's address is literal, as in
 * `registry.ts`). Deterministic: no clock or randomness of its own.
 */

import type { AppState, AppStoreApi } from '../../store/appStore'
import type { Booking, CounterpartyRef, List, Procedure } from '../../domain/types'
import { authoriseBlockersFor } from '../../store/lifecycle'
import { PAYER_CONTACT_CLEARED_ACTION, stagePayerContactLoss, type PayerContactHolder, type PayerContactLossTarget } from '../../store/demoPayerContact'
import { isBackdropList } from '../../domain/conflicts'
import { billablePartyForProcedure, invoiceDeliveryFor, partyForCounterparty } from '../../domain/billing/whoIsBilled'
import { SCRIPTED_BEAT_SCHEDULE, SEED_LIST_IDS, SEED_LOOKBACK, SEED_MARKERS } from '../../domain/seed'

export { PAYER_CONTACT_CLEARED_ACTION }

/** The Billing tab's address (`financePath('billing')`), literal because `src/shared/` never imports `apps/`. */
const FINANCES_BILLING_PATH = '/admin/finances/billing'

/** The registry entry's fixed fields, for the join to use (screen: `FINANCES_BILLING_SCREEN`, routes: `[FINANCES_BILLING]`). */
export const PAYER_LOSES_BILLING_EMAIL = {
  id: 'payer-loses-billing-email',
  label: 'Payer loses billing email',
  description:
    "Clears the billing email and postal address of the payer of a finished Booking not yet billed, then the simulated office submits and authorises its List. The run fails that Booking whole: it shows in the Billing tab's Problems until Fix the payer, then Retry, bills it.",
  surfaces: ['bar'] as const,
  indexPath: (): string => FINANCES_BILLING_PATH,
} as const

export const PAYER_LOSES_BILLING_EMAIL_DONE =
  'Done. In the Billing tab the Booking failed: its payer has no billing email or postal address. Fix the payer, then Retry.'

export const PAYER_LOSES_BILLING_EMAIL_ALREADY = 'Already triggered.'
export const PAYER_LOSES_BILLING_EMAIL_NONE = 'No Booking about to be billed has a payer with a billing email or postal address.'

/** Who is billed for the target Booking, as that payer is held. */
export type PayerLosesBillingEmailPayer = PayerContactHolder

export type PayerLosesBillingEmailTarget = PayerContactLossTarget

/** Lists a scripted beat or another trigger relies on: never picked. */
const RESERVED_LISTS: ReadonlySet<string> = new Set<string>([...SCRIPTED_BEAT_SCHEDULE.listIds, ...Object.values(SEED_LIST_IDS), SEED_LOOKBACK.listId])

/** How far the List is from billing: authorised and unbilled, SUBMITTED, or ACTIVE and finished (its day gone). */
type ListStep = 'authorised' | 'submitted' | 'finished'
const STEP_RANK: Readonly<Record<ListStep, number>> = { authorised: 0, submitted: 2, finished: 4 }

function listStep(list: List, todayISO: string): ListStep | undefined {
  if (isBackdropList(list) || RESERVED_LISTS.has(list.id)) return undefined
  if (list.state === 'AUTHORISED' && list.billedAtISO === undefined) return 'authorised'
  if (list.state === 'SUBMITTED') return 'submitted'
  if (list.state === 'ACTIVE' && list.dateISO < todayISO) return 'finished'
  return undefined
}

/** Lists holding a seeded checklist state (a `/demo/data` marker on the List or on one of its Bookings): never picked. */
function markedLists(state: AppState): Set<string> {
  const out = new Set<string>()
  for (const m of Object.values(SEED_MARKERS)) {
    if (m.entityType === 'list') out.add(m.entityId)
    if (m.entityType === 'booking') {
      const listId = state.schedule.bookings[m.entityId]?.listId
      if (listId !== undefined) out.add(listId)
    }
  }
  return out
}

function sameRef(a: CounterpartyRef, b: CounterpartyRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

/**
 * The one payer a Booking bills, by the who-is-billed rule, with delivery
 * read live; undefined when its Procedures bill more than one party, one is
 * split, one has no Contract, or the payer cannot be reached already.
 */
function reachablePayer(state: AppState, booking: Booking, procedures: readonly Procedure[]): PayerLosesBillingEmailPayer | undefined {
  if (procedures.length === 0) return undefined
  let ref: CounterpartyRef | undefined
  for (const p of procedures) {
    if (p.split !== undefined) return undefined
    const contract = p.governingContractId !== undefined ? state.masters.contracts[p.governingContractId] : undefined
    const billed = billablePartyForProcedure(contract, p, booking.patientId, state.masters.parties)
    if (billed === undefined) return undefined
    if (ref === undefined) ref = billed
    else if (!sameRef(ref, billed)) return undefined
  }
  if (ref === undefined) return undefined
  const patient = state.masters.patients[booking.patientId]
  if (invoiceDeliveryFor(ref, procedures, booking.patientId, patient, state.masters.parties).method === 'none') return undefined
  if (ref.kind === 'patient') return { kind: 'patient', patientId: booking.patientId }
  if (ref.kind === 'payer') {
    const payerId = ref.id
    return { kind: 'payer', payerId, procedureIds: procedures.filter((p) => p.payer.kind === 'other' && p.payer.id === payerId).map((p) => p.id) }
  }
  const party = partyForCounterparty(ref, state.masters.parties)
  if (party === undefined || party.kind === 'aa') return undefined
  return { kind: 'party', partyId: party.id }
}

/**
 * The Booking the trigger fails, on a List the run has not billed: an
 * authorised, unbilled List first, else a SUBMITTED List ready to authorise,
 * else a finished ACTIVE List ready to submit and authorise. Not cancelled,
 * every Booking on its List complete, its single payer reachable now. Within a
 * step, a person payer before a holder Party, then the first by Booking id.
 * Undefined when none qualifies.
 */
export function payerLosesBillingEmailTarget(state: AppState): PayerLosesBillingEmailTarget | undefined {
  const steps = new Map<string, ListStep>()
  for (const list of Object.values(state.schedule.lists)) {
    const step = listStep(list, state.clock.todayISO)
    if (step !== undefined) steps.set(list.id, step)
  }
  for (const listId of markedLists(state)) steps.delete(listId)
  if (steps.size === 0) return undefined

  // One pass over Bookings and one over Procedures, then each List's gate once (practice scale: never a scan per Booking).
  const onLists: Booking[] = []
  const incompleteLists = new Set<string>()
  for (const b of Object.values(state.schedule.bookings)) {
    if (!steps.has(b.listId) || b.cancellation !== undefined) continue
    if (!b.completed) incompleteLists.add(b.listId)
    onLists.push(b)
  }
  const proceduresOf = new Map<string, Procedure[]>(onLists.map((b) => [b.id, []]))
  for (const p of Object.values(state.schedule.procedures)) proceduresOf.get(p.bookingId)?.push(p)

  const ranked: { target: PayerLosesBillingEmailTarget; rank: number }[] = []
  for (const booking of onLists) {
    const step = steps.get(booking.listId)!
    if (step !== 'authorised' && incompleteLists.has(booking.listId)) continue
    const payer = reachablePayer(state, booking, proceduresOf.get(booking.id) ?? [])
    if (payer === undefined) continue
    ranked.push({ target: { listId: booking.listId, bookingId: booking.id, payer }, rank: STEP_RANK[step] + (payer.kind === 'party' ? 1 : 0) })
  }
  ranked.sort((a, b) => a.rank - b.rank || a.target.bookingId.localeCompare(b.target.bookingId, 'en', { numeric: true }))

  const authorisable = new Map<string, boolean>()
  for (const { target } of ranked) {
    if (steps.get(target.listId) === 'authorised') return target
    let ready = authorisable.get(target.listId)
    if (ready === undefined) {
      ready = authoriseBlockersFor(state, target.listId).length === 0
      authorisable.set(target.listId, ready)
    }
    if (ready) return target
  }
  return undefined
}

/** True once the trigger has run (its audit entry is there); newest first, so a fresh run is found at once. */
function alreadyStaged(state: Pick<AppState, 'audit'>): boolean {
  for (let i = state.audit.length - 1; i >= 0; i--) if (state.audit[i]!.action === PAYER_CONTACT_CLEARED_ACTION) return true
  return false
}

/** The reason the trigger cannot run: it already ran (its List is billed), or no Booking qualifies. Undefined when it can. */
export function payerLosesBillingEmailDisabledReason(state: AppState): string | undefined {
  if (alreadyStaged(state)) return PAYER_LOSES_BILLING_EMAIL_ALREADY
  return payerLosesBillingEmailTarget(state) === undefined ? PAYER_LOSES_BILLING_EMAIL_NONE : undefined
}

/**
 * Stage the failure: pick the Booking, then the store's writes
 * (`stagePayerContactLoss`): clear its payer's billing email and postal
 * address in one audited `mutate`, then the simulated office submits and
 * authorises the List and the run bills it. A refused step's message is
 * returned.
 */
export function stagePayerLosesBillingEmail(api: AppStoreApi): { ok: boolean; message: string } {
  const state = api.getState()
  if (alreadyStaged(state)) return { ok: false, message: PAYER_LOSES_BILLING_EMAIL_ALREADY }
  const target = payerLosesBillingEmailTarget(state)
  if (target === undefined) return { ok: false, message: PAYER_LOSES_BILLING_EMAIL_NONE }
  const staged = stagePayerContactLoss(api, target)
  return staged.ok ? { ok: true, message: PAYER_LOSES_BILLING_EMAIL_DONE } : { ok: false, message: staged.message }
}
