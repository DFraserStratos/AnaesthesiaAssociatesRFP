/**
 * The weekly payment cycle's four steps as `StepRail` steps (build plan Phase 66; US-10.2.7): Close
 * the week, the check day, Approve BCTIs and Send payment schedule, each with its planned day until
 * it is done and its actual stamp after. One builder for the Payments tab's cycle card and a run's
 * own page, so the two never drift. Pure: the run (none while the week is still open), its cycle and
 * the cycle settings in, the steps out.
 */

import type { RailStep } from '../../../shared/contracts/railParts'
import { plural, shortDay } from '../../../shared/format'
import { plannedDayLabel, weekdayName, type PaymentCycle } from '../../../domain/billing/paymentCycle'
import type { PayablesRun, PaymentCycleSettings } from '../../../domain/types'

export function paymentCycleSteps({ run, cycle, settings }: { run: PayablesRun | undefined; cycle: PaymentCycle; settings: PaymentCycleSettings }): RailStep[] {
  const openAnomalies = run?.anomalies.filter((a) => a.status === 'open') ?? []
  // The checks are done once no anomaly is open; approval is then the current step.
  const checksDone = run !== undefined && (run.status !== 'closed' || openAnomalies.length === 0)
  return [
    { n: 1, label: 'Close the week', done: run !== undefined, current: run === undefined, auto: false, ...(run !== undefined ? { value: `Closed ${shortDay(run.closedAtISO.slice(0, 10))} · planned ${shortDay(cycle.closeDateISO)}` } : {}), pendingValue: `Planned ${plannedDayLabel(cycle.closeDateISO)}` },
    {
      n: 2,
      label: `${weekdayName(settings.checkWeekday)} checks`,
      done: checksDone,
      current: run?.status === 'closed' && openAnomalies.length > 0,
      auto: false,
      ...(run !== undefined && checksDone ? { value: run.anomalies.length === 0 ? 'No anomalies' : `${plural(run.anomalies.length, 'anomaly', 'anomalies')} sorted` } : {}),
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
}
