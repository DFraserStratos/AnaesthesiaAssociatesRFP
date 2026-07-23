import { useMemo, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import {
  billingMonitor,
  editContract,
  handoffCase,
  payablesDue,
  retryBillingCase,
  runPayables,
  useAppStore,
  type MonitorCardRow,
  type MonitorListRow,
  type MonitorStage,
} from '../../../store'
import { dayMicroCap, formatCurrency, hhmm } from '../../../shared/format'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../tableChrome'

interface BillingMonitorScreenProps {
  actor: Actor
}

const cellStyle = adminCell()
const headCellStyle = adminHead()

/**
 * The billing-flow monitor (Phase 09; A5). One pipeline per authorised List:
 * List authorised -> Billing run -> Invoices generated -> Emailed -> Xero
 * (Phase 10 stub), with a per-Card row underneath. Failed rows carry the case's
 * readable failure and a Resolve & retry action (re-effects a dated-out
 * contract, then re-bills only that Card).
 *
 * Two RFP-open readings are stated in the copy here: this surface lives in the
 * Admin Web App (vs a separate Billing Engine screen), and a failed Card blocks
 * only its own invoice (per-card isolation). The monitor itself is proposed
 * product UI, so it carries NO demo badge; only its simulation triggers (on the
 * demo control panel) are badged (convention 13).
 */
export function BillingMonitorScreen({ actor }: BillingMonitorScreenProps) {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const xero = useAppStore((s) => s.xero)
  const [error, setError] = useState<string | null>(null)
  const [payRunMsg, setPayRunMsg] = useState<string | null>(null)

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

  function resolveAndRetry(row: MonitorCardRow) {
    if (row.caseId === undefined) return
    // A Xero handoff fault: the fault flag was cleared when it faulted, so a
    // plain re-invoke of the idempotent handoff now creates the pair. (Distinct
    // from a billing-run failure, which rebuilds the invoice below.)
    if (row.handoffFailure !== undefined && row.status !== 'failed') {
      const outcome = handoffCase(useAppStore, row.caseId)
      setError(outcome.ok ? null : outcome.message)
      return
    }
    // Re-effect a dated-out / removed contract before re-billing (the common
    // failure the demo triggers). Other failure codes just re-bill, assuming
    // the office fixed the data through Master Data.
    const failure = row.failure
    if (failure?.procedureId !== undefined && (failure.code === 'contractIneffective' || failure.code === 'contractMissing')) {
      const contractId = schedule.procedures[failure.procedureId]?.governingContractId
      if (contractId !== undefined && masters.contracts[contractId] !== undefined) {
        const restored = editContract(useAppStore, actor, contractId, { effectiveToISO: undefined })
        if (!restored.ok) {
          setError(restored.message)
          return
        }
      }
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.01em' }}>Billing monitor</h1>
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: 4, maxWidth: 780 }}>
          The billing engine's office view: every authorised list, its pipeline from authorisation
          to Xero handoff, and any card that needs attention. A failed card blocks only its own
          invoice, never the rest of the list. Where the RFP leaves open whether this surface sits in
          the Admin app or a separate Billing Engine screen, the prototype puts it here.
        </div>
      </div>

      {failedTotal > 0 && (
        <div style={{ background: semantic.warning.tint, border: `1px solid ${semantic.warning.solid}44`, borderRadius: radius.card, padding: '10px 14px', fontSize: 13, color: semantic.warning.onTint }}>
          {failedTotal} card{failedTotal === 1 ? '' : 's'} across the pipeline need attention. Resolve and retry each below.
        </div>
      )}

      {/* Payables run (unbadged office action; the disbursement side of the
          two-state money model). Pays every authorised ACCPAY the increment
          since the last run. */}
      <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Payables run</div>
          <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: 2 }}>
            {due.count > 0
              ? `${due.count} payable${due.count === 1 ? '' : 's'} authorised · ${formatCurrency(due.total)} to disburse to anaesthetists.`
              : 'No payables are authorised for disbursement. A payable authorises when its ACCREC is paid.'}
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
  )
}

function PipelineCard({ row, onResolveRetry }: { row: MonitorListRow; onResolveRetry: (r: MonitorCardRow) => void }) {
  const context = [row.hospitalName ?? 'Unassigned', row.list.session, dayMicroCap(row.list.dateISO)].join(' · ')
  return (
    <div style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
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

      {/* Per-card rows */}
      <div style={{ overflowX: 'auto', border: `1px solid ${neutral.line}`, borderRadius: radius.ctl }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr>
              {['Card', 'Patient', 'Status', 'Detail', ''].map((h) => (
                <th key={h === '' ? 'action' : h} style={headCellStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {row.cardRows.map((cardRow) => (
              <tr key={cardRow.cardId}>
                <td className="mono" style={cellStyle}>{cardRow.cardId}</td>
                <td style={cellStyle}>
                  {cardRow.patientName}
                  {cardRow.outstandingPriorBalance === true && (
                    <span title="This patient has an unpaid prior episode (intake check)" style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, color: semantic.warning.onTint, background: semantic.warning.tint, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                      Prior balance
                    </span>
                  )}
                </td>
                <td style={cellStyle}><CardStatusPill row={cardRow} /></td>
                <td style={cellStyle}>
                  {cardRow.status === 'failed' ? (
                    <span style={{ color: semantic.error.onTint }}>{cardRow.failure?.message ?? 'Needs manual review.'}</span>
                  ) : cardRow.handoffFailure !== undefined ? (
                    <span style={{ color: semantic.warning.onTint }}>{cardRow.handoffFailure.message}</span>
                  ) : cardRow.status === 'cancelled' ? (
                    <span style={{ color: neutral.mist }}>Cancelled · excluded from billing.</span>
                  ) : cardRow.invoiceIds.length > 0 ? (
                    <MoneyDetail row={cardRow} />
                  ) : (
                    <span style={{ color: neutral.mist }}>No invoice (fully pre-paid or nothing to bill).</span>
                  )}
                </td>
                <td style={cellStyle}>
                  {(cardRow.status === 'failed' || cardRow.handoffFailure !== undefined) && (
                    <button
                      onClick={() => onResolveRetry(cardRow)}
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
function MoneyDetail({ row }: { row: MonitorCardRow }) {
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

function CardStatusPill({ row }: { row: MonitorCardRow }) {
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
