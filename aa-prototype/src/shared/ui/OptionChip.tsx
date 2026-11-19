/**
 * A quick option chip (catch-up Phase 39): a teal-tint pill that fills or
 * picks one answer in a form, beside the field it serves ("Wrong billable
 * party" under the credit's reason, "Every 2 weeks" in the availability form).
 * Pressed: the teal border and tint with `accent.pressed` text. It is not
 * `FilterPills`, the solid teal list filter.
 *
 * A button with `aria-pressed` by default (`role` toggle); `role="radio"` is
 * the one-of-several pick inside a `radiogroup` (the funder sheet, the credit's
 * choice of invoice), with `aria-checked` instead. `size` md (36, web and
 * Admin) or lg (44, the phone's thumb target). `data-*` attributes land on the
 * button.
 */

import type { ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import { dataAttributesOf, type DataAttributes } from './Field'

export interface OptionChipProps extends DataAttributes {
  pressed: boolean
  onClick: () => void
  children: ReactNode
  size?: 'md' | 'lg'
  /** `toggle` (default): a pressed button; `radio`: one of a `radiogroup`. */
  role?: 'toggle' | 'radio'
  shot?: string
}

export function OptionChip(props: OptionChipProps) {
  const { pressed, onClick, children, size = 'md', role = 'toggle', shot } = props
  const radio = role === 'radio'
  return (
    <button
      type="button"
      className="aa-ctl"
      {...(radio ? { role: 'radio', 'aria-checked': pressed } : { 'aria-pressed': pressed })}
      data-shot={shot}
      {...dataAttributesOf(props)}
      onClick={onClick}
      style={{
        minHeight: size === 'lg' ? 44 : 36,
        padding: '0 14px',
        borderRadius: radius.pill,
        border: `1px solid ${pressed ? accent.base : neutral.line}`,
        background: pressed ? accent.tint : neutral.surface,
        color: pressed ? accent.pressed : neutral.slate,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flex: 'none',
      }}
    >
      {children}
    </button>
  )
}
