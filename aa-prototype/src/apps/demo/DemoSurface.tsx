import type { ReactNode } from 'react'
import { DemoBadge } from '../../shared'
import { neutral } from '../../theme/tokens'

interface DemoSurfaceProps {
  title: string
  subtitle: string
  children: ReactNode
}

/**
 * Layout chrome for the demo-only surfaces. Every one carries the "demo
 * simulation" badge (PROGRESS convention 13) so a demo audience never mistakes
 * these for proposed product UI.
 */
export function DemoSurface({ title, subtitle, children }: DemoSurfaceProps) {
  return (
    <div style={{ minHeight: '100%', background: neutral.bg, color: neutral.ink }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 32px 56px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DemoBadge style={{ alignSelf: 'flex-start' }} />
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 700, letterSpacing: '-0.015em' }}>{title}</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: neutral.slate, maxWidth: 720 }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
