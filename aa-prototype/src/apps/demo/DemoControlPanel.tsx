import { useState } from 'react'
import { RotateCcw, Zap, MapPin, CalendarDays, Info, ChevronsRight, AlertTriangle, Stethoscope } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DemoSurface } from './DemoSurface'
import {
  advanceClockDays,
  advanceClockMinutes,
  authoriseList,
  editContract,
  resetDemo,
  submitList,
  useAppStore,
  useClockTimeLabel,
  useToday,
  type Actor,
} from '../../store'
import { ANAE, CONTRACT, SEED_LIST_IDS, listIdForSlot } from '../../domain/seed'
import { DemoBadge } from '../../shared'
import { neutral, accent, radius, elevation, semantic } from '../../theme/tokens'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

interface ComingControl {
  icon: LucideIcon
  label: string
  description: string
  phase: string
}

/** Controls that arrive in later phases — shown here as disabled placeholders. */
const COMING: readonly ComingControl[] = [
  { icon: Zap, label: 'Fire integration events', description: 'Replay HL7 / FHIR / payment messages into the fake backend.', phase: 'Phase 11' },
  { icon: MapPin, label: 'Jump to a scenario', description: 'Preload a demo scenario for the guided presentation script.', phase: 'Phase 12' },
]

interface AdvanceButton {
  label: string
  run: () => void
}

function ControlCard({ icon: Icon, title, eyebrow, children }: {
  icon: LucideIcon
  title: string
  eyebrow: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
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
        <Icon size={20} strokeWidth={2} />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.mist }}>
          {eyebrow}
        </span>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span>
        {children}
      </div>
    </div>
  )
}

const actionButtonStyle: React.CSSProperties = {
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '7px 14px',
  borderRadius: radius.ctl,
  border: `1px solid ${neutral.lineStrong}`,
  background: neutral.surface,
  color: neutral.ink,
  cursor: 'pointer',
}

/**
 * Demo control panel (`/demo/control`). Phase 02: the live clock (advance
 * minutes/hours/days — day advances roll the canvas forward) and the reset
 * control. Integration and scenario controls land in Phases 11 to 12.
 */
export function DemoControlPanel() {
  const todayISO = useToday()
  const timeLabel = useClockTimeLabel()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [failureMsg, setFailureMsg] = useState<string | null>(null)
  const [postOpMsg, setPostOpMsg] = useState<string | null>(null)

  const dateLabel = format(parseISO(todayISO), 'EEEE d MMMM yyyy')

  // Phase 09 demo trigger: date out the COS ACC contract (no default fallback)
  // and authorise the seeded failure list; the wired billing run raises the
  // sibling's invoice and fails the COS card, which surfaces in the monitor.
  function triggerBillingFailure() {
    const listId = SEED_LIST_IDS.billingFailure
    const list = useAppStore.getState().schedule.lists[listId]
    if (list === undefined) {
      setFailureMsg('The billing-failure list is not present in this seed.')
      return
    }
    if (list.billedAtISO !== undefined) {
      setFailureMsg('Already triggered. Open the Admin app billing monitor to resolve and retry the failed card.')
      return
    }
    editContract(useAppStore, OFFICE, CONTRACT.cosAcc, { effectiveToISO: '2026-07-15' })
    if (list.state === 'DRAFT') submitList(useAppStore, OFFICE, listId)
    const outcome = authoriseList(useAppStore, OFFICE, listId)
    setFailureMsg(
      outcome.ok
        ? 'Done. In the Admin app billing monitor the COS card shows a rating failure while its clean sibling billed. Use Resolve & retry.'
        : `Refused: ${outcome.message}`,
    )
  }

  // Phase 09 demo trigger: authorise (lock + bill) an original episode and keep
  // a free empty session today for its anaesthetist, so "Add post-op event" on
  // the locked card has somewhere to land.
  function stagePostOpScenario() {
    const listId = listIdForSlot(ANAE.sharma, '2026-07-14', 'AM')
    const list = useAppStore.getState().schedule.lists[listId]
    if (list === undefined) {
      setPostOpMsg('The post-op original list is not present in this seed.')
      return
    }
    if (list.state === 'DRAFT') submitList(useAppStore, OFFICE, listId)
    const submitted = useAppStore.getState().schedule.lists[listId]
    if (submitted?.state === 'SUBMITTED') authoriseList(useAppStore, OFFICE, listId)
    setPostOpMsg(
      'Done. Dr Sharma\'s Tue 14 Jul list is authorised and locked. In the Admin day view jump to Tue 14, open its card and use "Add post-op event"; it lands on her free Tue 21 PM session.',
    )
  }

  const advances: readonly AdvanceButton[] = [
    { label: '+15 min', run: () => advanceClockMinutes(useAppStore, 15) },
    { label: '+1 hour', run: () => advanceClockMinutes(useAppStore, 60) },
    { label: 'Next day', run: () => advanceClockDays(useAppStore, 1) },
    { label: '+7 days', run: () => advanceClockDays(useAppStore, 7) },
  ]

  return (
    <DemoSurface
      title="Demo control panel"
      subtitle="The presenter's cockpit for the demo. Reset the data, advance the clock, fire simulated integration events and jump between scenarios, all against the fake in-browser backend."
    >
      {/* Live demo clock */}
      <ControlCard icon={CalendarDays} eyebrow="Demo clock" title={`${dateLabel} · ${timeLabel}`}>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Advancing past midnight rolls the canvas: new far edge days generate from Permanent Lists
          with the same deterministic generator the seed uses.
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {advances.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.run}
              style={actionButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = neutral.sunken)}
              onMouseLeave={(e) => (e.currentTarget.style.background = neutral.surface)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ChevronsRight size={14} strokeWidth={2.5} aria-hidden />
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </ControlCard>

      {/* Reset */}
      <ControlCard icon={RotateCcw} eyebrow="Seed data" title="Reset to pristine seed">
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Restores the deterministic seed exactly as it first loaded, and returns the clock to
          Tuesday 21 July 2026, 8:00. Identical data every time.
        </span>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
          {confirmingReset ? (
            <>
              <button
                type="button"
                onClick={() => {
                  resetDemo(useAppStore)
                  setConfirmingReset(false)
                }}
                style={{
                  ...actionButtonStyle,
                  background: accent.base,
                  borderColor: accent.base,
                  color: '#FFFFFF',
                }}
              >
                Confirm reset
              </button>
              <button type="button" onClick={() => setConfirmingReset(false)} style={actionButtonStyle}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmingReset(true)} style={actionButtonStyle}>
              Reset demo data
            </button>
          )}
        </div>
      </ControlCard>

      {/* Phase 09 demo triggers */}
      <ControlCard icon={AlertTriangle} eyebrow="Billing exceptions" title="Trigger billing failure">
        <div><DemoBadge label="Demo trigger" /></div>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Dates out the externally held COS ACC contract (a group holder with no default fallback) and authorises the
          seeded multi-card list. One card fails to rate; its clean sibling still invoices, so the monitor shows
          per-card isolation and a Resolve &amp; retry path.
        </span>
        <div style={{ marginTop: 4 }}>
          <button type="button" onClick={triggerBillingFailure} style={actionButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = neutral.sunken)}
            onMouseLeave={(e) => (e.currentTarget.style.background = neutral.surface)}>
            Trigger failure
          </button>
        </div>
        {failureMsg !== null && (
          <div style={{ marginTop: 4, fontSize: 12.5, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: radius.ctl, padding: '8px 12px' }}>{failureMsg}</div>
        )}
      </ControlCard>

      <ControlCard icon={Stethoscope} eyebrow="Post-op addendum" title="Stage post-op scenario">
        <div><DemoBadge label="Demo trigger" /></div>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Authorises (locks and bills) an original episode and keeps a free session open today for its anaesthetist,
          ready for "Add post-op event" on the locked card. The addendum runs its own capture to invoice; the original
          stays immutable.
        </span>
        <div style={{ marginTop: 4 }}>
          <button type="button" onClick={stagePostOpScenario} style={actionButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = neutral.sunken)}
            onMouseLeave={(e) => (e.currentTarget.style.background = neutral.surface)}>
            Stage scenario
          </button>
        </div>
        {postOpMsg !== null && (
          <div style={{ marginTop: 4, fontSize: 12.5, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: radius.ctl, padding: '8px 12px' }}>{postOpMsg}</div>
        )}
      </ControlCard>

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
        {COMING.map((control) => {
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
