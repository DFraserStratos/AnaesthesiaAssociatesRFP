import { neutral } from '../../../theme/tokens'
import { Avatar } from '../../../shared'

interface MobileHeaderProps {
  eyebrow: string
  title: string
  /** Avatar initials — the persona identity avatar. */
  initials: string
}

/** The tab-screen header: micro-cap eyebrow, large title, MS identity avatar. */
export function MobileHeader({ eyebrow, title, initials }: MobileHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: neutral.mist,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
        <div style={{ fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>
          {title}
        </div>
      </div>
      <Avatar initials={initials} size={44} />
    </div>
  )
}
