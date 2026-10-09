import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, CalendarDays, Info, Route, ListChecks, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DemoSurface } from './DemoSurface'
import {
  OFFICE_ACTOR,
  SOUTER_ACTOR,
  authoriseList,
  editBooking,
  editProcedure,
  proceduresForBooking,
  resetDemo,
  useAppStore,
  useClockTimeLabel,
  useToday,
} from '../../store'
import { SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { demoClockShortcuts } from '../../shared/demoClockShortcuts'
import { BILLING_MONITOR_SCREEN, DEMO_TRIGGERS, DemoTriggerBadge, type DemoTrigger } from '../../shared/demoTriggers'
import { DemoBadge } from '../../shared'
import { APP_CONFIG } from '../../shell/appConfig'
import { neutral, accent, radius, elevation, semantic } from '../../theme/tokens'

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
 * jumps (the guided-script entry points), and every registered demo action
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
      subtitle="The presenter's index for the demo. Reset the data, advance the clock and jump to a scenario here. Every demo action lives on its own screen, under Demo actions in the harness bar (or the Demo sheet on a handset), and is listed below with a link to that screen."
    >
      {/* ── Clock & reset ─────────────────────────────────────── */}
      <SectionHeading label="Clock & reset" />

      <ControlCard icon={CalendarDays} eyebrow="Demo clock" title={`${dateLabel} · ${timeLabel}`}>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Advancing past midnight rolls the canvas: new far edge days generate from Permanent Lists
          with the same deterministic generator the seed uses. Next morning jumps to 08:00 tomorrow;
          Procedure day jumps forward to the S1 booking's operating day. These advance controls are
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
        hint="Each jump resets to the pristine seed, applies any extra preparation the scenario needs, and tells you where to go next. Reset-first keeps every jump deterministic and doubles as accident recovery."
      />
      <ScenarioJumps />

      {/* ── Demo actions by screen (the index) ────────────────── */}
      <SectionHeading
        label="Demo actions by screen"
        hint="Demo actions live on the screen they belong to: open Demo actions in the harness bar there, or the Demo sheet in the installed PWA. This page is their index. Open screen takes you to where each one shows."
      />
      <DemoActionsIndex />

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
    </DemoSurface>
  )
}

interface ScenarioResult {
  ok: boolean
  message: string
  nav?: readonly { label: string; path: string }[]
}

interface Scenario {
  id: string
  title: string
  blurb: string
  run: () => ScenarioResult
}

/** The five guided-script scenarios. Each resets first, then adds only its scenario-specific live deltas. */
const SCENARIOS: readonly Scenario[] = [
  {
    id: 'S1',
    title: 'S1 · Booking to theatre',
    blurb: 'A hospital HL7 booking (Future scope, shown as an illustration) lands on a booked list, then captures live on procedure day.',
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          'Reset to a clean S1 state. Note: HL7 v2 and FHIR are Future scope, so present this beat as an illustration of intake; the in-scope path, a hospital download matched by the office, arrives in a later build. Start in Mobile to introduce the AM and PM Lists, then open Demo actions in the harness bar and run Fire hospital message with MSG-STG-1001 (the Integrations simulator is the alternative). Sarah Mitchell arrives as a fourth Booking on Dr Souter\'s Tue 28 Jul AM List, alongside its three booked cases. Use "Procedure day · 28 Jul", then capture code 20950 and complete her Booking. The List itself stays active, because its other three Bookings are still to be captured.',
        nav: [
          { label: 'Go to Mobile app', path: APP_CONFIG.mobile.path },
          { label: 'Go to Integrations', path: APP_CONFIG['demo-integrations'].path },
        ],
      }
    },
  },
  {
    id: 'S2',
    title: 'S2 · Office day',
    blurb: 'Day-dashboard review, a phone-advice booking, an illness reassignment and an authorisation.',
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          'Reset to the pristine day. In Admin: phone-book Dr Sharma\'s Tue 21 PM Free List; on Wed 22 reassign Dr Rutherford\'s conflicted AM Christchurch Eye Surgery List to Dr Sharma (vacated slot: Unavailable); then authorise Dr Morrison\'s Mon 20 Jul List from the Review queue.',
        nav: [{ label: 'Go to Admin app', path: APP_CONFIG.admin.path }],
      }
    },
  },
  {
    id: 'S3',
    title: 'S3 · Money end-to-end',
    blurb: 'Authorise the split-billing and two-funder Lists, follow one Xero pair from payment to the anaesthetist account, then raise AA\'s monthly fee invoices.',
    run: () => {
      resetDemo(useAppStore)
      const state = useAppStore.getState()
      const am = state.schedule.lists[SEED_LIST_IDS.souterMon20Am]
      const pm = state.schedule.lists[SEED_LIST_IDS.souterMon20Pm]
      if (am?.state !== 'SUBMITTED' || pm?.state !== 'SUBMITTED') {
        return { ok: false, message: 'Reset done, but the two S3 Lists were not present in the Review queue.' }
      }
      return {
        ok: true,
        message:
          'Reset. Both of Dr Souter\'s Mon 20 Jul Lists are already in the Review queue: AM (Forte Health, the split-billing Booking) and PM (St George\'s, the two-funder Booking). In Admin, authorise both to generate the invoices and Xero pairs live. Open AA-2026-0005 in the Xero simulation, use its payment and payout button (the full $152.38 is paid to Dr Souter), then follow the direct link to Dr Souter\'s payment history. Beat 4: Admin Billing monitor, Open AA fee invoices, Demo actions, Seed a month of BCTIs, then Run monthly fee invoices (Dr Rutherford $700.00 before GST), and Record fee payment on AA-FEE-2026-H02 in the Xero simulation.',
        nav: [{ label: 'Go to Admin app', path: APP_CONFIG.admin.path }],
      }
    },
  },
  {
    id: 'S4',
    title: 'S4 · Exceptions',
    blurb: 'Prepayment warning, post-op addendum, billing failure + retry, integration dead-letter + fix, partial payment.',
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          'Reset. Walk the exceptions: (1) Mobile, Souter Fri 24 AM, Annette Riley: see the triangle, open the Booking and read the warning, Mark complete and submit (no block, no confirm step), then clear it from the Admin to-do list; (2) in Admin open Sarah Mitchell\'s Booking on Dr Sharma\'s Tue 14 AM List, Demo actions, Stage post-op scenario, then Add post-op event; (3) Admin Billing monitor, Demo actions, Trigger billing failure, then Resolve & retry Losa Tuilagi; (4) Admin Integrations, Demo actions, Fire hospital message MSG-CPH-2001, then on the Feed config tab (badged Future scope) change Christchurch Public patientNhi from PID-2 to PID-3, save and reprocess; (5) open Hemi Walker\'s St George\'s clean-sibling invoice, Demo actions, Payment received · half, then the Billing monitor\'s own Run payables button, which pays exactly the amount received; pay the balance and run again.',
        nav: [
          { label: 'Go to Mobile app', path: APP_CONFIG.mobile.path },
          { label: 'Go to Billing monitor', path: '/admin/billing' },
        ],
      }
    },
  },
  {
    id: 'S5',
    title: 'S5 · Compliance tour',
    blurb: 'Rich seeded audit trail plus staged edits, NHI dual-format validator, no personal information in Xero, contract effective-dating.',
    run: () => {
      resetDemo(useAppStore)
      const chenBookingId = SEED_MARKERS['overriddenTimeUnitsBooking']?.entityId ?? ''
      const chenProcedure = proceduresForBooking(useAppStore.getState(), chenBookingId)[0]
      if (chenProcedure === undefined) return { ok: false, message: 'Reset done, but David Chen\'s Booking was not found to stage the audit trail.' }
      const staged = [
        editProcedure(useAppStore, SOUTER_ACTOR, chenProcedure.id, { asaClass: 'AS2' }),
        editBooking(useAppStore, OFFICE_ACTOR, chenBookingId, { notes: 'Rooms called: confirmed self-funded account details ahead of invoicing.' }),
        editProcedure(useAppStore, SOUTER_ACTOR, chenProcedure.id, { asaClass: 'AS1' }),
      ]
      const refused = staged.find((r) => !r.ok)
      if (refused !== undefined && !refused.ok) return { ok: false, message: `Reset done, but staging the audit trail was refused: ${refused.message}` }
      const invoiceStage = authoriseList(useAppStore, OFFICE_ACTOR, SEED_LIST_IDS.whitakerFri17)
      if (!invoiceStage.ok) return { ok: false, message: `Audit staged, but the contract snapshot invoice could not be raised: ${invoiceStage.message}` }
      return {
        ok: true,
        message:
          'Reset to rich seeded Booking histories, added three live edits to David Chen\'s trail, and authorised Dr Whitaker\'s Fri 17 Jul List to raise invoices under the Health NZ agreed-rate contract. Compliance tour: (1) open David Chen\'s History; (2) in Admin Integrations open Demo actions and fire MSG-STG-1002 for the new-format NHI; (3) in the Xero simulation\'s Contacts tab, show that no NHI or patient name crosses to Xero, only hidden IDs; (4) set "Health NZ agreed rate (Type 2)" to end on 16 Jul, then reopen the Health NZ invoice for Hemi Walker from Whitaker\'s Fri 17 Jul List to show its snapshot is unchanged.',
        nav: [
          { label: 'Go to Admin app', path: APP_CONFIG.admin.path },
          { label: 'Go to Xero sim', path: APP_CONFIG['demo-xero'].path },
        ],
      }
    },
  },
]

/** The guided-script scenario jumps (S1 to S5): confirm, reset, stage, then point onward. */
function ScenarioJumps() {
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; res: ScenarioResult } | null>(null)

  return (
    <ControlCard icon={Route} eyebrow="Guided script" title="Jump to a scenario">
      <div><DemoBadge label="Resets data" /></div>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
        Pick a scenario to reset it cleanly and apply only the preparation that scenario needs. Each
        jump confirms first because it replaces all current demo data.
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
        {SCENARIOS.map((s) => (
          <div key={s.id} style={{ borderTop: `1px solid ${neutral.line}`, paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: neutral.slate, lineHeight: 1.45 }}>{s.blurb}</div>
              </div>
              {confirming === s.id ? (
                <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                  <button
                    type="button"
                    data-shot="scenario-confirm"
                    onClick={() => {
                      setResult({ id: s.id, res: s.run() })
                      setConfirming(null)
                    }}
                    style={primaryButtonStyle}
                  >
                    Confirm jump
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} style={actionButtonStyle}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" data-shot={`scenario-${s.id.toLowerCase()}`} onClick={() => setConfirming(s.id)} style={{ ...actionButtonStyle, flex: 'none' }}>
                  Jump
                </button>
              )}
            </div>
            {result?.id === s.id && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: result.res.ok ? semantic.success.onTint : semantic.warning.onTint,
                  background: result.res.ok ? semantic.success.tint : semantic.warning.tint,
                  borderRadius: radius.ctl,
                  padding: '10px 12px',
                }}
              >
                <div>{result.res.message}</div>
                {result.res.ok && result.res.nav !== undefined && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {result.res.nav.map((n) => (
                      <button
                        key={n.path}
                        type="button"
                        onClick={() => navigate(n.path)}
                        style={{ ...actionButtonStyle, background: neutral.surface }}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ControlCard>
  )
}

const SURFACE_LABEL = { bar: 'Harness bar', pwa: 'Installed PWA' } as const

/** Group the registry by `screen`, keeping registry order within and across groups. */
function groupByScreen(triggers: readonly DemoTrigger[]): { screen: string; entries: DemoTrigger[] }[] {
  const groups: { screen: string; entries: DemoTrigger[] }[] = []
  for (const t of triggers) {
    const g = groups.find((x) => x.screen === t.screen)
    if (g === undefined) groups.push({ screen: t.screen, entries: [t] })
    else g.entries.push(t)
  }
  return groups
}

/**
 * The index of every registered demo action, under its screen, with where it
 * shows and an "Open screen" link to a place it is visible. Nothing is fired
 * from here (catch-up Phase 14).
 */
function DemoActionsIndex() {
  const navigate = useNavigate()
  const state = useAppStore()
  const groups = useMemo(() => groupByScreen(DEMO_TRIGGERS), [])

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
            {g.screen === BILLING_MONITOR_SCREEN && (
              <div style={{ fontSize: 12.5, color: neutral.slate }}>
                <strong style={{ fontWeight: 600 }}>Run payables:</strong> the Billing monitor's own button (product UI, not a demo action).
              </div>
            )}
          </div>
        ))}
      </div>
    </ControlCard>
  )
}
