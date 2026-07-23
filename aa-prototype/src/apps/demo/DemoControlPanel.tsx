import { useMemo, useState } from 'react'
import { RotateCcw, Zap, MapPin, CalendarDays, Info, ChevronsRight, AlertTriangle, Stethoscope, CreditCard, PlugZap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { DemoSurface } from './DemoSurface'
import {
  advanceClockDays,
  advanceClockMinutes,
  armHandoffFault,
  authoriseList,
  editContract,
  openAccRecs,
  receivePayment,
  resetDemo,
  submitList,
  useAppStore,
  useClockTimeLabel,
  useToday,
  type Actor,
} from '../../store'
import { ANAE, CONTRACT, SEED_LIST_IDS, listIdForSlot } from '../../domain/seed'
import { roundToCents } from '../../domain/billing/money'
import { formatCurrency } from '../../shared/format'
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

      {/* Phase 10 demo triggers: Xero payment webhook + handoff fault */}
      <PaymentReceivedCard />
      <HandoffFaultCard />

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
            <button type="button" onClick={recordPayment} style={{ ...actionButtonStyle, background: accent.base, borderColor: accent.base, color: '#FFFFFF' }}>
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
          onMouseEnter={(e) => (e.currentTarget.style.background = neutral.sunken)}
          onMouseLeave={(e) => (e.currentTarget.style.background = neutral.surface)}
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
