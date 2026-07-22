import type { CSSProperties } from 'react'
import { statusColours, type StatusKey } from '../theme/statusColours'

interface StatusChipProps {
  status: StatusKey
  /** Override the visible label (defaults to the status' short label). */
  label?: string
  style?: CSSProperties
  className?: string
}

/**
 * A status pill: coloured dot + label on a tinted, fully-rounded background.
 * Anatomy transcribed from the Design Language §02 chip. Colour is never the
 * only signal — the label is always present.
 */
export function StatusChip({ status, label, style, className }: StatusChipProps) {
  const c = statusColours[status]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: c.tint,
        borderRadius: 999,
        padding: '4px 10px',
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{ width: 7, height: 7, borderRadius: 99, background: c.solid, flex: 'none' }}
      />
      <span style={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, color: c.onTint }}>
        {label ?? c.label}
      </span>
    </span>
  )
}
