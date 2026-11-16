/**
 * Who is billed, in one place (catch-up Phase 21; FT-11.2, US-11.2.1,
 * US-11.2.2, US-11.2.3, US-11.2.4; DM-11; OQ-67 and D17, OQ-78; AR-61
 * `#who-is-billed`, AR-44 `#bill-holder`, `#bill-payer`, `#payer`).
 *
 * Each Procedure's Contract decides: a Contract set to bill its holder bills
 * the holder Party; any other Contract bills the payer named on the Booking.
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
 * billed. If OQ-78 reopens or the payer moves onto each booking procedure
 * (Greg's v6), this file and `setBookingPayer` are the places that change.
 *
 * Where this departs from Greg's v6 field names: v6's "alternate payer" flag
 * and payer contact fields on the booking procedure are the Booking's
 * `payer` here (kind `other` is the flag set); v6's contract holder "is
 * billed" setting is each Contract's `billsTo` (Donald, D2).
 */

import type { Booking, Contract, CounterpartyRef, InvoiceBilledTo, Patient, PostalAddress, Procedure } from '../types'
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

/** The payer on the Booking as a counterparty: the patient, or the other payer by its `BP####` id. */
export function payerCounterparty(booking: Pick<Booking, 'payer' | 'patientId'>): CounterpartyRef {
  return booking.payer.kind === 'other' ? { kind: 'payer', id: booking.payer.id } : { kind: 'patient', id: booking.patientId }
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

/** True when the Contract bills the payer on the Booking (it is set and does not bill its holder). */
export function isPayerBilled(contract: Pick<Contract, 'billsTo'> | undefined): boolean {
  return contract !== undefined && contract.billsTo !== 'holder'
}

/**
 * Who a Procedure bills (the one rule): the Contract's holder Party when the
 * Contract bills its holder; otherwise the payer on the Booking. Undefined
 * with no Contract ("Needs an invoice destination") or a holder that no longer
 * exists. Billing lines' `funderOverride` is applied by the invoice build on
 * top of this until Phase 22's Split replaces it.
 */
export function billablePartyForProcedure(
  contract: Pick<Contract, 'billsTo' | 'holderId'> | undefined,
  booking: Pick<Booking, 'payer' | 'patientId'>,
  parties: Readonly<Record<string, Party>>,
): CounterpartyRef | undefined {
  if (contract === undefined) return undefined
  if (contract.billsTo === 'holder') return holderBilledFor(contract, parties)
  return payerCounterparty(booking)
}

/**
 * A person rather than an organisation: the patient or another payer named on
 * the Booking (a family trust named as payer counts), never a holder Party.
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
 * postal address, each filled from the Booking's typed value where the record
 * has none; for another payer, the details held on the Booking.
 */
export function payerDetails(booking: Pick<Booking, 'payer'>, patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined): PayerDetails {
  const payer = booking.payer
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
 * counterparty: a `patient` invoice is the patient (the Booking's typed
 * fill-ins only while the patient is the payer on the Booking); a `payer`
 * invoice is the Booking's other payer only when the ids match. Undefined
 * otherwise (a holder, or a payer no longer on the Booking), so a split line
 * to the patient never carries another payer's contact.
 */
export function personDetailsFor(
  ref: CounterpartyRef,
  booking: Pick<Booking, 'payer' | 'patientId'>,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
): PayerDetails | undefined {
  if (ref.kind === 'patient') {
    if (ref.id !== booking.patientId) return undefined
    return payerDetails(booking.payer.kind === 'patient' ? booking : { payer: { kind: 'patient' } }, patient)
  }
  if (ref.kind === 'payer') {
    return booking.payer.kind === 'other' && booking.payer.id === ref.id ? payerDetails(booking, patient) : undefined
  }
  return undefined
}

/** True when the payer can be reached: an email, or a postal address in the NZ Post standard (D70's default: post alone is enough). */
export function payerHasContact(details: Pick<PayerDetails, 'email' | 'postalAddress'>): boolean {
  return isEmailShaped(details.email) || isValidPostalAddress(details.postalAddress)
}

/**
 * True when every Procedure has a Contract and each bills its holder, so the
 * payer on the Booking is invoiced for nothing (a Booking still waiting on a
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

/** True when at least one Procedure's Contract bills the payer on the Booking. */
export function anyPayerBilled(
  procedures: readonly Pick<Procedure, 'governingContractId'>[],
  contracts: Readonly<Record<string, Pick<Contract, 'billsTo'>>>,
): boolean {
  return procedures.some((p) => isPayerBilled(p.governingContractId !== undefined ? contracts[p.governingContractId] : undefined))
}

/**
 * US-11.2.3: a Procedure bills the payer on the Booking and the payer has
 * neither an email nor a valid postal address. False when every Procedure's
 * Contract bills its holder (its delivery is on its Party) or none has a
 * Contract yet. Our reading of where it is enforced: the payer sheet asks and
 * Review flags it; never a completion or authorisation check.
 */
export function payerContactMissing(
  booking: Pick<Booking, 'payer'>,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
  procedures: readonly Pick<Procedure, 'governingContractId'>[],
  contracts: Readonly<Record<string, Pick<Contract, 'billsTo'>>>,
): boolean {
  if (!anyPayerBilled(procedures, contracts)) return false
  return !payerHasContact(payerDetails(booking, patient))
}

/** The words for a billed payer with no contact (US-11.2.3): the Payer row's chip and Review's flag. */
export const PAYER_CONTACT_NEEDED = 'Email or postal address needed'

/** The age at which a payer is no longer a child (US-11.2.4). */
export const ADULT_AGE = 18

/** True when someone born on `dobISO` is under 18 on `dateISO` (the 18th birthday itself is adult). */
export function isMinorOn(dobISO: string, dateISO: string): boolean {
  const age = ageInCompletedYears(dobISO, dateISO)
  return age !== undefined && age < ADULT_AGE
}

/**
 * US-11.2.4 (D4, OQ-54): the patient is the payer (the tick is clear), is
 * under 18 on the List date (`ageInCompletedYears`, so the 18th birthday
 * itself is adult), and at least one Procedure bills the payer. False when
 * another payer is ticked or every Procedure's Contract bills its holder.
 */
export function childPayerOn(
  booking: Pick<Booking, 'payer'>,
  patient: Pick<Patient, 'dobISO'> | undefined,
  procedures: readonly Pick<Procedure, 'governingContractId'>[],
  contracts: Readonly<Record<string, Pick<Contract, 'billsTo'>>>,
  dateISO: string,
): boolean {
  if (booking.payer.kind !== 'patient' || patient === undefined) return false
  if (!isMinorOn(patient.dobISO, dateISO)) return false
  return anyPayerBilled(procedures, contracts)
}

/** How an invoice to a party is delivered. */
export type InvoiceDelivery =
  | { method: 'email'; to: string }
  | { method: 'post'; lines: string[] }
  | { method: 'none' }

/**
 * How an invoice to this party goes out (21a's Review shows it; Phase 22 sends
 * by it, never a second rule):
 * - a holder Party: its own delivery setting (email, or post), from Phase 18;
 * - the payer on the Booking: email where there is one, else post to the
 *   postal address. PROVISIONAL (OQ-122, D70's default): a payer with only a
 *   postal address is accepted and posted; if OQ-122 is answered otherwise,
 *   this is the one place that changes;
 * - otherwise none.
 */
export function invoiceDeliveryFor(
  ref: CounterpartyRef,
  booking: Pick<Booking, 'payer' | 'patientId'>,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
  parties: Readonly<Record<string, Party>>,
): InvoiceDelivery {
  if (isPersonParty(ref)) {
    const details = personDetailsFor(ref, booking, patient)
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
  booking: Pick<Booking, 'payer' | 'patientId'>,
  patient: Pick<Patient, 'name' | 'email' | 'postalAddress' | 'phone'> | undefined,
): InvoiceBilledTo | undefined {
  if (!isPersonParty(ref)) return undefined
  const details = personDetailsFor(ref, booking, patient)
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
