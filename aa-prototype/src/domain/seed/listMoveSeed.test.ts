/**
 * Seed invariants for the anaesthetist's own List move (catch-up Phase 32).
 * They protect the demo beats rather than patch data: the move, the privacy
 * case, the unavailable prompt and the scripted schedule the triggers avoid.
 */

import { describe, expect, it } from 'vitest'
import { ANAE, LIST_MOVE_DEMO, SCRIPTED_BEAT_SCHEDULE, SURG, buildSeed } from './index'
import { addDaysISO, DEMO_TODAY } from '../clock'
import { ownMoveRefusal, pushTargets, type ListMoveInput } from '../listMoves'
import type { AssignedList } from '../types'

const seed = buildSeed()
const input: ListMoveInput = {
  lists: seed.schedule.lists,
  slots: seed.schedule.slots,
  anaesthetists: seed.masters.anaesthetists,
  slotStatuses: seed.masters.slotStatuses,
}
const scriptedLists = new Set<string>(SCRIPTED_BEAT_SCHEDULE.listIds)
const scriptedSlots = new Set<string>(SCRIPTED_BEAT_SCHEDULE.slotIds)
const SIX_DAYS_ON = addDaysISO(DEMO_TODAY, 6)

function souterList(id: string): AssignedList {
  const list = seed.schedule.lists[id]
  if (list === undefined || list.state === 'DRAFT') throw new Error(`${id} is not an assigned List`)
  return list
}

function notPreferredWith(anaesthetistId: string, surgeonId: string): boolean {
  // The seed module, not an app file, reads the office-private slice (Phase 17's allowlist).
  return Object.values(seed.officePrivate.pairingPreferences).some(
    (p) => p.kind === 'NOT_PREFERRED' && p.endedAtISO === undefined && p.anaesthetistId === anaesthetistId && p.surgeonId === surgeonId,
  )
}

describe('the scripted beat schedule', () => {
  it('names Lists and sessions that exist in the pristine seed', () => {
    for (const id of SCRIPTED_BEAT_SCHEDULE.listIds) expect(seed.schedule.lists[id], id).toBeDefined()
    for (const id of SCRIPTED_BEAT_SCHEDULE.slotIds) expect(seed.schedule.slots[id], id).toBeDefined()
  })

  it("holds S2 Beat 3a's Southern Cross Lists on Wed 22 and Thu 23 (the closure and where it moves)", () => {
    const sx = Object.values(seed.schedule.lists).filter((l) => l.state !== 'DRAFT' && l.hospitalId === 'H-SX' && (l.dateISO === '2026-07-22' || l.dateISO === '2026-07-23'))
    expect(sx.length).toBeGreaterThan(0)
    for (const l of sx) expect(scriptedLists.has(l.id), l.id).toBe(true)
  })

  it("holds S2 Beat 3's target, Dr Sharma's Wed 22 AM session, and Dr Rutherford's sick List", () => {
    expect(scriptedSlots.has(`S-${ANAE.sharma}-2026-07-22-AM`)).toBe(true)
    expect(scriptedLists.has(`L-${ANAE.rutherford}-2026-07-22-AM`)).toBe(true)
  })
})

describe('Dr Souter can move a List (the demo beat)', () => {
  it('her St George\'s Mon 27 Jul PM List is ACTIVE, has a surgeon, is in the next six days, unscripted and has colleagues to take it', () => {
    const list = souterList(LIST_MOVE_DEMO.movableListId)
    expect(list).toMatchObject({ anaesthetistId: ANAE.souter, state: 'ACTIVE', hospitalId: 'H-STG', surgeonId: SURG.lim })
    expect(list.dateISO <= SIX_DAYS_ON).toBe(true)
    expect(scriptedLists.has(list.id)).toBe(false)
    expect(ownMoveRefusal(input, list.id, ANAE.souter, DEMO_TODAY)).toBeNull()
    expect(pushTargets(input, list.id).length).toBeGreaterThan(2)
  })

  it('the privacy case is reachable: Dr Ropata has an active not-preferred pairing with its surgeon and is offered like anyone else', () => {
    const list = souterList(LIST_MOVE_DEMO.movableListId)
    expect(notPreferredWith(LIST_MOVE_DEMO.privacyColleagueId, list.surgeonId)).toBe(true)
    const targets = pushTargets(input, list.id)
    const colleague = targets.find((t) => t.anaesthetistId === LIST_MOVE_DEMO.privacyColleagueId)
    expect(colleague).toBeDefined()
    expect(Object.keys(colleague ?? {}).sort()).toEqual(['anaesthetistId', 'name', 'phone', 'slotId'])
    expect(scriptedSlots.has(colleague?.slotId ?? '')).toBe(false)
  })

  it('her Thu 23 Jul AM List can go back to the office from List detail', () => {
    const list = souterList(LIST_MOVE_DEMO.returnListId)
    expect(list.dateISO <= SIX_DAYS_ON).toBe(true)
    expect(scriptedLists.has(list.id)).toBe(false)
    expect(ownMoveRefusal(input, list.id, ANAE.souter, DEMO_TODAY)).toBeNull()
  })

  it('the unavailable prompt is demoable: her Thu 23 Jul PM session holds a different movable List with colleagues to take it', () => {
    const slot = seed.schedule.slots[LIST_MOVE_DEMO.unavailableSlotId]
    expect(slot?.anaesthetistId).toBe(ANAE.souter)
    const list = Object.values(seed.schedule.lists).find((l) => l.slotId === LIST_MOVE_DEMO.unavailableSlotId)
    expect(list).toBeDefined()
    expect(list?.id).not.toBe(LIST_MOVE_DEMO.movableListId)
    expect(list?.id).not.toBe(LIST_MOVE_DEMO.returnListId)
    expect(scriptedLists.has(list?.id ?? '')).toBe(false)
    expect(scriptedSlots.has(LIST_MOVE_DEMO.unavailableSlotId)).toBe(false)
    expect(ownMoveRefusal(input, list?.id ?? '', ANAE.souter, DEMO_TODAY)).toBeNull()
    expect(pushTargets(input, list?.id ?? '').length).toBeGreaterThan(0)
  })
})

describe('the pool', () => {
  it('seeds empty', () => {
    expect(seed.notifications).toEqual({})
  })
})
