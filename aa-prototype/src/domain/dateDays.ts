/**
 * Shared pure date-in-days helpers (Phase 10) — lifted out of
 * `seed/anaesthetistDashboard.ts` so the receivables aging (Phase 05/10), the
 * mirror money selectors and the contact-archive job all age dates the same
 * way. Deterministic, UTC-midnight based; no `Date.now()` (domain purity).
 */

/** Whole days from the Unix epoch to an ISO date's calendar day (UTC-midnight). */
export function epochDayOf(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Math.floor(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000)
}

/** Whole days between two ISO dates (`to − from`), by calendar day. */
export function daysBetween(fromISO: string, toISO: string): number {
  return epochDayOf(toISO) - epochDayOf(fromISO)
}

export type AgingBucketKey = 'current' | 'd31_60' | 'd61_90' | 'd90plus'

export function bucketForAgingDays(days: number): AgingBucketKey {
  if (days <= 30) return 'current'
  if (days <= 60) return 'd31_60'
  if (days <= 90) return 'd61_90'
  return 'd90plus'
}
