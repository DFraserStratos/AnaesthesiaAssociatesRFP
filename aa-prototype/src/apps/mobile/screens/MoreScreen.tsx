import type { ReactNode } from 'react'
import { neutral } from '../../../theme/tokens'
import { Avatar, DemoBadge, DockSpacer } from '../../../shared'
import { MobileHeader } from '../components'

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

      <div
        style={{
          marginTop: 20,
          background: neutral.surface,
          border: `1px solid ${neutral.line}`,
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Avatar initials={initials} size={44} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{personaName}</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>{personaRole}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          background: neutral.surface,
          border: `1px solid ${neutral.line}`,
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <DemoBadge label="Demo prototype" />
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
          This is a demonstration of the Anaesthesia Associates mobile app. All patients, lists and
          figures are fictional.{' '}
          {extra === undefined
            ? 'Use the demo control panel to advance the clock or reset the data.'
            : 'The controls below stand in for the presenter harness.'}
        </div>
      </div>

      {extra}
      <DockSpacer height="calc(var(--aa-inset-bottom, 34px) + 82px)" />
    </div>
  )
}
