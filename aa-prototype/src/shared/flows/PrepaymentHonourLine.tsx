import { Notice } from '../ui/Notice'

/**
 * The honour-system line on a move of a prepaid Booking (catch-up Phase 32a,
 * shared from Phase 41; US-06.5.4, D38): a move changes nothing about the
 * prepayment, which keeps its agreed amount and is claimed by whoever does the
 * List once it is authorised. One home for both wordings:
 *
 * - `anaesthetist`: 32a's move-to-a-colleague sheet, naming the receiver;
 * - `office`: the office's Move booking and Reassign list steps, where the
 *   receiver is whoever the office assigns.
 *
 * A neutral note (U3's `Notice`), never a warning: nothing is wrong.
 */
export const OFFICE_PREPAYMENT_HONOUR_LINE = 'The prepayment keeps its agreed amount. Whoever the office assigns claims it.'

/** 32a's wording to the anaesthetist handing a prepaid Booking to a colleague. */
export function anaesthetistPrepaymentHonourLine(receiverShort: string): string {
  return `This Booking is prepaid. The prepaid amount stays as agreed, and moves to ${receiverShort} once the List is authorised.`
}

export type PrepaymentHonourLineProps =
  | { audience: 'anaesthetist'; receiverShort: string; shot?: string }
  | { audience: 'office'; shot?: string }

export function PrepaymentHonourLine(props: PrepaymentHonourLineProps) {
  const text = props.audience === 'office' ? OFFICE_PREPAYMENT_HONOUR_LINE : anaesthetistPrepaymentHonourLine(props.receiverShort)
  return (
    <Notice tone="neutral" shot={props.shot ?? 'move-booking-honour'} data-audience={props.audience}>
      {text}
    </Notice>
  )
}
