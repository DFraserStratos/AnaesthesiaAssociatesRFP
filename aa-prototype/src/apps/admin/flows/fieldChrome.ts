import type { CSSProperties } from 'react'
import { neutral, radius } from '../../../theme/tokens'
import type { GstPeriod } from '../../../domain/types'

/**
 * Shared field chrome for the admin master-data edit flows — one definition of
 * the native-`<select>` style (the sheets wrap each select in its own `<label>`)
 * and the GST-period option set, instead of copies across the flows. A plain
 * module (no components) so fast-refresh's only-export-components rule stays
 * clean.
 */
export const selectControlStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 48,
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.line}`,
  background: neutral.bg,
  padding: '0 12px',
  fontFamily: 'inherit',
  fontSize: 15,
  color: neutral.ink,
}

export const GST_OPTIONS: { value: GstPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biMonthly', label: 'Two-monthly' },
  { value: 'sixMonthly', label: 'Six-monthly' },
]
