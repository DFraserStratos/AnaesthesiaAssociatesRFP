/**
 * The payer on each Procedure: its identity, the offer to the Booking's other
 * Procedures, and the copy rule for a Procedure added later, in one place
 * (catch-up Phase 22a; US-11.2.2, US-08.2.1, DM-11; D85). Pure.
 *
 * Identity, never matching: a payer is the patient, or another payer by its
 * `BP####` id. A payer copied to another Procedure keeps its id and is the
 * same payer; a payer typed in separately is a new id even with the same name
 * and email. Names and emails are never compared here.
 *
 * PROVISIONAL (OQ-140, D85): a payer on each Procedure, with a change offered
 * to the Booking's other Procedures holding the same payer, each ticked by
 * default and never forced. This module and `setProcedurePayer` are where a
 * different answer lands: going back to one payer per Booking is the offer
 * always applying to every Procedure.
 */

import type { Contract, CounterpartyRef, Procedure, ProcedurePayer } from '../types'
import { isPayerBilled } from './whoIsBilled'

/** The words of the one provisional label, shown on the offer (OQ-140). */
export const PAYER_OFFER_PROVISIONAL = 'Provisional, OQ-140'

/**
 * A payer's identity: `patient:<patientId>` or `payer:<BP id>`, the same
 * `kind:id` key the invoice build groups by (`payerCounterparty`). Never a
 * name or an email.
 */
export function payerKey(payer: ProcedurePayer, patientId: string): string {
  return payer.kind === 'other' ? `payer:${payer.id}` : `patient:${patientId}`
}

/** The key of a counterparty reference (`kind:id`), comparable with `payerKey`. */
export function refKey(ref: CounterpartyRef): string {
  return `${ref.kind}:${ref.id}`
}

type ContractsById = Readonly<Record<string, Pick<Contract, 'billsTo'>>>

/** True when the Procedure's Contract bills its holder (so its payer is never invoiced). A Procedure with no Contract yet is not. */
function billsItsHolder(procedure: Pick<Procedure, 'governingContractId'>, contracts: ContractsById): boolean {
  const contract = procedure.governingContractId !== undefined ? contracts[procedure.governingContractId] : undefined
  return contract !== undefined && !isPayerBilled(contract)
}

/**
 * The Procedures a payer change on `changedId` is offered on (US-11.2.2
 * "Change offered to the others"): the Booking's other Procedures holding the
 * same payer identity, leaving out those whose Contract bills its holder; a
 * Procedure with no Contract yet is included (our reading). Booking order.
 */
export function payerOfferFor<P extends Pick<Procedure, 'id' | 'payer' | 'governingContractId'>>(
  procedures: readonly P[],
  changedId: string,
  contracts: ContractsById,
  patientId: string,
): P[] {
  const changed = procedures.find((p) => p.id === changedId)
  if (changed === undefined) return []
  const key = payerKey(changed.payer, patientId)
  return procedures.filter((p) => p.id !== changedId && payerKey(p.payer, patientId) === key && !billsItsHolder(p, contracts))
}

/**
 * The payer a Procedure added later takes (US-11.2.2 "Procedure added later";
 * the one copy rule): the payer of the Booking's Procedures that bill the
 * payer when they all share one identity, copied with its id and details;
 * otherwise the patient. A Procedure with no Contract yet counts with those
 * that bill the payer (our reading, as the offer); holder-billed ones never
 * count.
 */
export function payerForNewProcedure(
  procedures: readonly Pick<Procedure, 'payer' | 'governingContractId'>[],
  contracts: ContractsById,
  patientId: string,
): ProcedurePayer {
  const billed = procedures.filter((p) => !billsItsHolder(p, contracts))
  const first = billed[0]
  if (first === undefined) return { kind: 'patient' }
  const key = payerKey(first.payer, patientId)
  if (!billed.every((p) => payerKey(p.payer, patientId) === key)) return { kind: 'patient' }
  return first.payer
}
