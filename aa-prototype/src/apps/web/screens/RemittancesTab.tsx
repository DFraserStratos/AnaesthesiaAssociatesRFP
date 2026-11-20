/**
 * Web Accounts · Remittances (catch-up Phase 39a; US-10.2.5: "the
 * anaesthetist sees the run washed up in their remittance advice"): the
 * persona's remittance advices, newest first (week, paid on, BCTIs, netted,
 * paid to you, status), each opening the same advice the office sees, read
 * only, in a sheet; and, when they have a negative invoice still to net, one
 * panel saying it nets against their next payment run.
 */

import { useMemo, useState } from 'react'
import { neutral, semantic } from '../../../theme/tokens'
import { remittanceAdviceFor, remittancesFor, stillToNetFor, useAppStore } from '../../../store'
import { formatCurrency, formatSignedCurrency, shortDay } from '../../../shared/format'
import { Card, EmptyState, Notice, Pill } from '../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../shared/table'
import { OverlayHeader, useSurface } from '../../../shared/surface'
import { RemittanceAdviceDocument } from '../../../shared/billing/RemittanceAdviceDocument'

export function StillToNetPanel({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const open = stillToNetFor({ billing }, anaesthetistId)
  if (open <= 0) return null
  return (
    <Notice tone="neutral" shot="web-still-to-net">
      <span>
        {'You have '}
        <span className="mono" style={{ fontWeight: 650 }}>{formatSignedCurrency(-open)}</span>
        {' still to net. It is netted against your next payment run.'}
      </span>
    </Notice>
  )
}

export function RemittancesTab({ anaesthetistId, focusRunId }: { anaesthetistId: string; focusRunId?: string }) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const rows = useMemo(() => remittancesFor({ billing, masters }, anaesthetistId), [billing, masters, anaesthetistId])
  const [openRun, setOpenRun] = useState<string | null>(null)
  const advice = openRun !== null ? remittanceAdviceFor({ billing, masters }, openRun, anaesthetistId) : undefined
  const { Overlay } = useSurface()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StillToNetPanel anaesthetistId={anaesthetistId} />
      <Card padding="panel" flush shot="web-remittances">
        <div style={{ padding: '16px 20px 0', fontSize: 12, lineHeight: 1.5, color: neutral.mist }}>
          Payments to you run weekly, each named by its week. Each run leaves a remittance advice: the BCTIs it paid, any negative invoice netted against them, and what was paid to you.
        </div>
        <TableShell label="Remittance advices" bare minWidth={760}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${neutral.line}` }}>
              <Th>Week</Th>
              <Th>Paid on</Th>
              <Th align="right">BCTIs</Th>
              <Th align="right">Netted</Th>
              <Th align="right">Paid to you</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState style={{ padding: '28px 20px', textAlign: 'center' }}>No payment runs have paid you yet.</EmptyState>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <ClickableRow
                  key={r.runId}
                  onOpen={() => setOpenRun(r.runId)}
                  data-run-id={r.runId}
                  data-testid={`remittance-row-${r.runId}`}
                  data-focused={r.runId === focusRunId ? 'true' : undefined}
                  style={r.runId === focusRunId ? { background: semantic.success.tint, boxShadow: `inset 3px 0 0 ${semantic.success.solid}` } : undefined}
                >
                  <Td mono nowrap>{r.week}</Td>
                  <Td mono nowrap>{r.paidOnISO !== undefined && r.status === 'paid' ? shortDay(r.paidOnISO.slice(0, 10)) : 'Awaiting Xero'}</Td>
                  <Td mono align="right">{r.bctis}</Td>
                  <Td mono align="right">{r.netted > 0 ? formatSignedCurrency(-r.netted) : formatCurrency(0)}</Td>
                  <Td mono align="right" bold>{formatCurrency(r.net)}</Td>
                  <Td>
                    <Pill size="lg" tone={r.status === 'paid' ? 'success' : 'warning'}>{r.status === 'paid' ? 'Paid' : 'Awaiting Xero'}</Pill>
                  </Td>
                </ClickableRow>
              ))
            )}
          </tbody>
        </TableShell>
      </Card>
      <Overlay open={advice !== undefined} onClose={() => setOpenRun(null)}>
        {advice !== undefined && (
          <div data-shot="web-remittance-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 720, maxWidth: '100%' }}>
            <OverlayHeader title={`Remittance advice · ${advice.week}`} />
            <RemittanceAdviceDocument advice={advice} shot="web-remittance-advice" />
          </div>
        )}
      </Overlay>
    </div>
  )
}
