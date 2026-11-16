/**
 * The ONE warning-rule registry, in a fixed order (the routine's tie-break
 * after strength). A new rule is a rule file, an entry here, its id in the
 * `WarningRuleId` union and any new facts in `WarningFacts` (`types.ts`), its facts in the
 * store's `warningFactsFor`, its defaults (seeded into `appSettings` from this
 * list) and a sample in `store/warningSamples.ts`. No UI change.
 */

import type { WarningRule } from '../types'
import { prepaymentUnpaidRule } from './prepaymentUnpaid'
import { baseUnitsOutsideGuideRule } from './baseUnitsOutsideGuide'
import { childPayerRule } from './childPayer'
import { approvalNumberMissingRule } from './approvalNumberMissing'

export const WARNING_RULES: readonly WarningRule[] = [prepaymentUnpaidRule, baseUnitsOutsideGuideRule, childPayerRule, approvalNumberMissingRule]

export { prepaymentUnpaidRule, PREPAYMENT_REQUIRED_TEXT, PREPAYMENT_UNPAID_TEXT } from './prepaymentUnpaid'
export { baseUnitsOutsideGuideRule } from './baseUnitsOutsideGuide'
export { childPayerRule, childPayerText } from './childPayer'
export { approvalNumberMissingRule, approvalNumberMissingText } from './approvalNumberMissing'
