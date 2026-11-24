import { describe, expect, it } from 'vitest'
import { addMinutesISO, isAlerted, isDue, nextAttemptISO, retryDelayMinutes, XERO_ALERT_AFTER_ATTEMPTS, XERO_RETRY_CAP_MINUTES } from './queue'

describe('Xero queue rules (catch-up Phase 37)', () => {
  it('doubles from 2 minutes and caps at 60', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 20].map(retryDelayMinutes)).toEqual([2, 4, 8, 16, 32, 60, 60, 60])
    expect(retryDelayMinutes(1000)).toBe(XERO_RETRY_CAP_MINUTES)
  })

  it('guards attempt 0 and nonsense to the base wait', () => {
    expect(retryDelayMinutes(0)).toBe(2)
    expect(retryDelayMinutes(-3)).toBe(2)
    expect(retryDelayMinutes(Number.NaN)).toBe(2)
  })

  it('moves an ISO stamp on by minutes, across midnight', () => {
    expect(addMinutesISO('2026-11-24T09:00:00', 2)).toBe('2026-11-24T09:02:00')
    expect(addMinutesISO('2026-11-24T23:50:00', 32)).toBe('2026-11-25T00:22:00')
    expect(nextAttemptISO('2026-11-24T09:00:00', 3)).toBe('2026-11-24T09:08:00')
  })

  it('is due at and after the boundary, not before; sent is never due', () => {
    const item = { status: 'waiting', nextAttemptAtISO: '2026-11-24T09:02:00' }
    expect(isDue(item, '2026-11-24T09:01:00')).toBe(false)
    expect(isDue(item, '2026-11-24T09:02:00')).toBe(true)
    expect(isDue(item, '2026-11-24T09:03:00')).toBe(true)
    expect(isDue({ ...item, status: 'alerted' }, '2026-11-24T09:03:00')).toBe(true)
    expect(isDue({ ...item, status: 'sent' }, '2026-11-24T09:03:00')).toBe(false)
  })

  it('alerts from the fifth attempt', () => {
    expect(isAlerted(XERO_ALERT_AFTER_ATTEMPTS - 1)).toBe(false)
    expect(isAlerted(XERO_ALERT_AFTER_ATTEMPTS)).toBe(true)
  })

  it('is deterministic', () => {
    expect(nextAttemptISO('2026-11-24T09:00:00', 4)).toBe(nextAttemptISO('2026-11-24T09:00:00', 4))
  })
})
