/**
 * The availability result line (catch-up Phase 29): only what happened, no
 * "notified", no dashes, no "slot".
 */

import { describe, expect, it } from 'vitest'
import { describeAvailabilityOutcome } from './describeAvailabilityOutcome'
import type { AvailabilityOutcome } from '../../store'

const outcome = (over: Partial<AvailabilityOutcome> = {}): AvailabilityOutcome => ({
  set: 0, unchanged: 0, flagged: [], cleared: [], seriesEdited: 0, leftAsIs: 0, holdingLists: 0, statusKey: 'holiday', ...over,
})

const clean = (line: string) => {
  expect(line).not.toMatch(/[–—]/)
  expect(line).not.toMatch(/slot/i)
  expect(line).not.toMatch(/notif|told/i)
  return line
}

describe('describeAvailabilityOutcome', () => {
  it('a range: the count, the status and the dates', () => {
    expect(clean(describeAvailabilityOutcome(outcome({ set: 10 }), { kind: 'range', statusLabel: 'On holiday', fromISO: '2026-07-24', toISO: '2026-08-07' })))
      .toBe('10 sessions set to On holiday, 24 Jul to 7 Aug.')
    expect(describeAvailabilityOutcome(outcome({ set: 1 }), { kind: 'range', statusLabel: 'Unavailable', fromISO: '2026-07-21', toISO: '2026-07-21' }))
      .toBe('1 session set to Unavailable on Tue 21 Jul.')
    expect(describeAvailabilityOutcome(outcome({ unchanged: 2 }), { kind: 'range', statusLabel: 'Free' })).toBe('Already Free. Nothing changed.')
  })

  it('never says a List was flagged or the office told (catch-up Phase 32: her closed status over a List is asked about first)', () => {
    const line = clean(describeAvailabilityOutcome(outcome({ set: 1, flagged: ['L1'] }), { kind: 'range', statusLabel: 'Unavailable', fromISO: '2026-07-21' }))
    expect(line).toBe('1 session set to Unavailable on Tue 21 Jul.')
    expect(line).not.toMatch(/flagged|office/i)
  })

  it('after the unavailable prompt moved the Lists first, counts their sessions and says where the Lists went (catch-up Phase 32)', () => {
    expect(clean(describeAvailabilityOutcome(outcome({ unchanged: 1 }), { kind: 'range', statusLabel: 'Unavailable', fromISO: '2026-07-23', movedFirst: { lists: 1, sessionsAlreadySet: 1 } })))
      .toBe('1 session set to Unavailable on Thu 23 Jul. Its List went first, where you chose.')
    expect(describeAvailabilityOutcome(outcome({ set: 4 }), { kind: 'range', statusLabel: 'On holiday', movedFirst: { lists: 2, sessionsAlreadySet: 2 } }))
      .toBe('6 sessions set to On holiday. 2 Lists went first, where you chose.')
  })

  it('a bookable status over a List: nothing flagged, a conflict resolved', () => {
    expect(describeAvailabilityOutcome(outcome({ set: 1, holdingLists: 1 }), { kind: 'range', statusLabel: 'Free', fromISO: '2026-07-21' }))
      .toBe('1 session set to Free on Tue 21 Jul. The List stays in place.')
    expect(describeAvailabilityOutcome(outcome({ set: 1, cleared: ['L1'], holdingLists: 1 }), { kind: 'range', statusLabel: 'Free' }))
      .toBe("1 session set to Free. 1 List's conflict was resolved.")
  })

  it('a series and its deletion', () => {
    expect(clean(describeAvailabilityOutcome(outcome({ set: 9, leftAsIs: 1 }), { kind: 'series', statusLabel: 'Unavailable', seriesLine: 'Unavailable, Friday PM, every 2 weeks, no end date' })))
      .toBe('Series saved: Unavailable, Friday PM, every 2 weeks, no end date. 9 sessions set, 1 already set left as it is.')
    expect(describeAvailabilityOutcome(outcome({ set: 8, unchanged: 1 }), { kind: 'seriesDeleted', statusLabel: 'Free' }))
      .toBe('Series deleted. 8 sessions back to Free, 1 changed day kept.')
  })

  it('a removal, and an instance deleted from its series', () => {
    expect(describeAvailabilityOutcome(outcome({ set: 1 }), { kind: 'cleared', statusLabel: 'Free', fromISO: '2026-08-21' })).toBe('Back to Free on Fri 21 Aug.')
    expect(describeAvailabilityOutcome(outcome({ set: 1, seriesEdited: 1 }), { kind: 'cleared', statusLabel: 'Free', fromISO: '2026-08-21' }))
      .toBe('Back to Free on Fri 21 Aug. It is no longer part of the series.')
  })
})
