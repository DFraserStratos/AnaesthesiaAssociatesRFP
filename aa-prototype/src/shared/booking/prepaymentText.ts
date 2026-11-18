/**
 * The words every prepayment surface uses (catch-up Phase 27; US-06.3.2,
 * US-03.1.8): the Booking panel, the units row, the admin rail card and the
 * Invoices strip read them from here, so a status reads the same everywhere.
 * Never "estimate", "deposit" or "Other price" (the amount is the Procedure's
 * price when its invoice is raised).
 */

import type { Contract, Procedure } from '../../domain/types'
import { inDisplayOrder } from '../../domain/billing/multiProcedure'
import type { PrepaidAmount, PrepaymentStatus } from '../../domain/billing/prepayment'
import type { PillTone } from '../ui/Pill'
import { formatMoney } from '../format'
import { NEEDS_PRICE_LABEL } from '../../domain/billing/priceRanges'

/** The panel's title for the Booking's least settled group. */
export function prepaymentTitle(status: PrepaymentStatus, money?: { received: number; total: number }): string {
  switch (status) {
    case 'awaitingApproval':
      return 'Pre-payment awaiting approval'
    case 'unpaid':
      return 'Pre-payment unpaid'
    case 'partPaid':
      return money !== undefined ? `Pre-payment part paid · ${formatMoney(money.received)} of ${formatMoney(money.total)} received` : 'Pre-payment part paid'
    case 'paid':
      return 'Pre-payment received'
    case 'notNeeded':
      return 'Pre-payment no longer needed'
    case 'changedAfterSending':
      return 'Pre-payment sent before a change'
  }
}

/** A status as a pill's words. */
export const PREPAYMENT_STATUS_LABEL: Record<PrepaymentStatus, string> = {
  awaitingApproval: 'Awaiting approval',
  unpaid: 'Unpaid',
  partPaid: 'Part paid',
  paid: 'Paid',
  notNeeded: 'No longer needed',
  changedAfterSending: 'Sent before a change',
}

/** A status in running text ("Prepaid $1,200.00 · paid"). */
export function prepaymentStatusWords(status: PrepaymentStatus): string {
  return PREPAYMENT_STATUS_LABEL[status].toLowerCase()
}

/** Warning for anything still owed or needing the office; success once paid (Design Language tints). */
export function prepaymentTone(status: PrepaymentStatus): PillTone {
  return status === 'paid' ? 'success' : 'warning'
}

/** A prepaid Procedure with no amount yet (Prepaid · Fixed price, nothing typed): 24's "Needs a price". */
export const NO_PRICE_YET = NEEDS_PRICE_LABEL

/** A line's amount as money, or the words for a typed amount still missing. */
export function prepaidAmountText(amount: PrepaidAmount): string {
  return amount.kind === 'priced' ? formatMoney(amount.amount) : NO_PRICE_YET
}

/**
 * The Contract a prepaid Procedure is on, as the panel names it: "Rhinoplasty ·
 * Dr M. Souter" (the Contract and its holder), or "No contract · Fixed price,
 * typed" for the Prepaid · Fixed price backstop with an amount typed.
 */
export function prepaidContractText(contract: Pick<Contract, 'name' | 'systemRole'> | undefined, holderName: string | undefined): string {
  if (contract === undefined) return 'No contract'
  if (contract.systemRole === 'openPriceFallback') return 'No contract · Fixed price, typed'
  return holderName !== undefined ? `${contract.name} · ${holderName}` : contract.name
}

/** "In 3 days", "Tomorrow", "Today", "2 days ago": the rail card's countdown. */
export function daysToGoText(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `In ${days} days` : `${-days} days ago`
}

/** A Procedure's number on its Booking in display order (the primary is 1): the label's fallback when it has no text. */
export function displayNumberOf(procedures: Readonly<Record<string, Procedure>>, procedure: Procedure): number {
  const onBooking = Object.values(procedures)
    .filter((p) => p.bookingId === procedure.bookingId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return inDisplayOrder(onBooking).findIndex((p) => p.id === procedure.id) + 1
}
