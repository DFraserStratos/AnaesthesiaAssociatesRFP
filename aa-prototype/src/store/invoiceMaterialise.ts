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
 * Each invoice's ledger pair is made here, in the caller's same mutate
 * (catch-up Phase 36; US-08.3.1): before and independent of the Xero hand-off,
 * so an invoice is never without its pair. A procedure invoice's payable is to
 * the locked payee; a prepayment's to the AA Holding account.
 *
 * AA fee invoices (Phase 16) never come through here: they are AA's own.
 */

import type { Invoice, InvoiceApproval, InvoiceId, InvoiceLine, InvoiceLineage, LedgerPair } from '../domain/types'
import { anaesthetistPayee, HOLDING_PAYEE, newBookingPair } from '../domain/billing/ledger'
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
  createAction: 'invoice.create' | 'invoice.prePaymentApproved' | 'invoice.prePaymentAutoSent' | 'invoice.additionalCreated'
  /** More fields for the create entry's `after` (an additional invoice's original, Procedure, lines and raiser; catch-up Phase 38b). */
  createAfter?: Record<string, unknown>
  /** Links beyond a split's siblings (an additional invoice's `additionalTo`, catch-up Phase 38b). */
  lineage?: InvoiceLineage[]
  /** The event an additional invoice is raised from (catch-up Phase 38b). */
  eventId?: string
  /** A prepayment invoice's approval stamp (catch-up Phase 27). */
  approval?: InvoiceApproval
  /** The locked payee (catch-up Phase 25): the supplier block and each pair's payee. Absent on a pre-payment, whose payable is to the AA Holding account. */
  payee?: LockedPayee
  /** False leaves the anaesthetist off the invoice (a pre-payment's `PREPAYMENT_NAMES_ANAESTHETIST`, OQ-120). */
  namesSupplier?: boolean
}

export interface MaterialiseResult {
  counters: Record<string, number>
  invoices: Record<string, Invoice>
  invoiceLines: Record<string, InvoiceLine>
  ledger: Record<string, LedgerPair>
  invoiceIds: InvoiceId[]
  /** The ledger pairs made, one per invoice. */
  pairIds: string[]
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
  maps: Pick<MaterialiseResult, 'invoices' | 'invoiceLines' | 'ledger'> = {
    invoices: { ...s.billing.invoices },
    invoiceLines: { ...s.billing.invoiceLines },
    ledger: { ...s.billing.ledger },
  },
): MaterialiseResult {
  const { invoices, invoiceLines, ledger } = maps
  const booking = s.schedule.bookings[args.bookingId]
  const list = booking !== undefined ? s.schedule.lists[booking.listId] : undefined
  const patient = booking !== undefined ? s.masters.patients[booking.patientId] : undefined
  // A pre-payment is generated on approval, before any lock: it names the List's anaesthetist (catch-up Phase 27; its payable credits the AA Holding account).
  const anaesthetist = args.payee === undefined && list?.anaesthetistId !== undefined ? s.masters.anaesthetists[list.anaesthetistId] : undefined
  const supplier = args.namesSupplier === false ? undefined : (args.payee?.supplier ?? (anaesthetist !== undefined ? supplierFor(anaesthetist) : undefined))

  const invoiceIds: InvoiceId[] = []
  const pairIds: string[] = []
  const metas: MutationMeta[] = []
  let sentCount = 0
  let toPostCount = 0
  let notSentCount = 0

  // Ids first, so a split's shares can point at each other.
  const allocated = drafts.map(() => {
    const bc = allocateId(counters, 'ledgerPair')
    counters = bc.counters
    const caseId = bc.id
    const inv = allocateId(counters, 'invoice')
    counters = inv.counters
    const num = allocateId(counters, 'invoiceNumber')
    counters = num.counters
    return { caseId, invoiceId: inv.id, invoiceNumber: num.id }
  })

  drafts.forEach((draft, index) => {
    const { caseId, invoiceId, invoiceNumber } = allocated[index]!
    const lineage: InvoiceLineage[] = [
      ...(draft.splitSiblings ?? []).flatMap((i) => {
        const sibling = allocated[i]
        return sibling !== undefined ? [{ role: 'otherShareOfSplit' as const, invoiceId: sibling.invoiceId }] : []
      }),
      ...(args.lineage ?? []).map((l) => ({ ...l })),
    ]
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      caseReference: caseId,
      bookingId: args.bookingId,
      counterparty: draft.counterparty,
      ...(draft.billedTo !== undefined ? { billedTo: draft.billedTo } : {}),
      layout: draft.layout,
      kind: args.kind,
      ...(args.eventId !== undefined ? { eventId: args.eventId } : {}),
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
      if (line.quantity !== undefined) stored.quantity = line.quantity
      if (line.unitAmount !== undefined) stored.unitAmount = line.unitAmount
      invoiceLines[il.id] = stored
    }
    // The ledger pair, made with the invoice (US-08.3.1): the payee stamped from the lock, or the AA Holding
    // account on a prepayment (D38); never re-derived and never changed.
    const payee = args.kind === 'prePayment' ? HOLDING_PAYEE : args.payee !== undefined ? anaesthetistPayee(args.payee.anaesthetistId) : undefined
    if (payee !== undefined && booking !== undefined) {
      const pair = newBookingPair({ id: caseId, kind: args.kind === 'prePayment' ? 'prePayment' : 'procedure', invoice, lines: draft.lines, bookingId: args.bookingId, listId: booking.listId, payee, patientId: booking.patientId, atISO: args.atISO })
      ledger[caseId] = pair
      pairIds.push(caseId)
      metas.push({
        entityType: 'ledgerPair',
        entityId: caseId,
        action: 'ledger.pairCreated',
        after: {
          kind: pair.kind,
          bookingId: args.bookingId,
          invoiceNumber: pair.receivable.number,
          ...(pair.payable !== undefined ? { payableNumber: pair.payable.number } : {}),
          amount: pair.receivable.amount,
          payee: pair.payable === undefined ? null : pair.payable.payee.kind === 'holding' ? 'AA Holding account' : pair.payable.payee.anaesthetistId,
        },
        stampBookingId: null,
      })
    }
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
        ...(args.createAfter ?? {}),
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

  return { counters, invoices, invoiceLines, ledger, invoiceIds, pairIds, metas, sentCount, toPostCount, notSentCount }
}
