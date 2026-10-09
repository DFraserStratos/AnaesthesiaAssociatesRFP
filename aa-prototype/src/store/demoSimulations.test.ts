/**
 * Simulate sickness (catch-up Phase 30; OQ-81 part 3, provisional): the office
 * records an anaesthetist's phoned-in sickness; the List and its Bookings stay
 * and the one rule flags it.
 */

import { assigned } from '../test/lists'
import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { conflictRows } from './selectors'
import { simulateSickness, sicknessCandidates, sicknessRefusal, SIMULATED_SICKNESS_NOTE } from './demoSimulations'

const WED22 = '2026-07-22'
const SHARMA_PM = 'L-41267-2026-07-22-PM'

describe('simulateSickness', () => {
  it('raises one availability conflict with the note, keeps the List and its Bookings, and audits the office', () => {
    const api = createAppStore()
    const bookings = () => Object.values(api.getState().schedule.bookings).filter((b) => b.listId === SHARMA_PM).map((b) => b.id)
    const before = bookings()
    const list = assigned(api.getState().schedule.lists[SHARMA_PM])
    expect(before.length).toBeGreaterThan(0)
    const out = simulateSickness(api, SHARMA_PM)
    expect(out.ok).toBe(true)
    const after = assigned(api.getState().schedule.lists[SHARMA_PM])
    expect(after.slotId).toBe(list.slotId)
    expect(bookings()).toEqual(before)
    expect(after.conflicts.filter((c) => c.kind === 'availability')).toHaveLength(1)
    expect(api.getState().schedule.slots[list.slotId]).toMatchObject({ status: 'unavailable', note: SIMULATED_SICKNESS_NOTE })
    const row = conflictRows(api.getState()).find((r) => r.listId === SHARMA_PM && r.kind === 'availability')!
    expect(row.detail).toContain('phoned in, simulated')
    const status = api.getState().audit.find((a) => a.action === 'session.status' && a.entityId === list.slotId)!
    expect(status).toMatchObject({ who: 'Kirsty W.', role: 'office' })
  })

  it('a second press on the same List is refused: already unavailable', () => {
    const api = createAppStore()
    simulateSickness(api, SHARMA_PM)
    expect(sicknessRefusal(api.getState(), SHARMA_PM)).toBe('Already unavailable')
    expect(simulateSickness(api, SHARMA_PM).ok).toBe(false)
  })

  it('offers the day\'s non-AUTHORISED Lists, Lists with Bookings first; Rutherford\'s seeded sickness is already unavailable', () => {
    const api = createAppStore()
    const ids = sicknessCandidates(api.getState(), WED22).map((l) => l.id)
    expect(ids).toContain(SHARMA_PM)
    expect(ids.indexOf(SHARMA_PM)).toBeLessThan(ids.indexOf('L-29104-2026-07-22-AM'))
    expect(sicknessRefusal(api.getState(), 'L-29104-2026-07-22-AM')).toBe('Already unavailable')
  })
})
