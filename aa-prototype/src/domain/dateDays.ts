/**
 * Shared pure date-in-days helpers (Phase 10), so the contact-archive job and
 * the other day counts age dates the same way. (The anaesthetist ageing
 * buckets are gone: catch-up Phase 38, D8.) Deterministic, UTC-midnight based;
 * no `Date.now()` (domain purity).
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
