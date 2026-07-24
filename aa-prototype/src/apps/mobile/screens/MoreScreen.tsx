import { brand, neutral } from '../../../theme/tokens'
import { DemoBadge } from '../../../shared'
import { MobileHeader } from '../components'

interface MoreScreenProps {
  personaName: string
  personaRole: string
  initials: string
}

/** More tab — persona + a demo note; deeper settings are out of prototype scope. */
export function MoreScreen({ personaName, personaRole, initials }: MoreScreenProps) {
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '64px 20px 116px' }}>
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
        <span
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: brand.tint,
            color: brand.base,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {initials}
        </span>
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
          figures are fictional. Use the demo control panel to advance the clock or reset the data.
        </div>
      </div>
    </div>
  )
}
