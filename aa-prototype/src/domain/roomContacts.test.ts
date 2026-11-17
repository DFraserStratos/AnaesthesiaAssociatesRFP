import { describe, expect, it } from 'vitest'
import {
  contactsForRoom,
  contactsForSurgeon,
  NO_ROOM_EMAIL,
  otherRoomsForSurgeon,
  ROOM_CONTACT_ROLE_LABELS,
  roomContactEmail,
  roomEmailForSurgeon,
} from './roomContacts'
import type { Surgeon, SurgeonRoom } from './types'

const surgeon = (id: string, roomIds: string[]): Surgeon => ({ id, name: `Dr ${id}`, specialtyIds: ['SPC-ENT'], roomIds, hpiId: '90ABCD' })

const ROOMS: Record<string, SurgeonRoom> = {
  A: {
    id: 'A',
    name: 'Alpha Rooms',
    contactEmail: '  desk@alpha.example ',
    phone: '03 555 0001',
    contacts: [
      { id: 'c1', name: 'Zoe', email: 'zoe@alpha.example', role: 'PA', forSurgeonId: 'S1' },
      { id: 'c2', name: 'Amy', email: 'amy@alpha.example', role: 'PA' },
      { id: 'c3', name: 'Mona', email: 'mona@alpha.example', role: 'PRACTICE_MANAGER' },
      { id: 'c4', name: 'Bea', email: 'bea@alpha.example', role: 'PA', forSurgeonId: 'S2' },
      { id: 'c5', name: 'Pat', email: 'pat@alpha.example', role: 'PRACTICE_MANAGER', forSurgeonId: 'S1' },
    ],
  },
  B: { id: 'B', name: 'Beta Rooms', contactEmail: 'hello@beta.example' },
  N: { id: 'N', name: 'No Email Rooms' },
  W: { id: 'W', name: 'Whitespace Rooms', contactEmail: '   ' },
}
const MASTERS = {
  surgeonRooms: ROOMS,
  surgeons: {
    S1: surgeon('S1', ['A']),
    S2: surgeon('S2', ['A']),
    TWO: surgeon('TWO', ['N', 'B']),
    GONE: surgeon('GONE', ['MISSING']),
  },
}

describe('roomContactEmail', () => {
  it('trims, and gives empty for no room, no email or whitespace only', () => {
    expect(roomContactEmail(ROOMS.A)).toBe('desk@alpha.example')
    expect(roomContactEmail(ROOMS.N)).toBe('')
    expect(roomContactEmail(ROOMS.W)).toBe('')
    expect(roomContactEmail(undefined)).toBe('')
    expect(NO_ROOM_EMAIL).toBe('No email held')
  })
})

describe('roomEmailForSurgeon (Phases 35 and 40)', () => {
  it("gives the main room's email by default, never a contact", () => {
    expect(roomEmailForSurgeon(MASTERS, 'S1')).toBe('desk@alpha.example')
  })

  it("for a two-room surgeon: the main room's (empty when it holds none), the other by roomId, a room not theirs empty", () => {
    expect(roomEmailForSurgeon(MASTERS, 'TWO')).toBe('')
    expect(roomEmailForSurgeon(MASTERS, 'TWO', 'B')).toBe('hello@beta.example')
    expect(roomEmailForSurgeon(MASTERS, 'TWO', 'A')).toBe('')
  })

  it('never throws: unknown surgeon, missing room', () => {
    expect(roomEmailForSurgeon(MASTERS, 'NOPE')).toBe('')
    expect(roomEmailForSurgeon(MASTERS, 'GONE')).toBe('')
    expect(roomEmailForSurgeon(MASTERS, 'GONE', 'MISSING')).toBe('')
  })
})

describe('otherRoomsForSurgeon', () => {
  it('lists the rooms after the main one with their email; none for a single-room or unknown surgeon', () => {
    expect(otherRoomsForSurgeon(MASTERS, 'TWO')).toEqual([{ room: ROOMS.B, email: 'hello@beta.example' }])
    expect(otherRoomsForSurgeon(MASTERS, 'S1')).toEqual([])
    expect(otherRoomsForSurgeon(MASTERS, 'NOPE')).toEqual([])
  })
})

describe('contactsForSurgeon and contactsForRoom', () => {
  it('whole-room contacts first, then those named for the surgeon, each by role then name; others left out', () => {
    expect(contactsForSurgeon(ROOMS.A, 'S1').map((c) => c.id)).toEqual(['c3', 'c2', 'c5', 'c1'])
    expect(contactsForSurgeon(ROOMS.A, 'S2').map((c) => c.id)).toEqual(['c3', 'c2', 'c4'])
    expect(contactsForSurgeon(ROOMS.B, 'S1')).toEqual([])
    expect(contactsForSurgeon(undefined, 'S1')).toEqual([])
  })

  it('lists every contact of a room with the surgeon each is named for', () => {
    const rows = contactsForRoom(ROOMS.A, MASTERS.surgeons)
    expect(rows.map((r) => [r.contact.id, r.surgeon?.id])).toEqual([
      ['c3', undefined],
      ['c2', undefined],
      ['c5', 'S1'],
      ['c4', 'S2'],
      ['c1', 'S1'],
    ])
    expect(contactsForRoom(ROOMS.N, MASTERS.surgeons)).toEqual([])
  })

  it('labels the two roles', () => {
    expect(ROOM_CONTACT_ROLE_LABELS).toEqual({ PRACTICE_MANAGER: 'Practice manager', PA: 'PA' })
  })
})
