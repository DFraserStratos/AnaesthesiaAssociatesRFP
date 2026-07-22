import type { ReactNode } from 'react'
import { Hammer } from 'lucide-react'
import { neutral, accent, radius } from '../theme/tokens'

interface PlaceholderProps {
  /** Screen name. */
  title: string
  /** Which phase fills this screen, e.g. "Phase 03". */
  phase: string
  /** One-line description of what the phase will build here. */
  children: ReactNode
  /** Compact variant for the narrow phone frame. */
  compact?: boolean
}

/**
 * A calm "coming in Phase NN" card. Empty app shells use this so it is always
 * clear which later phase fills a given screen (Phase 00 builds only the rails).
 */
export function Placeholder({ title, phase, children, compact = false }: PlaceholderProps) {
  return (
    <div
      style={{
        border: `1.5px dashed ${neutral.lineStrong}`,
        borderRadius: radius.card,
        background: neutral.surface,
        padding: compact ? 20 : 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: accent.tint,
          color: accent.pressed,
          borderRadius: radius.pill,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <Hammer size={13} strokeWidth={2} aria-hidden />
        {phase}
      </span>
      <div style={{ fontSize: compact ? 17 : 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</div>
      <p style={{ margin: 0, fontSize: compact ? 14 : 15, lineHeight: 1.5, color: neutral.slate }}>{children}</p>
    </div>
  )
}
