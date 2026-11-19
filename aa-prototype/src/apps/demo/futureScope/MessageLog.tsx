/**
 * The HL7 message log, with retry and dead-letter (`/demo/integrations/log`).
 * Moved from Admin Integrations' Messages tab in catch-up Phase 34 (RV-14,
 * RV-15): Future scope, on the demo surface, in its plain look (UI unification
 * README question 2). Parsed messages still only stage a row on Admin Intake.
 */

import { useMemo } from 'react'
import { accent, neutral, radius, semantic } from '../../../theme/tokens'
import { integrationMonitor, reprocessMessage, useAppStore, type IntegrationMonitorRow } from '../../../store'
import { hhmm, plural } from '../../../shared/format'
import { cellStyle as adminCell, headCellStyle as adminHead } from '../../admin/tableChrome'
import { FutureScopeChrome } from './FutureScopeChrome'

const cell = adminCell()
const head = adminHead()

export function FutureScopeMessageLog() {
  const integrations = useAppStore((s) => s.integrations)
  const rows = useMemo(() => integrationMonitor({ integrations }), [integrations])
  const attention = rows.filter((r) => r.status === 'deadLetter')

  return (
    <FutureScopeChrome subtitle="Every hospital message as received: stored on receipt, then processed, retried, and kept on a dead-letter queue when it cannot be read.">
      <div data-shot="future-scope-log" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {attention.length > 0 && (
          <div data-shot="integrations-attention" style={{ background: semantic.warning.tint, border: `1px solid ${semantic.warning.solid}44`, borderRadius: radius.card, padding: '10px 14px', fontSize: 13, color: semantic.warning.onTint }}>
            {plural(attention.length, 'message')} need attention (dead-letter). Reprocess after fixing the cause on Feed mapping.
          </div>
        )}
        {rows.length === 0 ? (
          <div style={{ fontSize: 13, color: neutral.mist, padding: '8px 0' }}>
            No messages received yet. Fire one from Demo actions in the harness bar, or replay one in the simulator, to see the log fill.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 920 }}>
              <thead>
                <tr>{['Time', 'Source', 'Type', 'Control ID', 'Appointment', 'Patient', 'Status', ''].map((h) => <th key={h === '' ? 'a' : h} style={head}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => <MessageLogRow key={r.id} row={r} />)}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: 12, color: neutral.mist, lineHeight: 1.5 }}>
          Parsed messages land on Admin Intake as rows for the office to decide. Nothing is applied automatically.
          &ldquo;Retried&rdquo; is a processed message that took more than one attempt. Duplicates are deduped by the
          message control ID (no second row). Dead-letter rows are kept for the office to action, never dropped.
        </div>
      </div>
    </FutureScopeChrome>
  )
}

function MessageLogRow({ row }: { row: IntegrationMonitorRow }) {
  const needsAction = row.status === 'deadLetter'
  return (
    <tr>
      <td className="mono" style={cell}>{hhmm(row.atISO)}</td>
      <td style={cell}>{row.feedName}</td>
      <td style={cell}>{row.eventType}</td>
      <td className="mono" style={cell}>{row.messageControlId}</td>
      <td className="mono" style={cell}>{row.appointmentId ?? '·'}</td>
      <td style={cell}>{row.patientRef ?? '·'}</td>
      <td style={cell}>
        <StatusChip label={row.displayStatus} status={row.status} />
        {row.failureReason !== undefined && needsAction && (
          <div style={{ fontSize: 11.5, color: semantic.warning.onTint, marginTop: 4, maxWidth: 260 }}>{row.failureReason}</div>
        )}
      </td>
      <td style={cell}>
        {needsAction && (
          <button
            type="button"
            onClick={() => reprocessMessage(useAppStore, row.id)}
            style={{ minHeight: 32, padding: '0 12px', borderRadius: radius.ctl, border: 'none', background: accent.base, color: neutral.surface, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            Reprocess
          </button>
        )}
      </td>
    </tr>
  )
}

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  processed: { bg: semantic.success.tint, fg: semantic.success.onTint },
  duplicate: { bg: neutral.sunken, fg: neutral.slate },
  retrying: { bg: semantic.warning.tint, fg: semantic.warning.onTint },
  deadLetter: { bg: semantic.error.tint, fg: semantic.error.onTint },
  pending: { bg: neutral.sunken, fg: neutral.slate },
}

/** The log's plain status chip: the demo surface keeps its look (README question 2). */
function StatusChip({ label, status }: { label: string; status: string }) {
  const tone = STATUS_TONE[status] ?? { bg: neutral.sunken, fg: neutral.slate }
  return <span style={{ fontSize: 11.5, fontWeight: 600, borderRadius: radius.pill, padding: '3px 9px', whiteSpace: 'nowrap', background: tone.bg, color: tone.fg }}>{label}</span>
}
