/**
 * The warning routine (US-13.7.1): runs every active rule over one Booking's
 * facts and returns its Warning records, strong before mild, then by rule
 * order. Pure and deterministic: time arrives through `facts.todayISO`.
 *
 * A stored clearance hides a warning only when it was made at the warning's
 * current strength or higher, so a cleared mild warning that turns strong
 * re-opens (Phases 27 and 40 rely on this).
 */

import type { AppSettings, Warning, WarningClearance, WarningFacts, WarningRule, WarningStrength } from './types'
import { warningKey } from './types'

const STRENGTH_RANK: Record<WarningStrength, number> = { mild: 1, strong: 2 }

export function strengthRank(strength: WarningStrength): number {
  return STRENGTH_RANK[strength]
}

/** The stronger of two strengths. */
export function strongerOf(a: WarningStrength, b: WarningStrength): WarningStrength {
  return STRENGTH_RANK[b] > STRENGTH_RANK[a] ? b : a
}

export function isOpen(warning: Warning): boolean {
  return warning.clearance === undefined
}

export function evaluateWarnings(
  facts: WarningFacts,
  rules: readonly WarningRule[],
  settings: AppSettings['warningRules'],
  clearances: Readonly<Record<string, WarningClearance>>,
): Warning[] {
  if (facts.booking.cancellation !== undefined) return []
  const out: { warning: Warning; order: number }[] = []
  rules.forEach((rule, order) => {
    const setting = settings[rule.id]
    if (setting !== undefined && !setting.active) return
    const params = { ...rule.defaultParams, ...(setting?.params ?? {}) }
    for (const finding of rule.evaluate(facts, params)) {
      const key = warningKey(facts.booking.id, rule.id, finding.procedureId)
      const stored = clearances[key]
      const covers = stored !== undefined && STRENGTH_RANK[stored.strength] >= STRENGTH_RANK[finding.strength]
      const warning: Warning = { ...finding, key, bookingId: facts.booking.id, ruleId: rule.id }
      if (covers) warning.clearance = stored
      out.push({ warning, order })
    }
  })
  return out
    .sort(
      (a, b) =>
        STRENGTH_RANK[b.warning.strength] - STRENGTH_RANK[a.warning.strength] ||
        a.order - b.order ||
        a.warning.key.localeCompare(b.warning.key),
    )
    .map((x) => x.warning)
}
