/**
 * Unpaid prepayment (US-06.3.2, "No block"; owner decision D5 / OQ-57).
 *
 * Replaces the July hard completion gate and its audited override. Kind and
 * strength are a provisional reading (US-13.7.1: "not yet set"): before the
 * procedure, strong. Phase 27 makes the strength escalate by date and re-points
 * the trigger at the anaesthetist's prepaid set.
 */

import type { WarningRule } from '../types'

export const PREPAYMENT_REQUIRED_TEXT = 'Prepayment required. No prepayment invoice has been raised yet.'
export const PREPAYMENT_UNPAID_TEXT = 'Prepayment invoice unpaid. Check with the patient before surgery starts.'

export const prepaymentUnpaidRule: WarningRule = {
  id: 'prepaymentUnpaid',
  label: 'Unpaid prepayment',
  defaultParams: {},
  evaluate(facts) {
    if (facts.prepaymentStatus === 'required') {
      return [{ kind: 'beforeProcedure', strength: 'strong', text: PREPAYMENT_REQUIRED_TEXT }]
    }
    if (facts.prepaymentStatus === 'outstanding') {
      return [{ kind: 'beforeProcedure', strength: 'strong', text: PREPAYMENT_UNPAID_TEXT }]
    }
    return []
  },
}
