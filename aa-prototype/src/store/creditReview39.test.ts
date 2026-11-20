/**
 * Catch-up Phase 39's review fixes (store and domain): a credit waits while
 * Xero holds money the ledger has not recorded; a payout on a credited pair is
 * flagged, not retried for ever; a credit of an invoice covering several
 * Procedures leaves each its replacement; a retried correction never mirrors
 * a credited pair; the run never leaves a credit note number gap; the
 * Booking's History shows the credit.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completeAnswered } from '../test/completeAnswered'
import { createAppStore, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { runBillingForList, wireBillingRun } from './billingRun'
import { deliverPaymentWebhook, receivePayment } from './paymentActions'
import { correctionQueuedFor, ledgerPositionOf, openXeroDivergences, pairForInvoice } from './ledgerSelectors'
import { approveProcedureEvent, liveInvoiceForProcedure, liveInvoicesForProcedure, runEventInvoicing, type EventRunWork } from './procedureEventActions'
import {
  bookingHistoryEntries,
  bookingHistoryEntityIds,
  creditOptionFor,
  creditRefusalFor,
  issueCreditInto,
  procedureOwnerSurname,
  replacementsOf,
  splitPartOf,
  splitTargetFor,
  submitCredit,
  type CreditInput,
  type CreditRunDraft,
} from './creditActions'
import { handoffCorrection } from './xeroHandoff'
import { processXeroQueue, setXeroOutage } from './xeroQueue'
import { armHandoffFault } from './demoSettingsActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { approveAndPayPairForDemo } from './payablesActions'
import { proceduresForBooking } from './selectors'
import { clockISO, type Actor } from './mutate'
import { ANAE, SEED_MARKERS } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { eventStatus } from '../domain/billing/procedureEvent'
import { CREDIT_SYNC_MESSAGES } from '../shared/procedureEventCopy'
import { AUDIT_VIEWER_EXCLUDED } from '../shared/audit'
import type { AppState } from './appStore'
import type { Invoice } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SHARMA_TUE14 = projectedListId(ANAE.sharma, '2026-07-14', 'AM')

let api: BoundAppStore
let unwire: () => void
beforeEach(() => {
  api = createAppStore()
  unwire = wireBillingRun(api)
})
afterEach(() => unwire())

/** Dr Sharma's Tue 14 Jul AM List authorised; its first live invoice. */
function stage(): Invoice {
  const owner: Actor = { who: 'Dr Sharma', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === SHARMA_TUE14 && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[SHARMA_TUE14]!.state === 'ACTIVE') submitList(api, owner, SHARMA_TUE14)
  const out = authoriseList(api, OFFICE, SHARMA_TUE14)
  if (!out.ok) throw new Error(out.message)
  const b = Object.values(api.getState().schedule.bookings).find((x) => x.listId === SHARMA_TUE14 && x.cancellation === undefined)!
  const procedureId = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === b.id)!.id
  return liveInvoiceForProcedure(api.getState(), procedureId)!
}

/** The Holt Booking (S3): P0022 and P0023 share one invoice once its List is billed. */
function stageHolt() {
  const bookingId = SEED_MARKERS['splitBillingBooking']!.entityId
  const listId = api.getState().schedule.bookings[bookingId]!.listId
  if (api.getState().schedule.lists[listId]!.state === 'ACTIVE') submitList(api, OFFICE, listId)
  const out = authoriseList(api, OFFICE, listId)
  if (!out.ok) throw new Error(out.message)
  if (Object.values(api.getState().billing.invoices).every((i) => i.bookingId !== bookingId)) runBillingForList(api, listId)
  const [p1, p2] = proceduresForBooking(api.getState(), bookingId)
  const original = liveInvoiceForProcedure(api.getState(), p2!.id)!
  return { bookingId, p1: p1!.id, p2: p2!.id, original }
}

const rebill = (unitAmount: number, description = 'Corrected') => ({ occurredOnISO: '2026-07-21', party: { sameAs: true as const }, lines: [{ description, quantity: 1, unitAmount }] })

function submitAndApprove(input: CreditInput): string {
  const sub = submitCredit(api, OFFICE, input)
  if (!sub.ok) throw new Error(sub.message)
  const appr = approveProcedureEvent(api, OFFICE, sub.value.creditEventId)
  if (!appr.ok) throw new Error(appr.message)
  return sub.value.creditEventId
}

function run() {
  const out = runEventInvoicing(api, OFFICE)
  if (!out.ok) throw new Error(out.message)
  return out.value
}

describe('a credit waits while Xero holds money the ledger has not recorded (finding 1)', () => {
  it('a payout made in Xero with its webhook missed: the run skips the credit, leaves it approved, and issues it once the poll records the payout', () => {
    const original = stage()
    const pair = pairForInvoice(api.getState(), original.id)!
    expect(receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: original.total, idempotencyKey: 'paid', source: 'webhook' }).ok).toBe(true)
    // (catch-up Phase 39a: paid as an approved one-line run, in Xero, its webhook missed.)
    expect(approveAndPayPairForDemo(api, OFFICE, pair.id, { webhook: 'missed' }).ok).toBe(true)
    const creditEventId = submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [] })

    const waiting = runEventInvoicing(api, OFFICE)
    expect(waiting).toMatchObject({ ok: false, message: CREDIT_SYNC_MESSAGES.waitingForXeroSync })
    expect(eventStatus(api.getState().schedule.procedureEvents[creditEventId]!)).toBe('approved')
    // Set aside the seed's own credit, Heather Sinclair's (`HS` ids, catch-up Phase 40, D24).
    expect(Object.keys(api.getState().billing.creditNotes).filter((id) => !id.startsWith('HS'))).toEqual([])

    expect(runReconciliationPoll(api).disbursements).toBe(1)
    const issued = run()
    const note = api.getState().billing.creditNotes[issued.creditNoteIds[0]!]!
    const negative = api.getState().billing.negativeInvoices[note.negativeInvoiceId!]!
    const paidOut = pairForInvoice(api.getState(), original.id)!.payable!.disbursedAmount
    expect(paidOut).toBeGreaterThan(0)
    // Nothing lost: the whole payout is to net.
    expect(negative).toMatchObject({ status: 'toNet', recoveryDue: paidOut })
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
  })

  it('a payment that landed in Xero during an outage before the credit: the run waits, then holds it for the payer', () => {
    const original = stage()
    const accRecId = pairForInvoice(api.getState(), original.id)!.receivable.xeroAccRecId!
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    expect(deliverPaymentWebhook(api, { accRecId, amount: 30, idempotencyKey: 'early' })).toMatchObject({ ok: true, value: { queued: true } })
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [] })
    expect(runEventInvoicing(api, OFFICE)).toMatchObject({ ok: false, message: CREDIT_SYNC_MESSAGES.waitingForXeroSync })

    expect(setXeroOutage(api, OFFICE, false).ok).toBe(true)
    expect(pairForInvoice(api.getState(), original.id)!.receivable.receivedAmount).toBe(30)
    const issued = run()
    const note = api.getState().billing.creditNotes[issued.creditNoteIds[0]!]!
    expect(note.reversal.heldForPayer).toBe(30)
    expect(openXeroDivergences(api.getState())).toEqual([])
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
  })

  it('a bill payment synced onto a pair already credited (a sync left from before the wait): the disbursementSync flags it and is done, never retried for ever', () => {
    const original = stage()
    const pair = pairForInvoice(api.getState(), original.id)!
    const accPayId = pair.payable!.xeroAccPayId!
    receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: original.total, idempotencyKey: 'paid', source: 'webhook' })
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    // Xero pays the bill during the outage: its webhook waits in the queue as a disbursementSync.
    const paid = approveAndPayPairForDemo(api, OFFICE, pair.id, { webhook: 'deliver' })
    const amount = paid.ok ? paid.value.totalPaid : 0
    expect(amount).toBeGreaterThan(0)
    const before = api.getState()
    const sync = Object.values(before.billing.xeroQueue).find((q) => q.kind === 'disbursementSync')!
    const bill = before.xero.disbursements[sync.target.xeroDisbursementId!]!
    const accPay = before.xero.accPays[accPayId]!
    // The state a credit issued before the wait existed would leave: hide the payout (and, since catch-up Phase 39a, the
    // payment run that paid it, which did not exist then) while the credit issues, then put them back.
    const runId = paid.ok ? paid.value.payablesRunId! : ''
    const payingRun = before.billing.payablesRuns[runId]!
    api.setState((s) => {
      const { [sync.id]: _q, ...xeroQueue } = s.billing.xeroQueue
      const { [bill.id]: _d, ...disbursements } = s.xero.disbursements
      const { [runId]: _r, ...payablesRuns } = s.billing.payablesRuns
      return { billing: { ...s.billing, xeroQueue, payablesRuns }, xero: { ...s.xero, disbursements, accPays: { ...s.xero.accPays, [accPayId]: { ...accPay, amountDisbursed: 0, status: 'authorised' } } } }
    })
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [] })
    run()
    api.setState((s) => ({ billing: { ...s.billing, xeroQueue: { ...s.billing.xeroQueue, [sync.id]: sync }, payablesRuns: { ...s.billing.payablesRuns, [runId]: payingRun } }, xero: { ...s.xero, disbursements: { ...s.xero.disbursements, [bill.id]: bill }, accPays: { ...s.xero.accPays, [accPayId]: accPay } } }))

    expect(setXeroOutage(api, OFFICE, false).ok).toBe(true)
    const s = api.getState()
    expect(Object.values(s.billing.xeroQueue).filter((q) => q.status !== 'sent')).toEqual([])
    expect(openXeroDivergences(s).map((d) => [d.kind, d.leg, d.xeroShows.total])).toEqual([['paidAfterCredit', 'payable', amount]])
    expect(Object.values(s.billing.disbursements).some((d) => d.idempotencyKey === bill.idempotencyKey)).toBe(false)
    expect(ledgerPositionOf(s).imbalance).toBe(0)
    // Flagged once: the poll does not raise it again.
    expect(runReconciliationPoll(api).divergences).toBe(0)
  })
})

describe('a credit of an invoice that covers several Procedures (finding 2, the Holt Booking)', () => {
  it('raised from the second Procedure: the credit sits on it, the replacement carries both, and both Procedures find it', () => {
    const { p1, p2, original } = stageHolt()
    expect(original.procedureIds).toEqual([p1, p2])
    const sub = submitCredit(api, OFFICE, { invoiceId: original.id, procedureId: p2, reason: 'Wrong amount', cause: 'correction', replacements: [rebill(100)] })
    if (!sub.ok) throw new Error(sub.message)
    expect(api.getState().schedule.procedureEvents[sub.value.creditEventId]!.procedureId).toBe(p2)
    expect(approveProcedureEvent(api, OFFICE, sub.value.creditEventId).ok).toBe(true)
    const issued = run()
    const replacement = api.getState().billing.invoices[issued.invoiceIds[0]!]!
    expect(replacement.procedureIds).toEqual([p1, p2])
    for (const procedureId of [p1, p2]) {
      expect(liveInvoiceForProcedure(api.getState(), procedureId)?.id).toBe(replacement.id)
      expect(liveInvoicesForProcedure(api.getState(), procedureId).map((i) => i.id)).toEqual([replacement.id])
      expect(creditOptionFor(api.getState(), { role: 'office' }, procedureId)).toEqual({ kind: 'enabled', invoiceId: replacement.id, invoiceIds: [replacement.id] })
      expect(splitTargetFor(api.getState(), procedureId)?.id).toBe(replacement.id)
    }
  })

  it('a replacement stored with one Procedure only (before this fix) is still found from the other through its lineage', () => {
    const { p1, p2, original } = stageHolt()
    submitAndApprove({ invoiceId: original.id, procedureId: p2, reason: 'Wrong amount', cause: 'correction', replacements: [rebill(100)] })
    const replacementId = run().invoiceIds[0]!
    api.setState((s) => ({ billing: { ...s.billing, invoices: { ...s.billing.invoices, [replacementId]: { ...s.billing.invoices[replacementId]!, procedureIds: [p2] } } } }))
    expect(liveInvoiceForProcedure(api.getState(), p1)?.id).toBe(replacementId)
    expect(creditRefusalFor(api.getState(), { role: 'office' }, replacementId, 'correction', { procedureId: p1 })).toBeNull()
  })
})

describe('a Procedure with several live invoices (finding 5, 22 fee split)', () => {
  it('liveInvoicesForProcedure lists the standard invoices and the live replacements, by number', () => {
    const inv = (id: string, invoiceNumber: string, over: Partial<Invoice> = {}) => ({ id, invoiceNumber, kind: 'standard', procedureIds: ['P1'], ...over }) as Invoice
    const state = {
      billing: {
        invoices: {
          I2: inv('I2', 'AA-2026-0002'),
          I1: inv('I1', 'AA-2026-0001'),
          R1: inv('R1', 'AA-2026-0009', { kind: 'additional', procedureIds: ['P9'], lineage: [{ role: 'rebillOf', invoiceId: 'I1' }] }),
          X: inv('X', 'AA-2026-0003', { procedureIds: ['P2'] }),
        },
        creditNotes: { CN1: { id: 'CN1', originalInvoiceId: 'I1' } },
      },
    } as unknown as Pick<AppState, 'billing'>
    expect(liveInvoicesForProcedure(state, 'P1').map((i) => i.id)).toEqual(['I2', 'R1'])
  })
})

describe('a retried correction never mirrors a credited pair (finding 3)', () => {
  it('correction 1 faulted, its replacement credited by correction 2: 2 queues behind 1, and the credited replacement never reaches Xero as open', () => {
    const original = stage()
    armHandoffFault(api, OFFICE)
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [rebill(200)] })
    const first = run()
    const r1 = first.invoiceIds[0]!
    expect(correctionQueuedFor(api.getState(), first.creditNoteIds[0]!)).toBeDefined()

    submitAndApprove({ invoiceId: r1, reason: 'Wrong again', cause: 'correction', replacements: [rebill(150)] })
    const second = run()
    const noteId = second.creditNoteIds[0]!
    expect(correctionQueuedFor(api.getState(), noteId)).toBeDefined()
    expect(api.getState().billing.creditNotes[noteId]!.xeroFailure).toEqual({ code: 'waitingForOriginal', message: CREDIT_SYNC_MESSAGES.waitingForOriginal })

    processXeroQueue(api, { force: true })
    const s = api.getState()
    expect(Object.values(s.billing.xeroQueue).filter((q) => q.status !== 'sent')).toEqual([])
    expect(pairForInvoice(s, r1)!.receivable.xeroAccRecId).toBeUndefined()
    expect(Object.values(s.xero.accRecs).filter((r) => r.invoiceId === r1)).toEqual([])
    expect(pairForInvoice(s, second.invoiceIds[0]!)!.receivable.xeroAccRecId).toBeDefined()
    expect(s.billing.creditNotes[noteId]!.xeroFailure).toBeUndefined()
    expect(ledgerPositionOf(s).imbalance).toBe(0)
  })

  it('a correction Xero refuses while available is queued with its reason, never left silently stuck', () => {
    const original = stage()
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [rebill(200)] })
    const out = run()
    const noteId = out.creditNoteIds[0]!
    const item = correctionQueuedFor(api.getState(), noteId)!
    // Xero back, the queued call cleared, and the replacement's invoice gone, so the correction cannot be made.
    api.setState((s) => {
      const { [out.invoiceIds[0]!]: _gone, ...invoices } = s.billing.invoices
      const { xeroOutage: _off, ...settings } = s.settings
      return { settings, billing: { ...s.billing, invoices, xeroQueue: { ...s.billing.xeroQueue, [item.id]: { ...item, status: 'sent', sentAtISO: clockISO(s.clock) } } } }
    })
    const handed = handoffCorrection(api, noteId)
    expect(handed).toMatchObject({ ok: true, value: { queued: true } })
    expect(api.getState().billing.creditNotes[noteId]!.xeroFailure).toEqual({ code: 'noInvoice', message: 'The pair invoice was not found.' })
    expect(correctionQueuedFor(api.getState(), noteId)).toMatchObject({ lastError: 'The pair invoice was not found.' })
  })
})

describe('the run never leaves a credit note number gap (finding 7)', () => {
  it('a credit refused inside the commit takes no counter', () => {
    const original = stage()
    const creditEventId = submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [] })
    const s = api.getState()
    const pairId = pairForInvoice(s, original.id)!.id
    // The working ledger already holds the pair credited (as a second credit in the same commit would find it).
    const credited = { ...s.billing.ledger[pairId]!, credit: { creditNoteId: 'CNX', negativeInvoiceId: 'NIX', atISO: clockISO(s.clock), heldForPayer: 0, recoveryDue: 0 } }
    const work: EventRunWork = {
      counters: s.counters,
      maps: { invoices: { ...s.billing.invoices }, invoiceLines: { ...s.billing.invoiceLines }, ledger: { ...s.billing.ledger, [pairId]: credited as never } },
      procedureEvents: { ...s.schedule.procedureEvents },
      metas: [],
    }
    const draft: CreditRunDraft = { ...work, s, creditNotes: {}, negativeInvoices: {} }
    expect(issueCreditInto(draft, creditEventId, clockISO(s.clock))).toMatchObject({ ok: false })
    expect(draft.counters).toBe(s.counters)
  })
})

describe('the moved and new selectors (finding 7)', () => {
  it('splitPartOf numbers a split\'s components; procedureOwnerSurname titles the owner', () => {
    const original = stage()
    const procedureId = original.procedureIds![0]!
    expect(procedureOwnerSurname(api.getState(), procedureId)).toBe('Dr Sharma')
    expect(procedureOwnerSurname(api.getState(), 'nope')).toBeUndefined()
    submitAndApprove({ invoiceId: original.id, reason: 'Split', cause: 'split', replacements: [rebill(100, 'a'), rebill(Math.round((original.subtotal - 100) * 100) / 100, 'b')] })
    run()
    const [a, b] = replacementsOf(api.getState(), original.id)
    expect(splitPartOf(api.getState(), a!.id, original.id)).toEqual({ part: 1, of: 2 })
    expect(splitPartOf(api.getState(), b!.id, original.id)).toEqual({ part: 2, of: 2 })
  })
})

describe("the Booking's History shows its credit (finding 8)", () => {
  it('bookingHistoryEntries holds the credit, its credit note and the credited invoice, never a money-moving entry', () => {
    const original = stage()
    const pair = pairForInvoice(api.getState(), original.id)!
    receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: 10, idempotencyKey: 'part', source: 'webhook' })
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [rebill(150)] })
    const out = run()
    const ids = bookingHistoryEntityIds(api.getState(), original.bookingId)
    expect(ids).toEqual(expect.arrayContaining([original.bookingId, original.id, out.invoiceIds[0]!, out.creditNoteIds[0]!]))
    const entries = bookingHistoryEntries(api.getState(), original.bookingId)
    const actions = new Set(entries.map((e) => e.action))
    for (const action of ['credit.submitted', 'credit.approved', 'invoice.credited', 'creditNote.create', 'invoice.rebilled', 'negativeInvoice.create']) expect(actions, action).toContain(action)
    for (const excluded of AUDIT_VIEWER_EXCLUDED) expect(actions.has(excluded), excluded).toBe(false)
    // Newest first.
    expect(entries.map((e) => e.atISO)).toEqual([...entries.map((e) => e.atISO)].sort().reverse())
  })
})
