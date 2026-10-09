/**
 * The pairing rule (catch-up Phase 31; US-01.3.1, FT-01.3, FT-07.1): one pure
 * helper, the only implementation every store path calls.
 */

import { describe, expect, it } from 'vitest'
import { billingHospitalId, isActivePairing, isAaRooms, listHospitalFor, pairingIssues } from './listPairing'

const masters = { hospitals: { 'H-1': {}, 'H-ROOMS': {} }, surgeons: { 'S-1': {} } }
const hospitals = { 'H-1': { locationType: 'hospital' as const }, 'H-ROOMS': { locationType: 'aaRooms' as const } }

describe('pairingIssues (US-01.3.1)', () => {
  it('is empty for a complete pairing', () => {
    expect(pairingIssues({ hospitalId: 'H-1', surgeonId: 'S-1' }, masters)).toEqual([])
  })

  it('names each missing or unknown half in plain words, hospital first', () => {
    expect(pairingIssues({}, masters).map((i) => i.message)).toEqual(['Choose the hospital.', 'Choose the surgeon.'])
    expect(pairingIssues({ hospitalId: '  ', surgeonId: null }, masters).map((i) => i.code)).toEqual(['hospitalRequired', 'surgeonRequired'])
    expect(pairingIssues({ hospitalId: 'H-X', surgeonId: 'S-1' }, masters)).toEqual([{ code: 'hospitalUnknown', message: 'That hospital is not in the master data.' }])
    expect(pairingIssues({ hospitalId: 'H-1', surgeonId: 'S-X' }, masters)).toEqual([{ code: 'surgeonUnknown', message: 'That surgeon is not in the master data.' }])
  })

  it('never uses a dash or the word "slot"', () => {
    const all = pairingIssues({ hospitalId: 'H-X', surgeonId: 'S-X' }, masters).concat(pairingIssues({}, masters))
    for (const i of all) {
      expect(i.message).not.toMatch(/[–—]/)
      expect(i.message).not.toMatch(/\bslots?\b/i)
    }
  })
})

describe('isActivePairing (FT-07.1)', () => {
  const full = { anaesthetistId: 'A1', slotId: 'S-A1-2026-07-21-AM', dateISO: '2026-07-21', session: 'AM' as const, hospitalId: 'H-1', surgeonId: 'S-1' }
  it('is true only with all five of its pairing', () => {
    expect(isActivePairing(full)).toBe(true)
    for (const key of ['anaesthetistId', 'slotId', 'dateISO', 'hospitalId', 'surgeonId'] as const) {
      expect(isActivePairing({ ...full, [key]: undefined } as never), key).toBe(false)
    }
  })
})

describe('AA rooms is a location, never a billing holder', () => {
  it('drops the AA rooms location from billing inputs and keeps a hospital', () => {
    expect(isAaRooms('H-ROOMS', hospitals)).toBe(true)
    expect(billingHospitalId('H-ROOMS', hospitals)).toBeUndefined()
    expect(billingHospitalId('H-1', hospitals)).toBe('H-1')
    expect(listHospitalFor({ hospitalId: 'H-ROOMS' }, hospitals)).toEqual({})
    expect(listHospitalFor({ hospitalId: 'H-1' }, hospitals)).toEqual({ listHospitalId: 'H-1' })
  })
})
