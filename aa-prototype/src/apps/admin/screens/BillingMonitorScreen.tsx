import { useMemo, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import type { Actor } from '../../../store'
import {
  billingMonitor,
  editContract,
  retryBillingCase,
  useAppStore,
  type MonitorCardRow,
  type MonitorListRow,
  type MonitorStage,
} from '../../../store'
import { dayMicroCap, hhmm } from '../../../shared/format'
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
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => billingMonitor({ schedule, billing, masters }), [schedule, billing, masters])
  const failedTotal = rows.reduce((n, r) => n + r.failedCount, 0)

  function resolveAndRetry(row: MonitorCardRow) {
    if (row.caseId === undefined) return
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
    setError(outcome.ok ? null : outcome.message)
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
                <td style={cellStyle}>{cardRow.patientName}</td>
                <td style={cellStyle}><CardStatusPill status={cardRow.status} /></td>
                <td style={cellStyle}>
                  {cardRow.status === 'failed' ? (
                    <span style={{ color: semantic.error.onTint }}>{cardRow.failure?.message ?? 'Needs manual review.'}</span>
                  ) : cardRow.status === 'cancelled' ? (
                    <span style={{ color: neutral.mist }}>Cancelled · excluded from billing.</span>
                  ) : cardRow.invoiceIds.length > 0 ? (
                    <span style={{ color: neutral.slate }}>{cardRow.invoiceIds.length} invoice{cardRow.invoiceIds.length === 1 ? '' : 's'} raised.</span>
                  ) : (
                    <span style={{ color: neutral.mist }}>No invoice (fully pre-paid or nothing to bill).</span>
                  )}
                </td>
                <td style={cellStyle}>
                  {cardRow.status === 'failed' && (
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

function CardStatusPill({ status }: { status: MonitorCardRow['status'] }) {
  const map: Record<string, { label: string; background: string; color: string }> = {
    invoiced: { label: 'Invoiced', background: semantic.success.tint, color: semantic.success.onTint },
    paid: { label: 'Paid', background: semantic.success.tint, color: semantic.success.onTint },
    failed: { label: 'Failed', background: semantic.error.tint, color: semantic.error.onTint },
    cancelled: { label: 'Cancelled', background: neutral.sunken, color: neutral.mist },
    pending: { label: 'Pending', background: neutral.sunken, color: neutral.slate },
  }
  const it = map[status] ?? { label: status, background: neutral.sunken, color: neutral.slate }
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap', background: it.background, color: it.color }}>
      {it.label}
    </span>
  )
}
