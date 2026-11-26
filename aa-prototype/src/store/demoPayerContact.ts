/**
 * "Payer loses billing email" (build plan Phase 60, item 9; US-13.3.1,
 * US-13.3.2, D116): the demo trigger's writes. The trigger body
 * (`shared/demoTriggers/payerLosesBillingEmail.ts`) picks the Booking; this
 * clears its payer's billing email and postal address where the payer is held
 * (a holder Party, the patient with the fill-ins typed on the Booking's
 * Procedures, or another payer on those Procedures) in one `mutate` as the
 * demo actor, then bills the List through the lifecycle: the simulated office
 * submits a finished ACTIVE List and authorises it, and the wired run bills it
 * (a store without the wiring, or a List already authorised, is billed here).
 * Under D116 the run fails that Booking whole (`payerNoAddress`).
 */

import type { Procedure, ProcedurePayer } from '../domain/types'
import { mutate, ok, refuse, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList } from './billingRun'
import { handoffListPairs } from './xeroHandoff'
import { DEMO_TRIGGER_ACTOR, OFFICE_SIMULATION_ACTOR } from './demoActors'

/** The audit action code the clear writes (one entry per record changed). */
export const PAYER_CONTACT_CLEARED_ACTION = 'demo.payerContactCleared'

/** Who is billed for the Booking, as that payer is held. */
export type PayerContactHolder =
  | { kind: 'party'; partyId: string }
  | { kind: 'patient'; patientId: string }
  | { kind: 'payer'; procedureIds: string[]; payerId: string }

export interface PayerContactLossTarget {
  listId: string
  bookingId: string
  payer: PayerContactHolder
}

/** A record without its billing email and postal address. */
function withoutContact<P extends { email?: string; postalAddress?: unknown }>(held: P): P {
  const { email: _email, postalAddress: _address, ...rest } = held
  return rest as P
}

function contactOf(held: { email?: string; postalAddress?: unknown }): { email?: string; postalAddress?: unknown } {
  return { ...(held.email !== undefined ? { email: held.email } : {}), ...(held.postalAddress !== undefined ? { postalAddress: held.postalAddress } : {}) }
}

/** The patient's fill-ins typed on a Procedure (its payer is the patient), cleared too: the run reads them when the record has none. */
function clearedPatientPayer(payer: ProcedurePayer): ProcedurePayer | undefined {
  if (payer.kind !== 'patient' || (payer.email === undefined && payer.postalAddress === undefined)) return undefined
  return withoutContact(payer)
}

/**
 * Clear the payer's billing email and postal address in one `mutate`
 * (`DEMO_TRIGGER_ACTOR`, audited `demo.payerContactCleared` per record, no
 * Booking stamp). Refuses `notFound` when there is nothing to clear.
 */
export function clearPayerContact(api: AppStoreApi, target: PayerContactLossTarget): Outcome {
  const state = api.getState()
  const { payer, bookingId, listId } = target
  const procedures = Object.values(state.schedule.procedures).filter((p) => p.bookingId === bookingId)
  const metas: MutationMeta[] = []
  const after = { email: '', postalAddress: '', bookingId, listId }
  const procedureEdits: Record<string, Procedure> = {}

  if (payer.kind === 'payer') {
    for (const p of procedures) {
      if (p.payer.kind !== 'other' || p.payer.id !== payer.payerId) continue
      procedureEdits[p.id] = { ...p, payer: withoutContact(p.payer) }
      metas.push({
        entityType: 'procedure',
        entityId: p.id,
        action: 'demo.payerContactCleared',
        before: { payerId: payer.payerId, ...contactOf(p.payer) },
        after: { payerId: payer.payerId, ...after },
        stampBookingId: null,
      })
    }
  }
  if (payer.kind === 'patient') {
    const patient = state.masters.patients[payer.patientId]
    if (patient !== undefined) {
      metas.push({ entityType: 'patient', entityId: payer.patientId, action: 'demo.payerContactCleared', before: contactOf(patient), after, stampBookingId: null })
    }
    for (const p of procedures) {
      const cleared = clearedPatientPayer(p.payer)
      if (cleared === undefined) continue
      procedureEdits[p.id] = { ...p, payer: cleared }
      metas.push({
        entityType: 'procedure',
        entityId: p.id,
        action: 'demo.payerContactCleared',
        before: { payer: 'patient', ...contactOf(p.payer) },
        after: { payer: 'patient', ...after },
        stampBookingId: null,
      })
    }
  }
  if (payer.kind === 'party') {
    const party = state.masters.parties[payer.partyId]
    if (party !== undefined) {
      metas.push({ entityType: 'party', entityId: party.id, action: 'demo.payerContactCleared', before: contactOf(party), after, stampBookingId: null })
    }
  }
  if (metas.length === 0) return refuse('notFound', 'The payer is no longer on this Booking.')

  mutate(api, DEMO_TRIGGER_ACTOR, metas, (s) => {
    const patient = payer.kind === 'patient' ? s.masters.patients[payer.patientId] : undefined
    const party = payer.kind === 'party' ? s.masters.parties[payer.partyId] : undefined
    const masters =
      payer.kind === 'patient' && patient !== undefined
        ? { ...s.masters, patients: { ...s.masters.patients, [payer.patientId]: withoutContact(patient) } }
        : payer.kind === 'party' && party !== undefined
          ? { ...s.masters, parties: { ...s.masters.parties, [payer.partyId]: withoutContact(party) } }
          : s.masters
    const schedule = Object.keys(procedureEdits).length > 0 ? { ...s.schedule, procedures: { ...s.schedule.procedures, ...procedureEdits } } : s.schedule
    return { masters, schedule }
  })
  return ok(undefined)
}

/**
 * Bill the List through the lifecycle as the simulated office: submit it when
 * ACTIVE, authorise it when SUBMITTED (the wired run bills it), and run billing
 * here when it is still unbilled (no wiring, or already authorised). Each
 * step's refusal is returned unchanged.
 */
export function billListAsSimulatedOffice(api: AppStoreApi, listId: string): Outcome {
  if (api.getState().schedule.lists[listId]?.state === 'ACTIVE') {
    const submitted = submitList(api, OFFICE_SIMULATION_ACTOR, listId)
    if (!submitted.ok) return submitted
  }
  if (api.getState().schedule.lists[listId]?.state === 'SUBMITTED') {
    const authorised = authoriseList(api, OFFICE_SIMULATION_ACTOR, listId)
    if (!authorised.ok) return authorised
  }
  if (api.getState().schedule.lists[listId]?.billedAtISO === undefined) {
    const run = runBillingForList(api, listId)
    if (!run.ok) return run
    handoffListPairs(api, listId)
  }
  return ok(undefined)
}

/** The trigger's writes in order: clear the payer's contact, then bill the List. */
export function stagePayerContactLoss(api: AppStoreApi, target: PayerContactLossTarget): Outcome {
  const cleared = clearPayerContact(api, target)
  if (!cleared.ok) return cleared
  return billListAsSimulatedOffice(api, target.listId)
}
