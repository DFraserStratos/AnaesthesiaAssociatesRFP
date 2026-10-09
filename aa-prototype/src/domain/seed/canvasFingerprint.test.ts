/**
 * Canvas fingerprint (catch-up Phase 17). Pinned BEFORE Phase 17 touched the
 * seed: surgeon master data, rooms, groups and the office-private slice must
 * not move a single generated List. Every List's id, anaesthetist, status,
 * surgeon and hospital, and every Permanent List's pairing, hash to one number.
 * If a later phase changes the canvas on purpose, re-pin it there and say so.
 */

import { describe, expect, it } from 'vitest'
import { buildSeed } from './index'
import { hashStringToSeed } from './slotHash'

function canvasFingerprint(state: ReturnType<typeof buildSeed>): { lists: number; hash: number } {
  const rows = Object.values(state.schedule.lists)
    .map((l) => `${l.id}|${l.anaesthetistId}|${l.dateISO}|${l.session}|${l.statusKey}|${l.surgeonId ?? ''}|${l.hospitalId ?? ''}`)
    .sort()
  const templates = Object.values(state.masters.permanentLists)
    .map((t) => `${t.id}|${t.anaesthetistId}|${t.dayOfWeek}|${t.session}|${t.surgeonId ?? ''}|${t.hospitalId ?? ''}`)
    .sort()
  return { lists: rows.length, hash: hashStringToSeed([...rows, ...templates].join('\n')) }
}

describe('canvas fingerprint (Phase 17: surgeon masters move no List)', () => {
  it('matches the pre-Phase-17 canvas', () => {
    expect(canvasFingerprint(buildSeed())).toEqual({ lists: 3877, hash: 3280349531 })
  })
})
