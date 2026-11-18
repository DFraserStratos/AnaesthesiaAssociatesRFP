/**
 * Prepayment outstanding (US-06.3.2, "No block"; D5 / OQ-57), escalating by
 * date (catch-up Phase 27).
 *
 * One finding per payer group (its key carries the payer's identity, so
 * clearing one payer's never hides another's) while that group awaits
 * approval, is unpaid or is part paid and the List is not AUTHORISED: mild
 * from `mildWithinDays` (7) before the procedure, strong from
 * `strongWithinDays` (2), the day itself and a passed date included; nothing
 * further out. A cleared mild warning re-opens when strong (15a's routine).
 * The same rule raises one mild office finding for a prepayment sent and then
 * no longer needed, or sent before a change, whatever the date: the interim
 * until 41's cancellation handling (US-06.3.7, D67). Nothing ever blocks.
 *
 * OQ-134 (answered 18 November, D80): this rule and 40's patient balance
 * alert are two rules shown side by side on the Booking, each in one place.
 */

import { daysBetween } from '../../dateDays'
import { formatMoney } from '../../billing/money'
import type { WarningFinding, WarningPrepaymentGroup, WarningRule } from '../types'

export const prepaymentAwaitingText = (amount: number | null, payer: string): string =>
  amount === null
    ? `Prepayment from ${payer} is awaiting approval on Invoices and has not been sent. Type an amount above zero first.`
    : `Prepayment of ${formatMoney(amount)} from ${payer} is awaiting approval on Invoices and has not been sent.`
export const prepaymentUnpaidText = (number: string, payer: string): string =>
  `Prepayment invoice ${number} to ${payer} unpaid. Check with the payer before surgery starts.`
export const prepaymentPartPaidText = (payer: string, received: number, total: number): string =>
  `Prepayment part paid by ${payer}, ${formatMoney(received)} of ${formatMoney(total)} received. Check with the payer before surgery starts.`
export const prepaymentNotNeededText = (number: string): string =>
  `Prepayment invoice ${number} was sent, but this Booking no longer needs prepayment. Settle it by hand for now.`
export const prepaymentChangedText = (number: string): string =>
  `Prepayment invoice ${number} was sent before this Booking changed. Check the amount; settle any difference by hand.`

function textFor(g: WarningPrepaymentGroup): string | undefined {
  const number = g.invoiceNumber ?? ''
  switch (g.status) {
    case 'awaitingApproval':
      return prepaymentAwaitingText(g.amount, g.payerName)
    case 'unpaid':
      return prepaymentUnpaidText(number, g.payerName)
    case 'partPaid':
      return prepaymentPartPaidText(g.payerName, g.receivedTotal, g.invoicedTotal)
    case 'notNeeded':
      return prepaymentNotNeededText(number)
    case 'changedAfterSending':
      return prepaymentChangedText(number)
    default:
      return undefined
  }
}

export const prepaymentUnpaidRule: WarningRule = {
  id: 'prepaymentUnpaid',
  label: 'Prepayment outstanding',
  defaultParams: { mildWithinDays: 7, strongWithinDays: 2 },
  evaluate(facts, params) {
    if (facts.list.state === 'AUTHORISED') return []
    const groups = facts.prepaymentGroups ?? []
    const daysToGo = daysBetween(facts.todayISO, facts.list.dateISO)
    const out: WarningFinding[] = []
    for (const g of groups) {
      const text = textFor(g)
      if (text === undefined) continue
      // The payer's identity, plus the invoice once issued (a payer can have a sent invoice and a pending group).
      const scope = g.invoiceNumber !== undefined ? `${g.payerKey}:${g.invoiceNumber}` : g.payerKey
      if (g.status === 'notNeeded' || g.status === 'changedAfterSending') {
        out.push({ kind: 'beforeProcedure', strength: 'mild', text, scope })
        continue
      }
      if (daysToGo <= (params['strongWithinDays'] ?? 2)) out.push({ kind: 'beforeProcedure', strength: 'strong', text, scope })
      else if (daysToGo <= (params['mildWithinDays'] ?? 7)) out.push({ kind: 'beforeProcedure', strength: 'mild', text, scope })
    }
    return out
  },
}
