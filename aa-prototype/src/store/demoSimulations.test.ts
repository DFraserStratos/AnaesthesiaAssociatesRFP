/**
 * Simulate sickness (catch-up Phase 30, re-pointed in 32b; D59, OQ-81 part 3
 * answered): the office records an anaesthetist's phoned-in sickness, and in
 * the same commit the List goes back to the office as a Draft List or on to the
 * first open colleague in the office's order. Never a conflict.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { conflictRows, listInSlot } from './selectors'
import { simulateSickness, sicknessCandidates, sicknessColleagueSlot, sicknessRefusal, SIMULATED_SICKNESS_NOTE } from './demoSimulations'

const WED22 = '2026-07-22'
const SHARMA_PM = 'L-41267-2026-07-22-PM'

describe('simulateSickness', () => {
  it('to the office: the List becomes a Draft List with its Bookings, the session is Unavailable with the note, no conflict, the office audited, no notice', () => {
    const api = createAppStore()
    const bookings = () => Object.values(api.getState().schedule.bookings).filter((b) => b.listId === SHARMA_PM).map((b) => b.id)
    const before = bookings()
    const list = assigned(api.getState().schedule.lists[SHARMA_PM])
    const closuresBefore = list.conflicts.filter((c) => c.kind === 'holiday').length
    const pool = Object.keys(api.getState().notifications).length
    expect(before.length).toBeGreaterThan(0)
    const out = simulateSickness(api, SHARMA_PM, 'office')
    expect(out.ok).toBe(true)
    const after = api.getState().schedule.lists[SHARMA_PM]!
    expect(after).toMatchObject({ state: 'DRAFT', draft: { origin: 'unavailableReturn', by: 'Kirsty W.' } })
    expect(bookings()).toEqual(before)
    // The Southern Cross closure goes with the List; nothing about the sickness is a conflict.
    expect(after.conflicts.filter((c) => c.kind === 'holiday')).toHaveLength(closuresBefore)
    expect(conflictRows(api.getState()).filter((r) => r.listId === SHARMA_PM).every((r) => r.reason === 'Hospital closed')).toBe(true)
    expect(api.getState().schedule.slots[list.slotId]).toMatchObject({ status: 'unavailable', note: SIMULATED_SICKNESS_NOTE })
    expect(listInSlot(api.getState(), list.slotId)).toBeUndefined()
    const status = api.getState().audit.find((a) => a.action === 'session.status' && a.entityId === list.slotId)!
    expect(status).toMatchObject({ who: 'Kirsty W.', role: 'office' })
    expect(api.getState().audit.find((a) => a.action === 'draftList.detach' && a.entityId === SHARMA_PM)).toMatchObject({ who: 'Kirsty W.', role: 'office' })
    expect(Object.keys(api.getState().notifications)).toHaveLength(pool)
    expect(api.getState().audit.some((a) => a.action === 'list.conflict')).toBe(false)
  })

  it("to a colleague: the first open colleague in the office's order takes the List, ACTIVE, and the session is Unavailable", () => {
    const api = createAppStore()
    const list = assigned(api.getState().schedule.lists[SHARMA_PM])
    const toSlotId = sicknessColleagueSlot(api.getState(), SHARMA_PM)!
    expect(toSlotId).toBeDefined()
    const out = simulateSickness(api, SHARMA_PM, 'colleague')
    expect(out.ok && out.value.toAnaesthetistId).toBe(api.getState().schedule.slots[toSlotId]!.anaesthetistId)
    expect(api.getState().schedule.lists[SHARMA_PM]).toMatchObject({ state: 'ACTIVE', slotId: toSlotId })
    expect(api.getState().schedule.slots[list.slotId]).toMatchObject({ status: 'unavailable' })
    expect(api.getState().audit.find((a) => a.action === 'list.reassign' && a.entityId === SHARMA_PM)).toMatchObject({ role: 'office' })
    // Deterministic: the same pick from a reset.
    expect(sicknessColleagueSlot(createAppStore().getState(), SHARMA_PM)).toBe(toSlotId)
  })

  it('a second press on the same session is refused: already unavailable (and the List has gone)', () => {
    const api = createAppStore()
    const slotId = assigned(api.getState().schedule.lists[SHARMA_PM]).slotId
    simulateSickness(api, SHARMA_PM)
    expect(api.getState().schedule.slots[slotId]?.status).toBe('unavailable')
    expect(sicknessRefusal(api.getState(), SHARMA_PM)).toBe('This List has no anaesthetist yet')
    expect(simulateSickness(api, SHARMA_PM).ok).toBe(false)
  })

  it("offers the day's assigned, non-AUTHORISED Lists, Lists with Bookings first; Rutherford's returned List is not one", () => {
    const api = createAppStore()
    const ids = sicknessCandidates(api.getState(), WED22).map((l) => l.id)
    expect(ids).toContain(SHARMA_PM)
    expect(ids).not.toContain('L-29104-2026-07-22-AM')
    expect(sicknessRefusal(api.getState(), 'L-29104-2026-07-22-AM')).toBe('This List has no anaesthetist yet')
  })
})
