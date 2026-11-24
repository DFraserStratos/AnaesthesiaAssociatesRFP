/**
 * The Admin Ledger's per-anaesthetist payment runs (catch-up Phase 39a;
 * US-10.2.7, US-10.2.5): what they still have to net, with OQ-71's one
 * caption, and every run they are paid in by week, with the net, what it
 * netted, its status and its remittance advice.
 */

import { Link } from 'react-router-dom'
import { Card, EmptyState, Notice, Pill } from '../../../shared/ui'
import { Td, Th, TableShell } from '../../../shared/table'
import { formatCurrency } from '../../../shared/format'
import { neutral } from '../../../theme/tokens'
import { cycleLabel } from '../../../domain/billing/paymentCycle'
import { PAYMENT_CYCLE_COPY, runsForAnaesthetist, stillToNetFor, useAppStore } from '../../../store'
import { RUN_STATUS } from './PaymentCyclePanel'

/** The open negative invoices' total for one anaesthetist, with the caption (renders nothing when there is none). */
export function StillToNetNotice({ anaesthetistId, surname }: { anaesthetistId: string; surname: string }) {
  const billing = useAppStore((s) => s.billing)
  const open = stillToNetFor({ billing }, anaesthetistId)
  if (open <= 0) return null
  return (
    <Notice tone="neutral" shot="ledger-still-to-net">
      <span>
        {`${surname} has negative invoices to net: `}
        <span className="mono" style={{ fontWeight: 650 }}>{formatCurrency(-open)}</span>
        {`. ${PAYMENT_CYCLE_COPY.stillToNetCaption}`}
      </span>
    </Notice>
  )
}

export function LedgerPaymentRuns({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const runs = runsForAnaesthetist({ billing }, anaesthetistId)
  return (
    <Card title="Payment runs" shot="ledger-payment-runs">
      {runs.length === 0 ? (
        <EmptyState variant="inline">Not paid in a payment run yet.</EmptyState>
      ) : (
        <TableShell label="Payment runs" density="compact" nested>
          <thead>
            <tr>
              <Th>Week</Th>
              <Th>Run</Th>
              <Th align="right">BCTIs</Th>
              <Th align="right">Netted</Th>
              <Th align="right">Net</Th>
              <Th>Status</Th>
              <Th>Remittance advice</Th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => {
              const t = r.byAnaesthetist.find((x) => x.anaesthetistId === anaesthetistId)!
              return (
                <tr key={r.id} data-run-id={r.id}>
                  <Td mono>{cycleLabel(r)}</Td>
                  <Td mono>
                    <Link to={`/admin/billing/payment-runs/${r.id}`} style={{ color: neutral.ink }}>{r.id}</Link>
                  </Td>
                  <Td mono align="right">{t.bctiCount}</Td>
                  <Td mono align="right">{t.netted > 0 ? formatCurrency(-t.netted) : formatCurrency(0)}</Td>
                  <Td mono align="right">{formatCurrency(t.net)}</Td>
                  <Td>
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <Pill size="sm" tone={RUN_STATUS[r.status].tone}>{RUN_STATUS[r.status].label}</Pill>
                      {r.kind === 'staged' && <Pill size="sm" variant="outline">Staged</Pill>}
                    </span>
                  </Td>
                  <Td>
                    {r.approvedAtISO !== undefined ? (
                      <Link to={`/admin/billing/payment-runs/${r.id}/remittance/${anaesthetistId}`} style={{ color: neutral.ink }}>Open</Link>
                    ) : (
                      <span style={{ color: neutral.slate }}>After approval</span>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </TableShell>
      )}
    </Card>
  )
}
