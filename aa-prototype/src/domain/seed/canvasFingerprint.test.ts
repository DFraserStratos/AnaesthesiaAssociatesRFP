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
 */

import { describe, expect, it } from 'vitest'
import { buildSeed } from './index'
import { hashStringToSeed } from './slotHash'
import { displayStatusKey } from '../slots'

function canvasFingerprint(state: ReturnType<typeof buildSeed>): { slots: number; lists: number; hash: number } {
  const bySlot = new Map(Object.values(state.schedule.lists).map((l) => [l.slotId, l]))
  const sessions = Object.values(state.schedule.slots)
    .map((s) => {
      const l = bySlot.get(s.id)
      return `${s.id}|${s.anaesthetistId}|${s.dateISO}|${s.session}|${displayStatusKey(s, l)}|${l?.id ?? ''}|${l?.surgeonId ?? ''}|${l?.hospitalId ?? ''}`
    })
    .sort()
  const backdrop = Object.values(state.schedule.lists)
    .filter((l) => state.schedule.slots[l.slotId] === undefined)
    .map((l) => `${l.id}|${l.anaesthetistId}|${l.dateISO}|${l.session}|${l.kind}|${l.surgeonId ?? ''}|${l.hospitalId ?? ''}`)
    .sort()
  const templates = Object.values(state.masters.permanentLists)
    .map((t) => `${t.id}|${t.anaesthetistId}|${t.dayOfWeek}|${t.session}|${t.surgeonId ?? ''}|${t.hospitalId ?? ''}`)
    .sort()
  return {
    slots: sessions.length,
    lists: Object.keys(state.schedule.lists).length,
    hash: hashStringToSeed([...sessions, ...backdrop, ...templates].join('\n')),
  }
}

describe('canvas fingerprint (Phase 17, re-pinned in Phase 28)', () => {
  it('matches the pinned canvas', () => {
    expect(canvasFingerprint(buildSeed())).toEqual({ slots: 3864, lists: 1103, hash: 1253068603 })
  })
})
