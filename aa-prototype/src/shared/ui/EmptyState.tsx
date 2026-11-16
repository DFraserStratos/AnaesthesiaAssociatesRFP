/**
 * "Nothing here" where a list or panel would be (UI unification U3, README
 * group U29). Words stay each screen's own; this is the look only.
 *
 * - `inline` (the default): the mist line under a card heading, 12.5/18.
 * - `card`: the RvgGroupsView empty card (surface, line border, `radius.card`,
 *   `28px 20px`), with an optional 14/600 title over slate 13 text.
 * - `centred`: the phone's list screens, mist 14 centred under the list.
 *
 * `action` is a real control after the words. Table empty rows (U6's
 * `EmptyRow`) and picker no-match lines are other jobs. `shot` lands on the
 * outer element.
 */

import type { CSSProperties, ReactNode } from 'react'
import { neutral, radius, type as typeScale } from '../../theme/tokens'

export type EmptyStateVariant = 'inline' | 'card' | 'centred'

const LOOK: Record<EmptyStateVariant, CSSProperties> = {
  inline: { fontSize: typeScale.small.size, lineHeight: `${typeScale.small.line}px`, color: neutral.mist },
  card: {
    background: neutral.surface,
    border: `1px solid ${neutral.line}`,
    borderRadius: radius.card,
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 13,
    color: neutral.slate,
  },
  centred: { marginTop: 20, textAlign: 'center', fontSize: 14, color: neutral.mist },
}

export function EmptyState({
  variant = 'inline',
  title,
  action,
  shot,
  style,
  children,
}: {
  variant?: EmptyStateVariant
  title?: ReactNode
  action?: ReactNode
  shot?: string
  /** Placement only (margins). */
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div data-shot={shot} style={{ ...LOOK[variant], ...style }}>
      {title !== undefined && <div style={{ fontSize: 14, fontWeight: 600, color: neutral.ink }}>{title}</div>}
      {children !== undefined && (variant === 'card' ? <div>{children}</div> : children)}
      {action}
    </div>
  )
}
