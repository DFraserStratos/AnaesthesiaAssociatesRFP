import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, FlaskConical } from 'lucide-react'
import { BottomSheet } from '../shared/surface'
import { DemoBadge } from '../shared/DemoBadge'
import { DemoTriggerBadge, useDemoTriggerRows } from '../shared/demoTriggers'
import { accent, elevation, neutral, radius, semantic } from '../theme/tokens'
import { isOfficeSimulationEnabled } from './officeSimulation'

/**
 * The installed PWA's demo actions (catch-up Phase 14): the handset's
 * equivalent of the harness bar's "Demo actions" menu, which the PWA does not
 * have. A small amber "Demo" chip, shown only on a screen with PWA entries,
 * opens a bottom sheet (convention 16) listing them, with any choices as
 * tappable rows rather than a dropdown. Every entry is badged as a demo
 * trigger; the office stand-ins say so. Row behaviour is shared with the
 * harness bar's menu through `useDemoTriggerRows`. While "Play the office" is
 * on, the chip carries an "Office auto" marker.
 *
 * Mounted by `MobileViewport` in the host-chrome seat beside `UpdatePrompt`,
 * so the framed prototype (which hosts the app in `PhoneFrame`) never sees it.
 */
export function PwaDemoActions() {
  const rows = useDemoTriggerRows('pwa')
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // A new screen starts with the sheet closed.
  useEffect(() => setOpen(false), [pathname])

  if (rows.length === 0) return null
  // Read per render; the toggle lives on More, where the chip is not shown.
  const officeAuto = isOfficeSimulationEnabled()

  return (
    <>
      <button
        type="button"
        data-shot="pwa-demo-actions"
        aria-label={`Demo actions for this screen, ${rows.length}`}
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          right: 'calc(var(--aa-inset-right, 0px) + 14px)',
          // Clears the Lists tab bar, the List's submit footer and the Booking's
          // measured dock (`--aa-dock-height`, published on documentElement).
          bottom: 'calc(var(--aa-inset-bottom, 0px) + max(96px, var(--aa-dock-height, 0px) + 12px))',
          zIndex: 55,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          padding: '0 12px',
          borderRadius: radius.pill,
          border: `1px solid ${semantic.warning.solid}55`,
          background: semantic.warning.tint,
          color: semantic.warning.onTint,
          boxShadow: elevation.e2,
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <FlaskConical size={15} strokeWidth={2.2} aria-hidden />
        Demo
        {officeAuto && (
          <span
            style={{
              marginLeft: 2,
              padding: '1px 6px',
              borderRadius: radius.pill,
              background: neutral.surface,
              fontSize: 10,
              letterSpacing: '0.04em',
            }}
          >
            Office auto
          </span>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <DemoBadge label="Demo trigger" />
            {officeAuto && <DemoBadge label="Office auto" style={{ padding: '3px 8px', fontSize: 10 }} />}
          </div>
          <div style={{ fontSize: 13, color: neutral.mist, lineHeight: '18px', marginTop: 6 }}>
            Demo actions for this screen. They stand in for the office and the hospital systems, which are not on the phone.
          </div>

          {rows.map(({ trigger, options, chosen, reason, result, choose, run }) => {
            return (
              <div
                key={trigger.id}
                data-shot={`pwa-demo-action-${trigger.id}`}
                style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 14, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{trigger.label}</span>
                  {trigger.badge !== undefined && <span><DemoTriggerBadge badge={trigger.badge} /></span>}
                  <span style={{ fontSize: 13.5, lineHeight: '19px', color: neutral.slate }}>{trigger.description}</span>
                </div>

                {options.length > 0 && (
                  <div role="radiogroup" aria-label={`${trigger.label}: choose`} style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                    {options.map((o) => {
                      const on = o.id === chosen
                      return (
                        <button
                          key={o.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => choose(o.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            minHeight: 44,
                            padding: '8px 12px',
                            borderRadius: radius.ctl,
                            border: `1px solid ${on ? accent.base : neutral.lineStrong}`,
                            background: on ? accent.tint : neutral.surface,
                            color: neutral.ink,
                            fontFamily: 'inherit',
                            fontSize: 14,
                            fontWeight: on ? 600 : 500,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{o.label}</span>
                          {on && <Check size={16} strokeWidth={2.5} color={accent.base} aria-hidden />}
                        </button>
                      )
                    })}
                  </div>
                )}

                <button
                  type="button"
                  disabled={reason !== null}
                  onClick={run}
                  style={{
                    minHeight: 48,
                    borderRadius: radius.ctl,
                    border: 'none',
                    background: accent.base,
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: reason !== null ? 'not-allowed' : 'pointer',
                    opacity: reason !== null ? 0.45 : 1,
                  }}
                >
                  Run
                </button>
                {reason !== null && <span style={{ fontSize: 13, color: neutral.mist }}>{reason}</span>}
                <div role="status" aria-live="polite">
                  {result !== undefined && (
                    <div
                      style={{
                        fontSize: 13.5,
                        lineHeight: '19px',
                        color: result.ok ? neutral.slate : semantic.warning.onTint,
                        background: result.ok ? neutral.sunken : semantic.warning.tint,
                        borderRadius: radius.ctl,
                        padding: '10px 12px',
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
      </BottomSheet>
    </>
  )
}
