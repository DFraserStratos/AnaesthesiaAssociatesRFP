import { describe, expect, it } from 'vitest'
import { INS, SEED_MARKERS, ANAE, SEED_PREPAID_BOOKING_ID } from '../../domain/seed'
import {
  DEMO_TRIGGER_ACTOR,
  XERO_PAYABLES_ACTOR,
  XERO_STAFF_ACTOR,
  advanceClockMinutes,
  amendAccRecInXero,
  approvePrepayment,
  prepaymentStatusFor,
  authoriseList,
  cancelBooking,
  createAppStore,
  deliverPaymentWebhook,
  payBillsInXero,
  runReconciliationPoll,
  setXeroOutage,
  stagePairRun,
  voidAccRecInXero,
  wireBillingRun,
} from '../../store'
import type { Actor, AppState, BoundAppStore } from '../../store'
import { xeroInvoicePairViews } from './xeroPairView'
import { projectedListId } from '../../domain/slots'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

/** Stage a one-line approved run for the pair whose bill this is (catch-up Phase 39a: Xero pays only a run's lines). */
function stagedRunFor(api: BoundAppStore, accPayId: string): string {
  const pair = Object.values(api.getState().billing.ledger).find((p) => p.kind !== 'aaFee' && p.payable?.xeroAccPayId === accPayId)!
  const staged = stagePairRun(api, OFFICE, pair.id)
  if (!staged.ok) throw new Error(staged.message)
  return staged.value.runId
}

function stagedS3State(): AppState {
  const api = createAppStore()
  const unwire = wireBillingRun(api)
  const pmListId = projectedListId(ANAE.souter, '2026-07-20', 'PM')
  try {
    expect(api.getState().schedule.lists[pmListId]?.state).toBe('SUBMITTED')
    expect(authoriseList(api, OFFICE, pmListId).ok).toBe(true)
    return api.getState()
  } finally {
    unwire()
  }
}

function nibPair(state: AppState) {
  const bookingId = SEED_MARKERS.feeSplitBooking?.entityId
  const invoice = Object.values(state.billing.invoices).find(
    (candidate) =>
      candidate.bookingId === bookingId &&
      candidate.counterparty.kind === 'insurer' &&
      candidate.counterparty.id === INS.nib,
  )
  if (invoice === undefined) throw new Error('expected the S3 nib invoice')
  const pair = xeroInvoicePairViews(state).find(
    (candidate) => candidate.ledger.billingInvoiceId === invoice.id,
  )
  if (pair === undefined) throw new Error('expected the S3 nib Xero pair')
  return pair
}

describe('Xero invoice-pair view', () => {
  it('joins the S3 nib ACCREC, draft ACCPAY and Billing Engine context without an NHI', () => {
    const state = stagedS3State()
    const pair = nibPair(state)

    expect(pair.ledger.patientName).toBe('Alan Prentice')
    expect(pair.ledger.bookingId).toBe(SEED_MARKERS.feeSplitBooking?.entityId)
    expect(pair.ledger.pairId).toBe(pair.ledger.caseReference)
    expect(pair.accRec.contact?.name).toBe('nib')
    expect(pair.accPay?.contact?.name).toBe('Dr Melanie Souter')
    expect(pair.accPay?.id).toBe(
      (state.billing.ledger[pair.ledger.pairId ?? ''] as { payable?: { xeroAccPayId?: string } } | undefined)?.payable?.xeroAccPayId,
    )
    expect(pair.accPay?.status).toBe('draft')
    expect(pair.accRec.amountDue).toBe(152.38)
    expect(pair.accRec.amountReceived).toBe(0)
    expect(pair.accRec.balance).toBe(152.38)
    // The payable is the gross amount (FT-10.3); no fee fields exist.
    expect(pair.accPay?.totalPayable).toBe(152.38)
    expect(pair.accPay?.amountAuthorised).toBe(0)
    // Identifiers read from the stored Xero records (US-09.1.1).
    expect(pair.accPay?.billNumber).toBe(`${pair.accRec.invoiceNumber}-P`)
    expect(pair.accRec.reference).toBe(pair.ledger.caseReference)
    expect(pair.accPay?.reference).toBe(pair.ledger.caseReference)
    expect(pair.accPay?.amountDisbursed).toBe(0)
    expect(pair.accPay?.remainingAuthorised).toBe(0)
    expect(pair.incomplete).toBe(false)
    expect(JSON.stringify(pair)).not.toContain('ZAC3326')
  })

  it('keeps an incomplete pair inspectable when the ACCPAY and payer contact are missing', () => {
    const state = stagedS3State()
    const original = nibPair(state)
    const contacts = { ...state.xero.contacts }
    const payerContactId = original.accRec.contact?.contactId
    if (payerContactId !== undefined) delete contacts[payerContactId]

    const degraded: AppState = {
      ...state,
      xero: {
        ...state.xero,
        contacts,
        accPays: {},
      },
    }
    const pair = xeroInvoicePairViews(degraded).find(
      (candidate) => candidate.accRec.id === original.accRec.id,
    )

    expect(pair).toBeDefined()
    expect(pair?.incomplete).toBe(true)
    expect(pair?.accRec.contact).toBeUndefined()
    expect(pair?.accPay).toBeUndefined()
    expect(pair?.ledger.patientName).toBe('Alan Prentice')
    expect(pair?.accRec.id).toBe(original.accRec.id)
  })
})

describe('Xero invoice-pair view: the Xero side and the engine side (catch-up Phase 37)', () => {
  function stagedS3Api() {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      expect(authoriseList(api, OFFICE, projectedListId(ANAE.souter, '2026-07-20', 'PM')).ok).toBe(true)
    } finally {
      unwire()
    }
    return api
  }

  it('starts with no bill payment on the ACCPAY', () => {
    const pair = nibPair(stagedS3State())
    expect(pair.accPay?.billPayments).toEqual([])
    expect(pair.accRec.voidedAtISO).toBeUndefined()
    expect(pair.accRec.amendedAtISO).toBeUndefined()
  })

  it('shows a bill payment the engine has not detected, then the poll recording it at its own time', () => {
    const api = stagedS3Api()
    const start = nibPair(api.getState())
    expect(deliverPaymentWebhook(api, { accRecId: start.accRec.id, amount: start.accRec.balance, idempotencyKey: 'TEST-PAY' }).ok).toBe(true)
    const paid = payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId: start.accPay!.id }], { webhook: 'missed', runId: stagedRunFor(api, start.accPay!.id) })
    if (!paid.ok) throw new Error(paid.message)

    const missed = nibPair(api.getState()).accPay!.billPayments
    expect(missed).toHaveLength(1)
    expect(missed[0]).toMatchObject({ id: paid.value.paid[0]!.xeroDisbursementId, amount: 152.38, engine: { state: 'notDetected' } })

    advanceClockMinutes(api, 45)
    expect(runReconciliationPoll(api).disbursements).toBe(1)
    const polled = nibPair(api.getState()).accPay!.billPayments[0]!
    expect(polled.engine).toMatchObject({ state: 'recorded', detectedBy: 'poll' })
    // The poll's own time, read from its audit row, not Xero's payment time.
    const recordedAtISO = polled.engine.state === 'recorded' ? polled.engine.recordedAtISO : undefined
    expect(recordedAtISO).toBeDefined()
    expect(recordedAtISO! > polled.atISO).toBe(true)
  })

  it('shows a delivered bill-paid webhook as recorded by webhook, and a queued one during an outage', () => {
    const api = stagedS3Api()
    const start = nibPair(api.getState())
    expect(deliverPaymentWebhook(api, { accRecId: start.accRec.id, amount: start.accRec.balance, idempotencyKey: 'TEST-PAY' }).ok).toBe(true)
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, true).ok).toBe(true)
    expect(payBillsInXero(api, XERO_PAYABLES_ACTOR, [{ accPayId: start.accPay!.id }], { webhook: 'deliver', runId: stagedRunFor(api, start.accPay!.id) }).ok).toBe(true)
    expect(nibPair(api.getState()).accPay!.billPayments[0]!.engine).toEqual({ state: 'queued' })

    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, false).ok).toBe(true)
    const restored = nibPair(api.getState()).accPay!.billPayments[0]!
    expect(restored.engine).toMatchObject({ state: 'recorded' })
  })

  it('shows a payment landed in Xero during an outage until its sync reaches the engine; a second payment never overpays', () => {
    const api = stagedS3Api()
    const start = nibPair(api.getState())
    expect(start.accRec.landedAwaitingSync).toBeUndefined()
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, true).ok).toBe(true)
    expect(deliverPaymentWebhook(api, { accRecId: start.accRec.id, amount: 50, idempotencyKey: 'TEST-HALF' }).ok).toBe(true)
    expect(nibPair(api.getState()).accRec.landedAwaitingSync).toBe(50)
    // Xero shows $102.38 still owing; a payment above it is refused.
    expect(deliverPaymentWebhook(api, { accRecId: start.accRec.id, amount: start.accRec.balance, idempotencyKey: 'TEST-OVER' })).toMatchObject({ ok: false, code: 'aboveBalance' })
    expect(setXeroOutage(api, DEMO_TRIGGER_ACTOR, false).ok).toBe(true)
    const restored = nibPair(api.getState())
    expect(restored.accRec.landedAwaitingSync).toBeUndefined()
    expect(restored.ledger.received).toBe(50)
  })

  it('passes through when AA staff voided or amended the invoice in Xero', () => {
    const api = stagedS3Api()
    const pair = nibPair(api.getState())
    expect(amendAccRecInXero(api, XERO_STAFF_ACTOR, pair.accRec.id).ok).toBe(true)
    const amended = nibPair(api.getState())
    expect(amended.accRec.amendedAtISO).toBeDefined()
    expect(amended.accRec.amountDue).toBe(132.38)
    expect(amended.accRec.total).toBe(152.38)

    expect(voidAccRecInXero(api, XERO_STAFF_ACTOR, pair.accRec.id).ok).toBe(true)
    const voided = nibPair(api.getState())
    expect(voided.accRec.status).toBe('voided')
    expect(voided.accRec.voidedAtISO).toBeDefined()
  })
})

describe('Xero invoice-pair view: a cancelled prepayment refunded (catch-up Phase 41; US-06.5.2, D53)', () => {
  it("shows the refund paid from the AA trust account against the prepayment's credit note, with its reference and no NHI", () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      expect(cancelBooking(api, OFFICE, SEED_PREPAID_BOOKING_ID, 'Patient withdrew').ok).toBe(true)
    } finally {
      unwire()
    }
    const state = api.getState()
    const note = Object.values(state.billing.creditNotes).find((c) => c.cause === 'prepaymentCancelled')!
    const pair = xeroInvoicePairViews(state).find((p) => p.ledger.billingInvoiceId === note.originalInvoiceId)!
    expect(pair.credit?.creditNoteNumber).toBe(note.creditNoteNumber)
    expect(pair.credit?.refunds).toEqual([expect.objectContaining({ amount: 1380, bankAccount: 'AA trust account', paidAtISO: expect.stringMatching(/^2026-07-21/) })])
    expect(pair.credit!.refunds![0]!.reference).toContain(note.creditNoteNumber)
    const patient = state.masters.patients[state.schedule.bookings[SEED_PREPAID_BOOKING_ID]!.patientId]!
    expect(JSON.stringify(pair.credit)).not.toContain(patient.nhi!)
  })

  it('an unpaid prepayment credited on cancellation has no refund row', () => {
    const api = createAppStore()
    const unwire = wireBillingRun(api)
    try {
      const riley = SEED_MARKERS.prepaymentBooking!.entityId
      const group = prepaymentStatusFor(api.getState(), riley).groups[0]!
      const approve = approvePrepayment(api, OFFICE, riley, group.payerKey)
      if (!approve.ok) throw new Error(approve.message)
      expect(cancelBooking(api, OFFICE, riley, 'Surgery postponed').ok).toBe(true)
      const pair = xeroInvoicePairViews(api.getState()).find((p) => p.ledger.billingInvoiceId === approve.value.invoiceId)!
      expect(pair.credit).toBeDefined()
      expect(pair.credit?.refunds).toBeUndefined()
    } finally {
      unwire()
    }
  })
})

describe('a no-charge invoice in the Xero simulation (catch-up Phase 44 QA)', () => {
  it('reads as complete with no payable leg, flagged noCharge, so the pair page offers no payout', async () => {
    const { SEED_LIST_IDS } = await import('../../domain/seed')
    const { runBillingForList } = await import('../../store/billingRun')
    const { handoffListPairs } = await import('../../store/xeroHandoff')
    const api = createAppStore()
    const listId = SEED_LIST_IDS.multiProcedure
    const bookingId = SEED_MARKERS['noChargeBooking']!.entityId
    expect(authoriseList(api, OFFICE, listId).ok).toBe(true)
    expect(runBillingForList(api, listId).ok).toBe(true)
    handoffListPairs(api, listId)
    const s = api.getState()
    const invoice = Object.values(s.billing.invoices).find((i) => i.bookingId === bookingId && i.noCharge === true)!
    const view = xeroInvoicePairViews(s).find((v) => v.accRec.invoiceId === invoice.id)!
    expect(view).toMatchObject({ noCharge: true, incomplete: false })
    expect(view.accPay).toBeUndefined()
    // Every other procedure pair keeps its payable and is not flagged.
    expect(xeroInvoicePairViews(s).filter((v) => v.kind === 'procedure' && v.noCharge !== true).every((v) => v.accPay !== undefined)).toBe(true)
  })
})
