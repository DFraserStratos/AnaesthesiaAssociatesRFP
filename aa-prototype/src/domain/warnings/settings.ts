import { WARNING_RULES } from './rules'
import type { AppSettings, WarningRule } from './types'

/** The seeded app settings: every registered rule active with its defaults. */
export function defaultAppSettings(rules: readonly WarningRule[] = WARNING_RULES): AppSettings {
  const warningRules: AppSettings['warningRules'] = {}
  for (const rule of rules) warningRules[rule.id] = { active: true, params: { ...rule.defaultParams } }
  return { warningRules }
}
