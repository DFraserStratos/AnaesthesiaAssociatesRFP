import type { CSSProperties } from 'react'
import type { DisplayKey } from '../domain/types'
import type { StatusVisual } from '../theme/statusColours'
import { useDisplayStatus } from './status/useSlotStatuses'
import { radius } from '../theme/tokens'

interface StatusBlockProps {
  /** A List kind or an availability status ID. */
  status?: DisplayKey
  /** A visual not yet saved (the status sheet's preview of a draft status); wins over `status`. */
  visual?: StatusVisual
  /** The element: `span` (default, inline in a legend) or `div`. */
  as?: 'span' | 'div'
  /** Primary line (e.g. hospital / session name). */
  title: string
  /** Secondary line (e.g. surgeon · specialty). */
  detail?: string
  style?: CSSProperties
}

/**
 * The block fill for a resolved status (Design Language §02): solid statuses
 * get a tinted body with a coloured left bar, hatched ones the hatch over the
 * tint with the bar, dashed ones a dashed outline. One home for the rule, so
 * the day grid, the calendars and the legend draw a status the same way.
 */
export function blockFill(visual: StatusVisual): CSSProperties {
  if (visual.treatment === 'dashed') return { background: visual.blockBackground, border: visual.border }
  return { background: visual.blockBackground, borderLeft: `3px solid ${visual.leftBar ?? visual.solid}` }
}

/**
 * A small session block honouring each status's fill treatment. The
 * demonstration counterpart to {@link StatusChip} (the legend, the status
 * sheet's preview). The grids draw their own sized blocks, each taking its
 * fill from {@link blockFill} (UI unification U6, group U23).
 */
export function StatusBlock({ status, visual, as: Tag = 'span', title, detail, style }: StatusBlockProps) {
  const resolved = useDisplayStatus(status ?? '').visual
  const c = visual ?? resolved
  return (
    <Tag style={{ display: 'block', borderRadius: radius.xs, padding: '6px 9px', minWidth: 110, ...blockFill(c), ...style }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: c.onTint }}>
        {title}
      </span>
      {detail && (
        <span style={{ display: 'block', fontSize: 10, color: c.onTint, opacity: 0.75 }}>
          {detail}
        </span>
      )}
    </Tag>
  )
}
