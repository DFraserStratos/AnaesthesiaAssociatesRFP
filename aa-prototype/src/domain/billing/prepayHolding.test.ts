import { describe, expect, it } from 'vitest'
import type { BookingLedgerPair, Invoice, LedgerPair, LedgerReceipt, LedgerTransfer } from '../types'
import { anaesthetistPayee, applyDisbursement, applyReceipt, dueOn, HOLDING_PAYEE, newBookingPair, newPrepayTransfer } from './ledger'
import {
  canPayOutOfHolding,
  heldBookingIds,
  holdingBalance,
  holdingEntries,
  isHeldPayable,
  transferFor,
  type TransferCandidate,
} from './prepayHolding'

const APPROVAL = { mode: 'approved' as const, by: 'Kirsty W.', role: 'office' as const, atISO: '2026-07-21T09:00:00' }

/** A `prePayment` pair (catch-up Phase 36: the old collect case), its payable to the AA Holding account, with `received` paid in. */
function collect(id: string, bookingId: string, invoiceId: string, received: number, total = 1380): BookingLedgerPair {
  const pair = newBookingPair({
    id,
    kind: 'prePayment',
    invoice: { id: invoiceId, invoiceNumber: `N-${invoiceId}`, counterparty: { kind: 'patient', id: 'PT1' }, total, procedureIds: [] },
    lines: [],
    bookingId,
    listId: 'L1',
    payee: HOLDING_PAYEE,
    patientId: 'PT1',
    atISO: '2026-07-10T09:00:00',
  })
  return received > 0 ? applyReceipt(pair, received, '2026-07-14T09:00:00').pair : pair
}
function invoice(id: string, num: string, payer: string): Pick<Invoice, 'id' | 'invoiceNumber' | 'counterparty'> {
  return { id, invoiceNumber: num, counterparty: { kind: 'patient', id: payer } }
}
function receipt(id: string, pairId: string, gross: number, atISO: string): LedgerReceipt {
  return { id, pairId, pairKind: 'prePayment', accRecId: 'XR', grossAmount: gross, gstAmount: 0, atISO, idempotencyKey: id, source: 'webhook' }
}
function transfer(id: string, pairId: string, invoiceId: string, held: number, amount: number, atISO: string): LedgerTransfer {
  return {
    id,
    kind: 'prepayTransfer',
    collectPairId: pairId,
    invoiceId,
    bookingId: 'BK1',
    listId: 'L1',
    patientId: 'PT1',
    createdAtISO: atISO,
    out: { amount: held },
    in: { number: id, payee: anaesthetistPayee('34821'), amount, releasedAmount: held, disbursedAmount: 0, issuedAtISO: atISO },
  }
}
/** The transfer legs `newPrepayTransfer` writes for the candidate's pair (catch-up Phase 36: `transferFor` now names only the payee). */
function legsFor(c: TransferCandidate): { amount: number; heldAmount: number; released: number; toAnaesthetistId: string | undefined } {
  const made = newPrepayTransfer({ id: 'T1', collectPair: c.collectPair as BookingLedgerPair, listId: 'L1', payeeAnaesthetistId: c.payeeAnaesthetistId!, atISO: '2026-07-24T17:00:00', transfers: {} })
  if (!made.ok) throw new Error(made.code)
  const t = made.transfer
  return { amount: t.in.amount, heldAmount: t.out.amount, released: t.in.releasedAmount, toAnaesthetistId: t.in.payee.kind === 'anaesthetist' ? t.in.payee.anaesthetistId : undefined }
}
function candidate(over: Partial<TransferCandidate> & { received?: number; total?: number } = {}): TransferCandidate {
  const { received = 1380, total = 1380, ...rest } = over
  return {
    collectPair: collect('BC1', 'BK1', 'INV1', received, total),
    invoice: { kind: 'prePayment', approval: APPROVAL },
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
  // (catch-up Phase 36: `transferFor` returns only the payee; the amounts are `newPrepayTransfer`'s legs.)
  it('paid in full: the invoice total moves and is released in full', () => {
    const c = candidate()
    expect(transferFor(c)).toEqual({ to: '34821' })
    expect(legsFor(c)).toEqual({ amount: 1380, heldAmount: 1380, released: 1380, toAnaesthetistId: '34821' })
  })
  it('part paid: the full amount moves, released only as far as paid', () => {
    const c = candidate({ received: 690 })
    expect(transferFor(c)).toEqual({ to: '34821' })
    expect(legsFor(c)).toEqual({ amount: 1380, heldAmount: 690, released: 690, toAnaesthetistId: '34821' })
  })
  it('unpaid: the full amount moves with nothing released', () => {
    const c = candidate({ received: 0 })
    expect(transferFor(c)).toEqual({ to: '34821' })
    expect(legsFor(c)).toEqual({ amount: 1380, heldAmount: 0, released: 0, toAnaesthetistId: '34821' })
  })
  it('over-received is clamped to the invoice total', () => {
    expect(legsFor(candidate({ received: 1500 }))).toMatchObject({ heldAmount: 1380, released: 1380 })
  })
  it('a moved Booking pays whoever did the List (the payee given), never the old anaesthetist', () => {
    const c = candidate({ payeeAnaesthetistId: '29044' })
    expect(transferFor(c)).toEqual({ to: '29044' })
    expect(legsFor(c)).toMatchObject({ toAnaesthetistId: '29044' })
  })
  it('skips a cancelled Booking (41 refunds it), an unsent or voided invoice, one already transferred, a non-collect case and no payee', () => {
    expect(transferFor(candidate({ bookingCancelled: true }))).toEqual({ skip: 'cancelled' })
    expect(transferFor(candidate({ invoice: { kind: 'prePayment' } }))).toEqual({ skip: 'notSent' })
    expect(transferFor(candidate({ voided: true }))).toEqual({ skip: 'voided' })
    expect(transferFor(candidate({ alreadyTransferred: true }))).toEqual({ skip: 'alreadyTransferred' })
    expect(transferFor(candidate({ invoice: { kind: 'standard', approval: APPROVAL } }))).toEqual({ skip: 'notCollect' })
    expect(transferFor(candidate({ payeeAnaesthetistId: undefined }))).toEqual({ skip: 'noPayee' })
  })
  it('money arriving later releases exactly what has been paid, never more', () => {
    // (catch-up Phase 36: `transferReleasedFor` is replaced by the ledger's `applyReceipt` on a transferred prepayment.)
    const unpaid = collect('BC1', 'BK1', 'INV1', 0)
    const made = newPrepayTransfer({ id: 'T1', collectPair: unpaid, listId: 'L1', payeeAnaesthetistId: '34821', atISO: '2026-07-24T17:00:00', transfers: {} })
    if (!made.ok) throw new Error(made.code)
    const first = applyReceipt(unpaid, 690, '2026-07-25T09:00:00', made.transfer)
    expect(first.transfer!.in.releasedAmount).toBe(690)
    const second = applyReceipt(first.pair, 690, '2026-07-26T09:00:00', first.transfer)
    expect(second.transfer!.in.releasedAmount).toBe(1380)
    const over = applyReceipt(unpaid, 2000, '2026-07-25T09:00:00', made.transfer)
    expect(over.transfer!.in.releasedAmount).toBe(1380)
    // The AA Holding account's payable stays at what it held.
    expect(second.pair.payable!.releasedAmount).toBe(0)
  })
})

describe('holdingEntries and holdingBalance', () => {
  const invoices = { INV1: invoice('INV1', 'AA-2026-0001', 'PT1'), INV2: invoice('INV2', 'AA-2026-0002', 'PT2') }

  it('a paid prepayment: one received entry; the balance is what was received', () => {
    const input = { ledger: { BC1: collect('BC1', 'BK1', 'INV1', 1380) }, receipts: { R1: receipt('R1', 'BC1', 1380, '2026-07-14T09:00:00') }, transfers: {}, invoices }
    const entries = holdingEntries(input)
    expect(entries).toEqual([{ atISO: '2026-07-14T09:00:00', kind: 'received', amount: 1380, bookingId: 'BK1', invoiceId: 'INV1', invoiceNumber: 'AA-2026-0001', payerKey: 'patient:PT1', receiptId: 'R1' }])
    expect(holdingBalance(entries)).toBe(1380)
    expect(heldBookingIds(entries)).toEqual(['BK1'])
  })

  it('two payers on one Booking: two invoices, two collect payables, the balance the sum of both; each transfer takes its own', () => {
    const ledger = { BC1: collect('BC1', 'BK1', 'INV1', 1380), BC2: collect('BC2', 'BK1', 'INV2', 230, 230) }
    const receipts = { R1: receipt('R1', 'BC1', 1380, '2026-07-14T09:00:00'), R2: receipt('R2', 'BC2', 230, '2026-07-15T09:00:00') }
    expect(holdingBalance(holdingEntries({ ledger, receipts, transfers: {}, invoices }))).toBe(1610)
    const transfers = { T1: transfer('T1', 'BC1', 'INV1', 1380, 1380, '2026-07-24T17:00:00') }
    expect(holdingBalance(holdingEntries({ ledger, receipts, transfers, invoices }))).toBe(230)
    const both = { ...transfers, T2: transfer('T2', 'BC2', 'INV2', 230, 230, '2026-07-24T17:00:00') }
    const entries = holdingEntries({ ledger, receipts, transfers: both, invoices })
    expect(holdingBalance(entries)).toBe(0)
    expect(entries.filter((e) => e.kind === 'transferred').map((e) => [e.invoiceNumber, e.amount, e.anaesthetistId])).toEqual([
      ['AA-2026-0001', 1380, '34821'],
      ['AA-2026-0002', 230, '34821'],
    ])
    expect(heldBookingIds(entries)).toEqual([])
  })

  it('money arriving after the transfer never enters the account: the balance does not move', () => {
    const ledger = { BC1: collect('BC1', 'BK1', 'INV1', 1380) }
    const receipts = { R1: receipt('R1', 'BC1', 690, '2026-07-14T09:00:00'), R2: receipt('R2', 'BC1', 690, '2026-07-25T09:00:00') }
    const transfers = { T1: transfer('T1', 'BC1', 'INV1', 690, 1380, '2026-07-24T17:00:00') }
    const entries = holdingEntries({ ledger, receipts, transfers, invoices })
    expect(entries.map((e) => [e.kind, e.amount])).toEqual([['received', 690], ['transferred', 690]])
    expect(holdingBalance(entries)).toBe(0)
  })

  it('an unpaid prepayment transferred leaves a zero entry and a zero balance; a standard case is never an entry', () => {
    const held = collect('BC9', 'BK9', 'INV1', 500)
    const standard: LedgerPair = { ...held, kind: 'procedure', anaesthetistId: '34821', payable: { ...held.payable!, payee: anaesthetistPayee('34821') } }
    const ledger = { BC1: collect('BC1', 'BK1', 'INV1', 0), BC9: standard }
    const transfers = { T1: transfer('T1', 'BC1', 'INV1', 0, 1380, '2026-07-24T17:00:00') }
    const entries = holdingEntries({ ledger, receipts: { R9: receipt('R9', 'BC9', 500, '2026-07-10T09:00:00') }, transfers, invoices })
    expect(entries.map((e) => [e.kind, e.amount])).toEqual([['transferred', 0]])
    expect(holdingBalance(entries)).toBe(0)
  })

  it('is never negative', () => {
    expect(holdingBalance([{ atISO: 'x', kind: 'transferred', amount: 5, bookingId: 'B', invoiceId: 'I', invoiceNumber: 'N' }])).toBe(0)
  })
})

describe('the payable legs (catch-up Phase 36: `payableLegsFrom` and `legIncrement` replaced by the ledger legs and `dueOn`)', () => {
  it("the run sees anaesthetists' payables and transfers, never the AA Holding account's payable", () => {
    const procedure = newBookingPair({
      id: 'BC1',
      kind: 'procedure',
      invoice: { id: 'INV1', invoiceNumber: 'N1', counterparty: { kind: 'patient', id: 'PT1' }, total: 100, procedureIds: [] },
      lines: [],
      bookingId: 'BK1',
      listId: 'L1',
      payee: anaesthetistPayee('34821'),
      patientId: 'PT1',
      atISO: 'x',
    })
    const paid = applyReceipt(procedure, 100, 'x').pair
    const held = collect('BC0001', 'BK0001', 'INV0001', 1380)
    const t1 = transfer('T1', 'BC0001', 'INV0001', 1380, 1380, 'x')
    expect([dueOn(paid.payable!), dueOn(t1.in)]).toEqual([100, 1380])
    // The AA Holding account's payable is released but never paid out by the run.
    expect(dueOn(held.payable!)).toBe(1380)
    expect(applyDisbursement(held.payable!, 1380, 'x')).toEqual({ ok: false, code: 'holdingSystemOnly' })
    expect(applyDisbursement(paid.payable!, 100, 'x')).toMatchObject({ ok: true, leg: { disbursedAmount: 100 } })
    expect(applyDisbursement(t1.in, 1380, 'x')).toMatchObject({ ok: true, leg: { disbursedAmount: 1380 } })
  })
})
