import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { aaFeeMonthLabel } from '../../../domain/billing/aaFee'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import {
  billingMonitor,
  chooseContractForFailedBooking,
  handoffCase,
  allAaFeeInvoices,
  payablesDue,
  retryBillingCase,
  runPayables,
  useAppStore,
  type MonitorBookingRow,
  type MonitorListRow,
  type MonitorStage,
} from '../../../store'
import { dayMicroCap, formatCurrency, hhmm } from '../../../shared/format'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../tableChrome'
import { sessionText } from '../../../domain/outOfHours'
import { Button, FormError, useSurface } from '../../../shared'
import { ContractSelect } from '../../../shared/contracts'
import { contractAllowedOn } from '../../../domain/billing/contractRail'
import { railContextForList, railMastersOf } from '../../../store'
import { selectControlStyle } from '../flows/fieldChrome'

interface BillingMonitorScreenProps {
  actor: Actor
}

const cellStyle = adminCell()

/** The billing failures the office resolves by choosing the Booking's Contract. */
const CONTRACT_FAILURES = new Set(['contractIneffective', 'contractMissing', 'noContract', 'noCounterparty'])
const headCellStyle = adminHead()

/**
 * The billing-flow monitor (Phase 09; A5). One pipeline per authorised List:
 * List authorised -> Billing run -> Invoices generated -> Emailed -> Xero
 * (Phase 10 stub), with a per-Booking row underneath. Failed rows carry the case's
 * readable failure and a Resolve & retry action: for a Contract failure it asks
 * the office to choose the Booking's Contract (catch-up Phase 18; no Contract is
 * ever edited from here), then re-bills only that Booking.
 *
 * Two RFP-open readings are stated in the copy here: this surface lives in the
 * Admin Web App (vs a separate Billing Engine screen), and a failed Booking blocks
 * only its own invoice (per-booking isolation). The monitor itself is proposed
 * product UI, so it carries NO demo badge; only its simulation triggers (in the
 * harness bar's Demo actions menu on this screen) are badged (convention 13).
 */
export function BillingMonitorScreen({ actor }: BillingMonitorScreenProps) {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const xero = useAppStore((s) => s.xero)
  const [error, setError] = useState<string | null>(null)
  const [payRunMsg, setPayRunMsg] = useState<string | null>(null)
  const [choosing, setChoosing] = useState<{ row: MonitorBookingRow; procedureId: string } | null>(null)

  const rows = useMemo(() => billingMonitor({ schedule, billing, masters }), [schedule, billing, masters])
  const failedTotal = rows.reduce((n, r) => n + r.failedCount + r.handoffFailedCount, 0)
  const due = useMemo(() => payablesDue({ xero }), [xero])

  function doRunPayables() {
    const res = runPayables(useAppStore, actor)
    if (!res.ok) {
      setPayRunMsg(res.message)
      return
    }
    const r = res.value
    setPayRunMsg(
      r.disbursedCount === 0
        ? 'No authorised payables to disburse right now.'
        : `Run ${r.payablesRunId}: disbursed ${formatCurrency(r.totalDisbursed)} across ${r.disbursedCount} payable${r.disbursedCount === 1 ? '' : 's'}.`,
    )
  }

  function resolveAndRetry(row: MonitorBookingRow) {
    if (row.caseId === undefined) return
    // A Xero handoff fault: the fault flag was cleared when it faulted, so a
    // plain re-invoke of the idempotent handoff now creates the pair. (Distinct
    // from a billing-run failure, which rebuilds the invoice below.)
    if (row.handoffFailure !== undefined && row.status !== 'failed') {
      const outcome = handoffCase(useAppStore, row.caseId)
      setError(outcome.ok ? null : outcome.message)
      return
    }
    // A Contract failure (no price in force, a Contract that cannot be found,
    // no Contract to bill under, or a holder with no billing record): the
    // office chooses the Booking's Contract first (keeping it is allowed, say
    // after adding its price), then retries.
    const failure = row.failure
    if (failure?.procedureId !== undefined && failure.procedureId !== '' && CONTRACT_FAILURES.has(failure.code)) {
      setChoosing({ row, procedureId: failure.procedureId })
      return
    }
    retry(row)
  }

  function retry(row: MonitorBookingRow) {
    if (row.caseId === undefined) return
    const outcome = retryBillingCase(useAppStore, actor, row.caseId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    // A billing-failure retry rebuilds the invoice; hand it off to Xero so the
    // resolved case gets its ACCREC/ACCPAY pair (else it would never be payable).
    handoffCase(useAppStore, row.caseId)
  }

  return (
    <>
    {choosing !== null && (
      <ChooseContractSheet
        actor={actor}
        caseId={choosing.row.caseId ?? ''}
        procedureId={choosing.procedureId}
        patientName={choosing.row.patientName}
        reason={choosing.row.failure?.message ?? ''}
        onDone={() => {
          const row = choosing.row
          setChoosing(null)
          retry(row)
        }}
        onClose={() => setChoosing(null)}
      />
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Billing monitor</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 780 }}>
          The billing engine's office view: every authorised list, its pipeline from authorisation
          to Xero handoff, and any booking that needs attention. A failed booking blocks only its own
          invoice, never the rest of the list. Where the RFP leaves open whether this surface sits in
          the Admin app or a separate Billing Engine screen, the prototype puts it here. The "Prior
          balance" flag reads any open (unpaid) prior episode; whether to separately distinguish open
          from genuinely overdue is held as a discovery question, since invoices carry a raised date
          but no due date. AA's own fee is invoiced to each anaesthetist monthly; it is never deducted
          from a payable.
        </div>
      </div>

      {failedTotal > 0 && (
        <div style={{ background: semantic.warning.tint, border: `1px solid ${semantic.warning.solid}44`, borderRadius: radius.card, padding: '10px 14px', fontSize: 13, color: semantic.warning.onTint }}>
          {failedTotal} booking{failedTotal === 1 ? '' : 's'} across the pipeline need attention. Resolve and retry each below.
        </div>
      )}

      {/* Payables run (unbadged office action; the disbursement side of the
          two-state money model). Pays every authorised ACCPAY the increment
          since the last run. */}
      <div data-shot="billing-payables-run" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Payables run</div>
          <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
            {due.count > 0
              ? `${due.count} payable${due.count === 1 ? '' : 's'} authorised · ${formatCurrency(due.total)} to disburse to anaesthetists. A payable authorises for exactly what its ACCREC has received.`
              : 'No payables are authorised for disbursement. A payable authorises for exactly what its ACCREC has received.'}
          </div>
          {payRunMsg !== null && (
            <div style={{ fontSize: 12.5, color: semantic.success.onTint, marginTop: 6 }}>{payRunMsg}</div>
          )}
        </div>
        <button
          onClick={doRunPayables}
          disabled={due.count === 0}
          style={{ minHeight: 38, padding: '0 16px', borderRadius: radius.ctl, border: 'none', background: due.count === 0 ? neutral.line : accent.base, color: due.count === 0 ? neutral.mist : '#FFFFFF', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: due.count === 0 ? 'default' : 'pointer' }}
        >
          Run payables
        </button>
      </div>

      <AaFeePanel />

      {error !== null && (
        <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>{error}</div>
      )}

      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: neutral.mist }}>
          No lists have been authorised yet. Authorise a submitted list and its billing run appears here.
        </div>
      ) : (
        rows.map((row) => <PipelineCard key={row.listId} row={row} onResolveRetry={resolveAndRetry} />)
      )}
    </div>
    </>
  )
}

/**
 * "Choose a Contract" for a Booking whose billing failed on its Contract
 * (catch-up Phase 18; RV-32): the office picks the right Contract, then the
 * Booking re-bills. Only the Procedure's Contract changes; no Contract is edited.
 */
function ChooseContractSheet({
  actor,
  caseId,
  procedureId,
  patientName,
  reason,
  onDone,
  onClose,
}: {
  actor: Actor
  caseId: string
  procedureId: string
  patientName: string
  reason: string
  onDone: () => void
  onClose: () => void
}) {
  const { Overlay } = useSurface()
  const current = useAppStore((s) => s.schedule.procedures[procedureId]?.governingContractId ?? '')
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  // Only the Contracts the step rail allows on this Booking's List (catch-up Phase 20).
  const allowed = useMemo(() => {
    const booking = schedule.procedures[procedureId] !== undefined ? schedule.bookings[schedule.procedures[procedureId]!.bookingId] : undefined
    const list = booking !== undefined ? schedule.lists[booking.listId] : undefined
    if (list === undefined) return () => false
    const ctx = railContextForList({ masters }, list)
    const rail = railMastersOf({ masters })
    return (id: string) => contractAllowedOn(rail, ctx, id)
  }, [masters, schedule, procedureId])
  const [contractId, setContractId] = useState(current)
  const [error, setError] = useState<string | null>(null)

  function choose() {
    const outcome = chooseContractForFailedBooking(useAppStore, actor, caseId, procedureId, contractId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onDone()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="choose-contract-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Choose a Contract</div>
        <div style={{ fontSize: 13.5, color: neutral.slate }}>
          {patientName}'s Booking could not be billed. {reason} Choose the Contract it should bill under, or keep it once its price is added, then it is billed again.
        </div>
        <ContractSelect value={contractId} onChange={setContractId} selectStyle={selectControlStyle} label="Contract" allowed={allowed} />
        <FormError message={error} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={choose} disabled={contractId === ''}>Choose and retry</Button>
        </div>
      </div>
    </Overlay>
  )
}

function PipelineCard({ row, onResolveRetry }: { row: MonitorListRow; onResolveRetry: (r: MonitorBookingRow) => void }) {
  const context = [row.hospitalName ?? row.list.hospitalId, sessionText(row.list.session), dayMicroCap(row.list.dateISO)].join(' · ')
  return (
    <div data-shot={`billing-pipeline-${row.listId}`} style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{row.anaesthetistName}</div>
          <div style={{ fontSize: 12.5, color: neutral.slate }}>{context}</div>
        </div>
        <div style={{ fontSize: 12, color: neutral.mist }}>
          {row.list.billedAtISO !== undefined ? `Run ${hhmm(row.list.billedAtISO)} · ` : ''}
          {row.invoiceCount} invoice{row.invoiceCount === 1 ? '' : 's'}
          {row.failedCount > 0 ? ` · ${row.failedCount} failed` : ''}
        </div>
      </div>

      {/* Pipeline stages */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {row.stages.map((stage, i) => (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StageChip stage={stage} />
            {i < row.stages.length - 1 && <span aria-hidden style={{ color: neutral.lineStrong, fontSize: 13 }}>→</span>}
          </div>
        ))}
      </div>

      {/* Per-booking rows */}
      <div style={{ overflowX: 'auto', border: `1px solid ${neutral.line}`, borderRadius: radius.ctl }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr>
              {['Booking', 'Patient', 'Status', 'Detail', ''].map((h) => (
                <th key={h === '' ? 'action' : h} style={headCellStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {row.bookingRows.map((bookingRow) => (
              <tr key={bookingRow.bookingId}>
                <td className="mono" style={cellStyle}>{bookingRow.bookingId}</td>
                <td style={cellStyle} data-shot={bookingRow.outstandingPriorBalance === true ? 'billing-prior-balance' : undefined}>
                  {bookingRow.patientName}
                  {bookingRow.outstandingPriorBalance === true && (
                    <span title="This patient has an open (unpaid) prior episode at the intake check. Open versus genuinely overdue is not yet distinguished: invoices carry a raised date but no due date. A discovery point for AA." style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      Prior balance
                    </span>
                  )}
                </td>
                <td style={cellStyle}><BookingStatusPill row={bookingRow} /></td>
                <td style={cellStyle}>
                  {bookingRow.status === 'failed' ? (
                    <span style={{ color: semantic.error.onTint }}>{bookingRow.failure?.message ?? 'Needs manual review.'}</span>
                  ) : bookingRow.handoffFailure !== undefined ? (
                    <span style={{ color: semantic.warning.onTint }}>{bookingRow.handoffFailure.message}</span>
                  ) : bookingRow.status === 'cancelled' ? (
                    <span style={{ color: neutral.mist }}>Cancelled · excluded from billing.</span>
                  ) : bookingRow.invoiceIds.length > 0 ? (
                    <MoneyDetail row={bookingRow} />
                  ) : (
                    <span style={{ color: neutral.mist }}>No invoice (fully pre-paid or nothing to bill).</span>
                  )}
                </td>
                <td style={cellStyle}>
                  {(bookingRow.status === 'failed' || bookingRow.handoffFailure !== undefined) && (
                    <button
                      onClick={() => onResolveRetry(bookingRow)}
                      style={{ minHeight: 34, padding: '0 12px', borderRadius: radius.ctl, border: 'none', background: accent.base, color: '#FFFFFF', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Resolve &amp; retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const STAGE_TONE: Record<MonitorStage['state'], { background: string; color: string }> = {
  done: { background: semantic.success.tint, color: semantic.success.onTint },
  partial: { background: semantic.warning.tint, color: semantic.warning.onTint },
  failed: { background: semantic.error.tint, color: semantic.error.onTint },
  pending: { background: neutral.sunken, color: neutral.slate },
}

function StageChip({ stage }: { stage: MonitorStage }) {
  const tone = STAGE_TONE[stage.state]
  return (
    <span title={stage.detail} style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap', ...tone }}>
      {stage.label}
    </span>
  )
}

/** Paid-in / disbursed as two INDEPENDENT dated states (RFP two-state money). */
function MoneyDetail({ row }: { row: MonitorBookingRow }) {
  const n = row.invoiceIds.length
  const paidLabel =
    row.paidInAtISO !== undefined
      ? `Paid in ✓ ${dayMicroCap(row.paidInAtISO.slice(0, 10))}`
      : row.receivedAmount > 0
        ? `Part paid ${formatCurrency(row.receivedAmount)}`
        : 'Awaiting payment'
  const disbursedLabel =
    row.disbursedAtISO !== undefined
      ? `Disbursed ✓ ${dayMicroCap(row.disbursedAtISO.slice(0, 10))}`
      : row.disbursedAmount > 0
        ? `Part disbursed ${formatCurrency(row.disbursedAmount)}`
        : 'Not disbursed'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: neutral.slate }}>{n} invoice{n === 1 ? '' : 's'} raised.</span>
      <span style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
        <span style={{ color: row.paidInAtISO !== undefined ? semantic.success.onTint : neutral.mist }}>{paidLabel}</span>
        <span style={{ color: row.disbursedAtISO !== undefined ? semantic.success.onTint : neutral.mist }}>{disbursedLabel}</span>
      </span>
    </div>
  )
}

function BookingStatusPill({ row }: { row: MonitorBookingRow }) {
  const map: Record<string, { label: string; background: string; color: string }> = {
    invoiced: { label: 'Invoiced', background: semantic.success.tint, color: semantic.success.onTint },
    handedOff: { label: 'Handed off', background: semantic.success.tint, color: semantic.success.onTint },
    partPaid: { label: 'Part paid', background: semantic.warning.tint, color: semantic.warning.onTint },
    paid: { label: 'Paid', background: semantic.success.tint, color: semantic.success.onTint },
    disbursed: { label: 'Disbursed', background: semantic.success.tint, color: semantic.success.onTint },
    failed: { label: 'Failed', background: semantic.error.tint, color: semantic.error.onTint },
    cancelled: { label: 'Cancelled', background: neutral.sunken, color: neutral.mist },
    pending: { label: 'Pending', background: neutral.sunken, color: neutral.slate },
  }
  // A handoff fault keeps the case `invoiced`; surface it as its own pill.
  const it =
    row.handoffFailure !== undefined && row.status !== 'failed'
      ? { label: 'Handoff failed', background: semantic.warning.tint, color: semantic.warning.onTint }
      : map[row.status] ?? { label: row.status, background: neutral.sunken, color: neutral.slate }
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', background: it.background, color: it.color }}>
      {it.label}
    </span>
  )
}

/** AA's monthly fee invoices at a glance (catch-up Phase 16): separate from the payables above. */
function AaFeePanel() {
  const billing = useAppStore((s) => s.billing)
  const invoices = useMemo(() => allAaFeeInvoices({ billing }), [billing])
  const latestMonth = invoices[0]?.monthISO
  const unpaid = invoices.filter((f) => f.status === 'unpaid')
  const unpaidTotal = unpaid.reduce((sum, f) => sum + f.total, 0)
  return (
    <div data-shot="billing-aa-fee-invoices" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>AA fee invoices</div>
        <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
          {latestMonth === undefined
            ? 'No fee invoices yet.'
            : `Latest month invoiced: ${aaFeeMonthLabel(latestMonth)} · ${unpaid.length} unpaid · ${formatCurrency(unpaidTotal)} incl GST owed to AA.`}
        </div>
      </div>
      <Link
        to="/admin/billing/aa-fees"
        style={{ minHeight: 38, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.surface, color: neutral.ink, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
      >
        Open AA fee invoices
      </Link>
    </div>
  )
}
