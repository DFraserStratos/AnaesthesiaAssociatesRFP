/**
 * A moved prepaid Booking and the optional patient email (catch-up Phase 41;
 * US-06.5.4, D38; OQ-120's default, D68).
 *
 * A move changes nothing about a prepayment: the invoice, its ledger pair, the
 * Xero pairs, the status and the AA Holding account stay exactly as they were,
 * and 27a's transfer pays whoever did the List once it is authorised. So no
 * move path calls anything here. What the office may do, by choice, is email
 * the payer that the anaesthetist changed: one informational letter (the
 * `anaesthetistChanged` template, `LT003` by default) naming the List's
 * anaesthetist now, the same amount and the same invoice number, never the
 * NHI. It is appended to `Booking.patientNotices` and audited
 * `booking.patientNotified`; it writes nothing to the invoice, its pair or the
 * prepayment status.
 */

import type { Invoice, PatientNotice } from '../domain/types'
import type { AppState, AppStoreApi } from './appStore'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import { livePrePaymentInvoicesForBooking } from './selectors'
import { reminderAddressFor } from './prepaymentActions'
import { chooseLetterTemplate, letterMergeDataFor, renderLetter } from './prepaymentLetter'

export const PATIENT_NOTICE_MESSAGES = {
  officeOnly: 'Only the office emails the patient.',
  notFound: 'Booking not found.',
  bookingCancelled: 'This booking is cancelled, so there is no change of anaesthetist to tell the patient about.',
  notChanged: 'The anaesthetist has not changed since the prepayment invoice was sent.',
  noInvoiceEmail: 'Add an invoice email for the payer to send this email.',
} as const

type NoticeState = Pick<AppState, 'schedule' | 'billing'>

/**
 * The Booking's issued prepayment invoices whose supplier (the anaesthetist
 * named when it was sent) is no longer the List's anaesthetist: the moved
 * prepayments. Empty on a cancelled Booking, a List with nobody on it (the
 * office's pool: there is nobody new to name yet) or an invoice that names no
 * supplier.
 */
export function changedPrepaymentInvoicesFor(state: NoticeState, bookingId: string): Invoice[] {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined || booking.cancellation !== undefined) return []
  const now = state.schedule.lists[booking.listId]?.anaesthetistId
  if (now === undefined) return []
  return livePrePaymentInvoicesForBooking(state, bookingId).filter((i) => i.supplier !== undefined && i.supplier.anaesthetistId !== now)
}

/** True when this live Booking has a prepayment invoice sent and not credited (the office's move steps show the honour line). */
export function hasSentPrepayment(state: NoticeState, bookingId: string): boolean {
  const booking = state.schedule.bookings[bookingId]
  return booking !== undefined && booking.cancellation === undefined && livePrePaymentInvoicesForBooking(state, bookingId).length > 0
}

/** True when any live Booking on this List has a sent prepayment. */
export function listHasSentPrepayment(state: NoticeState, listId: string): boolean {
  return Object.values(state.schedule.bookings).some((b) => b.listId === listId && hasSentPrepayment(state, b.id))
}

/** True when a live prepayment invoice on this Booking names an anaesthetist other than the List's now (US-06.5.4). */
export function anaesthetistChangedFor(state: NoticeState, bookingId: string): boolean {
  return changedPrepaymentInvoicesFor(state, bookingId).length > 0
}

/** The patient emails sent for this Booking, oldest first. */
export function patientNoticesFor(state: Pick<AppState, 'schedule'>, bookingId: string): readonly PatientNotice[] {
  return state.schedule.bookings[bookingId]?.patientNotices ?? []
}

/** The latest patient email sent for this Booking, if any. */
export function lastPatientNotice(state: Pick<AppState, 'schedule'>, bookingId: string): PatientNotice | undefined {
  const all = patientNoticesFor(state, bookingId)
  return all.length > 0 ? all[all.length - 1] : undefined
}

/**
 * Email the payer that the anaesthetist changed (US-06.5.4; optional, the
 * office's choice). Office only, on a non-cancelled Booking whose prepayment
 * invoice names an anaesthetist other than the List's now. Sent to the
 * payer's invoice email as the invoice holds it; rendered from the chosen
 * `anaesthetistChanged` template, else the default. One commit: the notice on
 * the Booking and its audit row. Never called from a move.
 */
export function emailPatientAnaesthetistChanged(
  api: AppStoreApi,
  actor: Actor,
  bookingId: string,
  opts: { templateId?: string; invoiceId?: string } = {},
): Outcome<{ to: string; invoiceId: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', PATIENT_NOTICE_MESSAGES.officeOnly)
  const state = api.getState()
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return refuse('notFound', PATIENT_NOTICE_MESSAGES.notFound)
  if (booking.cancellation !== undefined) return refuse('bookingCancelled', PATIENT_NOTICE_MESSAGES.bookingCancelled)
  const changed = changedPrepaymentInvoicesFor(state, bookingId)
  const invoice = opts.invoiceId !== undefined ? changed.find((i) => i.id === opts.invoiceId) : changed[0]
  if (invoice === undefined) return refuse('notChanged', PATIENT_NOTICE_MESSAGES.notChanged)
  const to = reminderAddressFor(invoice)
  if (to === undefined) return refuse('noInvoiceEmail', PATIENT_NOTICE_MESSAGES.noInvoiceEmail)
  const choice = chooseLetterTemplate(state, 'anaesthetistChanged', opts.templateId)
  if (!choice.ok) return refuse(choice.code, choice.message)
  const anaesthetistId = state.schedule.lists[booking.listId]!.anaesthetistId!
  const invoiceId = invoice.id

  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const atISO = clockISO(s.clock)
    const letter = renderLetter(choice.template, letterMergeDataFor(s, bookingId, { invoiceId, kind: 'anaesthetistChanged' }), atISO)
    const current = s.schedule.bookings[bookingId]!
    const notice: PatientNotice = { kind: 'anaesthetistChanged', atISO, by: actor.who, to, letter, anaesthetistId }
    metas.push({
      entityType: 'booking',
      entityId: bookingId,
      action: 'booking.patientNotified',
      after: { kind: notice.kind, to, anaesthetistId, invoiceNumber: invoice.invoiceNumber, template: letter.templateName },
    })
    return {
      schedule: { ...s.schedule, bookings: { ...s.schedule.bookings, [bookingId]: { ...current, patientNotices: [...(current.patientNotices ?? []), notice] } } },
    }
  })
  return ok({ to, invoiceId })
}
