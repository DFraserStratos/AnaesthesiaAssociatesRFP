import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { DemoBadge } from '../shared/DemoBadge'
import { DemoTriggerBadge, useDemoTriggerRows } from '../shared/demoTriggers'
import { accent, elevation, neutral, radius, semantic } from '../theme/tokens'

/** The harness pill, kept in step with `DemoClockMenu`'s `triggerStyle` (plus no-wrap). */
const triggerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  height: 34,
  padding: '0 10px',
  borderRadius: radius.ctl,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.08)',
  color: '#FFFFFF',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const runStyle: React.CSSProperties = {
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 14px',
  borderRadius: radius.ctl,
  border: `1px solid ${accent.base}`,
  background: accent.base,
  color: '#FFFFFF',
  cursor: 'pointer',
  flex: 'none',
}

/**
 * The harness bar's "Demo actions" menu (catch-up Phase 14): the demo triggers
 * registered for the current screen (`src/shared/demoTriggers`). Harness
 * chrome, styled like `DemoClockMenu` (its pill, popover anchor and Esc /
 * outside-click handling are kept in step with that file): a white-on-ink pill
 * and a popover that stays open after a run. Row behaviour is shared with the
 * PWA's Demo sheet through `useDemoTriggerRows`. Not rendered at all on a screen with no entries, so
 * the 48px bar never grows where it has nothing to offer.
 */
export function DemoActionsMenu() {
  const rows = useDemoTriggerRows('bar')
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const panelId = useId()

  // Navigating (a link, or browser Back with no pointerdown) closes the menu,
  // so it never reappears already open on the next screen with entries.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (rows.length === 0) return null

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        data-shot="demo-actions"
        aria-label={`Demo actions for this screen, ${rows.length}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        style={triggerStyle}
      >
        <FlaskConical size={16} strokeWidth={2} aria-hidden />
        <span className="aa-demo-actions-label">Demo actions</span>
        <span
          className="mono"
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: radius.pill,
            background: semantic.warning.tint,
            color: semantic.warning.onTint,
            fontSize: 11,
            lineHeight: '18px',
            textAlign: 'center',
          }}
        >
          {rows.length}
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 120,
            width: 'min(360px, calc(100vw - 24px))',
            maxHeight: 'calc(100vh - 72px)',
            overflowY: 'auto',
            padding: 14,
            background: neutral.surface,
            color: neutral.ink,
            border: `1px solid ${neutral.line}`,
            borderRadius: radius.card,
            boxShadow: elevation.e2,
          }}
        >
          <div id={titleId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <DemoBadge label="Demo trigger" />
            <span style={{ fontSize: 11.5, color: neutral.mist }}>On this screen</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map(({ trigger, options, chosen, reason, result, choose, run }) => {
              return (
                <div
                  key={trigger.id}
                  data-shot={`demo-action-${trigger.id}`}
                  style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{trigger.label}</span>
                      {trigger.badge !== undefined && <span><DemoTriggerBadge badge={trigger.badge} /></span>}
                    </div>
                    <button
                      type="button"
                      disabled={reason !== null}
                      onClick={run}
                      style={{ ...runStyle, ...(reason !== null ? { opacity: 0.45, cursor: 'not-allowed' } : {}) }}
                    >
                      Run
                    </button>
                  </div>
                  <span style={{ fontSize: 12.5, lineHeight: 1.45, color: neutral.slate }}>{trigger.description}</span>
                  {options.length > 0 && (
                    <select
                      aria-label={`${trigger.label}: choose`}
                      value={chosen ?? ''}
                      onChange={(e) => choose(e.target.value)}
                      style={{ font: 'inherit', fontSize: 13, padding: '6px 8px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink }}
                    >
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  )}
                  {reason !== null && <span style={{ fontSize: 12, color: neutral.mist }}>{reason}</span>}
                  <div role="status" aria-live="polite">
                    {result !== undefined && (
                      <div
                        style={{
                          fontSize: 12.5,
                          lineHeight: 1.45,
                          color: result.ok ? neutral.slate : semantic.warning.onTint,
                          background: result.ok ? neutral.sunken : semantic.warning.tint,
                          borderRadius: radius.ctl,
                          padding: '8px 10px',
                        }}
                      >
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
