/**
 * The prepayment letter's store reads (catch-up Phase 41; US-06.3.6): what a
 * letter is filled in with for a Booking, the preview before sending, and the
 * default template of a kind. The rules and rendering are pure, in
 * `domain/billing/prepaymentLetter.ts`; this only reads the state.
 *
 * The letter names the patient only, never the NHI; the prepaid Procedures'
 * names as the invoice lines describe them; the List's date; the amount as the
 * invoice shows it (with GST); the anaesthetist on the invoice (22's
 * `supplier`), or for the moved-Booking email the List's anaesthetist now; the
 * invoice number; and what is still to pay from 36's receivable leg.
 */

import type { Invoice, PrepaymentLetterKind, PrepaymentLetterTemplate, PrepaymentReminder, RenderedLetter } from '../domain/types'
import { PREPAYMENT_NAMES_ANAESTHETIST, pendingGroupFor, prepaymentInvoiceDraftFor, type PrepaymentGroup } from '../domain/billing/prepayment'
import { defaultTemplateOf, letterMergeDataOf, NUMBER_ALLOCATED_WHEN_SENT, renderPrepaymentLetter, type LetterMergeData } from '../domain/billing/prepaymentLetter'
import { roundToCents } from '../domain/billing/money'
import type { AppState } from './appStore'
import { clockISO } from './mutate'
import { linesByInvoice } from './indexes'
import { pairForInvoice } from './ledgerSelectors'
import { proceduresForBooking } from './selectors'
import { prepaymentGroupsForBooking } from './prepaymentSelectors'

type LetterState = Pick<AppState, 'schedule' | 'billing' | 'masters'>

/** The default active template of a kind (one default per kind). */
export function defaultLetterTemplate(state: Pick<AppState, 'masters'>, kind: PrepaymentLetterKind): PrepaymentLetterTemplate | undefined {
  return defaultTemplateOf(state.masters.prepaymentLetterTemplates, kind)
}

/** The active templates of a kind, the default first, then by name. */
export function activeLetterTemplates(state: Pick<AppState, 'masters'>, kind: PrepaymentLetterKind): PrepaymentLetterTemplate[] {
  return Object.values(state.masters.prepaymentLetterTemplates)
    .filter((t) => t.kind === kind && t.active)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name))
}

/** What is still to pay on an invoice: its total less what was received and credited (36's receivable leg). */
export function amountOutstandingOn(state: Pick<AppState, 'billing'>, invoice: Pick<Invoice, 'id' | 'total'>): number {
  const pair = pairForInvoice(state, invoice.id)
  if (pair === undefined) return invoice.total
  const r = pair.receivable
  return Math.max(0, roundToCents(r.amount - r.receivedAmount - (r.creditedAmount ?? 0)))
}

/**
 * The merge data for a letter on this Booking: from the prepayment invoice
 * when there is one, else from the pending group's draft (the number
 * "(allocated when sent)"). `kind: 'anaesthetistChanged'` names the List's
 * anaesthetist now; a request or reminder names the invoice's, while 27's
 * constant says invoices name one (OQ-120, D68).
 */
export function letterMergeDataFor(state: LetterState, bookingId: string, opts: { invoiceId?: string; group?: PrepaymentGroup; kind?: PrepaymentLetterKind } = {}): LetterMergeData {
  const booking = state.schedule.bookings[bookingId]
  if (booking === undefined) return {}
  const list = state.schedule.lists[booking.listId]
  const patient = state.masters.patients[booking.patientId]
  const kind = opts.kind ?? 'request'
  const invoice = opts.invoiceId !== undefined ? state.billing.invoices[opts.invoiceId] : undefined
  const listAnaesthetist = list?.anaesthetistId !== undefined ? state.masters.anaesthetists[list.anaesthetistId]?.name : undefined

  let procedureNames: string[] = []
  let prepaidAmount: number | undefined
  let invoiceNumber: string | undefined
  let anaesthetistName: string | undefined
  let amountOutstanding: number | undefined
  if (invoice !== undefined) {
    procedureNames = (linesByInvoice(state.billing.invoiceLines).get(invoice.id) ?? [])
      .filter((l) => l.procedureId !== undefined)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map((l) => l.description)
    prepaidAmount = invoice.total
    invoiceNumber = invoice.invoiceNumber
    anaesthetistName = invoice.supplier?.name ?? listAnaesthetist
    amountOutstanding = amountOutstandingOn(state, invoice)
  } else if (opts.group !== undefined) {
    const draft = prepaymentInvoiceDraftFor(opts.group, proceduresForBooking(state, bookingId), {
      contracts: state.masters.contracts,
      patientId: booking.patientId,
      ...(patient !== undefined ? { patient } : {}),
    })
    if (draft !== null) {
      procedureNames = draft.lines.filter((l) => l.procedureId !== undefined).map((l) => l.description)
      prepaidAmount = draft.total
      amountOutstanding = draft.total
    }
    invoiceNumber = NUMBER_ALLOCATED_WHEN_SENT
    anaesthetistName = listAnaesthetist
  }
  if (kind === 'anaesthetistChanged') anaesthetistName = listAnaesthetist
  else if (!PREPAYMENT_NAMES_ANAESTHETIST) anaesthetistName = undefined

  return letterMergeDataOf({
    procedureNames,
    ...(patient !== undefined ? { patientName: patient.name } : {}),
    ...(list !== undefined ? { procedureDateISO: list.dateISO } : {}),
    ...(prepaidAmount !== undefined ? { prepaidAmount } : {}),
    ...(anaesthetistName !== undefined ? { anaesthetistName } : {}),
    ...(invoiceNumber !== undefined ? { invoiceNumber } : {}),
    ...(kind === 'reminder' && amountOutstanding !== undefined ? { amountOutstanding } : {}),
  })
}

/** Render a letter as a snapshot at `atISO`. */
export function renderLetter(template: PrepaymentLetterTemplate, data: LetterMergeData, atISO: string): RenderedLetter {
  return { templateId: template.id, templateName: template.name, kind: template.kind, body: renderPrepaymentLetter(template, data), renderedAtISO: atISO }
}

export type LetterTemplateChoice = { ok: true; template: PrepaymentLetterTemplate } | { ok: false; code: 'templateInactive' | 'templateWrongKind' | 'noTemplate'; message: string }

export const LETTER_SEND_MESSAGES = {
  templateInactive: 'That letter template is switched off. Choose an active one.',
  templateWrongKind: 'That template is not for this kind of letter.',
  noTemplate: 'There is no active letter template of this kind. Add one in Master data, Prepayment letters.',
} as const

/** The template a send uses: the one chosen (active, of the right kind), else the kind's default. */
export function chooseLetterTemplate(state: Pick<AppState, 'masters'>, kind: PrepaymentLetterKind, templateId?: string): LetterTemplateChoice {
  if (templateId !== undefined) {
    const t = state.masters.prepaymentLetterTemplates[templateId]
    if (t === undefined || !t.active) return { ok: false, code: 'templateInactive', message: LETTER_SEND_MESSAGES.templateInactive }
    if (t.kind !== kind) return { ok: false, code: 'templateWrongKind', message: LETTER_SEND_MESSAGES.templateWrongKind }
    return { ok: true, template: t }
  }
  const d = defaultLetterTemplate(state, kind)
  return d !== undefined ? { ok: true, template: d } : { ok: false, code: 'noTemplate', message: LETTER_SEND_MESSAGES.noTemplate }
}

/**
 * The letter that would go with a payer's prepayment invoice, before it is
 * sent (Approve and send's "Preview letter"). Writes nothing. Equal to the
 * sent letter but for the invoice number, allocated when sent.
 */
export function previewPrepaymentLetter(state: LetterState & Pick<AppState, 'clock'>, bookingId: string, opts: { payerKey?: string; templateId?: string; kind?: PrepaymentLetterKind; invoiceId?: string } = {}): RenderedLetter | undefined {
  const kind = opts.kind ?? 'request'
  const choice = chooseLetterTemplate(state, kind, opts.templateId)
  if (!choice.ok) return undefined
  const groups = prepaymentGroupsForBooking(state, bookingId)
  const group = opts.payerKey !== undefined ? pendingGroupFor(groups, opts.payerKey) : groups.find((g) => g.state === 'awaitingApproval')
  const data = letterMergeDataFor(state, bookingId, { kind, ...(opts.invoiceId !== undefined ? { invoiceId: opts.invoiceId } : group !== undefined ? { group } : {}) })
  return renderLetter(choice.template, data, clockISO(state.clock))
}

/** The latest reminder sent for a prepayment invoice, if any. */
export function lastPrepaymentReminder(state: Pick<AppState, 'billing'>, invoiceId: string): PrepaymentReminder | undefined {
  const r = state.billing.invoices[invoiceId]?.prepaymentReminders
  return r !== undefined && r.length > 0 ? r[r.length - 1] : undefined
}
