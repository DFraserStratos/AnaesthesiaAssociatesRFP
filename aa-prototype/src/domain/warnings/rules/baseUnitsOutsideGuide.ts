/**
 * Base units outside the RVG guide (catch-up Phase 19; RV-10 under D3, OQ-56;
 * US-05.1.1, US-13.7.1).
 *
 * Any base-unit value is accepted: a recorded value (typed, or chosen on a
 * ranged row) that differs from the RVG group's starting value and lies
 * outside its published range (or off its figure where it prints none) raises
 * one warning per Procedure, after the procedure, for the office. It never
 * blocks. An additional procedure is skipped: its base units are not charged. Mild is a picked reading (OQ-56 sets no strength).
 *
 * The test is the model module's `baseUnitsFor(...).outsideGuide`, so the rule
 * and the fee read the same answer.
 */

import { baseUnitsFor, outsideGuideText } from '../../billing/rvgGroups'
import type { WarningFinding, WarningRule } from '../types'

export const baseUnitsOutsideGuideRule: WarningRule = {
  id: 'baseUnitsOutsideGuide',
  label: 'Base units outside the RVG guide',
  defaultParams: {},
  evaluate(facts) {
    const groups = facts.rvgGroups
    if (groups === undefined) return []
    const out: WarningFinding[] = []
    for (const procedure of facts.procedures) {
      const group = procedure.rvgGroupId !== undefined ? groups[procedure.rvgGroupId] : undefined
      // Base units are recorded on the primary only (catch-up Phase 23): the rule re-reads it after Make primary.
      if (group === undefined || !procedure.isPrimary) continue
      const base = baseUnitsFor({ procedure, group })
      if (!base.outsideGuide || base.guide === undefined) continue
      out.push({
        kind: 'afterProcedure',
        strength: 'mild',
        text: outsideGuideText(base.units, group.code, base.guide),
        procedureId: procedure.id,
      })
    }
    return out
  },
}
