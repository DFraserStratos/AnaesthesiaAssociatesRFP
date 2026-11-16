/**
 * The one popover panel (UI unification U2, README U30): the DemoClockMenu
 * panel, a white card at `radius.card` with a hairline border and
 * `elevation.e3`, under its trigger. Pairs with `usePopover`.
 *
 * - `end`: anchored under the trigger's right edge (the harness bar's menus),
 *   on the shell menu layer.
 * - `fill`: as wide as the trigger, on the popover layer (the Contract combo).
 * - `inline`: drops down in the page flow, no shadow (the combo inside the
 *   phone's sheet).
 *
 * The panel keeps `role="dialog"` and `aria-labelledby` where a site gives
 * them; the trigger's `aria-controls` points at its `id`.
 */

import type { CSSProperties, ReactNode } from 'react'
import { elevation, neutral, radius, zIndex } from '../../theme/tokens'

export interface PopoverPanelProps {
  id?: string
  placement: 'end' | 'fill' | 'inline'
  role?: 'dialog'
  labelledBy?: string
  /** CSS width (`end` only). */
  width?: string | number
  maxHeight?: string | number
  /** Inner padding; 14 by default, 0 for a list that runs to the edges. */
  padding?: number
  shot?: string
  children: ReactNode
}

const PLACEMENT: Record<PopoverPanelProps['placement'], CSSProperties> = {
  end: { position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: zIndex.shellMenu, boxShadow: elevation.e3 },
  fill: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: zIndex.popover, boxShadow: elevation.e3 },
  inline: { marginTop: 6 },
}

export function PopoverPanel({ id, placement, role, labelledBy, width, maxHeight, padding = 14, shot, children }: PopoverPanelProps) {
  return (
    <div
      id={id}
      role={role}
      aria-labelledby={labelledBy}
      data-shot={shot}
      style={{
        ...PLACEMENT[placement],
        ...(width !== undefined ? { width } : {}),
        ...(maxHeight !== undefined ? { maxHeight, overflowY: 'auto' as const } : {}),
        padding,
        background: neutral.surface,
        color: neutral.ink,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        ...(padding === 0 && maxHeight === undefined ? { overflow: 'hidden' as const } : {}),
      }}
    >
      {children}
    </div>
  )
}
