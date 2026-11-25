import { useMemo, useState } from 'react'
import { create } from 'zustand'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, CalendarDays, Route, ListChecks, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DemoSurface } from './DemoSurface'
import { DEMO_SCENARIOS, type DemoScenario, type DemoScenarioId, type ScenarioStageResult } from './demoScenarios'
import { onDomainReset, useAppStore, useClockTimeLabel, useToday } from '../../store'
import { demoClockShortcuts } from '../../shared/demoClockShortcuts'
import { DEMO_TRIGGERS, DemoTriggerBadge, FINANCES_PAYMENTS_SCREEN, groupTriggersByScreen } from '../../shared/demoTriggers'
import { DemoBadge } from '../../shared'
import { Button, Notice, TextAction } from '../../shared/ui'
import { resetFramedDemo } from '../../shell/framedReset'
import { financePath } from '../admin/screens/finances/financePaths'
import { neutral, accent, radius, elevation } from '../../theme/tokens'

function ControlCard({ icon: Icon, title, eyebrow, children, shot }: {
  icon: LucideIcon
  title: string
  eyebrow: string
  children: React.ReactNode
  shot?: string
}) {
  return (
    <div
      data-shot={shot}
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

/** A labelled group divider between clusters of control cards. */
function SectionHeading({ label, hint }: { label: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: neutral.slate }}>
        {label}
      </span>
      {hint !== undefined && <span style={{ fontSize: 12.5, lineHeight: 1.45, color: neutral.mist }}>{hint}</span>}
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

const primaryButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: accent.base,
  borderColor: accent.base,
  color: '#FFFFFF',
}

/** Hover treatment for secondary (surface) buttons: sink to the sunken tone. */
const secondaryHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = neutral.sunken },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = neutral.surface },
}

/**
 * Demo control panel (`/demo/control`). The presenter's index (catch-up Phase
 * 14), in three labelled groups: the live clock + reset, the S1 to S5 scenario
 * jumps (`demoScenarios.ts`, catch-up Phase 44: each stages, then lists its
 * beats with a link to each screen), and every registered demo action
 * listed under its screen with a link that opens it. The actions themselves
 * live on their screens (`src/shared/demoTriggers`); none is fired from here.
 * The demo-only surfaces stay badged (PROGRESS convention 13).
 */
export function DemoControlPanel() {
  const todayISO = useToday()
  const timeLabel = useClockTimeLabel()
  const [confirmingReset, setConfirmingReset] = useState(false)

  const dateLabel = format(parseISO(todayISO), 'EEEE d MMMM yyyy')

  const advances = demoClockShortcuts(useAppStore, todayISO)

  return (
    <DemoSurface
      title="Demo control panel"
      subtitle="The presenter's index. Reset the data, move the clock, or jump to a scenario and follow its beats, each linked to its screen. Demo actions live on their own screens, under Demo actions in the harness bar (or the Demo sheet on a handset); the index below lists each one with a link to where it shows."
    >
      {/* ── Clock & reset ─────────────────────────────────────── */}
      <SectionHeading label="Clock & reset" />

      <ControlCard icon={CalendarDays} eyebrow="Demo clock" title={`${dateLabel} · ${timeLabel}`}>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Advancing past midnight rolls the schedule forward: each new far-edge day gets an AM and a PM
          session for every active anaesthetist, free, with the calendar and the recurring bookings
          painted on, by the same generator the seed uses. Next morning jumps to 08:00 tomorrow;
          Procedure day jumps forward to Tue 1 Dec, S1's operating day. These advance controls are
          also available from the live clock beside the app switcher.
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {advances.map((a) => {
            const Icon = a.icon
            const disabled = a.disabled
            return (
              <button
                key={a.id}
                type="button"
                onClick={a.run}
                disabled={disabled}
                style={{ ...actionButtonStyle, ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
                {...(disabled ? {} : secondaryHover)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={14} strokeWidth={2.5} aria-hidden />
                  {a.label}
                </span>
              </button>
            )
          })}
        </div>
      </ControlCard>

      <ControlCard icon={RotateCcw} eyebrow="Seed data" title="Reset to pristine seed">
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Restores the deterministic seed exactly as it first loaded, and returns the clock to
          Tuesday 24 November 2026, 8:00. Identical data every time.
        </span>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
          {confirmingReset ? (
            <>
              <button
                type="button"
                onClick={() => {
                  resetFramedDemo()
                  setConfirmingReset(false)
                }}
                style={primaryButtonStyle}
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

      {/* ── Scenario jumps (the guided-script entry points) ───── */}
      <SectionHeading
        label="Scenario jumps · S1 to S5"
        hint="Each jump resets to the pristine seed and stages only what its scenario cannot reach from there, so the same jump always gives the same data and doubles as recovery. Its beats follow the run sheet's order."
      />
      <ScenarioJumps />

      {/* ── Demo actions by screen (the index) ────────────────── */}
      <SectionHeading
        label="Demo actions by screen"
        hint="Demo actions live on the screen they belong to: open Demo actions in the harness bar there, or the Demo sheet in the installed PWA. This page is their index. Open screen takes you to where each one shows."
      />
      <DemoActionsIndex />

    </DemoSurface>
  )
}

/**
 * The last jump's result, UI only (catch-up Phase 44 QA): a beat link leaves the
 * Control Panel, so the result and its beat links outlive the page and come back
 * when the presenter returns. A reset (Reset, or the next jump's own reset)
 * clears it; a reload forgets it. No domain state, no audit.
 */
type LastJump = { id: DemoScenarioId; res: ScenarioStageResult }
const useLastScenarioJump = create<{ last: LastJump | null; remember: (last: LastJump | null) => void }>((set) => ({
  last: null,
  remember: (last) => set({ last }),
}))
onDomainReset(() => useLastScenarioJump.getState().remember(null))

/** The guided-script scenario jumps (S1 to S5): confirm, reset and stage, then the beats in order. */
function ScenarioJumps() {
  const [confirming, setConfirming] = useState<DemoScenarioId | null>(null)
  const result = useLastScenarioJump((m) => m.last)
  const setResult = useLastScenarioJump((m) => m.remember)

  return (
    <ControlCard icon={Route} eyebrow="Guided script" title="Jump to a scenario">
      <div><DemoBadge label="Resets data" /></div>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
        A jump replaces all current demo data, so it asks first. Each beat's link opens its screen,
        with what to do there beside it. The links stay here until the next reset or a reload.
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
        {DEMO_SCENARIOS.map((s) => (
          <div key={s.id} data-scenario={s.id} style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: neutral.slate, lineHeight: 1.45 }}>{s.blurb}</div>
              </div>
              {confirming === s.id ? (
                <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                  <Button
                    variant="primary"
                    size="compact"
                    shot="scenario-confirm"
                    onClick={() => {
                      setResult({ id: s.id, res: s.stage(useAppStore) })
                      setConfirming(null)
                    }}
                  >
                    Confirm jump
                  </Button>
                  <Button variant="secondary" size="compact" onClick={() => setConfirming(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="compact" shot={`scenario-${s.id.toLowerCase()}`} style={{ flex: 'none' }} onClick={() => setConfirming(s.id)}>
                  Jump
                </Button>
              )}
            </div>
            {result?.id === s.id && (
              <Notice tone={result.res.ok ? 'success' : 'warning'} live="status" shot="scenario-result" style={{ marginTop: 10 }}>
                <span style={{ lineHeight: 1.5 }}>{result.res.message}</span>
                {result.res.ok && <ScenarioBeats scenario={s} />}
              </Notice>
            )}
          </div>
        ))}
      </div>
    </ControlCard>
  )
}

/**
 * A scenario's core beats, numbered in script order, each a link to its
 * screen beside the beat's name and its steps (`does`). The path is read from
 * the store when the link is clicked, so a beat
 * opened after a live action (an import, an authorise) lands on what that
 * action made; until its target exists the link is disabled, and its label
 * says what it waits for.
 */
function ScenarioBeats({ scenario }: { scenario: DemoScenario }) {
  const navigate = useNavigate()
  const state = useAppStore()
  return (
    <ol data-shot="scenario-beats" style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 12, rowGap: 6 }}>
      {scenario.beats.map((b, i) => {
        const waiting = b.path(state) === null
        return (
          <li key={b.label} style={{ display: 'grid', gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="compact"
              shot={`scenario-beat-${i + 1}`}
              disabled={waiting}
              style={{ justifySelf: 'start' }}
              onClick={() => {
                const path = b.path(useAppStore.getState())
                if (path !== null) navigate(path)
              }}
            >
              {b.label}
            </Button>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.4 }}>
              <span style={{ color: neutral.ink, fontWeight: 600 }}>{b.beat}</span>
              {b.does !== undefined && (
                <span data-shot={`scenario-beat-${i + 1}-steps`} style={{ color: neutral.slate }}>
                  {b.does}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const SURFACE_LABEL = { bar: 'Harness bar', pwa: 'Installed PWA' } as const

/**
 * The index of every registered demo action, under its screen, with where it
 * shows and an "Open screen" link to a place it is visible. Nothing is fired
 * from here (catch-up Phase 14).
 */
function DemoActionsIndex() {
  const navigate = useNavigate()
  const state = useAppStore()
  const groups = useMemo(() => groupTriggersByScreen(DEMO_TRIGGERS), [])

  return (
    <ControlCard icon={ListChecks} eyebrow="Index" title="Where each demo action lives" shot="control-demo-index">
      <div><DemoBadge label="Demo trigger index" /></div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
        {groups.map((g) => (
          <div key={g.screen} style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: neutral.slate }}>{g.screen}</div>
            {g.entries.map((t) => {
              const pwaOnly = !t.surfaces.includes('bar')
              const path = pwaOnly ? null : t.indexPath(state)
              return (
                <div key={t.id} data-shot={`index-${t.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</span>
                      <DemoTriggerBadge badge={t.badge} />
                    </div>
                    <span style={{ fontSize: 12.5, color: neutral.slate, lineHeight: 1.45 }}>{t.description}</span>
                    <span style={{ fontSize: 12, color: neutral.mist }}>
                      Shows in: {t.surfaces.map((x) => SURFACE_LABEL[x]).join(' and ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: 'none', maxWidth: 220, textAlign: 'right' }}>
                    {pwaOnly ? (
                      <span style={{ fontSize: 12, color: neutral.mist }}>Shown in the installed PWA</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={path === null}
                          onClick={() => { if (path !== null) navigate(path) }}
                          style={{ ...actionButtonStyle, ...(path === null ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
                          {...(path === null ? {} : secondaryHover)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            Open screen
                            <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
                          </span>
                        </button>
                        {path === null && <span style={{ fontSize: 12, color: neutral.mist }}>{t.indexEmptyReason ?? 'Nothing to open yet'}</span>}
                        {path !== null && t.indexHint !== undefined && <span style={{ fontSize: 12, color: neutral.mist }}>{t.indexHint}</span>}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {g.screen === FINANCES_PAYMENTS_SCREEN && (
              <div style={{ fontSize: 12.5, color: neutral.slate }}>
                <strong style={{ fontWeight: 600 }}>Run payables in Xero:</strong> the{' '}
                <TextAction inline size="sm" to={financePath('payments')} shot="control-run-payables-payments">
                  Payments tab
                </TextAction>
                's button, badged Simulated Xero: Xero pays the bills and the Billing Engine records each payment it reports (not a demo action).
              </div>
            )}
          </div>
        ))}
      </div>
    </ControlCard>
  )
}
