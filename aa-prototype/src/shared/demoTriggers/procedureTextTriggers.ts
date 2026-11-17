/**
 * The pure parts of catch-up Phase 20a's two Booking-route demo triggers:
 * "Fire hospital message" re-pointed onto the Booking routes (its default is
 * the canned message addressed to the Booking on screen), and the new
 * "Hospital description arrives" (AR-35's illustrative hospital wordings,
 * through `replaceProcedureText`). Kept apart from the registry so each rule
 * has a test.
 */

import type { AppState } from '../../store'
import { CANNED_MESSAGES } from '../../domain/integrations'
import { HOSPITAL_DESCRIPTION_CHOICES } from '../../domain/seed/sourceWording'
import { replacesProcedureText } from '../../domain/billing/procedureStack'
import type { InvoiceDescriptionOrigin, Procedure } from '../../domain/types'

/**
 * The canned modify message (S13, S14 or S15) addressed to this Booking, by its
 * correlation ref: MSG-STG-1012 on Diane Foster's Booking. Undefined when the
 * Booking has none or no message names its appointment.
 */
export function cannedMessageForBooking(state: Pick<AppState, 'schedule'>, bookingId: string | undefined): string | undefined {
  if (bookingId === undefined) return undefined
  const ref = state.schedule.bookings[bookingId]?.correlationRef
  if (ref === undefined) return undefined
  const modify = CANNED_MESSAGES.filter(
    (m) => m.eventType !== 'S12' && m.feedId === ref.sourceFeedId && m.correlationAppointmentId === ref.externalAppointmentId,
  )
  // The modification (S14) first: it carries the new text; then a reschedule; a cancellation last.
  const order = ['S14', 'S13', 'S15']
  return modify.sort((a, b) => order.indexOf(a.eventType) - order.indexOf(b.eventType))[0]?.id
}

/** The Booking's primary Procedure (the intake target, catch-up Phase 23). */
export function primaryProcedureOf(state: Pick<AppState, 'schedule'>, bookingId: string | undefined): Procedure | undefined {
  if (bookingId === undefined) return undefined
  return Object.values(state.schedule.procedures).find((p) => p.bookingId === bookingId && p.isPrimary)
}

export const HOSPITAL_DESCRIPTION_CHOICE_ID = (row: number) => `ar35-row-${row}`

/** The choices: AR-35's hospital wordings (rows 2, 12, 20, 25), illustrative. */
export function hospitalDescriptionChoices(): { id: string; label: string; text: string }[] {
  return HOSPITAL_DESCRIPTION_CHOICES.map((c) => ({ id: HOSPITAL_DESCRIPTION_CHOICE_ID(c.row), label: `“${c.text}” (illustrative)`, text: c.text }))
}

/**
 * The row AR-35 pairs with the Procedure's rooms' text ("RTK" to row 2, "lap chole +/- IOC" to row 12),
 * else the first wording the Procedure does not already hold, so the default can run.
 */
export function defaultHospitalDescription(procedure: Procedure | undefined): string {
  const paired = HOSPITAL_DESCRIPTION_CHOICES.find((c) => c.pairsWith !== undefined && c.pairsWith === procedure?.procedureText?.text)
  const notHeld = HOSPITAL_DESCRIPTION_CHOICES.find((c) => c.text !== procedure?.procedureText?.text)
  return HOSPITAL_DESCRIPTION_CHOICE_ID((paired ?? notHeld ?? HOSPITAL_DESCRIPTION_CHOICES[0]!).row)
}

export function hospitalDescriptionText(choiceId: string | undefined): string | undefined {
  return hospitalDescriptionChoices().find((c) => c.id === choiceId)?.text
}

/** Why the action cannot run on this Procedure with this wording, or null. */
export function hospitalDescriptionRefusal(procedure: Procedure | undefined, text: string | undefined): string | null {
  if (procedure === undefined) return 'Open a Booking with a procedure first'
  if (text === undefined) return 'Choose a hospital description'
  if (!replacesProcedureText(procedure.procedureText, { text, source: 'hospitalDownload' })) return 'This Booking already holds that hospital description'
  return null
}

/** The outcome in words, from where the invoice description now comes from. */
export function hospitalDescriptionOutcome(text: string, origin: InvoiceDescriptionOrigin | undefined, cue: boolean, hadText = true): string {
  const head = `The procedure text is now the hospital's “${text}”${hadText ? '; the text it replaced is in the History' : ''}.`
  if (origin === 'hospital') return `${head} The invoice description follows it.`
  if (origin === 'contract') return `${head} The invoice description stays the Contract's: it comes first in the order of defaults.`
  if (origin === 'edited') return `${head} The office's edit stays on the invoice${cue ? ', with a newer description cue to use it' : ''}.`
  return head
}
