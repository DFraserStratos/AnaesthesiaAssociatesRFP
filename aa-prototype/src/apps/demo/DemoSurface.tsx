import type { ReactNode } from 'react'
import { DemoBadge } from '../../shared'
import { neutral } from '../../theme/tokens'

interface DemoSurfaceProps {
  title: string
  subtitle: string
  children: ReactNode
  maxWidth?: number
  subtitleMaxWidth?: number
  /** Marks the surface Future scope (catch-up Phase 14): a second badge, and this line under the subtitle. */
  futureScope?: string
}

/**
 * Layout chrome for the demo-only surfaces. Every one carries the "demo
 * simulation" badge (PROGRESS convention 13) so a demo audience never mistakes
 * these for proposed product UI.
 */
export function DemoSurface({ title, subtitle, children, maxWidth = 1080, subtitleMaxWidth = 720, futureScope }: DemoSurfaceProps) {
  return (
    <div style={{ minHeight: '100%', background: neutral.bg, color: neutral.ink }}>
      <div style={{ maxWidth, margin: '0 auto', padding: '32px 32px 56px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <DemoBadge />
            {futureScope !== undefined && <DemoBadge tone="future" />}
          </div>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>{title}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: neutral.slate, maxWidth: subtitleMaxWidth }}>{subtitle}</p>
          {futureScope !== undefined && (
            <p data-shot="demo-surface-future-scope" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: neutral.slate, maxWidth: subtitleMaxWidth }}>
              {futureScope}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
