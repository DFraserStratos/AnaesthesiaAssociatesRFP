/**
 * Canvas fingerprint (catch-up Phase 17; re-pinned once in Phase 28). Every
 * session's Slot id, anaesthetist, date and displayed status, the List in it
 * (id, surgeon, hospital), every backdrop List, and every recurring booking's
 * pairing hash to one number, so a phase that must not move the canvas
 * cannot do so silently.
 *
 * Phase 28 re-pinned it on purpose: the canvas became Slots and Lists, and
 * generation stopped inventing sessions beyond the seed's recorded window
 * (US-01.1.1); the golden test (`canvasGolden.test.ts`) proves the demo
 * window itself did not move. If a later phase changes the canvas on
 * purpose, re-pin it there and say so.
 *
 * Catch-up Phase 31 re-pinned it on purpose: every List names a hospital and
 * a surgeon (the pre-op and acute Lists, the AA rooms location), Fitzgerald Tue
 * 21 PM is free, and the 15 seeded Draft Lists join the List count and the hash.
 *
 * Catch-up Phase 30 re-pinned the hash only: recurring-booking ids moved from
 * `PL###` to `RCB###` (DM-53 rename); with the old prefix mapped back the hash
 * is unchanged.
 */

import { describe, expect, it } from 'vitest'
import { buildSeed } from './index'
import { hashStringToSeed } from './slotHash'
import { displayStatusKey } from '../slots'
import type { AssignedList } from '../types'
// Catch-up Phase 40's declared move: Dr Sharma's appended HS history is set aside.
import { seedWithoutPhase40 } from './__fixtures__/phase40Declared'

function canvasFingerprint(state: ReturnType<typeof buildSeed>): { slots: number; lists: number; hash: number } {
  const assignedLists = Object.values(state.schedule.lists).filter((l): l is AssignedList => l.state !== 'DRAFT')
  const bySlot = new Map(assignedLists.map((l) => [l.slotId, l]))
  const sessions = Object.values(state.schedule.slots)
    .map((s) => {
      const l = bySlot.get(s.id)
      return `${s.id}|${s.anaesthetistId}|${s.dateISO}|${s.session}|${displayStatusKey(s, l)}|${l?.id ?? ''}|${l?.surgeonId ?? ''}|${l?.hospitalId ?? ''}`
    })
    .sort()
  const backdrop = assignedLists
    .filter((l) => state.schedule.slots[l.slotId] === undefined)
    .map((l) => `${l.id}|${l.anaesthetistId}|${l.dateISO}|${l.session}|${l.kind}|${l.surgeonId ?? ''}|${l.hospitalId ?? ''}`)
    .sort()
  // Draft Lists take no session (catch-up Phase 31): fingerprinted by their day, session and pairing.
  const drafts = Object.values(state.schedule.lists)
    .filter((l) => l.state === 'DRAFT')
    .map((l) => `${l.id}|${l.dateISO}|${l.session}|${l.kind}|${l.surgeonId}|${l.hospitalId}`)
    .sort()
  const recurringKeys = Object.values(state.masters.recurringBookings)
    .map((t) => `${t.id}|${t.anaesthetistId}|${t.dayOfWeek}|${t.session}|${t.surgeonId ?? ''}|${t.hospitalId ?? ''}`)
    .sort()
  return {
    slots: sessions.length,
    lists: Object.keys(state.schedule.lists).length,
    hash: hashStringToSeed([...sessions, ...backdrop, ...drafts, ...recurringKeys].join('\n')),
  }
}

describe('canvas fingerprint (Phase 17, re-pinned in Phase 28)', () => {
  it('matches the pinned canvas', () => {
    // Re-pinned in catch-up Phase 38a: the twelve browsable-history backdrop Lists
    // (January to March 2026) were appended; the slots and every other List are unchanged.
    // Re-pinned in catch-up Phase 32b: Dr Rutherford's Wed 22 Jul AM List is a returned
    // Draft List (D59), so it leaves his session; same counts, nothing else moved.
    // Re-pinned in catch-up Phase 32d: the public List kind retired (D86). 234 bookless public Lists
    // are Public sessions ("CPH") and the six recurring-clash Draft Lists the public rows raised are gone
    // (1129 - 240 = 889); the 12 that hold Bookings are private. Slots unchanged in number.
    // Re-pinned 24 Nov 2026: recurring Lists skip public holidays, so the ten Labour Day and Canterbury
    // Anniversary Day Lists are no longer made (889 - 10 = 879). Slots unchanged.
    // Re-pinned 25 Nov 2026: the demo day moved 18 weeks to Tue 24 Nov 2026 (every seeded date with it).
    // The four-month horizon now ends Wed 24 Mar 2027, three days short of the shifted end: 84 fewer Slots
    // (3 days x 14 x 2) and 15 fewer far-edge Lists. Recurring Lists skip the Christmas, New Year and
    // Waitangi public holidays and the hospitals' Christmas shutdowns (110 fewer), while the shifted
    // Labour Day and Anniversary Day dates are ordinary days again (10 back): 879 - 15 - 110 + 10 = 764.
    expect(canvasFingerprint(seedWithoutPhase40(buildSeed()))).toEqual({ slots: 3780, lists: 764, hash: 1324293038 })
  })
})
