/** Who is billed, in one place (catch-up Phase 21; FT-11.2, US-11.2.1 to US-11.2.4). */

import { describe, expect, it } from 'vitest'
import { buildSeed, SEED_MARKERS } from '../seed'
import type { Booking, Contract, Patient } from '../types'
import {
  billablePartyForProcedure,
  billedToFor,
  childPayerOn,
  holderCounterparty,
  invoiceDeliveryFor,
  isPayerBilled,
  isPersonParty,
  onlyHoldersBilled,
  partyForCounterparty,
  payerContactMissing,
  payerDetails,
} from './whoIsBilled'
import { formatPostalAddress, postalAddressLines, postalAddressProblem } from './payer'

const seed = buildSeed()
const parties = seed.masters.parties
const contracts = seed.masters.contracts
const contract = (id: string): Contract => contracts[id]!
const patientBooking: Pick<Booking, 'payer' | 'patientId'> = { payer: { kind: 'patient' }, patientId: 'PT0001' }
const guardianBooking: Pick<Booking, 'payer' | 'patientId'> = {
  payer: { kind: 'other', id: 'BP0009', name: 'Jane Doe', relationship: 'Guardian', email: 'jane@example.net' },
  patientId: 'PT0001',
}
const trust = { line1: 'PO Box 13245', city: 'Christchurch', postcode: '8141' }

/** Every seeded prepaid Contract, and the system and AA- or anaesthetist-held ones. */
const prepaid = Object.values(contracts).filter((c) => c.prepaid)
const aaFixed = Object.values(contracts).find((c) => c.aaCode === 'AA-FIX')!

describe('billablePartyForProcedure', () => {
  it('bills the holder Party when the Contract bills its holder (a hospital, an insurer, a clinic)', () => {
    expect(billablePartyForProcedure(contract('CT-STG-D1'), patientBooking, parties)).toEqual({ kind: 'hospital', id: 'H-STG' })
    expect(billablePartyForProcedure(contract('CT-NIB-D1'), patientBooking, parties)).toEqual({ kind: 'insurer', id: 'I-NIB' })
    // Aria's record folded from the retired master into its Party: its Xero contact never moves.
    expect(billablePartyForProcedure(contract('CT-ARIA-HOURLY'), guardianBooking, parties)).toEqual({ kind: 'billableParty', id: 'BP0002' })
  })

  it('bills the payer on the Booking under No contract · RVG: the patient unless another payer is ticked (US-11.2.2 AC2)', () => {
    expect(billablePartyForProcedure(contract('CT-NO-CONTRACT'), patientBooking, parties)).toEqual({ kind: 'patient', id: 'PT0001' })
    expect(billablePartyForProcedure(contract('CT-NO-CONTRACT'), guardianBooking, parties)).toEqual({ kind: 'payer', id: 'BP0009' })
  })

  it("bills the payer for a surgeon's fixed price, No contract · Fixed price, an anaesthetist's own Contract and every prepaid Contract (US-11.2.1; OQ-73, D23)", () => {
    expect(billablePartyForProcedure(contract('CT-DOYLE-BAR'), patientBooking, parties)).toEqual({ kind: 'patient', id: 'PT0001' })
    expect(billablePartyForProcedure(aaFixed, patientBooking, parties)).toEqual({ kind: 'patient', id: 'PT0001' })
    expect(billablePartyForProcedure(contract('CT-SOUTER-RHINO'), patientBooking, parties)).toEqual({ kind: 'patient', id: 'PT0001' })
    expect(prepaid.length).toBeGreaterThan(0)
    for (const c of prepaid) expect(billablePartyForProcedure(c, guardianBooking, parties)).toEqual({ kind: 'payer', id: 'BP0009' })
  })

  it('never reads a price or the funder: the same Contract with a different price bills the same party', () => {
    const repriced = { ...contract('CT-STG-D1'), pricing: { kind: 'fixed' as const, ranges: [] } }
    expect(billablePartyForProcedure(repriced, patientBooking, parties)).toEqual(billablePartyForProcedure(contract('CT-STG-D1'), patientBooking, parties))
  })

  it('bills no one without a Contract, or when the holder is gone', () => {
    expect(billablePartyForProcedure(undefined, patientBooking, parties)).toBeUndefined()
    expect(billablePartyForProcedure({ billsTo: 'holder', holderId: 'PY-GONE' }, patientBooking, parties)).toBeUndefined()
  })

  it('a holder Party with no older identity is billed as itself, and every holder resolves back to its Party', () => {
    const uni = parties['PY-UNI']!
    expect(holderCounterparty(uni)).toEqual({ kind: 'party', id: 'PY-UNI' })
    for (const p of Object.values(parties)) expect(partyForCounterparty(holderCounterparty(p), parties)?.id).toBe(p.id)
  })
})

describe('the payer helpers', () => {
  const patient: Patient = { hiddenInternalId: 'PT0001', name: 'Wiremu Tane', dobISO: '1979-08-22', email: 'w@example.net', postalAddress: { line1: '1 Clyde Road', city: 'Christchurch', postcode: '8041' } }
  const noContact: Patient = { hiddenInternalId: 'PT0002', name: 'Kevin Doherty', dobISO: '1972-10-14' }
  const rvg = [{ governingContractId: 'CT-NO-CONTRACT' }]
  const held = [{ governingContractId: 'CT-STG-D1' }]

  it('isPersonParty: the patient or another payer, never a holder Party', () => {
    expect(isPersonParty({ kind: 'patient', id: 'x' })).toBe(true)
    expect(isPersonParty({ kind: 'payer', id: 'x' })).toBe(true)
    expect(isPersonParty({ kind: 'hospital', id: 'x' })).toBe(false)
    expect(isPersonParty({ kind: 'billableParty', id: 'BP0002' })).toBe(false)
    expect(isPayerBilled(contract('CT-NO-CONTRACT'))).toBe(true)
    expect(isPayerBilled(contract('CT-STG-D1'))).toBe(false)
  })

  it('payerDetails reads the patient record when the tick is clear, filling only what the record lacks', () => {
    expect(payerDetails({ payer: { kind: 'patient' } }, patient)).toMatchObject({ isPatient: true, name: 'Wiremu Tane', email: 'w@example.net' })
    expect(payerDetails({ payer: { kind: 'patient', email: 'typed@example.net' } }, patient).email).toBe('w@example.net')
    expect(payerDetails({ payer: { kind: 'patient', email: 'typed@example.net' } }, noContact).email).toBe('typed@example.net')
    expect(payerDetails(guardianBooking, patient)).toMatchObject({ isPatient: false, name: 'Jane Doe', relationship: 'Guardian' })
  })

  it('payerContactMissing: a billed payer with neither an email nor a postal address (US-11.2.3)', () => {
    expect(payerContactMissing({ payer: { kind: 'patient' } }, noContact, rvg, contracts)).toBe(true)
    // A postal address alone is enough (D70's default).
    expect(payerContactMissing({ payer: { kind: 'patient', postalAddress: trust } }, noContact, rvg, contracts)).toBe(false)
    expect(payerContactMissing({ payer: { kind: 'other', id: 'BP0010', name: 'Doherty Family Trust', postalAddress: trust } }, noContact, rvg, contracts)).toBe(false)
    // A holder-billed Procedure asks for none.
    expect(payerContactMissing({ payer: { kind: 'patient' } }, noContact, held, contracts)).toBe(false)
    // No Contract yet: nothing is billed, nothing asked.
    expect(payerContactMissing({ payer: { kind: 'patient' } }, noContact, [{}], contracts)).toBe(false)
  })

  it('onlyHoldersBilled: every Procedure on a holder-billing Contract; not while a Contract is still to choose', () => {
    expect(onlyHoldersBilled(held, contracts)).toBe(true)
    expect(onlyHoldersBilled(rvg, contracts)).toBe(false)
    expect(onlyHoldersBilled([{}], contracts)).toBe(false)
    expect(onlyHoldersBilled([...held, {}], contracts)).toBe(false)
  })

  it('childPayerOn: under 18 on the List date, the patient pays, a Procedure bills the payer (US-11.2.4)', () => {
    const child = { dobISO: '2008-07-22' }
    expect(childPayerOn({ payer: { kind: 'patient' } }, child, rvg, contracts, '2026-07-21')).toBe(true) // 17 years, 364 days
    expect(childPayerOn({ payer: { kind: 'patient' } }, child, rvg, contracts, '2026-07-22')).toBe(false) // the 18th birthday
    expect(childPayerOn(guardianBooking, child, rvg, contracts, '2026-07-21')).toBe(false)
    expect(childPayerOn({ payer: { kind: 'patient' } }, child, held, contracts, '2026-07-21')).toBe(false)
  })

  it('invoiceDeliveryFor: a payer by email, else by post (D70), else none; a holder by its Party setting', () => {
    expect(invoiceDeliveryFor({ kind: 'patient', id: 'PT0001' }, { patientId: 'PT0001', payer: { kind: 'patient' } }, patient, parties)).toEqual({ method: 'email', to: 'w@example.net' })
    expect(invoiceDeliveryFor({ kind: 'payer', id: 'BP0010' }, { patientId: 'PT0001', payer: { kind: 'other', id: 'BP0010', name: 'Trust', postalAddress: trust } }, patient, parties)).toEqual({
      method: 'post',
      lines: ['PO Box 13245', 'Christchurch 8141'],
    })
    expect(invoiceDeliveryFor({ kind: 'patient', id: 'PT0002' }, { patientId: 'PT0002', payer: { kind: 'patient' } }, noContact, parties)).toEqual({ method: 'none' })
    expect(invoiceDeliveryFor({ kind: 'hospital', id: 'H-STG' }, { patientId: 'PT0001', payer: { kind: 'patient' } }, patient, parties).method).toBe('email')
    expect(invoiceDeliveryFor({ kind: 'party', id: 'PY-UNI' }, { patientId: 'PT0001', payer: { kind: 'patient' } }, patient, parties).method).toBe('post')
  })

  it('billedToFor snapshots a payer and leaves a holder to its Party', () => {
    expect(billedToFor({ kind: 'payer', id: 'BP0010' }, { patientId: 'PT0001', payer: { kind: 'other', id: 'BP0010', name: 'Trust', postalAddress: trust } }, patient)).toEqual({ name: 'Trust', postalAddress: trust })
    expect(billedToFor({ kind: 'hospital', id: 'H-STG' }, { patientId: 'PT0001', payer: { kind: 'patient' } }, patient)).toBeUndefined()
  })

  it('reads the invoice\'s own counterparty: a split line to the patient never carries another payer\'s contact (review fix)', () => {
    const guardian = { patientId: 'PT0001', payer: { kind: 'other' as const, id: 'BP0009', name: 'Jane Doe', email: 'jane@example.net' } }
    expect(billedToFor({ kind: 'patient', id: 'PT0001' }, guardian, patient)).toEqual({ name: 'Wiremu Tane', email: 'w@example.net', postalAddress: patient.postalAddress })
    expect(invoiceDeliveryFor({ kind: 'patient', id: 'PT0001' }, guardian, patient, parties)).toEqual({ method: 'email', to: 'w@example.net' })
    // A payer id no longer on the Booking resolves to no one, never the current payer.
    expect(billedToFor({ kind: 'payer', id: 'BP0004' }, guardian, patient)).toBeUndefined()
    expect(invoiceDeliveryFor({ kind: 'payer', id: 'BP0004' }, guardian, patient, parties)).toEqual({ method: 'none' })
  })

  it('a malformed record email never hides one typed for the Booking, and is never snapshotted', () => {
    const bad: Patient = { ...noContact, email: 'not an email' }
    expect(payerDetails({ payer: { kind: 'patient', email: 'typed@example.net' } }, bad).email).toBe('typed@example.net')
    expect(billedToFor({ kind: 'patient', id: 'PT0002' }, { patientId: 'PT0002', payer: { kind: 'patient' } }, bad)).toEqual({ name: 'Kevin Doherty' })
  })

  it('the NZ Post address rules', () => {
    expect(postalAddressProblem(trust)).toBeNull()
    expect(postalAddressProblem({ ...trust, postcode: '814' })).toBe('Enter a four-digit postcode.')
    expect(postalAddressProblem({ line1: '', city: 'Christchurch', postcode: '8141' })).not.toBeNull()
    expect(postalAddressLines({ line1: '18 Clifford Avenue', suburb: 'Fendalton', city: 'Christchurch', postcode: '8052' })).toEqual(['18 Clifford Avenue', 'Fendalton', 'Christchurch 8052'])
    expect(formatPostalAddress(trust)).toBe('PO Box 13245, Christchurch 8141')
  })
})

describe('the seed', () => {
  it('names Hana Park (Mother) as the payer on Grace Park’s Booking, keeping BP0001', () => {
    const b = seed.schedule.bookings[SEED_MARKERS.guardianMinorBooking!.entityId]!
    expect(b.payer).toMatchObject({ kind: 'other', id: 'BP0001', name: 'Hana Park', relationship: 'Mother' })
  })
})
