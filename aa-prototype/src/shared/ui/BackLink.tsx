import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { accent } from '../../theme/tokens'

export type BackLinkSize = 'desktop' | 'touch' | 'step'

interface BackLinkProps {
  children: ReactNode
  /** A route: renders a real link (middle-click opens a new tab). */
  to?: string
  /** No route: renders a button that runs this (the screens Playwright clicks as buttons). */
  onClick?: () => void
  /** `desktop` 14/600 with a 16px chevron; `touch` the phone's 15px with a 44px target and an 18px
   *  chevron; `step` the 13px back one step inside a sheet. */
  size?: BackLinkSize
  shot?: string
  style?: CSSProperties
}

const SIZE: Record<BackLinkSize, { fontSize: number; chevron: number; gap: number; minHeight?: number }> = {
  desktop: { fontSize: 14, chevron: 16, gap: 4 },
  touch: { fontSize: 15, chevron: 18, gap: 4, minHeight: 44 },
  step: { fontSize: 13, chevron: 15, gap: 2 },
}

/**
 * Return to the parent screen (U21): a teal chevron and the parent's name. A real link where a
 * route exists, else a button. Replaced the five desktop copies, the phone's header backs, the
 * move sheets' step back and ProfileChrome's slate link (UI unification U5).
 */
export function BackLink({ children, to, onClick, size = 'desktop', shot, style }: BackLinkProps) {
  const s = SIZE[size]
  const css: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flex: 'none',
    gap: s.gap,
    ...(s.minHeight !== undefined ? { minHeight: s.minHeight } : {}),
    border: 'none',
    background: 'none',
    padding: 0,
    borderRadius: 4,
    color: accent.base,
    fontFamily: 'inherit',
    fontSize: s.fontSize,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    ...style,
  }
  const content = (
    <>
      <ChevronLeft size={s.chevron} strokeWidth={2.4} aria-hidden />
      {children}
    </>
  )
  if (to !== undefined) {
    return (
      <Link to={to} className="aa-ctl" data-shot={shot} style={css}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" className="aa-ctl" data-shot={shot} onClick={onClick} style={css}>
      {content}
    </button>
  )
}
