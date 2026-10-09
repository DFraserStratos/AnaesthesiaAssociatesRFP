import { describe, expect, it } from 'vitest'
import { groupsForSurgeon, hpiCpnHolder, isPlausibleEmail, isPlausibleHpiCpn, normaliseHpiCpn, surgeonsInRoom } from './surgeons'
import { ANAESTHETISTS, SURGEONS, SURGEON_GROUPS } from './seed/cast'

const surgeons = Object.fromEntries(SURGEONS.map((s) => [s.id, s]))
const anaesthetists = Object.fromEntries(ANAESTHETISTS.map((a) => [a.registrationNumber, a]))

describe('HPI CPN', () => {
  it('normalises by trimming and upper-casing', () => {
    expect(normaliseHpiCpn(' 12abcd ')).toBe('12ABCD')
  })

  it('accepts every seeded anaesthetist and surgeon HPI CPN', () => {
    for (const a of ANAESTHETISTS) expect(isPlausibleHpiCpn(a.hpiId), a.hpiId).toBe(true)
    for (const s of SURGEONS) expect(isPlausibleHpiCpn(s.hpiId), s.hpiId).toBe(true)
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
})

describe('rooms, groups and emails', () => {
  it('derives a room’s surgeons from Surgeon.roomId', () => {
    expect(surgeonsInRoom(surgeons, 'RM-MERI').map((s) => s.id)).toEqual(['S-REID', 'S-WHITFORD'])
  })

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
