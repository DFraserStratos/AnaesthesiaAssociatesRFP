/**
 * Tiered time units (T), held as data (catch-up Phase 19a; US-05.2.2, D25,
 * OQ-75; AR-16 `#time-units`).
 *
 * The anaesthetist enters only the anaesthetic start and finish; the system
 * works out the units from the RVG time rule in `masters.rvgTimeRule`: 1 unit
 * per 15 minutes or part for the first two hours, then 1 unit per 10 minutes
 * or part. A part interval always rounds up (confirmed with AA: OQ-75). The
 * tiers are data, not code ("define them", Greg and Donald), so a different
 * rule is a data change; the editor is Phase 42's.
 */

export interface RvgTimeTier {
  /** The minute this tier starts at (the first tier starts at 0). */
  fromMinute: number
  /** One unit per this many minutes, or part, within the tier. */
  intervalMinutes: number
}

export interface RvgTimeRule {
  /** In order of `fromMinute`, the first from 0. */
  tiers: RvgTimeTier[]
  /** How a part interval counts: always up under the RVG (D25). */
  partInterval: 'roundUp'
}

/**
 * The seeded rule (the NZSA RVG tiers). Only the seed reads it: every runtime
 * path takes the rule from `masters.rvgTimeRule`.
 */
export const DEFAULT_RVG_TIME_RULE: RvgTimeRule = {
  tiers: [
    { fromMinute: 0, intervalMinutes: 15 },
    { fromMinute: 120, intervalMinutes: 10 },
  ],
  partInterval: 'roundUp',
}

/**
 * Time units for an elapsed span in minutes under a rule. Non-positive spans
 * yield 0. Each tier counts its own minutes in its interval, a part interval
 * rounded up: 95 minutes is 7, 120 is 8, 121 is 9, 125 is 9.
 */
export function timeUnitsFromMinutes(minutes: number, rule: RvgTimeRule): number {
  if (!(minutes > 0)) return 0
  let units = 0
  rule.tiers.forEach((tier, i) => {
    const next = rule.tiers[i + 1]
    const end = next === undefined ? minutes : Math.min(minutes, next.fromMinute)
    const span = end - tier.fromMinute
    if (span > 0) units += Math.ceil(span / tier.intervalMinutes)
  })
  return units
}

/** Time units between anaesthetic start and handover under a rule. */
export function timeUnits(start: Date, end: Date, rule: RvgTimeRule): number {
  return timeUnitsFromMinutes((end.getTime() - start.getTime()) / 60000, rule)
}

/** Why a rule is malformed, or null: tiers from 0, in rising order, whole positive intervals. */
export function validateRvgTimeRule(rule: RvgTimeRule): string | null {
  if (rule.tiers.length === 0) return 'The time rule needs at least one tier.'
  if (rule.tiers[0]!.fromMinute !== 0) return 'The first tier starts at minute 0.'
  for (let i = 0; i < rule.tiers.length; i++) {
    const t = rule.tiers[i]!
    if (!Number.isInteger(t.fromMinute) || t.fromMinute < 0) return 'A tier starts at a whole minute of 0 or more.'
    if (!Number.isInteger(t.intervalMinutes) || t.intervalMinutes <= 0) return 'A tier counts a whole number of minutes above 0 per unit.'
    if (i > 0 && t.fromMinute <= rule.tiers[i - 1]!.fromMinute) return 'Each tier starts after the one before it.'
  }
  if (rule.partInterval !== 'roundUp') return 'A part interval always rounds up.'
  return null
}

function minutesText(minutes: number): string {
  if (minutes > 0 && minutes % 60 === 0) {
    const h = minutes / 60
    return h === 1 ? 'the first hour' : `the first ${h} hours`
  }
  return `the first ${minutes} minutes`
}

/**
 * The rule in words: "1 unit per 15 minutes or part for the first 2 hours,
 * then 1 unit per 10 minutes or part."
 */
export function describeTimeRule(rule: RvgTimeRule): string {
  const parts = rule.tiers.map((tier, i) => {
    const next = rule.tiers[i + 1]
    const per = `1 unit per ${tier.intervalMinutes} minutes or part`
    if (next === undefined) return i === 0 ? per : `then ${per}`
    const span = next.fromMinute - tier.fromMinute
    const lead = i === 0 ? per : `then ${per}`
    return i === 0 ? `${lead} for ${minutesText(span)}` : `${lead} for the next ${span} minutes`
  })
  return `${parts.join(', ')}.`
}
