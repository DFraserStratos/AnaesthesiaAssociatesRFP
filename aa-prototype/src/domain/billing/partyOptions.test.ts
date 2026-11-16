import { describe, expect, it } from 'vitest'
import type { CounterpartyRef } from '../types'
import type { Party } from './parties'
import { filterPartyOptions, isBillablePartyOn, partyOptionsFor, splitPartiesOn } from './partyOptions'

const parties: Record<string, Party> = {
  'PY-AA': { id: 'PY-AA', kind: 'aa', name: 'Anaesthesia Associates', codePrefix: 'AA' },
  'PY-SOUTER': { id: 'PY-SOUTER', kind: 'anaesthetist', name: 'Dr Melanie Souter', codePrefix: 'SOU' },
  'PY-UNI': { id: 'PY-UNI', kind: 'surgeonGroup', name: 'Unisports', codePrefix: 'UNI' },
  'PY-NIB': { id: 'PY-NIB', kind: 'insurer', name: 'nib', codePrefix: 'NIB', billingIdentity: { kind: 'insurer', id: 'I-NIB' } },
  'PY-STG': { id: 'PY-STG', kind: 'hospital', name: "St George's", codePrefix: 'STG', hospitalId: 'H-STG' },
  'PY-HUGHES': { id: 'PY-HUGHES', kind: 'surgeon', name: 'Dr Rawiri Hughes', codePrefix: 'HUG' },
}

const NIB: CounterpartyRef = { kind: 'insurer', id: 'I-NIB' }
const booking = { patientId: 'PT0011', payer: { kind: 'other' as const, id: 'BP0009', name: 'Jo Prentice' } }
const nameOf = (ref: CounterpartyRef): string => (ref.kind === 'payer' ? 'Jo Prentice' : ref.kind === 'patient' ? 'Alan Prentice' : (Object.values(parties).find((p) => p.billingIdentity?.id === ref.id)?.name ?? ref.id))

describe('partyOptionsFor (catch-up Phase 22)', () => {
  it("payer first, the Contract's party second, then the Parties by name; AA and anaesthetists left out; each once", () => {
    const options = partyOptionsFor(booking, NIB, parties, nameOf)
    expect(options.map((o) => [o.name, o.hint, o.group])).toEqual([
      ['Jo Prentice', 'Payer on the Booking', 'booking'],
      ['nib', "Contract's party", 'booking'],
      ['Dr Rawiri Hughes', 'Surgeon', 'parties'],
      ["St George's", 'Hospital', 'parties'],
      ['Unisports', 'Surgeon group', 'parties'],
    ])
    expect(options[0]!.ref).toEqual({ kind: 'payer', id: 'BP0009' })
    expect(options.find((o) => o.name === "St George's")!.ref).toEqual({ kind: 'hospital', id: 'H-STG' })
    expect(options.find((o) => o.name === 'Unisports')!.ref).toEqual({ kind: 'party', id: 'PY-UNI' })
  })
  it('with no Contract party and the patient as payer', () => {
    const options = partyOptionsFor({ patientId: 'PT0011', payer: { kind: 'patient' } }, undefined, parties, nameOf)
    expect(options[0]).toMatchObject({ ref: { kind: 'patient', id: 'PT0011' }, name: 'Alan Prentice', hint: 'Payer on the Booking' })
    expect(options.filter((o) => o.ref.kind === 'insurer')).toHaveLength(1)
    expect(options.find((o) => o.ref.kind === 'insurer')!.group).toBe('parties')
  })
  it("the Contract's party that is the payer is listed once", () => {
    const options = partyOptionsFor(booking, { kind: 'payer', id: 'BP0009' }, parties, nameOf)
    expect(options.filter((o) => o.ref.kind === 'payer')).toHaveLength(1)
    expect(options[1]!.group).toBe('parties')
  })
})

describe('filterPartyOptions uses the shared name matcher', () => {
  const options = partyOptionsFor(booking, NIB, parties, nameOf)
  it('blank and a title alone return all', () => {
    expect(filterPartyOptions(options, '')).toEqual(options)
    expect(filterPartyOptions(options, '   ')).toEqual(options)
    expect(filterPartyOptions(options, 'dr')).toEqual(options)
  })
  it('matches anywhere in the name without its title, any case', () => {
    expect(filterPartyOptions(options, 'rawiri h').map((o) => o.name)).toEqual(['Dr Rawiri Hughes'])
    expect(filterPartyOptions(options, 'NIB').map((o) => o.name)).toEqual(['nib'])
    expect(filterPartyOptions(options, 'prentice').map((o) => o.name)).toEqual(['Jo Prentice'])
    expect(filterPartyOptions(options, 'zzz')).toEqual([])
  })
})

describe('isBillablePartyOn and splitPartiesOn', () => {
  it('the payer and a billable Party are on; a stale BP id, the patient behind another payer and AA are not', () => {
    expect(isBillablePartyOn(booking, { kind: 'payer', id: 'BP0009' }, parties)).toBe(true)
    expect(isBillablePartyOn(booking, NIB, parties)).toBe(true)
    expect(isBillablePartyOn(booking, { kind: 'hospital', id: 'H-STG' }, parties)).toBe(true)
    expect(isBillablePartyOn(booking, { kind: 'party', id: 'PY-UNI' }, parties)).toBe(true)
    expect(isBillablePartyOn(booking, { kind: 'payer', id: 'BP0001' }, parties)).toBe(false)
    expect(isBillablePartyOn(booking, { kind: 'patient', id: 'PT0011' }, parties)).toBe(false)
    expect(isBillablePartyOn(booking, { kind: 'party', id: 'PY-AA' }, parties)).toBe(false)
    expect(isBillablePartyOn(booking, { kind: 'party', id: 'PY-SOUTER' }, parties)).toBe(false)
    expect(isBillablePartyOn(booking, { kind: 'party', id: 'PY-GONE' }, parties)).toBe(false)
  })
  it('splitPartiesOn needs every share on', () => {
    const on = [
      { party: NIB, basis: { kind: 'percent' as const, percent: 50 } },
      { party: { kind: 'payer' as const, id: 'BP0009' }, basis: { kind: 'rest' as const } },
    ]
    expect(splitPartiesOn(booking, on, parties)).toBe(true)
    expect(splitPartiesOn(booking, [on[0]!, { party: { kind: 'payer', id: 'BP0001' }, basis: { kind: 'rest' } }], parties)).toBe(false)
  })
})
