import { describe, expect, it } from 'vitest'
import { applyDelta, deltaOf, isPersistDelta } from './persistDelta'
import { practiceAppState } from './appStore'

type Rec = Record<string, unknown>

const start = (): Rec => ({
  clock: { todayISO: '2026-11-24', timeHHmm: '08:00' },
  schedule: {
    lists: { L1: { id: 'L1', state: 'ACTIVE' }, L2: { id: 'L2', state: 'ACTIVE' } },
    bookings: { B1: { id: 'B1', listId: 'L1' } },
  },
  settings: { horizonMonths: 4, volumeStory: { softLimit: 1 } },
  audit: [{ id: 'A1' }, { id: 'A2' }],
  act: () => undefined,
})

describe('persistDelta: saving only what changed since the start', () => {
  it('an untouched state saves nothing', () => {
    const s = start()
    expect(deltaOf(s, s)).toEqual({ __delta: 1, top: {} })
  })

  it('saves only the changed, added and removed records of a record map', () => {
    const s = start()
    const schedule = s['schedule'] as Rec
    const lists = schedule['lists'] as Rec
    const next = { ...s, schedule: { ...schedule, lists: { L1: lists['L1'], L3: { id: 'L3', state: 'DRAFT' } } } }
    const d = deltaOf(next, s)
    expect(d.top).toEqual({ schedule: { $sub: { lists: { $records: { L3: { id: 'L3', state: 'DRAFT' } }, $removed: ['L2'] } } } })
  })

  it('saves the audit entries appended after the start, and changed values whole; never a function', () => {
    const s = start()
    const next = { ...s, audit: [...(s['audit'] as unknown[]), { id: 'A3' }], clock: { todayISO: '2026-11-25', timeHHmm: '09:00' }, act: () => 1 }
    const d = deltaOf(next, s)
    expect(d.top['audit']).toEqual({ $append: [{ id: 'A3' }] })
    // A small object of values saves field by field.
    expect(d.top['clock']).toEqual({ $sub: { todayISO: { $value: '2026-11-25' }, timeHHmm: { $value: '09:00' } } })
    expect('act' in d.top).toBe(false)
  })

  it('round-trips: the start with the delta applied equals the state, and unchanged maps stay the start\'s own', () => {
    const s = start()
    const schedule = s['schedule'] as Rec
    const next = {
      ...s,
      schedule: { ...schedule, lists: { ...(schedule['lists'] as Rec), L2: { id: 'L2', state: 'SUBMITTED' } } },
      settings: { ...(s['settings'] as Rec), volumeStory: { softLimit: 2 } },
      audit: [{ id: 'A9' }],
    }
    const json = JSON.parse(JSON.stringify(deltaOf(next, s))) as unknown
    expect(isPersistDelta(json)).toBe(true)
    const back = applyDelta(s, json as never)
    const { act: _a, ...rest } = back
    const { act: _b, ...expected } = next as Rec
    void _a
    void _b
    expect(JSON.parse(JSON.stringify(rest))).toEqual(JSON.parse(JSON.stringify(expected)))
    expect((back['schedule'] as Rec)['bookings']).toBe(schedule['bookings'])
  })

  it('the everyday start (the whole practice) saves as an empty delta, and one changed List saves just that List', () => {
    const s = practiceAppState() as unknown as Rec
    expect(deltaOf(s, s).top).toEqual({})
    const schedule = s['schedule'] as Rec
    const lists = schedule['lists'] as Rec
    const id = Object.keys(lists).find((k) => (lists[k] as { state: string }).state === 'ACTIVE')!
    const next = { ...s, schedule: { ...schedule, lists: { ...lists, [id]: { ...(lists[id] as Rec), notes: 'Changed' } } } }
    const payload = JSON.stringify(deltaOf(next, s))
    expect(payload.length).toBeLessThan(2000)
    const back = applyDelta(s, JSON.parse(payload) as never)
    expect(((back['schedule'] as Rec)['lists'] as Rec)[id]).toEqual({ ...(lists[id] as Rec), notes: 'Changed' })
    expect((back['masters'] as Rec)).toBe(s['masters'])
  })
})
