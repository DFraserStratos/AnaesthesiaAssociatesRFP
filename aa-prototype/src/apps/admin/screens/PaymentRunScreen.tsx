/**
 * A payment run's record (catch-up Phase 39a; US-10.2.7, US-10.2.6,
 * US-10.2.5): `/admin/billing/payment-runs/:runId`. The run's week and steps
 * (who and when), the ledger at close, the anomalies and how each was
 * resolved, the held lines with the week they rolled into, the
 * per-anaesthetist totals with each remittance advice, the exclusions, and
 * the payment schedule the office sent the accountant (printable). And one
 * anaesthetist's remittance advice:
 * `/admin/billing/payment-runs/:runId/remittance/:anaesthetistId`.
 */

import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, DefList, DefRow, EmptyState, PageHeader, Pill } from '../../../shared/ui'
import { Td, Th, TableShell } from '../../../shared/table'
import { drSurname, formatCurrency, formatSignedCurrency, plural } from '../../../shared/format'
import { neutral, radius } from '../../../theme/tokens'
import { cycleLabel, cycleRangeLabel } from '../../../domain/billing/paymentCycle'
import { ANOMALY_LABEL, paymentScheduleFor, remittanceAdviceFor, useAppStore } from '../../../store'
import { RemittanceAdviceDocument } from '../../../shared/billing/RemittanceAdviceDocument'
import { RUN_STATUS, stampOf } from '../components/PaymentCyclePanel'

const EXCLUSION_LABEL = { heldInHoldingAccount: 'Held in the AA Holding account (never paid by a run)' } as const

function Trail({ items }: { items: { label: string; to?: string }[] }) {
  const navigate = useNavigate()
  return (
    <div style={{ fontSize: 13, color: neutral.mist }}>
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: neutral.lineStrong }}> / </span>}
          {it.to !== undefined ? (
            <button className="aa-ctl" type="button" onClick={() => navigate(it.to!)} style={{ border: 'none', background: 'none', padding: 0, color: neutral.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{it.label}</button>
          ) : (
            <span className="mono">{it.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}

export function PaymentRunScreen({ runId }: { runId: string }) {
  const state = useAppStore((s) => s)
  const run = state.billing.payablesRuns[runId]
  if (run === undefined) return null
  const name = (id: string) => drSurname(state.masters.anaesthetists[id]?.name ?? id)
  const schedule = run.approvedAtISO !== undefined ? paymentScheduleFor(state, runId) : undefined
  const held = run.lines.filter((l) => l.heldOut !== undefined)
  const rolledInto = Object.values(state.billing.payablesRuns).find((r) => r.status !== 'superseded' && r.lines.some((l) => l.rolledFromRunId === run.id))
  const step = (at: string | undefined, by: { who: string } | undefined) => (at !== undefined ? `${stampOf(at)}${by !== undefined ? ` · ${by.who}` : ''}` : 'Not yet')
  const paidOut = run.byAnaesthetist.reduce((n, t) => n + Math.round(t.net * 100), 0) / 100

  return (
    <div data-testid="payment-run-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080 }}>
      <Trail items={[{ label: 'Billing monitor', to: '/admin/billing' }, { label: run.id }]} />
      <PageHeader size="admin" title={`Payment run · ${cycleLabel(run)}`} sub={`${cycleRangeLabel(run)} · ${run.kind === 'staged' ? 'A one-line staged run (demo payout)' : 'The weekly payment cycle'}`} />

      <Card shot="payables-run-detail" title="The run" action={<span style={{ display: 'inline-flex', gap: 6 }}><Pill tone={RUN_STATUS[run.status].tone} size="sm">{RUN_STATUS[run.status].label}</Pill>{run.seeded === true && <Pill size="sm" variant="outline">Seeded</Pill>}{run.kind === 'staged' && <Pill size="sm" variant="outline">Staged</Pill>}</span>}>
        <DefList>
          <DefRow label="Run" labelWidth={170} mono>{run.id}</DefRow>
          <DefRow label="Closed" labelWidth={170} mono>{step(run.closedAtISO, run.closedBy)}</DefRow>
          <DefRow label="Approved" labelWidth={170} mono>{step(run.approvedAtISO, run.approvedBy)}</DefRow>
          <DefRow label="Schedule sent" labelWidth={170} mono>{step(run.scheduledAtISO, run.scheduledBy)}</DefRow>
          <DefRow label="Sent to Xero" labelWidth={170} mono>{step(run.sentToXeroAtISO, undefined)}</DefRow>
          <DefRow label="Paid" labelWidth={170} mono>{step(run.paidAtISO, undefined)}</DefRow>
          {run.supersededBy !== undefined && (
            <DefRow label="Superseded by">
              <Link to={`/admin/billing/payment-runs/${run.supersededBy}`} className="mono" style={{ color: neutral.ink }}>{run.supersededBy}</Link>
            </DefRow>
          )}
        </DefList>
      </Card>

      <Card title="Ledger at close" shot="payables-run-snapshot">
        <DefList>
          <DefRow label="Receipts held" labelWidth={170} mono>{formatCurrency(run.snapshot.receiptsHeld)}</DefRow>
          <DefRow label="Payables due" labelWidth={170} mono>{formatCurrency(run.snapshot.payablesDue)}</DefRow>
          <DefRow label="Negative invoices to net" labelWidth={170} mono>{formatCurrency(run.snapshot.recoveryDue)}</DefRow>
          <DefRow label="Imbalance" labelWidth={170} mono>{formatCurrency(run.snapshot.imbalance)}</DefRow>
        </DefList>
      </Card>

      <Card title="Totals by anaesthetist" shot="payables-run-totals">
        {run.byAnaesthetist.length === 0 ? (
          <EmptyState variant="inline">Every line was held out of this run.</EmptyState>
        ) : (
          <TableShell label="Totals by anaesthetist" density="compact" nested>
            <thead>
              <tr>
                <Th>Anaesthetist</Th>
                <Th align="right">BCTIs</Th>
                <Th align="right">Positives</Th>
                <Th align="right">Negatives netted</Th>
                <Th align="right">Net</Th>
                <Th align="right">Still to net</Th>
                <Th>Remittance advice</Th>
              </tr>
            </thead>
            <tbody>
              {run.byAnaesthetist.map((t) => (
                <tr key={t.anaesthetistId} data-anaesthetist-id={t.anaesthetistId}>
                  <Td>{name(t.anaesthetistId)}</Td>
                  <Td mono align="right">{t.bctiCount}</Td>
                  <Td mono align="right">{formatCurrency(t.positives)}</Td>
                  <Td mono align="right">{t.netted > 0 ? formatSignedCurrency(-t.netted) : formatCurrency(0)}</Td>
                  <Td mono align="right">{formatCurrency(t.net)}</Td>
                  <Td mono align="right">{t.remainingToNet > 0 ? formatSignedCurrency(-t.remainingToNet) : ''}</Td>
                  <Td>
                    {run.approvedAtISO !== undefined ? (
                      <Link to={`/admin/billing/payment-runs/${run.id}/remittance/${t.anaesthetistId}`} data-shot="payables-run-remittance-link" style={{ color: neutral.ink }}>Remittance advice</Link>
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
                  <Link to={`/admin/billing/payment-runs/${rolledInto.id}`} className="mono" style={{ color: neutral.ink }}>{rolledInto.id}</Link>
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

      {run.excluded.length > 0 && (
        <Card title="Kept out of every run">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            {run.excluded.map((e) => (
              <li key={e.pairId}>
                <span className="mono">{state.billing.ledger[e.pairId]?.receivable.number ?? e.pairId}</span>
                {` · `}
                <span className="mono">{formatCurrency(e.amount)}</span>
                <span style={{ color: neutral.slate }}>{` · ${EXCLUSION_LABEL[e.reason]}`}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {schedule !== undefined && (
        <Card
          title="Payment schedule"
          shot="payment-schedule"
          action={
            <span className="aa-print-hide"><Button variant="outline" size="compact" onClick={() => window.print()} shot="payment-schedule-print">
              Print
            </Button></span>
          }
        >
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
                    <Td mono align="right">{r.netted > 0 ? formatSignedCurrency(-r.netted) : formatCurrency(0)}</Td>
                    <Td mono align="right" style={{ fontWeight: 650 }}>{formatCurrency(r.net)}</Td>
                    <Td mono>{r.destinationMasked ?? 'No bank account on file'}</Td>
                  </tr>
                ))}
                <tr>
                  <Td style={{ fontWeight: 650 }}>Total</Td>
                  <Td mono align="right">{schedule.bctiCount}</Td>
                  <Td mono align="right">{formatCurrency(schedule.positives)}</Td>
                  <Td mono align="right">{schedule.netted > 0 ? formatSignedCurrency(-schedule.netted) : formatCurrency(0)}</Td>
                  <Td mono align="right" style={{ fontWeight: 700 }}>{formatCurrency(schedule.total)}</Td>
                  <Td />
                </tr>
              </tbody>
            </TableShell>
            <div style={{ fontSize: 12.5, color: neutral.slate }}>{schedule.sentAtISO !== undefined ? `Sent to the accountant ${stampOf(schedule.sentAtISO)}` : 'Not yet sent to the accountant'}</div>
          </div>
        </Card>
      )}
      {schedule === undefined && <div style={{ fontSize: 13, color: neutral.slate }}>{`The payment schedule is drawn up once the week's BCTIs are approved. Planned net: ${formatCurrency(paidOut)}, nothing paid yet.`}</div>}
    </div>
  )
}

export function RemittanceAdviceScreen({ runId, anaesthetistId }: { runId: string; anaesthetistId: string }) {
  const state = useAppStore((s) => s)
  const advice = remittanceAdviceFor(state, runId, anaesthetistId)
  if (advice === undefined) return null
  return (
    <div data-testid="remittance-advice-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ width: '100%', maxWidth: 1048, margin: '0 auto' }}>
        <Trail items={[{ label: 'Billing monitor', to: '/admin/billing' }, { label: runId, to: `/admin/billing/payment-runs/${runId}` }, { label: drSurname(advice.anaesthetistName) }]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '760px 264px', alignItems: 'start', gap: 24, width: '100%', maxWidth: 1048, margin: '0 auto' }}>
        <div className="aa-invoice-doc aa-print-report" style={{ minWidth: 0, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.panel, padding: '36px 40px' }}>
          <RemittanceAdviceDocument advice={advice} />
        </div>
        <aside aria-label="Remittance advice information" style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 12, width: 264 }}>
          <Card title="Remittance advice" titleLevel={3}>
            <Button variant="outline" size="compact" onClick={() => window.print()} shot="remittance-print">Print</Button>
            <Link to={`/admin/billing/payment-runs/${runId}`} style={{ fontSize: 12.5, color: neutral.ink }}>{`Open ${advice.week}'s run`}</Link>
          </Card>
          <Card title="Xero" titleLevel={3} shot="remittance-xero">
            <span className="mono" style={{ fontSize: 12.5 }}>{advice.batchPaymentId !== undefined ? `Batch payment ${advice.batchPaymentId} · ${formatCurrency(advice.net)}` : advice.net > 0 ? 'Batch payment awaiting Xero' : 'No batch payment: the negatives absorbed the run'}</span>
            {advice.creditAllocated > 0 && <span className="mono" style={{ fontSize: 12.5 }}>{`Credit allocated ${formatCurrency(advice.creditAllocated)}`}</span>}
          </Card>
        </aside>
      </div>
    </div>
  )
}
