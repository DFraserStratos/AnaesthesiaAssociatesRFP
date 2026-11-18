import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TextAction } from '../../../shared/ui'
import { aaFeeMonthLabel } from '../../../domain/billing/aaFee'
import { needAddressText } from '../../../domain/billing/invoicePresentation'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import {
  billingMonitor,
  handoffPair,
  handoffPairsForBooking,
  allAaFeeInvoices,
  payablesDue,
  postTransferJournal,
  prepaidLeftOffText,
  retryBillingException,
  runPayables,
  useAppStore,
  type MonitorBookingRow,
  type MonitorListRow,
  type MonitorStage,
  type PrepaidLeftOff,
} from '../../../store'
import { dayMicroCap, formatCurrency, hhmm, plural } from '../../../shared/format'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../tableChrome'
import { FormError } from '../../../shared'
import { sessionText } from '../../../domain/outOfHours'
import { HoldingAccountPanel } from '../components/HoldingAccountPanel'

interface BillingMonitorScreenProps {
  actor: Actor
}

const cellStyle = adminCell()

/** Under a failure the run raised (not a hand-off fault): what the Retry does (catch-up Phase 25). */
export const RETRY_FROM_LOCK_NOTE = 'Retry rebuilds from the locked record. A wrong price after invoicing is corrected by a credit note and rebill.'
const headCellStyle = adminHead()

/**
 * The billing-flow monitor (Phase 09; A5). One pipeline per authorised List:
 * List authorised -> Billing run -> Invoices generated -> Emailed -> Xero
 * (Phase 10 stub), with a per-Booking row underneath. Each Booking prices from
 * its locked record (catch-up Phase 25). A hand-off fault keeps "Resolve &
 * retry" (the hand-off again); any other failure shows its reason and a
 * "Retry" that rebuilds from the lock. Nothing here edits a Contract or a
 * Procedure.
 *
 * Two RFP-open readings are stated in the copy here: this surface lives in the
 * Admin Web App (vs a separate Billing Engine screen), and a failed Booking blocks
 * only its own invoice (per-booking isolation). The monitor itself is proposed
 * product UI, so it carries NO demo badge; only its simulation triggers (in the
 * harness bar's Demo actions menu on this screen) are badged (convention 13).
 */
export function BillingMonitorScreen({ actor }: BillingMonitorScreenProps) {
  const navigate = useNavigate()
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const [error, setError] = useState<string | null>(null)
  const [payRunMsg, setPayRunMsg] = useState<string | null>(null)

  const rows = useMemo(() => billingMonitor({ schedule, billing, masters }), [schedule, billing, masters])
  const failedTotal = rows.reduce((n, r) => n + r.failedCount + r.handoffFailedCount, 0)
  // From the ledger alone (catch-up Phase 36): the one source of what is due.
  const due = useMemo(() => payablesDue({ billing }), [billing])

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
        : `Run ${r.payablesRunId}: disbursed ${formatCurrency(r.totalDisbursed)} across ${plural(r.disbursedCount, 'payable')}.`,
    )
  }

  function resolveAndRetry(row: MonitorBookingRow) {
    // A prepayment transfer's journal fault (catch-up Phase 27a): post the journal again, once.
    if (row.journalFailure !== undefined) {
      const outcome = postTransferJournal(useAppStore, row.journalFailure.transferId)
      setError(outcome.ok ? null : outcome.message)
      return
    }
    // A Xero hand-off fault: the pair stands in the ledger, not yet in Xero; the fault flag was cleared when
    // it faulted, so a plain re-invoke of the idempotent hand-off now mirrors it. (Distinct from a
    // billing-run exception, which raises the invoices it never got, below.)
    if (row.handoffFailure !== undefined && row.status !== 'failed' && row.pairId !== undefined) {
      const outcome = handoffPair(useAppStore, row.pairId)
      setError(outcome.ok ? null : outcome.message)
      return
    }
    retry(row)
  }

  function retry(row: MonitorBookingRow) {
    if (row.exceptionId === undefined) return
    const outcome = retryBillingException(useAppStore, actor, row.exceptionId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    // The retry raised the Booking's invoices with their pairs (a split raises two); mirror each in Xero.
    handoffPairsForBooking(useAppStore, row.bookingId)
  }

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Billing monitor</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 780 }}>
          The billing engine's office view: every authorised list, its pipeline from authorisation
          to Xero handoff, and any booking that needs attention. Each booking prices from its locked
          record, taken when the list was authorised. A failed booking is held back on its own while
          the rest of the list bills. Where the RFP leaves open whether this surface sits in
          the Admin app or a separate Billing Engine screen, the prototype puts it here. The "Prior
          balance" flag reads any open (unpaid) prior episode; whether to separately distinguish open
          from genuinely overdue is held as a discovery question, since invoices carry a raised date
          but no due date. AA's own fee is invoiced to each anaesthetist monthly; it is never deducted
          from a payable. Money in and out is recorded in the ledger first; Xero mirrors it.
        </div>
      </div>

      {failedTotal > 0 && (
        <div style={{ background: semantic.warning.tint, border: `1px solid ${semantic.warning.solid}44`, borderRadius: radius.card, padding: '10px 14px', fontSize: 13, color: semantic.warning.onTint }}>
          {plural(failedTotal, 'booking')} across the pipeline need attention. Resolve and retry each below.
        </div>
      )}

      {/* Payables run (unbadged office action; the disbursement side of the
          two-state money model). Pays every payable leg in the ledger what it has
          released since the last run (catch-up Phase 36). */}
      <div data-shot="billing-payables-run" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Payables run</div>
          <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
            {due.count > 0
              ? `${plural(due.count, 'payable')} due · ${formatCurrency(due.total)} to pay out to anaesthetists. A payable is released for exactly what its invoice has received.`
              : 'No payables due. A payable is released for exactly what its invoice has received.'}
          </div>
          <div style={{ marginTop: 6 }}>
            <TextAction size="sm" flush shot="billing-open-ledger" onClick={() => navigate('/admin/ledger')}>Open the ledger</TextAction>
          </div>
          {payRunMsg !== null && (
            <div style={{ fontSize: 12.5, color: semantic.success.onTint, marginTop: 6 }}>{payRunMsg}</div>
          )}
        </div>
        <button
          onClick={doRunPayables}
          disabled={due.count === 0}
          style={{ minHeight: 38, padding: '0 16px', borderRadius: radius.ctl, border: 'none', background: due.count === 0 ? neutral.line : accent.base, color: due.count === 0 ? neutral.mist : neutral.surface, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: due.count === 0 ? 'default' : 'pointer' }}
        >
          Run payables
        </button>
      </div>

      <AaFeePanel />

      <HoldingAccountPanel />

      <FormError message={error} />

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
          {plural(row.invoiceCount, 'invoice')}
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

      {/* An invoice raised with no invoice address (catch-up Phase 22): the office adds one and sends it from the invoice. */}
      {row.noAddressCount > 0 && row.firstNoAddressInvoiceId !== undefined && (
        <div data-shot="monitor-no-address" style={{ fontSize: 12.5, color: semantic.warning.onTint }}>
          {`${row.noAddressCount === 1 ? '1 invoice' : `${row.noAddressCount} invoices`} ${needAddressText(row.noAddressCount).replace(/^\d+ /, '')}.`}{' '}
          <Link to={`/admin/invoices/${row.firstNoAddressInvoiceId}`} style={{ color: accent.base, fontWeight: 600 }}>
            Add an address and send
          </Link>
        </div>
      )}

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
                    <span title="This patient has an open (unpaid) prior episode at the intake check. Open versus genuinely overdue is not yet distinguished: invoices carry a raised date but no due date. A discovery point for AA." style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: radius.pill, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      Prior balance
                    </span>
                  )}
                </td>
                <td style={cellStyle}><BookingStatusPill row={bookingRow} /></td>
                <td style={cellStyle}>
                  {bookingRow.status === 'failed' ? (
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: semantic.error.onTint }}>{bookingRow.failure?.message ?? 'Needs manual review.'}</span>
                      <span data-shot="monitor-retry-note" style={{ fontSize: 12, color: neutral.slate }}>{RETRY_FROM_LOCK_NOTE}</span>
                    </span>
                  ) : bookingRow.handoffFailure !== undefined ? (
                    <span style={{ color: semantic.warning.onTint }}>{bookingRow.handoffFailure.message}</span>
                  ) : bookingRow.journalFailure !== undefined ? (
                    <span data-shot="monitor-journal-fault" style={{ color: semantic.warning.onTint }}>{bookingRow.journalFailure.message}</span>
                  ) : bookingRow.status === 'cancelled' ? (
                    <span style={{ color: neutral.mist }}>Cancelled · excluded from billing.</span>
                  ) : bookingRow.invoiceIds.length > 0 ? (
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <MoneyDetail row={bookingRow} />
                      {bookingRow.prepaidLeftOff !== undefined && <PrepaidLeftOffLine leftOff={bookingRow.prepaidLeftOff} />}
                    </span>
                  ) : bookingRow.prepaidLeftOff !== undefined ? (
                    <PrepaidLeftOffLine leftOff={bookingRow.prepaidLeftOff} />
                  ) : (
                    <span style={{ color: neutral.mist }}>No invoice (nothing to bill).</span>
                  )}
                </td>
                <td style={cellStyle}>
                  {(bookingRow.status === 'failed' || bookingRow.handoffFailure !== undefined || bookingRow.journalFailure !== undefined) && (
                    <button
                      onClick={() => onResolveRetry(bookingRow)}
                      style={{ minHeight: 34, padding: '0 12px', borderRadius: radius.ctl, border: 'none', background: accent.base, color: neutral.surface, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {bookingRow.status === 'failed' ? 'Retry' : 'Resolve & retry'}
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
    <span title={stage.detail} style={{ fontSize: 11.5, fontWeight: 600, borderRadius: radius.pill, padding: '4px 10px', whiteSpace: 'nowrap', ...tone }}>
      {stage.label}
    </span>
  )
}

/** A prepaid Procedure left off the final invoice (catch-up Phase 27; US-08.2.2, D57): a fact, never an exception. */
function PrepaidLeftOffLine({ leftOff }: { leftOff: PrepaidLeftOff }) {
  return (
    <span data-shot="monitor-prepaid-left-off" style={{ fontSize: 12.5, color: neutral.slate }}>
      {prepaidLeftOffText(leftOff)}
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
      <span style={{ color: neutral.slate }}>{plural(n, 'invoice')} raised.</span>
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
    row.prepaidLeftOff?.all === true && row.invoiceIds.length === 0 && row.status !== 'failed'
      ? { label: 'Prepaid', background: semantic.success.tint, color: semantic.success.onTint }
      : row.handoffFailure !== undefined && row.status !== 'failed'
      ? { label: 'Handoff failed', background: semantic.warning.tint, color: semantic.warning.onTint }
      : map[row.status] ?? { label: row.status, background: neutral.sunken, color: neutral.slate }
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: radius.pill, padding: '3px 9px', whiteSpace: 'nowrap', background: it.background, color: it.color }}>
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
