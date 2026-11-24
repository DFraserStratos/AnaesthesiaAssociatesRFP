/**
 * The clock tick event (catch-up Phase 37, work item 5): every clock change
 * emits `clockAdvanced`, after `dayAdvanced` when both fire, so a day advance
 * polls first and then works the Xero sync queue.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import { advanceClockMinutes, advanceClockToNextMorning } from './clockActions'
import { onAppEvent, type AppEvent } from './events'

const unsubs: (() => void)[] = []
afterEach(() => {
  while (unsubs.length > 0) unsubs.pop()!()
})

function record(): AppEvent[] {
  const seen: AppEvent[] = []
  unsubs.push(onAppEvent((e) => seen.push(e)))
  return seen
}

describe('clockAdvanced', () => {
  it('+15 min emits one clockAdvanced and no dayAdvanced', () => {
    const api = createAppStore()
    const seen = record()
    advanceClockMinutes(api, 15)
    expect(seen).toEqual([{ type: 'clockAdvanced', fromISO: '2026-11-24T08:00:00', toISO: '2026-11-24T08:15:00' }])
  })

  it('Next day emits dayAdvanced, then clockAdvanced', () => {
    const api = createAppStore()
    const seen = record()
    advanceClockToNextMorning(api)
    expect(seen.map((e) => e.type)).toEqual(['dayAdvanced', 'clockAdvanced'])
    expect(seen[1]).toEqual({ type: 'clockAdvanced', fromISO: '2026-11-24T08:00:00', toISO: '2026-11-25T08:00:00' })
  })
})
