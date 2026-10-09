import { WARNING_RULES } from './rules'
import type { AppSettings, WarningRule } from './types'

/**
 * The seeded warning-rule settings: every registered rule active with its
 * defaults. (The seed adds `aaFee`, AA's sample fee schedule, beside it.)
 */
export function defaultAppSettings(rules: readonly WarningRule[] = WARNING_RULES): Pick<AppSettings, 'warningRules'> {
  const warningRules: AppSettings['warningRules'] = {}
  for (const rule of rules) warningRules[rule.id] = { active: true, params: { ...rule.defaultParams } }
  return { warningRules }
}
