/**
 * Prepayment: approve and send, and the approval switch (catch-up Phase 27;
 * US-06.3.1, FT-06.3, FT-08.1; D6 extended, D38).
 *
 * Nothing is invoiced at setup. Each payer group waits on the admin Invoices
 * screen until an admin approves it; Approve and send generates that payer's
 * invoice through `generatePrepaymentInvoice`, the one place the pair is
 * created (OQ-80, D38): the invoice and its ledger pair, then the Xero hand-off makes a
 * receivable from the payer and a DRAFT payable crediting the AA Holding
 * account (`AA_HOLDING_ACCOUNT`), never the anaesthetist; then 22's send step.
 * Approval is a step AA can switch off: off, each ready group is generated
 * and sent at the end of each action that can make it ready, and on
 * switching off. Submit never invoices it again; nothing ever blocks (D5).
 * Every send carries the prepayment letter (catch-up Phase 41; US-06.3.6):
 * the template chosen at Approve and send, else the default request template,
 * rendered in the same commit and kept on the invoice as a snapshot.
 */

import { PAYER_CONTACT_FIRST, PREPAYMENT_NAMES_ANAESTHETIST, prepaymentInvoiceDraftFor, pendingGroupFor, TYPE_AN_AMOUNT_FIRST, type PrepaymentGroup } from '../domain/billing/prepayment'
import { PREPAID_SPLIT_MESSAGE } from '../domain/billing/lock'
import { materialiseInvoices } from './invoiceMaterialise'
import { clockISO, mutate, ok, refuse, type Actor, type MutationMeta, type Outcome } from './mutate'
import type { AppStoreApi } from './appStore'
import { proceduresForBooking } from './selectors'
import { ASSIGN_THE_LIST_FIRST, pendingPrepayments, prepaymentGroupsForBooking } from './prepaymentSelectors'
import { getBooking } from './lifecycle'
import { handoffPairsForBooking } from './xeroHandoff'
import { isDraftStore } from './draftMode'
import { amountOutstandingOn, chooseLetterTemplate, letterMergeDataFor, renderLetter } from './prepaymentLetter'
import { prepaymentStatusFor } from './prepaymentSelectors'
import type { Invoice } from '../domain/types'

/** Who sends a prepayment invoice when approval is off. */
export const PREPAYMENT_AUTO_ACTOR: Actor = { who: 'System', role: 'system', source: 'system' }

export const PREPAYMENT_ALREADY_SENT = 'Already sent'
export const PREPAYMENT_NOT_NEEDED = 'This booking does not need pre-payment'
export const PREPAYMENT_PAYER_CONTACT = PAYER_CONTACT_FIRST

/**
 * Generate one payer group's prepayment invoice, its pair and its send (the
 * one place; D38, OQ-80). Internal: callers check the gates first. The amount
 * on each line becomes its Procedure's prepaid amount, read-only from now on.
 */
function generatePrepaymentInvoice(api: AppStoreApi, actor: Actor, bookingId: string, group: PrepaymentGroup, mode: 'approved' | 'automatic', letterTemplateId?: string): Outcome<{ invoiceId: string }> {
  const state = api.getState()
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return refuse('notFound', 'Booking not found.')
  // The letter that goes with it (catch-up Phase 41): the one chosen, else the default request template.
  const choice = chooseLetterTemplate(state, 'request', letterTemplateId)
  if (!choice.ok) return refuse(choice.code, choice.message)
  const patient = state.masters.patients[booking.patientId]
  const draft = prepaymentInvoiceDraftFor(group, proceduresForBooking(state, bookingId), {
    contracts: state.masters.contracts,
    patientId: booking.patientId,
    ...(patient !== undefined ? { patient } : {}),
  })
  if (draft === null) return refuse('notReady', TYPE_AN_AMOUNT_FIRST)

  let invoiceId = ''
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const atISO = clockISO(s.clock)
    const made = materialiseInvoices(s, s.counters, [draft], {
      bookingId,
      atISO,
      kind: 'prePayment',
      send: true,
      createAction: mode === 'approved' ? 'invoice.prePaymentApproved' : 'invoice.prePaymentAutoSent',
      approval: { mode, by: actor.who, role: actor.role, atISO },
      namesSupplier: PREPAYMENT_NAMES_ANAESTHETIST,
    })
    invoiceId = made.invoiceIds[0] ?? ''
    metas.push(...made.metas)
    let invoices = made.invoices
    const invoice = invoices[invoiceId]
    if (invoice !== undefined) {
      // The letter, rendered from the invoice just made (its number, total and supplier), to that invoice's payer (D85).
      const billing = { ...s.billing, invoices, invoiceLines: made.invoiceLines, ledger: made.ledger }
      const letter = renderLetter(choice.template, letterMergeDataFor({ ...s, billing }, bookingId, { invoiceId, kind: 'request' }), atISO)
      invoices = { ...invoices, [invoiceId]: { ...invoice, letter } }
      metas.push({ entityType: 'invoice', entityId: invoiceId, action: 'invoice.letterSent', after: { invoiceNumber: invoice.invoiceNumber, template: letter.templateName } })
    }
    return { billing: { ...s.billing, invoices, invoiceLines: made.invoiceLines, ledger: made.ledger }, counters: made.counters }
  })
  // The ledger pair is made with the invoice above; its Xero mirror: an ACCREC from the payer and a DRAFT ACCPAY to the AA Holding account (idempotent).
  handoffPairsForBooking(api, bookingId)
  return ok({ invoiceId })
}

/**
 * Approve and send one payer group's prepayment invoice (US-06.3.1). Office
 * only; refused unless that group awaits approval and is ready, on a
 * cancelled Booking, or once the List is AUTHORISED or billed. Approving one
 * payer leaves the Booking's other groups pending.
 */
export function approvePrepayment(api: AppStoreApi, actor: Actor, bookingId: string, payerKey: string, opts: { letterTemplateId?: string } = {}): Outcome<{ invoiceId: string }> {
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  const { booking, list } = found
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office approves a pre-payment invoice.')
  if (booking.cancellation !== undefined) return refuse('bookingCancelled', 'This Booking is cancelled; no pre-payment invoice is sent.')
  if (list.anaesthetistId === undefined) return refuse('noAnaesthetist', ASSIGN_THE_LIST_FIRST)
  if (list.state === 'AUTHORISED' || list.billedAtISO !== undefined) {
    return refuse('listBilled', 'This List is already authorised; the Procedure is billed on its final invoice.')
  }
  const groups = prepaymentGroupsForBooking(state, bookingId)
  const group = pendingGroupFor(groups, payerKey)
  if (group === undefined) {
    return groups.some((g) => g.payerKey === payerKey) ? refuse('alreadySent', PREPAYMENT_ALREADY_SENT) : refuse('notPrepayment', PREPAYMENT_NOT_NEEDED)
  }
  if (group.lines.some((l) => l.amount.kind === 'noPrice')) return refuse('noPrice', TYPE_AN_AMOUNT_FIRST)
  const split = group.procedureIds.find((id) => state.schedule.procedures[id]?.split !== undefined)
  if (split !== undefined) return refuse('prepaidSplit', PREPAID_SPLIT_MESSAGE)
  if (!group.ready) return refuse('payerContactMissing', PREPAYMENT_PAYER_CONTACT)
  return generatePrepaymentInvoice(api, actor, bookingId, group, 'approved', opts.letterTemplateId)
}

/**
 * With approval off, generate and send every ready pending group (on one
 * Booking, or everywhere): the end of each action that can make a group
 * ready calls it, and so does switching approval off. A group not ready
 * (no price, no payer contact) waits; a group already issued is never
 * generated again. A no-op while approval is on.
 */
export function autoSendPrepayments(api: AppStoreApi, bookingId?: string): string[] {
  // A Booking draft never raises money; the save runs this once on the real store (catch-up Phase 35).
  if (isDraftStore(api)) return []
  if (api.getState().appSettings.prepayment.approvalRequired) return []
  const ids: string[] = []
  const rows = pendingPrepayments(api.getState()).filter((r) => r.ready && (bookingId === undefined || r.bookingId === bookingId))
  for (const row of rows) {
    const group = pendingGroupFor(prepaymentGroupsForBooking(api.getState(), row.bookingId), row.payerKey)
    if (group === undefined || !group.ready) continue
    const out = generatePrepaymentInvoice(api, PREPAYMENT_AUTO_ACTOR, row.bookingId, group, 'automatic')
    if (out.ok && out.value.invoiceId !== '') ids.push(out.value.invoiceId)
  }
  return ids
}

/** How many pending groups would go at once if approval were switched off (the confirmation's count). */
export function readyPendingPrepaymentCount(state: Parameters<typeof pendingPrepayments>[0]): number {
  return pendingPrepayments(state).filter((r) => r.ready).length
}

/**
 * The Prepayment approval switch (US-06.3.1's criterion; D6 extended). Office
 * only, audited. Switching it off sends every ready pending group at once.
 */
export function setPrepaymentApprovalRequired(api: AppStoreApi, actor: Actor, on: boolean): Outcome<{ sentInvoiceIds: string[] }> {
  if (actor.role !== 'office') return refuse('officeOnly', 'Only the office changes pre-payment approval.')
  const before = api.getState().appSettings.prepayment.approvalRequired
  if (before === on) return ok({ sentInvoiceIds: [] })
  mutate(api, actor, { entityType: 'settings', entityId: 'prepayment', action: 'settings.prepaymentApprovalChanged', before: { approvalRequired: before }, after: { approvalRequired: on } }, (s) => ({
    appSettings: { ...s.appSettings, prepayment: { ...s.appSettings.prepayment, approvalRequired: on } },
  }))
  return ok({ sentInvoiceIds: on ? [] : autoSendPrepayments(api) })
}

// ---------------------------------------------------------------------------
// The prepayment reminder (catch-up Phase 41; US-06.3.6, US-06.3.2's follow-up)
// ---------------------------------------------------------------------------

export const REMINDER_MESSAGES = {
  officeOnly: 'Only the office sends a prepayment reminder.',
  noOutstandingPrepayment: 'There is no unpaid prepayment on this booking.',
  noInvoiceEmail: 'Add an invoice email for the payer to send a reminder.',
  listAuthorised: 'This List is authorised; the prepayment is settled through the AA Holding account.',
} as const

/** Where a reminder goes: the payer's invoice email as the invoice holds it. */
export function reminderAddressFor(invoice: Pick<Invoice, 'billedTo' | 'delivery'>): string | undefined {
  const email = invoice.billedTo?.email?.trim()
  if (email !== undefined && email !== '') return email
  const sent = invoice.delivery?.status === 'sent' ? invoice.delivery.sends[0]?.to : undefined
  return sent !== undefined && sent.includes('@') ? sent : undefined
}

/** The prepayment invoices on a Booking a reminder can go for: sent, unpaid or part paid. */
export function remindablePrepaymentInvoices(state: Parameters<typeof prepaymentStatusFor>[0], bookingId: string): string[] {
  return prepaymentStatusFor(state, bookingId)
    .groups.filter((g) => (g.status === 'unpaid' || g.status === 'partPaid') && g.invoiceId !== undefined)
    .map((g) => g.invoiceId!)
}

/**
 * Send a prepayment reminder (US-06.3.6): office only (the PWA's stand-in
 * runs as the simulated office); while the payer's prepayment is unpaid or
 * part paid and the List is not AUTHORISED. Per payer: `invoiceId` names the
 * invoice, defaulting to the first unpaid one. Rendered with the amount still
 * to pay, appended to the invoice's reminders, audited
 * `invoice.prepaymentReminder`. Never changes the status or 15a's warning.
 */
export function sendPrepaymentReminder(api: AppStoreApi, actor: Actor, bookingId: string, opts: { invoiceId?: string; templateId?: string } = {}): Outcome<{ invoiceId: string; to: string }> {
  if (actor.role !== 'office') return refuse('officeOnly', REMINDER_MESSAGES.officeOnly)
  const state = api.getState()
  const found = getBooking(state, bookingId)
  if (found === undefined) return refuse('notFound', 'Booking not found.')
  if (found.booking.cancellation !== undefined) return refuse('noOutstandingPrepayment', REMINDER_MESSAGES.noOutstandingPrepayment)
  if (found.list.state === 'AUTHORISED' || found.list.billedAtISO !== undefined) return refuse('listAuthorised', REMINDER_MESSAGES.listAuthorised)
  const open = remindablePrepaymentInvoices(state, bookingId)
  const invoiceId = opts.invoiceId ?? open[0]
  if (invoiceId === undefined || !open.includes(invoiceId)) return refuse('noOutstandingPrepayment', REMINDER_MESSAGES.noOutstandingPrepayment)
  const invoice = state.billing.invoices[invoiceId]!
  const to = reminderAddressFor(invoice)
  if (to === undefined) return refuse('noInvoiceEmail', REMINDER_MESSAGES.noInvoiceEmail)
  const choice = chooseLetterTemplate(state, 'reminder', opts.templateId)
  if (!choice.ok) return refuse(choice.code, choice.message)
  const amountOutstanding = amountOutstandingOn(state, invoice)
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    const atISO = clockISO(s.clock)
    const letter = renderLetter(choice.template, letterMergeDataFor(s, bookingId, { invoiceId, kind: 'reminder' }), atISO)
    const current = s.billing.invoices[invoiceId]!
    metas.push({ entityType: 'invoice', entityId: invoiceId, action: 'invoice.prepaymentReminder', after: { invoiceNumber: current.invoiceNumber, to, amountOutstanding, template: letter.templateName } })
    const reminder = { atISO, by: actor.who, to, letter, amountOutstanding }
    return { billing: { ...s.billing, invoices: { ...s.billing.invoices, [invoiceId]: { ...current, prepaymentReminders: [...(current.prepaymentReminders ?? []), reminder] } } } }
  })
  return ok({ invoiceId, to })
}
