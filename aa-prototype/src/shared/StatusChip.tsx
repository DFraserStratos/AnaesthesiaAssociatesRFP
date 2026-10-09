import type { CSSProperties } from 'react'
import type { DisplayKey } from '../domain/types'
import type { StatusVisual } from '../theme/statusColours'
import { useDisplayStatus } from './status/useSlotStatuses'

interface StatusChipProps {
  /** A List kind or an availability status ID (catch-up Phase 29). */
  status: DisplayKey
  /** Override the visible label (defaults to the status's short label). */
  label?: string
  style?: CSSProperties
  className?: string
}

/**
 * A status pill: coloured dot + label on a tinted, fully-rounded background.
 * Anatomy transcribed from the Design Language §02 chip. Colour is never the
 * only signal: the label is always present. An availability status reads its
 * label and token from the status master, so a rename or recolour shows here
 * at once; an unknown ID renders a neutral "Unknown status".
 */
export function StatusChip({ status, label, style, className }: StatusChipProps) {
  const resolved = useDisplayStatus(status)
  return (
    <StatusChipView
      visual={resolved.visual}
      label={label ?? resolved.label}
      statusKey={resolved.known ? status : undefined}
      style={style}
      className={className}
    />
  )
}

/** The chip's anatomy from a resolved visual (the status editor previews a draft with it). */
export function StatusChipView({
  visual,
  label,
  statusKey,
  style,
  className,
}: {
  visual: Pick<StatusVisual, 'tint' | 'solid' | 'onTint'>
  label: string
  statusKey?: string
  style?: CSSProperties
  className?: string
}) {
  return (
    <span
      className={className}
      data-status-key={statusKey}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: visual.tint,
        borderRadius: 999,
        padding: '4px 10px',
        ...style,
      }}
    >
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: 99, background: visual.solid, flex: 'none' }} />
      <span style={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, color: visual.onTint }}>{label}</span>
    </span>
  )
}
