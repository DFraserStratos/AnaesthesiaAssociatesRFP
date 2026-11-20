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
import { formatMoney, stampText } from '../format'
import { NEEDS_PRICE_LABEL } from '../../domain/billing/priceRanges'
import type { PrepaymentHolding } from '../../store/prepaymentSelectors'

// ---------------------------------------------------------------------------
// The prepayment letter and its reminder (catch-up Phase 41; US-06.3.6)
// ---------------------------------------------------------------------------

/** The action on a sent, unpaid prepayment (office only). */
export const SEND_REMINDER_LABEL = 'Send prepayment reminder'

/** The anaesthetist's panel: who sends the letter. */
export const OFFICE_SENDS_LETTER = 'The AA office sends the prepayment letter.'

/** "21 Jul 10:04": when a reminder went (the panel's line, the invoice rail). */
export function reminderStampText(iso: string): string {
  return stampText(iso, { weekday: false }).replace(',', '')
}

/** "21 Jul": the day a reminder went (the Admin Day rail card). */
export function reminderDayText(iso: string): string {
  return stampText(iso.slice(0, 10), { weekday: false })
}

/** "Sent with the Standard prepayment letter": the letter names used by a set of sends, once each. */
export function sentWithLetterText(templateNames: readonly string[]): string | null {
  const names = [...new Set(templateNames)]
  if (names.length === 0) return null
  return `Sent with the ${names.join(' and the ')}.`
}

// ---------------------------------------------------------------------------
// Settled automatically: a cancellation or a Contract change (catch-up Phase 41; US-06.5.2, US-06.3.7)
// ---------------------------------------------------------------------------

/** "21 Jul": the day a refund was paid. */
export function settledDayText(iso: string): string {
  return stampText(iso.slice(0, 10), { weekday: false })
}

/** The words after the credit number on a Contract change's credit. */
export const CONTRACT_CHANGED_OFF_PREPAID = 'Contract changed off prepaid'

/** A refund's line in parts, so the amount and the day can be set in mono. */
export interface RefundLineParts {
  before: string
  amount: string
  between: string
  day: string
}

/**
 * "Refunded to the payer from the AA Holding account · $1,380.00 on 21 Jul" (a
 * cancellation's or a Contract change's refund), or "Late payment of $100.00
 * refunded on 22 Jul" (money that arrived after the credit note).
 */
export function refundLineParts(refund: { amount: number; paidAtISO: string; cause: 'cancelled' | 'latePayment' | 'contractChanged' }): RefundLineParts {
  const amount = formatMoney(refund.amount)
  const day = settledDayText(refund.paidAtISO)
  return refund.cause === 'latePayment'
    ? { before: 'Late payment of ', amount, between: ' refunded on ', day }
    : { before: 'Refunded to the payer from the AA Holding account · ', amount, between: ' on ', day }
}

/** The panel's title when all it shows is a settled prepayment. */
export function settledTitle(anyRefund: boolean): string {
  return anyRefund ? 'Pre-payment refunded' : 'Pre-payment credited'
}

/**
 * The office's Contract change on a Procedure a sent prepayment invoice covers
 * (US-06.3.7, D67), plainly and with no label.
 */
export function prepaidContractChangeText(invoiceNumber: string): string {
  return `Prepayment invoice ${invoiceNumber} was sent. Changing the Contract credits it (and refunds what was paid), then bills this procedure after it under the new Contract.`
}

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

/**
 * Where a prepayment's money is, in words (catch-up Phase 27a; US-06.5.1):
 * held by AA until the List is authorised, then transferred to whoever did it,
 * then paid. The anaesthetist reads "you"; the office reads the name.
 */
export function prepaymentHoldingText(holding: Pick<PrepaymentHolding, 'state'>, viewer: HoldingViewer): string {
  if (holding.state === 'held') return `Held by AA until the List is authorised`
  const who = viewer.you ? 'you' : (viewer.anaesthetistName ?? 'the anaesthetist')
  return holding.state === 'paidOut' ? `Paid to ${who}` : `Transferred to ${who}`
}

/** Who reads the holding line: the anaesthetist ("you") or the office (the anaesthetist's name). */
export interface HoldingViewer {
  you: boolean
  anaesthetistName?: string
}

/** The same, mid-sentence ("held by AA until the List is authorised"), for the given reader. */
export function prepaymentHoldingWords(holding: Pick<PrepaymentHolding, 'state'>, viewer: HoldingViewer): string {
  const text = prepaymentHoldingText(holding, viewer)
  return text.charAt(0).toLowerCase() + text.slice(1)
}

/** A Procedure's number on its Booking in display order (the primary is 1): the label's fallback when it has no text. */
export function displayNumberOf(procedures: Readonly<Record<string, Procedure>>, procedure: Procedure): number {
  const onBooking = Object.values(procedures)
    .filter((p) => p.bookingId === procedure.bookingId)
    .sort((a, b) => a.id.localeCompare(b.id))
  return inDisplayOrder(onBooking).findIndex((p) => p.id === procedure.id) + 1
}
