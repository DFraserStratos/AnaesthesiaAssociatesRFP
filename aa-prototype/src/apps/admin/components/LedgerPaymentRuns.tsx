/**
 * An anaesthetist's account page rail (build plan Phase 65; US-10.2.7, US-10.2.5): what they still
 * have to net, with OQ-71's one caption (`StillToNetNotice`), and the payment runs they are paid in
 * as a `RailSection` (`LedgerPaymentRuns`): each run's week and their net over its status and day,
 * the first three with See all expanding in place. A row opens the run's page.
 */

import { Notice, RailSection, type RailSectionRow } from '../../../shared/ui'
import { formatCurrency, shortDay } from '../../../shared/format'
import { cycleLabel } from '../../../domain/billing/paymentCycle'
import type { PayablesRun } from '../../../domain/types'
import { PAYMENT_CYCLE_COPY, runsForAnaesthetist, stillToNetFor, useAppStore } from '../../../store'
import { RUN_STATUS } from './PaymentCyclePanel'
import { paymentRunPath } from '../screens/finances/financePaths'

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

/** A run's sub line: its status, the day it reached it when there is one ("Paid · Tue 24 Nov"), and Staged for a staged run. */
function runSub(r: PayablesRun): string {
  const when = r.paidAtISO ?? r.scheduledAtISO ?? r.approvedAtISO
  return [RUN_STATUS[r.status].label, ...(when !== undefined ? [shortDay(when)] : []), ...(r.kind === 'staged' ? ['Staged'] : [])].join(' · ')
}

/** The payment runs an anaesthetist is paid in, as the account page's rail section. */
export function LedgerPaymentRuns({ anaesthetistId }: { anaesthetistId: string }) {
  const billing = useAppStore((s) => s.billing)
  const rows: RailSectionRow[] = runsForAnaesthetist({ billing }, anaesthetistId).map((r) => {
    const t = r.byAnaesthetist.find((x) => x.anaesthetistId === anaesthetistId)
    return {
      key: r.id,
      to: paymentRunPath(r.id),
      title: `${cycleLabel(r)} · ${formatCurrency(t?.net ?? 0)}`,
      sub: runSub(r),
      data: { 'data-run-id': r.id },
    }
  })
  return (
    <RailSection
      title="Payment runs"
      countNoun="payment runs"
      rows={rows}
      limit={3}
      empty="Not paid in a payment run yet."
      shot="ledger-payment-runs"
    />
  )
}
