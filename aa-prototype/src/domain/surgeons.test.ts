import { describe, expect, it } from 'vitest'
import { groupsForSurgeon, hpiCpnHolder, isPlausibleEmail, isPlausibleHpiCpn, NO_HPI_CPN, normaliseHpiCpn, surgeonHpiCpnRequired } from './surgeons'
import { ANAESTHETISTS, SURGEONS, SURGEON_GROUPS } from './seed/cast'
import type { Surgeon } from './types'

const surgeons = Object.fromEntries(SURGEONS.map((s) => [s.id, s]))
const anaesthetists = Object.fromEntries(ANAESTHETISTS.map((a) => [a.registrationNumber, a]))

describe('HPI CPN', () => {
  it('normalises by trimming and upper-casing', () => {
    expect(normaliseHpiCpn(' 12abcd ')).toBe('12ABCD')
  })

  it('accepts every seeded anaesthetist and surgeon HPI CPN', () => {
    for (const a of ANAESTHETISTS) expect(isPlausibleHpiCpn(a.hpiId), a.hpiId).toBe(true)
    for (const s of SURGEONS) expect(isPlausibleHpiCpn(s.hpiId ?? ''), s.hpiId).toBe(true)
  })

  it('rejects blank and the wrong shape', () => {
    for (const bad of ['', '   ', '1ABCDE', '12ABC', '12ABCDE', 'AB12CD']) expect(isPlausibleHpiCpn(bad), bad).toBe(false)
    expect(isPlausibleHpiCpn('12abcd')).toBe(true)
  })

  it('finds the holder across surgeons and anaesthetists, never the record itself', () => {
    const masters = { surgeons, anaesthetists }
    expect(hpiCpnHolder(masters, '12shap')?.name).toBe('Dr Priya Sharma')
    expect(hpiCpnHolder(masters, '47REIA')?.name).toBe('Ms A. Reid')
    expect(hpiCpnHolder(masters, '47REIA', { surgeonId: 'S-REID' })).toBeNull()
    expect(hpiCpnHolder(masters, '')).toBeNull()
    expect(hpiCpnHolder(masters, '99ZZZZ')).toBeNull()
  })

  // Catch-up Phase 17b (OQ-129, D76; OQ-143's default, D89): a surgeon may hold none.
  it('never clashes with a surgeon who holds no HPI CPN', () => {
    const blank: Surgeon = { id: 'S-BLANK', name: 'Dr B. Lank', specialtyIds: ['SPC-ENT'], personalContact: {}, officeContacts: [] }
    expect(hpiCpnHolder({ surgeons: { ...surgeons, [blank.id]: blank }, anaesthetists }, '')).toBeNull()
    expect(hpiCpnHolder({ surgeons: { ...surgeons, [blank.id]: blank }, anaesthetists }, '47REIA')?.name).toBe('Ms A. Reid')
  })

  it("OQ-143's default: a surgeon's HPI CPN is never required, through one predicate", () => {
    expect(surgeonHpiCpnRequired()).toBe(false)
    expect(NO_HPI_CPN).toBe('No HPI CPN yet')
  })
})

describe('groups and emails', () => {
  it('lists a surgeon’s groups', () => {
    const groups = Object.fromEntries(SURGEON_GROUPS.map((g) => [g.id, g]))
    expect(groupsForSurgeon(groups, 'S-HALE').map((g) => g.id)).toEqual(['SG-COS'])
    expect(groupsForSurgeon(groups, 'S-PATEL')).toEqual([])
  })

  it('checks emails loosely', () => {
    expect(isPlausibleEmail('bookings@stgeorges.example')).toBe(true)
    for (const bad of ['', 'bookings', 'a@b', 'a b@c.nz', '@c.nz']) expect(isPlausibleEmail(bad), bad).toBe(false)
  })
})
