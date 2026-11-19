import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, CalendarDays, Route, ListChecks, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DemoSurface } from './DemoSurface'
import {
  OFFICE_ACTOR,
  SOUTER_ACTOR,
  authoriseList,
  saveBookingPatch,
  claimModifier,
  removeModifier,
  proceduresForBooking,
  resetDemo,
  useAppStore,
  useClockTimeLabel,
  useToday,
} from '../../store'
import { SEED_LIST_IDS, SEED_MARKERS } from '../../domain/seed'
import { rvgModifierByCode } from '../../domain/billing/modifiers'
import { demoClockShortcuts } from '../../shared/demoClockShortcuts'
import { BILLING_MONITOR_SCREEN, DEMO_TRIGGERS, DemoTriggerBadge, groupTriggersByScreen } from '../../shared/demoTriggers'
import { DemoBadge } from '../../shared'
import { DRAFT_LIST, DRAFT_LISTS } from '../../shared/scheduleTerms'
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
          Advancing past midnight rolls the schedule forward: each new far-edge day gets an AM and a PM
          session for every active anaesthetist, free, with the calendar and the recurring bookings
          painted on, by the same generator the seed uses. Next morning jumps to 08:00 tomorrow;
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
    blurb: "A St George's file is imported with the hospital's own wording; the office matches Sarah Mitchell onto a booked List and says where the invoice goes; a booking with no NHI waits in its place; a rooms' PDF list keeps who sent it; it captures live on procedure day.",
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          "Reset to a clean S1 state. Start in Mobile on Dr Souter's Tue 28 Jul AM List (three booked cases). On Admin, Intake, Matching, Import hospital file, St George's: Sarah Mitchell's row reads lap appy ?conv to open, kept exactly as the hospital sent it; Create Booking puts her on that List at 08:30, nothing else changing until the office decides. Her Booking waits on Day's Needs an invoice destination card: open it and answer Where does the invoice go? with Patient, then Standard: No contract · RVG, which leaves the RVG code to the anaesthetist (on the PWA, Hospital file imported and my booking matched stands in for all of this). Optionally import the Southern Cross file: its row with no NHI waits, its stub on the List, until the office adds the NHI. Then PDF lists: open Mr Okafor's list, see who sent it, correct the flagged NHI, Send to matching and create the List from its first row and put its other two rows on it; the List reads where it came from and who replies go to. Receive updated PDF from rooms, then Send: the unchanged row is skipped, Margaret Ellison's changed time waits as a difference for approval, and a new patient arrives as a new row. Finally use Procedure day · 28 Jul, pick Sarah's RVG code by typing appendicectomy (A3), Start now, and complete her Booking; the List stays active because its other three Bookings are still to be captured.",
        nav: [
          { label: 'Go to Mobile app', path: APP_CONFIG.mobile.path },
          { label: 'Go to Admin Intake', path: '/admin/intake/matching' },
        ],
      }
    },
  },
  {
    id: 'S2',
    title: 'S2 · Office day',
    blurb: 'An optional opening on days off, repeating days off and the availability status list, then day-dashboard review, a phone-advice booking on a free session, an illness reassignment with tier-ordered cover suggestions, an anaesthetist moving her own List and the office\'s notifications, then handing one Booking to a colleague from its Booking screen, Find available, and an authorisation.',
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          `Reset to the pristine day. In Admin: assign the St George's ${DRAFT_LIST} to Dr Fitzgerald; optionally show Dr Beaumont's recurring Lists waiting as ${DRAFT_LISTS} while she is on leave, open Forte Health to show Bookings on a ${DRAFT_LIST}, or simulate an incoming request to show the not-preferred group and the tier order. Then open Dr Sharma's Tue 21 PM Free session and Book (phone advice), or Assign List for a session booked ahead; from ${DRAFT_LISTS}, assign Dr Rutherford's Wed 22 AM Christchurch Eye Surgery List to Dr Sharma (he phoned in sick, so the office returned it; unavailability is never a conflict, and Conflicts shows hospital closures only); then, as Dr Souter on Web Availability, move a List to a colleague and see it on Admin Day's notifications, then hand one Booking to a colleague from its Booking screen (Wed 22 Jul AM, Lachlan Robinson to Dr Whitaker, Tell the office ticked); optionally Alert the office on a Booking, then resolve it from Admin Notifications with Show resolved; optionally use Find available in the Day header; then authorise Dr Morrison's Mon 20 Jul List from the Review queue. Optionally, open the payer review List (Dr Chen, Fri 17 Jul, Christchurch Eye Surgery) in the Review queue: a child as the payer, an insurer with no approval number, a payer with no email or postal address and a family trust paying by post; clear a warning and authorise anyway, then Raise sample warnings on Admin Day to bring a child payer warning back on Grace Park's Booking. Optionally, open the review-flags List (Dr Chen, Tue 14 Jul AM, Christchurch Eye Surgery): Approve or Correct Dr Chen's Contract change on Diane Fairweather, see a typed price beside the computed one, type a price and complete Hemi Walker's Booking, and see a Contract not offered on this List; no flag blocks, and authorising approves any change still waiting. On Admin Day, Mon 10 Aug, move Fiona Lattimer's Booking to Dr Souter's AM List and review flags its Contract; move it back and the flag clears.`,
        nav: [{ label: 'Go to Admin app', path: APP_CONFIG.admin.path }],
      }
    },
  },
  {
    id: 'S3',
    title: 'S3 · Money end-to-end',
    blurb: 'Authorise the multi-procedure and split Lists (the run sends every invoice), follow one Xero pair from payment to the anaesthetist account, raise AA\'s monthly fee invoices, then show the ledger balancing.',
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
          'Reset. Both of Dr Souter\'s Mon 20 Jul Lists are already in the Review queue: AM (Forte Health, the multi-procedure Booking) and PM (St George\'s, the fee-split Booking: nib $132.50, Alan Prentice the rest). In Admin, authorise both: the run raises and emails the invoices, and each invoice\'s pair goes into the ledger, mirrored in Xero. Open AA-2026-0005 in the Xero simulation, use its payment and payout button (nib pays $152.38 into AA, then Xero\'s payables run pays Dr Souter the full $152.38 and the bill-paid webhook tells the engine, which records the disbursement), then follow the direct link to Dr Souter\'s payment history. Beat 4: Admin Billing monitor, Open AA fee invoices, Demo actions, Seed a month of BCTIs, then Run monthly fee invoices (Dr Rutherford $700.00 before GST), and Record fee payment on AA-FEE-2026-H02 in the Xero simulation. Beat 5: Admin Ledger reads In balance, with no anaesthetist out of balance; switch to Dr Souter to show what AA owes her and what she owes AA. Then Demo actions, Inject unmatched receipt, Names Dr Souter: out of balance by $120.00 and Dr Souter on the list. Allocate to invoice on one of her receivables puts it back in balance. Close on Admin Day: the Reconciliation card reads Books square.',
        nav: [{ label: 'Go to Admin app', path: APP_CONFIG.admin.path }],
      }
    },
  },
  {
    id: 'S4',
    title: 'S4 · Exceptions',
    blurb: 'Pre-payment from a prepaid Contract, an additional invoice recorded as an event, billing failure + retry, the unmatched hospital queue, partial payment, the date approaches, the prepayment held then transferred.',
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          'Reset. Walk the exceptions: (1) Pre-payment from a prepaid Contract: in Admin Day, Tue 21 Jul, Annette Riley is on the Pre-payments card and her warning on the To-do card; open her Booking (Rhinoplasty on Dr Souter\'s prepaid Contract, $1,200.00), go to Invoices, Approve and send (the payable credits the AA Holding account), then Payment received · half; on the Billing monitor the AA Holding account card holds it beside Priya Nair\'s $1,380.00, and nothing is paid to the anaesthetist yet; on Mobile, Souter Fri 24 AM, Annette Riley, see the triangle and the prepaid panel, Mark complete and submit (no block, no confirm step), then clear her mild warning from the Admin to-do list; (2) in Admin open Sarah Mitchell\'s Booking on Dr Sharma\'s Tue 14 AM List, Demo actions, Stage post-op scenario, then Create additional invoice on Sarah Mitchell\'s Procedure, approve it in Review and run the next billing run, then Credit in full and rebill on Sarah Mitchell\'s original, approve the credit in Review and run the next billing run again; (3) Admin Billing monitor, Demo actions, Trigger billing failure: each Booking bills from what was locked at authorise, so the failure is outside the lock, Losa Tuilagi\'s Xero hand-off; she is held back while Hemi Walker\'s Booking bills and the List is not failed; her invoice waits for Xero in the sync queue, so use Retry now on its queue row (no Contract changes); (4) Admin, Intake, Matching, Demo actions, Import hospital file, Southern Cross: under Unmatched, Tama Henare\'s row has no NHI, so a stub stands on Dr Souter\'s Tue 28 Jul PM List; type NHI ZQA1008 and Add NHI, and the Booking takes the stub\'s place, then Create a List in a session for Grace Whitu\'s row; (5) open Hemi Walker\'s St George\'s clean-sibling invoice, Demo actions, Payment received · half, then the Billing monitor\'s Run payables in Xero (badged Simulated Xero): Xero pays exactly the amount received and the engine records it from the bill-paid webhook; pay the balance and run again. (6) late, on Admin Day, Demo actions, Move to 2 days before procedure, choose Annette Riley: the clock jumps to Wed 22 Jul and her warning turns strong and re-opens; (7) held, then transferred: on Mobile, Mark complete and submit Souter\'s Fri 24 PM List, then Authorise for billing on Admin Review: the AA Holding account card shows Nair\'s $1,380.00 transferred to Dr Melanie Souter, the Xero sim shows journal MJ-0001 on XRB0, and Run payables in Xero pays her $1,380.00.',
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
    blurb: 'Rich seeded audit trail plus staged edits, NHI dual-format validator, no personal information in Xero, audited Contract edits.',
    run: () => {
      resetDemo(useAppStore)
      const chenBookingId = SEED_MARKERS['overriddenTimeUnitsBooking']?.entityId ?? ''
      const chenProcedure = proceduresForBooking(useAppStore.getState(), chenBookingId)[0]
      if (chenProcedure === undefined) return { ok: false, message: 'Reset done, but David Chen\'s Booking was not found to stage the audit trail.' }
      // An ASA III modifier claimed with its explanation, the office note, then
      // the claim removed: the trail shows both, and the fee ends where it started
      // (catch-up Phase 19b; the ASA grade is one optional modifier).
      const as3 = rvgModifierByCode(useAppStore.getState().masters.modifiers, 'AS3')
      if (as3 === undefined) return { ok: false, message: 'Reset done, but the RVG modifier AS3 was not found to stage the audit trail.' }
      const staged = [
        claimModifier(useAppStore, SOUTER_ACTOR, chenProcedure.id, { modifierId: as3.id, explanation: 'Pre-op review: ASA III' }),
        // The office's grouped save (catch-up Phase 35): the note and a time change in one change set.
        saveBookingPatch(useAppStore, OFFICE_ACTOR, chenBookingId, {
          booking: {
            notes: 'Rooms called: confirmed self-funded account details ahead of invoicing.',
            scheduledTime: shiftedTime(useAppStore.getState().schedule.bookings[chenBookingId]?.scheduledTime, 15),
          },
        }),
        removeModifier(useAppStore, SOUTER_ACTOR, chenProcedure.id, as3.id),
      ]
      const refused = staged.find((r) => !r.ok)
      if (refused !== undefined && !refused.ok) return { ok: false, message: `Reset done, but staging the audit trail was refused: ${refused.message}` }
      const invoiceStage = authoriseList(useAppStore, OFFICE_ACTOR, SEED_LIST_IDS.whitakerFri17)
      if (!invoiceStage.ok) return { ok: false, message: `Audit staged, but the Health NZ invoices could not be raised: ${invoiceStage.message}` }
      return {
        ok: true,
        message:
          'Reset to rich seeded Booking histories, added live edits to David Chen\'s trail, among them the office\'s grouped save (the note and the time, one change set), and authorised Dr Whitaker\'s Fri 17 Jul List, which locks the Health NZ agreed rate and the price in force on 17 Jul onto each Procedure and raises its invoices from that record. Compliance tour: (1) open David Chen\'s History: the office\'s save is one row, with View as at; (2) on Admin, Intake, Validators try an old-format and a new-format NHI, then an invalid one (optionally, as a labelled Future-scope aside, fire MSG-STG-1002 from Future scope: HL7 and FHIR and open its row on Admin, Intake, Matching); (3) in the Xero simulation\'s Contacts tab, show that no NHI or patient name crosses to Xero, only hidden IDs, then on the Data Inspector, Demo actions, Scan for NHI leaks: Scan now finds none, and the planted test leak is found; optionally, on Admin, Intake, Matching, open Mere Tipene\'s row and View raw row with a reason: identifiers masked and the view audited (Demo actions, View raw row as another role, is refused); (4) Contract history and the invoice recipe: in Admin, Master data, Contracts, open Health NZ agreed rate, change its rate and save, then open its History tab: the change with who, when and the values before and after, and Dr Whitaker\'s Procedures locked against it; open Hemi Walker\'s invoice, Demo actions, Regenerate from locked data: identical. Optional: Master data, Demo actions, Go-live data load.',
        nav: [
          { label: 'Go to Admin app', path: APP_CONFIG.admin.path },
          { label: 'Go to Xero sim', path: APP_CONFIG['demo-xero'].path },
        ],
      }
    },
  },
]

/** A wall time moved by `minutes` (the S5 jump's grouped save). */
function shiftedTime(time: string | undefined, minutes: number): string {
  const [h, m] = (time ?? '08:00').split(':').map(Number)
  const total = Math.min(23 * 60 + 55, (h ?? 8) * 60 + (m ?? 0) + minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

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
            {g.screen === BILLING_MONITOR_SCREEN && (
              <div style={{ fontSize: 12.5, color: neutral.slate }}>
                <strong style={{ fontWeight: 600 }}>Run payables in Xero:</strong> the Billing monitor's button, badged Simulated Xero: Xero pays the bills and the Billing Engine records each payment it reports (not a demo action).
              </div>
            )}
          </div>
        ))}
      </div>
    </ControlCard>
  )
}
