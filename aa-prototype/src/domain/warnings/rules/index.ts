/**
 * The ONE warning-rule registry, in a fixed order (the routine's tie-break
 * after strength). A new rule is a rule file, an entry here, its id in the
 * `WarningRuleId` union and any new facts in `WarningFacts` (`types.ts`), its facts in the
 * store's `warningFactsFor`, its defaults (seeded into `appSettings` from this
 * list) and a sample in `store/warningSamples.ts`. No UI change.
 *
 * One rule here is not in `WARNING_RULES`: `replacedContractStillActive`
 * (build plan Phase 49, DM-03). Its subject is a Contract, not a Booking, so
 * the routine's facts do not fit it; it is derived the same way (pure, nothing
 * stored, no Clear, never a blocker) and read by the store's
 * `replacedContractsToDisable` for the Day view's To-do and the Contract page.
 */

import type { WarningRule } from '../types'
import { prepaymentUnpaidRule } from './prepaymentUnpaid'
import { baseUnitsOutsideGuideRule } from './baseUnitsOutsideGuide'
import { childPayerRule } from './childPayer'
import { splitDoesNotFitRule } from './splitDoesNotFit'
import { approvalNumberMissingRule } from './approvalNumberMissing'
import { patientBalanceRule } from './patientBalance'

export const WARNING_RULES: readonly WarningRule[] = [prepaymentUnpaidRule, baseUnitsOutsideGuideRule, childPayerRule, approvalNumberMissingRule, splitDoesNotFitRule, patientBalanceRule]

export {
  prepaymentUnpaidRule,
  prepaymentAwaitingText,
  prepaymentUnpaidText,
  prepaymentPartPaidText,
  prepaymentNotNeededText,
  prepaymentChangedText,
} from './prepaymentUnpaid'
export { baseUnitsOutsideGuideRule } from './baseUnitsOutsideGuide'
export { childPayerRule, childPayerText } from './childPayer'
export { splitDoesNotFitRule } from './splitDoesNotFit'
export { approvalNumberMissingRule, approvalNumberMissingText } from './approvalNumberMissing'
export {
  patientBalanceRule,
  patientBalanceStrongText,
  patientBalanceMildText,
  patientBalanceCreditText,
  PATIENT_BALANCE_DEFAULT_THRESHOLD_DAYS,
  PATIENT_BALANCE_OWES_SHORT,
  PATIENT_BALANCE_CREDIT_SHORT,
} from './patientBalance'
export {
  replacedContractStillActive,
  REPLACED_CONTRACT_STILL_ACTIVE_TEXT,
  type ReplacedContractRow,
} from './replacedContractStillActive'
