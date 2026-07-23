/**
 * Pre-payment office actions (Phase 09; B7).
 *
 *  - `raisePreProcedureInvoice` produces the pre-procedure invoice through the
 *    normal document pipeline (an `Invoice{kind:'prePayment'}` + line(s) + a
 *    `BillingCase{status:'invoiced'}`), covering only the patient-funded
 *    (BillableParty-route `selfFundedPrepayment`) procedures. It NEVER stamps
 *    `list.billedAtISO` — this is a pre-day invoice, not the billing run. It is
 *    refused once the List is AUTHORISED or billed (the balance run would then
 *    have already billed the full amount, so raising a deposit too would double
 *    charge), and is idempotent (refused if a pre-payment invoice already exists).
 *
 *  - `overridePrepaymentGate` records the office's real-world "proceed anyway"
 *    call (a browser prototype cannot itself verify a payment): it writes
 *    `Card.prepaymentOverride` with a mandatory reason, audited and shown as a
 *    flagged override everywhere the Card appears. It lifts the completion gate
 *    (2nd review #6; the settled hard-gate + audited-override ruling).
 *
 * OPEN QUESTION surfaced in UI copy: the RFP leaves the pre-payment timing vs
 * the AUTHORISED billing trigger open; this is the prototype's proposed reading
 * (pre-invoice pre-day, balance at the run).
 */

import type { BillingCase, Invoice, InvoiceLine, PrepaymentOverride } from '../domain/types'
import {
  buildPrePaymentInvoiceForCard,
  type InvoiceBuildContext,
} from '../domain/billing/invoiceBuild'
import {
  allocateId,
  clockISO,
  mutate,
  ok,
  refuse,
  type Actor,
  type MutationMeta,
  type Outcome,
} from './mutate'
import type { AppStoreApi } from './appStore'
import {
  billingContextForCard,
  cardRequiresPrepayment,
  prePaymentInvoicesForCard,
  proceduresForCard,
} from './selectors'
import { getCard } from './lifecycle'
import { handoffCasesForCard } from './xeroHandoff'

/**
 * Raise the pre-procedure invoice for a Card's patient-funded portion.
 * Office-only; refused on an AUTHORISED/billed List and idempotent.
 */
export function raisePreProcedureInvoice(
  api: AppStoreApi,
  actor: Actor,
  cardId: string,
): Outcome<{ invoiceIds: string[] }> {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list } = found

  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office raises a pre-procedure invoice.')
  }
  if (card.cancellation !== undefined) {
    return refuse('cardCancelled', 'This Card is cancelled; no pre-payment invoice is raised.')
  }
  // Refuse once the List is authorised or billed: the balance run would then
  // have billed the full amount, so a deposit invoice too would double charge.
  if (list.state === 'AUTHORISED' || list.billedAtISO !== undefined) {
    return refuse(
      'listBilled',
      'This List is already authorised or billed. Raising a pre-payment invoice now would double charge; the balance is billed by the run.',
    )
  }
  if (!cardRequiresPrepayment(state, cardId)) {
    return refuse('notPrepayment', 'This Card has no self funded pre-payment procedure to invoice.')
  }
  if (prePaymentInvoicesForCard(state, cardId).length > 0) {
    return refuse('alreadyRaised', 'A pre-payment invoice has already been raised for this Card.')
  }

  const cardCtx = billingContextForCard(state, card)
  if (cardCtx === undefined) {
    return refuse('noContext', 'Billing context could not be assembled for this Card.')
  }
  const buildCtx: InvoiceBuildContext = {
    ...cardCtx,
    listDateISO: list.dateISO,
    patientId: card.patientId,
    ...(list.hospitalId !== undefined ? { listHospitalId: list.hospitalId } : {}),
  }
  const built = buildPrePaymentInvoiceForCard(card, proceduresForCard(state, cardId), buildCtx)
  if (built.kind === 'exception') {
    return refuse(built.code, built.message)
  }
  if (built.invoices.length === 0) {
    return refuse('notPrepayment', 'This Card has no self funded pre-payment procedure to invoice.')
  }

  const invoiceIds: string[] = []
  const metas: MutationMeta[] = []
  mutate(api, actor, metas, (s) => {
    let counters = s.counters
    const invoices = { ...s.billing.invoices }
    const invoiceLines = { ...s.billing.invoiceLines }
    const cases = { ...s.billing.cases }
    const atISO = clockISO(s.clock)

    for (const draft of built.invoices) {
      const bc = allocateId(counters, 'billingCase')
      counters = bc.counters
      const inv = allocateId(counters, 'invoice')
      counters = inv.counters
      const num = allocateId(counters, 'invoiceNumber')
      counters = num.counters

      const invoice: Invoice = {
        id: inv.id,
        invoiceNumber: num.id,
        caseReference: bc.id,
        cardId,
        counterparty: draft.counterparty,
        layout: draft.layout,
        kind: 'prePayment',
        subtotal: draft.subtotal,
        gst: draft.gst,
        total: draft.total,
        raisedAtISO: atISO,
      }
      invoices[inv.id] = invoice
      for (const line of draft.lines) {
        const il = allocateId(counters, 'invoiceLine')
        counters = il.counters
        const stored: InvoiceLine = {
          id: il.id,
          invoiceId: inv.id,
          description: line.description,
          amount: line.amount,
        }
        if (line.procedureId !== undefined) stored.procedureId = line.procedureId
        if (line.units !== undefined) stored.units = line.units
        invoiceLines[il.id] = stored
      }
      cases[bc.id] = { id: bc.id, cardId, invoiceId: inv.id, status: 'invoiced', receivedAmount: 0, authorisedAmount: 0, disbursedAmount: 0 } satisfies BillingCase
      invoiceIds.push(inv.id)
      metas.push({
        entityType: 'invoice',
        entityId: inv.id,
        action: 'invoice.raisePrePayment',
        after: {
          invoiceNumber: num.id,
          caseReference: bc.id,
          cardId,
          counterparty: draft.counterparty,
          subtotal: draft.subtotal,
          total: draft.total,
        },
        // The Card is not stamped: raising a pre-invoice is not a Card edit and
        // must not restamp lastModified (nor is the List billed).
        stampCardId: null,
      })
    }

    return { billing: { ...s.billing, invoices, invoiceLines, cases }, counters }
  })

  // Hand the pre-invoice case(s) off to Xero as a full ACCREC+ACCPAY pair
  // (D-pre-invoice-pair) once the raise has committed. Idempotent.
  handoffCasesForCard(api, cardId)

  return ok({ invoiceIds })
}

/**
 * Record an office override of the pre-payment completion gate (audited, with a
 * mandatory reason). Lifts the block; shown as a flagged override wherever the
 * Card appears. Blocked on an AUTHORISED List (its Cards are locked).
 */
export function overridePrepaymentGate(
  api: AppStoreApi,
  actor: Actor,
  cardId: string,
  reason: string,
): Outcome {
  const state = api.getState()
  const found = getCard(state, cardId)
  if (found === undefined) return refuse('notFound', 'Card not found.')
  const { card, list } = found

  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can override the pre-payment gate.')
  }
  if (reason.trim() === '') {
    return refuse('reasonRequired', 'An override reason is required.')
  }
  if (list.state === 'AUTHORISED') {
    return refuse('listAuthorised', 'This List is authorised and its Cards are locked.')
  }
  if (!cardRequiresPrepayment(state, cardId)) {
    return refuse('notPrepayment', 'This Card does not require pre-payment; there is nothing to override.')
  }
  if (card.prepaymentOverride !== undefined) {
    return refuse('alreadyOverridden', 'The pre-payment gate is already overridden on this Card.')
  }

  const override: PrepaymentOverride = { reason: reason.trim(), by: actor.who, atISO: clockISO(state.clock) }
  mutate(
    api,
    actor,
    {
      entityType: 'card',
      entityId: cardId,
      action: 'card.prepaymentOverride',
      after: { reason: override.reason },
    },
    (s) => ({
      schedule: {
        ...s.schedule,
        cards: { ...s.schedule.cards, [cardId]: { ...card, prepaymentOverride: override } },
      },
    }),
  )
  return ok(undefined)
}
