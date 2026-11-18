/**
 * The one place a built invoice becomes a stored one (catch-up Phase 22;
 * FT-08.4, US-08.4.2, US-08.4.5): the billing run, the monitor's retry and the
 * office's prepayment raise all call `materialiseInvoices` inside their own
 * `mutate()`, so the three paths cannot drift. It allocates the ids and
 * numbers, prints the supplier from the locked payee (catch-up Phase 25; a
 * pre-payment, raised before any lock, still reads the List's anaesthetist
 * until Phases 27 and 41) and AA as agent,
 * links a split's shares to each other, and, when `send` is true, stamps each
 * invoice's delivery at the run's clock time from 21's one delivery rule
 * (`invoiceDeliveryFor`): emailed, marked to post, or raised with no address
 * (never a failure). The send step is separable: Phase 27 raises the
 * prepayment invoice unsent and sends it on admin approval.
 *
 * AA fee invoices (Phase 16) never come through here: they are AA's own.
 */

import type { BillingCase, Invoice, InvoiceApproval, InvoiceId, InvoiceLine, InvoiceLineage } from '../domain/types'
import type { DraftInvoice, LockedPayee } from '../domain/billing/lock'
import { AA_AGENT, deliveryStampFor, supplierFor } from '../domain/billing/invoicePresentation'
import { invoiceDeliveryFor } from '../domain/billing/whoIsBilled'
import { allocateId, type MutationMeta } from './mutate'
import type { AppState } from './appStore'

/** Who the delivery stamp names as sender. */
export const BILLING_RUN_SENDER = 'Billing run'

export interface MaterialiseArgs {
  bookingId: string
  atISO: string
  kind: Invoice['kind']
  /** Stamp delivery now (the run, the retry, today's prepayment raise). */
  send: boolean
  /** The audit action each invoice is created under (a prepayment's: approved, or sent with approval off). */
  createAction: 'invoice.create' | 'invoice.prePaymentApproved' | 'invoice.prePaymentAutoSent'
  /** A prepayment invoice's approval stamp (catch-up Phase 27). */
  approval?: InvoiceApproval
  /** The retry reuses the failed case's id for its first invoice. */
  reuseCaseId?: string
  /** The locked payee (catch-up Phase 25): the supplier block and each case's payee. Absent on a pre-payment (the live join, until 27). */
  payee?: LockedPayee
}

export interface MaterialiseResult {
  counters: Record<string, number>
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  cases: Record<string, BillingCase>
  invoiceIds: InvoiceId[]
  metas: MutationMeta[]
  sentCount: number
  toPostCount: number
  notSentCount: number
}

/**
 * Store `drafts` (one Booking's) into copies of the billing maps of `s`.
 * Pure over its inputs: the caller commits the result in its `mutate()`.
 */
export function materialiseInvoices(
  s: Pick<AppState, 'schedule' | 'masters' | 'billing'>,
  counters: Record<string, number>,
  drafts: readonly DraftInvoice[],
  args: MaterialiseArgs,
  maps: Pick<MaterialiseResult, 'invoices' | 'invoiceLines' | 'cases'> = {
    invoices: { ...s.billing.invoices },
    invoiceLines: { ...s.billing.invoiceLines },
    cases: { ...s.billing.cases },
  },
): MaterialiseResult {
  const { invoices, invoiceLines, cases } = maps
  const booking = s.schedule.bookings[args.bookingId]
  const list = booking !== undefined ? s.schedule.lists[booking.listId] : undefined
  const patient = booking !== undefined ? s.masters.patients[booking.patientId] : undefined
  // A pre-payment case is raised at setup, before any lock: its payee is still the List's anaesthetist (D38; until 27 and 41).
  const anaesthetist = args.payee === undefined && list?.anaesthetistId !== undefined ? s.masters.anaesthetists[list.anaesthetistId] : undefined
  const supplier = args.payee?.supplier ?? (anaesthetist !== undefined ? supplierFor(anaesthetist) : undefined)

  const invoiceIds: InvoiceId[] = []
  const metas: MutationMeta[] = []
  let sentCount = 0
  let toPostCount = 0
  let notSentCount = 0

  // Ids first, so a split's shares can point at each other.
  const allocated = drafts.map((_, index) => {
    let caseId: string
    if (index === 0 && args.reuseCaseId !== undefined) caseId = args.reuseCaseId
    else {
      const bc = allocateId(counters, 'billingCase')
      counters = bc.counters
      caseId = bc.id
    }
    const inv = allocateId(counters, 'invoice')
    counters = inv.counters
    const num = allocateId(counters, 'invoiceNumber')
    counters = num.counters
    return { caseId, invoiceId: inv.id, invoiceNumber: num.id }
  })

  drafts.forEach((draft, index) => {
    const { caseId, invoiceId, invoiceNumber } = allocated[index]!
    const lineage: InvoiceLineage[] = (draft.splitSiblings ?? []).flatMap((i) => {
      const sibling = allocated[i]
      return sibling !== undefined ? [{ role: 'otherShareOfSplit' as const, invoiceId: sibling.invoiceId }] : []
    })
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      caseReference: caseId,
      bookingId: args.bookingId,
      counterparty: draft.counterparty,
      ...(draft.billedTo !== undefined ? { billedTo: draft.billedTo } : {}),
      layout: draft.layout,
      kind: args.kind,
      subtotal: draft.subtotal,
      gst: draft.gst,
      total: draft.total,
      raisedAtISO: args.atISO,
      procedureIds: [...draft.procedureIds],
      ...(supplier !== undefined ? { supplier } : {}),
      agent: AA_AGENT,
      ...(draft.split !== undefined ? { split: draft.split } : {}),
      ...(draft.holderReference !== undefined ? { holderReference: draft.holderReference } : {}),
      ...(draft.crossMatch !== undefined ? { crossMatch: draft.crossMatch } : {}),
      ...(lineage.length > 0 ? { lineage } : {}),
      ...(draft.noCharge === true ? { noCharge: true as const } : {}),
      ...(args.approval !== undefined ? { approval: { ...args.approval } } : {}),
    }
    if (args.send && draft.delivery !== undefined) {
      invoice.delivery = deliveryStampFor(draft.delivery, args.atISO, BILLING_RUN_SENDER)
    } else if (args.send && booking !== undefined) {
      invoice.delivery = deliveryStampFor(invoiceDeliveryFor(draft.counterparty, draft.procedureIds.flatMap((id) => (s.schedule.procedures[id] !== undefined ? [s.schedule.procedures[id]] : [])), booking.patientId, patient, s.masters.parties), args.atISO, BILLING_RUN_SENDER)
    }
    invoices[invoiceId] = invoice

    for (const line of draft.lines) {
      const il = allocateId(counters, 'invoiceLine')
      counters = il.counters
      const stored: InvoiceLine = { id: il.id, invoiceId, kind: line.kind, description: line.description, amount: line.amount }
      if (line.procedureId !== undefined) stored.procedureId = line.procedureId
      if (line.units !== undefined) stored.units = line.units
      if (line.btm !== undefined) stored.btm = line.btm
      if (line.contractId !== undefined) stored.contractId = line.contractId
      invoiceLines[il.id] = stored
    }
    cases[caseId] = { id: caseId, bookingId: args.bookingId, ...(args.payee !== undefined ? { payeeAnaesthetistId: args.payee.anaesthetistId } : {}), invoiceId, status: 'invoiced', receivedAmount: 0, authorisedAmount: 0, disbursedAmount: 0 } satisfies BillingCase
    invoiceIds.push(invoiceId)

    metas.push({
      entityType: 'invoice',
      entityId: invoiceId,
      action: args.createAction,
      after: {
        invoiceNumber,
        caseReference: caseId,
        bookingId: args.bookingId,
        counterparty: draft.counterparty,
        subtotal: draft.subtotal,
        gst: draft.gst,
        total: draft.total,
        ...(draft.split !== undefined ? { split: draft.split.shareLabel } : {}),
      },
      stampBookingId: null,
    })

    const delivery = invoice.delivery
    if (delivery !== undefined) {
      if (delivery.status === 'sent') {
        sentCount++
        metas.push({ entityType: 'invoice', entityId: invoiceId, action: 'invoice.sent', after: { to: delivery.sends[0]?.to, atISO: args.atISO }, stampBookingId: null })
      } else if (delivery.status === 'toPost') {
        toPostCount++
        metas.push({ entityType: 'invoice', entityId: invoiceId, action: 'invoice.toPost', after: { address: delivery.address.join(', ') }, stampBookingId: null })
      } else {
        notSentCount++
        metas.push({ entityType: 'invoice', entityId: invoiceId, action: 'invoice.notSent', after: { reason: 'noAddress' }, stampBookingId: null })
      }
    }
  })

  return { counters, invoices, invoiceLines, cases, invoiceIds, metas, sentCount, toPostCount, notSentCount }
}
