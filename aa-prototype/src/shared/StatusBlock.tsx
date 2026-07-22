import type { CSSProperties } from 'react'
import {
  statusColours,
  freeDashedBorder,
  unavailableHatchTint,
  type StatusKey,
} from '../theme/statusColours'

interface StatusBlockProps {
  status: StatusKey
  /** Primary line (e.g. hospital / session name). */
  title: string
  /** Secondary line (e.g. surgeon · specialty). */
  detail?: string
  style?: CSSProperties
}

/**
 * A small session block honouring each status' fill treatment (Design Language
 * §02): solid statuses get a tinted body with a coloured left bar, Unavailable
 * is hatched, Free is a dashed outline. The demonstration counterpart to
 * {@link StatusChip}; the day grids in later phases reuse this shape.
 */
export function StatusBlock({ status, title, detail, style }: StatusBlockProps) {
  const c = statusColours[status]

  const base: CSSProperties = {
    display: 'block',
    borderRadius: 6,
    padding: '6px 9px',
    minWidth: 110,
  }

  let treatment: CSSProperties
  if (c.treatment === 'hatched') {
    treatment = { background: unavailableHatchTint, borderLeft: `3px solid ${c.solid}` }
  } else if (c.treatment === 'dashed') {
    treatment = { background: c.tint, border: freeDashedBorder }
  } else {
    treatment = { background: c.tint, borderLeft: `3px solid ${c.solid}` }
  }

  return (
    <span style={{ ...base, ...treatment, ...style }}>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: c.onTint }}>
        {title}
      </span>
      {detail && (
        <span style={{ display: 'block', fontSize: 10, color: c.onTint, opacity: 0.75 }}>
          {detail}
        </span>
      )}
    </span>
  )
}
