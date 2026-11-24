/**
 * Catch-up Phase 17b seed pins (DM-60, US-13.6.2, US-13.6.5; D74, D76): from
 * `__parity__/phase-17b-baseline.json`, written before any edit. Names,
 * specialties, registration numbers, groups, pairings, tiers and every List's
 * surgeon are unchanged; every surgeon's practice name and office contacts
 * come from the rooms they held (the pinned rooms only, never the real list);
 * the four two-practice surgeons hold a contact for each practice; exactly
 * three surgeons hold no HPI CPN; no field anywhere is ''.
 */

import { describe, expect, it } from 'vitest'
import { buildSeed } from '../domain/seed'
import { DIRECTORY_SURGEONS } from '../domain/seed/specialistDirectory'
import { officeAddressFor } from '../domain/surgeonContacts'
import baseline from './__parity__/phase-17b-baseline.json'
// Catch-up Phase 40's declared move: Dr Sharma's appended HS history is set aside.
import { seedWithoutPhase40 } from './__parity__/phase40Declared'

const seed = seedWithoutPhase40(buildSeed())
const { surgeons } = seed.masters

interface PinnedRoom { name: string; contactEmail?: string; phone?: string; contacts?: { name: string; email: string; forSurgeonId?: string }[] }
const rooms = baseline.rooms as Record<string, PinnedRoom>
const pinned = baseline.surgeons as Record<string, { name: string; specialtyIds: string[]; hpiId: string; medicalRegistrationNumber: string | null; roomIds: string[] }>

const BLANK_HPI = ['S-WHAANGA', 'S-OSEI', 'S-SELWYN']
const TWO_PRACTICE = ['S-WINSLOW', 'S-WAINWRIGHT', 'S-MORLAND', 'S-VAUGHAN']

/** The office contacts item 5 derives from a surgeon's rooms: the PA named for them, whole-room contacts, then the inbox. */
function expectedOffice(id: string) {
  const out: { name?: string; email?: string; phone?: string }[] = []
  for (const roomId of pinned[id]!.roomIds) {
    const r = rooms[roomId]!
    for (const c of r.contacts ?? []) if (c.forSurgeonId === id) out.push({ name: c.name, email: c.email })
    for (const c of r.contacts ?? []) if (c.forSurgeonId === undefined) out.push({ name: c.name, email: c.email })
    if (r.contactEmail !== undefined || r.phone !== undefined) {
      out.push({ name: r.name, ...(r.contactEmail !== undefined ? { email: r.contactEmail } : {}), ...(r.phone !== undefined ? { phone: r.phone } : {}) })
    }
  }
  return out
}

describe('catch-up Phase 17b seed', () => {
  it('keeps every surgeon, in order, with their name, specialties and registration number', () => {
    expect(DIRECTORY_SURGEONS).toHaveLength(131)
    expect(Object.keys(surgeons)).toEqual(baseline.surgeonOrder)
    for (const [id, was] of Object.entries(pinned)) {
      const s = surgeons[id]!
      expect(s.name, id).toBe(was.name)
      expect(s.specialtyIds, id).toEqual(was.specialtyIds)
      expect(s.medicalRegistrationNumber ?? null, id).toBe(was.medicalRegistrationNumber)
    }
  })

  it('keeps every HPI CPN but three, and holds those three as absent', () => {
    for (const [id, was] of Object.entries(pinned)) {
      if (BLANK_HPI.includes(id)) expect(surgeons[id], id).not.toHaveProperty('hpiId')
      else expect(surgeons[id]!.hpiId, id).toBe(was.hpiId)
    }
    expect(Object.values(surgeons).filter((s) => s.hpiId === undefined).map((s) => s.id)).toEqual(BLANK_HPI)
  })

  it('the three blank surgeons are named by no List, group or pairing', () => {
    const listed = new Set(Object.values(seed.schedule.lists).map((l) => l.surgeonId))
    const grouped = new Set(Object.values(seed.masters.surgeonGroups).flatMap((g) => g.memberSurgeonIds))
    const paired = new Set(Object.values(seed.officePrivate.pairingPreferences).map((p) => p.surgeonId))
    const contracts = JSON.stringify(seed.masters.contracts)
    for (const id of BLANK_HPI) {
      expect(listed.has(id) || grouped.has(id) || paired.has(id) || contracts.includes(id), id).toBe(false)
    }
  })

  it("gives every surgeon the practice name of the rooms they held, two practices joined with ' and '", () => {
    for (const [id, was] of Object.entries(pinned)) {
      expect(surgeons[id]!.practiceName, id).toBe(was.roomIds.map((r) => rooms[r]!.name).join(' and '))
    }
  })

  it('gives every surgeon office contacts from their rooms: the named PA, whole-room contacts, then the inbox', () => {
    for (const id of Object.keys(pinned)) expect(surgeons[id]!.officeContacts, id).toEqual(expectedOffice(id))
    expect(surgeons['S-DALGETY']!.officeContacts[0]).toEqual({ name: 'Bev', email: 'bev@avonheadent.example' })
    expect(officeAddressFor(seed.masters, 'S-DALGETY').to?.email).toBe('bev@avonheadent.example')
  })

  it('holds an office contact for each practice of the four two-practice surgeons', () => {
    for (const id of TWO_PRACTICE) {
      const practices = pinned[id]!.roomIds.map((r) => rooms[r]!.name)
      for (const name of practices) expect(surgeons[id]!.officeContacts.some((c) => c.name === name), `${id} ${name}`).toBe(true)
    }
  })

  it("gives every surgeon a personal contact with their name; the cast's carry an .example email and a 021 555 phone", () => {
    for (const s of Object.values(surgeons)) expect(s.personalContact.name, s.id).toBe(s.name)
    const cast = Object.values(surgeons).filter((s) => !DIRECTORY_SURGEONS.some((d) => d.id === s.id))
    expect(cast).toHaveLength(10)
    for (const s of cast) {
      expect(s.personalContact.email, s.id).toMatch(/@surgeons\.example$/)
      expect(s.personalContact.phone, s.id).toMatch(/^021 555 /)
    }
  })

  it("holds no '' field, no all-blank office set and no room anywhere", () => {
    for (const s of Object.values(surgeons)) {
      expect(JSON.stringify(s), s.id).not.toContain('""')
      for (const c of s.officeContacts) expect(Object.keys(c).length, s.id).toBeGreaterThan(0)
      expect(s, s.id).not.toHaveProperty('roomIds')
    }
    expect(seed.masters).not.toHaveProperty('surgeonRooms')
  })

  it('keeps groups, pairings, tiers and every List\'s surgeon', () => {
    expect(seed.masters.surgeonGroups).toEqual(baseline.surgeonGroups)
    expect(seed.officePrivate).toEqual(baseline.officePrivate)
    // Recurring Lists skip public holidays (24 Nov 2026) and the hospitals' Christmas shutdowns, and the
    // horizon ends Wed 24 Mar 2027 (the baseline's ran three days further): only those Lists are no longer made.
    const closedDates = new Set([
      ...Object.values(seed.masters.publicHolidays).map((p) => p.dateISO),
      ...Object.values(seed.masters.holidays).filter((h) => h.shutdown === true).map((h) => h.dateISO),
    ])
    const gone = Object.keys(baseline.listSurgeons).filter((id) => seed.schedule.lists[id] === undefined)
    for (const id of gone) {
      const dateISO = /\d{4}-\d\d-\d\d/.exec(id)?.[0]
      expect(dateISO !== undefined && (dateISO > '2027-03-24' || dateISO < '2026-11-10' || closedDates.has(dateISO)), id).toBe(true)
    }
    expect(gone.length).toBeGreaterThan(10)
    const expected = Object.fromEntries(Object.entries(baseline.listSurgeons).filter(([id]) => !gone.includes(id)))
    expect(Object.fromEntries(Object.values(seed.schedule.lists).map((l) => [l.id, l.surgeonId ?? null]))).toEqual(expected)
  })
})
