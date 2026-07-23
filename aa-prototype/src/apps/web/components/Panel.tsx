import type { CSSProperties, ReactNode } from 'react'
import { elevation, neutral, radius } from '../../../theme/tokens'

interface PanelProps {
  /** Optional panel heading (17px). */
  title?: string
  /** Optional right-aligned node beside the title (a mono figure, a link, controls). */
  action?: ReactNode
  children: ReactNode
  style?: CSSProperties
  /** Remove the inner padding (e.g. a full-bleed table). */
  flush?: boolean
}

/**
 * The white card panel used across the web dashboard / lists / accounts (Web
 * Dashboard mockup): 1px line, `radius.card`, `elevation.e1`. Optional titled
 * header row with a right-aligned action.
 */
export function Panel({ title, action, children, style, flush }: PanelProps) {
  return (
    <section
      style={{
        background: neutral.surface,
        border: `1px solid ${neutral.line}`,
        borderRadius: radius.card,
        boxShadow: elevation.e1,
        padding: flush === true ? 0 : 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        ...style,
      }}
    >
      {(title !== undefined || action !== undefined) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            ...(flush === true ? { padding: '20px 20px 0' } : {}),
          }}
        >
          {title !== undefined ? <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
