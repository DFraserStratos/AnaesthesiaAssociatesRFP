import type { ReactNode } from 'react'
import { neutral } from '../../../theme/tokens'
import { Avatar, DemoBadge, DockSpacer } from '../../../shared'
import { MobileHeader } from '../components'
import { Card } from '../../../shared/ui/Card'

interface MoreScreenProps {
  personaName: string
  personaRole: string
  initials: string
  /**
   * Host-supplied presenter controls, appended below the demo note. The
   * installed PWA has no harness bar, so it passes its clock, Reset and office
   * simulation here; the framed prototype passes nothing and is unchanged.
   */
  extra?: ReactNode
}

/** More tab — persona + a demo note; deeper settings are out of prototype scope. */
export function MoreScreen({ personaName, personaRole, initials, extra }: MoreScreenProps) {
  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        // Tab bar clearance is the `DockSpacer` at the tail, not padding here.
        padding: 'calc(var(--aa-inset-top, 54px) + 10px) 20px 0',
      }}
    >
      <MobileHeader eyebrow="Settings" title="More" initials={initials} />

      {/* The shared card at the mockups' radius 14 (UI unification U6, question 20). */}
      <Card as="div" style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar initials={initials} size={44} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{personaName}</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>{personaRole}</div>
        </div>
      </Card>

      <Card as="div" style={{ marginTop: 16, gap: 12 }}>
        <DemoBadge label="Demo prototype" />
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
          This is a demonstration of the Anaesthesia Associates mobile app. All patients, lists and
          figures are fictional.{' '}
          {extra === undefined
            ? 'Use the demo control panel to advance the clock or reset the data.'
            : 'The controls below stand in for the presenter harness.'}
        </div>
      </Card>

      {extra}
      <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 82px)" />
    </div>
  )
}
