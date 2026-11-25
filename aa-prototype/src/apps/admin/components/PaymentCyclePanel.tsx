/**
 * The Finances Payments tab's payment cycle panel (catch-up Phase 39a; US-10.2.7,
 * US-10.2.6, US-10.2.5): the week's four steps on a compact step rail, what
 * is waiting for this week's run, the check day's anomalies and holds, the
 * approval, the schedule to the accountant and "Run payables in Xero" (the
 * accountant paying the schedule in Xero, badged Simulated Xero), then the
 * runs so far. Replaces 37's payables panel. Proposed product UI: only the
 * Xero step is badged. The demo clock never gates a step: each shows its
 * planned day from the setting and, once done, the actual stamp.
 */

import { Fragment, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, DisclosureButton, EmptyState, FormError, Notice, Pill, ResultLine, TextAction, TextField, type PillTone } from '../../../shared/ui'
import { Td, Th, TableShell } from '../../../shared/table'
import { DemoBadge } from '../../../shared/DemoBadge'
import { StepRail, type RailStep } from '../../../shared/contracts/railParts'
import { drSurname, formatCurrency, plural, shortDay, stampText } from '../../../shared/format'
import { neutral, radius } from '../../../theme/tokens'
import { financePath, paymentRunPath } from '../screens/finances/financePaths'
import { cycleFor, cycleLabel, cycleOfId, cycleRangeLabel, nextCycleId, plannedDayLabel, weekdayName, type PaymentCycle } from '../../../domain/billing/paymentCycle'
import type { CycleAnomaly, PayablesRun, PayablesRunLine, PayablesRunStatus, RunAnaesthetistTotal } from '../../../domain/types'
import {
  ANOMALY_LABEL,
  approveWeekBctis,
  closeWeek,
  holdOutOfRun,
  markAnomalyFixed,
  nextRunToPay,
  openCycleDraft,
  PAYMENT_CYCLE_COPY,
  paymentCycleSettingsOf,
  recloseWeek,
  releaseHold,
  runPayables,
  runsNewestFirst,
  runStaleness,
  sendPaymentSchedule,
  useAppStore,
  weekRunInProgress,
  destinationMaskedFor,
  type Actor,
} from '../../../store'

/** A run's status as a pill (Closed and Approved neutral, Scheduled and Paying warning, Paid success, Superseded neutral). */
export const RUN_STATUS: Record<PayablesRunStatus, { label: string; tone: PillTone }> = {
  closed: { label: 'Closed', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'warning' },
  paying: { label: 'Paying', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  superseded: { label: 'Superseded', tone: 'neutral' },
}

/** "Tue 21 Jul 10:04": a step's actual stamp. */
export function stampOf(iso: string | undefined): string {
  return iso === undefined ? '' : stampText(iso)
}

/** The slices the panel reads (never the whole store, so an unrelated write does not recompute the draft). */
function useCycleState() {
  const billing = useAppStore((s) => s.billing)
  const xero = useAppStore((s) => s.xero)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const clock = useAppStore((s) => s.clock)
  const appSettings = useAppStore((s) => s.appSettings)
  return useMemo(() => ({ billing, xero, masters, schedule, clock, appSettings }), [billing, xero, masters, schedule, clock, appSettings])
}

function useNames() {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  return (id: string) => drSurname(anaesthetists[id]?.name ?? id)
}

export function PaymentCyclePanel({ actor }: { actor: Actor }) {
  const navigate = useNavigate()
  const state = useCycleState()
  const name = useNames()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const settings = paymentCycleSettingsOf(state)
  const run = weekRunInProgress(state)
  const draft = useMemo(() => (run === undefined ? openCycleDraft(state) : undefined), [state, run])
  const cycle: PaymentCycle = run !== undefined ? cycleOfId(run.cycleId, settings) : draft!.cycle
  const stale = useMemo(() => (run !== undefined ? runStaleness(state, run) : null), [state, run])
  const toPay = useMemo(() => nextRunToPay(state), [state])

  function act(out: { ok: true } | { ok: false; message: string }, done?: string) {
    if (!out.ok) {
      setError(out.message)
      return
    }
    setError(null)
    if (done !== undefined) setMessage(done)
  }

  const closeRefusal = draft !== undefined && draft.lines.length === 0 ? PAYMENT_CYCLE_COPY.nothingToClose : null
  const openAnomalies = run?.anomalies.filter((a) => a.status === 'open') ?? []
  const approveRefusal = run === undefined || run.status !== 'closed' ? null : openAnomalies.length > 0 ? PAYMENT_CYCLE_COPY.anomaliesOpen : stale

  const steps: RailStep[] = [
    { n: 1, label: 'Close the week', done: run !== undefined, current: run === undefined, auto: false, ...(run !== undefined ? { value: `Closed ${shortDay(run.closedAtISO.slice(0, 10))} · planned ${shortDay(cycle.closeDateISO)}` } : {}), pendingValue: `Planned ${plannedDayLabel(cycle.closeDateISO)}` },
    {
      n: 2,
      label: `${weekdayName(settings.checkWeekday)} checks`,
      // The checks are done once no anomaly is open; approval is then the current step.
      done: run !== undefined && (run.status !== 'closed' || openAnomalies.length === 0),
      current: run?.status === 'closed' && openAnomalies.length > 0,
      auto: false,
      ...(run !== undefined && (run.status !== 'closed' || openAnomalies.length === 0) ? { value: run.anomalies.length === 0 ? 'No anomalies' : `${plural(run.anomalies.length, 'anomaly', 'anomalies')} sorted` } : {}),
      pendingValue: `Planned ${plannedDayLabel(cycle.checkDateISO)}`,
    },
    { n: 3, label: 'Approve BCTIs', done: run?.approvedAtISO !== undefined, current: run?.status === 'closed' && openAnomalies.length === 0, auto: false, ...(run?.approvedAtISO !== undefined ? { value: `Approved ${shortDay(run.approvedAtISO.slice(0, 10))}` } : {}), pendingValue: 'After the checks' },
    {
      n: 4,
      label: 'Send payment schedule',
      done: run?.scheduledAtISO !== undefined,
      current: run?.status === 'approved',
      auto: false,
      ...(run?.scheduledAtISO !== undefined ? { value: `Sent ${shortDay(run.scheduledAtISO.slice(0, 10))} · planned ${shortDay(cycle.scheduleDateISO)}` } : {}),
      pendingValue: `Planned ${plannedDayLabel(cycle.scheduleDateISO)}`,
    },
  ]

  function runInXero() {
    const target = nextRunToPay(useAppStore.getState())
    const out = runPayables(useAppStore, actor)
    if (!out.ok) return act(out)
    const r = out.value
    const paidRun = target !== undefined ? useAppStore.getState().billing.payablesRuns[target.id] : undefined
    const people = paidRun?.byAnaesthetist.filter((t) => t.net > 0).length ?? 0
    const negatives = paidRun?.nettings.length ?? 0
    const week = paidRun !== undefined ? cycleLabel(paidRun) : 'The run'
    const bctis = paidRun?.lines.filter((l) => l.heldOut === undefined).length ?? r.billsPaid
    const waiting = r.queued > 0 ? ` ${plural(r.queued, 'payment')} wait in the Xero sync queue.` : ''
    act(
      { ok: true },
      `${week} paid in Xero: ${plural(bctis, 'BCTI')}, ${negatives > 0 ? `${plural(negatives, 'negative invoice')} netted, ` : ''}${formatCurrency(r.totalPaid)} paid to ${plural(people, 'anaesthetist')}.${waiting}`,
    )
  }

  const runButtonReason = toPay === undefined ? PAYMENT_CYCLE_COPY.nothingScheduled : null

  return (
    <Card
      shot="payment-cycle"
      title={
        <span>
          {'Payment cycle · '}
          <span className="mono">{cycleLabel(cycle)}</span>
          {' · '}
          <span className="mono" style={{ fontWeight: 500, color: neutral.slate }}>{cycleRangeLabel(cycle)}</span>
        </span>
      }
      action={run !== undefined ? <Pill tone={RUN_STATUS[run.status].tone} size="sm" shot="payment-cycle-status">{RUN_STATUS[run.status].label}</Pill> : undefined}
    >
      <StepRail steps={steps} orientation="compact" label={`${cycleLabel(cycle)} payment cycle`} shotPrefix="payment-cycle-step" />

      {run === undefined && draft !== undefined && (
        <section data-shot="payables-run-draft" style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Waiting for this week's run">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>Waiting for this week's run</h3>
            {/* With nothing waiting the empty state below says why, so the disabled button carries no second copy of it. */}
            <Button variant="primary" size="compact" onClick={() => act(closeWeek(useAppStore, actor), `${cycleLabel(cycle)} closed. Sort out anything odd, then approve its BCTIs.`)} disabled={closeRefusal !== null} shot="payment-cycle-close">
              Close the week
            </Button>
          </div>
          {draft.lines.length === 0 ? (
            <EmptyState variant="inline">{PAYMENT_CYCLE_COPY.nothingToClose}</EmptyState>
          ) : (
            <TotalsTable totals={draft.byAnaesthetist} lines={draft.lines} name={name} destination={(id) => destinationMaskedFor(state, id)} previousLabel={(runId) => (state.billing.payablesRuns[runId] !== undefined ? cycleLabel(state.billing.payablesRuns[runId]!) : runId)} />
          )}
        </section>
      )}

      {run !== undefined && run.status === 'closed' && (
        <ChecksSection run={run} actor={actor} name={name} nextWeek={cycleLabel(cycleOfId(nextCycleId(run.cycleId, settings), settings))} onResult={act} />
      )}

      {run !== undefined && run.status !== 'closed' && (
        <TotalsTable totals={run.byAnaesthetist} lines={run.lines} name={name} destination={(id) => destinationMaskedFor(state, id)} previousLabel={(runId) => (state.billing.payablesRuns[runId] !== undefined ? cycleLabel(state.billing.payablesRuns[runId]!) : runId)} shot="payables-run-approved" />
      )}

      {stale !== null && run !== undefined && (
        <Notice tone="warning" shot="payment-cycle-stale">
          <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {stale}
            <Button variant="outline" size="compact" onClick={() => act(recloseWeek(useAppStore, actor, run.id), `${cycleLabel(run)} re-closed: the earlier run is superseded.`)} shot="payment-cycle-reclose">
              Re-close
            </Button>
          </span>
        </Notice>
      )}

      {run !== undefined && run.status === 'closed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="primary" size="compact" onClick={() => act(approveWeekBctis(useAppStore, actor, run.id), `Week ${run.isoWeek}'s BCTIs approved. Send the payment schedule to the accountant.`)} disabled={approveRefusal !== null} disabledReason={approveRefusal ?? undefined} shot="payment-cycle-approve">
            {`Approve week ${run.isoWeek}'s BCTIs`}
          </Button>
          <span style={{ fontSize: 12.5, color: neutral.slate }}>{PAYMENT_CYCLE_COPY.rule}</span>
        </div>
      )}
      {run !== undefined && run.status === 'approved' && (
        <div>
          <Button variant="primary" size="compact" onClick={() => act(sendPaymentSchedule(useAppStore, actor, run.id), `Payment schedule for ${cycleLabel(run)} sent to the accountant.`)} disabled={stale !== null} disabledReason={stale ?? undefined} shot="payment-cycle-send">
            Send payment schedule
          </Button>
        </div>
      )}

      <div data-shot="billing-payables-run" style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: `1px solid ${neutral.line}`, paddingTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <DemoBadge label="Simulated Xero" />
          <Button variant="outline" size="compact" onClick={runInXero} disabled={runButtonReason !== null} disabledReason={runButtonReason ?? undefined} shot="billing-run-payables-in-xero" style={{ whiteSpace: 'nowrap' }}>
            Run payables in Xero
          </Button>
        </div>
        <span style={{ fontSize: 12.5, color: neutral.slate }}>
          The accountant pays the schedule in Xero. The Billing Engine records each payment when Xero reports it, by webhook or at the daily poll.
        </span>
      </div>

      <RunsList />

      <div>
        <TextAction size="sm" flush shot="billing-open-ledger" onClick={() => navigate(financePath('ledger'))}>Open the ledger</TextAction>
      </div>
      <ResultLine line={message} onDismiss={() => setMessage(null)} shot="billing-payables-result" />
      <FormError message={error} />
    </Card>
  )
}

/** Per anaesthetist: BCTIs, positives, negatives netted, net and (only where a negative exceeds the positives) what is still to net; expandable to the lines. */
function TotalsTable({
  totals,
  lines,
  name,
  destination,
  previousLabel,
  shot,
  renderLineAction,
}: {
  totals: readonly RunAnaesthetistTotal[]
  lines: readonly PayablesRunLine[]
  name: (id: string) => string
  destination: (id: string) => string | null
  previousLabel: (runId: string) => string
  shot?: string
  renderLineAction?: (line: PayablesRunLine) => React.ReactNode
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const anyStill = totals.some((t) => t.remainingToNet > 0)
  const cols = 6 + (anyStill ? 1 : 0)
  if (totals.length === 0) return <EmptyState variant="inline">Every line is held out of this run.</EmptyState>
  return (
    <div data-shot={shot}>
      <TableShell label="Payables in this week's run" density="compact" nested>
        <thead>
          <tr>
            <Th>Anaesthetist</Th>
            <Th align="right">BCTIs</Th>
            <Th align="right">Positives</Th>
            <Th align="right">Negatives netted</Th>
            <Th align="right">Net</Th>
            {anyStill && <Th align="right">Still to net</Th>}
            <Th>Paid to</Th>
          </tr>
        </thead>
        <tbody>
          {totals.map((t) => {
            const isOpen = open.has(t.anaesthetistId)
            const mine = lines.filter((l) => l.anaesthetistId === t.anaesthetistId && l.heldOut === undefined)
            const rolled = mine.find((l) => l.rolledFromRunId !== undefined)
            const dest = destination(t.anaesthetistId)
            return (
              <Fragment key={t.anaesthetistId}>
                <tr data-anaesthetist-id={t.anaesthetistId}>
                  <Td>
                    <DisclosureButton
                      open={isOpen}
                      size={14}
                      chevronTone="inherit"
                      onToggle={() => setOpen((s) => (s.has(t.anaesthetistId) ? new Set([...s].filter((x) => x !== t.anaesthetistId)) : new Set([...s, t.anaesthetistId])))}
                      style={{ color: neutral.ink }}
                    >
                      {name(t.anaesthetistId)}
                    </DisclosureButton>
                    {rolled !== undefined && (
                      <Pill size="sm" style={{ marginLeft: 8 }} shot="payment-cycle-rolled">{`Rolled from ${previousLabel(rolled.rolledFromRunId!)}`}</Pill>
                    )}
                  </Td>
                  <Td mono align="right">{t.bctiCount}</Td>
                  <Td mono align="right">{formatCurrency(t.positives)}</Td>
                  <Td mono align="right">{t.netted > 0 ? formatCurrency(-t.netted) : formatCurrency(0)}</Td>
                  <Td mono align="right" style={{ fontWeight: 650 }}>{formatCurrency(t.net)}</Td>
                  {anyStill && <Td mono align="right">{t.remainingToNet > 0 ? formatCurrency(-t.remainingToNet) : ''}</Td>}
                  <Td mono>{dest ?? <Pill tone="warning" size="sm" shot="payment-cycle-no-bank">No bank account</Pill>}</Td>
                </tr>
                {isOpen &&
                  mine.map((l) => (
                    <tr key={l.pairId} data-line-pair-id={l.pairId} style={{ background: neutral.sunken }}>
                      <Td style={{ paddingLeft: 28 }}>
                        <span className="mono">{l.billNumber}</span>
                        <span style={{ color: neutral.slate }}>{` · ${l.payerName} · `}</span>
                        <span className="mono" style={{ color: neutral.slate }}>{shortDay(l.serviceDateISO)}</span>
                        {l.rolledFromRunId !== undefined && <Pill size="sm" style={{ marginLeft: 8 }}>{`Rolled from ${previousLabel(l.rolledFromRunId)}`}</Pill>}
                      </Td>
                      <Td />
                      <Td mono align="right">{formatCurrency(l.amount)}</Td>
                      <Td colSpan={cols - 3} align="right">{renderLineAction?.(l)}</Td>
                    </tr>
                  ))}
              </Fragment>
            )
          })}
        </tbody>
      </TableShell>
    </div>
  )
}

/** The check day: each anomaly to hold out or mark fixed, the run's lines (any can be held with a reason), and what rolls into next week. */
function ChecksSection({ run, actor, name, nextWeek, onResult }: { run: PayablesRun; actor: Actor; name: (id: string) => string; nextWeek: string; onResult: (out: { ok: true } | { ok: false; message: string }, done?: string) => void }) {
  const state = useCycleState()
  const [holding, setHolding] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const held = run.lines.filter((l) => l.heldOut !== undefined)
  const billOf = (pairId: string) => run.lines.find((l) => l.pairId === pairId)?.billNumber ?? pairId
  return (
    <section data-shot="payment-cycle-anomalies" aria-label="Checks before payment" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>Checks before payment</h3>
      {run.anomalies.length === 0 ? (
        <div style={{ fontSize: 13, color: neutral.slate }}>The week reconciled to the bank download with nothing to sort out.</div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {run.anomalies.map((a) => (
            <AnomalyRow key={a.id} anomaly={a} name={name} bills={a.pairIds.map(billOf)} onHold={() => onResult(holdOutOfRun(useAppStore, actor, run.id, { anomalyId: a.id }), `Held out of ${cycleLabel(run)}: it rolls into ${nextWeek}.`)} onFix={() => onResult(markAnomalyFixed(useAppStore, actor, run.id, a.id), 'Marked fixed: its BCTIs stay in this run.')} />
          ))}
        </ul>
      )}
      <TotalsTable
        totals={run.byAnaesthetist}
        lines={run.lines}
        name={name}
        destination={(id) => destinationMaskedFor(state, id)}
        previousLabel={(runId) => (state.billing.payablesRuns[runId] !== undefined ? cycleLabel(state.billing.payablesRuns[runId]!) : runId)}
        renderLineAction={(l) =>
          holding === l.pairId ? (
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'flex-end', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <TextField label="Why hold it out" value={reason} onChange={setReason} size="compact" width={220} shot="payment-cycle-hold-reason" autoFocus />
              <Button
                variant="outline"
                size="compact"
                onClick={() => {
                  const out = holdOutOfRun(useAppStore, actor, run.id, { pairId: l.pairId, reason })
                  onResult(out, `${l.billNumber} held out of ${cycleLabel(run)}: it rolls into ${nextWeek}.`)
                  if (out.ok) {
                    setHolding(null)
                    setReason('')
                  }
                }}
                shot="payment-cycle-hold-line"
              >
                Hold out
              </Button>
              <TextAction size="sm" flush onClick={() => setHolding(null)}>Cancel</TextAction>
            </span>
          ) : (
            <TextAction size="sm" flush onClick={() => setHolding(l.pairId)} shot="payment-cycle-hold-open">Hold out of this run</TextAction>
          )
        }
      />
      {held.length > 0 && (
        <div data-shot="payment-cycle-held" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 650 }}>{`Rolls into ${nextWeek}`}</div>
          {held.map((l) => (
            <div key={l.pairId} data-held-pair-id={l.pairId} style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', fontSize: 13 }}>
              <span className="mono">{l.billNumber}</span>
              <span>{name(l.anaesthetistId)}</span>
              <span className="mono">{formatCurrency(l.amount)}</span>
              <span style={{ color: neutral.slate }}>{l.heldOut!.reason}</span>
              <TextAction size="sm" flush onClick={() => onResult(releaseHold(useAppStore, actor, run.id, l.pairId), `${l.billNumber} returned to ${cycleLabel(run)}.`)} shot="payment-cycle-release">Return to run</TextAction>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AnomalyRow({ anomaly, name, bills, onHold, onFix }: { anomaly: CycleAnomaly; name: (id: string) => string; bills: string[]; onHold: () => void; onFix: () => void }) {
  const resolved = anomaly.status !== 'open'
  return (
    <li data-anomaly-id={anomaly.id} data-anomaly-kind={anomaly.kind} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '10px 12px' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <Pill tone={resolved ? 'neutral' : 'warning'} size="sm">{ANOMALY_LABEL[anomaly.kind]}</Pill>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{name(anomaly.anaesthetistId)}</span>
          <span className="mono" style={{ fontSize: 12.5, color: neutral.slate }}>{bills.join(', ')}</span>
        </span>
        <span style={{ fontSize: 12.5, color: neutral.slate }}>{anomaly.detail}</span>
      </span>
      {resolved ? (
        <span style={{ fontSize: 12.5, color: neutral.slate }}>{anomaly.status === 'fixed' ? 'Marked fixed' : 'Held out of this run'}</span>
      ) : (
        <span style={{ display: 'inline-flex', gap: 8 }}>
          <Button variant="outline" size="compact" onClick={onHold} shot="payment-cycle-hold-anomaly">Hold out of this run</Button>
          <Button variant="outline" size="compact" onClick={onFix} shot="payment-cycle-mark-fixed">Mark fixed</Button>
        </span>
      )}
    </li>
  )
}

/** This week's run and staged runs, then the previous weeks', newest first, each opening its detail. */
function RunsList() {
  const billing = useAppStore((s) => s.billing)
  const clockToday = useAppStore((s) => s.clock.todayISO)
  const settings = useAppStore((s) => paymentCycleSettingsOf(s))
  const runs = useMemo(() => runsNewestFirst({ billing }), [billing])
  const thisWeek = cycleFor(clockToday, settings).cycleId
  if (runs.length === 0) return null
  const ordered = [...runs.filter((r) => r.cycleId >= thisWeek), ...runs.filter((r) => r.cycleId < thisWeek)]
  return (
    <section data-shot="payables-runs" aria-label="Payment runs" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>Payment runs</h3>
      <TableShell label="Payment runs" density="compact" nested>
        <thead>
          <tr>
            <Th>Week</Th>
            <Th>Run</Th>
            <Th>Closed</Th>
            <Th>Approved</Th>
            <Th>Scheduled</Th>
            <Th align="right">Net</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((r) => {
            const net = r.byAnaesthetist.reduce((n, t) => n + Math.round(t.net * 100), 0) / 100
            return (
              <tr key={r.id} data-run-id={r.id} data-run-status={r.status}>
                <Td mono>{cycleLabel(r)}</Td>
                <Td mono>
                  <Link to={paymentRunPath(r.id)} style={{ color: neutral.ink }}>{r.id}</Link>
                </Td>
                <Td mono>{`${stampOf(r.closedAtISO)} · ${r.closedBy.who}`}</Td>
                <Td mono>{r.approvedAtISO !== undefined ? stampOf(r.approvedAtISO) : ''}</Td>
                <Td mono>{r.scheduledAtISO !== undefined ? stampOf(r.scheduledAtISO) : ''}</Td>
                <Td mono align="right">{formatCurrency(net)}</Td>
                <Td>
                  <span style={{ display: 'inline-flex', gap: 6 }}>
                    <Pill tone={RUN_STATUS[r.status].tone} size="sm">{RUN_STATUS[r.status].label}</Pill>
                    {r.seeded === true && <Pill size="sm" variant="outline">Seeded</Pill>}
                    {r.kind === 'staged' && <Pill size="sm" variant="outline">Staged</Pill>}
                  </span>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </TableShell>
    </section>
  )
}
