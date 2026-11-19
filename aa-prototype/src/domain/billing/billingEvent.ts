/**
 * The billing event (catch-up Phase 39b; US-03.7.2, FT-03.7, DM-46): a
 * free-form way to invoice on a Procedure and its Contract, a charge or a
 * credit with a free-text description and an amount ex GST. It replaces the
 * billing line (US-03.3.6 Retired). Pure.
 *
 * The amount is typed and prices nothing: no Contract, rate, unit or Booking
 * total is read, so it is allowed on a fixed-price Procedure (US-05.2.5's
 * by-hand route; a reading) and is never `noEventRate`. A credit's sign is
 * its direction; the stored amount is always above zero.
 */

import { eventDateRefusal, typedAmountProblem, type EventPricing } from './prePostOpEvent'
import { roundToCents } from './money'

export type BillingEventDirection = 'charge' | 'credit'

export interface BillingEventInput {
  direction: BillingEventDirection
  description: string
  amount: number
  occurredOnISO: string
}

export type BillingEventRefusalCode = 'directionInvalid' | 'descriptionMissing' | 'descriptionTooLong' | 'amountInvalid' | 'dateInvalid' | 'dateBeforeProcedure' | 'dateAfterProcedure' | 'dateInFuture'

export interface BillingEventRefusal {
  code: BillingEventRefusalCode
  message: string
  field: 'direction' | 'description' | 'amount' | 'occurredOnISO'
}

export const BILLING_EVENT_DESCRIPTION_MAX = 120

/**
 * A billing event's own checks: a direction, a description of 1 to 120
 * characters, an amount above zero and below $100,000.00 ex GST, a date on or
 * after the List date and not after the later of today and the List date.
 * The party and the actor are 38b's `validateEventBase`. Null when valid.
 */
export function validateBillingEvent(input: BillingEventInput, ctx: { listDateISO: string; todayISO: string }): BillingEventRefusal | null {
  if (input.direction !== 'charge' && input.direction !== 'credit') {
    return { code: 'directionInvalid', message: 'Pick Charge or Credit.', field: 'direction' }
  }
  const text = input.description.trim()
  if (text === '') return { code: 'descriptionMissing', message: 'Say what this is for.', field: 'description' }
  if (text.length > BILLING_EVENT_DESCRIPTION_MAX) {
    return { code: 'descriptionTooLong', message: `Keep the description to ${BILLING_EVENT_DESCRIPTION_MAX} characters.`, field: 'description' }
  }
  if (typedAmountProblem(input.amount)) {
    return { code: 'amountInvalid', message: 'Type the amount in dollars and cents, above $0.00 and under $100,000.00.', field: 'amount' }
  }
  const date = eventDateRefusal('onOrAfterList', input.occurredOnISO, ctx)
  if (date !== null) return { code: date.code, message: date.message, field: 'occurredOnISO' }
  return null
}

/** A billing event's price: the typed amount, negative for a credit. Refused `notInvoiced` when the tick is cleared. */
export function priceBillingEvent(event: {
  billable: boolean
  direction: BillingEventDirection
  amount: number
}): { kind: 'priced'; pricing: EventPricing } | { kind: 'refused'; code: 'notInvoiced'; message: string } {
  if (!event.billable) return { kind: 'refused', code: 'notInvoiced', message: 'This charge is not invoiced, so it has no price.' }
  const amount = roundToCents(event.amount)
  return { kind: 'priced', pricing: { basis: 'billingEvent', amount: event.direction === 'credit' ? -amount : amount } }
}
