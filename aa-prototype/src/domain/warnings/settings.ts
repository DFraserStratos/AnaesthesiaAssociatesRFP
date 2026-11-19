import { WARNING_RULES } from './rules'
import type { AppSettings, WarningRule } from './types'
import type { PaymentCycleSettings } from '../types'
import { defaultScheduleSettings } from '../slots'

/**
 * The seeded app settings: every registered warning rule active with its
 * defaults, and the schedule settings (catch-up Phase 28: four months, AM
 * 07:30 to 12:30, PM 13:00 to 17:30), and prepayment approval on (catch-up
 * Phase 27), and the weekly payment cycle (catch-up Phase 39a). The seed adds `aaFee`, AA's sample fee schedule, beside them.
 */
export function defaultAppSettings(rules: readonly WarningRule[] = WARNING_RULES): Pick<AppSettings, 'warningRules' | 'schedule' | 'prepayment' | 'paymentCycle'> {
  const warningRules: AppSettings['warningRules'] = {}
  for (const rule of rules) warningRules[rule.id] = { active: true, params: { ...rule.defaultParams } }
  return { warningRules, schedule: defaultScheduleSettings(), prepayment: { approvalRequired: true }, paymentCycle: defaultPaymentCycleSettings() }
}

/** Greg's proposed weekly cycle (US-10.2.7, Proposed; OQ-47): ISO week, Friday close, Monday checks, Tuesday schedule. */
export function defaultPaymentCycleSettings(): PaymentCycleSettings {
  return { weekIdentity: 'isoWeek', closeWeekday: 5, checkWeekday: 1, scheduleWeekday: 2 }
}
