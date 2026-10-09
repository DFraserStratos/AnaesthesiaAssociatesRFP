/**
 * Seed invariants for catch-up Phase 17: surgeons' rooms, the HPI CPN, groups,
 * hospital emails, and the office-private pairings and tiers, checked against
 * the canvas so no seeded List collides with a not-preferred pairing and the
 * S2 path stays clear. (The canvas itself is pinned by canvasFingerprint.test.ts.)
 */

import { describe, expect, it } from 'vitest'
import { buildSeed, ANAE, SURG } from './index'
import { isPlausibleEmail, isPlausibleHpiCpn, normaliseHpiCpn } from '../surgeons'
import { pairingStatus, tierFor } from '../pairingPreferences'
import { projectedListId, slotIdFor } from '../slots'

const seed = buildSeed()
const { surgeons, surgeonRooms, surgeonGroups, hospitals, anaesthetists } = seed.masters
const { pairingPreferences, priorityTiers } = seed.officePrivate
const entries = Object.values(pairingPreferences)

describe('surgeon masters', () => {
  it('every surgeon has a room and every room has a surgeon', () => {
    for (const s of Object.values(surgeons)) expect(surgeonRooms[s.roomId], s.id).toBeDefined()
    for (const r of Object.values(surgeonRooms)) {
      expect(Object.values(surgeons).some((s) => s.roomId === r.id), r.id).toBe(true)
    }
  })

  it('every surgeon has a plausible HPI CPN, unique across surgeons and anaesthetists', () => {
    const all = [...Object.values(surgeons).map((s) => s.hpiId), ...Object.values(anaesthetists).map((a) => a.hpiId)]
    for (const s of Object.values(surgeons)) {
      expect(isPlausibleHpiCpn(s.hpiId), s.id).toBe(true)
      expect(s.hpiId).toBe(normaliseHpiCpn(s.hpiId))
    }
    expect(new Set(all).size).toBe(all.length)
  })

  it('every group member resolves; SG-COS holds Mr T. Hale', () => {
    for (const g of Object.values(surgeonGroups)) for (const id of g.memberSurgeonIds) expect(surgeons[id], `${g.id} ${id}`).toBeDefined()
    expect(surgeonGroups['SG-COS']?.memberSurgeonIds).toEqual([SURG.hale])
    expect(seed.masters.organisations['O-COS']).toBeDefined()
  })

  it('every hospital and room email is plausible', () => {
    for (const h of Object.values(hospitals)) expect(isPlausibleEmail(h.contactEmail ?? ''), h.id).toBe(true)
    for (const r of Object.values(surgeonRooms)) expect(isPlausibleEmail(r.contactEmail), r.id).toBe(true)
  })
})

describe('office-private seed', () => {
  it('every pairing and tier reference resolves', () => {
    for (const e of entries) {
      expect(anaesthetists[e.anaesthetistId], e.id).toBeDefined()
      expect(surgeons[e.surgeonId], e.id).toBeDefined()
      expect(e.id.startsWith('PP-')).toBe(true)
    }
    for (const id of Object.keys(priorityTiers)) expect(anaesthetists[id], id).toBeDefined()
  })

  it('holds an active not-preferred, an ended one, an active preferred, and both sides', () => {
    const active = entries.filter((e) => e.endedAtISO === undefined)
    expect(active.some((e) => e.kind === 'NOT_PREFERRED')).toBe(true)
    expect(active.some((e) => e.kind === 'PREFERRED')).toBe(true)
    expect(entries.some((e) => e.endedAtISO !== undefined)).toBe(true)
    expect(new Set(entries.map((e) => e.raisedBy))).toEqual(new Set(['SURGEON', 'ANAESTHETIST']))
  })

  it('seeds the demo pairings: Reid not preferred with Sharma, Whitford preferred with Sharma', () => {
    expect(pairingStatus(entries, ANAE.sharma, SURG.reid)).toBe('NOT_PREFERRED')
    expect(pairingStatus(entries, ANAE.sharma, SURG.whitford)).toBe('PREFERRED')
    expect(pairingStatus(entries, ANAE.hughes, SURG.reid)).toBe('NONE')
  })

  it('no seeded List or recurring booking pairs an active not-preferred pair', () => {
    for (const l of Object.values(seed.schedule.lists)) {
      // A Draft List has no anaesthetist to pair with (catch-up Phase 31).
      if (l.anaesthetistId === undefined) continue
      expect(pairingStatus(entries, l.anaesthetistId, l.surgeonId), l.id).not.toBe('NOT_PREFERRED')
    }
    for (const t of Object.values(seed.masters.recurringBookings)) {
      expect(pairingStatus(entries, t.anaesthetistId, t.surgeonId), t.id).not.toBe('NOT_PREFERRED')
    }
  })

  it('keeps the S2 path clear', () => {
    // Beat 2: Sharma's Tue 21 PM with Mr T. Hale.
    expect(pairingStatus(entries, ANAE.sharma, SURG.hale)).toBe('NONE')
    // Beat 3: Rutherford's Wed 22 AM (Whitford's) reassigned to Sharma: preferred, never warned.
    const beat3 = seed.schedule.lists[projectedListId(ANAE.rutherford, '2026-07-22', 'AM')]
    expect(beat3?.surgeonId).toBe(SURG.whitford)
    expect(pairingStatus(entries, ANAE.sharma, beat3?.surgeonId ?? '')).not.toBe('NOT_PREFERRED')
    // The not-preferred demo: Chen's Tue 21 PM is Reid's, with Sharma free that session.
    expect(seed.schedule.lists[projectedListId(ANAE.chen, '2026-07-21', 'PM')]?.surgeonId).toBe(SURG.reid)
    const sharmaPm = seed.schedule.slots[slotIdFor(ANAE.sharma, '2026-07-21', 'PM')]
    expect(sharmaPm?.status).toBe('free')
    expect(Object.values(seed.schedule.lists).some((l) => l.slotId === sharmaPm?.id)).toBe(false)
  })

  it('tiers: five in Tier 1, some left at the Tier 4 default, and the Beat 3 candidates span tiers', () => {
    expect(Object.values(priorityTiers).filter((t) => t === 1)).toHaveLength(5)
    const unset = Object.keys(anaesthetists).filter((id) => priorityTiers[id] === undefined)
    expect(unset.length).toBeGreaterThan(0)
    expect(Object.values(priorityTiers)).not.toContain(4)
    const occupied = new Set(Object.values(seed.schedule.lists).map((l) => l.slotId))
    const free = Object.values(seed.schedule.slots)
      .filter((s) => s.dateISO === '2026-07-22' && s.session === 'AM' && s.status === 'free' && !occupied.has(s.id))
      .map((s) => tierFor(priorityTiers, s.anaesthetistId))
    expect(new Set(free).size).toBeGreaterThanOrEqual(3)
    expect(free.filter((t) => t === 1).length).toBeGreaterThanOrEqual(2)
  })
})
