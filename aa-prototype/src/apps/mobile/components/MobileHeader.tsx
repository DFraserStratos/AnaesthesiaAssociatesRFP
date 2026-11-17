import { Avatar } from '../../../shared'
import { Eyebrow } from '../../../shared/ui/Eyebrow'

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
        <Eyebrow>{eyebrow}</Eyebrow>
        <div style={{ fontSize: 26, lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>
          {title}
        </div>
      </div>
      <Avatar initials={initials} size={44} />
    </div>
  )
}
