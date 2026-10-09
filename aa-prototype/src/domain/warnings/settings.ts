import { WARNING_RULES } from './rules'
import type { AppSettings, WarningRule } from './types'
import { defaultScheduleSettings } from '../slots'

/**
 * The seeded app settings: every registered warning rule active with its
 * defaults, and the schedule settings (catch-up Phase 28: four months, AM
 * 07:30 to 12:30, PM 13:00 to 17:30). The seed adds `aaFee`, AA's sample fee
 * schedule, beside them.
 */
export function defaultAppSettings(rules: readonly WarningRule[] = WARNING_RULES): Pick<AppSettings, 'warningRules' | 'schedule'> {
  const warningRules: AppSettings['warningRules'] = {}
  for (const rule of rules) warningRules[rule.id] = { active: true, params: { ...rule.defaultParams } }
  return { warningRules, schedule: defaultScheduleSettings() }
}
