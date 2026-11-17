import { describe, expect, it } from 'vitest'
import { groupsForSurgeon, hpiCpnHolder, isPlausibleEmail, isPlausibleHpiCpn, mainRoomOf, normaliseHpiCpn, roomsForSurgeon, surgeonsInRoom } from './surgeons'
import { ANAESTHETISTS, SURGEONS, SURGEON_GROUPS, SURGEON_ROOMS } from './seed/cast'
import type { Surgeon } from './types'

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
  it('derives a room’s surgeons from Surgeon.roomIds', () => {
    expect(surgeonsInRoom(surgeons, 'RM-MERI').map((s) => s.id)).toEqual(['S-REID', 'S-WHITFORD'])
  })

  // Catch-up Phase 17a (OQ-128, D75): a surgeon at one or more rooms, the first the main room.
  const rooms = Object.fromEntries(SURGEON_ROOMS.map((r) => [r.id, r]))
  const twoRoom: Surgeon = { id: 'S-TWO', name: 'Dr T. Two', specialtyIds: ['SPC-ENT'], roomIds: ['RM-PAPA', 'RM-MERI', 'RM-GONE'], hpiId: '98TWOT' }
  const masters = { surgeons: { ...surgeons, [twoRoom.id]: twoRoom }, surgeonRooms: rooms }

  it('lists a two-room surgeon under both rooms, by surname', () => {
    expect(surgeonsInRoom(masters.surgeons, 'RM-MERI').map((s) => s.id)).toEqual(['S-REID', 'S-TWO', 'S-WHITFORD'])
    expect(surgeonsInRoom(masters.surgeons, 'RM-PAPA').map((s) => s.id)).toEqual(['S-CAMERON', 'S-TAN', 'S-TWO'])
  })

  it('gives a surgeon’s rooms in order, the main room first, skipping an unknown id', () => {
    expect(roomsForSurgeon(masters, 'S-TWO').map((r) => r.id)).toEqual(['RM-PAPA', 'RM-MERI'])
    expect(mainRoomOf(masters, 'S-TWO')?.id).toBe('RM-PAPA')
    expect(roomsForSurgeon(masters, 'S-REID').map((r) => r.id)).toEqual(['RM-MERI'])
    expect(roomsForSurgeon(masters, 'S-NOPE')).toEqual([])
    expect(mainRoomOf(masters, 'S-NOPE')).toBeUndefined()
    const lost: Surgeon = { ...twoRoom, id: 'S-LOST', roomIds: ['RM-GONE', 'RM-MERI'] }
    expect(mainRoomOf({ ...masters, surgeons: { 'S-LOST': lost } }, 'S-LOST')?.id).toBe('RM-MERI')
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
