/**
 * Catch-up Phase 17a seed pins (DM-60, US-13.6.1, US-13.6.5; D75): the
 * directory's counts, every surgeon's main room as it was before the phase
 * (`__parity__/phase-17a-baseline.json`, written before any edit), the four
 * surgeons the fictional list puts at two practices, the rooms with no email,
 * the five cast rooms' emails and 18a's specialties.
 */

import { describe, expect, it } from 'vitest'
import { buildSeed } from '../domain/seed'
import { DIRECTORY_ROOMS, DIRECTORY_SURGEONS } from '../domain/seed/specialistDirectory'
import { SURGEON_ROOMS } from '../domain/seed/cast'
import { mainRoomOf } from '../domain/surgeons'
import baseline from './__parity__/phase-17a-baseline.json'

const seed = buildSeed()
const { surgeons, surgeonRooms } = seed.masters

/** The four surgeons the fictional workbook lists at two practices, and their second room. */
const TWO_ROOM: Record<string, [string, string]> = {
  'S-WINSLOW': ['RM-RICHMONDFE', 'RM-LINWOODWOM'],
  'S-WAINWRIGHT': ['RM-UPPERGIPAR', 'RM-HILLSBOROU'],
  'S-MORLAND': ['RM-UPPERGIPAR', 'RM-HILLSBOROU'],
  'S-VAUGHAN': ['RM-IMOGENVAUG', 'RM-EDGEWAREOR'],
}

/** Practices with no email on any row of the fictional list (16), and the two whose only addresses are PA inboxes. */
const NO_EMAIL = [
  'RM-RICHMONDFE', 'RM-ELODIEBRAM', 'RM-GENERALSUR', 'RM-EYEPARTNER', 'RM-MATTHIASDU', 'RM-RAFAELKINL',
  'RM-ISLABARCLA', 'RM-FREYAFONOT', 'RM-OTTILIEFEN', 'RM-IMOGENVAUG', 'RM-WIGRAMORTH', 'RM-PLASTICSUR',
  'RM-CORMACCORR', 'RM-UROLOGYASS', 'RM-SUMNERNEUR', 'RM-ORTHOPAEDI',
  'RM-BURNSIDEEN', 'RM-BRYNDWRNEU',
]

describe('catch-up Phase 17a seed', () => {
  it('keeps the directory at 40 rooms and 131 surgeons (45 and 141 with the cast)', () => {
    expect(DIRECTORY_ROOMS).toHaveLength(40)
    expect(DIRECTORY_SURGEONS).toHaveLength(131)
    expect(Object.keys(surgeonRooms)).toHaveLength(baseline.roomCount)
    expect(Object.keys(surgeons)).toHaveLength(baseline.surgeonCount)
  })

  it("keeps every surgeon's main room as the one room they held before the phase", () => {
    const main = Object.fromEntries(Object.keys(surgeons).map((id) => [id, mainRoomOf(seed.masters, id)?.id]))
    expect(main).toEqual(baseline.mainRoom)
  })

  it('holds the four two-practice surgeons at both rooms, and every other surgeon at one', () => {
    for (const s of Object.values(surgeons)) {
      expect(new Set(s.roomIds).size, s.id).toBe(s.roomIds.length)
      expect(s.roomIds, s.id).toEqual(TWO_ROOM[s.id] ?? [baseline.mainRoom[s.id as keyof typeof baseline.mainRoom]])
    }
  })

  it("keeps every surgeon's specialties as 18a left them, one or more each", () => {
    for (const s of Object.values(surgeons)) {
      expect(s.specialtyIds.length, s.id).toBeGreaterThan(0)
      expect(s.specialtyIds, s.id).toEqual(baseline.specialties[s.id as keyof typeof baseline.specialties])
    }
  })

  it('holds no email on the no-email rooms, and no invented reception@ address anywhere', () => {
    for (const id of NO_EMAIL) expect(surgeonRooms[id]?.contactEmail, id).toBeUndefined()
    const withoutEmail = DIRECTORY_ROOMS.filter((r) => r.contactEmail === undefined).map((r) => r.id)
    expect(new Set(withoutEmail)).toEqual(new Set(NO_EMAIL))
    // The list gives one practice a reception@ inbox of its own (Alistair Ogilvie); no other room holds one.
    const reception = DIRECTORY_ROOMS.filter((r) => r.contactEmail?.startsWith('reception@')).map((r) => r.id)
    expect(reception).toEqual(['RM-ALISTAIROG'])
    for (const r of DIRECTORY_ROOMS) {
      expect(r.contactEmail, r.id).not.toBe('')
      expect(r.phone, r.id).not.toBe('')
      if (r.contactEmail !== undefined) expect(r.contactEmail.endsWith('.example'), r.id).toBe(true)
    }
    expect(surgeonRooms['RM-ELODIEBRAM']?.phone).toBeUndefined()
    expect(surgeonRooms['RM-WIGRAMORTH']?.phone).toBeUndefined()
  })

  it('keeps the email and phone of every directory room that holds one, as before the phase', () => {
    for (const [id, kept] of Object.entries(baseline.directoryRoomsKept)) {
      expect({ contactEmail: surgeonRooms[id]?.contactEmail, phone: surgeonRooms[id]?.phone }, id).toEqual(kept)
    }
    expect(Object.keys(baseline.directoryRoomsKept).length + NO_EMAIL.length).toBe(40)
  })

  it("keeps the five cast rooms' emails and phones", () => {
    expect(SURGEON_ROOMS.map((r) => [r.id, r.contactEmail, r.phone])).toEqual([
      ['RM-RICC', 'reception@riccartonortho.example', '03 555 0141'],
      ['RM-MERI', 'bookings@merivaleeye.example', '03 555 0172'],
      ['RM-AVON', 'admin@avonsidesurgical.example', '03 555 0118'],
      ['RM-FEND', 'rooms@fendaltonspecialists.example', '03 555 0193'],
      ['RM-PAPA', 'reception@papanuispecialists.example', '03 555 0127'],
    ])
  })

  it('names no directory surgeon on a List', () => {
    const directory = new Set(DIRECTORY_SURGEONS.map((s) => s.id))
    expect(Object.values(seed.schedule.lists).filter((l) => l.surgeonId !== undefined && directory.has(l.surgeonId))).toEqual([])
  })
})

describe('catch-up Phase 17a seeded contacts', () => {
  const all = Object.values(surgeonRooms).flatMap((r) => (r.contacts ?? []).map((c) => ({ room: r, c })))

  it('every contact has a unique RC- id, a plausible .example email and a role; a named surgeon is of that room', () => {
    expect(new Set(all.map(({ c }) => c.id)).size).toBe(all.length)
    for (const { room, c } of all) {
      expect(c.id.startsWith('RC-'), c.id).toBe(true)
      expect(/^[^\s@]+@[^\s@]+\.example$/.test(c.email), c.id).toBe(true)
      expect(['PA', 'PRACTICE_MANAGER']).toContain(c.role)
      if (c.forSurgeonId !== undefined) expect(surgeons[c.forSurgeonId]?.roomIds, c.id).toContain(room.id)
    }
  })

  it("seeds the list's PAs on its pattern and the one invented practice manager", () => {
    const at = (roomId: string) => (surgeonRooms[roomId]?.contacts ?? []).map((c) => [c.name, c.role, c.forSurgeonId ?? 'room'])
    expect(at('RM-AVONHEADEN')).toEqual([['Bev', 'PA', 'S-DALGETY']])
    expect(at('RM-BURNSIDEEN')).toEqual([
      ['Maree', 'PA', 'S-FORSYTHE'], ['Dianne', 'PA', 'S-MALLORY'], ['Nicola Holloway', 'PA', 'room'],
      ['Leanne', 'PA', 'S-CALDER'], ['Leanne', 'PA', 'S-WOODVILLE'],
    ])
    expect(at('RM-REDWOODEYE')).toEqual([['Jodie Yamada', 'PA', 'S-VASQUEZ']])
    expect(at('RM-BRYNDWRNEU')).toEqual([['Wendy', 'PA', 'S-MATHIESON']])
    expect(at('RM-GENERALSUR')).toEqual([['Rosalind Pemberton', 'PRACTICE_MANAGER', 'room']])
    expect(all).toHaveLength(9)
    // Avonhead and Redwood keep their shared inbox; no PA inbox stands in as a room's email.
    expect(surgeonRooms['RM-AVONHEADEN']?.contactEmail).toBe('info@avonheadent.example')
    expect(surgeonRooms['RM-REDWOODEYE']?.contactEmail).toBe('info@redwoodeye.example')
    const paEmails = new Set(all.map(({ c }) => c.email))
    for (const r of Object.values(surgeonRooms)) expect(paEmails.has(r.contactEmail ?? ''), r.id).toBe(false)
  })
})
