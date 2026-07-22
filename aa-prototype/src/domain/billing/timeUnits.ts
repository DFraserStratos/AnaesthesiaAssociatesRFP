/**
 * Tiered time units (T) — the RFP's T1/T2 rule: 1 unit per 15 minutes for the
 * first 2 hours, then 1 unit per 10 minutes from the third hour.
 */

/**
 * ASSUMPTION (Decisions log 2026-07-22; discovery item, not a settled rule):
 * the RFP defines the T1/T2 tier boundaries but is SILENT on partial-interval
 * rounding. The prototype rounds UP per started interval; a demo-surface note
 * (control panel now, Phase 04 T-stepper tooltip later) says so, and AA must
 * confirm the real rule in discovery.
 */
export const PARTIAL_INTERVAL_ROUNDING = 'up' as const

/** Minutes covered by the first tier (1 unit / 15 min). */
const TIER1_MINUTES = 120
const TIER1_INTERVAL = 15
const TIER2_INTERVAL = 10
const TIER1_UNITS = TIER1_MINUTES / TIER1_INTERVAL // 8

/**
 * Time units for an elapsed span in minutes. Non-positive spans yield 0.
 * Boundary behaviour (unit-tested): exactly 120 min = 8 units; 121 min enters
 * the second tier's first started interval = 9 units.
 */
export function timeUnitsFromMinutes(minutes: number): number {
  if (minutes <= 0) return 0
  if (minutes <= TIER1_MINUTES) return Math.ceil(minutes / TIER1_INTERVAL)
  return TIER1_UNITS + Math.ceil((minutes - TIER1_MINUTES) / TIER2_INTERVAL)
}

/** Time units between anaesthetic start and handover. Non-positive spans yield 0. */
export function timeUnits(start: Date, end: Date): number {
  return timeUnitsFromMinutes((end.getTime() - start.getTime()) / 60000)
}
