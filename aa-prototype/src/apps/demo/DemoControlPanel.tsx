import { RotateCcw, Clock, Zap, MapPin, CalendarDays, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DemoSurface } from './DemoSurface'
import { DEMO_TODAY, DEMO_TODAY_LABEL } from '../../domain/clock'
import { neutral, radius, elevation } from '../../theme/tokens'

interface ComingControl {
  icon: LucideIcon
  label: string
  description: string
  phase: string
}

/** Controls that arrive in later phases — shown here as disabled placeholders. */
const CONTROLS: readonly ComingControl[] = [
  { icon: RotateCcw, label: 'Reset to pristine seed', description: 'Restore the deterministic seed data to its original state.', phase: 'Phase 02' },
  { icon: Clock, label: 'Advance the demo clock', description: 'Step the pinned demo date/time forward and roll the canvas.', phase: 'Phase 02' },
  { icon: Zap, label: 'Fire integration events', description: 'Replay HL7 / FHIR / payment messages into the fake backend.', phase: 'Phase 11' },
  { icon: MapPin, label: 'Jump to a scenario', description: 'Preload a demo scenario for the guided presentation script.', phase: 'Phase 12' },
]

/**
 * Demo control panel stub (`/demo/control`). Phase 00 wires the chrome and the
 * pinned demo date; the controls below are disabled until their phases land.
 */
export function DemoControlPanel() {
  return (
    <DemoSurface
      title="Demo control panel"
      subtitle="The presenter's cockpit for the demo. Reset the data, advance the clock, fire simulated integration events and jump between scenarios, all against the fake in-browser backend."
    >
      {/* Pinned demo date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: neutral.surface,
          border: `1px solid ${neutral.line}`,
          borderRadius: radius.card,
          padding: '16px 20px',
          boxShadow: elevation.e1,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.ctl,
            background: neutral.sunken,
            color: neutral.slate,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <CalendarDays size={20} strokeWidth={2} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>
            Demo date (pinned)
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{DEMO_TODAY_LABEL}</span>
            <span className="mono" style={{ fontSize: 13, color: neutral.slate }}>
              DEMO_TODAY = {DEMO_TODAY}
            </span>
          </span>
        </div>
      </div>

      {/* Billing rounding assumption (Decisions log 2026-07-22; Phase 04 repeats it on the T stepper) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '10px 14px',
          background: neutral.sunken,
          border: `1px solid ${neutral.line}`,
          borderRadius: radius.ctl,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: neutral.slate,
        }}
      >
        <Info size={15} strokeWidth={2} style={{ flex: 'none', marginTop: 2 }} aria-hidden />
        <span>
          <strong style={{ fontWeight: 600 }}>Billing assumption:</strong> partial time intervals
          round up per started interval (1 unit per started 15 min for the first 2 hours, then per
          started 10 min). The RFP defines the tiers but not the rounding; to confirm with AA in
          discovery.
        </span>
      </div>

      {/* Coming controls (disabled) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {CONTROLS.map((control) => {
          const Icon = control.icon
          return (
            <div
              key={control.label}
              aria-disabled
              style={{
                display: 'flex',
                gap: 14,
                background: neutral.surface,
                border: `1px solid ${neutral.line}`,
                borderRadius: radius.card,
                padding: 18,
                opacity: 0.6,
                cursor: 'not-allowed',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.ctl,
                  background: neutral.sunken,
                  color: neutral.slate,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{control.label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: neutral.mist,
                      border: `1px solid ${neutral.line}`,
                      borderRadius: 999,
                      padding: '1px 7px',
                    }}
                  >
                    {control.phase}
                  </span>
                </div>
                <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>{control.description}</span>
              </div>
            </div>
          )
        })}
      </div>
    </DemoSurface>
  )
}
