/**
 * The Payments tab's runs table (build plan Phase 66; US-10.2.7, D107, D115): every payment run as a
 * card "Payment runs" with its count, this week's run and any staged run first, then the earlier
 * weeks newest first (docs/explorations/finances-section.html `#p-payments`). A row opens the run's
 * own page, where the step stamps (closed, approved, scheduled) now live. Paged at 20.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CountBadge, Pill, TextAction } from '../../../../shared/ui'
import { ClickableRow, TableShell, Td, Th } from '../../../../shared/table'
import { formatCurrency, shortDay } from '../../../../shared/format'
import { cycleFor, cycleLabel, cycleRangeLabel } from '../../../../domain/billing/paymentCycle'
import { paymentCycleSettingsOf, runsNewestFirst, useAppStore } from '../../../../store'
import { Pager, pageOf } from '../../components/Pager'
import { RUN_STATUS } from '../../components/PaymentCyclePanel'
import { paymentRunPath } from './financePaths'

/** Runs per page. */
const PAGE_SIZE = 20

/** Sum in cents, so a run's figures never pick up floating-point pennies. */
function sumCents(values: readonly number[]): number {
  return values.reduce((n, v) => n + Math.round(v * 100), 0) / 100
}

export function PaymentRunsTable() {
  const navigate = useNavigate()
  const billing = useAppStore((s) => s.billing)
  const clockToday = useAppStore((s) => s.clock.todayISO)
  const settings = useAppStore((s) => paymentCycleSettingsOf(s))
  const thisWeek = cycleFor(clockToday, settings).cycleId
  // One pass over the runs: the order, then each run's figures from its per-anaesthetist totals.
  const rows = useMemo(() => {
    const runs = runsNewestFirst({ billing })
    const ordered = [...runs.filter((r) => r.cycleId >= thisWeek), ...runs.filter((r) => r.cycleId < thisWeek)]
    return ordered.map((run) => ({
      run,
      anaesthetists: run.byAnaesthetist.length,
      bctis: run.byAnaesthetist.reduce((n, t) => n + t.bctiCount, 0),
      netted: sumCents(run.byAnaesthetist.map((t) => t.netted)),
      paidOut: sumCents(run.byAnaesthetist.map((t) => t.net)),
    }))
  }, [billing, thisWeek])
  // The page belongs to the run count it was picked on: a new run puts the table back on page 1.
  const [paged, setPaged] = useState({ count: rows.length, page: 1 })
  const page = paged.count === rows.length ? paged.page : 1
  const pageRows = useMemo(() => pageOf(rows, PAGE_SIZE, page), [rows, page])
  if (rows.length === 0) return null
  return (
    <Card padding="panel" title={<>Payment runs <CountBadge count={rows.length} hideAtZero={false} mono srNoun="runs" /></>} shot="payables-runs">
      <TableShell
        nested
        label="Payment runs"
        density="dense"
        {...(rows.length > PAGE_SIZE ? { footer: <Pager total={rows.length} size={PAGE_SIZE} page={page} onPage={(p) => setPaged({ count: rows.length, page: p })} shot="payables-runs-pager" /> } : {})}
      >
        <thead>
          <tr>
            <Th>Run</Th>
            <Th>Dates</Th>
            <Th align="right">Anaesthetists</Th>
            <Th align="right">BCTIs</Th>
            <Th align="right" nowrap>Negatives netted</Th>
            <Th align="right" nowrap>Paid out</Th>
            <Th>Status</Th>
            <Th nowrap>Paid on</Th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map(({ run: r, anaesthetists, bctis, netted, paidOut }) => (
            <ClickableRow key={r.id} onOpen={() => navigate(paymentRunPath(r.id))} data-run-id={r.id} data-run-status={r.status}>
              <Td mono nowrap>
                <TextAction size="sm" flush to={paymentRunPath(r.id)}>{cycleLabel(r)}</TextAction>
              </Td>
              <Td mono nowrap>{cycleRangeLabel(r)}</Td>
              <Td mono align="right">{anaesthetists}</Td>
              <Td mono align="right">{bctis}</Td>
              <Td mono align="right" nowrap>{netted > 0 ? formatCurrency(-netted) : formatCurrency(0)}</Td>
              <Td mono align="right" nowrap>{formatCurrency(paidOut)}</Td>
              <Td nowrap>
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <Pill tone={RUN_STATUS[r.status].tone} size="sm">{RUN_STATUS[r.status].label}</Pill>
                  {r.seeded === true && <Pill size="sm" variant="outline">Seeded</Pill>}
                  {r.kind === 'staged' && <Pill size="sm" variant="outline">Staged</Pill>}
                </span>
              </Td>
              <Td mono nowrap>{r.paidAtISO !== undefined ? shortDay(r.paidAtISO.slice(0, 10)) : ''}</Td>
            </ClickableRow>
          ))}
        </tbody>
      </TableShell>
    </Card>
  )
}
