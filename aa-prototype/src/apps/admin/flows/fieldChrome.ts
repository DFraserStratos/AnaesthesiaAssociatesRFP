import type { GstPeriod } from '../../../domain/types'

/**
 * The admin flows' field chrome now lives in `shared/ui/fieldChrome.ts` (UI
 * unification U4). Re-exported here so the screens a later phase rebuilds
 * (the Billing monitor, Phase 37) keep compiling; new code uses `SelectField`.
 * A plain module (no components) so fast-refresh's only-export-components rule
 * stays clean.
 */
export { selectControlStyle, controlStyle } from '../../../shared/ui/fieldChrome'

export const GST_OPTIONS: { value: GstPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biMonthly', label: 'Two-monthly' },
  { value: 'sixMonthly', label: 'Six-monthly' },
]
