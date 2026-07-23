/**
 * The billing run (Phase 08) — the RFP's Billing Engine Integration Point.
 *
 * It acts on a single event, a List reaching AUTHORISED, and consumes the
 * whole List as a unit: iterate Cards and Procedures, resolve the counterparty
 * per Procedure, rate via the Phase 01 calculator, group by counterparty per
 * Card into Invoices (+ a BillingCase each), and stamp `List.billedAtISO`.
 *
 * `billedAtISO` = COMPLETION OF THE LIST'S BILLING RUN (§11 labelled reading;
 * 3rd review #12): it is what removes the List from the anaesthetist's views.
 * A per-card exception does not hold the List on screen (its invoice lands on
 * retry via the Phase 09 monitor), and a Xero handoff failure (Phase 10) does
 * not restore visibility.
 *
 * The whole run commits atomically through ONE `mutate()` — invoices, lines,
 * cases, the billedAt stamp and every audit entry land together, with
 * source=system ("audit trails of manual and automated actions are required").
 *
 * Wiring: `wireBillingRun(useAppStore)` is called once at app bootstrap
 * (main.tsx). The event emitter is module-global, so the run re-checks the
 * List's state in ITS OWN store — the AUTHORISED + not-yet-billed guards make
 * a foreign store's emission a harmless no-op. Tests call `runBillingForList`
 * directly or wire explicitly and unsubscribe.
 */

import type { BillingCase, CardId, Invoice, InvoiceId, InvoiceLine } from '../domain/types'
import {
  buildInvoicesForCard,
  type CardBuildResult,
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
import { billingContextForCard, cardsForList, proceduresForCard } from './selectors'
import { onAppEvent } from './events'

const BILLING_RUN_ACTOR: Actor = { who: 'Billing run', role: 'system', source: 'system' }

export interface BillingRunException {
  cardId: CardId
  code: string
  message: string
  /** The Procedure that failed resolution, when the failure is procedure-level. */
  procedureId?: string
}

export interface BillingRunResult {
  invoiceIds: InvoiceId[]
  exceptions: BillingRunException[]
}

/**
 * Run billing for one AUTHORISED, not-yet-billed List. Idempotent by the
 * `alreadyBilled` guard — one run per List, ever (retries of failed Cards are
 * the Phase 09 monitor's job, against the stored BillingCase).
 */
export function runBillingForList(api: AppStoreApi, listId: string): Outcome<BillingRunResult> {
  const state = api.getState()
  const list = state.schedule.lists[listId]
  if (list === undefined) return refuse('notFound', 'List not found.')
  if (list.state !== 'AUTHORISED') {
    return refuse('listNotAuthorised', 'Only an authorised List can be billed.')
  }
  if (list.billedAtISO !== undefined) {
    return refuse('alreadyBilled', 'This List has already completed its billing run.')
  }

  // Decide everything first (pure), then commit once. Cancelled Cards are
  // retained but excluded from billing entirely.
  const cards = cardsForList(state, listId).filter((c) => c.cancellation === undefined)
  const built: { cardId: CardId; result: CardBuildResult }[] = cards.map((card) => {
    const cardCtx = billingContextForCard(state, card)
    if (cardCtx === undefined) {
      return {
        cardId: card.id,
        result: {
          kind: 'exception',
          procedureId: '',
          code: 'noContext',
          message: 'Billing context could not be assembled for this Card.',
        },
      }
    }
    const buildCtx: InvoiceBuildContext = {
      ...cardCtx,
      listDateISO: list.dateISO,
      patientId: card.patientId,
      ...(list.hospitalId !== undefined ? { listHospitalId: list.hospitalId } : {}),
    }
    // Per-card isolation is absolute: a build error becomes a failed
    // BillingCase, never a throw — the run executes inside authoriseList's
    // event emit, and a throw there would strand the List AUTHORISED-unbilled
    // with the authorise already committed (8th review).
    try {
      return {
        cardId: card.id,
        result: buildInvoicesForCard(card, proceduresForCard(state, card.id), buildCtx),
      }
    } catch (error) {
      return {
        cardId: card.id,
        result: {
          kind: 'exception',
          procedureId: '',
          code: 'runError',
          message: error instanceof Error ? error.message : 'The billing run failed on this Card.',
        },
      }
    }
  })

  const invoiceIds: InvoiceId[] = []
  const exceptions: BillingRunException[] = []
  const metas: MutationMeta[] = []

  mutate(api, BILLING_RUN_ACTOR, metas, (s) => {
    let counters = s.counters
    const invoices = { ...s.billing.invoices }
    const invoiceLines = { ...s.billing.invoiceLines }
    const cases = { ...s.billing.cases }
    const atISO = clockISO(s.clock)

    for (const { cardId, result } of built) {
      if (result.kind === 'exception') {
        const bc = allocateId(counters, 'billingCase')
        counters = bc.counters
        const procedureId = result.procedureId !== '' ? result.procedureId : undefined
        // The failure lives ON the case — the system of record Phase 09's
        // monitor retries against; the audit entry is the history.
        cases[bc.id] = {
          id: bc.id,
          cardId,
          status: 'failed',
          failure: {
            code: result.code,
            message: result.message,
            ...(procedureId !== undefined ? { procedureId } : {}),
          },
        } satisfies BillingCase
        exceptions.push({
          cardId,
          code: result.code,
          message: result.message,
          ...(procedureId !== undefined ? { procedureId } : {}),
        })
        metas.push({
          entityType: 'card',
          entityId: cardId,
          action: 'card.billingException',
          after: {
            billingCaseId: bc.id,
            code: result.code,
            message: result.message,
            ...(procedureId !== undefined ? { procedureId } : {}),
          },
          stampCardId: null, // AUTHORISED Cards are locked; billing never stamps them
        })
        continue
      }

      const cardInvoiceIds: InvoiceId[] = []
      for (const draft of result.invoices) {
        const bc = allocateId(counters, 'billingCase')
        counters = bc.counters
        const inv = allocateId(counters, 'invoice')
        counters = inv.counters
        const num = allocateId(counters, 'invoiceNumber')
        counters = num.counters

        // The BillingCase id doubles as the internal CaseReference (links the
        // invoice back to its Card; display-only, never the remittance key).
        const invoice: Invoice = {
          id: inv.id,
          invoiceNumber: num.id,
          caseReference: bc.id,
          cardId,
          counterparty: draft.counterparty,
          layout: draft.layout,
          kind: 'standard',
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
        cases[bc.id] = { id: bc.id, cardId, invoiceId: inv.id, status: 'invoiced' } satisfies BillingCase
        cardInvoiceIds.push(inv.id)
        metas.push({
          entityType: 'invoice',
          entityId: inv.id,
          action: 'invoice.create',
          after: {
            invoiceNumber: num.id,
            caseReference: bc.id,
            cardId,
            counterparty: draft.counterparty,
            subtotal: draft.subtotal,
            gst: draft.gst,
            total: draft.total,
          },
          stampCardId: null,
        })
      }

      invoiceIds.push(...cardInvoiceIds)
      metas.push({
        entityType: 'card',
        entityId: cardId,
        action: 'card.billed',
        after: { invoiceIds: cardInvoiceIds },
        stampCardId: null,
      })
    }

    metas.push({
      entityType: 'list',
      entityId: listId,
      action: 'list.billed',
      after: { billedAtISO: atISO, invoiceCount: invoiceIds.length, exceptionCount: exceptions.length },
      stampCardId: null,
    })

    return {
      billing: { invoices, invoiceLines, cases },
      schedule: {
        ...s.schedule,
        // Re-read from `s`, not the pre-run closure: if another listAuthorised
        // listener ever writes the List before this one runs, its write must
        // not be clobbered (guards make `?? list` unreachable in practice).
        lists: { ...s.schedule.lists, [listId]: { ...(s.schedule.lists[listId] ?? list), billedAtISO: atISO } },
      },
      counters,
    }
  })

  return ok({ invoiceIds, exceptions })
}

/**
 * Mark an invoice emailed (the RFP: invoices are "printed" and emailed from
 * the Billing Engine — the demo marks the send and badges it as simulated).
 * Direct-claim insurer invoices are refused: nib presentation runs through
 * their upload portal instead.
 */
export function markInvoiceEmailed(api: AppStoreApi, actor: Actor, invoiceId: string): Outcome {
  const state = api.getState()
  const invoice = state.billing.invoices[invoiceId]
  // Guard order per the lifecycle convention (authoriseList): entity, then its
  // intrinsic/state facts, then the actor's role.
  if (invoice === undefined) return refuse('notFound', 'Invoice not found.')
  if (invoice.counterparty.kind === 'insurer') {
    return refuse(
      'uploadPortal',
      'Direct claim insurer invoices are presented via the insurer upload portal, not emailed.',
    )
  }
  if (invoice.emailedAtISO !== undefined) {
    return refuse('alreadyEmailed', 'This invoice has already been marked emailed.')
  }
  if (actor.role !== 'office') {
    return refuse('officeOnly', 'Only the office can mark an invoice emailed.')
  }

  const emailedAtISO = clockISO(state.clock)
  mutate(
    api,
    actor,
    {
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'invoice.email',
      after: { emailedAtISO },
      stampCardId: null,
    },
    (s) => ({
      billing: {
        ...s.billing,
        invoices: { ...s.billing.invoices, [invoiceId]: { ...invoice, emailedAtISO } },
      },
    }),
  )
  return ok(undefined)
}

/**
 * Subscribe the billing run to `listAuthorised` for one store. Call once at
 * app bootstrap for the singleton; returns the unsubscribe (tests use it).
 */
export function wireBillingRun(api: AppStoreApi): () => void {
  return onAppEvent((event) => {
    if (event.type === 'listAuthorised') runBillingForList(api, event.listId)
  })
}
