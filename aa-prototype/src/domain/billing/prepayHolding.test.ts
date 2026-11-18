import { describe, expect, it } from 'vitest'
import type { BillingCase, BillingReceipt, Invoice, PrepayTransfer, XeroAccPay } from '../types'
import {
  canPayOutOfHolding,
  heldBookingIds,
  holdingBalance,
  holdingEntries,
  isHeldPayable,
  legIncrement,
  payableLegsFrom,
  transferFor,
  transferReleasedFor,
  type TransferCandidate,
} from './prepayHolding'

const APPROVAL = { mode: 'approved' as const, by: 'Kirsty W.', role: 'office' as const, atISO: '2026-07-21T09:00:00' }

function collect(id: string, bookingId: string, invoiceId: string, received: number): BillingCase {
  return { id, bookingId, invoiceId, prepayLeg: 'collect', status: received > 0 ? 'paid' : 'handedOff', receivedAmount: received, authorisedAmount: received, disbursedAmount: 0 }
}
function invoice(id: string, num: string, payer: string): Pick<Invoice, 'id' | 'invoiceNumber' | 'counterparty'> {
  return { id, invoiceNumber: num, counterparty: { kind: 'patient', id: payer } }
}
function receipt(id: string, caseId: string, gross: number, atISO: string): BillingReceipt {
  return { id, caseId, anaesthetistId: '34821', accRecId: 'XR', grossAmount: gross, gstAmount: 0, atISO, idempotencyKey: id, source: 'webhook' }
}
function transfer(id: string, caseId: string, invoiceId: string, held: number, amount: number, atISO: string): PrepayTransfer {
  return { id, collectCaseId: caseId, invoiceId, bookingId: 'BK1', atISO, amount, heldAmount: held, from: 'aaHoldingAccount', toAnaesthetistId: '34821', released: held, disbursed: 0 }
}
function candidate(over: Partial<TransferCandidate> & { received?: number; total?: number } = {}): TransferCandidate {
  const { received = 1380, total = 1380, ...rest } = over
  return {
    collectCase: { id: 'BC1', prepayLeg: 'collect', receivedAmount: received, invoiceId: 'INV1' },
    invoice: { kind: 'prePayment', total, approval: APPROVAL },
    voided: false,
    bookingCancelled: false,
    alreadyTransferred: false,
    payeeAnaesthetistId: '34821',
    ...rest,
  }
}

describe('isHeldPayable and canPayOutOfHolding', () => {
  it('a payable crediting the AA Holding account is held; one to an anaesthetist is not', () => {
    expect(isHeldPayable({ payeeAccount: 'aaHoldingAccount' })).toBe(true)
    expect(isHeldPayable({})).toBe(false)
  })
  it('only a system transfer or refund pays out of the account', () => {
    expect(canPayOutOfHolding('transfer')).toBe(true)
    expect(canPayOutOfHolding('refund')).toBe(true)
    expect(canPayOutOfHolding('payablesRun')).toBe(false)
    expect(canPayOutOfHolding('manual')).toBe(false)
  })
})

describe('transferFor', () => {
  it('paid in full: the invoice total moves and is released in full', () => {
    expect(transferFor(candidate())).toEqual({ plan: { amount: 1380, heldAmount: 1380, released: 1380, toAnaesthetistId: '34821' } })
  })
  it('part paid: the full amount moves, released only as far as paid', () => {
    expect(transferFor(candidate({ received: 690 }))).toEqual({ plan: { amount: 1380, heldAmount: 690, released: 690, toAnaesthetistId: '34821' } })
  })
  it('unpaid: the full amount moves with nothing released', () => {
    expect(transferFor(candidate({ received: 0 }))).toEqual({ plan: { amount: 1380, heldAmount: 0, released: 0, toAnaesthetistId: '34821' } })
  })
  it('over-received is clamped to the invoice total', () => {
    expect(transferFor(candidate({ received: 1500 }))).toMatchObject({ plan: { heldAmount: 1380, released: 1380 } })
  })
  it('a moved Booking pays whoever did the List (the payee given), never the old anaesthetist', () => {
    expect(transferFor(candidate({ payeeAnaesthetistId: '29044' }))).toMatchObject({ plan: { toAnaesthetistId: '29044' } })
  })
  it('skips a cancelled Booking (41 refunds it), an unsent or voided invoice, one already transferred, a non-collect case and no payee', () => {
    expect(transferFor(candidate({ bookingCancelled: true }))).toEqual({ skip: 'cancelled' })
    expect(transferFor(candidate({ invoice: { kind: 'prePayment', total: 1380 } }))).toEqual({ skip: 'notSent' })
    expect(transferFor(candidate({ voided: true }))).toEqual({ skip: 'voided' })
    expect(transferFor(candidate({ alreadyTransferred: true }))).toEqual({ skip: 'alreadyTransferred' })
    expect(transferFor(candidate({ invoice: { kind: 'standard', total: 1380, approval: APPROVAL } }))).toEqual({ skip: 'notCollect' })
    expect(transferFor(candidate({ payeeAnaesthetistId: undefined }))).toEqual({ skip: 'noPayee' })
  })
  it('money arriving later releases exactly what has been paid, never more', () => {
    expect(transferReleasedFor(690, { amount: 1380 })).toBe(690)
    expect(transferReleasedFor(1380, { amount: 1380 })).toBe(1380)
    expect(transferReleasedFor(2000, { amount: 1380 })).toBe(1380)
  })
})

describe('holdingEntries and holdingBalance', () => {
  const invoices = { INV1: invoice('INV1', 'AA-2026-0001', 'PT1'), INV2: invoice('INV2', 'AA-2026-0002', 'PT2') }

  it('a paid prepayment: one received entry; the balance is what was received', () => {
    const input = { cases: { BC1: collect('BC1', 'BK1', 'INV1', 1380) }, receipts: { R1: receipt('R1', 'BC1', 1380, '2026-07-14T09:00:00') }, transfers: {}, invoices }
    const entries = holdingEntries(input)
    expect(entries).toEqual([{ atISO: '2026-07-14T09:00:00', kind: 'received', amount: 1380, bookingId: 'BK1', invoiceId: 'INV1', invoiceNumber: 'AA-2026-0001', payerKey: 'patient:PT1', receiptId: 'R1' }])
    expect(holdingBalance(entries)).toBe(1380)
    expect(heldBookingIds(entries)).toEqual(['BK1'])
  })

  it('two payers on one Booking: two invoices, two collect payables, the balance the sum of both; each transfer takes its own', () => {
    const cases = { BC1: collect('BC1', 'BK1', 'INV1', 1380), BC2: collect('BC2', 'BK1', 'INV2', 230) }
    const receipts = { R1: receipt('R1', 'BC1', 1380, '2026-07-14T09:00:00'), R2: receipt('R2', 'BC2', 230, '2026-07-15T09:00:00') }
    expect(holdingBalance(holdingEntries({ cases, receipts, transfers: {}, invoices }))).toBe(1610)
    const transfers = { T1: transfer('T1', 'BC1', 'INV1', 1380, 1380, '2026-07-24T17:00:00') }
    expect(holdingBalance(holdingEntries({ cases, receipts, transfers, invoices }))).toBe(230)
    const both = { ...transfers, T2: transfer('T2', 'BC2', 'INV2', 230, 230, '2026-07-24T17:00:00') }
    const entries = holdingEntries({ cases, receipts, transfers: both, invoices })
    expect(holdingBalance(entries)).toBe(0)
    expect(entries.filter((e) => e.kind === 'transferred').map((e) => [e.invoiceNumber, e.amount, e.anaesthetistId])).toEqual([
      ['AA-2026-0001', 1380, '34821'],
      ['AA-2026-0002', 230, '34821'],
    ])
    expect(heldBookingIds(entries)).toEqual([])
  })

  it('money arriving after the transfer never enters the account: the balance does not move', () => {
    const cases = { BC1: collect('BC1', 'BK1', 'INV1', 1380) }
    const receipts = { R1: receipt('R1', 'BC1', 690, '2026-07-14T09:00:00'), R2: receipt('R2', 'BC1', 690, '2026-07-25T09:00:00') }
    const transfers = { T1: transfer('T1', 'BC1', 'INV1', 690, 1380, '2026-07-24T17:00:00') }
    const entries = holdingEntries({ cases, receipts, transfers, invoices })
    expect(entries.map((e) => [e.kind, e.amount])).toEqual([['received', 690], ['transferred', 690]])
    expect(holdingBalance(entries)).toBe(0)
  })

  it('an unpaid prepayment transferred leaves a zero entry and a zero balance; a standard case is never an entry', () => {
    const standard: BillingCase = { ...collect('BC9', 'BK9', 'INV1', 500) }
    delete standard.prepayLeg
    const cases = { BC1: collect('BC1', 'BK1', 'INV1', 0), BC9: standard }
    const transfers = { T1: transfer('T1', 'BC1', 'INV1', 0, 1380, '2026-07-24T17:00:00') }
    const entries = holdingEntries({ cases, receipts: { R9: receipt('R9', 'BC9', 500, '2026-07-10T09:00:00') }, transfers, invoices })
    expect(entries.map((e) => [e.kind, e.amount])).toEqual([['transferred', 0]])
    expect(holdingBalance(entries)).toBe(0)
  })

  it('is never negative', () => {
    expect(holdingBalance([{ atISO: 'x', kind: 'transferred', amount: 5, bookingId: 'B', invoiceId: 'I', invoiceNumber: 'N' }])).toBe(0)
  })
})

describe('payableLegsFrom', () => {
  const pay = (id: string, over: Partial<XeroAccPay> = {}): XeroAccPay => ({
    id, accRecId: 'XR', contactId: 'XC', invoiceNumber: 'N-P', reference: 'BC', issuedAtISO: 'x', anaesthetistId: '34821',
    amountPayable: 100, amountAuthorised: 100, amountDisbursed: 0, status: 'authorised', ...over,
  })
  it("the run sees anaesthetists' payables and transfers, never the AA Holding account's payable", () => {
    const legs = payableLegsFrom(
      { XP1: pay('XP1'), XPB0: pay('XPB0', { payeeAccount: 'aaHoldingAccount', amountPayable: 1380, amountAuthorised: 1380 }) },
      { T1: transfer('T1', 'BC0001', 'INV0001', 1380, 1380, 'x') },
      (caseId) => (caseId === 'BC0001' ? 'XPB0' : undefined),
    )
    expect(legs.map((l) => [l.kind, l.id, l.accPayId, legIncrement(l)])).toEqual([
      ['accPay', 'XP1', 'XP1', 100],
      ['transfer', 'T1', 'XPB0', 1380],
    ])
  })
})
