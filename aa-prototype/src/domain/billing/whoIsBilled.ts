/**
 * Who is billed, in one place (catch-up Phase 21; FT-11.2, US-11.2.1,
 * US-11.2.2, US-11.2.3, US-11.2.4; DM-11; OQ-67 and D17, OQ-78; AR-61
 * `#who-is-billed`, AR-44 `#bill-holder`, `#bill-payer`, `#payer`).
 *
 * Each Procedure's Contract decides: a Contract set to bill its holder bills
 * the holder Party; any other Contract bills the Procedure's own payer
 * (catch-up Phase 22a: the payer moved from the Booking onto each Procedure,
 * D85, provisional on OQ-140; its identity, offer and copy rule are in
 * `procedurePayer.ts`).
 * So No contract · RVG, No contract · Fixed price, a surgeon's fixed price,
 * an anaesthetist's own Contract and every prepaid Contract bill the payer.
 * The Contract's `billsTo` is the only input: this module never reads a
 * price, the Booking's funder or a holder's kind. Phase 18's Contract rules
 * already force "bills the payer" on every prepaid Contract and on one held by
 * AA or an anaesthetist (`billsPayerOnly`; OQ-73 at Confirm, D23, AR-58 A2 and
 * A40), so this module needs no rule of its own for them.
 *
 * The billing run, 20a's "who is invoiced", Review, the invoice, Xero and the
 * warnings all read `billablePartyForProcedure`; nothing else decides who is
 * billed. If OQ-78 reopens, this file and `setProcedurePayer` are the places
 * that change.
 *
 * Where this follows Greg's v6 field names: v6's "alternate payer" flag and
 * payer contact fields on the booking procedure are the Procedure's `payer`
 * here (kind `other` is the flag set); v6's contract holder "is billed"
 * setting is each Contract's `billsTo` (Donald, D2).
 */

import type { Contract, CounterpartyRef, InvoiceBilledTo, OtherPayer, Patient, PostalAddress, Procedure, ProcedurePayer, SplitShare } from '../types'
import type { Party } from './parties'
import { ageInCompletedYears } from './modifiers'
import { isEmailShaped, isValidPostalAddress, postalAddressLines } from './payer'

/** The counterparty a holder Party is billed as: its billing identity, a hospital as its hospital, else the Party itself. */
export function holderCounterparty(party: Party): CounterpartyRef {
  if (party.billingIdentity !== undefined) return party.billingIdentity
  if (party.kind === 'hospital' && party.hospitalId !== undefined) return { kind: 'hospital', id: party.hospitalId }
  return { kind: 'party', id: party.id }
}

/** The Party a holder counterparty stands for (the reverse of `holderCounterparty`); undefined for a payer or patient. */
export function partyForCounterparty(ref: CounterpartyRef, parties: Readonly<Record<string, Party>>): Party | undefined {
  if (ref.kind === 'patient' || ref.kind === 'payer') return undefined
  if (ref.kind === 'party') return parties[ref.id]
  return Object.values(parties).find((p) => {
    const cp = holderCounterparty(p)
    return cp.kind === ref.kind && cp.id === ref.id
  })
}

/** The Procedure's payer as a counterparty: the patient, or the other payer by its `BP####` id (identity, never a name). */
export function payerCounterparty(procedure: Pick<Procedure, 'payer'>, patientId: string): CounterpartyRef {
  return procedure.payer.kind === 'other' ? { kind: 'payer', id: procedure.payer.id } : { kind: 'patient', id: patientId }
}

/** The sentence when a Contract that bills its holder names a Party that no longer exists (the validator and the run share it). */
export const HOLDER_MISSING_MESSAGE = "This Contract's holder no longer exists. Choose another Contract."

/** The holder counterparty of a Contract that bills its holder; undefined for one that bills the payer, or a missing holder. */
export function holderBilledFor(
  contract: Pick<Contract, 'billsTo' | 'holderId'> | undefined,
  parties: Readonly<Record<string, Party>>,
): CounterpartyRef | undefined {
  if (contract === undefined || contract.billsTo !== 'holder') return undefined
  const holder = parties[contract.holderId]
  return holder === undefined ? undefined : holderCounterparty(holder)
}

/** True when the Contract bills the Procedure's payer (it is set and does not bill its holder). */
export function isPayerBilled(contract: Pick<Contract, 'billsTo'> | undefined): boolean {
  return contract !== undefined && contract.billsTo !== 'holder'
}

/**
 * Who a Procedure bills (the one rule): the Contract's holder Party when the
 * Contract bills its holder; otherwise the Procedure's own payer. Undefined
 * with no Contract ("Needs an invoice destination") or a holder that no longer
 * exists. A fee split (catch-up Phase 22) adds parties for that one Procedure
 * on top of this; it never changes who the Contract bills.
 */
export function billablePartyForProcedure(
  contract: Pick<Contract, 'billsTo' | 'holderId'> | undefined,
  procedure: Pick<Procedure, 'payer'>,
  patientId: string,
  parties: Readonly<Record<string, Party>>,
): CounterpartyRef | undefined {
  if (contract === undefined) return undefined
  if (contract.billsTo === 'holder') return holderBilledFor(contract, parties)
  return payerCounterparty(procedure, patientId)
}

/**
 * A person rather than an organisation: the patient or another payer named on
 * a Procedure (a family trust named as payer counts), never a holder Party.
 * Phase 27 reads it for prepayment.
 */
export function isPersonParty(ref: CounterpartyRef | undefined): boolean {
  return ref !== undefined && (ref.kind === 'patient' || ref.kind === 'payer')
}

/** The payer's details as shown and invoiced. */
export interface PayerDetails {
  /** True when the tick is clear and the patient pays. */
  isPatient: boolean
  name: string
  /** "Patient", or the other payer's relationship where given. */
  relationship?: string
  email?: string
  postalAddress?: PostalAddress
  phone?: string
}

/**
 * The payer's details: for the patient, the patient record's name, email and
 * postal address, each filled from the value typed on the Procedure where the
 * record has none; for another payer, the details held on the Procedure.
 */
export function payerDetails(payer: ProcedurePayer, patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined): PayerDetails {
  if (payer.kind === 'other') {
    return {
      isPatient: false,
      name: payer.name,
      ...(payer.relationship !== undefined ? { relationship: payer.relationship } : {}),
      ...(payer.email !== undefined ? { email: payer.email } : {}),
      ...(payer.postalAddress !== undefined ? { postalAddress: payer.postalAddress } : {}),
      ...(payer.phone !== undefined ? { phone: payer.phone } : {}),
    }
  }
  // A well-formed email on the record wins; else one typed for this Booking (a malformed record email never hides it).
  const email = (isEmailShaped(patient?.email) ? patient?.email : undefined) ?? nonBlank(payer.email) ?? nonBlank(patient?.email)
  const postalAddress = patient?.postalAddress ?? payer.postalAddress
  return {
    isPatient: true,
    name: patient?.name ?? 'The patient',
    relationship: 'Patient',
    ...(email !== undefined ? { email } : {}),
    ...(postalAddress !== undefined ? { postalAddress } : {}),
    ...(patient?.phone !== undefined && patient.phone !== '' ? { phone: patient.phone } : {}),
  }
}

/**
 * The details of the person an invoice is addressed to, by the invoice's own
 * counterparty, read from the payers of the invoice's own Procedures: a
 * `patient` invoice is the patient (with the fill-ins typed on a Procedure
 * whose payer is the patient, else the record alone); a `payer` invoice is
 * the other payer one of those Procedures holds by that id. Undefined
 * otherwise (a holder, or a payer no longer on those Procedures), so a split
 * line to the patient never carries another payer's contact. Resolved by id,
 * never by name or email.
 */
export function personDetailsFor(
  ref: CounterpartyRef,
  procedures: readonly Pick<Procedure, 'payer' | 'split'>[],
  patientId: string,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
): PayerDetails | undefined {
  if (ref.kind === 'patient') {
    if (ref.id !== patientId) return undefined
    const own = procedures.find((p) => p.payer.kind === 'patient')?.payer
    return payerDetails(own ?? { kind: 'patient' }, patient)
  }
  if (ref.kind === 'payer') {
    const held = otherPayerHeld(procedures, ref.id)
    return held !== undefined ? payerDetails(held, patient) : undefined
  }
  return undefined
}

/**
 * The other payer these Procedures hold by this id: a Procedure's payer, or a
 * split share's "another person" (catch-up Phase 22a). By id, never by name.
 */
export function otherPayerHeld(procedures: readonly Pick<Procedure, 'payer' | 'split'>[], payerId: string): OtherPayer | undefined {
  for (const p of procedures) if (p.payer.kind === 'other' && p.payer.id === payerId) return p.payer
  for (const p of procedures) {
    const person = p.split?.shares.find((s) => s.person?.id === payerId)?.person
    if (person !== undefined) return person
  }
  return undefined
}

/** True when the payer can be reached: an email, or a postal address in the NZ Post standard (D70's default: post alone is enough). */
export function payerHasContact(details: Pick<PayerDetails, 'email' | 'postalAddress'>): boolean {
  return isEmailShaped(details.email) || isValidPostalAddress(details.postalAddress)
}

/**
 * True when every Procedure has a Contract and each bills its holder, so no
 * Procedure's payer is invoiced for anything (a Booking still waiting on a
 * Contract is not this: who is invoiced is not known yet).
 */
export function onlyHoldersBilled(
  procedures: readonly Pick<Procedure, 'governingContractId'>[],
  contracts: Readonly<Record<string, Pick<Contract, 'billsTo'>>>,
): boolean {
  return (
    procedures.length > 0 &&
    procedures.every((p) => {
      const c = p.governingContractId !== undefined ? contracts[p.governingContractId] : undefined
      return c !== undefined && !isPayerBilled(c)
    })
  )
}

/** True when at least one Procedure's Contract bills its payer. */
export function anyPayerBilled(
  procedures: readonly Pick<Procedure, 'governingContractId'>[],
  contracts: Readonly<Record<string, Pick<Contract, 'billsTo'>>>,
): boolean {
  return procedures.some((p) => isPayerBilled(p.governingContractId !== undefined ? contracts[p.governingContractId] : undefined))
}

/**
 * US-11.2.3, per Procedure (catch-up Phase 22a): the Procedure's Contract
 * bills its payer and that payer has neither an email nor a valid postal
 * address. False for a Procedure whose Contract bills its holder (its
 * delivery is on its Party) or that has no Contract yet. A split Procedure
 * (US-08.2.3) asks of every share billed to a person: the patient, the
 * Procedure's payer, or another person named on the share. Our reading of
 * where it is enforced: the Paid by sheet asks and Review flags it; never a
 * completion or authorisation check.
 */
export function payerContactMissing(
  procedure: Pick<Procedure, 'payer' | 'split'>,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
  contract: Pick<Contract, 'billsTo'> | undefined,
): boolean {
  if (contract === undefined) return false
  if (procedure.split !== undefined) {
    return procedure.split.shares.some((share) => {
      const details = shareDetails(share, procedure, patient)
      return details !== undefined && !payerHasContact(details)
    })
  }
  if (!isPayerBilled(contract)) return false
  return !payerHasContact(payerDetails(procedure.payer, patient))
}

/**
 * The person a split share bills, as invoiced: another person named on the
 * share, the Procedure's payer by id, or the patient (with the fill-ins typed
 * on the Procedure when the patient is its payer). Undefined for a holder
 * Party, or a payer id the Procedure no longer holds.
 */
export function shareDetails(
  share: SplitShare,
  procedure: Pick<Procedure, 'payer'>,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
): PayerDetails | undefined {
  if (share.person !== undefined) return payerDetails(share.person, patient)
  if (share.party.kind === 'patient') return payerDetails(procedure.payer.kind === 'patient' ? procedure.payer : { kind: 'patient' }, patient)
  if (share.party.kind === 'payer' && procedure.payer.kind === 'other' && procedure.payer.id === share.party.id) return payerDetails(procedure.payer, patient)
  return undefined
}

/** The words for a billed payer with no contact (US-11.2.3): the Paid by pill and Review's flag. */
export const PAYER_CONTACT_NEEDED = 'Email or postal address needed'

/** The Paid by line of a Procedure with no Contract yet (US-11.2.2 "Not billed yet"), on the Booking and in Review. */
export const PAYER_NOT_BILLED_YET = 'Payer: not billed yet'

/** The age at which a payer is no longer a child (US-11.2.4). */
export const ADULT_AGE = 18

/** True when someone born on `dobISO` is under 18 on `dateISO` (the 18th birthday itself is adult). */
export function isMinorOn(dobISO: string, dateISO: string): boolean {
  const age = ageInCompletedYears(dobISO, dateISO)
  return age !== undefined && age < ADULT_AGE
}

/**
 * US-11.2.4 and US-13.7.1 per Procedure (D4, OQ-54; catch-up Phase 22a): the
 * patient, under 18 on the List date (`ageInCompletedYears`, so the 18th
 * birthday itself is adult), is billed for this Procedure. Unsplit, that is
 * the Procedure's payer being the patient (the tick clear) with a Contract
 * that bills the payer; split (US-08.2.3), only a share billed to the patient
 * counts, so a share to another person never warns. False for a Procedure
 * billed to its holder or with no Contract yet.
 */
export function childPayerOn(
  procedure: Pick<Procedure, 'payer' | 'split'>,
  patient: Pick<Patient, 'dobISO'> | undefined,
  contract: Pick<Contract, 'billsTo'> | undefined,
  dateISO: string,
): boolean {
  if (patient === undefined || contract === undefined) return false
  if (!isMinorOn(patient.dobISO, dateISO)) return false
  if (procedure.split !== undefined) return procedure.split.shares.some((s) => s.party.kind === 'patient')
  return procedure.payer.kind === 'patient' && isPayerBilled(contract)
}

/** How an invoice to a party is to be delivered (the plan; the run stamps `Invoice.delivery` from it, catch-up Phase 22). */
export type DeliveryPlan =
  | { method: 'email'; to: string }
  | { method: 'post'; lines: string[] }
  | { method: 'none' }

/**
 * How an invoice to this party goes out (21a's Review shows it; Phase 22 sends
 * by it, never a second rule):
 * - a holder Party: its own delivery setting (email, or post), from Phase 18;
 * - a person (the patient or another payer): from the payers of the invoice's
 *   own Procedures (`personDetailsFor`), email where there is one, else post
 *   to the postal address. PROVISIONAL (OQ-122, D70's default): a payer with only a
 *   postal address is accepted and posted; if OQ-122 is answered otherwise,
 *   this is the one place that changes;
 * - otherwise none.
 */
export function invoiceDeliveryFor(
  ref: CounterpartyRef,
  procedures: readonly Pick<Procedure, 'payer' | 'split'>[],
  patientId: string,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
  parties: Readonly<Record<string, Party>>,
): DeliveryPlan {
  if (isPersonParty(ref)) {
    const details = personDetailsFor(ref, procedures, patientId, patient)
    if (details === undefined) return { method: 'none' }
    if (isEmailShaped(details.email)) return { method: 'email', to: (details.email as string).trim() }
    if (isValidPostalAddress(details.postalAddress)) return { method: 'post', lines: postalAddressLines(details.postalAddress) }
    return { method: 'none' }
  }
  const party = partyForCounterparty(ref, parties)
  if (party === undefined) return { method: 'none' }
  if (party.deliveryMethod === 'email' && nonBlank(party.email) !== undefined) return { method: 'email', to: party.email as string }
  if (party.deliveryMethod === 'post' && nonBlank(party.postalAddress) !== undefined) return { method: 'post', lines: [party.postalAddress as string] }
  return { method: 'none' }
}

/**
 * The `Invoice.billedTo` snapshot for a person party (the patient or another
 * payer), taken at the run so the payer's details stay with the debt; Phase
 * 22 sends from it. Read by the invoice's own counterparty (`personDetailsFor`).
 * Undefined for a holder Party: its details live on the Party, whose postal
 * address is still free text (our reading, logged; Phase 22 decides any
 * holder snapshot).
 */
export function billedToFor(
  ref: CounterpartyRef,
  procedures: readonly Pick<Procedure, 'payer' | 'split'>[],
  patientId: string,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
): InvoiceBilledTo | undefined {
  if (!isPersonParty(ref)) return undefined
  const details = personDetailsFor(ref, procedures, patientId, patient)
  if (details === undefined) return undefined
  return {
    name: details.name,
    ...(isEmailShaped(details.email) ? { email: (details.email as string).trim() } : {}),
    ...(details.postalAddress !== undefined ? { postalAddress: details.postalAddress } : {}),
  }
}

function nonBlank(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === '' ? undefined : value
}
