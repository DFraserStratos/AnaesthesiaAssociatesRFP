import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { neutral } from '../../theme/tokens'

/**
 * The underline tab strip (U17; UI unification U5). Today's look exactly: tabs padded 10 14, 14px
 * 600 when active and 500 when not, the ink underline `inset 0 -2px 0`, the strip's 4px gap over a
 * `line` rule. No sliding underline: question 18 reads Phase 34's "selection-slide" for the Intake
 * tabs as this strip.
 *
 * - `LineTabs` with `kind="nav"` (default) is a labelled `<nav>` of `LineTabLink`s: sibling routes,
 *   the current one `aria-current="page"` (page switches, question 18).
 * - `LineTabs` with `kind="group"` is a labelled `role="group"` of `LineTab`s: local panels, each a
 *   button with `aria-pressed` (question 3 keeps local tabs as buttons).
 */
export function LineTabs({ label, kind = 'nav', children, shot, style }: { label: string; kind?: 'nav' | 'group'; children: ReactNode; shot?: string; style?: CSSProperties }) {
  const css: CSSProperties = { display: 'flex', gap: 4, borderBottom: `1px solid ${neutral.line}`, ...style }
  if (kind === 'group') {
    return (
      <div role="group" aria-label={label} data-shot={shot} style={css}>
        {children}
      </div>
    )
  }
  return (
    <nav aria-label={label} data-shot={shot} style={css}>
      {children}
    </nav>
  )
}

function tabStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? neutral.ink : neutral.slate,
    boxShadow: active ? `inset 0 -2px 0 ${neutral.ink}` : 'none',
    textDecoration: 'none',
    cursor: 'pointer',
  }
}

type DataProps = { [key: `data-${string}`]: string | undefined }

interface LineTabLinkProps extends DataProps {
  to: string
  active: boolean
  children: ReactNode
  /** A count or marker after the label (the Draft Lists counts; Phase 38b's Review Events count). */
  badge?: ReactNode
  shot?: string
  /** Replace the history entry rather than push one. */
  replace?: boolean
}

/** One tab of a route strip: a real link, `aria-current="page"` when it is the page shown. */
export function LineTabLink({ to, active, children, badge, shot, replace, ...rest }: LineTabLinkProps) {
  return (
    <Link to={to} {...(replace === true ? { replace: true } : {})} className="aa-ctl" aria-current={active ? 'page' : undefined} data-shot={shot} style={tabStyle(active)} {...rest}>
      {children}
      {badge}
    </Link>
  )
}

interface LineTabProps extends DataProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  badge?: ReactNode
  shot?: string
}

/** One tab of a local strip: a button with `aria-pressed` (question 3). Phase 25's History tab. */
export function LineTab({ active, onClick, children, badge, shot, ...rest }: LineTabProps) {
  return (
    <button type="button" className="aa-ctl" aria-pressed={active} data-shot={shot} onClick={onClick} style={tabStyle(active)} {...rest}>
      {children}
      {badge}
    </button>
  )
}
