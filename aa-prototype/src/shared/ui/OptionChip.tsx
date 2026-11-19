/**
 * A quick option chip (catch-up Phase 39): a teal-tint pill that fills or
 * picks one answer in a form, beside the field it serves ("Wrong billable
 * party" over the credit's reason). Pressed: the teal border and tint with
 * `accent.pressed` text, as the availability form's and the funder sheet's
 * chips draw it (their private copies can move here). It is not
 * `FilterPills`, the solid teal list filter. A button with `aria-pressed`;
 * `size` md (36, web and Admin) or lg (44, the phone's thumb target).
 */

import type { ReactNode } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'

export interface OptionChipProps {
  pressed: boolean
  onClick: () => void
  children: ReactNode
  size?: 'md' | 'lg'
  shot?: string
}

export function OptionChip({ pressed, onClick, children, size = 'md', shot }: OptionChipProps) {
  return (
    <button
      type="button"
      className="aa-ctl"
      aria-pressed={pressed}
      data-shot={shot}
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
