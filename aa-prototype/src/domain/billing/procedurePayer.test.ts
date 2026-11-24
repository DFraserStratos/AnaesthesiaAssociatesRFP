/** The payer on each Procedure: identity, the offer and the copy rule (catch-up Phase 22a; US-11.2.2, US-08.2.1; D85, OQ-140 answered). */

import { describe, expect, it } from 'vitest'
import { buildSeed } from '../seed'
import type { Contract, Procedure, ProcedurePayer } from '../types'
import { payerForNewProcedure, payerKey, payerOfferFor } from './procedurePayer'
import { childPayerOn, payerContactMissing } from './whoIsBilled'

const contracts = buildSeed().masters.contracts
const contract = (id: string): Contract => contracts[id]!
const PT = 'PT0001'
const hana: ProcedurePayer = { kind: 'other', id: 'BP0001', name: 'Hana Park', email: 'hana@example.net' }
const typedAgain: ProcedurePayer = { kind: 'other', id: 'BP0009', name: 'Hana Park', email: 'hana@example.net' }
const proc = (id: string, payer: ProcedurePayer, governingContractId?: string): Pick<Procedure, 'id' | 'payer' | 'governingContractId'> => ({
  id,
  payer,
  ...(governingContractId !== undefined ? { governingContractId } : {}),
})

describe('payerKey: identity, never a name or email', () => {
  it('the patient by the patient id, another payer by its BP id', () => {
    expect(payerKey({ kind: 'patient' }, PT)).toBe('patient:PT0001')
    expect(payerKey({ kind: 'patient', email: 'typed@example.net' }, PT)).toBe('patient:PT0001')
    expect(payerKey(hana, PT)).toBe('payer:BP0001')
    // The same name and email typed in separately: a different payer.
    expect(payerKey(typedAgain, PT)).not.toBe(payerKey(hana, PT))
  })
})

describe('payerOfferFor: the other Procedures holding the same payer', () => {
  const procs = [
    proc('P1', hana, 'CT-NO-CONTRACT'),
    proc('P2', hana, 'CT-NO-CONTRACT'),
    proc('P3', hana), // no Contract yet: included (our reading)
    proc('P4', hana, 'CT-STG-D1'), // bills its holder: left out
    proc('P5', typedAgain, 'CT-NO-CONTRACT'), // typed separately: a different payer
    proc('P6', { kind: 'patient' }, 'CT-NO-CONTRACT'),
  ]
  it('offers P2 and P3 for a change on P1, never the holder-billed, a separately typed or another payer', () => {
    expect(payerOfferFor(procs, 'P1', contracts, PT).map((p) => p.id)).toEqual(['P2', 'P3'])
    expect(payerOfferFor(procs, 'P6', contracts, PT)).toEqual([])
    expect(payerOfferFor(procs, 'P5', contracts, PT)).toEqual([])
    expect(payerOfferFor(procs, 'nope', contracts, PT)).toEqual([])
  })
})

describe('payerForNewProcedure: the one copy rule (US-11.2.2 "Procedure added later")', () => {
  it('copies a payer every payer-billed Procedure shares, with its id and details', () => {
    expect(payerForNewProcedure([proc('P1', hana, 'CT-NO-CONTRACT'), proc('P2', hana, 'CT-NO-CONTRACT')], contracts, PT)).toBe(hana)
    // A holder-billed Procedure's payer does not count.
    expect(payerForNewProcedure([proc('P1', hana, 'CT-NO-CONTRACT'), proc('P2', typedAgain, 'CT-STG-D1')], contracts, PT)).toBe(hana)
  })
  it('takes the patient when the Procedures name different payers, or none bills the payer', () => {
    expect(payerForNewProcedure([proc('P1', hana, 'CT-NO-CONTRACT'), proc('P2', typedAgain, 'CT-NO-CONTRACT')], contracts, PT)).toEqual({ kind: 'patient' })
    expect(payerForNewProcedure([proc('P1', hana, 'CT-STG-D1')], contracts, PT)).toEqual({ kind: 'patient' })
    expect(payerForNewProcedure([], contracts, PT)).toEqual({ kind: 'patient' })
  })
  it('the patient it takes keeps the details typed for them on this Booking (one record per payer; review fix)', () => {
    const typedPatient: ProcedurePayer = { kind: 'patient', email: 'typed@example.net' }
    expect(payerForNewProcedure([proc('P1', typedPatient, 'CT-NO-CONTRACT'), proc('P2', hana, 'CT-NO-CONTRACT')], contracts, PT)).toBe(typedPatient)
  })
})

describe('the contact rule and the child warning per Procedure (US-11.2.3, US-11.2.4, US-13.7.1)', () => {
  const child = { dobISO: '2015-05-07' }
  const noContact = { name: 'Kevin Doherty' }
  it('a holder-billed or no-Contract Procedure asks for nothing and warns of nothing', () => {
    expect(payerContactMissing({ payer: { kind: 'patient' } }, noContact, contract('CT-NO-CONTRACT'))).toBe(true)
    expect(payerContactMissing({ payer: { kind: 'patient' } }, noContact, contract('CT-STG-D1'))).toBe(false)
    expect(payerContactMissing({ payer: { kind: 'patient' } }, noContact, undefined)).toBe(false)
    expect(childPayerOn({ payer: { kind: 'patient' } }, child, contract('CT-NO-CONTRACT'), '2026-11-24')).toBe(true)
    expect(childPayerOn({ payer: { kind: 'patient' } }, child, contract('CT-STG-D1'), '2026-11-24')).toBe(false)
    expect(childPayerOn({ payer: { kind: 'patient' } }, child, undefined, '2026-11-24')).toBe(false)
  })
  it('split, only a share billed to the patient warns (US-08.2.3)', () => {
    const toPatient = { payer: hana, split: { shares: [{ party: { kind: 'patient' as const, id: PT }, basis: { kind: 'rest' as const } }] } }
    const toOthers = { payer: { kind: 'patient' as const }, split: { shares: [{ party: { kind: 'insurer' as const, id: 'I-NIB' }, basis: { kind: 'percent' as const, percent: 50 } }, { party: { kind: 'payer' as const, id: 'BP0001' }, basis: { kind: 'rest' as const } }] } }
    expect(childPayerOn(toPatient, child, contract('CT-NO-CONTRACT'), '2026-11-24')).toBe(true)
    expect(childPayerOn(toOthers, child, contract('CT-NO-CONTRACT'), '2026-11-24')).toBe(false)
  })
})
