/**
 * A payment run's record (catch-up Phase 39a; build plan Phase 66, D107, D114, D115; US-10.2.7,
 * US-10.2.6, US-10.2.5): `/admin/finances/payments/:runId`, under Finances' Payments tab, on the
 * record pattern. The header holds the week, the run id and status, one summary line (dates, when it
 * was paid, how many anaesthetists, the total) and Download schedule (the payment schedule's print,
 * once the BCTIs are approved); under it the cycle's four steps, the same `paymentCycleSteps` the
 * Payments tab's cycle card shows. The main column: the per-anaesthetist totals with each remittance
 * advice, the checks and held lines, and the payment schedule the office sent the accountant. The
 * rail: the run's stamps, the ledger at close, the exclusions and the run's History. And one
 * anaesthetist's remittance advice: `/admin/finances/payments/:runId/remittance/:anaesthetistId`.
 */

import { useMemo, useState } from 'react'
import { Button, Card, DefList, DefRow, EmptyState, Pill, TextAction } from '../../../shared/ui'
import { Td, Th, TableShell } from '../../../shared/table'
import { StepRail } from '../../../shared/contracts/railParts'
import { drSurname, formatCurrency, plural, shortDay } from '../../../shared/format'
import { neutral } from '../../../theme/tokens'
import { cycleLabel, cycleOfId, cycleRangeLabel } from '../../../domain/billing/paymentCycle'
import { ANOMALY_LABEL, paymentCycleSettingsOf, paymentScheduleFor, remittanceAdviceFor, useAppStore } from '../../../store'
import { RemittanceAdviceDocument } from '../../../shared/billing/RemittanceAdviceDocument'
import { RUN_STATUS, stampOf } from '../components/PaymentCyclePanel'
import { paymentCycleSteps } from '../components/paymentCycleSteps'
import { AdminPage, PageBody } from '../components/AdminPage'
import { IdChip, ProfilePage } from '../components/ProfileChrome'
import { Pager, pageOf } from '../components/Pager'
import { RecordHistoryCard } from '../components/RecordHistoryCard'
import { ADMIN_PROSE_WIDTH } from '../layout'
import { financePath, paymentRunPath, remittancePath } from './finances/financePaths'
import { DOCUMENT_DESK_STYLE, DOCUMENT_PAPER_STYLE, DOCUMENT_RAIL_STYLE } from '../components/documentDesk'

const EXCLUSION_LABEL = { heldInHoldingAccount: 'Held in the AA Holding account (never paid by a run)' } as const

/** Rows a page in the totals table (Phase 66: the admin `Pager` at 20 a page). */
const PAGE_SIZE = 20

/** The page frame's own column rhythm, so the step rail and the body keep the header's gap. */
const PAGE_STACK = { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 } as const

export function PaymentRunScreen({ runId }: { runId: string }) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const appSettings = useAppStore((s) => s.appSettings)
  const [page, setPage] = useState(1)
  const run = billing.payablesRuns[runId]
  const settings = useMemo(() => paymentCycleSettingsOf({ appSettings }), [appSettings])
  const approved = run?.approvedAtISO !== undefined
  const schedule = useMemo(() => (approved ? paymentScheduleFor({ billing, masters }, runId) : undefined), [approved, billing, masters, runId])
  if (run === undefined) return null

  const name = (id: string) => drSurname(masters.anaesthetists[id]?.name ?? id)
  const held = run.lines.filter((l) => l.heldOut !== undefined)
  const rolledInto = Object.values(billing.payablesRuns).find((r) => r.status !== 'superseded' && r.lines.some((l) => l.rolledFromRunId === run.id))
  const step = (at: string | undefined, by: { who: string } | undefined) => (at !== undefined ? `${stampOf(at)}${by !== undefined ? ` · ${by.who}` : ''}` : 'Not yet')
  const paidOut = run.byAnaesthetist.reduce((n, t) => n + Math.round(t.net * 100), 0) / 100
  const steps = paymentCycleSteps({ run, cycle: cycleOfId(run.cycleId, settings), settings })
  const stillToNet = run.byAnaesthetist.some((t) => t.remainingToNet > 0)
  const rows = pageOf(run.byAnaesthetist, PAGE_SIZE, page)
  const paid = run.paidAtISO !== undefined

  const summary = [
    cycleRangeLabel(run),
    ...(run.kind === 'staged' ? ['A one-line staged run (demo payout)'] : []),
    paid ? `paid ${shortDay(run.paidAtISO!)}` : 'not yet paid',
    plural(run.byAnaesthetist.length, 'anaesthetist'),
    paid ? formatCurrency(paidOut) : `${formatCurrency(paidOut)} to pay`,
  ].join(' · ')

  return (
    <ProfilePage
      shot="payment-run-page"
      back={{ label: 'Payments', to: financePath('payments') }}
      name={cycleLabel(run)}
      chip={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <IdChip label="Run" value={run.id} shot="payables-run-id" />
          <Pill tone={RUN_STATUS[run.status].tone} shot="payables-run-status">{RUN_STATUS[run.status].label}</Pill>
          {run.seeded === true && <Pill size="sm" variant="outline">Seeded</Pill>}
          {run.kind === 'staged' && <Pill size="sm" variant="outline">Staged</Pill>}
        </span>
      }
      sub={<span data-shot="payables-run-summary">{summary}</span>}
      {...(schedule !== undefined
        ? {
            action: (
              <span className="aa-print-hide">
                <Button variant="secondary" size="desktop" onClick={() => window.print()} shot="payment-schedule-print">
                  Download schedule
                </Button>
              </span>
            ),
          }
        : {})}
    >
      <div data-testid="payment-run-screen" style={PAGE_STACK}>
        <div className="aa-print-hide">
          <StepRail steps={steps} orientation="compact" label={`${cycleLabel(run)} payment cycle`} shotPrefix="payables-run-step" />
        </div>

        <PageBody
          railLabel={`${cycleLabel(run)}'s run`}
          rail={
            <>
              <Card title="The run" shot="payables-run-detail">
                <DefList>
                  <DefRow layout="stacked" label="Run id" mono>{run.id}</DefRow>
                  <DefRow layout="stacked" label="Closed" mono>{step(run.closedAtISO, run.closedBy)}</DefRow>
                  <DefRow layout="stacked" label="Approved" mono>{step(run.approvedAtISO, run.approvedBy)}</DefRow>
                  <DefRow layout="stacked" label="Schedule sent" mono>{step(run.scheduledAtISO, run.scheduledBy)}</DefRow>
                  <DefRow layout="stacked" label="Sent to Xero" mono>{step(run.sentToXeroAtISO, undefined)}</DefRow>
                  <DefRow layout="stacked" label="Paid" mono>{step(run.paidAtISO, undefined)}</DefRow>
                  {run.supersededBy !== undefined && (
                    <DefRow layout="stacked" label="Superseded by">
                      <TextAction size="sm" flush inline to={paymentRunPath(run.supersededBy)}>
                        <span className="mono">{run.supersededBy}</span>
                      </TextAction>
                    </DefRow>
                  )}
                </DefList>
              </Card>

              <Card title="Ledger at close" shot="payables-run-snapshot">
                <DefList>
                  <DefRow label="Receipts held" labelWidth={150} mono>{formatCurrency(run.snapshot.receiptsHeld)}</DefRow>
                  <DefRow label="Payables due" labelWidth={150} mono>{formatCurrency(run.snapshot.payablesDue)}</DefRow>
                  <DefRow label="Negative invoices to net" labelWidth={150} mono>{formatCurrency(run.snapshot.recoveryDue)}</DefRow>
                  <DefRow label="Imbalance" labelWidth={150} mono>{formatCurrency(run.snapshot.imbalance)}</DefRow>
                </DefList>
              </Card>

              {run.excluded.length > 0 && (
                <Card title="Kept out of every run">
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                    {run.excluded.map((e) => (
                      <li key={e.pairId}>
                        <span className="mono">{billing.ledger[e.pairId]?.receivable.number ?? e.pairId}</span>
                        {` · `}
                        <span className="mono">{formatCurrency(e.amount)}</span>
                        <span style={{ color: neutral.slate }}>{` · ${EXCLUSION_LABEL[e.reason]}`}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <RecordHistoryCard entityIds={[run.id]} name={`${cycleLabel(run)}'s run`} shot="payables-run-history" />
            </>
          }
        >
          <Card
            title="Totals by anaesthetist"
            shot="payables-run-totals"
            {...(run.byAnaesthetist.length > PAGE_SIZE
              ? { footer: <Pager total={run.byAnaesthetist.length} size={PAGE_SIZE} page={page} onPage={setPage} lead="Anaesthetists" shot="payables-run-totals-pager" /> }
              : {})}
          >
            {run.byAnaesthetist.length === 0 ? (
              <EmptyState variant="inline">Every line was held out of this run.</EmptyState>
            ) : (
              <TableShell label="Totals by anaesthetist" density="compact" nested>
                <thead>
                  <tr>
                    <Th>Anaesthetist</Th>
                    <Th align="right">BCTIs</Th>
                    <Th align="right">Netted</Th>
                    <Th align="right">{paid ? 'Paid' : 'To pay'}</Th>
                    {stillToNet && <Th align="right">Still to net</Th>}
                    <Th align="right">Remittance advice</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.anaesthetistId} data-anaesthetist-id={t.anaesthetistId}>
                      <Td>{name(t.anaesthetistId)}</Td>
                      <Td mono align="right">{t.bctiCount}</Td>
                      <Td mono align="right">{t.netted > 0 ? formatCurrency(-t.netted) : formatCurrency(0)}</Td>
                      <Td mono align="right">{formatCurrency(t.net)}</Td>
                      {stillToNet && <Td mono align="right">{t.remainingToNet > 0 ? formatCurrency(-t.remainingToNet) : ''}</Td>}
                      <Td align="right">
                        {approved ? (
                          <TextAction size="sm" flush to={remittancePath(run.id, t.anaesthetistId)} label={`Remittance advice for ${name(t.anaesthetistId)}`} shot="payables-run-remittance-link">
                            Remittance
                          </TextAction>
                        ) : (
                          <span style={{ color: neutral.slate }}>After approval</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </Card>

          <Card title="Checks before payment">
            {run.anomalies.length === 0 ? (
              <div style={{ fontSize: 13, color: neutral.slate }}>No anomalies: the week reconciled to the bank download.</div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                {run.anomalies.map((a) => (
                  <li key={a.id} data-anomaly-id={a.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <Pill size="sm" tone="neutral">{ANOMALY_LABEL[a.kind]}</Pill>
                    <span>{a.detail}</span>
                    <span style={{ color: neutral.slate }}>{a.status === 'fixed' ? `Marked fixed by ${a.resolvedBy ?? 'the office'}` : a.status === 'heldOut' ? `Held out by ${a.resolvedBy ?? 'the office'}` : 'Open'}</span>
                  </li>
                ))}
              </ul>
            )}
            {held.length > 0 && (
              <div data-shot="payables-run-held" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                <div style={{ fontWeight: 650 }}>
                  {rolledInto !== undefined ? (
                    <>
                      {`Rolled into ${cycleLabel(rolledInto)} · `}
                      <TextAction size="sm" flush inline to={paymentRunPath(rolledInto.id)}>
                        <span className="mono">{rolledInto.id}</span>
                      </TextAction>
                    </>
                  ) : (
                    'Rolls into next week'
                  )}
                </div>
                {held.map((l) => (
                  <span key={l.pairId}>
                    <span className="mono">{l.billNumber}</span>
                    {` · ${name(l.anaesthetistId)} · `}
                    <span className="mono">{formatCurrency(l.amount)}</span>
                    <span style={{ color: neutral.slate }}>{` · ${l.heldOut!.reason}`}</span>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {schedule !== undefined && (
            <Card title="Payment schedule" shot="payment-schedule">
              <div className="aa-print-report" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.04em' }}>{`PAYMENT SCHEDULE · ${schedule.week}`}</div>
                <div className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>{`${run.id} · ${cycleRangeLabel(run)} · ${plural(schedule.bctiCount, 'BCTI')}`}</div>
                <TableShell label="Payment schedule" density="compact" nested>
                  <thead>
                    <tr>
                      <Th>Anaesthetist</Th>
                      <Th align="right">BCTIs</Th>
                      <Th align="right">Positives</Th>
                      <Th align="right">Negatives netted</Th>
                      <Th align="right">Net</Th>
                      <Th>Account</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.rows.map((r) => (
                      <tr key={r.anaesthetistId}>
                        <Td>{drSurname(r.name)}</Td>
                        <Td mono align="right">{r.bctiCount}</Td>
                        <Td mono align="right">{formatCurrency(r.positives)}</Td>
                        <Td mono align="right">{r.netted > 0 ? formatCurrency(-r.netted) : formatCurrency(0)}</Td>
                        <Td mono align="right" style={{ fontWeight: 650 }}>{formatCurrency(r.net)}</Td>
                        <Td mono>{r.destinationMasked ?? 'No bank account on file'}</Td>
                      </tr>
                    ))}
                    <tr>
                      <Td style={{ fontWeight: 650 }}>Total</Td>
                      <Td mono align="right">{schedule.bctiCount}</Td>
                      <Td mono align="right">{formatCurrency(schedule.positives)}</Td>
                      <Td mono align="right">{schedule.netted > 0 ? formatCurrency(-schedule.netted) : formatCurrency(0)}</Td>
                      <Td mono align="right" style={{ fontWeight: 700 }}>{formatCurrency(schedule.total)}</Td>
                      <Td />
                    </tr>
                  </tbody>
                </TableShell>
                <div style={{ fontSize: 12.5, color: neutral.slate }}>{schedule.sentAtISO !== undefined ? `Sent to the accountant ${stampOf(schedule.sentAtISO)}` : 'Not yet sent to the accountant'}</div>
              </div>
            </Card>
          )}
          {schedule === undefined && <div style={{ fontSize: 13, color: neutral.slate, maxWidth: ADMIN_PROSE_WIDTH }}>{`The payment schedule is drawn up once the week's BCTIs are approved. Planned net: ${formatCurrency(paidOut)}, nothing paid yet.`}</div>}
        </PageBody>
      </div>
    </ProfilePage>
  )
}

export function RemittanceAdviceScreen({ runId, anaesthetistId }: { runId: string; anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const masters = useAppStore((s) => s.masters)
  const xero = useAppStore((s) => s.xero)
  const advice = useMemo(() => remittanceAdviceFor({ billing, masters, xero }, runId, anaesthetistId), [billing, masters, xero, runId, anaesthetistId])
  if (advice === undefined) return null
  const run = billing.payablesRuns[runId]
  return (
    <AdminPage
      mode="document"
      testId="remittance-advice-screen"
      back={{ label: `Payment run · ${run !== undefined ? cycleLabel(run) : runId}`, to: paymentRunPath(runId) }}
    >
      <div style={DOCUMENT_DESK_STYLE}>
        <div className="aa-invoice-doc aa-print-report" style={DOCUMENT_PAPER_STYLE}>
          <RemittanceAdviceDocument advice={advice} />
        </div>
        <aside aria-label="Remittance advice information" style={DOCUMENT_RAIL_STYLE}>
          <Card title="Remittance advice" titleLevel={3}>
            <Button variant="outline" size="compact" onClick={() => window.print()} shot="remittance-print">Print</Button>
            <TextAction size="sm" flush to={paymentRunPath(runId)}>{`Open ${advice.week}'s run`}</TextAction>
          </Card>
          <Card title="Xero" titleLevel={3} shot="remittance-xero">
            <span className="mono" style={{ fontSize: 12.5 }}>{advice.batchPaymentId !== undefined ? `Batch payment ${advice.batchPaymentId} · ${formatCurrency(advice.net)}` : advice.net > 0 ? 'Batch payment awaiting Xero' : 'No batch payment: the negatives absorbed the run'}</span>
            {advice.creditAllocated > 0 && <span className="mono" style={{ fontSize: 12.5 }}>{`Credit allocated ${formatCurrency(advice.creditAllocated)}`}</span>}
          </Card>
        </aside>
      </div>
    </AdminPage>
  )
}
