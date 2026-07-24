import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw,
  Zap,
  MapPin,
  CalendarDays,
  Info,
  ChevronsRight,
  AlertTriangle,
  Stethoscope,
  CreditCard,
  PlugZap,
  Route,
  FileText,
  Banknote,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DemoSurface } from './DemoSurface'
import {
  advanceClockDays,
  advanceClockMinutes,
  advanceClockToDate,
  advanceClockToNextMorning,
  armHandoffFault,
  authoriseList,
  editContract,
  ingestPdfRow,
  openAccRecs,
  processMessage,
  receivePayment,
  resetDemo,
  runArchiveJob,
  runPayables,
  runReconciliationPoll,
  submitList,
  useAppStore,
  useClockTimeLabel,
  useToday,
  type Actor,
} from '../../store'
import { CANNED_MESSAGES, SURGEON_PDFS } from '../../domain/integrations'
import { ANAE, CONTRACT, SEED_LIST_IDS, listIdForSlot } from '../../domain/seed'
import { roundToCents } from '../../domain/billing/money'
import { formatCurrency } from '../../shared/format'
import { DemoBadge } from '../../shared'
import { APP_CONFIG } from '../../shell/appConfig'
import { neutral, accent, radius, elevation, semantic } from '../../theme/tokens'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/** The S1 booking's procedure day (Dr Souter's seeded Tue 28 Jul St George's List). */
const S1_PROCEDURE_DAY = '2026-07-28'

interface AdvanceButton {
  label: string
  run: () => void
  icon?: LucideIcon
  /** Disabled when the jump would be a no-op (the clock is forward-only). */
  disabled?: boolean
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
 * Demo control panel (`/demo/control`). The presenter's cockpit, in four
 * labelled groups: the live clock + reset, the S1 to S5 scenario jumps (the
 * guided-script entry points), booking/integration events, and billing/money
 * events. Every trigger states what it will do before firing, and the demo-only
 * surfaces stay badged (PROGRESS convention 13).
 */
export function DemoControlPanel() {
  const todayISO = useToday()
  const timeLabel = useClockTimeLabel()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [failureMsg, setFailureMsg] = useState<string | null>(null)
  const [postOpMsg, setPostOpMsg] = useState<string | null>(null)

  const dateLabel = format(parseISO(todayISO), 'EEEE d MMMM yyyy')
  const procDayLabel = format(parseISO(S1_PROCEDURE_DAY), 'd MMM')

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
    { label: 'Next morning', run: () => advanceClockToNextMorning(useAppStore) },
    { label: '+7 days', run: () => advanceClockDays(useAppStore, 7) },
    {
      label: `Procedure day · ${procDayLabel}`,
      run: () => advanceClockToDate(useAppStore, S1_PROCEDURE_DAY),
      icon: MapPin,
      // Forward-only: once the clock reaches the procedure day the jump is a no-op.
      disabled: todayISO >= S1_PROCEDURE_DAY,
    },
  ]

  return (
    <DemoSurface
      title="Demo control panel"
      subtitle="The presenter's cockpit for the demo. Reset the data, advance the clock, jump to a scenario and fire simulated integration and money events, all against the fake in-browser backend."
    >
      {/* ── Clock & reset ─────────────────────────────────────── */}
      <SectionHeading label="Clock & reset" />

      <ControlCard icon={CalendarDays} eyebrow="Demo clock" title={`${dateLabel} · ${timeLabel}`}>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Advancing past midnight rolls the canvas: new far edge days generate from Permanent Lists
          with the same deterministic generator the seed uses. Next morning jumps to 08:00 tomorrow;
          Procedure day jumps forward to the S1 booking's operating day.
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {advances.map((a) => {
            const Icon = a.icon ?? ChevronsRight
            const disabled = a.disabled === true
            return (
              <button
                key={a.label}
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
        hint="Each jump resets to the pristine seed, stages one scenario, and tells you where to go next. Reset-first keeps every jump deterministic and doubles as accident recovery."
      />
      <ScenarioJumps />

      {/* ── Booking & integration events ──────────────────────── */}
      <SectionHeading label="Booking & integration events" />
      <IntegrationTriggerCard />
      <PdfArrivalCard />

      {/* ── Billing, money & exceptions ───────────────────────── */}
      <SectionHeading label="Billing, money & exceptions" />

      <ControlCard icon={AlertTriangle} eyebrow="Billing exceptions" title="Trigger billing failure">
        <div><DemoBadge label="Demo trigger" /></div>
        <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
          Dates out the externally held COS ACC contract (a group holder with no default fallback) and authorises the
          seeded multi-card list. One card fails to rate; its clean sibling still invoices, so the monitor shows
          per-card isolation and a Resolve &amp; retry path.
        </span>
        <div style={{ marginTop: 4 }}>
          <button type="button" onClick={triggerBillingFailure} style={actionButtonStyle}
            {...secondaryHover}>
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
            {...secondaryHover}>
            Stage scenario
          </button>
        </div>
        {postOpMsg !== null && (
          <div style={{ marginTop: 4, fontSize: 12.5, color: semantic.success.onTint, background: semantic.success.tint, borderRadius: radius.ctl, padding: '8px 12px' }}>{postOpMsg}</div>
        )}
      </ControlCard>

      <PaymentReceivedCard />
      <HandoffFaultCard />
      <AutomatedJobsCard />

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

/** The five guided-script scenarios. Each resets first, then stages minimally. */
const SCENARIOS: readonly Scenario[] = [
  {
    id: 'S1',
    title: 'S1 · Booking to theatre',
    blurb: 'A hospital HL7 booking lands, fills over days, then captures on procedure day and submits.',
    run: () => {
      resetDemo(useAppStore)
      const res = processMessage(useAppStore, 'MSG-STG-1001')
      if (!res.ok) return { ok: false, message: `Reset done, but the booking message was refused: ${res.message}` }
      return {
        ok: true,
        message:
          'Reset, then fired St George\'s S12 booking. A new Card for Sarah Mitchell landed on Dr Souter\'s Tue 28 Jul AM List (DRAFT). Use "Procedure day · 28 Jul" above, then capture and submit on the Mobile app. The Integrations simulator shows the HL7 to FHIR transform.',
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
          'Reset to the pristine day. In the Admin Day view (Tue 21 Jul): review the roster, phone-book a Free session, step to Wed 22 Jul to reassign a conflicted List, and authorise a submitted List (Morrison, Mon 20 or Whitaker, Fri 17) from the Review queue.',
        nav: [{ label: 'Go to Admin app', path: APP_CONFIG.admin.path }],
      }
    },
  },
  {
    id: 'S3',
    title: 'S3 · Money end-to-end',
    blurb: 'Authorise a split-billing List, generate invoices and the Xero pair, take payment, run payables.',
    run: () => {
      resetDemo(useAppStore)
      const listId = listIdForSlot(ANAE.souter, '2026-07-20', 'AM')
      const res = submitList(useAppStore, OFFICE, listId)
      if (!res.ok) return { ok: false, message: `Reset done, but the split-billing List could not be submitted: ${res.message}` }
      return {
        ok: true,
        message:
          'Reset, then submitted Dr Souter\'s Mon 20 Jul AM List (Forte Health, includes the split-billing Card) into the Review queue. In Admin, authorise it to generate the invoices and the Xero pair, then come back here to fire a payment webhook, advance a day for balances, and run payables.',
        nav: [{ label: 'Go to Admin app', path: APP_CONFIG.admin.path }],
      }
    },
  },
  {
    id: 'S4',
    title: 'S4 · Exceptions',
    blurb: 'Pre-payment gate, post-op addendum, billing failure + retry, integration dead-letter + fix, partial payment.',
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          'Reset. Walk the exceptions using the triggers on this panel: (1) open the unpaid pre-payment Card on Mobile (Dr Souter, Fri 24 Jul AM) and see completion blocked until an audited override; (2) Stage post-op addendum below; (3) Trigger billing failure below, then Resolve & retry in the billing monitor; (4) Fire the Christchurch Public dead-letter message (MSG-CPH-2001) below, fix the feed mapping to PID-3 in the Integrations monitor and reprocess; (5) fire a Half (partial) payment below, then run payables.',
        nav: [{ label: 'Go to Mobile app', path: APP_CONFIG.mobile.path }],
      }
    },
  },
  {
    id: 'S5',
    title: 'S5 · Compliance tour',
    blurb: 'Audit trail, NHI dual-format validator, no-NHI-in-Xero callout, contract effective-dating.',
    run: () => {
      resetDemo(useAppStore)
      return {
        ok: true,
        message:
          'Reset. Compliance tour from the seed: (1) open David Chen\'s much-edited Card History for the full audit trail; (2) show the NHI dual-format validator (fire the new-format booking MSG-STG-1002 below, or add a Card manually and try both formats); (3) open the Xero simulator and show no NHI ever crosses to Xero; (4) in Admin master data, effective-date a contract and show an already-raised invoice stays unchanged.',
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
        Pick a scenario to stage it cleanly from a fresh reset. Each jump confirms first, because it
        replaces all current demo data.
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
                <button type="button" onClick={() => setConfirming(s.id)} style={{ ...actionButtonStyle, flex: 'none' }}>
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

/** Badged demo trigger: simulate a Xero payment webhook against an open ACCREC. */
function PaymentReceivedCard() {
  const xero = useAppStore((s) => s.xero)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const candidates = useMemo(() => openAccRecs({ xero, billing, masters }), [xero, billing, masters])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'full' | 'partial'>('full')
  const [keyN, setKeyN] = useState(1)
  const [last, setLast] = useState<{ accRecId: string; key: string; amount: number } | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const active = candidates.find((c) => c.accRecId === selectedId) ?? candidates[0]

  function recordPayment() {
    if (active === undefined) return
    const partial = roundToCents(active.remaining / 2)
    const amount = mode === 'partial' && partial > 0 ? partial : active.remaining
    const key = `WEBHOOK-${active.accRecId}-${keyN}`
    const res = receivePayment(useAppStore, { accRecId: active.accRecId, amount, idempotencyKey: key, source: 'webhook' })
    setKeyN((n) => n + 1)
    setLast({ accRecId: active.accRecId, key, amount })
    setMsg(
      res.ok
        ? res.value.applied
          ? `Webhook applied ${formatCurrency(amount)} to ${active.invoiceNumber}. The paired ACCPAY is authorised pro-rata.`
          : 'No change (already fully paid).'
        : `Refused: ${res.message}`,
    )
  }

  function replayLast() {
    if (last === null) return
    const res = receivePayment(useAppStore, { accRecId: last.accRecId, amount: last.amount, idempotencyKey: last.key, source: 'webhook' })
    setMsg(
      res.ok && !res.value.applied
        ? 'Duplicate webhook ignored (idempotent by key). No double effect.'
        : 'Replayed.',
    )
  }

  return (
    <ControlCard icon={CreditCard} eyebrow="Xero payments" title="Payment received (webhook)">
      <div><DemoBadge label="Demo trigger" /></div>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
        Simulates a Xero INVOICE webhook: the ACCREC is marked (part) paid and its paired ACCPAY is
        authorised proportionally. Replaying reuses the last key to show idempotency. A missed webhook
        is caught by the daily reconciliation poll when you advance the day.
      </span>
      {candidates.length === 0 ? (
        <span style={{ fontSize: 12.5, color: neutral.mist, marginTop: 4 }}>
          No open invoices. Authorise a list (or raise a pre-payment invoice) to create an ACCREC first.
        </span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <select
            value={active?.accRecId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ font: 'inherit', fontSize: 13, padding: '7px 10px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink }}
          >
            {candidates.map((c) => (
              <option key={c.accRecId} value={c.accRecId}>
                {c.invoiceNumber} · {c.counterpartyLabel} · {formatCurrency(c.remaining)} due
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['full', 'partial'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{ ...actionButtonStyle, background: mode === m ? neutral.sunken : neutral.surface, borderColor: mode === m ? neutral.slate : neutral.lineStrong }}
              >
                {m === 'full' ? 'Full payment' : 'Half (partial)'}
              </button>
            ))}
            <button type="button" onClick={recordPayment} style={primaryButtonStyle}>
              Record payment
            </button>
            <button type="button" onClick={replayLast} disabled={last === null} style={{ ...actionButtonStyle, opacity: last === null ? 0.5 : 1, cursor: last === null ? 'not-allowed' : 'pointer' }}>
              Replay last event
            </button>
          </div>
        </div>
      )}
      {msg !== null && (
        <div style={{ marginTop: 4, fontSize: 12.5, color: neutral.slate, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 12px' }}>{msg}</div>
      )}
    </ControlCard>
  )
}

/** Badged demo trigger: fire a canned HL7/FHIR message + a dedupe replay. */
function IntegrationTriggerCard() {
  const [selectedId, setSelectedId] = useState<string>(CANNED_MESSAGES[0]?.id ?? '')
  const [last, setLast] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function fire() {
    const res = processMessage(useAppStore, selectedId)
    setLast(selectedId)
    setMsg(
      res.ok
        ? `Fired ${selectedId}: ${res.value.outcome}. See the three-pane view in the integration simulator and the log in the Admin app Integrations monitor.`
        : `Refused: ${res.message}`,
    )
  }
  function replay() {
    if (last === null) return
    const res = processMessage(useAppStore, last)
    setMsg(
      res.ok
        ? res.value.outcome === 'duplicate'
          ? 'Deduplicated: same message control ID, no second Card created.'
          : `Replayed ${last}: ${res.value.outcome}.`
        : `Refused: ${res.message}`,
    )
  }

  return (
    <ControlCard icon={Zap} eyebrow="Integrations" title="Fire an integration message">
      <div><DemoBadge label="Demo trigger" /></div>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
        Sends a canned hospital HL7 / FHIR message into the fake backend. Includes the Christchurch
        Public dead-letter case (MSG-CPH-2001). Replaying the same message shows idempotent dedupe (no
        double Card). The full simulator lives at the Integrations demo surface; the message log is in
        the Admin app Integrations monitor.
      </span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ font: 'inherit', fontSize: 13, padding: '7px 10px', borderRadius: radius.ctl, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, color: neutral.ink, maxWidth: 340 }}
        >
          {CANNED_MESSAGES.map((m) => (
            <option key={m.id} value={m.id}>{m.label} · {m.id}</option>
          ))}
        </select>
        <button type="button" onClick={fire} style={primaryButtonStyle}>
          Fire message
        </button>
        <button type="button" onClick={replay} disabled={last === null} style={{ ...actionButtonStyle, opacity: last === null ? 0.5 : 1, cursor: last === null ? 'not-allowed' : 'pointer' }}>
          Replay last (dedupe)
        </button>
      </div>
      {msg !== null && (
        <div style={{ marginTop: 4, fontSize: 12.5, color: neutral.slate, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 12px' }}>{msg}</div>
      )}
    </ControlCard>
  )
}

/** Badged demo trigger: an emailed surgeon PDF arrives; ingest one reviewed row. */
function PdfArrivalCard() {
  const [msg, setMsg] = useState<string | null>(null)

  function ingest() {
    const pdf = SURGEON_PDFS[0]
    const row = pdf?.rows.find((r) => r.id === 'R2')
    if (pdf === undefined || row === undefined) {
      setMsg('The sample PDF row is not present in this build.')
      return
    }
    const listId = listIdForSlot(pdf.targetList.anaesthetistId, pdf.targetList.dateISO, pdf.targetList.session)
    const res = ingestPdfRow(useAppStore, OFFICE, listId, row)
    setMsg(
      res.ok
        ? `${res.value.outcome === 'created' ? 'Created' : 'Updated'} a Card for ${row.name} on Dr Souter's Mon 27 Jul AM List from ${pdf.fromSurgeon}'s emailed list. Re-firing updates the same Card (deduped by NHI), never a duplicate. The full review-and-edit-before-ingest flow, including the deliberately mistyped NHI row, is in the Integrations simulator under Surgeon PDFs.`
        : `Refused: ${res.message}`,
    )
  }

  return (
    <ControlCard icon={FileText} eyebrow="Surgeon PDF" title="PDF list arrives (ingest a row)">
      <div><DemoBadge label="Demo trigger" /></div>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
        Simulates the emailed-PDF fallback: ingests one reviewed row onto its target List, with the
        patient deduped by NHI. The RFP keeps phone and PDF as first-class channels; review and edit
        before ingest lives in the Integrations simulator.
      </span>
      <div style={{ marginTop: 4 }}>
        <button type="button" onClick={ingest} style={actionButtonStyle}
          {...secondaryHover}>
          Ingest PDF row
        </button>
      </div>
      {msg !== null && (
        <div style={{ marginTop: 4, fontSize: 12.5, color: neutral.slate, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 12px' }}>{msg}</div>
      )}
    </ControlCard>
  )
}

/** Badged demo trigger: arm the next Xero handoff to fault (D-handoff). */
function HandoffFaultCard() {
  const [msg, setMsg] = useState<string | null>(null)
  const armed = useAppStore((s) => s.settings.failNextHandoff === true)
  return (
    <ControlCard icon={PlugZap} eyebrow="Xero handoff" title="Fail the next Xero handoff">
      <div><DemoBadge label="Demo trigger" /></div>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
        Arms the next ACCREC/ACCPAY handoff to fault. The invoice still stands; the case records a
        handoff failure and no pair is created. Then authorise a list (or raise a pre-payment invoice):
        the billing monitor shows the fault with a Resolve &amp; retry that re-runs the idempotent handoff.
      </span>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            armHandoffFault(useAppStore, OFFICE)
            setMsg('Armed. The next Xero handoff will fault once, then clear.')
          }}
          style={actionButtonStyle}
          {...secondaryHover}
        >
          Arm handoff failure
        </button>
        {armed && <span style={{ fontSize: 12, fontWeight: 600, color: semantic.warning.onTint }}>Armed</span>}
      </div>
      {msg !== null && (
        <div style={{ marginTop: 4, fontSize: 12.5, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: radius.ctl, padding: '8px 12px' }}>{msg}</div>
      )}
    </ControlCard>
  )
}

/** Badged demo trigger: run a scheduled job now, without advancing the clock. */
function AutomatedJobsCard() {
  const [msg, setMsg] = useState<string | null>(null)

  function reconcile() {
    const n = runReconciliationPoll(useAppStore)
    setMsg(
      n > 0
        ? `Reconciliation poll applied ${n} previously-missed payment${n === 1 ? '' : 's'}.`
        : 'Reconciliation poll ran: no unmirrored payments to catch.',
    )
  }
  function archive() {
    const res = runArchiveJob(useAppStore)
    if (!res.ok) {
      setMsg(`Refused: ${res.message}`)
      return
    }
    setMsg(
      res.value.count > 0
        ? `Archive job archived ${res.value.count} inactive Xero contact${res.value.count === 1 ? '' : 's'}.`
        : 'Archive job ran: no contacts past the inactivity window yet.',
    )
  }
  function payables() {
    const res = runPayables(useAppStore, OFFICE)
    if (!res.ok) {
      setMsg(`Refused: ${res.message}`)
      return
    }
    setMsg(
      res.value.disbursedCount > 0
        ? `Payables run disbursed ${formatCurrency(res.value.totalDisbursed)} across ${res.value.disbursedCount} payable${res.value.disbursedCount === 1 ? '' : 's'}.`
        : 'Payables run ran: nothing authorised to disburse yet.',
    )
  }

  return (
    <ControlCard icon={Banknote} eyebrow="Automated jobs" title="Run a scheduled job now">
      <div><DemoBadge label="Demo trigger" /></div>
      <span style={{ fontSize: 13, lineHeight: 1.45, color: neutral.slate }}>
        Fires the jobs that otherwise run on the daily clock tick, without advancing the clock. The
        payables run and the nightly archive job also live in the Admin app (their product home); the
        reconciliation poll is the missed-webhook safety net.
      </span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <button type="button" onClick={reconcile} style={actionButtonStyle}
          {...secondaryHover}>
          Run reconciliation poll
        </button>
        <button type="button" onClick={archive} style={actionButtonStyle}
          {...secondaryHover}>
          Run archive job
        </button>
        <button type="button" onClick={payables} style={actionButtonStyle}
          {...secondaryHover}>
          Run payables
        </button>
      </div>
      {msg !== null && (
        <div style={{ marginTop: 4, fontSize: 12.5, color: neutral.slate, background: neutral.sunken, borderRadius: radius.ctl, padding: '8px 12px' }}>{msg}</div>
      )}
    </ControlCard>
  )
}
