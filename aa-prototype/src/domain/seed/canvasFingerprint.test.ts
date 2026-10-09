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
    expect(canvasFingerprint(buildSeed())).toEqual({ slots: 3864, lists: 1117, hash: 3794423627 })
  })
})
