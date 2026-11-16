import { neutral, type as typeScale } from '../theme/tokens'
import { Avatar } from './Avatar'

/**
 * The signed-in persona on an ink bar (UI unification U3, README group U25):
 * the crimson-tint avatar, the name and the role, in the on-ink text values the
 * Admin side nav uses (Admin Day and Admin Review mockups, 30px "KW"). The demo
 * harness bar draws it at 28. The avatar is `aria-hidden`; the name is text.
 * Light-surface persona layouts (the phone's More card, the web nav's name
 * left of the avatar) use `Avatar` alone.
 */
export function PersonaChip({ persona, size = 30, gap = 10 }: { persona: { name: string; initials: string; role: string }; size?: number; gap?: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap }}>
      <Avatar initials={persona.initials} size={size} variant="tint" />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span style={{ fontSize: typeScale.small.size, fontWeight: 600, color: neutral.surface }}>{persona.name}</span>
        <span style={{ fontSize: typeScale.micro.size, color: 'rgba(255,255,255,0.5)' }}>{persona.role}</span>
      </span>
    </span>
  )
}
