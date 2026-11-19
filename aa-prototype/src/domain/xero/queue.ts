/**
 * The Xero sync queue's rules (catch-up Phase 37; EP-09's resilience brief):
 * "a failed call retries automatically with exponential backoff, so nothing is
 * lost", with alerting after repeated failures. Pure: the times are demo-clock
 * ISO stamps (`YYYY-MM-DDTHH:mm:00`), never `Date.now()`.
 */

import { advanceMinutes } from '../clock'

// Demo values; production timings are a Scoping decision.
/** The first retry waits this long after the failed call. */
export const XERO_RETRY_BASE_MINUTES = 2
/** No wait is ever longer than this. */
export const XERO_RETRY_CAP_MINUTES = 60
/** From this many failed attempts on, the item is alerted (in production AA's support team hears of it). */
export const XERO_ALERT_AFTER_ATTEMPTS = 5

/** The wait after the `attempts`th failed attempt: base x 2^(attempts - 1), capped (2, 4, 8, 16, 32, 60, 60 ...). */
export function retryDelayMinutes(attempts: number): number {
  if (!Number.isFinite(attempts) || attempts < 1) return XERO_RETRY_BASE_MINUTES
  const n = Math.floor(attempts)
  // Past the cap the doubling no longer matters; stop before 2^n overflows.
  if (n > 30) return XERO_RETRY_CAP_MINUTES
  return Math.min(XERO_RETRY_BASE_MINUTES * 2 ** (n - 1), XERO_RETRY_CAP_MINUTES)
}

/** A demo-clock ISO stamp moved on by `minutes` (day roll included). */
export function addMinutesISO(atISO: string, minutes: number): string {
  const todayISO = atISO.slice(0, 10)
  const hh = Number(atISO.slice(11, 13))
  const mm = Number(atISO.slice(14, 16))
  const next = advanceMinutes({ todayISO, minutesSinceMidnight: hh * 60 + mm }, minutes)
  const h = Math.floor(next.minutesSinceMidnight / 60)
  const m = next.minutesSinceMidnight % 60
  return `${next.todayISO}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

/** When the next attempt is due after the `attempts`th failed one, made at `fromISO`. */
export function nextAttemptISO(fromISO: string, attempts: number): string {
  return addMinutesISO(fromISO, retryDelayMinutes(attempts))
}

/** Whether an open item is due at `nowISO` (at or after its next attempt). Sent items are never due. */
export function isDue(item: { status: string; nextAttemptAtISO: string }, nowISO: string): boolean {
  return item.status !== 'sent' && item.nextAttemptAtISO <= nowISO
}

/** Whether an item has failed often enough to alert. */
export function isAlerted(attempts: number): boolean {
  return attempts >= XERO_ALERT_AFTER_ATTEMPTS
}
