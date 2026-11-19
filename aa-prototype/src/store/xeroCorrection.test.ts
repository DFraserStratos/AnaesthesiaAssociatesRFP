/**
 * The Xero correction, together (catch-up Phase 39, work item 6): the
 * reversal and the replacements' pairs in one commit, through 37's gate and
 * queue (the armed fault and the outage), its retry idempotent, and the
 * guards elsewhere (payments, payables, the hand-off) on a credited invoice.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completeAnswered } from '../test/completeAnswered'
import { createAppStore, type AppState, type BoundAppStore } from './appStore'
import { authoriseList, submitList } from './lifecycle'
import { wireBillingRun } from './billingRun'
import { deliverPaymentWebhook, receivePayment } from './paymentActions'
import { approveAndPayPairForDemo, disbursePayable, payablesDue, runPayables, runThisWeeksCycle } from './payablesActions'
import { correctionQueuedFor, handoffQueuedFor, ledgerPositionOf, openXeroDivergences, pairForInvoice } from './ledgerSelectors'
import { approveProcedureEvent, liveInvoiceForProcedure, runEventInvoicing } from './procedureEventActions'
import { submitCredit, type CreditInput } from './creditActions'
import { createXeroCorrection, handoffCorrection, handoffPair } from './xeroHandoff'
import { processXeroQueue, retryXeroItemNow, setXeroOutage } from './xeroQueue'
import { armHandoffFault } from './demoSettingsActions'
import { runReconciliationPoll } from './reconciliationPoll'
import { payBillsInXero, XERO_PAYABLES_ACTOR } from './xeroSimActions'
import type { Actor } from './mutate'
import { ANAE } from '../domain/seed'
import { projectedListId } from '../domain/slots'
import { CREDIT_MESSAGES } from '../shared/procedureEventCopy'
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

function stage(): Invoice {
  const owner: Actor = { who: api.getState().masters.anaesthetists[ANAE.sharma]!.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.sharma }
  for (const b of Object.values(api.getState().schedule.bookings).filter((x) => x.listId === SHARMA_TUE14 && x.cancellation === undefined)) completeAnswered(api, owner, b.id)
  if (api.getState().schedule.lists[SHARMA_TUE14]!.state === 'ACTIVE') submitList(api, owner, SHARMA_TUE14)
  const out = authoriseList(api, OFFICE, SHARMA_TUE14)
  if (!out.ok) throw new Error(out.message)
  const b = Object.values(api.getState().schedule.bookings).find((x) => x.listId === SHARMA_TUE14 && x.cancellation === undefined)!
  const procedureId = Object.values(api.getState().schedule.procedures).find((p) => p.bookingId === b.id)!.id
  return liveInvoiceForProcedure(api.getState(), procedureId)!
}

const line = (unitAmount: number, description = 'Corrected') => ({ occurredOnISO: '2026-07-15', party: { sameAs: true as const }, lines: [{ description, quantity: 1, unitAmount }] })

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

/** Record every committed state, to show what landed in one commit. */
function commits(): AppState[] {
  const seen: AppState[] = []
  api.subscribe((s) => seen.push(s))
  return seen
}

describe('the correction and the new pairs land in one commit', () => {
  for (const n of [1, 3]) {
    it(`${n} replacement${n === 1 ? '' : 's'}: the ACCREC credited, the ACCPAY voided and every new pair created together`, () => {
      const original = stage()
      const share = Math.floor((original.subtotal / n) * 100) / 100
      submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: Array.from({ length: n }, (_, i) => line(share, `Part ${i + 1}`)) })
      const states = commits()
      const out = run()
      const s = api.getState()
      const note = s.billing.creditNotes[out.creditNoteIds[0]!]!
      const accRecId = pairForInvoice(s, original.id)!.receivable.xeroAccRecId!
      const newPairs = out.invoiceIds.map((id) => pairForInvoice(s, id)!.id)
      expect(newPairs).toHaveLength(n)
      // The first commit where the ACCREC reads credited already holds every new pair's mirror.
      const landed = states.find((st) => st.xero.accRecs[accRecId]?.status === 'credited')!
      for (const id of newPairs) expect(landed.billing.ledger[id]!.receivable.xeroAccRecId, id).toBeDefined()
      // And not before it: the run's own commit made no mirror for them.
      const ran = states.find((st) => Object.keys(st.billing.creditNotes).length > 0)!
      for (const id of newPairs) expect(ran.billing.ledger[id]!.receivable.xeroAccRecId).toBeUndefined()
      expect(Object.values(s.xero.creditNotes).filter((c) => c.creditNoteId === note.id).map((c) => c.type)).toEqual(['ACCRECCREDIT'])
      // Handed off once: a second hand-off of the correction or of a new pair is a no-op.
      const before = JSON.stringify(s.xero)
      expect(handoffCorrection(api, note.id).ok).toBe(true)
      for (const id of newPairs) expect(handoffPair(api, id).ok).toBe(true)
      expect(JSON.stringify(api.getState().xero)).toBe(before)
      expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
    })
  }
})

describe('the fault path and its retry', () => {
  it('the armed fault queues the whole correction, records the failure on the credit note, and the retry reverses and re-creates together, once', () => {
    const original = stage()
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [line(100)] })
    expect(armHandoffFault(api, OFFICE).ok).toBe(true)
    const out = run()
    const s = api.getState()
    const note = s.billing.creditNotes[out.creditNoteIds[0]!]!
    const originalPair = pairForInvoice(s, original.id)!
    const newPair = pairForInvoice(s, out.invoiceIds[0]!)!
    // Nothing reversed or created in Xero; the failure on the credit note; the pairs read waiting for Xero.
    expect(note.xero).toBeUndefined()
    expect(note.xeroFailure).toMatchObject({ code: 'fault' })
    expect(s.xero.accRecs[originalPair.receivable.xeroAccRecId!]!.status).toBe('awaitingPayment')
    expect(newPair.receivable.xeroAccRecId).toBeUndefined()
    expect(Object.keys(s.xero.creditNotes)).toEqual([])
    const item = correctionQueuedFor(s, note.id)!
    expect(item).toMatchObject({ kind: 'correction', idempotencyKey: `CORRECTION-${note.id}`, target: { creditNoteId: note.id } })
    expect(handoffQueuedFor(s, newPair.id)?.id).toBe(item.id)
    expect(s.settings.failNextHandoff).toBe(false)
    // A hand-off of the new pair waits with its correction, never runs alone.
    expect(handoffPair(api, newPair.id)).toEqual({ ok: true, value: { queued: true } })

    // The monitor's Retry now: the correction lands, together, and the failure clears.
    expect(retryXeroItemNow(api, OFFICE, item.id)).toMatchObject({ ok: true, value: { sent: 1 } })
    const t = api.getState()
    const done = t.billing.creditNotes[note.id]!
    expect(done.xeroFailure).toBeUndefined()
    expect(done.xero).toMatchObject({ accPayVoided: true })
    expect(t.xero.accRecs[originalPair.receivable.xeroAccRecId!]!.status).toBe('credited')
    expect(pairForInvoice(t, out.invoiceIds[0]!)!.receivable.xeroAccRecId).toBeDefined()
    // Idempotent: again, nothing more.
    const xero = JSON.stringify(t.xero)
    expect(createXeroCorrection(api, note.id).ok).toBe(true)
    expect(processXeroQueue(api, { force: true }).attempted).toBe(0)
    expect(JSON.stringify(api.getState().xero)).toBe(xero)
  })

  it('during an outage the correction waits in the queue and drains when Xero is back', () => {
    const original = stage()
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [line(100)] })
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    const out = run()
    const noteId = out.creditNoteIds[0]!
    expect(api.getState().billing.creditNotes[noteId]!.xeroFailure).toMatchObject({ code: 'outage' })
    expect(setXeroOutage(api, OFFICE, false).ok).toBe(true)
    expect(api.getState().billing.creditNotes[noteId]!.xero).toBeDefined()
    expect(pairForInvoice(api.getState(), out.invoiceIds[0]!)!.receivable.xeroAccRecId).toBeDefined()
  })

  it('an original never handed off: nothing to reverse, the new pairs created; its own hand-off then completes as a no-op', () => {
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    const original = stage()
    const originalPair = pairForInvoice(api.getState(), original.id)!
    expect(originalPair.receivable.xeroAccRecId).toBeUndefined()
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong billable party', cause: 'correction', replacements: [line(100)] })
    const out = run()
    // The credited original is never mirrored afterwards.
    expect(handoffPair(api, originalPair.id)).toMatchObject({ ok: false, code: 'invoiceCredited' })
    expect(setXeroOutage(api, OFFICE, false).ok).toBe(true)
    const s = api.getState()
    expect(pairForInvoice(s, original.id)!.receivable.xeroAccRecId).toBeUndefined()
    expect(s.billing.creditNotes[out.creditNoteIds[0]!]!.xero).toEqual({ accPayVoided: false })
    expect(Object.keys(s.xero.creditNotes)).toEqual([])
    expect(pairForInvoice(s, out.invoiceIds[0]!)!.receivable.xeroAccRecId).toBeDefined()
    expect(Object.values(s.billing.xeroQueue).every((q) => q.status === 'sent')).toBe(true)
  })
})

describe('the guards on a credited invoice', () => {
  it('a payment is refused (invoiceCredited), never held as an unmatched receipt', () => {
    const original = stage()
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [] })
    run()
    const accRecId = pairForInvoice(api.getState(), original.id)!.receivable.xeroAccRecId!
    const receipts = Object.keys(api.getState().billing.receipts).length
    expect(receivePayment(api, { accRecId, amount: 10, idempotencyKey: 'after', source: 'webhook' })).toEqual({ ok: false, code: 'invoiceCredited', message: CREDIT_MESSAGES.invoiceCredited })
    expect(deliverPaymentWebhook(api, { accRecId, amount: 10, idempotencyKey: 'after2' })).toMatchObject({ ok: false, code: 'invoiceCredited' })
    expect(Object.keys(api.getState().billing.receipts)).toHaveLength(receipts)
    expect(Object.values(api.getState().billing.unmatchedReceipts)).toEqual([])
  })

  it('the payables run, a single disbursement and Xero itself skip the reversed payable; a toNet negative invoice is left untouched', () => {
    const original = stage()
    const pair = pairForInvoice(api.getState(), original.id)!
    receivePayment(api, { accRecId: pair.receivable.xeroAccRecId!, amount: original.total, idempotencyKey: 'full', source: 'webhook' })
    // Paid in full and paid out by the payables run: the credit leaves the whole payable to net.
    // (catch-up Phase 39a: paid out as an approved one-line run for this pair, paid in Xero.)
    const paidOut = approveAndPayPairForDemo(api, OFFICE, pair.id)
    expect(paidOut.ok).toBe(true)
    const paidRunId = paidOut.ok ? paidOut.value.payablesRunId! : ''
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [] })
    const out = run()
    const negativeId = api.getState().billing.creditNotes[out.creditNoteIds[0]!]!.negativeInvoiceId!
    const negative = structuredClone(api.getState().billing.negativeInvoices[negativeId]!)
    expect(negative.status).toBe('toNet')
    // No negative leg reaches what is due on the pair.
    const due = payablesDue(api.getState(), { only: [pair.id] })
    expect([due.count, due.total]).toEqual([0, 0])
    const ledgerBefore = structuredClone(api.getState().billing.ledger[pair.id])
    // (catch-up Phase 39a: each payout path is refused rather than paying nothing; the reversed payable is never paid.)
    expect(runPayables(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingScheduled' })
    expect(runThisWeeksCycle(api, OFFICE)).toMatchObject({ ok: false, code: 'nothingDue' })
    expect(disbursePayable(api, OFFICE, pair.id)).toMatchObject({ ok: false, code: 'notApproved' })
    expect(approveAndPayPairForDemo(api, OFFICE, pair.id)).toMatchObject({ ok: false, code: 'nothingToApprove' })
    const accPayId = pair.payable!.xeroAccPayId!
    expect(payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId }], { webhook: 'deliver', runId: paidRunId })).toMatchObject({ ok: false, code: 'notApproved' })
    expect(api.getState().billing.ledger[pair.id]).toEqual(ledgerBefore)
    expect(api.getState().billing.negativeInvoices[negativeId]).toEqual(negative)
    expect(ledgerPositionOf(api.getState()).imbalance).toBe(0)
  })

  it('a payment that landed in Xero before the correction reached it is flagged, never applied to the ledger', () => {
    const original = stage()
    const accRecId = pairForInvoice(api.getState(), original.id)!.receivable.xeroAccRecId!
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [] })
    expect(setXeroOutage(api, OFFICE, true).ok).toBe(true)
    run()
    // Xero still shows the ACCREC open (the correction waits), so it takes the payment.
    expect(deliverPaymentWebhook(api, { accRecId, amount: 20, idempotencyKey: 'landed' })).toMatchObject({ ok: true, value: { queued: true } })
    const receipts = Object.keys(api.getState().billing.receipts).length
    expect(setXeroOutage(api, OFFICE, false).ok).toBe(true)
    const s = api.getState()
    expect(Object.keys(s.billing.receipts)).toHaveLength(receipts)
    expect(Object.values(s.billing.unmatchedReceipts)).toEqual([])
    expect(openXeroDivergences(s).map((d) => [d.kind, d.xeroShows.total])).toEqual([['paidAfterCredit', 20]])
    expect(Object.values(s.billing.xeroQueue).every((q) => q.status === 'sent')).toBe(true)
    expect(ledgerPositionOf(s).imbalance).toBe(0)
  })

  it('engine credits are never read as drift by the divergence check', () => {
    const original = stage()
    submitAndApprove({ invoiceId: original.id, reason: 'Wrong amount', cause: 'correction', replacements: [line(100)] })
    run()
    expect(runReconciliationPoll(api).divergences).toBe(0)
    expect(openXeroDivergences(api.getState())).toEqual([])
  })
})
