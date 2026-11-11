import { Component, useCallback, useContext, useMemo, useState, type ContextType, type ErrorInfo, type ReactNode } from 'react'
import { createPath, UNSAFE_NavigationContext, type To } from 'react-router-dom'
import { accent, neutral, radius } from '../../../../theme/tokens'

/**
 * Catalogue-only plumbing for the Web page (demo only, not product UI).
 *
 * `NavSandbox` lets a real web component that calls `useNavigate()` (the
 * Availability page switch, the Find cover grid's Change link) be mounted
 * here without leaving the catalogue: it re-provides React Router's
 * navigation context with a navigator whose push / replace only REPORT the
 * path. It is a context override inside the app's one BrowserRouter, not a
 * second router.
 */
type NavCtx = ContextType<typeof UNSAFE_NavigationContext>

function pathOf(to: To): string {
  return typeof to === 'string' ? to : createPath(to)
}

export function NavSandbox({ onNavigate, children }: { onNavigate: (path: string) => void; children: ReactNode }) {
  const outer = useContext(UNSAFE_NavigationContext)
  const value: NavCtx = useMemo(() => {
    const real = outer.navigator
    return {
      ...outer,
      navigator: {
        createHref: (to: To) => real.createHref(to),
        ...(real.encodeLocation !== undefined ? { encodeLocation: (to: To) => real.encodeLocation!(to) } : {}),
        go: () => undefined,
        push: (to: To) => onNavigate(pathOf(to)),
        replace: (to: To) => onNavigate(pathOf(to)),
      },
    }
  }, [outer, onNavigate])
  return <UNSAFE_NavigationContext.Provider value={value}>{children}</UNSAFE_NavigationContext.Provider>
}

/**
 * A stage wrapper that swallows navigation: both router navigation (through
 * `NavSandbox`) and the stubbed callbacks a row passes in (`go`). The last
 * attempted destination shows as a small line so the click visibly did
 * something.
 */
export function Sandboxed({ children }: { children: (go: (what: string) => void) => ReactNode }) {
  const [last, setLast] = useState<string | null>(null)
  const go = useCallback((what: string) => setLast(what), [])
  return (
    <NavSandbox onNavigate={(p) => setLast(`Would open ${p}`)}>
      {last !== null && (
        <div
          role="status"
          style={{
            position: 'sticky',
            top: 0,
            left: 0,
            zIndex: 5,
            marginBottom: 8,
            padding: '6px 10px',
            borderRadius: radius.ctl,
            background: accent.tint,
            color: accent.pressed,
            fontSize: 12.5,
            fontWeight: 600,
            width: 'fit-content',
          }}
        >
          {last} (navigation is stubbed in the catalogue)
        </div>
      )}
      {children(go)}
    </NavSandbox>
  )
}

/** A desktop-width canvas inside a narrow stage: the stage scrolls sideways, the component lays out as on a 1240px screen. */
export function Wide({ width = 1180, children }: { width?: number; children: ReactNode }) {
  return <div style={{ width }}>{children}</div>
}

/**
 * Catches a component that fails to render, so one broken row never blanks
 * the page. The capture cards are mid-change in the working tree at the time
 * of writing (the modifier model is being reworked), so they may throw.
 */
export class RowBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null }

  static getDerivedStateFromError(error: unknown): { error: string } {
    return { error: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo) {
    // Shown in the row; nothing else to do.
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div role="alert" style={{ fontSize: 13, lineHeight: 1.5, color: neutral.slate, background: neutral.sunken, borderRadius: radius.ctl, padding: '10px 12px' }}>
          This component could not render here: <span className="mono">{this.state.error}</span>
        </div>
      )
    }
    return this.props.children
  }
}

/** Small catalogue-chrome option buttons (not product UI) for switching a live example between states. */
export function Knobs<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: neutral.mist, marginRight: 2 }}>{label}</span>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            style={{
              height: 26,
              padding: '0 10px',
              borderRadius: radius.pill,
              border: `1px dashed ${on ? neutral.slate : neutral.line}`,
              background: on ? neutral.sunken : 'transparent',
              color: on ? neutral.ink : neutral.slate,
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** A plain catalogue-chrome button (dashed, so it never reads as product UI). */
export function KnobButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: 26, padding: '0 10px', borderRadius: radius.pill, border: `1px dashed ${neutral.lineStrong}`, background: 'transparent', color: neutral.slate, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}
